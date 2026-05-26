package netutil

import (
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

// ResolveLLMProxyURL 决定 LLM 请求是否走代理。
//
// 优先级：
//  1. LLM_HTTP_PROXY —— 显式指定，仅影响 LLM（getClient），不影响百炼 TTS/Embedding
//  2. HTTPS_PROXY / HTTP_PROXY —— 仅当 baseURL 指向境外 API（Google/OpenAI 等）时使用
func ResolveLLMProxyURL(baseURL string) string {
	if p := strings.TrimSpace(os.Getenv("LLM_HTTP_PROXY")); p != "" {
		return p
	}
	if !HostNeedsProxy(baseURL) {
		return ""
	}
	if p := strings.TrimSpace(os.Getenv("HTTPS_PROXY")); p != "" {
		return p
	}
	return strings.TrimSpace(os.Getenv("HTTP_PROXY"))
}

// HostNeedsProxy 判断 LLM base URL 是否需要代理（国内直连域名返回 false）。
func HostNeedsProxy(baseURL string) bool {
	host := baseHost(baseURL)
	if host == "" {
		return true // 默认 OpenAI 官方
	}
	if host == "localhost" || host == "127.0.0.1" || host == "host.docker.internal" {
		return false
	}
	if strings.HasSuffix(host, ".aliyuncs.com") || host == "dashscope.aliyuncs.com" {
		return false
	}
	return true
}

func baseHost(baseURL string) string {
	baseURL = strings.TrimSpace(baseURL)
	if baseURL == "" {
		return ""
	}
	u, err := url.Parse(baseURL)
	if err != nil {
		return strings.ToLower(baseURL)
	}
	return strings.ToLower(u.Hostname())
}

// NewHTTPClient 构造带可选代理的 HTTP 客户端。timeout<=0 表示不设 Client 级超时（由 context 控制）。
func NewHTTPClient(proxyURL string, timeout time.Duration) *http.Client {
	transport := &http.Transport{
		MaxIdleConns:        20,
		MaxIdleConnsPerHost: 10,
		IdleConnTimeout:     90 * time.Second,
		Proxy:               http.ProxyFromEnvironment,
	}
	if proxyURL != "" {
		if u, err := url.Parse(proxyURL); err == nil {
			transport.Proxy = http.ProxyURL(u)
		}
	} else {
		transport.Proxy = nil
	}
	client := &http.Client{Transport: transport}
	if timeout > 0 {
		client.Timeout = timeout
	}
	return client
}

// LLMProxyConfigured 启动日志用：是否配置了 LLM 代理。
func LLMProxyConfigured() string {
	return strings.TrimSpace(os.Getenv("LLM_HTTP_PROXY"))
}
