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
		log.Printf("[citations] no inline markers found; falling back to full catalog (%d items)", len(catalog.Items))
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
	return "9. 【引用标注】凡句中使用了某条编号素材的具体信息，该句末尾必须有对应 [n]（如[1]、[2]，数字与素材 [n] 一致），每句最多 3 个。禁止写「根据资料」「知识库」等词；只用 [n] 标注，不要另起一行列来源；加标注时不得删改草稿语义。\n"
}

// EnsureInlineCitations adds [n] markers via a lightweight LLM pass when reconcile omitted them.
func EnsureInlineCitations(ctx context.Context, client *openai.Client, model, text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	if _, used := ParseInlineCitations(text); len(used) > 0 {
		return text
	}

	system := "你是引用标注助手。任务：在正文每句使用了下方编号素材信息的句末添加 [n] 标注，n 与素材编号一致。\n" +
		"规则：不要改正文措辞、不要删字、不要加解释、不要 Markdown；只输出标注后的正文。"
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
	return NormalizeCitationMarkers(out)
}

// FinalizeCitedReply normalizes markers, ensures inline cites when enabled, and builds references.
func FinalizeCitedReply(ctx context.Context, client *openai.Client, model, out string, catalog CitationCatalog, citationsEnabled bool) (string, []map[string]string) {
	if citationsEnabled {
		out = NormalizeCitationMarkers(out)
		_, usedIndexes := ParseInlineCitations(out)
		if len(catalog.Items) > 0 && len(usedIndexes) == 0 {
			out = EnsureInlineCitations(ctx, client, model, out, catalog)
		}
	} else {
		out = StripInlineCitations(out)
	}

	_, usedIndexes := ParseInlineCitations(out)
	if !citationsEnabled {
		return out, nil
	}
	refs := BuildCitedReferences(catalog, usedIndexes, citationsEnabled)
	if len(refs) == 0 {
		refs = EnrichReferencesFromCatalog(BuildRetrievalReferences(catalogToPlan(catalog)), catalog)
	}
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
