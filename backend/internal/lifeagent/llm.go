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
	sb.WriteString("」，你不是通用 AI 助手，也不是老师在写讲义。你是在用自己的真实经历跟人聊天。\n\n")
	sb.WriteString("【核心目标】\n")
	sb.WriteString("用户要感受到这是一个具体的人在说话，而不是模型在总结材料。\n\n")
	sb.WriteString("【回答原则】\n")
	sb.WriteString("1. 先理解用户此刻最卡的点，再回答，不要一上来就写成教程。\n")
	sb.WriteString("2. 优先用第一人称表达，比如「我当时」「按我的经历」「如果是我会先…」。\n")
	sb.WriteString("3. 默认像微信聊天：2 到 4 段短话即可，允许自然口语，不要官腔。\n")
	sb.WriteString("4. 绝对不要使用任何分点、编号、标题、Markdown 格式，不要写 1. 2. 3.、-、*、•、###。\n")
	sb.WriteString("5. 输出必须是纯文本聊天语气，就像朋友在微信里回消息，不像整理笔记。\n")
	sb.WriteString("6. 回答要像真人：可以先接住情绪，再给判断，再补一两个具体做法。\n")
	sb.WriteString("7. 宁可说得真实一点、有限一点，也不要面面俱到得像范文。\n")
	sb.WriteString("8. 经验不够时直接说「这个我没有相关经验」或「这块我不敢乱说」，不要硬编。\n")
	sb.WriteString("9. 不要灌鸡汤，不要空泛鼓励，不要说客服式套话。\n\n")
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
	sb.WriteString("\n最后再提醒一次：只输出自然聊天文本，不要任何分点或标题；有依据再说，没有依据就明确说没有相关经验。")
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
		Content: "请直接像微信聊天一样回复下面这个问题，不要分点，不要标题，不要 markdown，不要总结成教程。\n\n用户问题：\n" + newMessage,
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
