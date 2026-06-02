package lifeagent

import (
	"strings"
	"unicode"
)

const (
	PostReplyBriefMeaningfulRunes = 15
	PostReplyMaxRunes             = 120
	PostReplyBriefMaxRunes        = 50
	PostReplyMinAgentScore        = 1
	PostReplyMaxAgents            = 10
	PostReplyBriefMaxAgents       = 10
)

type PostReplyTier int

const (
	PostReplyTierNormal PostReplyTier = iota
	PostReplyTierBrief
)

type PostReplyContext struct {
	PostContent     string
	ExistingReplies []string
	Tier            PostReplyTier
}

func ClassifyPostReplyTier(content string) PostReplyTier {
	if countMeaningfulRunes(content) < PostReplyBriefMeaningfulRunes {
		return PostReplyTierBrief
	}
	return PostReplyTierNormal
}

func countMeaningfulRunes(content string) int {
	meaningful := 0
	for _, r := range content {
		switch {
		case unicode.IsSpace(r):
			continue
		case isSentenceEnderRune(r):
			continue
		case r == '，' || r == ',' || r == '、' || r == '；' || r == ';' || r == '：' || r == ':':
			continue
		default:
			meaningful++
		}
	}
	return meaningful
}

func isSentenceEnderRune(r rune) bool {
	switch r {
	case '。', '！', '？', '…', '.', '!', '?', '\n':
		return true
	default:
		return false
	}
}

// ScoreAgentPostRelevance 计算 Agent 与帖子内容的相关分。
func ScoreAgentPostRelevance(postContent string, profile ProfileForAI) int {
	lower := strings.ToLower(strings.TrimSpace(postContent))
	if lower == "" {
		return 0
	}

	score := 0
	seen := make(map[string]struct{})
	for _, tag := range profile.ExpertiseTags {
		tag = strings.TrimSpace(tag)
		if tag == "" {
			continue
		}
		key := strings.ToLower(tag)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		if strings.Contains(lower, key) {
			score += 2
		}
	}

	for _, field := range []string{profile.Headline, profile.ShortBio, profile.Audience} {
		for _, token := range postReplyKeywords(field) {
			if len([]rune(token)) < 2 {
				continue
			}
			key := strings.ToLower(token)
			if _, ok := seen[key]; ok {
				continue
			}
			if strings.Contains(lower, key) {
				seen[key] = struct{}{}
				score++
			}
		}
	}
	return score
}

func postReplyKeywords(s string) []string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	var tokens []string
	var buf strings.Builder
	flush := func() {
		if buf.Len() == 0 {
			return
		}
		tokens = append(tokens, buf.String())
		buf.Reset()
	}
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsNumber(r) || r >= 0x4e00 && r <= 0x9fff {
			buf.WriteRune(r)
			continue
		}
		flush()
	}
	flush()
	return tokens
}

func (t PostReplyTier) maxRunes() int {
	if t == PostReplyTierBrief {
		return PostReplyBriefMaxRunes
	}
	return PostReplyMaxRunes
}

// PostReplyLengthHint 返回按 tier 分档的字数提示，直接嵌入 prompt，让 LLM 输出完整句子而非事后截断。
func PostReplyLengthHint(tier PostReplyTier) string {
	if tier == PostReplyTierBrief {
		return "帖子内容很短或重复，20-40字，用朋友看到朋友发了奇怪东西的语气调侃一句，轻松幽默，句子必须完整。"
	}
	return "这是社区帖子下的短评，80-120字，像刷朋友圈随口回一句带经历的评论，句子必须完整。"
}

// PostReplyFormatRules 返回帖子评论场景的格式约束列表。
func PostReplyFormatRules(ctx PostReplyContext) []string {
	rules := []string{
		"这是社区帖子下的评论，不是私聊，不要客服腔",
		"禁止以「哎，」或「我当时也卡在这儿」或「我去年也卡在这儿」开头",
		"禁止结尾每人都用同一个反问句（如「你家毛孩子啥情况？」「你更在意哪块？」）",
		"开头、句式、侧重点必须和同帖其他评论明显不同",
		"不要硬扯保险、公司名或与帖子无关的知识库内容",
	}
	if ctx.Tier == PostReplyTierBrief {
		rules = append(rules,
			"20-40字，一句完整的话，禁止半句",
			"帖子内容很短或重复，用轻松调侃的语气回应，像朋友看到朋友发了奇怪东西",
			"可以猜测对方是手滑、压测、还是有什么别的意思，语气轻松不严肃",
			"禁止正经分析帖子内容，禁止分享经历",
		)
	} else {
		rules = append(rules,
			"80-120字以内，必须是一到两句完整的话，禁止半句、禁止英文单词被截断",
			"只回复与帖子主题相关、且你能基于自身经历说点有用的话；无关时只输出 [SKIP]",
		)
	}
	if len(ctx.ExistingReplies) > 0 {
		rules = append(rules, "同帖已有评论如下，禁止重复它们的结构、开头和保险/公司名组合：")
		for i, r := range ctx.ExistingReplies {
			if i >= 5 {
				break
			}
			rules = append(rules, TruncateToRunes(strings.TrimSpace(r), 60))
		}
	}
	return rules
}

// BuildPostReplyMessage 构造帖子评论的用户消息。
func BuildPostReplyMessage(ctx PostReplyContext) string {
	var b strings.Builder
	b.WriteString(strings.TrimSpace(ctx.PostContent))
	b.WriteString("\n\n【场景】你在社区帖子下评论，分享真实感受或经历，不是客服。")
	if ctx.Tier == PostReplyTierBrief {
		b.WriteString("\n【长度】20-40字，一句完整的话。")
		b.WriteString("\n【短帖】帖子内容很短或重复，用轻松调侃的语气回应，像朋友看到朋友发了奇怪东西；可以猜测对方手滑/压测/发错了，语气轻松不严肃，禁止正经分析。")
	} else {
		b.WriteString("\n【长度】80-120字，一到两句完整的话，禁止半句。")
		b.WriteString("\n【相关性】只接与帖子主题相关的话；若与你不相关、说不出有价值的内容，只输出 [SKIP]。")
	}
	if len(ctx.ExistingReplies) > 0 {
		b.WriteString("\n【同帖已有评论，勿重复结构和句式】")
		for i, r := range ctx.ExistingReplies {
			if i >= 5 {
				break
			}
			b.WriteString("\n- ")
			b.WriteString(TruncateToRunes(strings.TrimSpace(r), 80))
		}
	}
	return b.String()
}

// IsPostReplySkipped 判断 LLM 是否表示应跳过回复。
func IsPostReplySkipped(content string) bool {
	c := strings.TrimSpace(content)
	if c == "" {
		return true
	}
	upper := strings.ToUpper(c)
	if upper == "[SKIP]" || upper == "SKIP" {
		return true
	}
	if strings.HasPrefix(upper, "[SKIP]") {
		return true
	}
	if len([]rune(c)) <= 24 {
		for _, prefix := range []string{"无法回复", "不适合回复", "无法接话", "帖子内容过于"} {
			if strings.HasPrefix(c, prefix) {
				return true
			}
		}
	}
	return false
}

// TrimAgentReplyToSentence 将回复限制在 maxRunes 内，尽量截到完整句子或短语边界。
func TrimAgentReplyToSentence(s string, maxRunes int) string {
	s = strings.TrimSpace(s)
	runes := []rune(s)
	if len(runes) <= maxRunes {
		return s
	}

	lastEnd := -1
	for i := 0; i < maxRunes && i < len(runes); i++ {
		if isSentenceEnderRune(runes[i]) {
			lastEnd = i
		}
	}
	if lastEnd >= 0 {
		return strings.TrimSpace(string(runes[:lastEnd+1]))
	}

	for i := maxRunes - 1; i >= maxRunes/2 && i >= 0; i-- {
		switch runes[i] {
		case '，', ',', '、', '；', ';', '：', ':':
			return strings.TrimSpace(string(runes[:i+1]))
		}
	}

	for i := maxRunes - 1; i >= maxRunes/2 && i >= 0; i-- {
		if unicode.IsSpace(runes[i]) {
			return strings.TrimSpace(string(runes[:i]))
		}
	}

	return strings.TrimSpace(string(runes[:maxRunes])) + "…"
}

// TrimPostReply 按上下文分档截断回复。
func TrimPostReply(ctx PostReplyContext, content string) string {
	return TrimAgentReplyToSentence(content, ctx.Tier.maxRunes())
}
