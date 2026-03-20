package tts

import (
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
)

// NewProviderFromConfig 按 TTS_PROVIDER / 环境自动选择百炼 Qwen-TTS 或 OpenAI Speech。
func NewProviderFromConfig(cfg *config.Config) Provider {
	switch cfg.ResolveTTSProvider() {
	case "dashscope":
		key := cfg.DashScopeTTSEffectiveKey()
		if key == "" {
			return &MockProvider{}
		}
		return &DashScopeQwenTTSProvider{
			APIKey:       key,
			Endpoint:     strings.TrimSpace(cfg.DashScopeTTSURL),
			Model:        cfg.DashScopeTTSModel,
			VCModel:      cfg.DashScopeVCModel,
			Voice:        cfg.DashScopeTTSVoice,
			LanguageType: cfg.DashScopeTTSLanguage,
		}
	case "openai":
		key := cfg.TTSEffectiveAPIKey()
		if key == "" {
			return &MockProvider{}
		}
		base := strings.TrimSpace(cfg.OpenAITTSBaseURL)
		base = strings.TrimSuffix(base, "/")
		if base == "" {
			base = "https://api.openai.com/v1"
		}
		model := strings.TrimSpace(cfg.OpenAITTSModel)
		if model == "" {
			model = "tts-1"
		}
		voice := strings.TrimSpace(cfg.OpenAITTSVoice)
		if voice == "" {
			voice = "nova"
		}
		return &OpenAIProvider{
			APIKey:  key,
			BaseURL: base,
			Model:   model,
			Voice:   voice,
		}
	default:
		return &MockProvider{}
	}
}
