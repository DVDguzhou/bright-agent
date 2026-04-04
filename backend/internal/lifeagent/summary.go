package lifeagent

import (
	"context"
	"log"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// ChatOptions holds optional memory context for LLM chat.
type ChatOptions struct {
	SessionSummary     string // compressed summary of earlier messages in this session
	CrossSessionMemory string // summaries from buyer's previous sessions with this agent
}

// SummarizeConversation generates a concise summary of a conversation using LLM.
// Returns empty string on failure (non-critical, best-effort).
func SummarizeConversation(ctx context.Context, apiKey, model, baseURL string, messages []ChatMessageForAI) string {
	if !isLLMEnabled(apiKey, model, baseURL) || len(messages) == 0 {
		return ""
	}
	apiKey = resolveAPIKey(apiKey, baseURL)
	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	var sb strings.Builder
	for _, m := range messages {
		if m.Role == "user" {
			sb.WriteString("用户: ")
		} else {
			sb.WriteString("你: ")
		}
		// truncate very long messages to save tokens
		content := m.Content
		if len([]rune(content)) > 300 {
			content = string([]rune(content)[:300]) + "..."
		}
		sb.WriteString(content)
		sb.WriteString("\n")
	}

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role: openai.ChatMessageRoleSystem,
				Content: `将以下对话压缩为简洁的中文摘要（100-200字）。
要求：
1. 保留用户提到的关键话题、具体问题、重要偏好
2. 保留你给出的关键结论和建议
3. 用第三人称客观描述（如「用户问了…」「你回答了…」）
4. 只输出摘要文本，不要标题、编号或格式标记`,
			},
			{Role: openai.ChatMessageRoleUser, Content: sb.String()},
		},
		Temperature: 0.2,
		MaxTokens:   500,
	})
	if err != nil || len(resp.Choices) == 0 {
		log.Printf("[Summary] failed: %v", err)
		return ""
	}
	return strings.TrimSpace(resp.Choices[0].Message.Content)
}

// BuildCrossSessionMemory concatenates summaries from previous sessions into
// a single memory block for the LLM. Returns empty string if no summaries.
func BuildCrossSessionMemory(summaries []string) string {
	var parts []string
	for _, s := range summaries {
		s = strings.TrimSpace(s)
		if s != "" {
			parts = append(parts, s)
		}
	}
	if len(parts) == 0 {
		return ""
	}
	return strings.Join(parts, "\n---\n")
}
