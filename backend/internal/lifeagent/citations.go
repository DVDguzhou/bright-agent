package lifeagent

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"sort"
	"strconv"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

const (
	AttributionGrounded = "grounded"
	AttributionGeneral  = "general"
	AttributionFallback = "fallback"

	DefaultKnowledgeFallbackMessage = "这个问题我暂时没有找到相关的个人经历可以分享，你可以直接联系我。"
)

// CitationItem is one numbered source in the reconcile catalog.
type CitationItem struct {
	CiteIndex   int
	ID          string
	SourceType  string
	Title       string
	Excerpt     string
	FullContent string
	Category    string
	Confidence  string
	FactKey     string
	TopicGroup  string
	TopicKey    string
	Route       string
	CreatedAt   string
	Facets      string
}

// CitationCatalog ordered sources for reconcile prompt numbering (facts → topics → entries → live).
type CitationCatalog struct {
	Items []CitationItem
}

var (
	citeBracketRe   = regexp.MustCompile(`\[(\d{1,2})\]`)
	citeSuperscript = map[rune]int{
		'¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9,
		'⁰': 0,
	}
	superscriptByIndex = map[int]string{
		1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹",
	}
)

func SourceTypeLabel(sourceType string) string {
	switch sourceType {
	case "fact":
		return "结构化事实"
	case "topic":
		return "主题摘要"
	case "knowledge":
		return "本人经历"
	case "liveUpdate":
		return "最近动态"
	case "profile":
		return "人设资料"
	default:
		return "来源"
	}
}

func normalizeCitationTitle(title string) string {
	return strings.ToLower(strings.TrimSpace(title))
}

// topicRedundantWithEntries：Topic 摘要往往由知识条目聚合而来；同一轮检索已命中条目时不再重复展示 Topic。
func topicRedundantWithEntries(topic TopicSummaryForAI, entries []KnowledgeEntryForAI) bool {
	if len(entries) == 0 {
		return false
	}
	label := normalizeCitationTitle(topic.TopicLabel)
	for _, e := range entries {
		if normalizeCitationTitle(e.Title) == label {
			return true
		}
		for _, id := range topic.SourceEntryIDs {
			if id == e.ID {
				return true
			}
		}
	}
	return false
}

func topicsForCitationDisplay(plan RetrievalPlan) []TopicSummaryForAI {
	if len(plan.Topics) == 0 {
		return nil
	}
	out := make([]TopicSummaryForAI, 0, len(plan.Topics))
	for _, t := range plan.Topics {
		if !topicRedundantWithEntries(t, plan.Entries) {
			out = append(out, t)
		}
	}
	return out
}

// BuildCitationCatalog builds a unified 1-based index over retrieval plan hits.
func BuildCitationCatalog(plan RetrievalPlan) CitationCatalog {
	items := make([]CitationItem, 0, len(plan.Facts)+len(plan.Topics)+len(plan.Entries)+len(plan.LiveUpdates))
	idx := 1
	route := string(plan.Route)
	conf := plan.Confidence

	for _, fact := range plan.Facts {
		items = append(items, CitationItem{
			CiteIndex:   idx,
			ID:          fact.ID,
			SourceType:  "fact",
			Title:       factLabel(fact.FactKey),
			Excerpt:     fact.FactValue,
			FullContent: fact.FactValue,
			Confidence:  fact.Confidence,
			FactKey:     fact.FactKey,
			Route:       route,
		})
		idx++
	}
	for _, topic := range topicsForCitationDisplay(plan) {
		excerpt := normalizeSnippet(firstSentence(topic.Summary, 80))
		if excerpt == "" {
			excerpt = "基于该主题经验生成的摘要。"
		}
		items = append(items, CitationItem{
			CiteIndex:   idx,
			ID:          topic.ID,
			SourceType:  "topic",
			Title:       topic.TopicLabel,
			Excerpt:     excerpt,
			FullContent: topic.Summary,
			Confidence:  topic.Confidence,
			TopicGroup:  topic.TopicGroup,
			TopicKey:    topic.TopicKey,
			Route:       route,
		})
		idx++
	}
	for _, entry := range plan.Entries {
		excerpt := normalizeSnippet(firstSentence(entry.Content, 80))
		if excerpt == "" {
			excerpt = "基于已有经历给到的一条可执行建议。"
		}
		items = append(items, CitationItem{
			CiteIndex:   idx,
			ID:          entry.ID,
			SourceType:  "knowledge",
			Title:       entry.Title,
			Excerpt:     excerpt,
			FullContent: entry.Content,
			Category:    entry.Category,
			Confidence:  conf,
			Route:       route,
			Facets:      FacetSummary(entry.Facets),
		})
		idx++
	}
	for _, lu := range plan.LiveUpdates {
		excerpt := normalizeSnippet(firstSentence(lu.Content, 80))
		if excerpt == "" {
			excerpt = "实时动态"
		}
		items = append(items, CitationItem{
			CiteIndex:   idx,
			ID:          lu.ID,
			SourceType:  "liveUpdate",
			Title:       "最近动态",
			Excerpt:     excerpt,
			FullContent: lu.Content,
			Category:    lu.Category,
			Route:       route,
			CreatedAt:   lu.CreatedAt,
		})
		idx++
	}
	return CitationCatalog{Items: items}
}

// ParseInlineCitations extracts cite indexes from model output; displayText keeps superscripts.
func ParseInlineCitations(text string) (displayText string, usedIndexes []int) {
	displayText = strings.TrimSpace(text)
	if displayText == "" {
		return "", nil
	}
	found := map[int]bool{}

	for _, m := range citeBracketRe.FindAllStringSubmatch(displayText, -1) {
		if n, err := strconv.Atoi(m[1]); err == nil && n > 0 {
			found[n] = true
		}
	}
	for _, r := range displayText {
		if n, ok := citeSuperscript[r]; ok && n > 0 {
			found[n] = true
		}
	}

	if len(found) == 0 {
		return displayText, nil
	}
	usedIndexes = make([]int, 0, len(found))
	for n := range found {
		usedIndexes = append(usedIndexes, n)
	}
	sort.Ints(usedIndexes)
	return displayText, usedIndexes
}

// StripInlineCitations removes citation markers from text.
func StripInlineCitations(text string) string {
	out := citeBracketRe.ReplaceAllString(text, "")
	var b strings.Builder
	for _, r := range out {
		if _, ok := citeSuperscript[r]; ok {
			continue
		}
		b.WriteRune(r)
	}
	return strings.TrimSpace(b.String())
}

// BuildCitedReferences returns refs for cited indexes only (no fallback when none cited).
func BuildCitedReferences(catalog CitationCatalog, usedIndexes []int, citationsEnabled bool) []map[string]string {
	if len(catalog.Items) == 0 || len(usedIndexes) == 0 {
		return nil
	}
	byIndex := make(map[int]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byIndex[item.CiteIndex] = item
	}

	indexes := usedIndexes
	sort.Ints(indexes)

	refs := make([]map[string]string, 0, len(indexes))
	seen := map[int]bool{}
	for _, n := range indexes {
		if seen[n] {
			continue
		}
		item, ok := byIndex[n]
		if !ok {
			continue
		}
		seen[n] = true
		refs = append(refs, citationItemToMap(item, citationsEnabled))
	}
	return refs
}

// FilterReferencesByContent keeps only refs whose citeIndex appears inline in content.
func FilterReferencesByContent(content string, refs []map[string]string) []map[string]string {
	_, used := ParseInlineCitations(content)
	if len(used) == 0 || len(refs) == 0 {
		return nil
	}
	usedSet := make(map[int]bool, len(used))
	for _, n := range used {
		usedSet[n] = true
	}
	out := make([]map[string]string, 0, len(used))
	for _, ref := range refs {
		n, err := strconv.Atoi(ref["citeIndex"])
		if err != nil || !usedSet[n] {
			continue
		}
		out = append(out, ref)
	}
	sort.Slice(out, func(i, j int) bool {
		ni, _ := strconv.Atoi(out[i]["citeIndex"])
		nj, _ := strconv.Atoi(out[j]["citeIndex"])
		return ni < nj
	})
	return out
}

func RenumberReplySegmentCitations(segments []string, refs []map[string]string) ([]string, [][]map[string]string, []map[string]string) {
	outSegments := make([]string, len(segments))
	for i, seg := range segments {
		outSegments[i] = NormalizeCitationMarkers(seg)
	}
	if len(outSegments) == 0 || len(refs) == 0 {
		return outSegments, make([][]map[string]string, len(outSegments)), nil
	}

	refsByOldIndex := make(map[int]map[string]string, len(refs))
	for _, ref := range refs {
		n, err := strconv.Atoi(ref["citeIndex"])
		if err != nil || n <= 0 {
			continue
		}
		if _, exists := refsByOldIndex[n]; !exists {
			refsByOldIndex[n] = ref
		}
	}
	if len(refsByOldIndex) == 0 {
		return outSegments, make([][]map[string]string, len(outSegments)), nil
	}

	oldToNew := map[int]int{}
	orderedOld := make([]int, 0, len(refsByOldIndex))
	for _, seg := range outSegments {
		for _, m := range citeBracketRe.FindAllStringSubmatch(seg, -1) {
			old, err := strconv.Atoi(m[1])
			if err != nil || old <= 0 {
				continue
			}
			if _, ok := refsByOldIndex[old]; !ok {
				continue
			}
			if _, exists := oldToNew[old]; exists {
				continue
			}
			oldToNew[old] = len(oldToNew) + 1
			orderedOld = append(orderedOld, old)
		}
	}
	if len(oldToNew) == 0 {
		return outSegments, make([][]map[string]string, len(outSegments)), nil
	}

	answerRefs := make([]map[string]string, 0, len(orderedOld))
	for _, old := range orderedOld {
		answerRefs = append(answerRefs, renumberReference(refsByOldIndex[old], oldToNew[old]))
	}

	for i, seg := range outSegments {
		outSegments[i] = citeBracketRe.ReplaceAllStringFunc(seg, func(marker string) string {
			matches := citeBracketRe.FindStringSubmatch(marker)
			if len(matches) != 2 {
				return ""
			}
			old, err := strconv.Atoi(matches[1])
			if err != nil {
				return ""
			}
			if next, ok := oldToNew[old]; ok {
				return fmt.Sprintf("[%d]", next)
			}
			return ""
		})
	}

	segmentRefs := make([][]map[string]string, len(outSegments))
	for i, seg := range outSegments {
		segmentRefs[i] = FilterReferencesByContent(seg, answerRefs)
	}
	return outSegments, segmentRefs, answerRefs
}

func renumberReference(ref map[string]string, citeIndex int) map[string]string {
	out := make(map[string]string, len(ref)+1)
	for k, v := range ref {
		out[k] = v
	}
	out["citeIndex"] = strconv.Itoa(citeIndex)
	if out["sourceTypeLabel"] == "" {
		out["sourceTypeLabel"] = SourceTypeLabel(out["sourceType"])
	}
	return out
}

func citationItemToMap(item CitationItem, includeCiteIndex bool) map[string]string {
	m := map[string]string{
		"id":              item.ID,
		"sourceType":      item.SourceType,
		"sourceTypeLabel": SourceTypeLabel(item.SourceType),
		"title":           item.Title,
		"excerpt":         item.Excerpt,
		"fullContent":     item.FullContent,
		"route":           item.Route,
		"confidence":      item.Confidence,
	}
	if includeCiteIndex {
		m["citeIndex"] = strconv.Itoa(item.CiteIndex)
	}
	if item.Category != "" {
		m["category"] = item.Category
	}
	if item.FactKey != "" {
		m["factKey"] = item.FactKey
	}
	if item.TopicGroup != "" {
		m["topicGroup"] = item.TopicGroup
	}
	if item.TopicKey != "" {
		m["topicKey"] = item.TopicKey
	}
	if item.Facets != "" {
		m["facets"] = item.Facets
	}
	if item.CreatedAt != "" {
		m["createdAt"] = item.CreatedAt
	}
	return m
}

// EnrichReferencesFromCatalog adds citeIndex/fullContent to legacy reference maps when possible.
func EnrichReferencesFromCatalog(refs []map[string]string, catalog CitationCatalog) []map[string]string {
	if len(refs) == 0 || len(catalog.Items) == 0 {
		return refs
	}
	byID := make(map[string]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byID[item.SourceType+":"+item.ID] = item
	}
	out := make([]map[string]string, len(refs))
	for i, ref := range refs {
		cp := make(map[string]string, len(ref)+4)
		for k, v := range ref {
			cp[k] = v
		}
		st := ref["sourceType"]
		id := ref["id"]
		if item, ok := byID[st+":"+id]; ok {
			cp["citeIndex"] = strconv.Itoa(item.CiteIndex)
			cp["fullContent"] = item.FullContent
			cp["sourceTypeLabel"] = SourceTypeLabel(item.SourceType)
		} else if cp["sourceTypeLabel"] == "" {
			cp["sourceTypeLabel"] = SourceTypeLabel(st)
		}
		out[i] = cp
	}
	return out
}

func buildReconcileCatalogPrompt(catalog CitationCatalog) string {
	if len(catalog.Items) == 0 {
		return "（本轮无编号素材）"
	}
	var sb strings.Builder
	for _, item := range catalog.Items {
		sb.WriteString(fmt.Sprintf("[%d] %s（%s）\n", item.CiteIndex, item.Title, SourceTypeLabel(item.SourceType)))
		if item.Facets != "" {
			sb.WriteString("分面：")
			sb.WriteString(item.Facets)
			sb.WriteString("\n")
		}
		sb.WriteString(item.FullContent)
		sb.WriteString("\n\n")
	}
	return sb.String()
}

// NormalizeCitationMarkers converts Unicode superscripts to [n] for consistent inline display.
func NormalizeCitationMarkers(text string) string {
	var b strings.Builder
	for _, r := range text {
		if n, ok := citeSuperscript[r]; ok {
			b.WriteString(fmt.Sprintf("[%d]", n))
			continue
		}
		b.WriteRune(r)
	}
	return b.String()
}

func buildReconcileCitationRule(citationsEnabled bool) string {
	if !citationsEnabled {
		return ""
	}
	return "9. 【引用标注 - 硬约束】凡转述了编号素材中的具体事实（时间、学校、考试、做法、数字等），对应那句末尾必须标 [n]。" +
		"多段回复时：每个用到不同素材的段落至少标 1 次；每条素材整段回复最多 1 次。" +
		"模糊感受、态度、反问句禁止加 [n]。禁止写「根据资料」「知识库」；只用 [n]。\n"
}

// EnsureInlineCitations adds [n] markers via a lightweight LLM pass when reconcile omitted them.
func EnsureInlineCitations(ctx context.Context, client *openai.Client, model, text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	if _, used := ParseInlineCitations(text); len(used) > 0 {
		return ValidateInlineCitations(NormalizeCitationMarkers(text), catalog)
	}

	system := "你是引用标注助手。任务：仅在直接转述编号素材事实的那一句句末添加 [n] 标注，n 与素材编号一致。\n" +
		"规则：每条素材整段回复最多 1 次 [n]；模糊感受/态度/反问禁止加标注；素材与句意无关时禁止加标注；" +
		"不要改正文措辞、不要删字、不要加解释、不要 Markdown；只输出标注后的正文。"
	user := "【编号素材】\n" + buildReconcileCatalogPrompt(catalog) +
		"\n【待标注正文】\n" + text +
		"\n\n请输出加了 [n] 标注的正文（仅此一段）："

	req := openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: system},
			{Role: openai.ChatMessageRoleUser, Content: user},
		},
		Temperature: safeTemperature(model, 0.2),
	}
	setMaxTokens(&req, model, estimateReconcileTokenBudget(text))
	result := streamWithDetails(ctx, client, req, nil)
	out := strings.TrimSpace(result.Content)
	if out == "" {
		log.Printf("[citations] ensureInlineCitations returned empty, keeping original")
		return text
	}
	out = humanizeReply(out)
	if out == "" {
		return text
	}
	return ValidateInlineCitations(NormalizeCitationMarkers(out), catalog)
}

// HeuristicEnsureInlineCitations adds [n] only when paragraph content matches catalog item semantics.
func HeuristicEnsureInlineCitations(text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	paras := splitParagraphs(text)
	if len(paras) == 0 {
		return text
	}
	changed := false
	usedItems := map[int]bool{}
	_, existing := ParseInlineCitations(text)
	for _, n := range existing {
		usedItems[n] = true
	}
	for i := range paras {
		p := strings.TrimSpace(joinLinesInParagraph(paras[i]))
		if p == "" || citeBracketRe.MatchString(p) {
			continue
		}
		item, score := bestCatalogMatchForParagraph(p, catalog)
		if item == nil || score < citationMinMatchScore || citationShouldStrip(p, *item) {
			continue
		}
		if usedItems[item.CiteIndex] {
			continue
		}
		paras[i] = appendCitationMarker(p, item.CiteIndex)
		usedItems[item.CiteIndex] = true
		changed = true
	}
	if !changed {
		return text
	}
	for i, para := range paras {
		paras[i] = joinLinesInParagraph(para)
	}
	return ValidateInlineCitations(strings.Join(paras, "\n\n"), catalog)
}

// overlapEnsureInlineCitations adds [n] to paragraphs that lack citations when content matches catalog.
func overlapEnsureInlineCitations(text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	paras := splitParagraphs(text)
	changed := false
	usedItems := map[int]bool{}
	_, existing := ParseInlineCitations(text)
	for _, n := range existing {
		usedItems[n] = true
	}
	for i := range paras {
		p := strings.TrimSpace(joinLinesInParagraph(paras[i]))
		if p == "" || len([]rune(p)) < 12 {
			continue
		}
		if citeBracketRe.MatchString(p) {
			continue
		}
		item, score := bestCatalogMatchForParagraph(p, catalog)
		if item == nil || score < citationMinMatchScore || citationShouldStrip(p, *item) {
			continue
		}
		if usedItems[item.CiteIndex] {
			continue
		}
		paras[i] = appendCitationMarker(p, item.CiteIndex)
		usedItems[item.CiteIndex] = true
		changed = true
	}
	if !changed {
		return text
	}
	out := make([]string, len(paras))
	for i, para := range paras {
		out[i] = joinLinesInParagraph(para)
	}
	return ValidateInlineCitations(strings.Join(out, "\n\n"), catalog)
}

const citationMinMatchScore = 3

func bestCatalogMatchForParagraph(para string, catalog CitationCatalog) (*CitationItem, int) {
	bestScore := 0
	var best *CitationItem
	for i := range catalog.Items {
		item := &catalog.Items[i]
		score := scoreParagraphForCitationItem(para, *item)
		if score > bestScore {
			bestScore = score
			best = item
		}
	}
	return best, bestScore
}

func scoreParagraphForCitationItem(para string, item CitationItem) int {
	norm := normalize(para)
	score := contentOverlapScore(para, item.FullContent)
	for _, kw := range citationKeywords(item) {
		if len([]rune(kw)) < 2 {
			continue
		}
		if strings.Contains(norm, normalize(kw)) {
			score += 2
		}
	}
	title := normalize(item.Title)
	switch {
	case strings.Contains(title, "恋爱") || strings.Contains(title, "感情"):
		if containsAnyNormalized(norm, []string{"恋爱", "谈朋友", "对象", "分手", "感情", "喜欢", "封心", "谈了", "谈过", "分了", "那会儿"}) {
			score += 5
		} else {
			score -= 3
		}
	case strings.Contains(title, "实习"):
		if containsAnyNormalized(norm, []string{"实习", "暑期", "实践"}) {
			score += 4
		}
	case strings.Contains(title, "留学") || strings.Contains(title, "美国") || strings.Contains(title, "cmu") || strings.Contains(title, "背景") || strings.Contains(title, "经历"):
		if containsAnyNormalized(norm, []string{
			"留学", "美国", "cmu", "卡内基", "申请", "托福", "gre", "课业", "课程", "计算机",
			"温州", "温大", "985", "211", "考研", "保研", "offer", "硕士", "本科", "创业", "research",
			"雅思", "绩点", "四六级", "六级", "四级", "背单词", "标准化", "双线", "一亩三分地",
		}) {
			score += 4
		}
	case strings.Contains(title, "考研") || strings.Contains(title, "规划"):
		if containsAnyNormalized(norm, []string{
			"考研", "雅思", "绩点", "四六级", "六级", "四级", "背单词", "留学", "双线", "申请",
			"大二", "大三", "大一", "选修", "excel", "一亩三分地",
		}) {
			score += 5
		}
	case strings.Contains(title, "大一") || strings.Contains(title, "大二") || strings.Contains(title, "大三"):
		if containsAnyNormalized(norm, []string{"大一", "大二", "大三", "大四"}) {
			score += 3
		}
	}
	return score
}

func contentOverlapScore(para, catalogContent string) int {
	if catalogContent == "" {
		return 0
	}
	normPara := normalize(para)
	score := 0
	seen := map[string]bool{}
	for _, term := range extractSignificantTerms(catalogContent) {
		if seen[term] {
			continue
		}
		seen[term] = true
		if strings.Contains(normPara, term) {
			score += 3
		}
	}
	return score
}

func extractSignificantTerms(text string) []string {
	text = normalize(text)
	var terms []string
	for _, seg := range strings.FieldsFunc(text, func(r rune) bool {
		return r == '，' || r == '。' || r == '、' || r == '；' || r == ' ' || r == ':' || r == '：' ||
			r == '\n' || r == '!' || r == '?' || r == ','
	}) {
		seg = strings.TrimSpace(seg)
		if len([]rune(seg)) < 2 {
			continue
		}
		if isCitationStopWord(seg) {
			continue
		}
		terms = append(terms, seg)
	}
	return terms
}

func isCitationStopWord(w string) bool {
	switch w {
	case "一个", "一些", "这个", "那个", "就是", "然后", "后来", "其实", "可能", "没有", "自己", "我们", "他们", "可以", "已经", "还是", "比较", "什么", "怎么", "因为", "所以", "如果", "但是", "而且", "或者", "感觉", "觉得", "知道", "开始", "最后", "现在", "当时", "那种", "这样", "那样", "非常", "特别", "真的", "主要", "基本", "一般", "方面", "事情", "问题", "情况", "时候":
		return true
	}
	return false
}

// citationShouldStrip removes only clearly wrong pairings (e.g. 恋爱 source on 规划 paragraph).
func citationShouldStrip(para string, item CitationItem) bool {
	norm := normalize(para)
	title := normalize(item.Title)
	switch {
	case strings.Contains(title, "恋爱") || strings.Contains(title, "感情"):
		return !containsAnyNormalized(norm, []string{
			"恋爱", "谈朋友", "对象", "分手", "感情", "喜欢", "封心", "谈了", "谈过", "分了", "对象",
		})
	case strings.Contains(title, "实习"):
		return containsAnyNormalized(norm, []string{"大一", "大二", "大三", "规划", "路线", "方向"}) &&
			!containsAnyNormalized(norm, []string{"实习", "暑期", "实践"})
	}
	return false
}

func citationKeywords(item CitationItem) []string {
	var kws []string
	contentSample := item.FullContent
	if len([]rune(contentSample)) > 200 {
		contentSample = string([]rune(contentSample)[:200])
	}
	for _, part := range []string{item.Title, contentSample} {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		for _, seg := range strings.FieldsFunc(part, func(r rune) bool {
			return r == '，' || r == '。' || r == '、' || r == '；' || r == ' ' || r == ':' || r == '：'
		}) {
			seg = strings.TrimSpace(seg)
			if len([]rune(seg)) >= 2 {
				kws = append(kws, seg)
			}
		}
	}
	return kws
}

// ValidateInlineCitations strips only clearly conflicting [n] markers (keeps reconcile-added cites).
func ValidateInlineCitations(text string, catalog CitationCatalog) string {
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	byIndex := make(map[int]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byIndex[item.CiteIndex] = item
	}
	paras := splitParagraphs(text)
	changed := false
	for i, para := range paras {
		joined := joinLinesInParagraph(para)
		cleaned := stripInvalidCitationMarkers(joined, byIndex)
		if cleaned != joined {
			changed = true
			paras[i] = cleaned
		}
	}
	if !changed {
		return text
	}
	out := make([]string, len(paras))
	for i, para := range paras {
		out[i] = joinLinesInParagraph(para)
	}
	return strings.Join(out, "\n\n")
}

func stripInvalidCitationMarkers(para string, byIndex map[int]CitationItem) string {
	matches := citeBracketRe.FindAllStringSubmatchIndex(para, -1)
	if len(matches) == 0 {
		return para
	}
	var b strings.Builder
	last := 0
	for _, m := range matches {
		b.WriteString(para[last:m[0]])
		n, _ := strconv.Atoi(para[m[2]:m[3]])
		item, ok := byIndex[n]
		if ok && !citationShouldStrip(para, item) {
			b.WriteString(para[m[0]:m[1]])
		}
		last = m[1]
	}
	b.WriteString(para[last:])
	return b.String()
}

func appendCitationMarker(s string, n int) string {
	mark := fmt.Sprintf("[%d]", n)
	if strings.Contains(s, mark) {
		return s
	}
	for _, end := range []string{"。", "！", "？", "…", ".", "!", "?"} {
		if strings.HasSuffix(s, end) {
			return strings.TrimSuffix(s, end) + mark + end
		}
	}
	return s + mark
}

// CapCitationMarkers enforces at-most-once per source, one marker per paragraph, and overlap validation.
func CapCitationMarkers(text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	byIndex := make(map[int]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byIndex[item.CiteIndex] = item
	}
	seenIndex := map[int]bool{}
	paras := splitParagraphs(text)
	changed := false
	for i, para := range paras {
		joined := joinLinesInParagraph(para)
		capped := capCitationMarkersInParagraph(joined, byIndex, seenIndex)
		if capped != joined {
			changed = true
			paras[i] = capped
		}
	}
	if !changed {
		return text
	}
	out := make([]string, len(paras))
	for i, para := range paras {
		out[i] = joinLinesInParagraph(para)
	}
	return strings.Join(out, "\n\n")
}

func capCitationMarkersInParagraph(para string, byIndex map[int]CitationItem, seenIndex map[int]bool) string {
	matches := citeBracketRe.FindAllStringSubmatchIndex(para, -1)
	if len(matches) == 0 {
		return para
	}
	var b strings.Builder
	last := 0
	keptInPara := 0
	for _, m := range matches {
		b.WriteString(para[last:m[0]])
		n, _ := strconv.Atoi(para[m[2]:m[3]])
		item, ok := byIndex[n]
		keep := ok && keptInPara == 0 && !seenIndex[n] && !citationShouldStrip(para, item)
		if keep {
			b.WriteString(para[m[0]:m[1]])
			seenIndex[n] = true
			keptInPara++
		}
		last = m[1]
	}
	b.WriteString(para[last:])
	return b.String()
}

func sentenceAroundMarker(para string, start, end int) string {
	before := para[:start]
	after := para[end:]
	sentStart := 0
	for _, sep := range []string{"。", "！", "？", "\n", ".", "!", "?"} {
		if i := strings.LastIndex(before, sep); i >= 0 {
			candidate := i + len(sep)
			if candidate > sentStart {
				sentStart = candidate
			}
		}
	}
	sentEnd := len(para)
	for _, sep := range []string{"。", "！", "？", "\n", ".", "!", "?"} {
		if i := strings.Index(after, sep); i >= 0 {
			candidate := end + i + len(sep)
			if candidate < sentEnd {
				sentEnd = candidate
			}
		}
	}
	return strings.TrimSpace(para[sentStart:sentEnd])
}

// FinalizeCitedReply normalizes markers, ensures inline cites when enabled, and builds references.
func FinalizeCitedReply(ctx context.Context, client *openai.Client, model, out string, catalog CitationCatalog, citationsEnabled bool, sparse bool) (string, []map[string]string) {
	if citationsEnabled {
		out = NormalizeCitationMarkers(out)
		_, usedIndexes := ParseInlineCitations(out)
		if len(catalog.Items) > 0 && len(usedIndexes) == 0 {
			out = EnsureInlineCitations(ctx, client, model, out, catalog)
		}
		_, usedIndexes = ParseInlineCitations(out)
		if len(catalog.Items) > 0 && len(usedIndexes) == 0 {
			out = HeuristicEnsureInlineCitations(out, catalog)
		}
		_, usedIndexes = ParseInlineCitations(out)
		// Always try to fill uncited paragraphs (multi-bubble replies often had only partial cites).
		if len(catalog.Items) > 0 {
			out = overlapEnsureInlineCitations(out, catalog)
		}
		_ = sparse // sparse affects reconcile wording, not whether grounded replies get cites
	} else {
		out = StripInlineCitations(out)
	}

	_, usedIndexes := ParseInlineCitations(out)
	if !citationsEnabled {
		return out, nil
	}
	out = ValidateInlineCitations(out, catalog)
	out = CapCitationMarkers(out, catalog)
	_, usedIndexes = ParseInlineCitations(out)
	refs := BuildCitedReferences(catalog, usedIndexes, citationsEnabled)
	return out, refs
}

func catalogToPlan(catalog CitationCatalog) RetrievalPlan {
	plan := RetrievalPlan{}
	for _, item := range catalog.Items {
		switch item.SourceType {
		case "fact":
			plan.Facts = append(plan.Facts, StructuredFactForAI{
				ID: item.ID, FactKey: item.FactKey, FactValue: item.FullContent, Confidence: item.Confidence,
			})
		case "topic":
			plan.Topics = append(plan.Topics, TopicSummaryForAI{
				ID: item.ID, TopicLabel: item.Title, Summary: item.FullContent, Confidence: item.Confidence,
				TopicGroup: item.TopicGroup, TopicKey: item.TopicKey,
			})
		case "knowledge":
			plan.Entries = append(plan.Entries, KnowledgeEntryForAI{
				ID: item.ID, Title: item.Title, Content: item.FullContent, Category: item.Category,
			})
		case "liveUpdate":
			plan.LiveUpdates = append(plan.LiveUpdates, LiveUpdateForAI{
				ID: item.ID, Content: item.FullContent, Category: item.Category, CreatedAt: item.CreatedAt,
			})
		}
	}
	return plan
}

func IndexToSuperscript(n int) string {
	if n <= 0 {
		return ""
	}
	if n <= 9 {
		return superscriptByIndex[n]
	}
	// multi-digit: compose per digit
	s := strconv.Itoa(n)
	var b strings.Builder
	for _, d := range s {
		if sup, ok := superscriptByIndex[int(d-'0')]; ok {
			b.WriteString(sup)
		}
	}
	return b.String()
}
