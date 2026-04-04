package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// ModifyIntent 表示用户通过对话表达的修改意图
type ModifyIntent struct {
	Reply   string              `json:"reply"`   // 给用户的自然语言回复
	Changes *ModifyIntentChanges `json:"changes"` // 要应用的修改，nil 表示无修改
}

type ModifyIntentChanges struct {
	ExpertiseTags    []string `json:"expertiseTags,omitempty"`
	SampleQuestions  []string `json:"sampleQuestions,omitempty"`
	WelcomeMessage   string   `json:"welcomeMessage,omitempty"`
	PersonaArchetype string   `json:"personaArchetype,omitempty"`
	ToneStyle        string   `json:"toneStyle,omitempty"`
	ResponseStyle    string   `json:"responseStyle,omitempty"`
	ForbiddenPhrases []string `json:"forbiddenPhrases,omitempty"`
	ExampleReplies   []string `json:"exampleReplies,omitempty"`
	KnowledgeAdd     []struct {
		Category string   `json:"category"`
		Title    string   `json:"title"`
		Content  string   `json:"content"`
		Tags     []string `json:"tags"`
	} `json:"knowledgeAdd,omitempty"`
}

// InterpretModificationIntent 用 LLM 解析用户的修改意图，返回 structured changes
func InterpretModificationIntent(ctx context.Context, apiKey, model, baseURL string, currentState string, chatHistory []ChatMessageForAI, userMessage string) (*ModifyIntent, error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		return &ModifyIntent{
			Reply:   "当前未配置 AI，无法理解你的修改意图。请到「编辑资料」里直接修改。",
			Changes: nil,
		}, nil
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	systemPrompt := `你是帮助 Agent 创建者修改其人生 Agent 的助手。用户会通过自然语言说明想怎么改，你要理解意图并输出一个 JSON 对象。

输出格式（必须严格遵循，不要输出其他内容）：
{
  "reply": "给用户的自然语言回复，确认你理解了并会/已执行",
  "changes": {
    "expertiseTags": ["标签1", "标签2"],
    "sampleQuestions": ["问题1", "问题2"],
    "welcomeMessage": "欢迎语内容",
    "personaArchetype": "角色类型",
    "toneStyle": "语气",
    "responseStyle": "回答习惯",
    "forbiddenPhrases": ["禁止1", "禁止2"],
    "exampleReplies": ["示范1", "示范2"],
    "knowledgeAdd": [{ "category": "分类", "title": "标题", "content": "内容", "tags": ["标签"] }]
  }
}

规则：
1. 只有当用户明确表达修改意图时，才在 changes 里填对应字段；没有要改的字段不要写。
2. 用户说"改成"、"更新为"、"换成"时，替换整个字段；说"加上"、"添加"时，对数组做追加（knowledgeAdd 用于新增知识条目）。
3. expertiseTags、sampleQuestions 最多 8/6 个；exampleReplies 最多 3 个；forbiddenPhrases 最多 8 个。
4. 若用户只是询问状态或闲聊、没有修改意图，reply 正常回复，changes 设为 null。
5. 只输出这一个 JSON 对象，不要 markdown 代码块、不要额外说明。`

	userContent := fmt.Sprintf("【当前 Agent 状态】\n%s\n\n【用户新消息】\n%s", currentState, userMessage)

	messages := make([]openai.ChatCompletionMessage, 0, len(chatHistory)+2)
	messages = append(messages, openai.ChatCompletionMessage{Role: openai.ChatMessageRoleSystem, Content: systemPrompt})
	for _, m := range chatHistory {
		role := openai.ChatMessageRoleUser
		if m.Role == "assistant" {
			role = openai.ChatMessageRoleAssistant
		}
		messages = append(messages, openai.ChatCompletionMessage{Role: role, Content: m.Content})
	}
	messages = append(messages, openai.ChatCompletionMessage{Role: openai.ChatMessageRoleUser, Content: userContent})

	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.2,
		MaxTokens:   1200,
	})
	if err != nil {
		return nil, err
	}
	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		return &ModifyIntent{Reply: "没理解你的意思，可以再说具体一点吗？", Changes: nil}, nil
	}

	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	raw = extractJSON(raw)

	var intent ModifyIntent
	if err := json.Unmarshal([]byte(raw), &intent); err != nil {
		return &ModifyIntent{
			Reply:   strings.TrimSpace(resp.Choices[0].Message.Content),
			Changes: nil,
		}, nil
	}
	return &intent, nil
}

func extractJSON(s string) string {
	// 尝试提取 {} 包裹的 JSON
	start := strings.Index(s, "{")
	if start < 0 {
		return s
	}
	// 简单括号匹配
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

