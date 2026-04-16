package lifeagent

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// --- OpenAI client cache (keyed by apiKey+baseURL) ---

type clientKey struct {
	apiKey  string
	baseURL string
}

var (
	clientCache = make(map[clientKey]*openai.Client)
	clientMu    sync.RWMutex
)

// getClient returns a cached *openai.Client, creating one if needed.
// The underlying http.Client and connection pool are reused across calls.
func getClient(apiKey, baseURL string) *openai.Client {
	key := clientKey{apiKey: apiKey, baseURL: baseURL}

	clientMu.RLock()
	if c, ok := clientCache[key]; ok {
		clientMu.RUnlock()
		return c
	}
	clientMu.RUnlock()

	clientMu.Lock()
	defer clientMu.Unlock()
	// double-check after write lock
	if c, ok := clientCache[key]; ok {
		return c
	}
	cfg := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		cfg.BaseURL = baseURL
	}
	c := openai.NewClientWithConfig(cfg)
	clientCache[key] = c
	return c
}

// --- shared DashScope HTTP client (connection pool reuse) ---

var dashScopeHTTPClient = &http.Client{
	Timeout: 120 * time.Second,
	Transport: &http.Transport{
		MaxIdleConns:        20,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
	},
}

// --- common helpers ---

const (
	LLMTimeout       = 60 * time.Second
	LLMStreamTimeout = 90 * time.Second
)

// withLLMTimeout wraps a parent context with the default LLM timeout.
func withLLMTimeout(parent context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(parent, LLMTimeout)
}

// withStreamTimeout wraps a parent context with the streaming LLM timeout.
func withStreamTimeout(parent context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(parent, LLMStreamTimeout)
}

// resolveAPIKey normalizes apiKey for local services like Ollama.
func resolveAPIKey(apiKey, baseURL string) string {
	if apiKey == "" && baseURL != "" {
		return "ollama"
	}
	return apiKey
}

// isLLMEnabled checks if LLM is configured.
func isLLMEnabled(apiKey, model, baseURL string) bool {
	return (apiKey != "" || baseURL != "") && model != ""
}

// isReasoningModel returns true for models that don't support Temperature/TopP
// (e.g. o1, o3, gpt-5 series). For these models, those parameters must be omitted.
func isReasoningModel(model string) bool {
	m := strings.ToLower(model)
	for _, prefix := range []string{"o1", "o3", "o4", "gpt-5"} {
		if strings.HasPrefix(m, prefix) {
			return true
		}
	}
	return false
}

// safeTemperature returns the given temperature for normal models, or 0 (omitted) for reasoning models.
func safeTemperature(model string, temp float32) float32 {
	if isReasoningModel(model) {
		return 0
	}
	return temp
}

// setMaxTokens sets both MaxTokens and MaxCompletionTokens for broad API compatibility.
// Reasoning models only support MaxCompletionTokens; other models/providers may only
// recognize MaxTokens (e.g. Ollama, some DashScope endpoints).
func setMaxTokens(req *openai.ChatCompletionRequest, model string, budget int) {
	req.MaxCompletionTokens = budget
	if !isReasoningModel(model) {
		req.MaxTokens = budget
	}
}
