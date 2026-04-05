package lifeagent

import (
	"context"
	"encoding/json"
	"log"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// ChatOptions holds optional memory context for LLM chat.
type ChatOptions struct {
	SessionSummary     string // compressed summary of earlier messages in this session
	CrossSessionMemory string // summaries from buyer's previous sessions with this agent
}

type ConversationMemory struct {
	SummaryText          string          `json:"summaryText"`
	UserStatedFacts      []FactCandidate `json:"userStatedFacts,omitempty"`
	UserPreferences      []string        `json:"userPreferences,omitempty"`
	ConversationTopics   []string        `json:"conversationTopics,omitempty"`
	AssistantSuggestions []string        `json:"assistantSuggestions,omitempty"`
}

// SummarizeConversation 兼容旧调用，只返回摘要文本。
func SummarizeConversation(ctx context.Context, apiKey, model, baseURL string, messages []ChatMessageForAI) string {
	return SummarizeConversationMemory(ctx, apiKey, model, baseURL, messages).SummaryText
}

// SummarizeConversationMemory 生成结构化记忆，避免把自由摘要直接当作长期事实。
func SummarizeConversationMemory(ctx context.Context, apiKey, model, baseURL string, messages []ChatMessageForAI) ConversationMemory {
	if !isLLMEnabled(apiKey, model, baseURL) || len(messages) == 0 {
		return fallbackConversationMemory(messages)
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
				Content: `你要把对话整理成结构化记忆，必须输出严格 JSON，不要 markdown。
{
  "summaryText": "100-180字的客观摘要",
  "userStatedFacts": [
    {
      "factKey": "fact_key",
      "factValue": "用户明确说过的事实",
      "factType": "narrative_fact",
      "source": "session_summary",
      "confidence": "medium",
      "status": "pending_review"
    }
  ],
  "userPreferences": ["用户明确表达的偏好"],
  "conversationTopics": ["本次聊到的话题"],
  "assistantSuggestions": ["你给过的关键建议"]
}
规则：
1. 只有用户明确说过的事实，才能写入 userStatedFacts。
2. 没被用户明确说过的，不要脑补成事实。
3. userStatedFacts 默认 status 为 pending_review。
4. summaryText 用第三人称客观描述，不要编号。`,
			},
			{Role: openai.ChatMessageRoleUser, Content: sb.String()},
		},
		Temperature: 0.2,
		MaxTokens:   500,
	})
	if err != nil || len(resp.Choices) == 0 {
		log.Printf("[Summary] failed: %v", err)
		return fallbackConversationMemory(messages)
	}
	raw := extractMemoryJSON(strings.TrimSpace(resp.Choices[0].Message.Content))
	var memory ConversationMemory
	if err := json.Unmarshal([]byte(raw), &memory); err != nil {
		log.Printf("[Summary] parse failed: %v", err)
		return fallbackConversationMemory(messages)
	}
	return normalizeConversationMemory(memory, messages)
}

// BuildCrossSessionMemory 只拼接相对安全的话题/偏好，以及已经确认的事实。
func BuildCrossSessionMemory(memories []ConversationMemory) string {
	var parts []string
	for _, memory := range memories {
		section := buildMemorySection(memory)
		if section != "" {
			parts = append(parts, section)
		}
	}
	if len(parts) == 0 {
		return ""
	}
	return strings.Join(parts, "\n---\n")
}

func ConversationMemoryFromMap(data map[string]interface{}) ConversationMemory {
	if len(data) == 0 {
		return ConversationMemory{}
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return ConversationMemory{}
	}
	var memory ConversationMemory
	if err := json.Unmarshal(raw, &memory); err != nil {
		return ConversationMemory{}
	}
	return memory
}

func fallbackConversationMemory(messages []ChatMessageForAI) ConversationMemory {
	memory := ConversationMemory{
		UserPreferences:      []string{},
		ConversationTopics:   []string{},
		AssistantSuggestions: []string{},
	}
	var topics []string
	var suggestions []string
	for _, message := range messages {
		if message.Role == "user" {
			topics = append(topics, firstSentence(message.Content, 24))
		} else {
			suggestions = append(suggestions, firstSentence(message.Content, 24))
		}
	}
	memory.ConversationTopics = uniqueStrings(topics, 4)
	memory.AssistantSuggestions = uniqueStrings(suggestions, 3)
	if len(memory.ConversationTopics) > 0 {
		memory.SummaryText = "用户最近主要聊了：" + strings.Join(memory.ConversationTopics, "、") + "。"
	}
	return memory
}

func normalizeConversationMemory(memory ConversationMemory, messages []ChatMessageForAI) ConversationMemory {
	if strings.TrimSpace(memory.SummaryText) == "" {
		memory.SummaryText = fallbackConversationMemory(messages).SummaryText
	}
	if len(memory.ConversationTopics) == 0 {
		memory.ConversationTopics = fallbackConversationMemory(messages).ConversationTopics
	}
	memory.UserPreferences = uniqueStrings(memory.UserPreferences, 4)
	memory.ConversationTopics = uniqueStrings(memory.ConversationTopics, 4)
	memory.AssistantSuggestions = uniqueStrings(memory.AssistantSuggestions, 4)
	memory.UserStatedFacts = dedupeFactCandidates(memory.UserStatedFacts)
	for i := range memory.UserStatedFacts {
		if memory.UserStatedFacts[i].FactType == "" {
			memory.UserStatedFacts[i].FactType = "narrative_fact"
		}
		if memory.UserStatedFacts[i].Source == "" {
			memory.UserStatedFacts[i].Source = "session_summary"
		}
		if memory.UserStatedFacts[i].Confidence == "" {
			memory.UserStatedFacts[i].Confidence = "medium"
		}
		if memory.UserStatedFacts[i].Status == "" {
			memory.UserStatedFacts[i].Status = "pending_review"
		}
	}
	return memory
}

func buildMemorySection(memory ConversationMemory) string {
	var lines []string
	if len(memory.ConversationTopics) > 0 {
		lines = append(lines, "话题："+strings.Join(memory.ConversationTopics, "、"))
	}
	if len(memory.UserPreferences) > 0 {
		lines = append(lines, "偏好："+strings.Join(memory.UserPreferences, "、"))
	}
	var confirmedFacts []string
	for _, fact := range memory.UserStatedFacts {
		if fact.Status == "confirmed" {
			confirmedFacts = append(confirmedFacts, fact.FactValue)
		}
	}
	if len(confirmedFacts) > 0 {
		lines = append(lines, "已确认事实："+strings.Join(confirmedFacts, "、"))
	}
	return strings.Join(lines, "\n")
}

func extractMemoryJSON(s string) string {
	if m := memoryJSONBlockRe.FindStringSubmatch(s); len(m) >= 2 {
		return strings.TrimSpace(m[1])
	}
	start := strings.Index(s, "{")
	if start < 0 {
		return "{}"
	}
	depth := 0
	for i := start; i < len(s); i++ {
		switch s[i] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return s[start : i+1]
			}
		}
	}
	return s[start:]
}

func uniqueStrings(items []string, max int) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" || seen[item] {
			continue
		}
		seen[item] = true
		out = append(out, item)
		if max > 0 && len(out) >= max {
			break
		}
	}
	return out
}

var memoryJSONBlockRe = regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)```")
