package handler

import (
	"bytes"
	"encoding/base64"
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

const minTranscribeAudioBytes = 800

// AudioTranscribe accepts an audio file upload and returns transcribed text.
// DashScope (Qwen) deployments use qwen3-asr-flash via chat/completions;
// OpenAI deployments use /audio/transcriptions (Whisper).
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
		if len(audioBytes) < minTranscribeAudioBytes {
			c.JSON(http.StatusBadRequest, gin.H{"error": "recording too short"})
			return
		}

		apiKey, baseURL, useDashScopeASR := resolveSTTConfig(cfg)
		if apiKey == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "speech-to-text not configured"})
			return
		}

		lang := c.DefaultPostForm("language", "zh")

		filename := header.Filename
		if filename == "" {
			filename = "audio.webm"
		}
		contentType := header.Header.Get("Content-Type")
		mime := resolveAudioMime(filename, contentType, audioBytes)

		var text string
		if useDashScopeASR {
			model := strings.TrimSpace(cfg.DashScopeASRModel)
			if model == "" {
				model = "qwen3-asr-flash"
			}
			text, err = callDashScopeASR(apiKey, baseURL, model, audioBytes, mime, lang)
		} else {
			text, err = callWhisperAPI(apiKey, baseURL, audioBytes, filename, lang)
		}
		if err != nil {
			log.Printf("transcribe: API error (dashscope=%v): %v", useDashScopeASR, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "transcription failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"text": strings.TrimSpace(text)})
	}
}

func resolveSTTConfig(cfg *config.Config) (apiKey string, baseURL string, useDashScopeASR bool) {
	if cfg.LikelyDashScopeLLM() {
		key := cfg.DashScopeTTSEffectiveKey()
		if key != "" {
			base := strings.TrimSpace(cfg.OpenAIBaseURL)
			if base == "" {
				base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
			}
			return key, strings.TrimSuffix(base, "/"), true
		}
	}
	if k := strings.TrimSpace(cfg.OpenAIApiKey); k != "" {
		base := strings.TrimSpace(cfg.OpenAIBaseURL)
		if base == "" {
			base = "https://api.openai.com/v1"
		}
		return k, strings.TrimSuffix(base, "/"), false
	}
	return "", "", false
}

func audioMimeFromFilename(name string) string {
	lower := strings.ToLower(name)
	switch {
	case strings.HasSuffix(lower, ".wav"):
		return "audio/wav"
	case strings.HasSuffix(lower, ".mp3"), strings.HasSuffix(lower, ".mpeg"):
		return "audio/mpeg"
	case strings.HasSuffix(lower, ".mp4"), strings.HasSuffix(lower, ".m4a"), strings.HasSuffix(lower, ".aac"):
		return "audio/mp4"
	case strings.HasSuffix(lower, ".ogg"):
		return "audio/ogg"
	default:
		return "audio/webm"
	}
}

func audioMimeFromMagic(data []byte) string {
	if len(data) < 12 {
		return ""
	}
	if string(data[4:8]) == "ftyp" {
		return "audio/mp4"
	}
	if string(data[0:4]) == "RIFF" && string(data[8:12]) == "WAVE" {
		return "audio/wav"
	}
	if string(data[0:3]) == "ID3" || (data[0] == 0xFF && (data[1]&0xE0) == 0xE0) {
		return "audio/mpeg"
	}
	if data[0] == 0x1A && data[1] == 0x45 && data[2] == 0xDF && data[3] == 0xA3 {
		return "audio/webm"
	}
	if string(data[0:4]) == "OggS" {
		return "audio/ogg"
	}
	return ""
}

func resolveAudioMime(filename, contentType string, data []byte) string {
	if ct := strings.TrimSpace(strings.Split(contentType, ";")[0]); ct != "" && ct != "application/octet-stream" {
		return ct
	}
	if mime := audioMimeFromMagic(data); mime != "" {
		return mime
	}
	return audioMimeFromFilename(filename)
}

type whisperResponse struct {
	Text string `json:"text"`
}

type dashScopeASRResponse struct {
	Choices []struct {
		Message struct {
			Content json.RawMessage `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Code    string `json:"code"`
	} `json:"error"`
}

func extractDashScopeASRContent(raw json.RawMessage) string {
	if len(raw) == 0 || string(raw) == "null" {
		return ""
	}
	var text string
	if err := json.Unmarshal(raw, &text); err == nil {
		return strings.TrimSpace(text)
	}
	var parts []struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(raw, &parts); err == nil {
		var b strings.Builder
		for _, p := range parts {
			b.WriteString(p.Text)
		}
		return strings.TrimSpace(b.String())
	}
	return strings.TrimSpace(string(raw))
}

func callDashScopeASR(apiKey, baseURL, model string, audio []byte, mime, lang string) (string, error) {
	if strings.TrimSpace(model) == "" {
		model = "qwen3-asr-flash"
	}
	mime = strings.TrimSpace(mime)
	if mime == "" {
		mime = "audio/webm"
	}
	dataURI := fmt.Sprintf("data:%s;base64,%s", mime, base64.StdEncoding.EncodeToString(audio))

	asrOptions := map[string]interface{}{
		"enable_itn": false,
	}
	if lang != "" {
		asrOptions["language"] = lang
	}

	payload := map[string]interface{}{
		"model": model,
		"messages": []map[string]interface{}{
			{
				"role": "user",
				"content": []map[string]interface{}{
					{
						"type": "input_audio",
						"input_audio": map[string]string{
							"data": dataURI,
						},
					},
				},
			},
		},
		"stream":      false,
		"asr_options": asrOptions,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal: %w", err)
	}

	url := strings.TrimSuffix(baseURL, "/") + "/chat/completions"
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("http: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("dashscope asr %d: %s", resp.StatusCode, string(respBody))
	}

	var result dashScopeASRResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", fmt.Errorf("decode: %w", err)
	}
	if result.Error != nil && result.Error.Message != "" {
		return "", fmt.Errorf("dashscope asr error: %s", result.Error.Message)
	}
	if len(result.Choices) == 0 {
		return "", fmt.Errorf("dashscope asr: empty choices")
	}
	text := extractDashScopeASRContent(result.Choices[0].Message.Content)
	if text == "" {
		log.Printf("transcribe: dashscope asr empty text (mime=%s bytes=%d body=%s)", mime, len(audio), string(respBody))
	}
	return text, nil
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
