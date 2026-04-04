package lifeagent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// isDashScope 判断 baseURL 是否为阿里云 DashScope 兼容接口
func isDashScope(baseURL string) bool {
	u := strings.ToLower(strings.TrimSuffix(baseURL, "/"))
	return strings.Contains(u, "dashscope.aliyuncs.com") ||
		strings.Contains(u, "dashscope-intl.aliyuncs.com") ||
		strings.Contains(u, "dashscope-us.aliyuncs.com")
}

// chatCompletionWithWebSearch 使用 HTTP 直接调用 DashScope，支持 enable_search 联网搜索
func chatCompletionWithWebSearch(ctx context.Context, apiKey, model, baseURL string, messages []openai.ChatCompletionMessage) (*openai.ChatCompletionResponse, error) {
	url := strings.TrimSuffix(baseURL, "/") + "/chat/completions"

	reqBody := map[string]any{
		"model":       model,
		"messages":    messages,
		"temperature": 0.4,
		"max_tokens":  4096,
		"enable_search": true,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := dashScopeHTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http do: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("dashscope api error: status=%d body=%s", resp.StatusCode, string(respBytes))
	}

	var result openai.ChatCompletionResponse
	if err := json.Unmarshal(respBytes, &result); err != nil {
		return nil, fmt.Errorf("unmarshal response: %w", err)
	}
	return &result, nil
}
