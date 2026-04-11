package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// CreateQuestionInput 创建流程中「生成下一个问题」的请求
type CreateQuestionInput struct {
	BasicInfo struct {
		DisplayName string `json:"displayName"`
		Headline    string `json:"headline"`
		ShortBio    string `json:"shortBio"`
	} `json:"basicInfo"`
	ChatHistory      []ChatMessageForAI `json:"chatHistory"`
	KnowledgeEntries []struct {
		Category string `json:"category"`
		Title    string `json:"title"`
		Content  string `json:"content"`
	} `json:"knowledgeEntries"`
}

// CreateQuestionOutput 生成结果：下一问、或完成信号，以及暗中提取的语气风格
type CreateQuestionOutput struct {
	Done           bool            `json:"done"`                     // 是否已收集足够信息
	NextQuestion   string          `json:"nextQuestion,omitempty"`   // 下一个问题（done=false 时）
	SummaryMessage string          `json:"summaryMessage,omitempty"` // 完成时的收尾话（done=true 时）
	KnowledgeAdd   []KEntry        `json:"knowledgeAdd,omitempty"`   // 本轮回答可提炼的知识条目（AI 可选返回）
	ExtractedTone  *ToneHints      `json:"extractedTone,omitempty"`  // 从用户回复中学习的语气风格
	SuggestedTags  []string        `json:"suggestedTags,omitempty"`  // 建议的擅长标签
	FactCandidates []FactCandidate `json:"factCandidates,omitempty"` // 可升级为结构化事实的候选项
}

type KEntry struct {
	Category string   `json:"category"`
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Tags     []string `json:"tags,omitempty"`
}

type ToneHints struct {
	PersonaArchetype string `json:"personaArchetype,omitempty"`
	ToneStyle        string `json:"toneStyle,omitempty"`
	ResponseStyle    string `json:"responseStyle,omitempty"`
}

// GenerateNextCreateQuestion 根据对话历史生成下一个问题，或判断是否已收集足够信息
// 暗中从用户回复中学习其语气风格，用于后续 Agent 人格设定
func GenerateNextCreateQuestion(ctx context.Context, apiKey, model, baseURL string, input *CreateQuestionInput) (*CreateQuestionOutput, error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		return fallbackNextQuestion(input), nil
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	systemPrompt := `你是在帮助用户创建「人生 Agent」的采访助手。用户会通过对话逐步分享自己的经历、经验，你要通过提问引导他们输出全面、具体的信息。

【你的目标】
1. 根据用户已分享的内容，提出下一个追问，挖得更深、更具体（步骤、时间、数字、踩过的坑、怎么解决的）。
2. 仔细观察用户的说话风格，在 extractedTone 中给出具体描述（不是选枚举值，而是用用户实际表现来描述）。
3. 当用户已经分享了至少 2 个主题的丰富经验（有具体细节），且没有明显可追问的点时，输出 done=true，用 summaryMessage 友好收尾。

【输出格式】必须严格输出一个 JSON 对象，不要 markdown 代码块、不要额外说明：
{
  "done": false,
  "nextQuestion": "下一个问题，自然口语化，一次只问一个方向",
  "extractedTone": {
    "personaArchetype": "基于用户实际表现描述，如：说话直来直去带点自嘲的过来人、温和但有主见的学姐、嘴贫但干货多的技术人",
    "toneStyle": "基于用户实际用词描述，如：句子偏短，爱用省略号，偶尔用哈哈，不用emoji，语气比较随意口语化",
    "responseStyle": "基于用户回答习惯描述，如：先给结论再补细节，喜欢举自己例子，一段话3-5句，不爱铺垫直入主题"
  },
  "suggestedTags": ["标签1", "标签2"],
  "knowledgeAdd": [],
  "factCandidates": []
}

当 done=true 时：
{
  "done": true,
  "summaryMessage": "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」继续设置 Agent 的回答风格即可～",
  "extractedTone": { ... },
  "suggestedTags": [ ... ]
}

【规则】
- 每次只问一个问题，不要一次问多个。
- 追问要基于用户上一句或之前的内容，不要跳脱。
- 用户回答「暂无」「无」「没有」等时，可适当换个方向问，或若已有足够信息则结束。
- extractedTone 不要选枚举值，要基于用户实际回复的用词、句式、长度、语气词来具体描述。例如：用户爱用"反正""其实""说白了"这类词→写到 toneStyle 里；用户回答很长很细→写到 responseStyle 里。每轮都更新，越来越准。
- suggestedTags 最多 8 个，基于用户分享的领域提炼。
- knowledgeAdd 可选：若用户某段回复可直接作为一条「知识条目」存储（有明确 category/title/content），可填；否则留空数组。
- factCandidates 可选：若用户明确说出学校、学历、工作、城市、比赛名等事实，可抽成结构化事实候选；若不明确则留空数组。`

	// 构建对话内容
	var historyText strings.Builder
	for _, m := range input.ChatHistory {
		role := "用户"
		if m.Role == "assistant" {
			role = "助手"
		}
		historyText.WriteString(fmt.Sprintf("%s：%s\n", role, m.Content))
	}

	var entriesText strings.Builder
	for _, e := range input.KnowledgeEntries {
		entriesText.WriteString(fmt.Sprintf("- %s / %s：%s\n", e.Category, e.Title, truncate(e.Content, 120)))
	}

	basic := input.BasicInfo
	userContent := fmt.Sprintf(`【创建者基本信息】
- 名称：%s
- 一句话：%s
- 简介：%s

【已有知识条目】
%s

【对话历史】
%s

请根据以上内容，生成下一个问题或判断是否结束。只输出 JSON。`,
		basic.DisplayName,
		basic.Headline,
		truncate(basic.ShortBio, 200),
		entriesText.String(),
		historyText.String(),
	)

	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    []openai.ChatCompletionMessage{{Role: openai.ChatMessageRoleSystem, Content: systemPrompt}, {Role: openai.ChatMessageRoleUser, Content: userContent}},
		Temperature:         safeTemperature(model, 0.5),
		MaxCompletionTokens: 800,
	})
	if err != nil {
		return fallbackNextQuestion(input), nil
	}

	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		return fallbackNextQuestion(input), nil
	}

	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	raw = extractJSONFromContent(raw)

	var out CreateQuestionOutput
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return fallbackNextQuestion(input), nil
	}

	// 若 AI 未返回 summaryMessage，给默认
	if out.Done && out.SummaryMessage == "" {
		out.SummaryMessage = "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」继续设置 Agent 的回答风格即可～"
	}
	if len(out.FactCandidates) == 0 {
		out.FactCandidates = BuildStructuredFactsFromCreateQuestionOutput(&out)
	}

	return &out, nil
}

func truncate(s string, max int) string {
	r := []rune(strings.TrimSpace(s))
	if len(r) <= max {
		return string(r)
	}
	return string(r[:max]) + "..."
}

func extractJSONFromContent(s string) string {
	// 尝试从 markdown 代码块提取
	if m := jsonBlockRe.FindStringSubmatch(s); len(m) >= 2 {
		return strings.TrimSpace(m[1])
	}
	// 尝试提取 {} 包裹的 JSON
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

func fallbackNextQuestion(input *CreateQuestionInput) *CreateQuestionOutput {
	// 简单规则：若已有至少 2 条知识且对话超过 4 轮，结束
	entries := len(input.KnowledgeEntries)
	turns := len(input.ChatHistory)
	if entries >= 2 && turns >= 4 {
		return &CreateQuestionOutput{
			Done:           true,
			SummaryMessage: "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」继续设置 Agent 的回答风格即可～",
		}
	}
	// 否则给一个通用追问
	next := "还能补充一些具体经历吗？比如你当时是怎么做的、花了多久、踩过什么坑？"
	if turns == 0 {
		next = "你希望分享什么样的经验或信息？可以简单说说你擅长的领域或想帮别人解决什么问题。"
	} else if entries == 0 && turns >= 2 {
		next = "可以举个例子吗？越具体越好，比如时间、步骤、结果。"
	}
	out := &CreateQuestionOutput{Done: false, NextQuestion: next}
	out.FactCandidates = BuildStructuredFactsFromCreateQuestionOutput(out)
	return out
}

// 兼容可能的 markdown 代码块
var jsonBlockRe = regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)```")
