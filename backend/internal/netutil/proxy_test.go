package netutil

import "testing"

func TestHostNeedsProxy(t *testing.T) {
	tests := []struct {
		baseURL string
		want    bool
	}{
		{"https://generativelanguage.googleapis.com/v1beta/openai/", true},
		{"https://dashscope.aliyuncs.com/compatible-mode/v1", false},
		{"http://localhost:11434/v1", false},
		{"http://host.docker.internal:7890", false},
		{"", true},
	}
	for _, tt := range tests {
		if got := HostNeedsProxy(tt.baseURL); got != tt.want {
			t.Errorf("HostNeedsProxy(%q) = %v, want %v", tt.baseURL, got, tt.want)
		}
	}
}

func TestResolveLLMProxyURL_explicit(t *testing.T) {
	t.Setenv("LLM_HTTP_PROXY", "http://127.0.0.1:7890")
	t.Setenv("HTTPS_PROXY", "")
	t.Setenv("HTTP_PROXY", "")
	got := ResolveLLMProxyURL("https://dashscope.aliyuncs.com/compatible-mode/v1")
	if got != "http://127.0.0.1:7890" {
		t.Fatalf("expected explicit LLM_HTTP_PROXY, got %q", got)
	}
}

func TestResolveLLMProxyURL_autoForGoogle(t *testing.T) {
	t.Setenv("LLM_HTTP_PROXY", "")
	t.Setenv("HTTPS_PROXY", "http://10.0.0.1:7890")
	t.Setenv("HTTP_PROXY", "")
	got := ResolveLLMProxyURL("https://generativelanguage.googleapis.com/v1beta/openai/")
	if got != "http://10.0.0.1:7890" {
		t.Fatalf("expected HTTPS_PROXY for Google, got %q", got)
	}
	gotDomestic := ResolveLLMProxyURL("https://dashscope.aliyuncs.com/compatible-mode/v1")
	if gotDomestic != "" {
		t.Fatalf("domestic base URL should not use proxy, got %q", gotDomestic)
	}
}
