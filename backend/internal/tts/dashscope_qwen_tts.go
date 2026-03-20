package tts

import (
	"bytes"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"
)

// DashScopeQwenTTSProvider 阿里云百炼 Qwen-TTS（与通义 LLM 同域、同 API Key）
// 文档：https://help.aliyun.com/zh/model-studio/qwen-tts-api
type DashScopeQwenTTSProvider struct {
	APIKey       string
	Endpoint     string // 完整 multimodal-generation URL
	Model        string // 默认 qwen3-tts-flash
	VCModel      string // 声音复刻合成模型，须与注册时 target_model 一致
	Voice        string // 默认 Cherry
	LanguageType string // 默认 Chinese
}

func (p *DashScopeQwenTTSProvider) CreateVoice(profileID string, audioBase64 string) (string, error) {
	return "", nil
}

type dashScopeTTSRequest struct {
	Model string `json:"model"`
	Input struct {
		Text         string `json:"text"`
		Voice        string `json:"voice"`
		LanguageType string `json:"language_type,omitempty"`
	} `json:"input"`
}

type dashScopeTTSResponse struct {
	StatusCode int    `json:"status_code"`
	Code       string `json:"code"`
	Message    string `json:"message"`
	Output     *struct {
		Audio *struct {
			Data string `json:"data"`
			URL  string `json:"url"`
		} `json:"audio"`
	} `json:"output"`
}

func (p *DashScopeQwenTTSProvider) Synthesize(voiceID string, text string) (string, int, error) {
	if strings.TrimSpace(p.APIKey) == "" {
		return "", 0, fmt.Errorf("dashscope TTS: API key empty")
	}
	text = truncateRunes(strings.TrimSpace(text), 480)
	if text == "" {
		return "", 0, fmt.Errorf("dashscope TTS: empty text")
	}

	model := strings.TrimSpace(p.Model)
	if model == "" {
		model = "qwen3-tts-flash"
	}
	voice := strings.TrimSpace(p.Voice)
	if voice == "" {
		voice = "Cherry"
	}
	if strings.TrimSpace(voiceID) != "" {
		voice = strings.TrimSpace(voiceID)
	}
	vcModel := strings.TrimSpace(p.VCModel)
	if vcModel == "" {
		vcModel = "qwen3-tts-vc-2026-01-22"
	}
	if voice != "" && !IsDashScopeFlashPresetVoice(voice) {
		model = vcModel
	}
	lang := strings.TrimSpace(p.LanguageType)
	if lang == "" {
		lang = "Chinese"
	}
	endpoint := strings.TrimSpace(p.Endpoint)
	if endpoint == "" {
		endpoint = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation"
	}

	var reqBody dashScopeTTSRequest
	reqBody.Model = model
	reqBody.Input.Text = text
	reqBody.Input.Voice = voice
	reqBody.Input.LanguageType = lang
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", 0, err
	}

	req, err := http.NewRequest(http.MethodPost, endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", 0, err
	}
	req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(p.APIKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", 0, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", 0, err
	}
	if resp.StatusCode != http.StatusOK {
		return "", 0, fmt.Errorf("dashscope TTS http %d: %s", resp.StatusCode, string(raw))
	}

	var parsed dashScopeTTSResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", 0, fmt.Errorf("dashscope TTS: invalid JSON: %w", err)
	}
	// 百炼成功 JSON 往往不带顶层 status_code，缺省反序列化为 0，不能当作失败
	if parsed.StatusCode != 0 && parsed.StatusCode != http.StatusOK {
		msg := parsed.Message
		if msg == "" {
			msg = string(raw)
		}
		return "", 0, fmt.Errorf("dashscope TTS status %d: %s", parsed.StatusCode, msg)
	}
	if c := strings.TrimSpace(parsed.Code); c != "" {
		return "", 0, fmt.Errorf("dashscope TTS code=%s: %s", c, strings.TrimSpace(parsed.Message))
	}
	if parsed.Output == nil || parsed.Output.Audio == nil {
		return "", 0, fmt.Errorf("dashscope TTS: no audio in response")
	}

	var pcm []byte
	switch {
	case parsed.Output.Audio.URL != "":
		audioResp, err := client.Get(parsed.Output.Audio.URL)
		if err != nil {
			return "", 0, fmt.Errorf("dashscope TTS: fetch audio url: %w", err)
		}
		defer audioResp.Body.Close()
		if audioResp.StatusCode != http.StatusOK {
			b, _ := io.ReadAll(audioResp.Body)
			return "", 0, fmt.Errorf("dashscope TTS: download %d: %s", audioResp.StatusCode, string(b))
		}
		pcm, err = io.ReadAll(audioResp.Body)
		if err != nil {
			return "", 0, err
		}
	case parsed.Output.Audio.Data != "":
		pcm, err = base64.StdEncoding.DecodeString(parsed.Output.Audio.Data)
		if err != nil {
			return "", 0, fmt.Errorf("dashscope TTS: decode base64: %w", err)
		}
	default:
		return "", 0, fmt.Errorf("dashscope TTS: empty audio url and data")
	}

	dur := estimateWAVDurationSec(pcm)
	b64 := base64.StdEncoding.EncodeToString(pcm)
	return b64, dur, nil
}

func (p *DashScopeQwenTTSProvider) MediaFormat() string { return "wav" }

func truncateRunes(s string, maxRunes int) string {
	if maxRunes <= 0 {
		return ""
	}
	if utf8.RuneCountInString(s) <= maxRunes {
		return s
	}
	r := []rune(s)
	return string(r[:maxRunes])
}

// estimateWAVDurationSec 根据 WAV 头或字节量粗算时长（秒）
func estimateWAVDurationSec(data []byte) int {
	if len(data) < 12 || string(data[0:4]) != "RIFF" || string(data[8:12]) != "WAVE" {
		sec := len(data) / 32000
		if sec < 1 {
			return 1
		}
		return sec
	}
	var sampleRate uint32 = 16000
	var bits uint16 = 16
	var channels uint16 = 1
	off := 12
	for off+8 <= len(data) {
		chunkID := string(data[off : off+4])
		chunkSize := int(binary.LittleEndian.Uint32(data[off+4 : off+8]))
		off += 8
		next := off + chunkSize
		if next > len(data) {
			break
		}
		switch chunkID {
		case "fmt ":
			if chunkSize >= 16 {
				channels = binary.LittleEndian.Uint16(data[off+2 : off+4])
				sampleRate = binary.LittleEndian.Uint32(data[off+4 : off+8])
				bits = binary.LittleEndian.Uint16(data[off+14 : off+16])
			}
		case "data":
			bytesPerSec := int(sampleRate) * int(channels) * int(bits) / 8
			if bytesPerSec <= 0 {
				bytesPerSec = 32000
			}
			sec := chunkSize / bytesPerSec
			if sec < 1 {
				return 1
			}
			return sec
		}
		off = next
		if chunkSize%2 == 1 {
			off++
		}
	}
	sec := len(data) / 32000
	if sec < 1 {
		return 1
	}
	return sec
}
