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
3. **示范回答**：从消息样本中挑选 3-5 条最能代表说话风格的消息（优先选有口头禅、有态度、有情绪的）
4. **知识库内容**：从聊天内容中提取有价值的经历、观点、建议，作为知识库条目

输出格式（必须严格遵循 JSON，不要输出其他内容）：
{
  "reply": "给用户的自然语言总结，描述你从聊天记录中分析出的风格特点",
  "changes": {
    "personaArchetype": "角色类型，要具体，如：嘴硬心软的毒舌闺蜜、稳重但偶尔调皮的技术大哥",
    "toneStyle": "语气风格，必须包含具体行为描述，如：喜欢用省略号留白，感叹号多，偶尔用emoji，句子偏短",
    "responseStyle": "回答习惯，如：短句连发型，一条消息2-3句，先给结论再补一句解释，经常用反问",
    "exampleReplies": ["从样本中挑选3-5条最有代表性的原话，不要修改原文，优先选有口头禅/语气词/态度的"],
    "forbiddenPhrases": ["根据这个人的说话风格，列出TA绝对不会说的表达，如：希望对你有帮助、我理解你的感受、让我们一起"],
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
1. personaArchetype 要具体到性格细节，不要泛泛的"温和耐心"。从聊天记录里找证据：说话直不直、会不会吐槽、爱不爱开玩笑、情绪外露还是克制。
2. toneStyle 必须包含可执行的具体描述，不要只写"直接一点"。要写清楚：句子平均多长、爱用什么标点、有没有口头禅、用不用emoji、说话完整还是省略主语。
3. responseStyle 要描述回答的结构习惯：先说结论还是先铺垫？喜欢举例还是直接判断？一条消息通常几句话？
4. exampleReplies 挑 3-5 条，必须是原话不修改。优先选：(a) 有口头禅/语气词的, (b) 有明确态度/观点的, (c) 能体现说话节奏的。
5. forbiddenPhrases 根据此人风格，列出AI常见但此人绝不会说的套话（如"希望对你有帮助""这是个好问题""我理解你的感受"等），至少列3条。
6. knowledgeAdd 只提取有实质内容的经历、观点、建议，不要编造。没有就空数组。
7. 分析要基于聊天记录的实际数据，不要过度推断。
8. 只输出这一个 JSON 对象，不要 markdown 代码块、不要额外说明。`

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
		Temperature:         safeTemperature(model, 0.3),
		MaxCompletionTokens: 2000,
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
