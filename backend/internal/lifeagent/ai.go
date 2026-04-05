package lifeagent

import (
	"fmt"
	"regexp"
	"strings"
)

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
}

type ChatMessageForAI struct {
	Role    string
	Content string
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
			content = "这事儿我不敢瞎蒙，你多给点线索咱再唠。"
			return content, nil
		}
		content = buildSpeculativeReply(profile, message)
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
			content += "\n\n还有啥想问的你接着说。"
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
		content = "啧，这茬我接不太住，咱换个你能用得上的聊？"
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

	// 加一句简短的收尾，保持对话感
	content += "\n\n还有啥想问的你接着说。"

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

func buildSpeculativeReply(profile ProfileForAI, message string) string {
	norm := normalize(message)
	switch {
	case strings.Contains(norm, "最近") && (strings.Contains(norm, "瓜") || strings.Contains(norm, "八卦")):
		return "如果按常见情况看，最近风声一般不会少，只是很多还在传，没到能拍板的时候。大概率都是先小范围发酵，后面才会慢慢有更多细节出来。"
	case strings.Contains(norm, "是真的吗") || strings.Contains(norm, "真假") || strings.Contains(norm, "是不是"):
		return "这个我没法百分百给你拍死，不过按常见情况看，能反复传开的往往不是完全空穴来风，只是细节经常会被越传越夸张。"
	case strings.Contains(norm, "怎么") || strings.Contains(norm, "怎么办"):
		return "如果按常见情况看，先别急着下结论，先把关键信息对一遍，再看最可能的原因和后手，这样通常比一上来硬判断靠谱。"
	default:
		focus := firstSentence(profile.Headline, 30)
		if focus == "" {
			focus = "我比较熟的方向"
		}
		return fmt.Sprintf("这个我没法百分百确定，不过如果按常见情况看，大概率和「%s」这类情况有点像。你要是再多给我一点背景，我可以继续帮你往下推。", focus)
	}
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

func scoreEntry(message string, entry KnowledgeEntryForAI) int {
	normMsg := normalize(message)
	normContent := normalize(entry.Content)
	normTitle := normalize(entry.Title)
	tokens := tokenize(message)
	score := 0
	// 困难/低谷类问题：与知识库里失败、复盘、舆论、伤病等主题对齐
	hardshipHints := []string{"困难", "最难", "低谷", "挫折", "难熬", "走不出来", "崩溃", "熬"}
	for _, h := range hardshipHints {
		if strings.Contains(normMsg, normalize(h)) {
			for _, needle := range []string{"低谷", "失败", "丧", "emo", "舆论", "输", "跟腱", "拆队", "复盘", "绿军", "凯尔特人"} {
				if strings.Contains(normContent, needle) || strings.Contains(normTitle, needle) {
					score += 5
					break
				}
			}
			break
		}
	}
	if strings.Contains(normMsg, "詹姆斯") || strings.Contains(normMsg, "勒布朗") || strings.Contains(normMsg, "lebron") {
		for _, needle := range []string{"詹姆斯", "勒布朗", "lebron", "对手", "时代", "国家队", "奥运"} {
			if strings.Contains(normContent, needle) || strings.Contains(normTitle, needle) {
				score += 8
				break
			}
		}
	}
	for _, tag := range entry.Tags {
		if strings.Contains(normMsg, normalize(tag)) {
			score += 7
		}
	}
	if strings.Contains(normMsg, normalize(entry.Title)) {
		score += 5
	}
	if strings.Contains(normMsg, normalize(entry.Category)) {
		score += 3
	}
	for _, tok := range tokens {
		if strings.Contains(normalize(entry.Title), tok) {
			score += 3
		}
		if strings.Contains(normalize(entry.Content), tok) {
			score += 2
		}
		for _, tag := range entry.Tags {
			if strings.Contains(normalize(tag), tok) {
				score += 3
				break
			}
		}
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
