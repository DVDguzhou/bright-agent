package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// ──────────────────────────────────────────────
// Tool definitions (JSON Schema for the model)
// ──────────────────────────────────────────────

var chatTools = []openai.Tool{
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "get_current_datetime",
			Description: "获取当前的日期和时间，包括年月日、星期几、时分。当用户询问今天几号、现在几点、星期几等时间相关问题时使用。",
			Parameters: json.RawMessage(`{
				"type": "object",
				"properties": {},
				"required": []
			}`),
		},
	},
	{
		Type: openai.ToolTypeFunction,
		Function: &openai.FunctionDefinition{
			Name:        "web_search",
			Description: "联网搜索实时信息。当用户询问天气、新闻、热搜、物价、政策、实时数据等需要最新信息才能回答的问题时使用。不要用于可以根据自身经历回答的问题。",
			Parameters: json.RawMessage(`{
				"type": "object",
				"properties": {
					"query": {
						"type": "string",
						"description": "搜索关键词，简洁明确"
					}
				},
				"required": ["query"]
			}`),
		},
	},
}

// ──────────────────────────────────────────────
// Tool execution
// ──────────────────────────────────────────────

type toolContext struct {
	APIKey  string
	BaseURL string
	Model   string
}

func executeToolCall(ctx context.Context, tc openai.ToolCall, tctx toolContext) string {
	switch tc.Function.Name {
	case "get_current_datetime":
		return executeGetCurrentDatetime()
	case "web_search":
		return executeWebSearch(ctx, tc.Function.Arguments, tctx)
	default:
		return fmt.Sprintf("未知工具: %s", tc.Function.Name)
	}
}

func executeGetCurrentDatetime() string {
	now := time.Now()
	weekdays := []string{"日", "一", "二", "三", "四", "五", "六"}
	return fmt.Sprintf("%d年%d月%d日 星期%s %02d:%02d",
		now.Year(), int(now.Month()), now.Day(),
		weekdays[now.Weekday()], now.Hour(), now.Minute())
}

func executeWebSearch(ctx context.Context, argsJSON string, tctx toolContext) string {
	var args struct {
		Query string `json:"query"`
	}
	if err := json.Unmarshal([]byte(argsJSON), &args); err != nil || args.Query == "" {
		return "搜索参数无效"
	}
	log.Printf("[tool-web_search] query=%q", args.Query)

	if !isDashScope(tctx.BaseURL) {
		return "当前 API 不支持联网搜索"
	}

	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: "你是一个搜索助手。根据用户的问题搜索最新信息，返回简洁的事实性结果。只返回关键数据，不要加入个人观点。"},
		{Role: openai.ChatMessageRoleUser, Content: args.Query},
	}
	resp, err := chatCompletionWithWebSearch(ctx, tctx.APIKey, tctx.Model, tctx.BaseURL, messages)
	if err != nil {
		log.Printf("[tool-web_search] search failed: %v", err)
		return "搜索失败，请稍后再试"
	}
	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		return "未找到相关结果"
	}
	result := strings.TrimSpace(resp.Choices[0].Message.Content)
	log.Printf("[tool-web_search] result length=%d chars", len([]rune(result)))
	return result
}

// ──────────────────────────────────────────────
// Streaming with tool call accumulation
// ──────────────────────────────────────────────

// accumulateStreamToolCalls merges incremental tool call deltas from streaming
// chunks into complete ToolCall objects.
func accumulateStreamToolCalls(existing []openai.ToolCall, deltas []openai.ToolCall) []openai.ToolCall {
	for _, d := range deltas {
		idx := 0
		if d.Index != nil {
			idx = *d.Index
		}
		for len(existing) <= idx {
			existing = append(existing, openai.ToolCall{})
		}
		if d.ID != "" {
			existing[idx].ID = d.ID
		}
		if d.Type != "" {
			existing[idx].Type = d.Type
		}
		if d.Function.Name != "" {
			existing[idx].Function.Name += d.Function.Name
		}
		if d.Function.Arguments != "" {
			existing[idx].Function.Arguments += d.Function.Arguments
		}
	}
	return existing
}
