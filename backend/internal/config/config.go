package config

import (
	"os"
	"strings"
)

type Config struct {
	DatabaseURL       string
	SessionSecret     string
	SessionCookie     string
	PlatformKeyPrefix string
	OpenAIApiKey        string
	OpenAIModel         string
	OpenAIBaseURL       string   // 可选，如 Ollama http://localhost:11434/v1 或 DashScope https://dashscope.aliyuncs.com/compatible-mode/v1
	LLMEnableWebSearch  bool     // 通义千问等 DashScope 联网搜索，仅 baseURL 为 dashscope 时生效
	CORSOrigins         []string // 部署后前端访问地址，如 http://8.136.119.234:3000
	// 语音相关
	BaseURL string // 应用公网地址，用于生成音频 URL，如 https://yourdomain.com
}

func Load() *Config {
	origins := []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	if v := getEnv("CORS_ORIGINS", ""); v != "" {
		for _, o := range strings.Split(v, ",") {
			if o = strings.TrimSpace(o); o != "" {
				origins = append(origins, o)
			}
		}
	}
	return &Config{
		DatabaseURL:       getEnv("DATABASE_URL", "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"),
		SessionSecret:     getEnv("SESSION_SECRET", "change-me-in-production"),
		SessionCookie:     getEnv("SESSION_COOKIE", "agent_fiverr_session"),
		PlatformKeyPrefix: getEnv("PLATFORM_KEY_PREFIX", "sk_live_"),
		OpenAIApiKey:      getEnv("OPENAI_API_KEY", ""),
		OpenAIModel:       getEnv("OPENAI_MODEL", "gpt-4o-mini"),
		OpenAIBaseURL:      getEnv("OPENAI_BASE_URL", ""),
		LLMEnableWebSearch: getEnv("LLM_ENABLE_WEB_SEARCH", "") == "true" || getEnv("LLM_ENABLE_WEB_SEARCH", "") == "1",
		CORSOrigins:        origins,
		BaseURL:           getEnv("BASE_URL", "http://localhost:8080"),
	}
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
