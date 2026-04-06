package config

import (
	"os"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/sms"
)

type Config struct {
	DatabaseURL        string
	SessionSecret       string
	SessionCookie       string
	SecureSessionCookie bool // SECURE_SESSION_COOKIE=true：HTTPS 生产环境建议开启（会话 Cookie 带 Secure）
	PlatformKeyPrefix         string
	LifeAgentInvokeKeyPrefix  string // 人生 Agent 开放调用 Key 前缀，默认 lai_sk_
	OpenAIApiKey       string
	OpenAIModel        string
	OpenAIBaseURL      string   // 可选，如 Ollama http://localhost:11434/v1 或 DashScope https://dashscope.aliyuncs.com/compatible-mode/v1
	LLMEnableWebSearch bool     // 通义千问等 DashScope 联网搜索，仅 baseURL 为 dashscope 时生效
	CORSOrigins        []string // 部署后前端访问地址，如 http://8.136.119.234:3000
	// 语音相关
	OpenAITTSApiKey  string // OpenAI TTS 专用 Key；不填时仅在 LLM 为官方 OpenAI 端点时复用 OPENAI_API_KEY
	OpenAITTSBaseURL string // 默认 https://api.openai.com/v1
	OpenAITTSModel   string // 默认 tts-1
	OpenAITTSVoice   string // 默认 nova
	// TTS_PROVIDER: auto（默认）| dashscope | openai — auto 在 OPENAI_BASE_URL 含 dashscope 时用百炼 Qwen-TTS
	TTSProvider          string
	DashScopeAPIKey      string // 可选 DASHSCOPE_API_KEY；不填则百炼 TTS 用 OPENAI_API_KEY（通义 sk）
	DashScopeTTSURL      string // 默认北京地域 multimodal-generation
	DashScopeTTSModel    string // 默认 qwen3-tts-flash
	DashScopeTTSVoice    string // 默认 Cherry
	DashScopeTTSLanguage string // 默认 Chinese
	// 声音复刻（与 enrollment target_model 须一致）
	DashScopeVCModel          string // 默认 qwen3-tts-vc-2026-01-22
	DashScopeVoiceEnrollURL   string // 创建音色 API
	BaseURL       string // 应用公网地址，用于生成音频 URL，如 https://yourdomain.com
	FrontendURL   string // 前端地址，微信回调后重定向目标，不填则从请求推断
	TTSDebug                  bool   // TTS_DEBUG：聊天 JSON 附带 ttsDebug（排障后关闭）
	// 微信登录（开放平台网站应用）
	WeChatAppID       string // 微信开放平台 AppID
	WeChatAppSecret   string // 微信开放平台 AppSecret
	WeChatRedirectURI string // 授权回调地址，不填则用 BASE_URL + /api/auth/wechat/callback
	// 手机号登录
	PhoneCodeTTL time.Duration // 验证码有效期，默认 5 分钟
	SMSSender    sms.Sender    // 短信发送器，不填则用 Mock（开发环境打印到日志）
	SMSAccessKey string       // 阿里云 AccessKeyId（可选）
	SMSSecret    string       // 阿里云 AccessKeySecret（可选）
	SMSSignName  string       // 短信签名
	SMSTemplate  string       // 验证码模板 Code
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
	cfg := &Config{
		DatabaseURL:        getEnv("DATABASE_URL", "guzhoudvd:Hu957843!@tcp(rm-bp176012tca6793kcoo.mysql.rds.aliyuncs.com:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"),
		SessionSecret:       getEnv("SESSION_SECRET", "change-me-in-production"),
		SessionCookie:       getEnv("SESSION_COOKIE", "agent_fiverr_session"),
		SecureSessionCookie: getEnv("SECURE_SESSION_COOKIE", "") == "true" || getEnv("SECURE_SESSION_COOKIE", "") == "1",
		PlatformKeyPrefix:        getEnv("PLATFORM_KEY_PREFIX", "sk_live_"),
		LifeAgentInvokeKeyPrefix: getEnv("LIFE_AGENT_INVOKE_KEY_PREFIX", "lai_sk_"),
		OpenAIApiKey:       stripOuterQuotes(getEnv("OPENAI_API_KEY", "")),
		OpenAIModel:        stripOuterQuotes(getEnv("OPENAI_MODEL", "gpt-4o-mini")),
		OpenAIBaseURL:      stripOuterQuotes(getEnv("OPENAI_BASE_URL", "")),
		LLMEnableWebSearch: getEnv("LLM_ENABLE_WEB_SEARCH", "") == "true" || getEnv("LLM_ENABLE_WEB_SEARCH", "") == "1",
		CORSOrigins:        origins,
		OpenAITTSApiKey:    stripOuterQuotes(getEnv("OPENAI_TTS_API_KEY", "")),
		OpenAITTSBaseURL:   stripOuterQuotes(getEnv("OPENAI_TTS_BASE_URL", "https://api.openai.com/v1")),
		OpenAITTSModel:     getEnv("OPENAI_TTS_MODEL", "tts-1"),
		OpenAITTSVoice:     getEnv("OPENAI_TTS_VOICE", "nova"),
		TTSProvider:        getEnv("TTS_PROVIDER", "auto"),
		DashScopeAPIKey:    stripOuterQuotes(getEnv("DASHSCOPE_API_KEY", "")),
		DashScopeTTSURL: getEnv(
			"DASHSCOPE_TTS_URL",
			"https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
		),
		DashScopeTTSModel:    getEnv("DASHSCOPE_TTS_MODEL", "qwen3-tts-flash"),
		DashScopeTTSVoice:    getEnv("DASHSCOPE_TTS_VOICE", "Cherry"),
		DashScopeTTSLanguage: getEnv("DASHSCOPE_TTS_LANGUAGE", "Chinese"),
		DashScopeVCModel: getEnv(
			"DASHSCOPE_VC_MODEL",
			"qwen3-tts-vc-2026-01-22",
		),
		DashScopeVoiceEnrollURL: getEnv(
			"DASHSCOPE_VOICE_ENROLL_URL",
			"https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization",
		),
		BaseURL:       getEnv("BASE_URL", "http://localhost:8080"),
		FrontendURL:   stripOuterQuotes(getEnv("FRONTEND_URL", getEnv("NEXTAUTH_URL", ""))),
		TTSDebug:        getEnv("TTS_DEBUG", "") == "true" || getEnv("TTS_DEBUG", "") == "1",
		WeChatAppID:     stripOuterQuotes(getEnv("WECHAT_APP_ID", "")),
		WeChatAppSecret: stripOuterQuotes(getEnv("WECHAT_APP_SECRET", "")),
		WeChatRedirectURI: stripOuterQuotes(getEnv("WECHAT_REDIRECT_URI", "")),
		PhoneCodeTTL:    parseDuration(getEnv("PHONE_CODE_TTL", "5m"), 5*time.Minute),
		SMSAccessKey:    stripOuterQuotes(getEnv("SMS_ACCESS_KEY_ID", "")),
		SMSSecret:       stripOuterQuotes(getEnv("SMS_ACCESS_KEY_SECRET", "")),
		SMSSignName:     getEnv("SMS_SIGN_NAME", ""),
		SMSTemplate:     getEnv("SMS_TEMPLATE_CODE", ""),
	}
	cfg.SMSSender = buildSMSSender(cfg)
	return cfg
}

func parseDuration(s string, defaultVal time.Duration) time.Duration {
	if s == "" {
		return defaultVal
	}
	d, err := time.ParseDuration(s)
	if err != nil {
		return defaultVal
	}
	return d
}

func buildSMSSender(cfg *Config) sms.Sender {
	if cfg.SMSAccessKey != "" && cfg.SMSSecret != "" {
		return &sms.AliyunSender{
			AccessKeyID:     cfg.SMSAccessKey,
			AccessKeySecret: cfg.SMSSecret,
			SignName:        cfg.SMSSignName,
			TemplateCode:    cfg.SMSTemplate,
		}
	}
	return sms.MockSender{}
}

// TTSEffectiveAPIKey 用于调用 OpenAI 语音合成接口的 Key（通义等兼容 Key 不能用于 /audio/speech）。
func (c *Config) TTSEffectiveAPIKey() string {
	if k := strings.TrimSpace(c.OpenAITTSApiKey); k != "" {
		return k
	}
	chatKey := strings.TrimSpace(c.OpenAIApiKey)
	if chatKey == "" {
		return ""
	}
	if openAIBaseURLAllowsSharedChatKeyForTTS(c.OpenAIBaseURL) {
		return chatKey
	}
	return ""
}

func openAIBaseURLAllowsSharedChatKeyForTTS(base string) bool {
	u := strings.ToLower(strings.TrimSpace(base))
	if u == "" {
		return true
	}
	return strings.Contains(u, "api.openai.com")
}

// LikelyDashScopeLLM 部署时若未传 OPENAI_BASE_URL，仅靠 qwen 模型名也应走百炼 TTS（避免误用 OpenAI /audio/speech）
func (c *Config) LikelyDashScopeLLM() bool {
	u := strings.ToLower(strings.TrimSpace(c.OpenAIBaseURL))
	if strings.Contains(u, "dashscope") {
		return true
	}
	m := strings.ToLower(strings.TrimSpace(c.OpenAIModel))
	return strings.Contains(m, "qwen")
}

// ResolveTTSProvider 返回 dashscope | openai | 空（不可用）
func (c *Config) ResolveTTSProvider() string {
	mode := strings.ToLower(strings.TrimSpace(c.TTSProvider))
	switch mode {
	case "dashscope":
		if c.DashScopeTTSEffectiveKey() != "" {
			return "dashscope"
		}
	case "openai":
		if c.TTSEffectiveAPIKey() != "" {
			return "openai"
		}
	case "auto", "":
		fallthrough
	default:
		if c.LikelyDashScopeLLM() && c.DashScopeTTSEffectiveKey() != "" {
			return "dashscope"
		}
		if c.TTSEffectiveAPIKey() != "" {
			return "openai"
		}
	}
	return ""
}

// DashScopeTTSEffectiveKey 百炼 TTS 使用通义 sk（OPENAI_API_KEY），勿使用 OPENAI_TTS_API_KEY（仅 OpenAI 语音用）
func (c *Config) DashScopeTTSEffectiveKey() string {
	if k := strings.TrimSpace(c.DashScopeAPIKey); k != "" {
		return k
	}
	return strings.TrimSpace(c.OpenAIApiKey)
}

// VoiceReplyConfigured 是否可对访客展示「语音回复」开关（含仅填了 voice_clone_id 预留字段的情况）。
func (c *Config) VoiceReplyConfigured(profileVoiceCloneID string) bool {
	if strings.TrimSpace(profileVoiceCloneID) != "" {
		return true
	}
	return c.ResolveTTSProvider() != ""
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

// stripOuterQuotes 去掉 .env / Docker 传入时首尾引号与 BOM，避免 Authorization 里带非法字符
func stripOuterQuotes(s string) string {
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "\ufeff")
	if len(s) >= 2 {
		if (s[0] == '"' && s[len(s)-1] == '"') || (s[0] == '\'' && s[len(s)-1] == '\'') {
			return strings.TrimSpace(s[1 : len(s)-1])
		}
	}
	return s
}
