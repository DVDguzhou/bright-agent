package lifeagent

import (
	"encoding/json"
	"regexp"
	"strings"
)

type KnowledgeFacetTags struct {
	Subjects    []string      `json:"subjects,omitempty"`
	Aspects     []FacetAspect `json:"aspects,omitempty"`
	Space       []string      `json:"space,omitempty"`
	ContentTime []string      `json:"contentTime,omitempty"`
	RecordTime  []string      `json:"recordTime,omitempty"`
	DocTypes    []string      `json:"docTypes,omitempty"`
	Audience    []string      `json:"audience,omitempty"`
	Confidence  string        `json:"confidence,omitempty"`
}

type FacetAspect struct {
	Type   string `json:"type"`
	Label  string `json:"label,omitempty"`
	Object string `json:"object,omitempty"`
}

type QueryFacet struct {
	Subjects    []string
	AspectTypes []string
	Space       []string
	ContentTime []string
	DocTypes    []string
}

var allowedFacetAspectTypes = map[string]bool{
	"background":  true,
	"reason":      true,
	"process":     true,
	"method":      true,
	"condition":   true,
	"state":       true,
	"property":    true,
	"tradeoff":    true,
	"comparison":  true,
	"influence":   true,
	"application": true,
	"risk":        true,
	"advice":      true,
}

var (
	facetYearRe      = regexp.MustCompile(`20\d{2}|19\d{2}`)
	facetMoneyRe     = regexp.MustCompile(`\d+(?:\.\d+)?\s*(?:w|万|k|千|块|元)`)
	facetSchoolRe    = regexp.MustCompile(`[\p{Han}A-Za-z]{2,24}(?:大学|学院|中学|高中|University|College)`)
	facetCompanyLike = []string{"公司", "大厂", "互联网", "小红书", "字节", "腾讯", "阿里", "美团", "华为", "百度", "创业"}
)

func NormalizeKnowledgeFacetTags(in KnowledgeFacetTags) KnowledgeFacetTags {
	out := KnowledgeFacetTags{
		Subjects:    uniqueFacetStrings(in.Subjects, 8),
		Space:       uniqueFacetStrings(in.Space, 6),
		ContentTime: uniqueFacetStrings(in.ContentTime, 6),
		RecordTime:  uniqueFacetStrings(in.RecordTime, 4),
		DocTypes:    uniqueFacetStrings(in.DocTypes, 5),
		Audience:    uniqueFacetStrings(in.Audience, 5),
		Confidence:  normalizeFacetConfidence(in.Confidence),
	}
	seenAspect := map[string]bool{}
	for _, a := range in.Aspects {
		a.Type = strings.TrimSpace(a.Type)
		a.Label = strings.TrimSpace(a.Label)
		a.Object = strings.TrimSpace(a.Object)
		if !allowedFacetAspectTypes[a.Type] {
			continue
		}
		key := a.Type + "|" + a.Label + "|" + a.Object
		if seenAspect[key] {
			continue
		}
		seenAspect[key] = true
		out.Aspects = append(out.Aspects, a)
		if len(out.Aspects) >= 8 {
			break
		}
	}
	return out
}

func ValidateKnowledgeFacetTags(in KnowledgeFacetTags) []string {
	var issues []string
	if len(in.Subjects) == 0 {
		issues = append(issues, "subjects_empty")
	}
	for _, a := range in.Aspects {
		if !allowedFacetAspectTypes[a.Type] {
			issues = append(issues, "invalid_aspect:"+a.Type)
		}
	}
	if in.Confidence != "" && !map[string]bool{"low": true, "medium": true, "high": true}[in.Confidence] {
		issues = append(issues, "invalid_confidence")
	}
	return issues
}

func ParseKnowledgeFacetTags(raw any) KnowledgeFacetTags {
	switch v := raw.(type) {
	case KnowledgeFacetTags:
		return NormalizeKnowledgeFacetTags(v)
	case map[string]any:
		b, _ := json.Marshal(v)
		return ParseKnowledgeFacetJSON(b)
	case []byte:
		return ParseKnowledgeFacetJSON(v)
	case string:
		return ParseKnowledgeFacetJSON([]byte(v))
	default:
		return KnowledgeFacetTags{}
	}
}

func ParseKnowledgeFacetJSON(raw []byte) KnowledgeFacetTags {
	if len(raw) == 0 || strings.TrimSpace(string(raw)) == "" || strings.TrimSpace(string(raw)) == "null" {
		return KnowledgeFacetTags{}
	}
	var out KnowledgeFacetTags
	if err := json.Unmarshal(raw, &out); err != nil {
		return KnowledgeFacetTags{}
	}
	return NormalizeKnowledgeFacetTags(out)
}

func KnowledgeFacetTagsToMap(f KnowledgeFacetTags) map[string]any {
	f = NormalizeKnowledgeFacetTags(f)
	b, _ := json.Marshal(f)
	var out map[string]any
	_ = json.Unmarshal(b, &out)
	return out
}

func InferKnowledgeFacetTags(title, category, content string, tags []string) KnowledgeFacetTags {
	text := strings.TrimSpace(strings.Join([]string{title, category, content, strings.Join(tags, " ")}, "\n"))
	f := KnowledgeFacetTags{
		Subjects:    inferFacetSubjects(title, category, content, tags),
		Aspects:     inferFacetAspects(text),
		Space:       inferFacetSpace(text),
		ContentTime: inferFacetContentTime(text),
		DocTypes:    inferFacetDocTypes(text),
		Confidence:  "low",
	}
	if len(f.Subjects) > 0 && len(f.Aspects) > 0 {
		f.Confidence = "medium"
	}
	return NormalizeKnowledgeFacetTags(f)
}

func ParseQueryFacet(question string) QueryFacet {
	norm := normalize(question)
	q := QueryFacet{
		Subjects:    inferQuerySubjects(question),
		AspectTypes: inferQueryAspectTypes(norm),
		Space:       inferFacetSpace(question),
		ContentTime: inferFacetContentTime(question),
		DocTypes:    inferFacetDocTypes(question),
	}
	return q
}

func ScoreFacetMatch(query QueryFacet, facets KnowledgeFacetTags) int {
	score := 0
	for _, s := range query.Subjects {
		if facetListContains(facets.Subjects, s) {
			score += 8
		}
	}
	for _, typ := range query.AspectTypes {
		for _, a := range facets.Aspects {
			if a.Type == typ {
				score += 6
				break
			}
			if a.Label != "" && strings.Contains(normalize(a.Label), normalize(typ)) {
				score += 2
				break
			}
		}
	}
	for _, t := range query.ContentTime {
		if facetListContains(facets.ContentTime, t) {
			score += 4
		}
	}
	for _, s := range query.Space {
		if facetListContains(facets.Space, s) || facetListContains(facets.Subjects, s) {
			score += 4
		}
	}
	for _, d := range query.DocTypes {
		if facetListContains(facets.DocTypes, d) {
			score += 2
		}
	}
	return score
}

func FacetSummary(f KnowledgeFacetTags) string {
	f = NormalizeKnowledgeFacetTags(f)
	var parts []string
	if len(f.Subjects) > 0 {
		parts = append(parts, "主体："+strings.Join(f.Subjects, "、"))
	}
	if len(f.Aspects) > 0 {
		var aspects []string
		for _, a := range f.Aspects {
			label := a.Type
			if a.Label != "" {
				label += "/" + a.Label
			}
			if a.Object != "" {
				label += "→" + a.Object
			}
			aspects = append(aspects, label)
		}
		parts = append(parts, "方面："+strings.Join(aspects, "、"))
	}
	if len(f.Space) > 0 {
		parts = append(parts, "空间："+strings.Join(f.Space, "、"))
	}
	if len(f.ContentTime) > 0 {
		parts = append(parts, "内容时间："+strings.Join(f.ContentTime, "、"))
	}
	if len(f.DocTypes) > 0 {
		parts = append(parts, "文献类型："+strings.Join(f.DocTypes, "、"))
	}
	return strings.Join(parts, "；")
}

func uniqueFacetStrings(in []string, max int) []string {
	seen := map[string]bool{}
	var out []string
	for _, s := range in {
		s = strings.TrimSpace(s)
		if s == "" || seen[s] {
			continue
		}
		seen[s] = true
		out = append(out, s)
		if max > 0 && len(out) >= max {
			break
		}
	}
	return out
}

func normalizeFacetConfidence(s string) string {
	s = strings.TrimSpace(strings.ToLower(s))
	if s == "high" || s == "medium" || s == "low" {
		return s
	}
	if s == "" {
		return ""
	}
	return "medium"
}

func inferFacetSubjects(title, category, content string, tags []string) []string {
	var out []string
	for _, s := range []string{title, category} {
		if cleaned := cleanFacetSubject(s); cleaned != "" {
			out = append(out, cleaned)
		}
	}
	for _, tag := range tags {
		if cleaned := cleanFacetSubject(tag); cleaned != "" {
			out = append(out, cleaned)
		}
	}
	for _, m := range facetMoneyRe.FindAllString(content, -1) {
		out = append(out, strings.TrimSpace(m))
	}
	return uniqueFacetStrings(out, 8)
}

func cleanFacetSubject(s string) string {
	s = strings.TrimSpace(s)
	s = strings.Trim(s, "#* _\"'[]()（）")
	for _, sep := range []string{"｜", "|", "·", "：", ":"} {
		if i := strings.LastIndex(s, sep); i >= 0 && i+len(sep) < len(s) {
			s = strings.TrimSpace(s[i+len(sep):])
		}
	}
	if len([]rune(s)) > 28 {
		s = truncateRunes(s, 28)
	}
	return s
}

func inferFacetAspects(normText string) []FacetAspect {
	norm := normalize(normText)
	rules := []struct {
		typ   string
		label string
		words []string
	}{
		{"background", "背景", []string{"背景", "基本情况", "个人情况"}},
		{"reason", "原因动机", []string{"原因", "为什么", "动机", "看法"}},
		{"process", "过程路径", []string{"过程", "路径", "时间线", "怎么做到", "经历"}},
		{"method", "方法策略", []string{"方法", "策略", "做法", "准备", "技巧"}},
		{"condition", "条件门槛", []string{"条件", "门槛", "要求", "前提"}},
		{"state", "状态结果", []string{"结果", "现状", "状态", "去向", "offer"}},
		{"tradeoff", "取舍选择", []string{"取舍", "选择", "要不要", "值不值", "放弃"}},
		{"comparison", "比较", []string{"比较", "区别", "对比"}},
		{"influence", "影响", []string{"影响", "带来", "导致"}},
		{"application", "应用场景", []string{"应用", "适合", "场景"}},
		{"risk", "风险踩坑", []string{"风险", "坑", "踩坑", "避坑", "限制"}},
		{"advice", "建议行动", []string{"建议", "注意", "行动", "怎么做"}},
	}
	var out []FacetAspect
	for _, r := range rules {
		if containsAnyNormalized(norm, r.words) {
			out = append(out, FacetAspect{Type: r.typ, Label: r.label})
		}
	}
	return out
}

func inferFacetSpace(text string) []string {
	var out []string
	for _, m := range facetSchoolRe.FindAllString(text, -1) {
		out = append(out, strings.TrimSpace(m))
	}
	for _, kw := range facetCompanyLike {
		if strings.Contains(text, kw) {
			out = append(out, kw)
		}
	}
	return uniqueFacetStrings(out, 6)
}

func inferFacetContentTime(text string) []string {
	var out []string
	for _, y := range facetYearRe.FindAllString(text, -1) {
		out = append(out, y)
	}
	for _, term := range []string{"大一", "大二", "大三", "大四", "研一", "研二", "研三", "秋招", "春招", "夏令营", "预推免", "九推", "毕业后", "放弃保研前后"} {
		if strings.Contains(text, term) {
			out = append(out, term)
		}
	}
	return uniqueFacetStrings(out, 6)
}

func inferFacetDocTypes(text string) []string {
	var out []string
	for _, pair := range []struct {
		word string
		doc  string
	}{
		{"播客", "访谈"}, {"访谈", "访谈"}, {"逐字稿", "访谈"}, {"飞跃手册", "经验贴"},
		{"经验", "个人经历"}, {"复盘", "观点复盘"}, {"政策", "政策材料"}, {"官方", "官方材料"},
	} {
		if strings.Contains(text, pair.word) {
			out = append(out, pair.doc)
		}
	}
	return uniqueFacetStrings(out, 5)
}

func inferQuerySubjects(question string) []string {
	var out []string
	for _, m := range facetMoneyRe.FindAllString(question, -1) {
		out = append(out, strings.TrimSpace(m))
	}
	for _, m := range facetSchoolRe.FindAllString(question, -1) {
		out = append(out, strings.TrimSpace(m))
	}
	for _, token := range tokenize(question) {
		if len([]rune(token)) >= 2 && len([]rune(token)) <= 12 {
			out = append(out, token)
		}
	}
	return uniqueFacetStrings(out, 8)
}

func inferQueryAspectTypes(norm string) []string {
	var out []string
	add := func(typ string) { out = append(out, typ) }
	if containsAnyNormalized(norm, []string{"怎么做到", "过程", "路径", "时间线", "经历"}) {
		add("process")
	}
	if containsAnyNormalized(norm, []string{"怎么做", "如何", "方法", "技巧", "准备"}) {
		add("method")
	}
	if containsAnyNormalized(norm, []string{"为什么", "原因", "动机"}) {
		add("reason")
	}
	if containsAnyNormalized(norm, []string{"取舍", "选择", "要不要", "值不值", "后悔"}) {
		add("tradeoff")
	}
	if containsAnyNormalized(norm, []string{"影响", "导致", "带来"}) {
		add("influence")
	}
	if containsAnyNormalized(norm, []string{"比较", "区别", "对比"}) {
		add("comparison")
	}
	if containsAnyNormalized(norm, []string{"坑", "风险", "注意", "避坑"}) {
		add("risk")
	}
	if containsAnyNormalized(norm, []string{"建议", "怎么办", "行动"}) {
		add("advice")
	}
	return uniqueFacetStrings(out, 6)
}

func facetListContains(list []string, q string) bool {
	nq := normalize(q)
	if nq == "" {
		return false
	}
	for _, item := range list {
		ni := normalize(item)
		if ni == "" {
			continue
		}
		if strings.Contains(ni, nq) || strings.Contains(nq, ni) {
			return true
		}
	}
	return false
}
