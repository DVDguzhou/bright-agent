package lifeagent

import "testing"

func TestResolveWebSearchSettingsDashScope(t *testing.T) {
	s := ResolveWebSearchSettings(
		"dashscope", "", "", "sk-test", "qwen-plus", "",
		"sk-deepseek", "https://api.deepseek.com", "deepseek-chat",
		false, "",
	)
	if !s.Enabled || s.Provider != "dashscope" || s.DashScopeAPIKey != "sk-test" {
		t.Fatalf("unexpected settings: %+v", s)
	}
}

func TestResolveWebSearchSettingsAutoPrefersDashScope(t *testing.T) {
	s := ResolveWebSearchSettings(
		"auto", "sk-bocha", "sk-tongyi", "", "", "",
		"sk-deepseek", "https://api.deepseek.com", "deepseek-chat",
		false, "",
	)
	if s.Provider != "dashscope" || s.DashScopeAPIKey != "sk-tongyi" {
		t.Fatalf("auto should prefer dashscope, got %+v", s)
	}
}
