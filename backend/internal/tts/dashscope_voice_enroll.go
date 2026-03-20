package tts

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
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
// 百炼仅支持 WAV/MP3/M4A，浏览器录的 WebM 会先尝试用 ffmpeg 转为 WAV
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
	audio := p.Audio
	mime := strings.TrimSpace(p.MIME)
	if mime == "" {
		mime = "application/octet-stream"
	}
	// 百炼仅支持 WAV/MP3/M4A，WebM 需转换
	if strings.Contains(strings.ToLower(mime), "webm") {
		if wav, err := convertWebMToWAV(audio); err == nil {
			audio = wav
			mime = "audio/wav"
		} else {
			log.Printf("dashscope enroll: webm->wav conversion failed (%v), will try webm anyway", err)
		}
	}
	b64 := base64.StdEncoding.EncodeToString(audio)
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
		log.Printf("dashscope enroll: http %d body=%s", resp.StatusCode, truncate(string(raw), 500))
		return "", fmt.Errorf("dashscope enroll http %d: %s", resp.StatusCode, string(raw))
	}

	var parsed enrollResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("dashscope enroll: invalid JSON: %w", err)
	}
	if parsed.StatusCode != 0 && parsed.StatusCode != http.StatusOK {
		log.Printf("dashscope enroll: status_code=%d code=%s message=%s", parsed.StatusCode, parsed.Code, parsed.Message)
		return "", fmt.Errorf("dashscope enroll status %d: %s", parsed.StatusCode, parsed.Message)
	}
	if c := strings.TrimSpace(parsed.Code); c != "" {
		log.Printf("dashscope enroll: code=%s message=%s", c, parsed.Message)
		return "", fmt.Errorf("dashscope enroll code=%s: %s", c, strings.TrimSpace(parsed.Message))
	}
	if parsed.Output == nil || strings.TrimSpace(parsed.Output.Voice) == "" {
		log.Printf("dashscope enroll: no voice in response body=%s", truncate(string(raw), 300))
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

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

// convertWebMToWAV 用 ffmpeg 将 WebM 转为 16bit 单声道 WAV（百炼要求）
func convertWebMToWAV(webm []byte) ([]byte, error) {
	tmpDir := os.TempDir()
	inPath := filepath.Join(tmpDir, "enroll_in.webm")
	outPath := filepath.Join(tmpDir, "enroll_out.wav")
	if err := os.WriteFile(inPath, webm, 0600); err != nil {
		return nil, err
	}
	defer os.Remove(inPath)
	defer os.Remove(outPath)

	cmd := exec.Command("ffmpeg", "-y", "-i", inPath, "-acodec", "pcm_s16le", "-ac", "1", "-ar", "24000", outPath)
	cmd.Stdout = nil
	cmd.Stderr = nil
	if err := cmd.Run(); err != nil {
		return nil, err
	}
	return os.ReadFile(outPath)
}

var preferredNameSanitizer = regexp.MustCompile(`[^a-z0-9_]+`)

// SanitizePreferredVoiceName 百炼 preferred_name 约束：仅字母数字下划线，不超过 16 字符
func SanitizePreferredVoiceName(profileID, displayName string) string {
	d := preferredNameSanitizer.ReplaceAllString(strings.ToLower(strings.TrimSpace(displayName)), "")
	if len(d) > 8 {
		d = d[:8]
	}
	base := strings.ReplaceAll(strings.ToLower(profileID), "-", "_")
	if len(base) > 8 {
		base = base[:8]
	}
	if base == "" {
		base = "vc"
	}
	out := base
	if d != "" {
		out = d + "_" + base
	}
	if len(out) > 16 {
		out = out[:16]
	}
	if out == "" {
		out = "vc"
	}
	return out
}
