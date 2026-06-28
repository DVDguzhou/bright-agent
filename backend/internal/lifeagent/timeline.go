package lifeagent

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

type TimelineAnalysis struct {
	ShouldTrack           bool
	Status                string
	PeriodLabel           string
	PeriodGranularity     string
	SequenceOrder         int
	EventType             string
	Title                 string
	Summary               string
	Causes                []string
	Outcomes              []string
	Tradeoffs             []string
	MissingFields         []string
	ClarificationQuestion string
	Confidence            string
}

type TimelineEventForAI struct {
	ID                    string
	PeriodLabel           string
	PeriodGranularity     string
	SequenceOrder         int
	EventType             string
	Title                 string
	Summary               string
	Causes                []string
	Outcomes              []string
	Tradeoffs             []string
	SourceEntryIDs        []string
	Confidence            string
	Status                string
	ClarificationQuestion string
}

var timelineImportantWords = []string{
	"放弃保研", "保研", "考研", "上岸", "落榜", "失败", "毕业", "入职", "转行", "转专业",
	"创业", "实习", "秋招", "春招", "offer", "赚钱", "收入", "第一桶金", "换城市", "出国", "留学",
	"申请", "录取", "退学", "休学", "分手", "结婚", "搬到", "加入", "离开",
}

var timelineReasonWords = []string{"因为", "原因", "动机", "为了", "考虑到", "想要", "觉得"}
var timelineOutcomeWords = []string{"结果", "最后", "后来", "拿到", "赚到", "进入", "成为", "完成", "获得"}
var timelineTradeoffWords = []string{"放弃", "取舍", "选择", "要不要", "值不值", "还是", "相比"}

func AnalyzeKnowledgeTimeline(title, category, content string, facets KnowledgeFacetTags, recordedAt *time.Time) TimelineAnalysis {
	facets = NormalizeKnowledgeFacetTags(facets)
	text := strings.TrimSpace(strings.Join([]string{title, category, content}, "\n"))
	analysis := TimelineAnalysis{
		ShouldTrack:       shouldTrackTimeline(text, facets),
		Status:            "not_timeline",
		PeriodLabel:       "时间未确认",
		PeriodGranularity: "unknown",
		EventType:         inferTimelineEventType(text, facets),
		Title:             cleanTimelineTitle(title, content),
		Summary:           TruncateToRunes(stripRecordTimePrefix(content), 220),
		Causes:            extractTimelinePhrases(text, timelineReasonWords, 3),
		Outcomes:          extractTimelinePhrases(text, timelineOutcomeWords, 3),
		Tradeoffs:         extractTimelinePhrases(text, timelineTradeoffWords, 3),
		Confidence:        "medium",
	}
	if !analysis.ShouldTrack {
		return analysis
	}

	periods := uniqueFacetStrings(facets.ContentTime, 3)
	if len(periods) > 0 {
		analysis.PeriodLabel = periods[0]
		analysis.PeriodGranularity = inferPeriodGranularity(periods[0])
		analysis.SequenceOrder = sequenceOrderForPeriod(periods[0], recordedAt)
		analysis.Status = "confirmed"
		if analysis.PeriodGranularity == "relative" || analysis.PeriodGranularity == "broad" {
			analysis.Confidence = "medium"
		} else {
			analysis.Confidence = "high"
		}
		return analysis
	}

	analysis.Status = "needs_clarification"
	analysis.MissingFields = []string{"contentTime"}
	analysis.Confidence = "low"
	analysis.ClarificationQuestion = BuildTimelineClarificationQuestion(title, content)
	return analysis
}

func BuildTimelineClarificationQuestion(title, content string) string {
	anchor := cleanTimelineTitle(title, content)
	if anchor == "" {
		anchor = TruncateToRunes(stripRecordTimePrefix(content), 18)
	}
	if anchor == "" {
		return "这条经历挺关键的，我确认一下它大概发生在什么时候？"
	}
	return fmt.Sprintf("这条「%s」挺关键的，我确认一下大概发生在什么时候？比如大学期间、某一年、毕业前后，还是工作以后？", anchor)
}

func FormatTimelinePromptSection(events []TimelineEventForAI) string {
	events = filterTimelineEventsForPrompt(events)
	if len(events) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("【这个人的时间线主线 - 回答经历顺序时优先遵守】\n")
	sb.WriteString("使用规则：明确时间就按下面顺序说；模糊时间只能说成「大学那阵」「后来」「毕业前后」这类，不要编成年份；needs_clarification 的内容不要说成铁事实。\n")
	for _, e := range events {
		sb.WriteString("- ")
		sb.WriteString(e.PeriodLabel)
		if e.PeriodGranularity != "" && e.PeriodGranularity != "explicit" {
			sb.WriteString("（")
			sb.WriteString(e.PeriodGranularity)
			sb.WriteString("）")
		}
		sb.WriteString("：")
		sb.WriteString(e.Title)
		if e.Summary != "" {
			sb.WriteString("。")
			sb.WriteString(TruncateToRunes(e.Summary, 90))
		}
		if len(e.Tradeoffs) > 0 {
			sb.WriteString("；取舍：")
			sb.WriteString(strings.Join(e.Tradeoffs, "、"))
		}
		sb.WriteString("\n")
	}
	return sb.String()
}

// AttachTimelineSourceEntries expands broad chronology questions with the raw
// knowledge entries behind each timeline event. Generation and citation must
// see the same evidence set.
func AttachTimelineSourceEntries(plan *RetrievalPlan, events []TimelineEventForAI, entries []KnowledgeEntryForAI, query string) int {
	if plan == nil || !WantsTimelineOverview(query) {
		return 0
	}
	events = filterTimelineEventsForPrompt(events)
	if len(events) == 0 {
		return 0
	}

	entriesBySourceID := make(map[string][]KnowledgeEntryForAI, len(entries))
	for _, entry := range entries {
		if IsEvidenceKnowledgeEntry(entry) {
			sourceID := firstNonEmpty(entry.SourceEntryID, entry.ID)
			entriesBySourceID[sourceID] = append(entriesBySourceID[sourceID], entry)
		}
	}
	existing := make(map[string]bool, len(plan.Entries))
	for _, entry := range plan.Entries {
		existing[entry.ID] = true
	}

	added := 0
	for _, event := range events {
		for _, sourceID := range event.SourceEntryIDs {
			for _, entry := range entriesBySourceID[sourceID] {
				if existing[entry.ID] {
					continue
				}
				plan.Entries = append(plan.Entries, entry)
				plan.Reasons = append(plan.Reasons, "timeline-source:entry:"+entry.Title)
				existing[entry.ID] = true
				added++
			}
		}
	}
	return added
}

func WantsTimelineOverview(query string) bool {
	norm := normalize(query)
	if norm == "" {
		return false
	}
	return containsAnyNormalized(norm, []string{
		"大一到大四", "大一至大四", "大学四年", "大学这几年", "整个大学", "大学期间",
		"按时间", "时间线", "从大一", "大一大二大三大四", "经历顺序", "成长经历",
	})
}

func filterTimelineEventsForPrompt(events []TimelineEventForAI) []TimelineEventForAI {
	out := make([]TimelineEventForAI, 0, len(events))
	for _, e := range events {
		if e.Status == "confirmed" || e.Status == "needs_clarification" {
			out = append(out, e)
		}
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].SequenceOrder == out[j].SequenceOrder {
			return out[i].Title < out[j].Title
		}
		return out[i].SequenceOrder < out[j].SequenceOrder
	})
	if len(out) > 8 {
		out = out[:8]
	}
	return out
}

func shouldTrackTimeline(text string, facets KnowledgeFacetTags) bool {
	norm := normalize(text)
	if len(facets.ContentTime) > 0 {
		for _, a := range facets.Aspects {
			if a.Type == "process" || a.Type == "reason" || a.Type == "tradeoff" || a.Type == "state" {
				return true
			}
		}
	}
	for _, w := range timelineImportantWords {
		if strings.Contains(norm, normalize(w)) {
			return true
		}
	}
	for _, a := range facets.Aspects {
		if a.Type == "process" || a.Type == "tradeoff" {
			return true
		}
	}
	return false
}

func inferTimelineEventType(text string, facets KnowledgeFacetTags) string {
	norm := normalize(text)
	switch {
	case strings.Contains(norm, "放弃") || strings.Contains(norm, "选择") || hasFacetAspect(facets, "tradeoff"):
		return "decision"
	case strings.Contains(norm, "赚") || strings.Contains(norm, "收入") || strings.Contains(norm, "拿到") || strings.Contains(norm, "获得"):
		return "outcome"
	case strings.Contains(norm, "入职") || strings.Contains(norm, "加入") || strings.Contains(norm, "转行"):
		return "transition"
	case strings.Contains(norm, "为什么") || strings.Contains(norm, "原因") || hasFacetAspect(facets, "reason"):
		return "reason"
	default:
		return "experience"
	}
}

func hasFacetAspect(f KnowledgeFacetTags, typ string) bool {
	for _, a := range f.Aspects {
		if a.Type == typ {
			return true
		}
	}
	return false
}

func inferPeriodGranularity(period string) string {
	p := strings.TrimSpace(period)
	switch {
	case p == "":
		return "unknown"
	case facetYearRe.MatchString(p):
		return "year"
	case containsAny(p, "大一", "大二", "大三", "大四", "研一", "研二", "研三", "秋招", "春招", "毕业后"):
		return "stage"
	case containsAny(p, "后来", "之后", "以前", "前后", "刚开始", "当时"):
		return "relative"
	case containsAny(p, "大学期间", "读书期间", "工作早期", "毕业前后"):
		return "broad"
	default:
		return "explicit"
	}
}

func sequenceOrderForPeriod(period string, recordedAt *time.Time) int {
	p := strings.TrimSpace(period)
	for _, pair := range []struct {
		key   string
		order int
	}{
		{"高中", 100}, {"大一", 210}, {"大二", 220}, {"大三", 230}, {"大四", 240},
		{"夏令营", 235}, {"预推免", 238}, {"秋招", 245}, {"春招", 248},
		{"研一", 310}, {"研二", 320}, {"研三", 330}, {"毕业前", 390}, {"毕业后", 410},
		{"工作早期", 430}, {"后来", 600}, {"之后", 610},
	} {
		if strings.Contains(p, pair.key) {
			return pair.order
		}
	}
	if y := facetYearRe.FindString(p); y != "" {
		var n int
		_, _ = fmt.Sscanf(y, "%d", &n)
		if n > 0 {
			return n * 10
		}
	}
	if recordedAt != nil && !recordedAt.IsZero() {
		return recordedAt.Year() * 10
	}
	return 9999
}

func extractTimelinePhrases(text string, markers []string, max int) []string {
	sentences := splitSentences(text)
	var out []string
	for _, s := range sentences {
		ns := normalize(s)
		for _, m := range markers {
			if strings.Contains(ns, normalize(m)) {
				out = append(out, TruncateToRunes(strings.TrimSpace(s), 48))
				break
			}
		}
		if len(out) >= max {
			break
		}
	}
	return uniqueFacetStrings(out, max)
}

func cleanTimelineTitle(title, content string) string {
	title = strings.TrimSpace(title)
	if title == "" {
		title = firstSentence(stripRecordTimePrefix(content), 40)
	}
	title = strings.Trim(title, "#* []（）()")
	return TruncateToRunes(title, 48)
}

func stripRecordTimePrefix(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "[") {
		if end := strings.Index(s, "]"); end >= 0 && end < 32 {
			return strings.TrimSpace(s[end+1:])
		}
	}
	return s
}
