package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// ChatImportResult is the structured output from LLM analysis of chat records.
// It reuses ModifyIntentChanges so we can directly apply changes.
type ChatImportResult struct {
	Reply   string              `json:"reply"`
	Changes *ModifyIntentChanges `json:"changes"`
}

// AnalyzeChatForAgentProfile uses LLM to extract persona style and knowledge
// from parsed chat records, returning structured changes to apply.
func AnalyzeChatForAgentProfile(
	ctx context.Context,
	apiKey, model, baseURL string,
	currentState string,
	chatSummary string,
) (*ChatImportResult, error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		return &ChatImportResult{
			Reply:   "当前未配置 AI，无法分析聊天记录。",
			Changes: nil,
		}, nil
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	systemPrompt := `你是帮助 Agent 创建者通过聊天记录分析来调教其人生 Agent 的助手。

用户会提供一段微信聊天记录的统计分析和消息样本。你需要从中提取：
1. **聊天风格和语气**：口头禅、语气词偏好、标点习惯、消息长度风格、说话方式
2. **人设特征**：角色性格、回答习惯
3. **示范回答**：从消息样本中挑选 2-3 条最能代表说话风格的消息
4. **知识库内容**：从聊天内容中提取有价值的经历、观点、建议，作为知识库条目

输出格式（必须严格遵循 JSON，不要输出其他内容）：
{
  "reply": "给用户的自然语言总结，描述你从聊天记录中分析出的风格特点",
  "changes": {
    "personaArchetype": "角色类型（如：温和耐心的学长、直爽犀利的职场人、幽默段子手等）",
    "toneStyle": "语气风格描述（结合语气词、标点、表情使用习惯）",
    "responseStyle": "回答习惯描述（短句连发/长段落分析/先结论后展开等）",
    "exampleReplies": ["从样本中挑选的2-3条最有代表性的原话"],
    "forbiddenPhrases": ["如果发现明显不会说的表达风格，列出"],
    "knowledgeAdd": [
      {
        "category": "经验/观点/建议/经历",
        "title": "简短标题",
        "content": "从聊天中提取的具体内容",
        "tags": ["标签1", "标签2"]
      }
    ]
  }
}

规则：
1. personaArchetype、toneStyle、responseStyle 必须填写，基于聊天记录的实际表现。
2. exampleReplies 从消息样本中挑选最有代表性的 2-3 条原话，不要修改原文。
3. knowledgeAdd 只提取有实质内容的经历、观点、建议，不要编造。如果聊天记录中没有有价值的知识内容，knowledgeAdd 可以为空数组。
4. forbiddenPhrases 只在明显看出"不会这样说"的情况下才填，否则留空数组。
5. 分析要基于聊天记录的实际数据，不要过度推断。
6. 只输出这一个 JSON 对象，不要 markdown 代码块、不要额外说明。`

	userContent := fmt.Sprintf("【当前 Agent 状态】\n%s\n\n【聊天记录分析】\n%s", currentState, chatSummary)

	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
		{Role: openai.ChatMessageRoleUser, Content: userContent},
	}

	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.3,
		MaxTokens:   2000,
	})
	if err != nil {
		return nil, fmt.Errorf("LLM chat import analysis error: %w", err)
	}
	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		return &ChatImportResult{
			Reply:   "分析聊天记录时未获得有效结果，请重试。",
			Changes: nil,
		}, nil
	}

	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	raw = extractJSON(raw)

	var result ChatImportResult
	if err := json.Unmarshal([]byte(raw), &result); err != nil {
		return &ChatImportResult{
			Reply:   strings.TrimSpace(resp.Choices[0].Message.Content),
			Changes: nil,
		}, nil
	}
	return &result, nil
}
