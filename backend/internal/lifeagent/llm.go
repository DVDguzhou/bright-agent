package lifeagent

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// BuildReplyWithLLM 在有 API 配置时调用 LLM 生成回复，否则回退到模板回复
// baseURL 可选：Ollama 用 http://localhost:11434/v1，Groq 用 https://api.groq.com/openai/v1
func BuildReplyWithLLM(apiKey, model, baseURL string, profile ProfileForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string) (content string, references []map[string]string, err error) {
	useLLM := (apiKey != "" || baseURL != "") && model != ""
	if !useLLM {
		content, references = BuildReply(profile, entries, history, message)
		return content, references, nil
	}
	if apiKey == "" && baseURL != "" {
		apiKey = "ollama" // Ollama 等本地服务不需要真 key，但客户端要求非空
	}

	selectedEntries := selectEntries(message, entries)
	ctx := context.Background()
	cfg := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		cfg.BaseURL = baseURL
	}
	client := openai.NewClientWithConfig(cfg)

	systemContent := buildSystemPrompt(profile, selectedEntries)
	messages := buildMessages(systemContent, profile.DisplayName, history, message)

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    messages,
		Temperature: 0.4,
		MaxTokens:   1000, // 降低可加快生成，一般 500-800 字足够
	})
	if err != nil {
		content, references = BuildReply(profile, entries, history, message)
		return content, references, nil
	}

	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		content, references = BuildReply(profile, entries, history, message)
		return content, references, nil
	}

	content = humanizeReply(strings.TrimSpace(resp.Choices[0].Message.Content))
	references = make([]map[string]string, len(selectedEntries))
	for i, e := range selectedEntries {
		excerpt := normalizeSnippet(firstSentence(e.Content, 80))
		if excerpt == "" {
			excerpt = "基于已有经历给到的一条可执行建议。"
		}
		references[i] = map[string]string{
			"id": e.ID, "category": e.Category, "title": e.Title,
			"excerpt": excerpt,
		}
	}
	return content, references, nil
}

func selectEntries(message string, entries []KnowledgeEntryForAI) []KnowledgeEntryForAI {
	ranked := make([]struct {
		entry KnowledgeEntryForAI
		score int
	}, len(entries))
	for i, e := range entries {
		ranked[i] = struct {
			entry KnowledgeEntryForAI
			score int
		}{e, scoreEntry(message, e)}
	}
	for i := 0; i < len(ranked)-1; i++ {
		for j := i + 1; j < len(ranked); j++ {
			if ranked[j].score > ranked[i].score {
				ranked[i], ranked[j] = ranked[j], ranked[i]
			}
		}
	}
	var top []KnowledgeEntryForAI
	topScore := 0
	for _, r := range ranked {
		if r.score > 0 {
			if topScore == 0 {
				topScore = r.score
			}
			top = append(top, r.entry)
			if len(top) >= 4 {
				break
			}
			if len(top) >= 3 && r.score < topScore/2 {
				break
			}
		}
	}
	if len(top) > 0 {
		return top
	}
	if len(entries) >= 3 {
		return entries[:3]
	}
	if len(entries) >= 2 {
		return entries[:2]
	}
	if len(entries) > 0 {
		return entries
	}
	return nil
}

func buildSystemPrompt(profile ProfileForAI, entries []KnowledgeEntryForAI) string {
	var sb strings.Builder
	sb.WriteString("你是「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」，你不是通用 AI 助手，你是一个真实的人在用自己的经历和知识跟人聊天。\n\n")
	sb.WriteString("【核心目标】\n")
	sb.WriteString("直接回答用户的问题。用户问什么就答什么，不要绕弯子。\n\n")
	sb.WriteString("【回答原则】\n")
	sb.WriteString("1. 直接回答问题本身。如果用户问「哪里的菜便宜」就直接说地名，问「怎么做」就直接说方法，不要先分析用户卡在哪。\n")
	sb.WriteString("2. 只根据知识库里有的内容回答。知识库里有答案就直接说，没有就明确说「这个我不太清楚」或「我没有这方面的经验」，绝对不要编造。\n")
	sb.WriteString("3. 用第一人称自然表达，像朋友微信聊天，2 到 4 段短话即可。\n")
	sb.WriteString("4. 绝对不要使用分点、编号、标题、Markdown 格式，不要写 1. 2. 3.、-、*、•、###。\n")
	sb.WriteString("5. 不要把简单问题复杂化。用户问一个简单事实，就给一个简短直接的回答。\n")
	sb.WriteString("6. 宁可说得少一点、真实一点，也不要面面俱到或硬凑内容。\n")
	sb.WriteString("7. 不要灌鸡汤，不要空泛鼓励，不要说客服式套话，不要反问用户「你卡在哪」。\n\n")
	sb.WriteString("【风格约束】\n")
	sb.WriteString("你要稳定模仿这个人的身份和说话习惯。\n")
	if profile.PersonaArchetype != "" {
		sb.WriteString("角色原型: ")
		sb.WriteString(profile.PersonaArchetype)
		sb.WriteString("\n")
	}
	if profile.MBTI != "" {
		sb.WriteString("MBTI: ")
		sb.WriteString(profile.MBTI)
		sb.WriteString("（只作为辅助气质，不要刻板化）\n")
	}
	if profile.ToneStyle != "" {
		sb.WriteString("语气: ")
		sb.WriteString(profile.ToneStyle)
		sb.WriteString("\n")
	}
	if profile.ResponseStyle != "" {
		sb.WriteString("回答习惯: ")
		sb.WriteString(profile.ResponseStyle)
		sb.WriteString("\n")
	}
	if len(profile.ForbiddenPhrases) > 0 {
		sb.WriteString("禁止使用这些套话:\n")
		appendArrayLines(&sb, profile.ForbiddenPhrases)
	}
	if len(profile.ExampleReplies) > 0 {
		sb.WriteString("下面是这个人平时会怎么回，重点模仿语气、句长、节奏、口头习惯，不要逐字照抄:\n")
		for i, reply := range profile.ExampleReplies {
			sb.WriteString(fmt.Sprintf("示范回答%d:\n%s\n", i+1, strings.TrimSpace(reply)))
		}
		sb.WriteString("\n")
	}
	sb.WriteString("\n【身份信息】\n")
	sb.WriteString("名字: ")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("\n一句话介绍: ")
	sb.WriteString(profile.Headline)
	sb.WriteString("\n目标人群: ")
	sb.WriteString(profile.Audience)
	sb.WriteString("\n欢迎语风格: ")
	sb.WriteString(profile.WelcomeMessage)
	if profile.NotSuitableFor != "" {
		sb.WriteString("\n不擅长/不回答: ")
		sb.WriteString(profile.NotSuitableFor)
	}
	sb.WriteString("\n\n--- 知识库（回答时依据的素材，可组合、推理、转化）---\n\n")

	for i, e := range entries {
		sb.WriteString(fmt.Sprintf("[%d] %s（%s）\n%s\n\n", i+1, e.Title, e.Category, e.Content))
	}
	sb.WriteString("\n最后再提醒一次：只输出自然聊天文本，不要任何分点或标题；有依据再说，没有依据就明确说没有相关经验。用户问什么就答什么，不要绕弯子，不要反问用户。")
	return sb.String()
}

func appendArrayLines(sb *strings.Builder, items []string) {
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" {
			continue
		}
		sb.WriteString("「")
		sb.WriteString(item)
		sb.WriteString("」\n")
	}
}

func buildMessages(systemContent, displayName string, history []ChatMessageForAI, newMessage string) []openai.ChatCompletionMessage {
	messages := make([]openai.ChatCompletionMessage, 0, len(history)+3)
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleSystem,
		Content: systemContent,
	})

	for _, m := range history {
		role := openai.ChatMessageRoleUser
		if m.Role == "assistant" {
			role = openai.ChatMessageRoleAssistant
		}
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    role,
			Content: m.Content,
		})
	}

	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: "直接回答这个问题，知识库里有就说，没有就说不知道：\n" + newMessage,
	})
	return messages
}

func humanizeReply(content string) string {
	content = strings.ReplaceAll(content, "\r\n", "\n")
	content = regexp.MustCompile(`(?m)^#{1,6}\s*`).ReplaceAllString(content, "")
	content = regexp.MustCompile(`(?m)^\s*(\d+[\.\)、]|[-*•])\s*`).ReplaceAllString(content, "")

	lines := strings.Split(content, "\n")
	var cleaned []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		cleaned = append(cleaned, line)
	}
	if len(cleaned) == 0 {
		return ""
	}
	return strings.Join(cleaned, "\n\n")
}
