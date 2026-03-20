package handler

import (
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

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
		var u models.User
		if err := db.DB.Where("email = ?", body.Email).First(&u).Error; err != nil {
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
		var existingUser models.User
		if db.DB.Where("email = ?", body.Email).First(&existingUser).Error == nil {
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
			Email:     body.Email,
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

func Logout(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.SetCookie(cfg.SessionCookie, "", -1, "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func setSessionCookie(c *gin.Context, cfg *config.Config, userID string) {
	maxAge := 60 * 60 * 24 * 7 // 7 days
	c.SetCookie(cfg.SessionCookie, userID, maxAge, "/", "", false, true)
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
