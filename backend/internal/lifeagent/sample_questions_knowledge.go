package lifeagent

import (
	"regexp"
	"strings"
)

// KnowledgeSnippet 知识库片段，用于生成展示用示例问题。
type KnowledgeSnippet struct {
	Title   string
	Content string
	Tags    []string
}

var skipKnowledgeHeaders = map[string]bool{
	"基本情况": true, "个人情况": true, "录入信息": true, "同校情况": true,
	"相关外校情况": true, "总结": true, "前言": true, "目录": true,
	"嘉宾分享": true, "主持人": true, "附录": true, "参考资料": true,
	"写在前面": true, "写在最后": true, "背景介绍": true,
}

var (
	mdHeaderRe     = regexp.MustCompile(`(?m)^#{1,3}\s+(.+?)\s*$`)
	sampleQBoldRe  = regexp.MustCompile(`\*\*([^*\n]{2,24})\*\*`)
	listColonRe    = regexp.MustCompile(`(?m)^[-*]\s+(.{4,36}?)[：:]\s*.+$`)
)

// DeriveSampleQuestionsFromKnowledge 从知识库正文提取可问的具体话题并转成示例问题。
func DeriveSampleQuestionsFromKnowledge(entries []KnowledgeSnippet) []string {
	var out []string
	for _, e := range entries {
		out = append(out, questionsFromKnowledgeEntry(e)...)
	}
	return uniqueSampleQuestions(out)
}

func questionsFromKnowledgeEntry(e KnowledgeSnippet) []string {
	content := strings.TrimSpace(e.Content)
	if content == "" {
		return nil
	}
	var hooks []string
	if t := cleanKnowledgeHook(e.Title); t != "" && !skipKnowledgeHeaders[t] {
		hooks = append(hooks, t)
	}
	for _, tag := range e.Tags {
		if t := cleanKnowledgeHook(tag); t != "" && !genericExpertiseTags[t] {
			hooks = append(hooks, t)
		}
	}
	for _, h := range extractMarkdownHeaders(content) {
		hooks = append(hooks, h)
	}
	for _, h := range extractBoldPhrases(content, 4) {
		hooks = append(hooks, h)
	}
	for _, h := range extractListHooks(content, 4) {
		hooks = append(hooks, h)
	}

	var out []string
	seenHook := make(map[string]bool)
	for _, hook := range hooks {
		hook = cleanKnowledgeHook(hook)
		if hook == "" || seenHook[hook] || skipKnowledgeHeaders[hook] {
			continue
		}
		if isGenericKnowledgeHook(hook) {
			continue
		}
		seenHook[hook] = true
		if q := questionFromKnowledgeHook(hook); q != "" {
			out = append(out, q)
		}
		if len(out) >= 6 {
			break
		}
	}
	return out
}

func extractMarkdownHeaders(content string) []string {
	var out []string
	for _, m := range mdHeaderRe.FindAllStringSubmatch(content, 12) {
		if len(m) < 2 {
			continue
		}
		h := cleanKnowledgeHook(m[1])
		if h == "" || len([]rune(h)) > 22 {
			continue
		}
		out = append(out, h)
	}
	return out
}

func extractBoldPhrases(content string, max int) []string {
	if max <= 0 {
		return nil
	}
	scan := content
	if len(scan) > 2500 {
		scan = scan[:2500]
	}
	var out []string
	for _, m := range sampleQBoldRe.FindAllStringSubmatch(scan, max*2) {
		if len(m) < 2 {
			continue
		}
		h := cleanKnowledgeHook(m[1])
		if h != "" {
			out = append(out, h)
		}
		if len(out) >= max {
			break
		}
	}
	return out
}

func extractListHooks(content string, max int) []string {
	if max <= 0 {
		return nil
	}
	scan := content
	if len(scan) > 3500 {
		scan = scan[:3500]
	}
	var out []string
	for _, m := range listColonRe.FindAllStringSubmatch(scan, max*3) {
		if len(m) < 2 {
			continue
		}
		h := cleanKnowledgeHook(m[1])
		if h == "" || len([]rune(h)) > 18 {
			continue
		}
		out = append(out, h)
		if len(out) >= max {
			break
		}
	}
	return out
}

func cleanKnowledgeHook(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "#* _\"'[]()（）")
	s = strings.TrimSpace(s)
	if i := strings.IndexAny(s, "|｜"); i > 0 {
		s = strings.TrimSpace(s[:i])
	}
	return truncateRunes(s, 22)
}

func isGenericKnowledgeHook(hook string) bool {
	for _, g := range []string{
		"经验分享", "经验贴", "注意事项", "个人总结", "其他", "说明", "介绍",
	} {
		if hook == g || strings.HasSuffix(hook, g) && len([]rune(hook)) <= len([]rune(g))+2 {
			return true
		}
	}
	return false
}

func questionFromKnowledgeHook(hook string) string {
	hook = strings.TrimSpace(hook)
	if hook == "" {
		return ""
	}
	switch {
	case strings.Contains(hook, "夏令营"):
		return "如何准备" + hook + "？"
	case strings.Contains(hook, "面试"):
		return hook + "一般会问什么？"
	case strings.Contains(hook, "简历"):
		return hook + "怎么写更有竞争力？"
	case strings.Contains(hook, "推荐信"):
		return hook + "怎么准备？"
	case strings.Contains(hook, "文书") || strings.Contains(hook, "套磁"):
		return hook + "有哪些技巧？"
	case strings.Contains(hook, "机试"):
		return hook + "怎么练？"
	case strings.Contains(hook, "预推免") || strings.Contains(hook, "推免"):
		return "关于" + hook + "有什么经验？"
	case strings.Contains(hook, "绩点") || strings.Contains(hook, "排名"):
		return hook + "对录取影响大吗？"
	case strings.Contains(hook, "竞赛"):
		return hook + "在保研里有多重要？"
	default:
		return "关于「" + hook + "」能分享什么？"
	}
}
