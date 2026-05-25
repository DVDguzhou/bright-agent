package handler

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func dashScopeSupportedMIME(mime string) bool {
	mime = strings.ToLower(strings.TrimSpace(mime))
	switch mime {
	case "audio/wav", "audio/x-wav", "audio/wave":
		return true
	case "audio/mpeg", "audio/mp3":
		return true
	default:
		return false
	}
}

func extensionForMIME(mime string) string {
	mime = strings.ToLower(strings.TrimSpace(mime))
	switch {
	case strings.Contains(mime, "wav"):
		return ".wav"
	case strings.Contains(mime, "mpeg"), strings.Contains(mime, "mp3"):
		return ".mp3"
	case strings.Contains(mime, "mp4"), strings.Contains(mime, "m4a"), strings.Contains(mime, "aac"):
		return ".m4a"
	case strings.Contains(mime, "ogg"):
		return ".ogg"
	case strings.Contains(mime, "webm"):
		return ".webm"
	default:
		return ".bin"
	}
}

// prepareAudioForDashScopeASR converts browser recordings (mp4/webm) to mp3.
// DashScope base64 ASR only reliably accepts audio/wav and audio/mpeg.
func prepareAudioForDashScopeASR(audio []byte, mime string) ([]byte, string, error) {
	mime = strings.TrimSpace(mime)
	if mime == "" {
		mime = "application/octet-stream"
	}
	if dashScopeSupportedMIME(mime) {
		if mime == "audio/mp3" {
			mime = "audio/mpeg"
		}
		return audio, mime, nil
	}
	converted, err := transcodeAudioToMP3(audio, mime)
	if err != nil {
		return nil, "", err
	}
	return converted, "audio/mpeg", nil
}

func transcodeAudioToMP3(audio []byte, mime string) ([]byte, error) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		return nil, fmt.Errorf("ffmpeg not available: %w", err)
	}

	tmpDir, err := os.MkdirTemp("", "asr-*")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(tmpDir)

	inPath := filepath.Join(tmpDir, "input"+extensionForMIME(mime))
	outPath := filepath.Join(tmpDir, "output.mp3")
	if err := os.WriteFile(inPath, audio, 0600); err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, "ffmpeg",
		"-hide_banner", "-loglevel", "error",
		"-i", inPath,
		"-ac", "1",
		"-ar", "16000",
		"-b:a", "64k",
		"-f", "mp3",
		outPath,
	)
	if out, err := cmd.CombinedOutput(); err != nil {
		return nil, fmt.Errorf("ffmpeg transcode: %w (%s)", err, strings.TrimSpace(string(out)))
	}

	result, err := os.ReadFile(outPath)
	if err != nil {
		return nil, err
	}
	if len(result) == 0 {
		return nil, fmt.Errorf("ffmpeg produced empty output")
	}
	return result, nil
}
