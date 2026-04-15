package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// AudioTranscribe accepts an audio file upload and returns transcribed text
// using OpenAI-compatible /audio/transcriptions (Whisper) endpoint.
func AudioTranscribe(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		file, header, err := c.Request.FormFile("audio")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing audio file"})
			return
		}
		defer file.Close()

		audioBytes, err := io.ReadAll(file)
		if err != nil || len(audioBytes) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "cannot read audio data"})
			return
		}

		apiKey, baseURL := resolveSTTConfig(cfg)
		if apiKey == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "speech-to-text not configured"})
			return
		}

		lang := c.DefaultPostForm("language", "zh")

		filename := header.Filename
		if filename == "" {
			filename = "audio.webm"
		}

		text, err := callWhisperAPI(apiKey, baseURL, audioBytes, filename, lang)
		if err != nil {
			log.Printf("transcribe: whisper API error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "transcription failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"text": strings.TrimSpace(text)})
	}
}

func resolveSTTConfig(cfg *config.Config) (apiKey string, baseURL string) {
	if cfg.LikelyDashScopeLLM() {
		key := cfg.DashScopeTTSEffectiveKey()
		if key != "" {
			return key, "https://dashscope.aliyuncs.com/compatible-mode/v1"
		}
	}
	if k := strings.TrimSpace(cfg.OpenAIApiKey); k != "" {
		base := strings.TrimSpace(cfg.OpenAIBaseURL)
		if base == "" {
			base = "https://api.openai.com/v1"
		}
		return k, strings.TrimSuffix(base, "/")
	}
	return "", ""
}

type whisperResponse struct {
	Text string `json:"text"`
}

func callWhisperAPI(apiKey, baseURL string, audio []byte, filename, lang string) (string, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("create form file: %w", err)
	}
	if _, err := part.Write(audio); err != nil {
		return "", fmt.Errorf("write audio: %w", err)
	}
	_ = writer.WriteField("model", "whisper-1")
	_ = writer.WriteField("language", lang)
	_ = writer.WriteField("response_format", "json")
	writer.Close()

	url := strings.TrimSuffix(baseURL, "/") + "/audio/transcriptions"
	req, err := http.NewRequest("POST", url, &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("http: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("whisper %d: %s", resp.StatusCode, string(respBody))
	}

	var result whisperResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("decode: %w", err)
	}
	return result.Text, nil
}
