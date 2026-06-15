package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// ModifyIntent 表示用户通过对话表达的修改意图
type ModifyIntent struct {
	Reply   string               `json:"reply"`   // 给用户的自然语言回复
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

【关于上下文格式】
- "当前 Agent 状态" 里包含骨架字段（名称/语气/角色/欢迎语/禁忌/示范等）。
- "知识库目录" 列出全部知识条目的标题（含分类、标签），便于你知道已经存在什么；标星 ★ 的是与本轮用户消息最相关的条目。
- "相关知识详情" 仅展开标星条目的内容摘要，供你判断是否要新增或保持原样。
- 当用户提到一个看起来已经记在某个标题里的话题（如：标题 "关于张雪峰看法" vs 用户说 "我喜欢张雪峰"），优先认为这是补充/重申，避免重复添加完全相同含义的条目。

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
1. 【入库决策】你必须对「用户新消息」逐条判断：是否应写入 knowledgeAdd。这是调教的核心；不要默认全部入库，也不要默认全部不入库。
2. 【应入库】个人经历、观点、技巧、故事、可帮助他人回答的具体信息；用户明确要求「记录/添加/记住」的内容；**当下状态/进行时描述**（如「正在…」「我现在…」「刚才…」），用于说明某时某刻在做什么——category 用「状态」，title 概括当时在做什么，content 写清时间与状态（可引用「本条调教时间」）。
3. 【不入库】纯寒暄（你好/谢谢/在吗）、**仅询问 Agent 系统元信息**（有多少条知识/几个标签/当前列表）、明确跳过（暂无/无/没有/跳过）、与知识库已有条目含义完全重复的内容。
4. 【改字段】用户说「改成/更新/换成」时替换对应 profile 字段；说「加上/添加」时对数组追加。expertiseTags、sampleQuestions 最多 8/6 个；exampleReplies 最多 3 个；forbiddenPhrases 最多 8 个。
5. 【时间线追问】关键人生经历（如放弃保研、毕业、入职、转行、创业、赚到第一桶金、拿 offer、搬城市、申请/录取等）如果用户没说清发生时间，仍可先写入 knowledgeAdd，但 reply 要轻轻追问时间，例如「这段是大四那阵，还是毕业后？」；不要自己编年份。
6. 【回复】reply 30 字内：入库了说「已记成一条新知识」；未入库简要说明原因；改了字段说「已更新 xxx」。禁止回复「无修改需求」。
7. 若无任何变更（既无 knowledgeAdd 也无字段修改），changes 设为 null。
8. 只输出这一个 JSON 对象，不要 markdown 代码块、不要额外说明。`

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

	// 不再叠加内部 60s 超时：调用方（如 SSE handler）会根据链路状况自带 ctx 截止时间，
	// 经 packyapi 等中转时整体耗时可能超过 60s。
	client := getClient(apiKey, baseURL)

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:               model,
		Messages:            messages,
		Temperature:         safeTemperature(model, 0.2),
		MaxCompletionTokens: 1200,
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

var coEditRecordLoc = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return time.FixedZone("CST", 8*3600)
	}
	return loc
}()

// FormatCoEditRecordedAt 调教入库用的时间标注（东八区）。
func FormatCoEditRecordedAt(t time.Time) string {
	return t.In(coEditRecordLoc).Format("2006-01-02 15:04")
}

// StampKnowledgeAddRecordedAt 为 AI 决定入库的条目补上记录时间前缀，便于追溯「何时在做什么」。
func StampKnowledgeAddRecordedAt(ch *ModifyIntentChanges, recordedAt time.Time) {
	if ch == nil || len(ch.KnowledgeAdd) == 0 {
		return
	}
	stamp := FormatCoEditRecordedAt(recordedAt)
	prefix := "[" + stamp + "] "
	for i := range ch.KnowledgeAdd {
		add := &ch.KnowledgeAdd[i]
		content := strings.TrimSpace(add.Content)
		if content == "" {
			continue
		}
		if !strings.HasPrefix(content, "[") || !strings.Contains(content, stamp[:10]) {
			add.Content = prefix + content
		}
		if strings.TrimSpace(add.Category) == "" {
			add.Category = "经验"
		}
	}
}
