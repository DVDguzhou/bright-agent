package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type SessionUser struct {
	ID        string
	Email     string
	Name      *string
	AvatarURL *string
	RoleFlags map[string]interface{}
}

func Auth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := getSessionUser(c, cfg)
		if user != nil {
			c.Set("user", user)
		}
		c.Next()
	}
}

func RequireAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := getSessionUser(c, cfg)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			c.Abort()
			return
		}
		c.Set("user", user)
		c.Next()
	}
}

func getSessionUser(c *gin.Context, cfg *config.Config) *SessionUser {
	sid, _ := c.Cookie(cfg.SessionCookie)
	if sid != "" {
		var u models.User
		if err := db.DB.Where("id = ?", sid).First(&u).Error; err == nil {
			var rf map[string]interface{}
			if u.RoleFlags != nil {
				rf = u.RoleFlags
			}
			return &SessionUser{
				ID:        u.ID,
				Email:     u.Email,
				Name:      u.Name,
				AvatarURL: u.AvatarURL,
				RoleFlags: rf,
			}
		}
		// 会话中的 user ID 在数据库中不存在（如切换 DB 后），清除无效 cookie
		c.SetCookie(cfg.SessionCookie, "", -1, "/", "", false, true)
	}
	auth := c.GetHeader("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		return nil
	}
	token := strings.TrimPrefix(auth, "Bearer ")
	if !strings.HasPrefix(token, cfg.PlatformKeyPrefix) {
		return nil
	}
	hash := sha256.Sum256([]byte(token))
	hexHash := hex.EncodeToString(hash[:])
	var key models.UserApiKey
	if err := db.DB.Where("key_hash = ?", hexHash).First(&key).Error; err != nil {
		return nil
	}
	var u models.User
	if err := db.DB.Where("id = ?", key.UserID).First(&u).Error; err != nil {
		return nil
	}
	var rf map[string]interface{}
	if u.RoleFlags != nil {
		rf = u.RoleFlags
	}
	return &SessionUser{
		ID:        u.ID,
		Email:     u.Email,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
		RoleFlags: rf,
	}
}

func MustGetUser(c *gin.Context) *SessionUser {
	u, _ := c.Get("user")
	if u == nil {
		return nil
	}
	return u.(*SessionUser)
}
