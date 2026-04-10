package handler

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/tts"
	"github.com/gin-gonic/gin"
)

// ServeAudio 提供 TTS 生成的音频文件
func ServeAudio(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" || filepath.Base(filename) != filename {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid filename"})
		return
	}
	messageID := strings.TrimSuffix(filename, filepath.Ext(filename))
	if messageID != "" {
		var msg models.LifeAgentChatMessage
		if err := db.DB.Select("id", "audio_format", "audio_data").Where("id = ?", messageID).First(&msg).Error; err == nil && len(msg.AudioData) > 0 {
			format := strings.TrimSpace(ptrStr(msg.AudioFormat))
			if format == "" {
				format = strings.TrimPrefix(strings.ToLower(filepath.Ext(filename)), ".")
			}
			contentType := audioContentType(format)
			c.Header("Content-Type", contentType)
			c.Header("Cache-Control", "private, max-age=31536000, immutable")
			c.Data(http.StatusOK, contentType, msg.AudioData)
			return
		}
	}
	fpath, err := tts.AudioFilePath(filename)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	c.Header("Content-Type", audioContentType(strings.TrimPrefix(strings.ToLower(filepath.Ext(filename)), ".")))
	c.File(fpath)
}

func audioContentType(format string) string {
	switch strings.ToLower(strings.TrimSpace(format)) {
	case "wav":
		return "audio/wav"
	case "mp3":
		return "audio/mpeg"
	case "webm":
		return "audio/webm"
	default:
		return "application/octet-stream"
	}
}
