package tts

import "fmt"

// MockProvider 不执行实际 TTS，用于未配置时
type MockProvider struct{}

func (p *MockProvider) CreateVoice(profileID string, audioBase64 string) (string, error) {
	return "", nil
}

func (p *MockProvider) Synthesize(voiceID string, text string) (string, int, error) {
	return "", 0, fmt.Errorf("TTS not configured: set OPENAI_API_KEY for voice reply")
}
