package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"net/http"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func UserAPIKeysList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var keys []models.UserApiKey
		db.DB.Where("user_id = ?", user.ID).Find(&keys)
		var resp []gin.H
		for _, k := range keys {
			resp = append(resp, gin.H{
				"id":        k.ID,
				"keyPrefix": k.KeyPrefix + "...",
				"name":      k.Name,
				"createdAt": k.CreatedAt,
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

func UserAPIKeysCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			Name string `json:"name"`
		}
		c.ShouldBindJSON(&body)
		name := body.Name
		if name == "" {
			name = "API Key"
		}
		raw := make([]byte, 24)
		rand.Read(raw)
		keyStr := cfg.PlatformKeyPrefix + hex.EncodeToString(raw)
		hash := sha256.Sum256([]byte(keyStr))
		hexHash := hex.EncodeToString(hash[:])
		prefix := keyStr
		if len(prefix) > 16 {
			prefix = prefix[:16]
		}
		k := models.UserApiKey{
			ID:        models.GenID(),
			UserID:    user.ID,
			KeyHash:   hexHash,
			KeyPrefix: prefix,
			Name:      &name,
		}
		db.DB.Create(&k)
		c.JSON(http.StatusOK, gin.H{
			"id":      k.ID,
			"key":     keyStr,
			"name":    name,
			"warning": "请妥善保存，此 key 仅显示一次",
		})
	}
}

func UserAPIKeysDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var k models.UserApiKey
		if db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&k).Error != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		db.DB.Delete(&k)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
