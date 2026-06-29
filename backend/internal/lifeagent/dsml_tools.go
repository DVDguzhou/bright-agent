package lifeagent

import (
	"encoding/json"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

var (
	dsmlToolCallBlockRe = regexp.MustCompile(`(?is)<\|DSML\|tool_calls>.*?</\|DSML\|tool_calls>`)
	dsmlOpenToolCallRe  = regexp.MustCompile(`(?is)<\|DSML\|tool_calls>.*`)
	dsmlWebSearchQueryRe = regexp.MustCompile(
		`(?is)<\|DSML\|invoke\s+name="web_search"\s*>.*?<\|DSML\|parameter\s+name="query"[^>]*>(.*?)</\|DSML\|parameter>`,
	)
)

func contentHasDSMLToolCall(content string) bool {
	return strings.Contains(content, "<|DSML|") && strings.Contains(content, "tool_calls")
}

func extractDSMLWebSearchQuery(content string) (string, bool) {
	if !contentHasDSMLToolCall(content) {
		return "", false
	}
	m := dsmlWebSearchQueryRe.FindStringSubmatch(content)
	if len(m) < 2 {
		return "", false
	}
	query := strings.TrimSpace(m[1])
	return query, query != ""
}

func stripDSMLMarkup(content string) string {
	content = dsmlToolCallBlockRe.ReplaceAllString(content, "")
	content = dsmlOpenToolCallRe.ReplaceAllString(content, "")
	content = strings.ReplaceAll(content, "<|DSML|", "")
	return strings.TrimSpace(content)
}

func dsmlWebSearchToolCall(query string) (openai.ToolCall, bool) {
	query = strings.TrimSpace(query)
	if query == "" {
		return openai.ToolCall{}, false
	}
	args, err := json.Marshal(map[string]string{"query": query})
	if err != nil {
		return openai.ToolCall{}, false
	}
	return openai.ToolCall{
		ID:   "dsml_web_search",
		Type: openai.ToolTypeFunction,
		Function: openai.FunctionCall{
			Name:      "web_search",
			Arguments: string(args),
		},
	}, true
}

func shouldAttachWebSearchTool(opts *ChatOptions, baseURL string) bool {
	if !webSearchToolEnabled(opts, baseURL) {
		return false
	}
	// DeepSeek 等模型会把 tool call 写成 <|DSML|...> 纯文本，无法走标准 function calling。
	// 已配置独立搜索后端时只走强制预搜索，不再挂 web_search 工具。
	if opts != nil && opts.WebSearch != nil && opts.WebSearch.Enabled && !isDashScope(baseURL) {
		return false
	}
	return true
}

func absorbDSMLToolCalls(result *streamResult) {
	if result == nil || len(result.ToolCalls) > 0 {
		return
	}
	query, ok := extractDSMLWebSearchQuery(result.Content)
	if !ok {
		return
	}
	tc, ok := dsmlWebSearchToolCall(query)
	if !ok {
		return
	}
	result.ToolCalls = []openai.ToolCall{tc}
	result.FinishReason = openai.FinishReasonToolCalls
	result.Content = stripDSMLMarkup(result.Content)
}
