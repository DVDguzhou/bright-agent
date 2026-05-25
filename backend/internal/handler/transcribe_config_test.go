package handler

import (
	"strings"
	"testing"

	"github.com/agent-marketplace/backend/internal/config"
)

func TestResolveSTTConfig_prefersDashScopeWhenAPIKeySet(t *testing.T) {
	cfg := &config.Config{
		DashScopeAPIKey: "sk-dashscope",
		OpenAIApiKey:    "sk-proxy",
		OpenAIBaseURL:   "https://api.packy.example/v1",
		OpenAIModel:     "gemini-pro",
		TTSProvider:     "dashscope",
	}
	key, base, useDash := resolveSTTConfig(cfg)
	if !useDash {
		t.Fatal("expected dashscope ASR")
	}
	if key != "sk-dashscope" {
		t.Fatalf("key=%q", key)
	}
	if !strings.Contains(base, "dashscope.aliyuncs.com") {
		t.Fatalf("base=%q want dashscope endpoint", base)
	}
}

func TestResolveSTTConfig_whisperWhenNoDashScopeKey(t *testing.T) {
	cfg := &config.Config{
		OpenAIApiKey:  "sk-openai",
		OpenAIBaseURL: "https://api.openai.com/v1",
		OpenAIModel:   "gpt-4o-mini",
	}
	key, base, useDash := resolveSTTConfig(cfg)
	if useDash {
		t.Fatal("expected whisper path")
	}
	if key != "sk-openai" {
		t.Fatalf("key=%q", key)
	}
	if base != "https://api.openai.com/v1" {
		t.Fatalf("base=%q", base)
	}
}

func TestResolveSTTConfig_qwenModelUsesDashScope(t *testing.T) {
	cfg := &config.Config{
		OpenAIApiKey:  "sk-qwen",
		OpenAIBaseURL: "https://api.packy.example/v1",
		OpenAIModel:   "qwen-plus",
	}
	_, base, useDash := resolveSTTConfig(cfg)
	if !useDash {
		t.Fatal("expected dashscope ASR for qwen model")
	}
	if !strings.Contains(base, "dashscope.aliyuncs.com") {
		t.Fatalf("base=%q want dashscope endpoint", base)
	}
}
