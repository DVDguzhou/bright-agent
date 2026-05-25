package handler

import (
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/cookieutil"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func normalizeAuthEmail(s string) string {
	return strings.ToLower(strings.TrimSpace(s))
}

func Login(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		email := normalizeAuthEmail(body.Email)
		if isPlaceholderAuthEmail(email) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "USE_OTHER_LOGIN"})
			return
		}
		var u models.User
		if err := db.DB.Where("email = ?", email).First(&u).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(body.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS"})
			return
		}
		setSessionCookie(c, cfg, u.ID)
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":        u.ID,
				"email":     u.Email,
				"name":      u.Name,
				"avatarUrl": u.AvatarURL,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}

func Signup(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email     string  `json:"email" binding:"required,email"`
			Password  string  `json:"password" binding:"required,min=6"`
			Name      string  `json:"name" binding:"required,min=2,max=32"`
			AvatarURL *string `json:"avatarUrl"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		email := normalizeAuthEmail(body.Email)
		if isPlaceholderAuthEmail(email) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_EMAIL"})
			return
		}
		var existingUser models.User
		if db.DB.Where("email = ?", email).First(&existingUser).Error == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "EMAIL_EXISTS"})
			return
		}
		cleanName := strings.TrimSpace(body.Name)
		nameExists, err := ensureUniqueUserName(cleanName, "")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		if nameExists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NAME_EXISTS"})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 12)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		u := models.User{
			ID:        models.GenID(),
			Email:     email,
			Password:  string(hash),
			Name:      ptr(cleanName),
			AvatarURL: normalizeOptionalText(body.AvatarURL),
			RoleFlags: nil,
		}
		if err := db.DB.Create(&u).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		setSessionCookie(c, cfg, u.ID)
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":        u.ID,
				"email":     u.Email,
				"name":      u.Name,
				"avatarUrl": u.AvatarURL,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}

func Me(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"phone":     user.Phone,
			"name":      user.Name,
			"avatarUrl": user.AvatarURL,
			"roleFlags": user.RoleFlags,
		})
	}
}

func validateUserAvatarURL(u string) bool {
	s := strings.TrimSpace(u)
	if s == "" {
		return true
	}
	if strings.HasPrefix(s, "data:image/") {
		return len(s) <= 600_000
	}
	if validateLifeAgentCoverImageURL(s) {
		return true
	}
	parsed, err := url.Parse(s)
	if err != nil {
		return false
	}
	if (parsed.Scheme == "https" || parsed.Scheme == "http") && parsed.Host != "" {
		return len(s) <= 512
	}
	return false
}

func syncUserAvatarToLifeAgents(userID string, avatarURL *string) error {
	updates := map[string]interface{}{
		"cover_preset_key": nil,
	}
	if avatarURL == nil || strings.TrimSpace(*avatarURL) == "" {
		updates["cover_image_url"] = nil
	} else {
		updates["cover_image_url"] = strings.TrimSpace(*avatarURL)
	}
	return db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", userID).Updates(updates).Error
}

// UpdateMe 更新当前用户资料；avatarUrl 变更时同步写入其名下所有人生 Agent 的 cover_image_url。
func UpdateMe(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			Name      *string `json:"name"`
			AvatarURL *string `json:"avatarUrl"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		if body.Name == nil && body.AvatarURL == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}

		updates := map[string]interface{}{}
		if body.Name != nil {
			cleanName := strings.TrimSpace(*body.Name)
			if runeLen := len([]rune(cleanName)); runeLen < 2 || runeLen > 32 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			}
			nameExists, err := ensureUniqueUserName(cleanName, user.ID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
			if nameExists {
				c.JSON(http.StatusBadRequest, gin.H{"error": "NAME_EXISTS"})
				return
			}
			updates["name"] = cleanName
		}

		var syncedAvatar *string
		avatarTouched := false
		if body.AvatarURL != nil {
			avatarTouched = true
			s := strings.TrimSpace(*body.AvatarURL)
			if s == "" {
				updates["avatar_url"] = nil
				syncedAvatar = nil
			} else if !validateUserAvatarURL(s) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
				return
			} else {
				updates["avatar_url"] = s
				syncedAvatar = &s
			}
		}

		if len(updates) > 0 {
			if err := db.DB.Model(&models.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
		}
		if avatarTouched {
			if err := syncUserAvatarToLifeAgents(user.ID, syncedAvatar); err != nil {
				log.Printf("update me: sync avatar to life agents user=%s: %v", user.ID, err)
			}
		}

		var u models.User
		if err := db.DB.Where("id = ?", user.ID).First(&u).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":        u.ID,
			"email":     u.Email,
			"phone":     u.Phone,
			"name":      u.Name,
			"avatarUrl": u.AvatarURL,
			"roleFlags": u.RoleFlags,
		})
	}
}

func Logout(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		sec := cookieutil.SessionSecure(c, cfg)
		c.SetCookie(cfg.SessionCookie, "", -1, "/", "", sec, true)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func setSessionCookie(c *gin.Context, cfg *config.Config, userID string) {
	maxAge := 60 * 60 * 24 * 7 // 7 days
	sec := cookieutil.SessionSecure(c, cfg)
	c.SetCookie(cfg.SessionCookie, userID, maxAge, "/", "", sec, true)
}

func ptr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func normalizeOptionalText(s *string) *string {
	if s == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*s)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func ensureUniqueUserName(name string, excludeUserID string) (bool, error) {
	var count int64
	query := db.DB.Model(&models.User{}).Where("name = ?", name)
	if excludeUserID != "" {
		query = query.Where("id <> ?", excludeUserID)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
