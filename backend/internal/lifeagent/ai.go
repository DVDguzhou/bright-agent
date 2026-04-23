package lifeagent

import (
	"fmt"
	"math/rand"
	"regexp"
	"strings"
)

// ── Style-Adaptive Fallback Pools ──
// 每种回退场景维护多条候选，随机选取避免重复暴露模板。

var fallbackHighRisk = []string{
	"这种具体到门牌号真名啥的我不接招啊，咱聊点别的。",
	"哈哈这个太私密了，我不方便说，换个话题？",
	"这个涉及隐私我就不说了，聊别的吧。",
	"嗯……这个不太好说，你有别的想问的不？",
}

var fallbackNoKnowledge = []string{
	"这个我确实没太了解过，聊别的我可能接得住。",
	"嗯……这个我还真没经历过，不太好瞎说。",
	"这茬我不太熟，你要是问别的方向的我可能能接上。",
	"说实话这个我不太懂，怕说错了误导你。",
	"这个超出我的经验范围了，换个话题聊？",
}

var fallbackSpeculative = []string{
	"这个我没法百分百确定，但凭我的经验感觉大概是那么回事。你要不再多说点背景？",
	"嗯……不太确定，不过按我之前遇到的情况看，应该差不多是这样。",
	"这个我没直接经历过，但听我身边的人说过类似的情况。你要不说具体点？",
	"说实话拿不准，但如果非要猜的话……你再给我点信息我帮你想想。",
}

var fallbackConversationEnders = []string{
	"",
	"",
	"\n\n还有啥想聊的你说。",
	"\n\n你还有别的想问的不？",
	"\n\n接着聊呗。",
}

func pickRandom(pool []string) string {
	return pool[rand.Intn(len(pool))]
}

type ProfileForAI struct {
	DisplayName      string
	Headline         string
	ShortBio         string
	LongBio          string
	Audience         string
	WelcomeMessage   string
	ExpertiseTags    []string
	MBTI             string
	PersonaArchetype string
	ToneStyle        string
	ResponseStyle    string
	ForbiddenPhrases []string
	ExampleReplies   []string
	NotSuitableFor   string // 不能/不想回答的问题，供 AI 参考
}

type KnowledgeEntryForAI struct {
	ID       string
	Category string
	Title    string
	Content  string
	Tags     []string
	// Embedding 可选：存在则参与 hybrid RAG 的向量召回；为 nil 时自动退化为纯词法。
	Embedding []float32
}

type ChatMessageForAI struct {
	Role    string
	Content string
}

type LiveUpdateForAI struct {
	ID        string
	Content   string
	Category  string
	Location  string
	CreatedAt string
	FreshDays int
	Embedding []float32
}

func BuildReply(profile ProfileForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string) (content string, references []map[string]string) {
	if reply, refs, ok := ResolveGroundedFactReply(profile, facts, message); ok {
		return reply, refs
	}
	plan := BuildRetrievalPlan(message, history, facts, topics, entries)
	topTopics := plan.Topics
	topEntries := plan.Entries

	// 没有任何匹配的知识条目：低风险问题先尝试带保留地推测，高风险具体事实才拒答
	if len(topTopics) == 0 && len(topEntries) == 0 && len(plan.Facts) == 0 {
		if isHighRiskFactQuestion(message) {
			content = pickRandom(fallbackHighRisk)
			return content, nil
		}
		content = pickRandom(fallbackSpeculative)
		return content, nil
	}

	if len(topEntries) == 0 && len(plan.Facts) > 0 {
		content = buildFactReply(plan.Facts[0].FactKey, plan.Facts)
		return content, BuildRetrievalReferences(plan)
	}

	if len(topTopics) > 0 {
		parts := make([]string, 0, len(topTopics))
		for _, topic := range topTopics {
			snippet := strings.TrimSpace(topic.Summary)
			if snippet == "" {
				continue
			}
			parts = append(parts, snippet)
		}
		if len(parts) > 0 {
			content = parts[0]
			for i := 1; i < len(parts); i++ {
				content += "\n\n另外，" + parts[i]
			}
			content += pickRandom(fallbackConversationEnders)
			content = ApplyClaimGuard(message, content, facts, plan)
			return content, BuildRetrievalReferences(plan)
		}
	}

	// 有匹配的知识条目 → 用人设语气自然地呈现知识内容
	// 若用户问「叫什么」类简单事实，优先给简短直接回答，不堆砌条目标题
	if isAskingName(message) && len(topEntries) > 0 {
		if name := extractNameFromContent(topEntries[0].Content, message); name != "" {
			content = fmt.Sprintf("叫%s。", name)
			references = make([]map[string]string, 1)
			references[0] = map[string]string{
				"id": topEntries[0].ID, "category": topEntries[0].Category,
				"title": topEntries[0].Title, "excerpt": firstSentence(topEntries[0].Content, 80),
			}
			return content, references
		}
	}

	var parts []string
	for _, e := range topEntries {
		snippet := strings.TrimSpace(e.Content)
		if snippet == "" {
			continue
		}
		parts = append(parts, snippet)
	}

	if len(parts) == 0 {
		content = pickRandom(fallbackNoKnowledge)
		return content, nil
	}

	// 单条直接说，多条之间自然衔接
	if len(parts) == 1 {
		content = parts[0]
	} else {
		content = parts[0]
		for i := 1; i < len(parts); i++ {
			content += "\n\n另外，" + parts[i]
		}
	}

	content += pickRandom(fallbackConversationEnders)

	content = ApplyClaimGuard(message, content, facts, plan)
	references = BuildRetrievalReferences(plan)
	return content, references
}

// isAskingName 判断是否为「叫什么」类简单事实问题
func isAskingName(msg string) bool {
	norm := strings.ToLower(strings.TrimSpace(msg))
	norm = regexp.MustCompile(`\s+`).ReplaceAllString(norm, "")
	return strings.Contains(norm, "叫什么") || strings.Contains(norm, "叫什么名字") ||
		strings.Contains(norm, "是什么名字") || strings.Contains(norm, "叫什么名")
}

// extractNameFromContent 从知识库内容中抽取「叫什么」的答案，如：参加北京创业大赛 → 北京创业大赛
func extractNameFromContent(content, _ string) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return ""
	}
	// 参加 XXX大赛/比赛/活动 → 捕获包含大赛/比赛/活动的完整名称
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`参加([^，。]+?(?:大赛|比赛|活动))`),
		regexp.MustCompile(`参加([^，。]+?)(?:，|。)`),
		regexp.MustCompile(`在([^，。]+?)(?:工作|实习|参赛|比赛)`),
	}
	for _, re := range patterns {
		m := re.FindStringSubmatch(content)
		if len(m) >= 2 {
			name := strings.TrimSpace(m[1])
			if len(name) >= 2 && len(name) <= 20 {
				return name
			}
		}
	}
	return ""
}

func isHighRiskFactQuestion(msg string) bool {
	norm := normalize(msg)
	patterns := []string{
		"叫什么名字", "真名", "本名", "妈妈叫什么", "爸爸叫什么",
		"几月几号", "具体哪天", "生日", "几岁", "年龄",
		"住哪", "住哪里", "地址", "电话", "手机号", "微信", "身份证", "银行卡",
	}
	for _, p := range patterns {
		if strings.Contains(norm, p) {
			return true
		}
	}
	return false
}

func firstSentence(s string, maxLen int) string {
	s = strings.TrimSpace(s)
	re := regexp.MustCompile(`.*?[。！？.!?]`)
	m := re.FindString(s)
	if m == "" {
		m = s
	}
	// 按 rune 截断，避免在 UTF-8 多字节字符中间切断导致乱码
	runes := []rune(m)
	if len(runes) > maxLen {
		return strings.TrimSpace(string(runes[:maxLen])) + "..."
	}
	return m
}

// TruncateToRunes 按字符（rune）截断，避免在 UTF-8 多字节字符中间切断导致乱码
func TruncateToRunes(s string, maxRunes int) string {
	runes := []rune(s)
	if len(runes) <= maxRunes {
		return s
	}
	return string(runes[:maxRunes]) + "..."
}

func normalizeSnippet(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	// 去掉常见口头语开头，避免回退模板里显得突兀
	re := regexp.MustCompile(`^(哎呀|哎|唉|嗯|额|那个|其实|怎么说呢)[，,\s]*`)
	s = re.ReplaceAllString(s, "")
	return strings.TrimSpace(s)
}

func scoreEntry(message string, entry KnowledgeEntryForAI, route RetrievalRoute, selectedTopics []TopicSummaryForAI) int {
	normMsg := normalize(message)
	normContent := normalize(entry.Content)
	normTitle := normalize(entry.Title)
	normCategory := normalize(entry.Category)
	normTags := make([]string, 0, len(entry.Tags))
	for _, tag := range entry.Tags {
		normTags = append(normTags, normalize(tag))
	}
	tokens := tokenize(message)
	score := 0

	if strings.Contains(normMsg, normTitle) && normTitle != "" {
		score += 8
	}
	if strings.Contains(normMsg, normCategory) && normCategory != "" {
		score += 4
	}
	for _, tag := range normTags {
		if tag != "" && strings.Contains(normMsg, tag) {
			score += 7
		}
	}
	for _, tok := range tokens {
		if strings.Contains(normTitle, tok) {
			score += 4
		}
		if strings.Contains(normCategory, tok) {
			score += 2
		}
		if strings.Contains(normContent, tok) {
			score += 2
		}
		for _, tag := range normTags {
			if strings.Contains(tag, tok) {
				score += 3
				break
			}
		}
	}

	for _, topic := range selectedTopics {
		if topic.TopicLabel != "" && strings.Contains(normContent, normalize(topic.TopicLabel)) {
			score += 4
		}
		for _, alias := range topic.Aliases {
			if alias != "" && strings.Contains(normContent, normalize(alias)) {
				score += 3
				break
			}
		}
	}

	switch route {
	case RetrievalRouteEntry:
		score += 3
	case RetrievalRouteTopic:
		if len(selectedTopics) > 0 {
			score += 2
		}
	case RetrievalRouteFact:
		score /= 2
	}

	return score
}

func normalize(s string) string {
	s = strings.ToLower(s)
	s = regexp.MustCompile(`\s+`).ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}

func tokenize(s string) []string {
	norm := normalize(s)
	re := regexp.MustCompile(`[\s,.;:!?()[\]{}"'""''、，。；：！？\-_/]+`)
	parts := re.Split(norm, -1)
	seen := make(map[string]bool)
	var out []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if len(p) >= 2 && !seen[p] {
			seen[p] = true
			out = append(out, p)
		}
	}
	return out
}
