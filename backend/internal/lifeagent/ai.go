package lifeagent

import (
	"fmt"
	"regexp"
	"strings"
)

type ProfileForAI struct {
	DisplayName      string
	Headline         string
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

func BuildReply(profile ProfileForAI, entries []KnowledgeEntryForAI, history []ChatMessageForAI, message string) (content string, references []map[string]string) {
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
	var topEntries []KnowledgeEntryForAI
	for _, r := range ranked {
		if r.score > 0 {
			topEntries = append(topEntries, r.entry)
			if len(topEntries) >= 3 {
				break
			}
		}
	}
	var selectedEntries []KnowledgeEntryForAI
	if len(topEntries) > 0 {
		selectedEntries = topEntries
	} else if len(entries) >= 2 {
		selectedEntries = entries[:2]
	} else if len(entries) > 0 {
		selectedEntries = entries
	}

	var lastUserContent string
	for i := len(history) - 1; i >= 0; i-- {
		if history[i].Role == "user" {
			lastUserContent = history[i].Content
			break
		}
	}

	intro := "你这个问题问得很实在，我先按我自己走过的路给你一个稳一点的判断。"
	if len(topEntries) == 0 {
		intro = "这个问题我手上没有完全一模一样的经历，硬说会有点假，我只能给你一个我觉得更稳妥的方向。"
	}
	if profile.Headline != "" {
		intro += "我平时主要在「" + firstSentence(profile.Headline, 28) + "」这块积累经验。"
	}

	reflection := "你先想清楚，你现在最卡的是结果、方法，还是执行节奏，不然很容易每样都碰一点但推进不动。"
	if lastUserContent != "" && lastUserContent != message {
		ref := firstSentence(lastUserContent, 24)
		reflection = "你这次问的和上一轮提到的\"" + ref + "\"其实是一条线上的，先别来回换方向。"
	}

	var snippets []string
	for _, e := range selectedEntries {
		tip := normalizeSnippet(firstSentence(e.Content, 90))
		if tip == "" {
			tip = "这块我建议先做一次小范围验证，再根据反馈继续调整。"
		}
		snippets = append(snippets, fmt.Sprintf("拿「%s」来说，我踩过坑后的做法是：%s", e.Title, tip))
	}
	snippetsStr := strings.Join(snippets, "\n\n")

	closing := "你要是愿意，可以把你现在的具体情况再说细一点，我按我的经历继续帮你往下拆。"

	content = intro + "\n\n" + reflection
	if snippetsStr != "" {
		content += "\n\n" + snippetsStr
	}
	content += "\n\n" + closing

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
	return content, references
}

func firstSentence(s string, maxLen int) string {
	s = strings.TrimSpace(s)
	re := regexp.MustCompile(`.*?[。！？.!?]`)
	m := re.FindString(s)
	if m == "" {
		m = s
	}
	if len(m) > maxLen {
		return strings.TrimSpace(m[:maxLen]) + "..."
	}
	return m
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
	tokens := tokenize(message)
	score := 0
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
