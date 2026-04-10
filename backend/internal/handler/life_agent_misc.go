package handler

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

const (
	lifeAgentFavoriteMaxImport = 200
	lifeAgentCoverMaxBytes     = 2 * 1024 * 1024
)

var lifeAgentCoverContentTypes = map[string]string{
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
}

func lifeAgentCoverStorageDir() string {
	if custom := strings.TrimSpace(os.Getenv("LIFE_AGENT_COVER_DIR")); custom != "" {
		return custom
	}
	return filepath.Join(".", "uploads", "life-agent-covers")
}

func newUploadFilename(ext string) string {
	var b [16]byte
	if _, err := rand.Read(b[:]); err != nil {
		return models.GenID() + ext
	}
	return hex.EncodeToString(b[:]) + ext
}

func LifeAgentFavoritesList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		var rows []models.LifeAgentFavorite
		if err := db.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&rows).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		ids := make([]string, 0, len(rows))
		for _, row := range rows {
			if strings.TrimSpace(row.ProfileID) != "" {
				ids = append(ids, row.ProfileID)
			}
		}
		c.JSON(http.StatusOK, gin.H{"ids": ids})
	}
}

func LifeAgentFavoritesToggle(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		var body struct {
			ProfileID string `json:"profileId"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_BODY"})
			return
		}
		profileID := strings.TrimSpace(body.ProfileID)
		if profileID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_BODY"})
			return
		}

		var profile models.LifeAgentProfile
		if err := db.DB.Select("id").Where("id = ?", profileID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		var existing models.LifeAgentFavorite
		if err := db.DB.Where("user_id = ? AND profile_id = ?", user.ID, profileID).First(&existing).Error; err == nil {
			if err := db.DB.Delete(&existing).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"favorited": false})
			return
		}

		favorite := models.LifeAgentFavorite{
			ID:        models.GenID(),
			UserID:    user.ID,
			ProfileID: profileID,
			CreatedAt: time.Now(),
		}
		if err := db.DB.Create(&favorite).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"favorited": true})
	}
}

func LifeAgentFavoritesImport(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		var body struct {
			ProfileIDs []string `json:"profileIds"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_BODY"})
			return
		}

		seen := map[string]struct{}{}
		profileIDs := make([]string, 0, min(len(body.ProfileIDs), lifeAgentFavoriteMaxImport))
		for _, raw := range body.ProfileIDs {
			id := strings.TrimSpace(raw)
			if id == "" {
				continue
			}
			if _, ok := seen[id]; ok {
				continue
			}
			seen[id] = struct{}{}
			profileIDs = append(profileIDs, id)
			if len(profileIDs) >= lifeAgentFavoriteMaxImport {
				break
			}
		}
		if len(profileIDs) == 0 {
			c.JSON(http.StatusOK, gin.H{"imported": 0})
			return
		}

		var profiles []models.LifeAgentProfile
		if err := db.DB.Select("id").Where("id IN ?", profileIDs).Find(&profiles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		valid := make(map[string]struct{}, len(profiles))
		for _, p := range profiles {
			valid[p.ID] = struct{}{}
		}

		imported := 0
		for _, profileID := range profileIDs {
			if _, ok := valid[profileID]; !ok {
				continue
			}
			favorite := models.LifeAgentFavorite{
				ID:        models.GenID(),
				UserID:    user.ID,
				ProfileID: profileID,
				CreatedAt: time.Now(),
			}
			if err := db.DB.Where("user_id = ? AND profile_id = ?", user.ID, profileID).FirstOrCreate(&favorite).Error; err == nil {
				imported++
			}
		}

		c.JSON(http.StatusOK, gin.H{"imported": imported})
	}
}

func LifeAgentCoverUpload(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "NO_FILE"})
			return
		}
		defer file.Close()

		if header.Size > lifeAgentCoverMaxBytes {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_TOO_LARGE"})
			return
		}

		ext := strings.ToLower(filepath.Ext(header.Filename))
		contentType, ok := lifeAgentCoverContentTypes[ext]
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "UNSUPPORTED_TYPE"})
			return
		}

		content, err := io.ReadAll(io.LimitReader(file, lifeAgentCoverMaxBytes+1))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_READ_ERROR"})
			return
		}
		if len(content) > lifeAgentCoverMaxBytes {
			c.JSON(http.StatusBadRequest, gin.H{"error": "FILE_TOO_LARGE"})
			return
		}

		dir := lifeAgentCoverStorageDir()
		if err := os.MkdirAll(dir, 0o755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "UPLOAD_STORE_ERROR"})
			return
		}

		name := newUploadFilename(ext)
		fullPath := filepath.Join(dir, name)
		if err := os.WriteFile(fullPath, content, 0o644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "UPLOAD_STORE_ERROR"})
			return
		}

		c.Header("Content-Type", "application/json")
		c.JSON(http.StatusOK, gin.H{"url": "/api/upload/life-agent-cover/" + name, "contentType": contentType})
	}
}

func LifeAgentCoverGet(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawName := strings.TrimSpace(c.Param("name"))
		if rawName == "" || strings.Contains(rawName, "/") || strings.Contains(rawName, "\\") || strings.Contains(rawName, "..") {
			c.String(http.StatusNotFound, "Not Found")
			return
		}

		ext := strings.ToLower(filepath.Ext(rawName))
		contentType, ok := lifeAgentCoverContentTypes[ext]
		if !ok {
			c.String(http.StatusNotFound, "Not Found")
			return
		}

		fullPath := filepath.Join(lifeAgentCoverStorageDir(), rawName)
		content, err := os.ReadFile(fullPath)
		if err != nil {
			c.String(http.StatusNotFound, "Not Found")
			return
		}

		c.Header("Cache-Control", "public, max-age=31536000, immutable")
		c.Data(http.StatusOK, contentType, content)
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
