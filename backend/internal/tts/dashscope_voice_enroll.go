package tts

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// DashScopeEnrollParams 百炼「创建音色」请求参数
// 文档：https://help.aliyun.com/zh/model-studio/qwen-tts-voice-cloning
type DashScopeEnrollParams struct {
	APIKey        string
	URL           string // 默认 customization 端点
	TargetModel   string // 须与合成时 VC 模型一致，如 qwen3-tts-vc-2026-01-22
	PreferredName string // 仅字母数字下划线，见 SanitizePreferredVoiceName
	Audio         []byte
	MIME          string // 如 audio/webm、audio/mpeg
}

type enrollRequest struct {
	Model string `json:"model"`
	Input struct {
		Action        string `json:"action"`
		TargetModel   string `json:"target_model"`
		PreferredName string `json:"preferred_name"`
		Audio         struct {
			Data string `json:"data"` // data:mime;base64,...
		} `json:"audio"`
	} `json:"input"`
}

type enrollResponse struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	StatusCode int    `json:"status_code"`
	Output     *struct {
		Voice string `json:"voice"`
	} `json:"output"`
}

// EnrollDashScopeVoice 上传样本并返回可在 qwen3-tts-vc 中使用的 voice id
func EnrollDashScopeVoice(p DashScopeEnrollParams) (string, error) {
	key := strings.TrimSpace(p.APIKey)
	if key == "" {
		return "", fmt.Errorf("dashscope enroll: empty API key")
	}
	if len(p.Audio) < 200 {
		return "", fmt.Errorf("dashscope enroll: audio too short")
	}
	tm := strings.TrimSpace(p.TargetModel)
	if tm == "" {
		tm = "qwen3-tts-vc-2026-01-22"
	}
	url := strings.TrimSpace(p.URL)
	if url == "" {
		url = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization"
	}
	mime := strings.TrimSpace(p.MIME)
	if mime == "" {
		mime = "application/octet-stream"
	}
	b64 := base64.StdEncoding.EncodeToString(p.Audio)
	dataURI := "data:" + mime + ";base64," + b64

	var reqBody enrollRequest
	reqBody.Model = "qwen-voice-enrollment"
	reqBody.Input.Action = "create"
	reqBody.Input.TargetModel = tm
	reqBody.Input.PreferredName = p.PreferredName
	reqBody.Input.Audio.Data = dataURI

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+key)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 180 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("dashscope enroll http %d: %s", resp.StatusCode, string(raw))
	}

	var parsed enrollResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("dashscope enroll: invalid JSON: %w", err)
	}
	if parsed.StatusCode != 0 && parsed.StatusCode != http.StatusOK {
		return "", fmt.Errorf("dashscope enroll status %d: %s", parsed.StatusCode, parsed.Message)
	}
	if c := strings.TrimSpace(parsed.Code); c != "" {
		return "", fmt.Errorf("dashscope enroll code=%s: %s", c, strings.TrimSpace(parsed.Message))
	}
	if parsed.Output == nil || strings.TrimSpace(parsed.Output.Voice) == "" {
		return "", fmt.Errorf("dashscope enroll: no voice in response: %s", string(raw))
	}
	return strings.TrimSpace(parsed.Output.Voice), nil
}

// DecodeBase64AudioPayload 解码前端传来的纯 base64 或 data URL
func DecodeBase64AudioPayload(s string) ([]byte, string, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, "", fmt.Errorf("empty payload")
	}
	if strings.HasPrefix(s, "data:") {
		sep := ";base64,"
		idx := strings.Index(s, sep)
		if idx < 0 {
			return nil, "", fmt.Errorf("data URI missing ;base64,")
		}
		mime := strings.TrimSpace(s[5:idx])
		b64 := strings.TrimSpace(s[idx+len(sep):])
		raw, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			return nil, "", err
		}
		if mime == "" {
			mime = "audio/webm"
		}
		return raw, mime, nil
	}
	raw, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		return nil, "", err
	}
	return raw, "audio/webm", nil
}

var preferredNameSanitizer = regexp.MustCompile(`[^a-z0-9_]+`)

// SanitizePreferredVoiceName 百炼 preferred_name 约束：字母数字下划线，长度适中
func SanitizePreferredVoiceName(profileID, displayName string) string {
	base := strings.ReplaceAll(strings.ToLower(profileID), "-", "_")
	if len(base) > 24 {
		base = base[:24]
	}
	if base == "" {
		base = "vc"
	}
	// 可加 displayName 前缀但需极短
	d := preferredNameSanitizer.ReplaceAllString(strings.ToLower(strings.TrimSpace(displayName)), "")
	if len(d) > 8 {
		d = d[:8]
	}
	if d != "" {
		base = d + "_" + base
	}
	if len(base) > 32 {
		base = base[:32]
	}
	return base
}
