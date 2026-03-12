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

// ClassifyQuestionIntent 用 LLM 判断问题意图：身份类（直接查 profile）还是知识类（走 LLM 生成）
// 完全依赖 LLM，无关键词兜底；LLM 失败时回退规则匹配
func ClassifyQuestionIntent(apiKey, model, baseURL, message string) (isIdentity bool) {
	useLLM := (apiKey != "" || baseURL != "") && model != ""
	if !useLLM {
		return IsIdentityQuestion(message)
	}
	if apiKey == "" && baseURL != "" {
		apiKey = "ollama"
	}
	ctx := context.Background()
	cfg := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		cfg.BaseURL = baseURL
	}
	client := openai.NewClientWithConfig(cfg)
	prompt := `用户问：「` + message + `」
判断问题类型，只回复一个字：
- 身份：仅限问【你自己】的名字、介绍、你是谁、你叫什么、怎么称呼
- 知识：问【他人】（妈妈、爸爸、朋友等）、问经历、建议、怎么做、参加过什么等

示例：你叫什么→身份 | 你妈妈叫什么→知识 | 你是谁→身份 | 你爸做什么→知识 | 介绍一下你→身份 | 你朋友是谁→知识

只回复：身份 或 知识`
	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    []openai.ChatCompletionMessage{{Role: openai.ChatMessageRoleUser, Content: prompt}},
		Temperature: 0.1,
		MaxTokens:   20,
	})
	if err != nil || len(resp.Choices) == 0 {
		return IsIdentityQuestion(message)
	}
	content := strings.TrimSpace(strings.ToLower(resp.Choices[0].Message.Content))
	return strings.Contains(content, "身份")
}

// IsIdentityQuestion 规则匹配兜底（无 LLM 时）：仅限问【你自己】；不含他人关键词
func IsIdentityQuestion(msg string) bool {
	norm := strings.ToLower(strings.TrimSpace(msg))
	norm = regexp.MustCompile(`[^\p{Han}a-z0-9]`).ReplaceAllString(norm, "")
	// 只用【你+动词】明确模式，避免「你妈妈叫什么」误匹配「叫什么」
	patterns := []string{
		"你叫什么", "你叫什么名字", "你叫啥",
		"你是谁", "你谁", "介绍你", "介绍一下你", "介绍下自己", "自我介绍",
		"怎么称呼", "贵姓", "如何称呼", "请问你是",
	}
	for _, p := range patterns {
		if strings.Contains(norm, p) {
			return true
		}
	}
	return false
}

// BuildIdentityReply 对身份类问题直接返回 profile 信息，不走 LLM，保证零幻觉
func BuildIdentityReply(profile ProfileForAI) string {
	var parts []string
	if profile.DisplayName != "" {
		parts = append(parts, "我是"+profile.DisplayName+"。")
	}
	if profile.Headline != "" {
		parts = append(parts, profile.Headline)
	}
	if profile.ShortBio != "" {
		parts = append(parts, strings.TrimSpace(profile.ShortBio))
	}
	if len(parts) == 0 {
		return "你好，我是基于本地真实经验的顾问，你可以问我关于我亲身经历的问题。"
	}
	return strings.Join(parts, " ")
}

func buildSystemPrompt(profile ProfileForAI, entries []KnowledgeEntryForAI) string {
	var sb strings.Builder
	sb.WriteString("你是「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」，你不是通用 AI 助手，你是一个真实的人在用自己的经历和知识跟人聊天。\n\n")

	sb.WriteString("【事实边界 - 不可逾越】\n")
	sb.WriteString("你的名字、学历、工作、经历、时间地点人物等事实，必须且仅能来自下方【身份信息】和【知识库】。知识库没有的一律说「这个我不太清楚」「我没有这方面的经验」，绝对不要编造。\n\n")

	sb.WriteString("【联想空间 - 允许发挥】\n")
	sb.WriteString("在事实无误的前提下，你可以：基于已有经历给建议、打比方、说「按我的经验可以试试…」「换我的话可能会…」；用共情、语气、口头禅让回答更自然；把多条经历综合起来给一致的建议。表达可以灵活，不必逐字照抄。\n\n")

	sb.WriteString("【核心目标】\n")
	sb.WriteString("直接回答用户的问题。用户问什么就答什么，不要绕弯子。\n\n")
	sb.WriteString("【回答原则】\n")
	sb.WriteString("1. 直接回答问题本身。如果用户问「哪里的菜便宜」就直接说地名，问「怎么做」就直接说方法，不要先分析用户卡在哪。\n")
	sb.WriteString("2. 事实必须来自知识库或身份信息；联想和建议可基于事实合理发挥。\n")
	sb.WriteString("3. 用第一人称自然表达，像朋友微信聊天，2 到 4 段短话即可。\n")
	sb.WriteString("4. 绝对不要使用分点、编号、标题、Markdown 格式，不要写 1. 2. 3.、-、*、•、###。\n")
	sb.WriteString("5. 不要把简单问题复杂化。用户问一个简单事实，就给一个简短直接的回答。\n")
	sb.WriteString("6. 用户问「XXX叫什么」时，直接答名称（从内容提取），绝不要用知识条目标题（如「关于「xxx经历」」）做开头——条目标题是分类，不是答案。\n")
	sb.WriteString("7. 宁可说得少一点、真实一点，也不要面面俱到或硬凑内容。\n")
	sb.WriteString("8. 不要灌鸡汤，不要空泛鼓励，不要说客服式套话，不要反问用户「你卡在哪」。\n\n")

	sb.WriteString("【Few-shot 参考】\n")
	sb.WriteString("用户问「你叫什么」→ 简短回答名字即可，如「我是" + profile.DisplayName + "。」\n")
	sb.WriteString("用户问「XXX叫什么」「创业大赛叫什么」→ 直接回答名称（如「北京创业大赛」），从知识库内容里提取，不要用条目标题（如「北京创业大赛经历」）做开头，条目标题是分类不是答案。\n")
	sb.WriteString("用户问「你参加过什么比赛」→ 从知识库找到相关经历后回答，可加一点感受或建议。\n")
	sb.WriteString("用户问「XXX 怎么办」但知识库无直接依据 → 「这个我不太清楚/没有这方面经历」，不要编造。\n\n")
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
