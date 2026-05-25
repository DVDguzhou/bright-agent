package handler

import (
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestExtractDashScopeASRContent_string(t *testing.T) {
	raw := json.RawMessage(`"你好世界"`)
	got := extractDashScopeASRContent(raw)
	if got != "你好世界" {
		t.Fatalf("got %q", got)
	}
}

func TestExtractDashScopeASRContent_array(t *testing.T) {
	raw := json.RawMessage(`[{"text":"你好"},{"text":"世界"}]`)
	got := extractDashScopeASRContent(raw)
	if got != "你好世界" {
		t.Fatalf("got %q", got)
	}
}

func TestResolveAudioMime_prefersMagicOverFilename(t *testing.T) {
	mp4Header := append([]byte{0, 0, 0, 0}, []byte("ftypisom")...)
	got := resolveAudioMime("voice.webm", "application/octet-stream", mp4Header)
	if got != "audio/mp4" {
		t.Fatalf("got %q want audio/mp4", got)
	}
}

func TestPrepareAudioForDashScopeASR_mp3Passthrough(t *testing.T) {
	data := []byte("fake-mp3")
	out, mime, err := prepareAudioForDashScopeASR(data, "audio/mpeg")
	if err != nil {
		t.Fatal(err)
	}
	if mime != "audio/mpeg" || string(out) != "fake-mp3" {
		t.Fatalf("unexpected passthrough: mime=%s out=%q", mime, out)
	}
}

func TestTranscodeAudioToMP3_fromWAV(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}
	sample := filepath.Join("..", "..", "..", "voice_samples", "laoda_reference", "laoda_voice.mp3")
	if _, err := os.Stat(sample); err != nil {
		t.Skip("sample mp3 missing")
	}
	src, err := os.ReadFile(sample)
	if err != nil {
		t.Fatal(err)
	}
	out, err := transcodeAudioToMP3(src, "audio/mpeg")
	if err != nil {
		t.Fatal(err)
	}
	if len(out) < 800 {
		t.Fatalf("transcoded mp3 too small: %d bytes", len(out))
	}
}

func TestPrepareAudioForDashScopeASR_convertsM4A(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}
	sample := filepath.Join("..", "..", "..", "voice_samples", "laoda_reference", "laoda_voice.mp3")
	if _, err := os.Stat(sample); err != nil {
		t.Skip("sample mp3 missing")
	}

	tmpDir, err := os.MkdirTemp("", "asr-m4a-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	m4aPath := filepath.Join(tmpDir, "sample.m4a")
	cmd := exec.Command("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", sample, "-ac", "1", "-ar", "16000", m4aPath)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("create m4a: %v (%s)", err, strings.TrimSpace(string(out)))
	}
	m4a, err := os.ReadFile(m4aPath)
	if err != nil {
		t.Fatal(err)
	}

	out, mime, err := prepareAudioForDashScopeASR(m4a, "audio/mp4")
	if err != nil {
		t.Fatal(err)
	}
	if mime != "audio/mpeg" {
		t.Fatalf("mime=%q want audio/mpeg", mime)
	}
	if len(out) < 800 {
		t.Fatalf("converted mp3 too small: %d bytes", len(out))
	}
}

func TestCallDashScopeASR_integration(t *testing.T) {
	apiKey := strings.TrimSpace(os.Getenv("OPENAI_API_KEY"))
	if apiKey == "" {
		apiKey = strings.TrimSpace(os.Getenv("DASHSCOPE_API_KEY"))
	}
	if apiKey == "" {
		t.Skip("OPENAI_API_KEY or DASHSCOPE_API_KEY not set")
	}
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}

	sample := filepath.Join("..", "..", "..", "voice_samples", "laoda_reference", "laoda_voice.mp3")
	src, err := os.ReadFile(sample)
	if err != nil {
		t.Skip("sample mp3 missing")
	}

	baseURL := strings.TrimSpace(os.Getenv("OPENAI_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://dashscope.aliyuncs.com/compatible-mode/v1"
	}

	text, err := callDashScopeASR(apiKey, baseURL, "qwen3-asr-flash", src, "audio/mpeg", "zh")
	if err != nil {
		t.Fatalf("callDashScopeASR: %v", err)
	}
	if strings.TrimSpace(text) == "" {
		t.Fatal("expected non-empty transcription")
	}
	t.Logf("transcription: %q", text)
}
