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

	// 没有任何匹配的知识条目 → 直接说不知道
	if len(topEntries) == 0 {
		content = fmt.Sprintf("这个问题我的经验里没有涉及，我不太清楚，不敢乱说。你可以问问我擅长的方向，比如「%s」相关的问题。",
			firstSentence(profile.Headline, 30))
		return content, nil
	}

	// 有匹配的知识条目 → 直接把知识内容作为回答呈现
	var parts []string
	for _, e := range topEntries {
		snippet := strings.TrimSpace(e.Content)
		if snippet == "" {
			continue
		}
		parts = append(parts, snippet)
	}

	if len(parts) == 0 {
		content = "这个问题我暂时答不上来，我的知识库里还没有这方面的内容。"
		return content, nil
	}

	content = strings.Join(parts, "\n\n")

	// 如果有多条，加一句简短收尾
	if len(parts) > 1 {
		content += "\n\n你要是还想了解更细的，可以接着问。"
	}

	references = make([]map[string]string, len(topEntries))
	for i, e := range topEntries {
		excerpt := normalizeSnippet(firstSentence(e.Content, 80))
		if excerpt == "" {
			excerpt = "来自知识库的相关内容。"
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
