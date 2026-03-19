package tts

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// OpenAIProvider 使用 OpenAI TTS API（不支持音色克隆，使用默认音色）
type OpenAIProvider struct {
	APIKey  string
	BaseURL string // 可选，如 https://api.openai.com/v1
	Model   string // tts-1 或 tts-1-hd
	Voice   string // alloy, echo, fable, onyx, nova, shimmer
}

func (p *OpenAIProvider) CreateVoice(profileID string, audioBase64 string) (string, error) {
	// OpenAI TTS 不支持自定义音色克隆，返回空表示使用默认
	return "", nil
}

func (p *OpenAIProvider) Synthesize(voiceID string, text string) (string, int, error) {
	if p.APIKey == "" {
		return "", 0, fmt.Errorf("OPENAI_API_KEY not configured")
	}
	voice := p.Voice
	if voice == "" {
		voice = "nova"
	}
	model := p.Model
	if model == "" {
		model = "tts-1"
	}
	baseURL := p.BaseURL
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	reqBody := map[string]string{
		"model":          model,
		"input":          text,
		"voice":          voice,
		"response_format": "mp3",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", baseURL+"/audio/speech", bytes.NewReader(bodyBytes))
	if err != nil {
		return "", 0, err
	}
	req.Header.Set("Authorization", "Bearer "+p.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(resp.Body)
		return "", 0, fmt.Errorf("openai tts error %d: %s", resp.StatusCode, string(b))
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", 0, err
	}

	// 粗略估算时长：mp3 约 1KB/s，16000 采样率
	durationSec := len(data) / 16000
	if durationSec < 1 {
		durationSec = 1
	}

	return base64.StdEncoding.EncodeToString(data), durationSec, nil
}

func (p *OpenAIProvider) MediaFormat() string { return "mp3" }
