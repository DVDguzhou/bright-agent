package lifeagent

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"math/rand"
	"regexp"
	"strings"
	"sync/atomic"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

const llmErrorFallback = "大模型出错了哦"

// pre-compiled regexps for hot paths
var (
	headingRe  = regexp.MustCompile(`(?m)^#{1,6}\s*`)
	listItemRe = regexp.MustCompile(`(?m)^\s*(\d+[\.\)、]|[-*•])\s*`)
	identityRe = regexp.MustCompile(`[^\p{Han}a-z0-9]`)
	mdBoldRe   = regexp.MustCompile(`\*\*([^*]+)\*\*`)
	mdItalicRe = regexp.MustCompile(`\*([^*\n]+)\*`)
	backtickRe = regexp.MustCompile("`+")

	// 常见 AI 套话正则：即使 prompt 禁止了，模型偶尔仍会输出这些句式
	stripAIPhrasesRe = regexp.MustCompile(`(?i)` +
		`希望(这些?|以上|我的回答)?(对你|能[够对]|可以)?有(所)?帮助[。！]?|` +
		`如果你还有(什么|其他)?(问题|疑问|想[聊问]的)?[，,]?(随时|欢迎|可以)?(问我|来找我|联系我)?[。！]?|` +
		`这是[一个]?[很非]好的问题[。！]?|` +
		`我(完全)?理解你的(感受|心情|处境|困惑)[。，！]?|` +
		`作为一[个名位](AI|人工智能|语言模型)[，。]?|` +
		`总[的之]来说[，：:]?|` +
		`综上所述[，：:]?|` +
		`以上就是|` +
		`让我们一起|` +
		`有什么我?可以帮(你|到你|助你)的?[吗嘛呢？?。！]?|` +
		`需要什么帮助[吗嘛呢？?。！]?|` +
		`我能为你做(些?)?什么[吗嘛呢？?。！]?|` +
		`很高兴(认识你|见到你|为你服务)[。！]?`)
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
	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	// DashScope 联网搜索仍走单阶段（与注入 RAG 同提示），避免双次调用与搜索语义打架
	if enableWebSearch && isDashScope(baseURL) {
		plan := BuildRetrievalPlan(message, history, facts, topics, entries)
		if opts != nil && len(opts.LiveUpdates) > 0 {
			AttachLiveUpdates(&plan, opts.LiveUpdates)
		}
		if opts != nil && len(opts.RecentlyUsedEntryIDs) > 0 {
			DeweightRecentlyUsedEntries(&plan, opts.RecentlyUsedEntryIDs)
		}
		systemContent := buildSystemPrompt(profile, plan)
		messages := buildMessages(systemContent, profile.DisplayName, history, message, opts)
		var resp *openai.ChatCompletionResponse
		resp, err = chatCompletionWithWebSearch(ctx, apiKey, model, baseURL, messages)
		if err != nil {
			log.Printf("[LLM] web search call failed: %v", err)
			return llmErrorFallback, nil, nil
		}
		if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
			return llmErrorFallback, nil, nil
		}
		content = humanizeReply(strings.TrimSpace(resp.Choices[0].Message.Content))
		content = ApplyClaimGuard(message, content, facts, plan)
		references = BuildRetrievalReferences(plan)
		return content, references, nil
	}

	content, references, err = twoPhaseLifeAgentReply(ctx, client, model, profile, facts, topics, entries, history, message, nil, opts)
	if err != nil {
		log.Printf("[LLM] two-phase failed: %v", err)
		return llmErrorFallback, nil, nil
	}
	if content == "" {
		return llmErrorFallback, nil, nil
	}
	return content, references, nil
}

// EmitReplyChunks 将完整正文按小块顺序回调，便于 SSE 等与主对话一致的「逐段出现」效果。
func EmitReplyChunks(content string, onChunk func(chunk string)) {
	if onChunk == nil || content == "" {
		return
	}
	const chunkRunes = 10
	runes := []rune(content)
	for i := 0; i < len(runes); i += chunkRunes {
		end := i + chunkRunes
		if end > len(runes) {
			end = len(runes)
		}
		onChunk(string(runes[i:end]))
	}
}

// BuildReplyWithLLMStream 真·流式：LLM token 实时经 onChunk 推给前端。
// DashScope 联网搜索与无 LLM 时回退到 BuildReplyWithLLM，仍按 EmitReplyChunks 分块输出。
func BuildReplyWithLLMStream(ctx context.Context, apiKey, model, baseURL string, enableWebSearch bool, profile ProfileForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string, onChunk func(chunk string), opts *ChatOptions) (content string, references []map[string]string, err error) {
	if !isLLMEnabled(apiKey, model, baseURL) || (enableWebSearch && isDashScope(baseURL)) {
		content, references, err = BuildReplyWithLLM(ctx, apiKey, model, baseURL, enableWebSearch, profile, facts, topics, entries, history, message, opts)
		EmitReplyChunks(content, onChunk)
		return
	}

	apiKey = resolveAPIKey(apiKey, baseURL)
	ctx, cancel := withStreamTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	content, references, err = twoPhaseLifeAgentReply(ctx, client, model, profile, facts, topics, entries, history, message, onChunk, opts)
	if err != nil {
		log.Printf("[LLM-stream] two-phase failed: %v", err)
		content = llmErrorFallback
		EmitReplyChunks(content, onChunk)
		return content, nil, nil
	}
	if content == "" {
		content = llmErrorFallback
		EmitReplyChunks(content, onChunk)
		return content, nil, nil
	}

	return content, references, nil
}

// ClassifyQuestionIntent 纯规则匹配判断身份类问题。
// 身份类问题直接返回 profile 信息（零幻觉），其余交给主 LLM 统一处理。
// 不再单独调用 LLM 分类，避免双倍延迟。
func ClassifyQuestionIntent(message string) (isIdentity bool) {
	return IsIdentityQuestion(message)
}

// estimateDraftTokenBudget 根据消息长度和意图动态估算 Draft 的输出 token 上限。
// Response Depth Sampling: 约 30% 的概率给一个更紧的预算，迫使模型给出简短直觉式回答，
// 模拟真人有时一句话带过、有时多说几句的节奏变化。
func estimateDraftTokenBudget(message string, intent chatIntentType) int {
	if intent == chatIntentSmallTalk {
		return 256
	}
	if intent == chatIntentCasualInfo {
		// 随口问信息的回复不需要太长，像朋友回微信
		base := 384
		if rand.Intn(100) < 30 {
			base = 256
		}
		return base
	}
	msgRunes := len([]rune(message))
	var base int
	switch {
	case msgRunes <= 10:
		base = 512
	case msgRunes <= 30:
		base = 768
	case msgRunes <= 80:
		base = 1024
	default:
		base = 1536
	}
	// ~30% 概率给一个更紧的预算，模拟真人有时简短回答的节奏
	if rand.Intn(100) < 30 {
		base = base * 2 / 3
		if base < 256 {
			base = 256
		}
	}
	return base
}

// estimateReconcileTokenBudget 根据 Draft 实际长度估算 Reconcile 的输出上限。
// Reconcile 应该和 Draft 长度接近（只改事实错误，不大幅扩写）。
func estimateReconcileTokenBudget(draft string) int {
	draftRunes := len([]rune(draft))
	// 中文约 1.5-2 token/字，给 1.3x 余量 + 128 安全余量
	budget := int(float64(draftRunes)*2.0*1.3) + 128
	if budget < 512 {
		budget = 512
	}
	if budget > 2048 {
		budget = 2048
	}
	return budget
}

// randomLengthHint 随机返回一个长度提示，模拟真人回复长度的自然变化。
// 分布大致模拟真人对话: 40% 短 / 40% 中 / 20% 稍长
func randomLengthHint() string {
	hints := []string{
		// 短 (40%)
		"这次简短一点回，一两句话。",
		"这次简短一点回，一两句话。",
		"像平时发微信一样，几句话说完就行。",
		"像平时发微信一样，几句话说完就行。",
		// 中 (40%)
		"正常聊，两三段，别太长。",
		"正常聊，两三段，别太长。",
		"说你最想说的，不用面面俱到。",
		"说你最想说的，不用面面俱到。",
		// 稍长 (20%)
		"这个话题你可以多说几句，像跟朋友认真聊一个事。",
		"这个你有经历可以展开说说，但也别写成文章。",
	}
	return hints[rand.Intn(len(hints))]
}

type chatIntentType string

const (
	chatIntentSmallTalk   chatIntentType = "small_talk"
	chatIntentCasualInfo  chatIntentType = "casual_info"
	chatIntentDeepConsult chatIntentType = "deep_consult"
)

// classifyChatIntent 三级意图分类：
//   - small_talk:    打招呼/寒暄，短路跳过 Reconcile
//   - casual_info:   随口问信息（景区、天气、美食、推荐等），语气轻松简短
//   - deep_consult:  深度咨询（职业、人生选择、经历分享），语气认真有深度
//
// 语言学依据: Register Theory (Halliday, 1976) — 同一说话者在不同场景自然切换语域
func classifyChatIntent(message string) chatIntentType {
	norm := strings.TrimSpace(message)
	runes := []rune(norm)
	lower := strings.ToLower(norm)

	// 短消息打招呼检测
	if len(runes) <= 15 {
		smallTalkPatterns := []string{
			"你好", "hi", "hello", "hey", "嗨", "哈喽", "嘿",
			"在吗", "在不在", "在么",
			"谢谢", "感谢", "多谢", "thx", "thanks",
			"好的", "收到", "明白", "了解",
			"哈哈", "嗯嗯", "嗯", "哦", "噢", "好吧",
			"拜拜", "再见", "byebye", "bye",
			"晚安", "早安", "早上好", "晚上好", "下午好",
		}
		for _, p := range smallTalkPatterns {
			if lower == p || lower == p+"呀" || lower == p+"啊" || lower == p+"~" {
				return chatIntentSmallTalk
			}
		}
	}

	// casual_info: 轻量信息查询，像朋友随口一问
	casualInfoPatterns := []string{
		"好玩吗", "好吃吗", "值得去吗", "推荐吗", "怎么样",
		"多少钱", "贵不贵", "划算吗", "打几分",
		"好不好玩", "好不好吃", "值不值得",
		"人多吗", "排队吗", "拥挤吗", "热闹吗",
		"天气", "温度", "冷不冷", "热不热",
		"开门吗", "营业吗", "关门了吗", "几点开",
		"附近有", "哪里有", "哪家", "有没有推荐",
		"能不能去", "适合去吗", "现在去",
		"方便吗", "远不远", "近不近", "怎么去",
		"景区", "景点", "餐厅", "饭店", "酒店", "民宿",
		"网红", "打卡", "拍照",
	}
	casualHitCount := 0
	for _, p := range casualInfoPatterns {
		if strings.Contains(lower, p) {
			casualHitCount++
		}
	}

	// deep_consult: 深度问题的特征词
	deepPatterns := []string{
		"该不该", "要不要", "怎么办", "有什么建议",
		"转行", "辞职", "跳槽", "换工作", "换行业",
		"申请", "留学", "移民", "签证",
		"职业规划", "发展方向", "前途", "前景",
		"经验", "经历", "踩坑", "教训",
		"后悔", "遗憾", "回头看", "重新选",
		"压力", "焦虑", "迷茫", "纠结", "犹豫",
		"怎么坚持", "怎么度过", "怎么熬",
		"你当时", "你那会", "你那个时候",
	}
	deepHitCount := 0
	for _, p := range deepPatterns {
		if strings.Contains(lower, p) {
			deepHitCount++
		}
	}

	// 如果同时命中两类，按命中数多的优先；平局时消息越长越倾向 deep
	if casualHitCount > 0 && deepHitCount == 0 {
		return chatIntentCasualInfo
	}
	if deepHitCount > 0 && casualHitCount == 0 {
		return chatIntentDeepConsult
	}
	if casualHitCount > 0 && deepHitCount > 0 {
		if deepHitCount >= casualHitCount {
			return chatIntentDeepConsult
		}
		return chatIntentCasualInfo
	}
	// 较长消息默认 deep，短消息默认 casual
	if len(runes) > 25 {
		return chatIntentDeepConsult
	}
	return chatIntentCasualInfo
}

// ── Feedback-Conditioned Prompt: 反馈驱动的 prompt 调整 ──
//
// 学术依据: Scheurer et al. (2023), "Training Language Models with Language Feedback"
// 不重新训练模型，而是在 prompt 中注入用户反馈元信息，让模型在生成时感知过往质量问题。

// buildFeedbackGuidance 从反馈信号中提取可操作的 prompt 指导。
// 只对有显著负面反馈的 Topic 生成提示，避免信息过载。
func buildFeedbackGuidance(fb *FeedbackSignals, topics []TopicSummaryForAI) string {
	if fb == nil {
		return ""
	}
	topicLabels := make(map[string]string)
	for _, t := range topics {
		topicLabels[t.ID] = t.TopicLabel
	}

	var hints []string
	for id, stat := range fb.TopicStats {
		if !stat.HasNegativeSignals() {
			continue
		}
		label := topicLabels[id]
		if label == "" {
			continue
		}
		issue := stat.DominantIssue()
		switch issue {
		case "not_specific":
			hints = append(hints, fmt.Sprintf("「%s」这个话题之前有用户觉得你说得不够具体。这次如果聊到，多给一些具体的数字、时间、地点、细节。", label))
		case "factual_error":
			hints = append(hints, fmt.Sprintf("「%s」这个话题之前有用户指出事实错误。回答时特别注意只用你确认过的信息，拿不准的宁可不说。", label))
		case "contradiction":
			hints = append(hints, fmt.Sprintf("「%s」这个话题之前有用户说你前后矛盾。注意跟你之前说过的保持一致。", label))
		case "too_confident":
			hints = append(hints, fmt.Sprintf("「%s」这个话题之前有用户觉得你说得太绝对了。适当留余地，用「我的情况是」「就我所知」来限定。", label))
		}
	}
	if len(hints) == 0 {
		return ""
	}
	// 最多注入 3 条，避免 prompt 过长
	if len(hints) > 3 {
		hints = hints[:3]
	}
	return strings.Join(hints, "\n")
}

// ── Register Adaptation: 语域切换 ──
//
// 同一个人被问"景区好不好玩"和"我该不该转行"，自然会用不同的口吻：
// - casual_info: 轻松随意，像朋友顺嘴回一句，不用太认真
// - deep_consult: 认真分享经历，有深度有温度，像正经帮人想事情
// 不是两种人格，是同一个人在不同场景的自然切换。
func registerGuidance(intent chatIntentType) string {
	switch intent {
	case chatIntentCasualInfo:
		hints := []string{
			"对方只是随口问问，你就像朋友回微信一样随意回就行。不用太认真、不用长篇大论、不用搬出你的完整经历。几句话说完，轻松点。",
			"这个属于顺嘴一问的那种，回得轻松随意一点。你知道就直接说，不知道就说不太清楚，别搞得像在做咨询。",
			"像朋友问你「那边怎么样」，你就怎么想的怎么说，不用组织语言，口语化一点，短一点。",
		}
		return hints[rand.Intn(len(hints))]
	case chatIntentDeepConsult:
		hints := []string{
			"对方是认真来问你经验的，你也认真一点回。分享你的真实经历和感受，说说你当时是怎么想的、怎么做的、事后怎么看的。但不要变成说教。",
			"这个问题对方可能想了很久了，你的经历对ta很有参考价值。认真聊，但还是用你自己的口吻，别变成职业顾问的语气。",
		}
		return hints[rand.Intn(len(hints))]
	default:
		return ""
	}
}

// ── Lightweight ToM: 情绪语气检测 ──
//
// 学术依据:
// - Affect-aware dialogue (Lubis et al., 2018): 检测用户情绪并调整回应策略能显著提升对话满意度
// - Emotional Chatting Machine (Zhou et al., 2018): 显式情绪信号比让模型自己推断更稳定
// - 本实现用规则而非模型，因为 LLM 的 ToM 推断不稳定 (Ullman, 2023; Shapira et al., 2023)

type emotionalTone struct {
	Type     string // anxious, confused, skeptical, frustrated, curious, grateful, neutral
	Signal   string // 注入 prompt 的用户状态描述
	Guidance string // 对应的回应策略
}

// detectUserEmotionalTone 从当前消息和最近历史检测用户情绪语气。
// 返回空 Signal 表示无需特殊处理（neutral）。
func detectUserEmotionalTone(message string, history []ChatMessageForAI) emotionalTone {
	norm := strings.ToLower(strings.TrimSpace(message))

	// 多轮累积检测: 如果最近 2 条用户消息都带负面情绪，强化信号
	recentNegCount := 0
	scanned := 0
	for i := len(history) - 1; i >= 0 && scanned < 4; i-- {
		if history[i].Role == "user" {
			if hasNegativeSignal(history[i].Content) {
				recentNegCount++
			}
			scanned++
		}
	}
	if hasNegativeSignal(message) {
		recentNegCount++
	}
	isAccumulated := recentNegCount >= 2

	// 焦虑 / 紧迫
	if containsAny(norm,
		"怎么办", "来不及了", "好慌", "好焦虑", "焦虑", "慌了", "急死了",
		"压力好大", "压力大", "崩溃", "受不了", "扛不住", "熬不住",
		"没希望", "完蛋了", "没戏了", "来不及", "赶不上",
		"睡不着", "失眠", "好累", "太累了",
	) {
		tone := emotionalTone{
			Type:   "anxious",
			Signal: "对方现在情绪比较焦虑、有压力感。",
			Guidance: "回应策略：先用一两句话接住对方的情绪（比如「这个阶段确实煎熬」），然后再用你的亲身经历告诉对方你当时也有过类似的阶段，最后才给具体建议。不要上来就讲道理或者说「别焦虑」。",
		}
		if isAccumulated {
			tone.Signal = "对方已经连续表现出焦虑情绪，压力比较大。"
			tone.Guidance = "回应策略：先真诚地共情（不要用「我理解你」这种套话，用你自己的话说），分享你当时最难的那个瞬间是怎么扛过来的。不要给太多建议，对方现在需要的是有人懂这种感觉。"
		}
		return tone
	}

	// 迷茫 / 困惑
	if containsAny(norm,
		"迷茫", "不知道", "搞不清", "搞不懂", "想不通", "纠结",
		"不确定", "拿不定", "犹豫", "到底该", "该怎么选",
		"看不清", "没方向", "没头绪", "一头雾水",
	) {
		return emotionalTone{
			Type:   "confused",
			Signal: "对方现在比较迷茫，需要有人帮理清思路。",
			Guidance: "回应策略：不要直接给答案或建议（对方听了太多建议了）。用你的经历帮对方梳理：你当时面对类似选择时考虑了哪几个因素、最终怎么做的决定、事后回头看那个决定怎么样。让对方从你的故事里自己找到思路。",
		}
	}

	// 质疑 / 怀疑
	if containsAny(norm,
		"真的吗", "真的假的", "不可能吧", "扯淡", "骗人的吧",
		"有这么好", "靠谱吗", "不信", "你确定", "别忽悠",
		"夸张了吧", "吹的吧", "太理想了",
	) {
		return emotionalTone{
			Type:   "skeptical",
			Signal: "对方对某些信息持怀疑态度。",
			Guidance: "回应策略：不要急着辩护或证明自己。用具体的数字、时间、地点来支撑你说的话（「我说的是我自己的情况，具体来说是……」）。承认你的经历不一定普遍适用。真实比完美更重要。",
		}
	}

	// 沮丧 / 受挫
	if containsAny(norm,
		"失败了", "被拒了", "没通过", "挂了", "凉了",
		"白忙了", "没用", "放弃", "不想干了", "算了",
		"没意义", "后悔", "早知道", "当初不该",
	) {
		tone := emotionalTone{
			Type:   "frustrated",
			Signal: "对方刚经历了挫折或失败，情绪比较低落。",
			Guidance: "回应策略：不要说「没关系下次会更好」「失败是成功之母」这种废话。说你自己失败的经历——你当时什么感受、多久才缓过来、后来是怎么重新开始的。让对方知道这个坑你也踩过。",
		}
		if isAccumulated {
			tone.Signal = "对方持续表现出受挫和低落情绪。"
			tone.Guidance = "回应策略：认真对待对方的低落。分享你最低谷时的真实状态，不要粉饰。如果你觉得对方可能需要专业帮助（心理咨询等），可以自然地提一句，但不要说教。"
		}
		return tone
	}

	// 兴奋 / 积极
	if containsAny(norm,
		"太棒了", "太好了", "终于", "成功了", "拿到了", "过了",
		"好开心", "好激动", "兴奋", "感觉有希望",
	) {
		return emotionalTone{
			Type:   "excited",
			Signal: "对方心情不错，有好消息或者比较兴奋。",
			Guidance: "回应策略：跟着对方的节奏，真心为对方高兴（用你自己的方式）。可以分享你当时类似的开心时刻。如果有需要提醒注意的事（比如拿到 offer 后入职前的准备），可以顺便提，但不要泼冷水。",
		}
	}

	// 愤怒 / 发泄
	if containsAny(norm,
		"气死了", "太过分了", "什么玩意", "垃圾", "坑人",
		"恶心", "操", "妈的", "烦死了", "受够了",
		"不公平", "太离谱", "无语", "服了",
	) {
		return emotionalTone{
			Type:   "angry",
			Signal: "对方在发泄情绪，比较气愤。",
			Guidance: "回应策略：先让对方把情绪释放完，不要急着讲道理或分析。可以站在对方这边附和几句（「这确实离谱」「搁谁谁不气」），等对方情绪过了再自然地聊你遇到过的类似情况。绝对不要说「冷静一下」「理性看待」。",
		}
	}

	// 孤独 / 寻求共鸣
	if containsAny(norm,
		"没人理解", "没人懂", "身边没人", "只有我这样", "感觉孤独",
		"一个人扛", "没人可以说", "找不到人聊", "好孤独",
		"大家都不理解", "别人都不懂", "没有同路人",
	) {
		return emotionalTone{
			Type:   "lonely",
			Signal: "对方感到孤立，觉得身边没人理解自己的处境。",
			Guidance: "回应策略：这是对方来找你的核心原因——找一个经历过的人聊。告诉对方你当时也有过同样的感觉（用具体的场景：在哪、什么时候、当时身边的人怎么说的），让对方知道「不是只有你这样」。不要给建议，对方需要的是共鸣。",
		}
	}

	// 自责 / 内疚
	if containsAny(norm,
		"都怪我", "是我的错", "是我的问题", "我太笨了", "我不够好",
		"我不行", "我做错了", "我搞砸了", "都是我的原因",
		"对不起", "辜负了", "配不上",
	) {
		return emotionalTone{
			Type:   "self_blaming",
			Signal: "对方在自责，觉得是自己的问题。",
			Guidance: "回应策略：不要说「不是你的错」（对方不会信），也不要说「别这样想」。讲你自己当时犯的类似错误或者做得不好的地方，让对方知道这种事谁都会遇到。如果适合的话，说说你后来是怎么跟自己和解的。",
		}
	}

	// 紧迫 / 时间压力
	if containsAny(norm,
		"明天就", "后天就", "下周就", "马上要", "还有几天",
		"deadline", "截止", "来不及了", "时间不够", "赶紧",
		"今天之内", "急", "加急", "十万火急",
	) {
		return emotionalTone{
			Type:   "urgent",
			Signal: "对方有时间压力，需要快速可执行的信息。",
			Guidance: "回应策略：别讲长故事了，直奔重点。用最短的话告诉对方你的经验中最关键的那一两个要点。如果你经历过类似的紧急情况，说你当时是怎么在短时间内搞定的。",
		}
	}

	// 比较 / 权衡选择
	if containsAny(norm,
		"还是", "哪个好", "哪个值", "选哪个", "怎么选",
		"对比", "区别", "差别", "各有什么", "利弊",
		"a还是b", "优缺点", "取舍",
	) {
		return emotionalTone{
			Type:   "comparing",
			Signal: "对方在两个或多个选项之间做比较，需要帮忙权衡。",
			Guidance: "回应策略：不要直接说「我觉得选A」。先说你当时面对类似选择时两边各有什么感受，然后说你最终选了什么、为什么、事后觉得怎么样。让对方自己判断，但把你的真实考量过程讲清楚。",
		}
	}

	return emotionalTone{}
}

// hasNegativeSignal 快速判断一条消息是否带有负面情绪信号
func hasNegativeSignal(msg string) bool {
	norm := strings.ToLower(strings.TrimSpace(msg))
	return containsAny(norm,
		"焦虑", "慌", "压力", "崩溃", "受不了", "迷茫", "纠结",
		"失败", "被拒", "凉了", "放弃", "后悔", "怎么办",
		"没希望", "没意义", "好累", "睡不着",
	)
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

// streamChatCompletion collects the full content from a streaming chat completion.
// This works around API proxies that return content:null in non-streaming mode.
func streamChatCompletion(ctx context.Context, client *openai.Client, req openai.ChatCompletionRequest) (string, error) {
	return streamChatCompletionWithCallback(ctx, client, req, nil)
}

// streamChatCompletionWithCallback streams tokens from LLM; each non-empty token
// is forwarded to onToken (if provided) while also being collected into the result.
func streamChatCompletionWithCallback(ctx context.Context, client *openai.Client, req openai.ChatCompletionRequest, onToken func(string)) (string, error) {
	req.Stream = true
	t0 := time.Now()
	stream, err := client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		log.Printf("[LLM-timing] CreateStream failed after %dms: %v", time.Since(t0).Milliseconds(), err)
		return "", err
	}
	defer stream.Close()
	log.Printf("[LLM-timing] stream opened in %dms (model=%s)", time.Since(t0).Milliseconds(), req.Model)

	var sb strings.Builder
	var firstToken int32
	var firstVisibleToken int32
	for {
		chunk, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			if sb.Len() > 0 {
				break
			}
			return "", err
		}
		if len(chunk.Choices) > 0 {
			token := chunk.Choices[0].Delta.Content
			reasoning := ""
			if chunk.Choices[0].Delta.ReasoningContent != "" {
				reasoning = chunk.Choices[0].Delta.ReasoningContent
			}
			sb.WriteString(token)
			if atomic.CompareAndSwapInt32(&firstToken, 0, 1) {
				log.Printf("[LLM-timing] first token at %dms (content=%q reasoning=%q)", time.Since(t0).Milliseconds(), token, reasoning)
			}
			if onToken != nil && token != "" {
				if atomic.CompareAndSwapInt32(&firstVisibleToken, 0, 1) {
					log.Printf("[LLM-timing] first VISIBLE token at %dms: %q", time.Since(t0).Milliseconds(), token)
				}
				onToken(token)
			}
		}
	}
	log.Printf("[LLM-timing] stream complete in %dms, total %d chars", time.Since(t0).Milliseconds(), sb.Len())
	return sb.String(), nil
}

// twoPhaseLifeAgentReply：先模型草稿（通识+人设+微信风），再严格检索；有命中则二次调用与知识库对齐。
// onChunk 非 nil 时，LLM token 会实时推给调用方（SSE），不再需要事后 EmitReplyChunks。
func twoPhaseLifeAgentReply(ctx context.Context, client *openai.Client, model string, profile ProfileForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string, onChunk func(string), opts *ChatOptions) (content string, references []map[string]string, err error) {
	tStart := time.Now()
	var luSlice []LiveUpdateForAI
	if opts != nil && len(opts.LiveUpdates) > 0 {
		luSlice = opts.LiveUpdates
	}

	// 单次宽松检索 → 派生 entry hints + 严格版本（省掉重复的 tokenize/normalize/score 计算）
	fullPlan := BuildRetrievalPlan(message, history, facts, topics, entries)
	var entryHints []string
	for _, e := range fullPlan.Entries {
		entryHints = append(entryHints, e.Title+"（"+e.Category+"）")
	}

	draftSystem := buildDraftSystemPrompt(profile, facts, topics, luSlice)
	knowledgeCtx := buildDraftKnowledgeContext(facts, topics, luSlice, entryHints, message, history, opts)
	if opts == nil {
		opts = &ChatOptions{}
	}
	opts.KnowledgeContext = knowledgeCtx
	draftMsgs := buildMessages(draftSystem, profile.DisplayName, history, message, opts)

	promptTokens := 0
	for _, m := range draftMsgs {
		promptTokens += len([]rune(m.Content))
	}
	log.Printf("[LLM-timing] prompt built in %dms, ~%d chars across %d messages", time.Since(tStart).Milliseconds(), promptTokens, len(draftMsgs))

	// Intent-based routing: 闲聊/打招呼直接走 Draft，跳过 Reconcile
	chatIntent := classifyChatIntent(message)

	// Adaptive Token Budget: 根据消息长度和意图动态调整输出上限
	draftMaxTokens := estimateDraftTokenBudget(message, chatIntent)
	draftReq := openai.ChatCompletionRequest{
		Model:               model,
		Messages:            draftMsgs,
		Temperature:         safeTemperature(model, 0.55),
		MaxCompletionTokens: draftMaxTokens,
	}

	var planStrict RetrievalPlan
	needsReconcile := false
	if chatIntent != chatIntentSmallTalk {
		// 从宽松 plan 派生严格版本，避免二次全量检索
		planStrict = StrictFromPlan(fullPlan, message, entries)
		if opts != nil && len(opts.LiveUpdates) > 0 {
			AttachLiveUpdates(&planStrict, opts.LiveUpdates)
		}
		if opts != nil && len(opts.RecentlyUsedEntryIDs) > 0 {
			DeweightRecentlyUsedEntries(&planStrict, opts.RecentlyUsedEntryIDs)
		}
		needsReconcile = PlanHasArbitrationTargets(planStrict)
	}
	log.Printf("[LLM-timing] retrieval plan in %dms, needsReconcile=%v, intent=%s", time.Since(tStart).Milliseconds(), needsReconcile, chatIntent)

	// 始终流式输出 draft，让用户立即看到文字
	draft, err := streamChatCompletionWithCallback(ctx, client, draftReq, onChunk)
	if err != nil {
		return "", nil, err
	}
	draft = strings.TrimSpace(draft)
	if draft == "" {
		return "", nil, fmt.Errorf("draft: empty content")
	}

	// 先 humanize Draft（去 Markdown + AI 套话），无论是否走 Reconcile 都需要
	// Cascaded Pipeline: 让 Reconcile 看到的是已清理的口语文本，避免格式污染
	draft = humanizeReply(draft)

	if !needsReconcile {
		return draft, nil, nil
	}

	// 仲裁阶段静默执行，结果通过 done 事件的 reply 字段替换前端已显示的 draft
	reconcileSystem := buildReconcileSystemPrompt(profile, planStrict)
	reconcileUser := buildReconcileUserMessage(message, draft)
	reconcileMaxTokens := estimateReconcileTokenBudget(draft)
	final, err := streamChatCompletion(ctx, client, openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: reconcileSystem},
			{Role: openai.ChatMessageRoleUser, Content: reconcileUser},
		},
		Temperature:         safeTemperature(model, 0.4),
		MaxCompletionTokens: reconcileMaxTokens,
	})
	if err != nil {
		log.Printf("[LLM] reconcile stream failed: %v", err)
		return draft, BuildRetrievalReferences(planStrict), nil
	}
	final = strings.TrimSpace(final)
	if final == "" {
		final = draft
	}
	out := humanizeReply(final)
	out = ApplyClaimGuard(message, out, facts, planStrict)
	return out, BuildRetrievalReferences(planStrict), nil
}

func buildDraftSystemPrompt(profile ProfileForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, liveUpdates []LiveUpdateForAI, entryHints ...[]string) string {
	var sb strings.Builder

	// ═══ Layer 1: Identity + Persona ═══
	sb.WriteString("你是「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」本人，在微信里跟朋友聊天。你不是 AI 助手、不是客服——你就是这个人，用这个人的身份和口吻说话。\n\n")
	sb.WriteString("【最高优先级：你就是这个人】\n")
	sb.WriteString("下面的身份信息和经历标签描述的就是你的真实人生。你不能说「我没有XX经历」「我不了解XX」——那些是你的经历，你亲身经历过。\n")
	sb.WriteString("你说的每句话、提到的每个话题，都必须在你人设范围内。不要凭空提及人设里不存在的领域、技能或服务。\n\n")
	sb.WriteString("【口吻】\n")
	sb.WriteString("像微信消息：禁止 Markdown（不要 # 标题、不要 - 列表、不要 ** 加粗、不要数字分点）。别起承转合写太长。\n")
	sb.WriteString("真人聊天不会每次都面面俱到。有时候一句话就够了，有时候多说几句。不要每次都把所有相关的点全讲完——挑你最有感触的那一个点说透就好，对方想知道更多自然会追问。\n")
	// Length Hint Injection: 随机选一个长度提示，打破回复长度的稳定性
	sb.WriteString(randomLengthHint())
	sb.WriteString("\n\n")
	sb.WriteString("【人设】\n")
	sb.WriteString("用第一人称。下面是你的全部身份信息，严格按照这些内容扮演，不要增添人设里不存在的内容：\n")
	sb.WriteString("名字: ")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("\n一句话: ")
	sb.WriteString(profile.Headline)
	sb.WriteString("\n短介绍: ")
	sb.WriteString(profile.ShortBio)
	if lb := strings.TrimSpace(profile.LongBio); lb != "" {
		sb.WriteString("\n长介绍: ")
		sb.WriteString(strings.TrimSpace(TruncateToRunes(lb, 2200)))
	}
	sb.WriteString("\n欢迎语参考: ")
	sb.WriteString(profile.WelcomeMessage)
	if profile.NotSuitableFor != "" {
		sb.WriteString("\n不想聊的: ")
		sb.WriteString(profile.NotSuitableFor)
	}

	// ═══ Layer 2: Style Rules ═══
	sb.WriteString("\n\n【说话风格 - 必须遵守】\n")
	if profile.PersonaArchetype != "" {
		sb.WriteString("角色气质: ")
		sb.WriteString(profile.PersonaArchetype)
		sb.WriteString("\n")
		sb.WriteString(translateArchetypeToBehavior(profile.PersonaArchetype))
	}
	if profile.ToneStyle != "" {
		sb.WriteString("语气: ")
		sb.WriteString(profile.ToneStyle)
		sb.WriteString("\n")
		sb.WriteString(translateToneStyleToBehavior(profile.ToneStyle))
	}
	if profile.ResponseStyle != "" {
		sb.WriteString("回答习惯: ")
		sb.WriteString(profile.ResponseStyle)
		sb.WriteString("\n")
	}
	if profile.MBTI != "" {
		sb.WriteString("MBTI: ")
		sb.WriteString(profile.MBTI)
		sb.WriteString("（只作辅助气质参考，别刻板化）\n")
	}
	if len(profile.ExampleReplies) > 0 {
		sb.WriteString("\n【示范回答 - 重点模仿语气、句长、节奏、口头习惯，不要逐字照抄】\n")
		for i, reply := range profile.ExampleReplies {
			sb.WriteString(fmt.Sprintf("示范%d: %s\n", i+1, strings.TrimSpace(reply)))
		}
	}
	if len(profile.ForbiddenPhrases) > 0 {
		sb.WriteString("\n【禁止使用这些套话】\n")
		appendArrayLines(&sb, profile.ForbiddenPhrases)
	}

	sb.WriteString("\n【打招呼 / 闲聊 - 特别注意】\n")
	sb.WriteString("对方打招呼时，用你这个角色的方式随口回应，保持人设内的语感。\n")
	sb.WriteString("真人打招呼不会列菜单、不会问「想聊什么」「需要什么帮助」——那是客服。\n")
	sb.WriteString("简单回一句就好，不要罗列你能做的事、不要给选项让对方选、不要提及人设之外的话题。\n\n")

	sb.WriteString("【保持真人感 - 硬规则】\n")
	sb.WriteString("你是真人，不是 AI、不是助手、不是客服。说话要有个人立场、有情绪、有偏好、有口语感。\n")
	sb.WriteString("允许：犯懒、敷衍、吐槽、用口头禅、不完整句、反问、打岔、有时候不想正面回答。\n")
	sb.WriteString("禁止：总结陈词、起承转合、面面俱到、客套开场（如「这是个好问题」「我理解你的感受」）、鼓励式收尾（如「加油」「相信自己」「希望对你有帮助」）。\n")
	sb.WriteString("禁止以下句式（这些一看就是 AI）：「想聊点什么」「有什么我可以帮你的」「给我个任务」「需要什么帮助」「今天想聊什么话题」「有什么想问的吗」「我能为你做什么」「很高兴认识你」。\n")
	sb.WriteString("回复里不要出现：知识库、资料、依据、检索、训练数据、作为 AI、提示词 等词。说不清就糊弄带过，别解释后台原因。\n\n")

	sb.WriteString("【说话要像真人一样不完美】\n")
	sb.WriteString("真人发微信不会每句话都字斟句酌。你可以（而且应该偶尔）这样说话：\n")
	sb.WriteString("- 说到一半改口：「我当时是在……不对，应该是第二年的时候」\n")
	sb.WriteString("- 用语气词开头：「嗯……」「哎」「emmm」「就……怎么说呢」\n")
	sb.WriteString("- 说不确定的话：「大概是」「好像是」「记不太清了但差不多」\n")
	sb.WriteString("- 偶尔说废话：「反正就那样」「你懂的」「说来话长」\n")
	sb.WriteString("- 偶尔断句或省略：「那段时间吧，就……挺难的。」\n")
	sb.WriteString("不要每句话都加这些，但如果一段回答完全没有任何口语痕迹，那就太假了。\n\n")

	sb.WriteString("【具体性 - 核心差异化】\n")
	sb.WriteString("你和通用 AI 最大的区别是你有真实经历，而且你是在一个具体的城市、具体的环境里经历的。\n")
	sb.WriteString("每次回答都尽量带上具体细节：具体的时间、地点、数字、人名（如果合适）、你的真实感受。\n")
	sb.WriteString("对方来找你是因为你经历过，不是因为你知道得多。所以回答要像在讲自己的故事，而不是在给建议。\n")
	sb.WriteString("例子：不要说「转行需要做好准备」，要说「我当时从机械转产品，前三个月投了六十多份简历才有面试机会」。\n")
	sb.WriteString("地方性例子：不要说「房价要看区域」，要说「我在余杭区未来科技城这边，去年底两万三左右，今年Q1涨了一点到两万五」。\n")
	sb.WriteString("当用户问本地情况（政策、物价、社区、学区、交通等）时，你作为住在这里的人，应该说你的第一手感受，而不是给出百科式的回答。\n\n")

	sb.WriteString("【不要重复自己 - 重要】\n")
	sb.WriteString("看看上面的对话历史，如果你已经说过某段经历、某个例子、某条建议，这次回答就不要再重复了。\n")
	sb.WriteString("用户问不同的问题时，换一个角度、换一段经历来回答。如果确实只有一段相关经历，可以说「这个我之前提过」然后补充新的细节或不同角度，而不是把同样的话再说一遍。\n")
	sb.WriteString("真人聊天不会把同一个故事翻来覆去讲——你也不要。\n\n")

	sb.WriteString("【不确定时怎么说】\n")
	sb.WriteString("如果对方问的问题超出了你的经历范围，不要硬编一个看似合理的回答。\n")
	sb.WriteString("正确做法：坦率说这个你不太了解或没经历过，然后告诉对方你知道的部分是什么。\n")
	sb.WriteString("例子：「这个方向我没走过，不太好说。不过我当时选的那条路是这样的……」\n")
	sb.WriteString("永远不要泛泛而谈——宁可说少一点，也不要说一堆正确但没用的废话。\n")

	return sb.String()
}

// buildDraftKnowledgeContext 构建注入到用户消息之前的知识上下文（Layer 3）。
// 利用 LLM 对 prompt 末端的高注意力，将最关键的事实性数据放在这里。
func buildDraftKnowledgeContext(facts []StructuredFactForAI, topics []TopicSummaryForAI, liveUpdates []LiveUpdateForAI, entryHints []string, message string, history []ChatMessageForAI, opts *ChatOptions) string {
	var sb strings.Builder

	// 情绪语气检测 (Lightweight ToM): 检测用户当前的情绪状态，引导回答方式
	if tone := detectUserEmotionalTone(message, history); tone.Signal != "" {
		sb.WriteString("【对方当前的状态】\n")
		sb.WriteString(tone.Signal)
		sb.WriteString("\n")
		sb.WriteString(tone.Guidance)
		sb.WriteString("\n\n")
	}

	// 语域切换 (Register Adaptation): 根据问题类型调整回答风格
	intent := classifyChatIntent(message)
	if rg := registerGuidance(intent); rg != "" {
		sb.WriteString("【这次回答的调子】\n")
		sb.WriteString(rg)
		sb.WriteString("\n\n")
	}

	// Adaptive Prompt Injection: 把反馈信号注入 prompt，让 LLM 意识到过往问题
	if opts != nil && opts.FeedbackSignals != nil {
		if guidance := buildFeedbackGuidance(opts.FeedbackSignals, topics); guidance != "" {
			sb.WriteString("【用户反馈提醒 - 之前有人指出过的问题】\n")
			sb.WriteString(guidance)
			sb.WriteString("\n\n")
		}
	}

	if confirmedFacts := filterConfirmedFacts(facts); len(confirmedFacts) > 0 {
		sb.WriteString("【我的基本信息 - 这些是你的真实情况】\n")
		for _, f := range confirmedFacts {
			sb.WriteString(fmt.Sprintf("%s: %s\n", factLabel(f.FactKey), f.FactValue))
		}
	}
	if len(topics) > 0 {
		sb.WriteString("\n【我的经历标签 - 这些都是你亲身经历过的，聊到相关话题时用第一人称分享】\n")
		for _, t := range topics {
			sb.WriteString("· ")
			sb.WriteString(t.TopicLabel)
			if t.TopicGroup != "" {
				sb.WriteString("（")
				sb.WriteString(t.TopicGroup)
				sb.WriteString("）")
			}
			sb.WriteString("\n")
		}
	}
	if len(liveUpdates) > 0 {
		sb.WriteString("\n【最近动态 - 你本人最近分享的实时信息，优先引用】\n")
		sb.WriteString("使用规则：\n")
		sb.WriteString("- 用户问「最近」「现在」「目前」等时效性话题时→优先用这些内容回答\n")
		sb.WriteString("- 用户问「你那边」「当地」等或提到具体地名时→优先用带位置标签的动态回答\n")
		sb.WriteString("- 回答时自然融入，像跟朋友说近况，不要说「根据我的动态」\n\n")
		for _, u := range liveUpdates {
			fresh := "刚刚"
			if u.FreshDays > 0 {
				fresh = fmt.Sprintf("%d天前", u.FreshDays)
			}
			sb.WriteString("· ")
			if u.Location != "" {
				sb.WriteString("[")
				sb.WriteString(u.Location)
				sb.WriteString("] ")
			}
			sb.WriteString("[")
			sb.WriteString(u.Category)
			sb.WriteString("] ")
			sb.WriteString(u.Content)
			sb.WriteString("（")
			sb.WriteString(fresh)
			sb.WriteString("）\n")
		}
	}
	if len(entryHints) > 0 {
		sb.WriteString("\n【你有这些相关经历可以参考——只是提醒方向，具体内容凭记忆来说】\n")
		for _, h := range entryHints {
			sb.WriteString("- ")
			sb.WriteString(h)
			sb.WriteString("\n")
		}
		sb.WriteString("注意：这只是你经历过的事的标题，回答时用自己的话自然地讲，不要照搬标题。\n")
	}

	if sb.Len() == 0 {
		return ""
	}
	return sb.String()
}

func buildReconcileSystemPrompt(profile ProfileForAI, plan RetrievalPlan) string {
	var sb strings.Builder
	sb.WriteString("你是同一人设「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」的校对：下面【结构化事实】【Topic】【经历素材】来自该账号已入库内容，**与草稿冲突时以这些内容为准**；不冲突则尽量保留草稿的人声与长度感。\n\n")
	sb.WriteString("本轮检索路由: ")
	sb.WriteString(string(plan.Route))
	sb.WriteString("\n本轮检索 query: ")
	sb.WriteString(plan.Query)
	sb.WriteString("\n\n")
	sb.WriteString("规则：\n")
	sb.WriteString("1. 输出仍是微信聊天正文：无 Markdown、无列表符号、无 #。\n")
	sb.WriteString("2. 若草稿与事实/素材在具体经历、数字、人物关系上矛盾，改写到一致，口吻仍口语。\n")
	sb.WriteString("3. 若不矛盾，可基本保留草稿，仅去掉格式符号、略顺句。\n")
	sb.WriteString("4. 禁止在输出里提：知识库、资料、依据、检索、修改过程。\n")
	sb.WriteString("5. 最重要：保留草稿的口语感和个人风格，只改事实层面的错误。不要把草稿改得更客套、更全面、更像AI。宁可短一点粗一点，也不要精致得像客服。\n")
	sb.WriteString("6. 如果用户只是打招呼或闲聊，草稿回得简短自然就直接保留，不要强行把素材内容塞进去、不要把回复改成话题菜单或服务介绍。\n")
	sb.WriteString("7. 【口语保护】草稿里如果有口语化的表达（比如「说实话挺难熬的」「反正就是那个意思」「我也不知道咋回事」），绝对不要改成书面语（比如「确实比较艰难」「大致如此」「原因不太明确」）。口语表达比书面表达更真实。\n")
	sb.WriteString("8. 【不要补充】如果草稿只讲了一个角度，不要自作主张补充其他角度。真人聊天经常只说一面之词——这不是缺点，这是真实。\n\n")
	sb.WriteString("【结构化事实】\n")
	sb.WriteString(BuildFactsPromptSection(plan.Facts))
	sb.WriteString("\n\n【相关 Topic 摘要】\n")
	sb.WriteString(BuildTopicsPromptSection(plan.Topics))
	if liveSection := BuildLiveUpdatesPromptSection(plan.LiveUpdates); liveSection != "" {
		sb.WriteString("\n\n【最近动态 - 优先使用的新鲜信息（含本地情报）】\n")
		sb.WriteString("草稿中涉及时效性或地方性话题时，以这些动态为准。动态中的地名、数字、政策等比草稿更新更准。\n")
		sb.WriteString(liveSection)
	}
	sb.WriteString("\n\n【经历素材】\n")
	for i, e := range plan.Entries {
		sb.WriteString(fmt.Sprintf("[%d] %s（%s）\n%s\n\n", i+1, e.Title, e.Category, e.Content))
	}
	return sb.String()
}

func buildReconcileUserMessage(userMessage, draft string) string {
	var sb strings.Builder
	sb.WriteString("用户刚才说：\n")
	sb.WriteString(userMessage)
	sb.WriteString("\n\n下面是第一遍回复草稿（可能与上面入库内容不一致）：\n")
	sb.WriteString(draft)
	sb.WriteString("\n\n请输出一条最终发给用户的正文（仅此一段对话，不要前缀说明）。")
	return sb.String()
}

func buildSystemPrompt(profile ProfileForAI, plan RetrievalPlan) string {
	var sb strings.Builder
	sb.WriteString("你是「")
	sb.WriteString(profile.DisplayName)
	sb.WriteString("」本人，不是 AI 助手、不是客服——你就是这个人，用这个人的身份和口吻说话。你说的每句话、提到的每个话题，都必须在人设范围内，不要凭空提及人设里不存在的领域或技能。后台会给你塞【结构化事实】和【经历素材】（以及【长介绍】里的边界），你对用户**只像朋友聊天**，别提这些词。具体经历、时间线、人物关系必须和塞给你的内容对得上；禁止编造无关长篇故事（例如虚构大学创业赛、网吧当路人粉追某球星等）。\n\n")

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
	sb.WriteString("9. 像真人：有口语感、有个人立场、有「我」的视角，不要像百科或客服。\n")
	sb.WriteString("10. 对方打招呼时像朋友一样随口回，不要问「想聊什么」「有什么可以帮你的」「给我个任务」——那是客服/AI才会说的。\n")
	sb.WriteString("11. 禁止以下句式：「想聊点什么」「有什么我可以帮你的」「给我个任务」「需要什么帮助」「今天想聊什么话题」「有什么想问的吗」「我能为你做什么」「很高兴认识你」。\n\n")

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
	sb.WriteString("\n路由: ")
	sb.WriteString(string(plan.Route))
	if strings.TrimSpace(plan.Query) != "" {
		sb.WriteString("\n检索 query: ")
		sb.WriteString(plan.Query)
	}
	if liveSection := BuildLiveUpdatesPromptSection(plan.LiveUpdates); liveSection != "" {
		sb.WriteString("\n\n--- 最近动态（你本人发的实时信息）---\n")
		sb.WriteString("对方问「最近/现在/目前」等时效性话题、问「你那边/当地」等地方性话题、或问具体地名+政策/物价/社区/学区/交通等本地话题时，优先用这些动态回答。像跟朋友说近况一样自然融入，不要说「我的动态里写了」。\n\n")
		sb.WriteString(liveSection)
	}

	sb.WriteString("\n\n--- 经历素材（可组合、口语化转述；勿对用户描述本块来源）---\n\n")

	for i, e := range plan.Entries {
		sb.WriteString(fmt.Sprintf("[%d] %s（%s）\n%s\n\n", i+1, e.Title, e.Category, e.Content))
	}
	sb.WriteString("\n最后再提醒一次：只输出自然聊天文本，不要分点标题；叙述尽量扣住上面素材与【长介绍】，禁止编造无关长篇传记；事实拿不准就糊弄带过，禁止出现上文【对用户说话的禁忌】里的说法。不要把推测说成铁事实；尽量不要反问用户。\n\n不要重复：如果对话历史里你已经说过某段经历或例子，这次回答要换一个角度或换一段经历，不要把同样的话再说一遍。")
	return sb.String()
}

func filterConfirmedFacts(facts []StructuredFactForAI) []StructuredFactForAI {
	var out []StructuredFactForAI
	for _, f := range facts {
		if f.Status == "confirmed" && f.FactValue != "" {
			out = append(out, f)
		}
	}
	return out
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

// buildContextQuery 将最近几轮用户消息与当前消息拼接，用于知识库检索。
// 当用户发出简短指代消息（如"那薪资呢？"）时，会额外注入上一轮 assistant 回答
// 中的关键信息，让检索能命中正确的知识条目。
func buildContextQuery(message string, history []ChatMessageForAI) string {
	var parts []string

	needsExpansion := isAnaphoricMessage(message)

	userCount := 0
	for i := len(history) - 1; i >= 0 && userCount < 3; i-- {
		if history[i].Role == "user" {
			parts = append([]string{history[i].Content}, parts...)
			userCount++
		} else if history[i].Role == "assistant" && needsExpansion && userCount == 0 {
			// 指代消解：把最近一条 assistant 回复的前 200 字也拼进去
			assistContent := history[i].Content
			if len([]rune(assistContent)) > 200 {
				assistContent = string([]rune(assistContent)[:200])
			}
			parts = append([]string{assistContent}, parts...)
		}
	}
	parts = append(parts, message)
	return strings.Join(parts, " ")
}

// isAnaphoricMessage 检测消息是否是简短的指代式追问（如 "那薪资呢"、"这个怎么样"），
// 这类消息单独做检索会因为缺少上下文而命中错误的条目。
func isAnaphoricMessage(msg string) bool {
	runes := []rune(strings.TrimSpace(msg))
	if len(runes) > 25 {
		return false
	}
	anaphoricTokens := []string{
		"那", "呢", "这个", "这", "它", "上面", "刚才", "前面",
		"也是", "还有", "另外", "同样", "怎么样", "如何",
		"对了", "所以", "然后呢", "接着", "继续",
	}
	lower := strings.ToLower(msg)
	for _, tok := range anaphoricTokens {
		if strings.Contains(lower, tok) {
			return true
		}
	}
	return false
}

// historyTokenBudget 是分配给历史消息的 token 预算。
// 中文约 1.5-2 token/字，4000 token ≈ 2000-2700 字 ≈ 10-15 条中等长度的消息。
const historyTokenBudget = 4000

// estimateTokens 粗估中文文本的 token 数（中文约 1.5-2 token/字，取 1.8）
func estimateTokens(text string) int {
	return int(float64(len([]rune(text))) * 1.8)
}

func buildMessages(systemContent, displayName string, history []ChatMessageForAI, newMessage string, opts *ChatOptions) []openai.ChatCompletionMessage {
	messages := make([]openai.ChatCompletionMessage, 0, len(history)+5)
	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleSystem,
		Content: systemContent,
	})

	if opts != nil && opts.CrossSessionMemory != "" {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleSystem,
			Content: "【之前的对话记忆】\n以下是你与这位用户之前聊过的内容摘要，可作为背景参考，但不要主动提起除非用户问到相关话题：\n" + opts.CrossSessionMemory,
		})
	}

	if opts != nil && opts.SessionSummary != "" {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleSystem,
			Content: "【本次对话早期内容摘要】\n" + opts.SessionSummary,
		})
	}

	// Sliding Window with Token Budget: 从最新消息往回填充，超预算截断
	// (LangChain ConversationTokenBufferMemory 同原理)
	trimmedHistory := truncateHistoryByTokenBudget(history, historyTokenBudget)
	for _, m := range trimmedHistory {
		role := openai.ChatMessageRoleUser
		if m.Role == "assistant" {
			role = openai.ChatMessageRoleAssistant
		}
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    role,
			Content: m.Content,
		})
	}

	if opts != nil && opts.KnowledgeContext != "" {
		messages = append(messages, openai.ChatCompletionMessage{
			Role:    openai.ChatMessageRoleSystem,
			Content: opts.KnowledgeContext,
		})
	}

	messages = append(messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: newMessage,
	})
	return messages
}

// truncateHistoryByTokenBudget 从最新消息往回填充，直到用完 token 预算。
// 保留的消息保持时间正序。超长的单条消息会被内部截断。
func truncateHistoryByTokenBudget(history []ChatMessageForAI, budget int) []ChatMessageForAI {
	if len(history) == 0 {
		return history
	}
	remaining := budget
	startIdx := len(history)
	for i := len(history) - 1; i >= 0; i-- {
		msgTokens := estimateTokens(history[i].Content)
		if msgTokens > remaining {
			// 如果这条消息本身就超大，截断它的内容以适应剩余预算
			if remaining > 200 && startIdx == len(history) {
				maxRunes := int(float64(remaining) / 1.8)
				runes := []rune(history[i].Content)
				if len(runes) > maxRunes {
					truncated := ChatMessageForAI{
						Role:    history[i].Role,
						Content: string(runes[:maxRunes]) + "…（更早内容已省略）",
					}
					result := make([]ChatMessageForAI, 0, len(history)-i)
					result = append(result, truncated)
					result = append(result, history[i+1:]...)
					return result
				}
			}
			break
		}
		remaining -= msgTokens
		startIdx = i
	}
	if startIdx >= len(history) {
		return nil
	}
	return history[startIdx:]
}

func humanizeReply(content string) string {
	content = strings.ReplaceAll(content, "\r\n", "\n")
	content = headingRe.ReplaceAllString(content, "")
	content = listItemRe.ReplaceAllString(content, "")
	content = mdBoldRe.ReplaceAllString(content, "$1")
	content = mdItalicRe.ReplaceAllString(content, "$1")
	content = backtickRe.ReplaceAllString(content, "")

	// 去掉常见 AI 套话（即使 prompt 禁止了，模型仍会偶尔输出）
	content = stripAIPhrasesRe.ReplaceAllString(content, "")

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
