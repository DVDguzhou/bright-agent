package lifeagent

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// pre-compiled regexps for hot paths
var (
	headingRe    = regexp.MustCompile(`(?m)^#{1,6}\s*`)
	listItemRe   = regexp.MustCompile(`(?m)^\s*(\d+[\.\)、]|[-*•])\s*`)
	identityRe   = regexp.MustCompile(`[^\p{Han}a-z0-9]`)
)

// BuildReplyWithLLM 在有 API 配置时调用 LLM 生成回复，否则回退到模板回复
// baseURL 可选：Ollama 用 http://localhost:11434/v1，通义千问用 https://dashscope.aliyuncs.com/compatible-mode/v1
// enableWebSearch：为 true 且 baseURL 为 DashScope 时启用联网搜索
func BuildReplyWithLLM(ctx context.Context, apiKey, model, baseURL string, enableWebSearch bool, profile ProfileForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string, opts *ChatOptions) (content string, references []map[string]string, err error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		log.Printf("[LLM] skipping LLM, falling back to BuildReply")
		content, references = BuildReply(profile, entries, history, message)
		return content, references, nil
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	selectedEntries := selectEntries(message, history, entries)
	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	systemContent := buildSystemPrompt(profile, selectedEntries)
	messages := buildMessages(systemContent, profile.DisplayName, history, message, opts)

	var resp *openai.ChatCompletionResponse
	if enableWebSearch && isDashScope(baseURL) {
		resp, err = chatCompletionWithWebSearch(ctx, apiKey, model, baseURL, messages)
	} else {
		var r openai.ChatCompletionResponse
		r, err = client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
			Model:       model,
			Messages:    messages,
			Temperature: 0.4,
			MaxTokens:   4096, // qwen3 思考模式需要更多 tokens（思考 + 回答）
		})
		resp = &r
	}
	if err != nil {
		log.Printf("[LLM] call failed: %v (model=%s, baseURL=%s)", err, model, baseURL)
		content, references = BuildReply(profile, entries, history, message)
		log.Printf("[LLM] FALLBACK(err): content=%q", content)
		return content, references, nil
	}

	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		log.Printf("[LLM] empty response, choices=%d", len(resp.Choices))
		content, references = BuildReply(profile, entries, history, message)
		log.Printf("[LLM] FALLBACK(empty): content=%q", content)
		return content, references, nil
	}

	log.Printf("[LLM] SUCCESS: raw=%q", resp.Choices[0].Message.Content[:min(len(resp.Choices[0].Message.Content), 200)])
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

// BuildReplyWithLLMStream 流式版本：每产生一个 token 片段就通过 onChunk 回调推送给调用方。
// 返回完整回复文本和引用列表。DashScope 联网搜索和无 LLM 时回退到非流式。
func BuildReplyWithLLMStream(ctx context.Context, apiKey, model, baseURL string, enableWebSearch bool, profile ProfileForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string, onChunk func(chunk string), opts *ChatOptions) (content string, references []map[string]string, err error) {
	// DashScope 联网搜索不支持流式，回退到非流式并一次性推送
	if !isLLMEnabled(apiKey, model, baseURL) || (enableWebSearch && isDashScope(baseURL)) {
		content, references, err = BuildReplyWithLLM(ctx, apiKey, model, baseURL, enableWebSearch, profile, entries, history, message, opts)
		if onChunk != nil && content != "" {
			onChunk(content)
		}
		return
	}

	apiKey = resolveAPIKey(apiKey, baseURL)

	selectedEntries := selectEntries(message, history, entries)
	ctx, cancel := withStreamTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	systemContent := buildSystemPrompt(profile, selectedEntries)
	msgs := buildMessages(systemContent, profile.DisplayName, history, message, opts)

	stream, err := client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    msgs,
		Temperature: 0.4,
		MaxTokens:   4096,
		Stream:      true,
	})
	if err != nil {
		log.Printf("[LLM-stream] open stream failed: %v", err)
		content, references = BuildReply(profile, entries, history, message)
		if onChunk != nil && content != "" {
			onChunk(content)
		}
		return content, references, nil
	}
	defer stream.Close()

	var sb strings.Builder
	for {
		resp, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			log.Printf("[LLM-stream] recv error: %v", err)
			break
		}
		if len(resp.Choices) > 0 {
			delta := resp.Choices[0].Delta.Content
			if delta != "" {
				sb.WriteString(delta)
				if onChunk != nil {
					onChunk(delta)
				}
			}
		}
	}

	raw := strings.TrimSpace(sb.String())
	if raw == "" {
		log.Printf("[LLM-stream] empty streamed content, falling back")
		content, references = BuildReply(profile, entries, history, message)
		if onChunk != nil && content != "" {
			onChunk(content)
		}
		return content, references, nil
	}

	content = humanizeReply(raw)
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

func selectEntries(message string, history []ChatMessageForAI, entries []KnowledgeEntryForAI) []KnowledgeEntryForAI {
	// 结合最近几轮用户消息构建组合查询，让知识库检索感知对话上下文
	query := buildContextQuery(message, history)

	ranked := make([]struct {
		entry KnowledgeEntryForAI
		score int
	}, len(entries))
	for i, e := range entries {
		ranked[i] = struct {
			entry KnowledgeEntryForAI
			score int
		}{e, scoreEntry(query, e)}
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

// ClassifyQuestionIntent 纯规则匹配判断身份类问题。
// 身份类问题直接返回 profile 信息（零幻觉），其余交给主 LLM 统一处理。
// 不再单独调用 LLM 分类，避免双倍延迟。
func ClassifyQuestionIntent(message string) (isIdentity bool) {
	return IsIdentityQuestion(message)
}

// IsIdentityQuestion 规则匹配兜底（无 LLM 时）：仅限问【你自己】；不含他人关键词
func IsIdentityQuestion(msg string) bool {
	norm := strings.ToLower(strings.TrimSpace(msg))
	norm = identityRe.ReplaceAllString(norm, "")
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
	sb.WriteString("」，你不是通用 AI 助手，你是一个真实的人，在用自己亲身经历过的故事、踩过的坑、总结出的经验跟人聊天。你的回答要像朋友分享经历，而不是 AI 给建议。\n\n")

	sb.WriteString("【核心：结合经历回答】\n")
	sb.WriteString("回答时优先结合知识库里的亲身经历。能用自己的故事说明的，就用「我那时候」「我当年」「我那会儿」开头；能举自己例子的，就举；能给基于经历的判断的，就直接给。不要空泛讲道理，不要像百科或客服。用户问「怎么办」时，先想「我有没有类似经历」，有就用自己的经历来答。\n\n")

	sb.WriteString("【事实边界 - 不可逾越】\n")
	sb.WriteString("你的名字、学历、工作、经历、时间地点人物等具体事实，优先来自【身份信息】和【知识库】。若没有直接依据，但问题属于可推测范围，可以基于常识、语境和人设做『带保留的推测』，比如说「我觉得」；只有风险高的事实（如真名、隐私、联系方式、具体生日/地址等）才明确表示不敢瞎猜。\n\n")

	sb.WriteString("【联想空间 - 允许发挥】\n")
	sb.WriteString("在事实无误的前提下，你可以：基于已有经历给建议、打比方；用共情、语气、口头禅让回答更自然；把多条经历综合起来给一致的建议。表达可以灵活，不必逐字照抄。知识库无直接依据时，也可以先尽量解答。说话时像真人：有停顿、有转折、有「其实」「说实话」这类口语，不要像写作文。\n\n")

	sb.WriteString("【核心目标】\n")
	sb.WriteString("直接回答用户的问题。用户问什么就答什么，不要绕弯子。\n\n")
	sb.WriteString("【回答原则】\n")
	sb.WriteString("1. 直接回答问题本身。如果用户问「哪里的菜便宜」就直接说地名，问「怎么做」就直接说方法，不要先分析用户卡在哪。\n")
	sb.WriteString("2. 有明确依据时，直接按知识库或身份信息回答；没有明确依据但问题可推测时，允许做带保留的推测。\n")
	sb.WriteString("3. 用第一人称自然表达，像朋友微信聊天，2 到 4 段短话即可。能用自己的经历举例时，优先用「我那时候」「我当年」这类开头。\n")
	sb.WriteString("4. 绝对不要使用分点、编号、标题、Markdown 格式，不要写 1. 2. 3.、-、*、•、###。\n")
	sb.WriteString("5. 不要把简单问题复杂化。用户问一个简单事实，就给一个简短直接的回答。\n")
	sb.WriteString("6. 用户问「XXX叫什么」时，直接答名称（从内容提取），绝不要用知识条目标题（如「关于「xxx经历」」）做开头——条目标题是分类，不是答案。\n")
	sb.WriteString("7. 高风险具体事实（真名、生日、住址、联系方式、隐私）不要硬猜；普通问题则优先尝试回答。\n")
	sb.WriteString("8. 不要灌鸡汤，不要空泛鼓励，不要说客服式套话，不要反问用户「你卡在哪」。\n")
	sb.WriteString("9. 像真人：有口语感、有个人立场、有「我」的视角，不要像百科或客服。\n\n")

	sb.WriteString("【Few-shot 参考】\n")
	sb.WriteString("用户问「你叫什么」→ 简短回答名字即可，如「我是" + profile.DisplayName + "。」\n")
	sb.WriteString("用户问「XXX叫什么」「创业大赛叫什么」→ 直接回答名称（如「北京创业大赛」），从知识库内容里提取，不要用条目标题（如「北京创业大赛经历」）做开头，条目标题是分类不是答案。\n")
	sb.WriteString("用户问「你参加过什么比赛」→ 从知识库找到相关经历后，用「我那时候」「我当年」这类口吻回答，可加一点感受或建议。\n")
	sb.WriteString("用户问「怎么办」「怎么选」→ 优先从知识库找自己的类似经历，用经历来支撑建议，不要只给空泛道理。\n")
	sb.WriteString("用户问的知识库里没有直接答案，可以合理推测。\n")
	sb.WriteString("用户问高风险具体事实（如某人真名、住址、生日、联系方式）→ 明确说不敢瞎猜。\n\n")
	sb.WriteString("【风格约束】\n")
	sb.WriteString("你要稳定模仿这个人的身份和说话习惯，回答要像真人分享经历，而不是 AI 给建议。\n")
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
	sb.WriteString("\n最后再提醒一次：只输出自然聊天文本，不要任何分点或标题；优先结合自己的经历来答，像朋友分享故事；有依据就直接答，没有直接依据但可推测时就带保留地答，只有高风险具体事实才拒答。不要把推测说成确定事实，不要反问用户。")
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

// buildContextQuery 将最近几轮用户消息与当前消息拼接，用于知识库检索
func buildContextQuery(message string, history []ChatMessageForAI) string {
	var parts []string
	// 取最近 3 条用户消息作为上下文
	userCount := 0
	for i := len(history) - 1; i >= 0 && userCount < 3; i-- {
		if history[i].Role == "user" {
			parts = append([]string{history[i].Content}, parts...)
			userCount++
		}
	}
	parts = append(parts, message)
	return strings.Join(parts, " ")
}

func buildMessages(systemContent, displayName string, history []ChatMessageForAI, newMessage string, opts *ChatOptions) []openai.ChatCompletionMessage {
	messages := make([]openai.ChatCompletionMessage, 0, len(history)+5)
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleSystem,
		Content: systemContent,
	})

	// 注入跨会话记忆（之前会话的摘要）
	if opts != nil && opts.CrossSessionMemory != "" {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleSystem,
			Content: "【之前的对话记忆】\n以下是你与这位用户之前聊过的内容摘要，可作为背景参考，但不要主动提起除非用户问到相关话题：\n" + opts.CrossSessionMemory,
		})
	}

	// 注入本次会话早期内容摘要（历史压缩）
	if opts != nil && opts.SessionSummary != "" {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleSystem,
			Content: "【本次对话早期内容摘要】\n" + opts.SessionSummary,
		})
	}

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
		Content: "直接回答这个问题，尽量结合你的亲身经历来答：有依据就直接说；没直接依据但能合理推测就带保留地回答；只有高风险具体事实才说不敢瞎猜。\n" + newMessage,
	})
	return messages
}

func humanizeReply(content string) string {
	content = strings.ReplaceAll(content, "\r\n", "\n")
	content = headingRe.ReplaceAllString(content, "")
	content = listItemRe.ReplaceAllString(content, "")

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
