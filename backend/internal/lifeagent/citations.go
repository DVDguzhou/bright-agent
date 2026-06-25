package lifeagent

import (
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
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
	citeBracketRe  = regexp.MustCompile(`\[(\d{1,2})\]`)
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
	for _, topic := range plan.Topics {
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

// BuildCitedReferences returns refs for cited indexes; falls back to all catalog items if none cited.
func BuildCitedReferences(catalog CitationCatalog, usedIndexes []int, citationsEnabled bool) []map[string]string {
	if len(catalog.Items) == 0 {
		return nil
	}
	byIndex := make(map[int]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byIndex[item.CiteIndex] = item
	}

	indexes := usedIndexes
	if len(indexes) == 0 {
		for _, item := range catalog.Items {
			indexes = append(indexes, item.CiteIndex)
		}
		sort.Ints(indexes)
	}

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

func buildReconcileCitationRule(citationsEnabled bool) string {
	if !citationsEnabled {
		return ""
	}
	return "9. 【引用上标】当某句内容明确来自上方编号素材时，在该句末尾加 Unicode 上标（¹ ² ³ …，编号与素材 [n] 对应），每句最多 3 个上标。禁止写「根据资料」「知识库」等词；上标是唯一可见的引用形式。\n"
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
