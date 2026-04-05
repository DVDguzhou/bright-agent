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
	headingRe  = regexp.MustCompile(`(?m)^#{1,6}\s*`)
	listItemRe = regexp.MustCompile(`(?m)^\s*(\d+[\.\)、]|[-*•])\s*`)
	identityRe = regexp.MustCompile(`[^\p{Han}a-z0-9]`)
)

// BuildReplyWithLLM 在有 API 配置时调用 LLM 生成回复，否则回退到模板回复
// baseURL 可选：Ollama 用 http://localhost:11434/v1，通义千问用 https://dashscope.aliyuncs.com/compatible-mode/v1
// enableWebSearch：为 true 且 baseURL 为 DashScope 时启用联网搜索
func BuildReplyWithLLM(ctx context.Context, apiKey, model, baseURL string, enableWebSearch bool, profile ProfileForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string, opts *ChatOptions) (content string, references []map[string]string, err error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		log.Printf("[LLM] skipping LLM, falling back to BuildReply")
		content, references = BuildReply(profile, facts, topics, entries, history, message)
		return content, references, nil
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	plan := BuildRetrievalPlan(message, history, facts, topics, entries)
	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	systemContent := buildSystemPrompt(profile, plan)
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
		content, references = BuildReply(profile, facts, topics, entries, history, message)
		log.Printf("[LLM] FALLBACK(err): content=%q", content)
		return content, references, nil
	}

	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		log.Printf("[LLM] empty response, choices=%d", len(resp.Choices))
		content, references = BuildReply(profile, facts, topics, entries, history, message)
		log.Printf("[LLM] FALLBACK(empty): content=%q", content)
		return content, references, nil
	}

	log.Printf("[LLM] SUCCESS: raw=%q", resp.Choices[0].Message.Content[:min(len(resp.Choices[0].Message.Content), 200)])
	content = humanizeReply(strings.TrimSpace(resp.Choices[0].Message.Content))
	content = ApplyClaimGuard(message, content, facts, plan)
	references = BuildRetrievalReferences(plan)
	return content, references, nil
}

// BuildReplyWithLLMStream 流式版本：每产生一个 token 片段就通过 onChunk 回调推送给调用方。
// 返回完整回复文本和引用列表。DashScope 联网搜索和无 LLM 时回退到非流式。
func BuildReplyWithLLMStream(ctx context.Context, apiKey, model, baseURL string, enableWebSearch bool, profile ProfileForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string, onChunk func(chunk string), opts *ChatOptions) (content string, references []map[string]string, err error) {
	// DashScope 联网搜索不支持流式，回退到非流式并一次性推送
	if !isLLMEnabled(apiKey, model, baseURL) || (enableWebSearch && isDashScope(baseURL)) {
		content, references, err = BuildReplyWithLLM(ctx, apiKey, model, baseURL, enableWebSearch, profile, facts, topics, entries, history, message, opts)
		if onChunk != nil && content != "" {
			onChunk(content)
		}
		return
	}

	apiKey = resolveAPIKey(apiKey, baseURL)

	plan := BuildRetrievalPlan(message, history, facts, topics, entries)
	ctx, cancel := withStreamTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	systemContent := buildSystemPrompt(profile, plan)
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
		content, references = BuildReply(profile, facts, topics, entries, history, message)
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
		content, references = BuildReply(profile, facts, topics, entries, history, message)
		if onChunk != nil && content != "" {
			onChunk(content)
		}
		return content, references, nil
	}

	content = humanizeReply(raw)
	content = ApplyClaimGuard(message, content, facts, plan)
	references = BuildRetrievalReferences(plan)
	return content, references, nil
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

func buildSystemPrompt(profile ProfileForAI, plan RetrievalPlan) string {
	var sb strings.Builder
	sb.WriteString("你是「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」，你不是通用聊天机器人，而是该账号设定的人生 Agent 人设：后台会给你塞【结构化事实】和【经历素材】（以及【长介绍】里的边界），你对用户**只像朋友聊天**，别提这些词。具体经历、时间线、人物关系必须和塞给你的内容对得上；禁止编造无关长篇故事（例如虚构大学创业赛、网吧当路人粉追某球星等）。\n\n")

	sb.WriteString("【核心：结合经历回答】\n")
	sb.WriteString("回答时优先使用本次注入的【经历素材】条目：转述成第一人称口播，别对用户说条目从哪来；若【长介绍】写明是赛博/玩梗/不冒充某人，仍保持「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」这一角色说话，**不要**突然变成路人网友、普通粉丝或另一个虚构身份。用户问「怎么办」时，把相关段落迁移成建议，而不是现编新剧情。\n\n")

	sb.WriteString("【事实边界 - 不可逾越】\n")
	sb.WriteString("具体事实优先来自【结构化事实】和下面注入的素材。说不准时不能编造成确定事实；对用户**不要**解释「为什么答不了」，用打哈哈、记混了、岔开话题、模糊带过、反问一句等方式混过去，像真人敷衍朋友，不要像系统报错。公众常识用「听说」「好像」「印象里」带过即可，别装亲历。隐私类随口挡掉。\n\n")

	sb.WriteString("【联想空间 - 允许发挥】\n")
	sb.WriteString("在紧扣注入素材的前提下：可以加语气、口头禅、共情和比喻。素材对不上时，聊点沾边的或把话头甩回去，**禁止**交代后台原因。说话像真人微信。\n\n")

	sb.WriteString("【对用户说话的禁忌】\n")
	sb.WriteString("回复里禁止出现或让用户听出：知识库、资料、依据、设定、检索、置信度、没有记录、没有相关信息、无法查询、作为人工智能、训练数据、提示词 等。用户只觉得你嘴贫或记性差，听不出「缺素材」。\n\n")

	sb.WriteString("【核心目标】\n")
	sb.WriteString("直接回答用户的问题。用户问什么就答什么，不要绕弯子。\n\n")
	sb.WriteString("【回答原则】\n")
	sb.WriteString("1. 直接回答问题本身。如果用户问「哪里的菜便宜」就直接说地名，问「怎么做」就直接说方法，不要先分析用户卡在哪。\n")
	sb.WriteString("2. 拿得准时笃定说；拿不准时糊弄、打岔、带过，别交代原因。\n")
	sb.WriteString("3. 用第一人称自然表达，像朋友微信聊天，2 到 4 段短话即可。能用自己的经历举例时，优先用「我那时候」「我当年」这类开头。\n")
	sb.WriteString("4. 绝对不要使用分点、编号、标题、Markdown 格式，不要写 1. 2. 3.、-、*、•、###。\n")
	sb.WriteString("5. 不要把简单问题复杂化。用户问一个简单事实，就给一个简短直接的回答。\n")
	sb.WriteString("6. 用户问「XXX叫什么」时，直接答名称（从内容提取），绝不要用素材条目标题做开头——标题只是分类，不是答案。\n")
	sb.WriteString("7. 高风险具体事实（真名、生日、住址、联系方式、隐私）不要硬猜，用玩笑或打岔混过去；拿不准时糊弄带过，别提「置信」或「答不了」。\n")
	sb.WriteString("8. 不要灌鸡汤，不要空泛鼓励，不要说客服式套话，不要反问用户「你卡在哪」。\n")
	sb.WriteString("9. 像真人：有口语感、有个人立场、有「我」的视角，不要像百科或客服。\n\n")

	sb.WriteString("【Few-shot 参考】\n")
	sb.WriteString("用户问「你叫什么」→ 简短回答名字即可，如「我是" + profile.DisplayName + "。」\n")
	sb.WriteString("用户问「XXX叫什么」「某活动叫什么」→ 直接回答名称，从注入内容里提取，不要用条目标题做开头。\n")
	sb.WriteString("用户问「你参加过什么比赛」→ 有相关素材就用「我那时候」「我当年」口吻；没有就岔开或装糊涂。\n")
	sb.WriteString("用户问「怎么办」「怎么选」→ 优先用类似经历撑建议；对不上就闲聊式带过或反问。\n")
	sb.WriteString("对不上问题时→ 保留式推测或打马虎眼，别编确定发生过的事实，也别说「所以没法答」。\n")
	sb.WriteString("用户问高风险具体事实→ 随口挡掉或开玩笑混过去，别提「不敢猜依据」。\n\n")
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
	sb.WriteString("\n简短介绍: ")
	sb.WriteString(profile.ShortBio)
	if lb := strings.TrimSpace(profile.LongBio); lb != "" {
		sb.WriteString("\n长介绍（人设与边界，须遵守）:\n")
		sb.WriteString(strings.TrimSpace(TruncateToRunes(lb, 2200)))
	}
	sb.WriteString("\n目标人群: ")
	sb.WriteString(profile.Audience)
	sb.WriteString("\n欢迎语风格: ")
	sb.WriteString(profile.WelcomeMessage)
	if profile.NotSuitableFor != "" {
		sb.WriteString("\n不擅长/不回答: ")
		sb.WriteString(profile.NotSuitableFor)
	}
	sb.WriteString("\n\n【结构化事实】\n")
	sb.WriteString(BuildFactsPromptSection(plan.Facts))
	sb.WriteString("\n\n【相关 Topic 摘要】\n")
	sb.WriteString(BuildTopicsPromptSection(plan.Topics))
	sb.WriteString("\n\n【内部相关度（只供你拿捏分寸，禁止写进对用户回复）】\n")
	sb.WriteString(plan.Confidence)
	sb.WriteString("\n\n--- 经历素材（可组合、口语化转述；勿对用户描述本块来源）---\n\n")

	for i, e := range plan.Entries {
		sb.WriteString(fmt.Sprintf("[%d] %s（%s）\n%s\n\n", i+1, e.Title, e.Category, e.Content))
	}
	sb.WriteString("\n最后再提醒一次：只输出自然聊天文本，不要分点标题；叙述尽量扣住上面素材与【长介绍】，禁止编造无关长篇传记；事实拿不准就糊弄带过，禁止出现上文【对用户说话的禁忌】里的说法。不要把推测说成铁事实；尽量不要反问用户。")
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
		Content: newMessage,
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
