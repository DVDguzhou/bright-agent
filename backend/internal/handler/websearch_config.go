package handler

import (
	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/lifeagent"
)

func webSearchFromConfig(cfg *config.Config) *lifeagent.WebSearchSettings {
	if cfg == nil {
		return nil
	}
	s := lifeagent.ResolveWebSearchSettings(
		cfg.WebSearchProvider,
		cfg.BochaAPIKey,
		cfg.DashScopeAPIKey,
		cfg.WebSearchAPIKey,
		cfg.WebSearchModel,
		cfg.WebSearchBaseURL,
		cfg.OpenAIApiKey,
		cfg.OpenAIBaseURL,
		cfg.OpenAIModel,
		cfg.LLMEnableWebSearch,
		cfg.EmbeddingEffectiveKey(),
	)
	if !s.Enabled {
		return nil
	}
	return &s
}
