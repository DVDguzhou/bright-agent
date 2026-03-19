package tts

// NewProvider 根据配置创建 TTS 提供者
// 优先使用 OpenAI TTS（需 OPENAI_API_KEY）
func NewProvider(openaiKey string) Provider {
	if openaiKey != "" {
		return &OpenAIProvider{
			APIKey:  openaiKey,
			BaseURL: "https://api.openai.com/v1",
			Model:   "tts-1",
			Voice:   "nova",
		}
	}
	return &MockProvider{}
}
