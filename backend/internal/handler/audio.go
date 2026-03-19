package handler

import (
	"net/http"
	"path/filepath"
	"strings"

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
	fpath, err := tts.AudioFilePath(filename)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	lf := strings.ToLower(filename)
	switch {
	case strings.HasSuffix(lf, ".wav"):
		c.Header("Content-Type", "audio/wav")
	case strings.HasSuffix(lf, ".mp3"):
		c.Header("Content-Type", "audio/mpeg")
	}
	c.File(fpath)
}
