package lifeagent

import (
	"regexp"
	"strings"
)

var realtimeWebSearchRe = regexp.MustCompile(`(?i)` +
	`分数线|录取线|投档线|省控线|本科线|专科线|一本线|二本线|特控线|最低分|最高分|位次|一分一段|招生计划|招生人数|录取人数|录取率|` +
	`研招|调剂信息|报志愿|志愿填报|高考政策|考研国家线|校线|复试线|提档线|批次线|投档分|录取分`)

// NeedsRealtimeWebSearch detects questions that require up-to-date public data before answering.
func NeedsRealtimeWebSearch(message string) bool {
	msg := strings.TrimSpace(message)
	if msg == "" {
		return false
	}
	if realtimeWebSearchRe.MatchString(msg) {
		return true
	}
	// Explicit user request to look up live data
	lookup := []string{"搜一下", "查一下", "帮我查", "联网", "最新", "今年", "2024", "2025", "2026"}
	for _, kw := range lookup {
		if strings.Contains(msg, kw) && (strings.Contains(msg, "分") || strings.Contains(msg, "录取") || strings.Contains(msg, "招生") || strings.Contains(msg, "政策")) {
			return true
		}
	}
	return false
}

// BuildWebSearchQuery composes a concise search query from the user message and recent context.
func BuildWebSearchQuery(message string, history []ChatMessageForAI) string {
	msg := strings.TrimSpace(message)
	if msg == "" {
		return ""
	}
	var parts []string
	for i := len(history) - 1; i >= 0 && len(parts) < 2; i-- {
		if history[i].Role != "user" {
			continue
		}
		prev := strings.TrimSpace(history[i].Content)
		if prev != "" && prev != msg {
			parts = append([]string{prev}, parts...)
		}
	}
	parts = append(parts, msg)
	query := strings.Join(parts, " ")
	query = strings.Join(strings.Fields(query), " ")
	if len([]rune(query)) > 120 {
		query = string([]rune(query)[:120])
	}
	return query
}
