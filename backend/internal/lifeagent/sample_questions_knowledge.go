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
	"保研经验分享": true, "考研经验分享": true, "经验分享": true,
	"基本信息": true, "我的基本信息": true, "一、我的基本信息": true,
}

var (
	mdHeaderRe     = regexp.MustCompile(`(?m)^#{1,3}\s+(.+?)\s*$`)
	sampleQBoldRe  = regexp.MustCompile(`\*\*([^*\n]{2,24})\*\*`)
	listColonRe    = regexp.MustCompile(`(?m)^[-*]\s+(.{4,36}?)[：:]\s*(.+)$`)
	headerNumberRe = regexp.MustCompile(`^[\d一二三四五六七八九十]+[、.．)\s]+`)
)

// DeriveSampleQuestionsFromKnowledge 从知识库正文提取可问的具体话题并转成示例问题。
func DeriveSampleQuestionsFromKnowledge(entries []KnowledgeSnippet) []string {
	var out []string
	for _, e := range entries {
		out = append(out, questionsFromKnowledgeEntry(e)...)
	}
	return filterStupidSampleQuestions(uniqueSampleQuestions(out))
}

func questionsFromKnowledgeEntry(e KnowledgeSnippet) []string {
	content := strings.TrimSpace(e.Content)
	if content == "" {
		return questionsFromKnowledgeTitle(e.Title)
	}
	var out []string
	out = append(out, questionsFromKnowledgeTitle(e.Title)...)
	out = append(out, extractListQuestions(content, 4)...)

	var hooks []string
	for _, h := range extractBoldPhrases(content, 4) {
		hooks = append(hooks, h)
	}
	for _, h := range extractMarkdownHeaders(content) {
		hooks = append(hooks, h)
	}

	seenHook := make(map[string]bool)
	for _, hook := range hooks {
		hook = cleanKnowledgeHook(hook)
		if hook == "" || seenHook[hook] || shouldSkipKnowledgeHook(hook) {
			continue
		}
		seenHook[hook] = true
		if q := questionFromKnowledgeHook(hook); q != "" && !isStupidSampleQuestion(q) {
			out = append(out, q)
		}
		if len(out) >= 6 {
			break
		}
	}
	return out
}

func questionsFromKnowledgeTitle(title string) []string {
	topic := topicFromKnowledgeTitle(title)
	topic = cleanKnowledgeHook(topic)
	if topic == "" || shouldSkipKnowledgeHook(topic) {
		return nil
	}
	var out []string
	for _, prefix := range []string{"转专业至", "保研至", "考研至", "录取至"} {
		if !strings.HasPrefix(topic, prefix) {
			continue
		}
		dest := strings.TrimSpace(strings.TrimPrefix(topic, prefix))
		if dest == "" {
			continue
		}
		dest = truncateRunes(dest, 14)
		switch prefix {
		case "转专业至":
			out = append(out, "转专业到"+dest+"要补哪些先修课？")
			out = append(out, "跨考到"+dest+"最难的一步是什么？")
		case "保研至":
			out = append(out, "保研到"+dest+"最关键的准备是什么？")
		case "考研至":
			out = append(out, "考到"+dest+"复试有什么经验？")
		}
		break
	}
	return out
}

func topicFromKnowledgeTitle(title string) string {
	title = strings.TrimSpace(title)
	for _, sep := range []string{"|", "｜"} {
		if i := strings.Index(title, sep); i >= 0 {
			after := strings.TrimSpace(title[i+len(sep):])
			if after != "" {
				return after
			}
		}
	}
	return title
}

func shouldSkipKnowledgeHook(hook string) bool {
	if skipKnowledgeHeaders[hook] || isGenericKnowledgeHook(hook) {
		return true
	}
	if isSchoolNameHook(hook) {
		return true
	}
	if len([]rune(hook)) < 3 {
		return true
	}
	return false
}

func isSchoolNameHook(hook string) bool {
	hook = strings.TrimSpace(hook)
	return strings.HasSuffix(hook, "大学") || strings.HasSuffix(hook, "学院") ||
		strings.HasSuffix(hook, "University") || strings.HasSuffix(hook, "College")
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

func extractListQuestions(content string, max int) []string {
	if max <= 0 {
		return nil
	}
	scan := content
	if len(scan) > 5000 {
		scan = scan[:5000]
	}
	var out []string
	for _, m := range listColonRe.FindAllStringSubmatch(scan, max*4) {
		if len(m) < 3 {
			continue
		}
		prefix := cleanKnowledgeHook(m[1])
		value := strings.TrimSpace(m[2])
		if prefix == "" || shouldSkipKnowledgeHook(prefix) || len([]rune(value)) < 4 {
			continue
		}
		if q := questionFromListItem(prefix, value); q != "" && !isStupidSampleQuestion(q) {
			out = append(out, q)
		}
		if len(out) >= max {
			break
		}
	}
	return out
}

func questionFromListItem(prefix, value string) string {
	if strings.TrimSpace(value) == "" {
		return ""
	}
	// 旧逻辑对所有列表项拼「X可以对应哪些去向？」「X具体要注意什么？」，全是垃圾模板。
	// 改走 questionFromKnowledgeHook：能识别的主题（简历/推荐信/绩点/面试/竞赛/夏令营…）给具体问题，
	// 识别不了的（默认会拼成「X有什么实战经验？」）判为垃圾并丢弃。
	if q := questionFromKnowledgeHook(prefix); q != "" && !isJunkTemplateQuestion(q) {
		return q
	}
	return ""
}

func cleanKnowledgeHook(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "#* _\"'[]()（）")
	s = headerNumberRe.ReplaceAllString(s, "")
	s = strings.TrimSpace(s)
	if i := strings.IndexAny(s, "|｜"); i > 0 {
		s = strings.TrimSpace(s[:i])
	}
	return truncateRunes(s, 22)
}

func isGenericKnowledgeHook(hook string) bool {
	for _, g := range []string{
		"保研", "考研", "留学", "研途榜样", "飞跃手册", "升学深造", "转专业",
		"经验分享", "经验贴", "注意事项", "个人总结", "其他", "说明", "介绍",
	} {
		if hook == g {
			return true
		}
		if strings.HasSuffix(hook, g) && len([]rune(hook)) <= len([]rune(g))+2 {
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
		if len([]rune(hook)) < 4 {
			return ""
		}
		return hook + "有什么实战经验？"
	}
}
