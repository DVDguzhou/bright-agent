package lifeagent

import (
	"regexp"
	"strings"
)

type ProfileForAI struct {
	DisplayName   string
	Headline      string
	Audience      string
	WelcomeMessage string
	ExpertiseTags []string
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

	intro := "结合 " + profile.DisplayName + " 过往分享里最相关的几段经验，我建议你先把问题拆小。"
	if len(topEntries) == 0 {
		intro = profile.DisplayName + " 目前没有完全对应的现成经验，我先基于他的整体经历给你一个稳妥建议。"
	}

	reflection := "先想清楚你现在最想解决的是结果、路径，还是情绪压力，这会决定下一步动作。"
	if lastUserContent != "" && lastUserContent != message {
		ref := firstSentence(lastUserContent, 24)
		reflection = "你这次的问题和上一轮提到的\"" + ref + "\"是连着的，所以先保持同一目标，不要一次改太多变量。"
	}

	var bullets []string
	for i, e := range selectedEntries {
		n := string(rune('1' + i))
		bullets = append(bullets, n+". "+e.Title+"："+firstSentence(e.Content, 90))
	}
	bulletsStr := strings.Join(bullets, "\n")

	closing := "如果你愿意，我下一轮可以继续按「现状分析 / 选项比较 / 具体行动」三步陪你往下拆。"

	content = "你好，我会尽量用 " + profile.DisplayName + " 的经验视角来回答你。\n\n" +
		intro + "\n\n" + reflection + "\n\n" +
		"你可以重点参考这几条：\n" + bulletsStr + "\n\n" + closing

	references = make([]map[string]string, len(selectedEntries))
	for i, e := range selectedEntries {
		references[i] = map[string]string{
			"id": e.ID, "category": e.Category, "title": e.Title,
			"excerpt": firstSentence(e.Content, 80),
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
