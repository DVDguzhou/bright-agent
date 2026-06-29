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
	CiteIndex      int
	ID             string
	SourceType     string
	Title          string
	Excerpt        string
	FullContent    string
	Category       string
	Confidence     string
	FactKey        string
	TopicGroup     string
	TopicKey       string
	Route          string
	CreatedAt      string
	Facets         string
	ParentID       string
	ParentTitle    string
	EvidenceKind   string
	EvidenceUnitID string
	ChunkIndex     int
	CharStart      int
	CharEnd        int
}

// CitationCatalog ordered sources for reconcile prompt numbering (facts → entry chunks → live → topics).
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
		return "确认信息"
	case "topic":
		return "经历摘要"
	case "knowledge":
		return "经历片段"
	case "liveUpdate":
		return "最近动态"
	case "profile":
		return "个人资料"
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
		entryTitle := normalizeCitationTitle(e.Title)
		if entryTitle == label || (label != "" && strings.HasPrefix(entryTitle, label+" ·")) {
			return true
		}
		for _, id := range topic.SourceEntryIDs {
			if id == e.ID || id == e.SourceEntryID {
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

type citationTextChunk struct {
	ID        string
	Index     int
	Text      string
	CharStart int
	CharEnd   int
}

const (
	citationChunkTargetRunes  = 260
	citationChunkMaxRunes     = 420
	citationChunkMinRunes     = 80
	citationMaxChunksPerEntry = 4
)

func splitKnowledgeEntryForCitations(entry KnowledgeEntryForAI) []citationTextChunk {
	content := strings.TrimSpace(entry.Content)
	if content == "" {
		return nil
	}
	runes := []rune(entry.Content)
	if len([]rune(content)) <= citationChunkMaxRunes {
		start, end := trimmedRuneBounds(runes, 0, len(runes))
		return []citationTextChunk{{Index: 1, Text: strings.TrimSpace(string(runes[start:end])), CharStart: start, CharEnd: end}}
	}

	segments := splitCitationTextSegments(entry.Content)
	if len(segments) == 0 {
		return splitLongCitationWindow(runes, 0)
	}

	var chunks []citationTextChunk
	var cur strings.Builder
	curStart, curEnd := -1, -1
	flush := func() {
		if cur.Len() == 0 || curStart < 0 || curEnd <= curStart {
			return
		}
		text := strings.TrimSpace(cur.String())
		if text == "" {
			cur.Reset()
			curStart, curEnd = -1, -1
			return
		}
		chunks = append(chunks, citationTextChunk{
			Index:     len(chunks) + 1,
			Text:      text,
			CharStart: curStart,
			CharEnd:   curEnd,
		})
		cur.Reset()
		curStart, curEnd = -1, -1
	}

	for _, seg := range segments {
		segRunes := []rune(seg.Text)
		if len(segRunes) > citationChunkMaxRunes {
			flush()
			for _, w := range splitLongCitationWindow(segRunes, seg.CharStart) {
				w.Index = len(chunks) + 1
				chunks = append(chunks, w)
			}
			continue
		}
		curLen := len([]rune(cur.String()))
		nextLen := curLen + len(segRunes)
		if curLen > 0 && nextLen > citationChunkMaxRunes && curLen >= citationChunkMinRunes {
			flush()
		}
		if cur.Len() > 0 {
			cur.WriteString("\n")
		}
		if curStart < 0 {
			curStart = seg.CharStart
		}
		cur.WriteString(seg.Text)
		curEnd = seg.CharEnd
		if len([]rune(cur.String())) >= citationChunkTargetRunes {
			flush()
		}
	}
	flush()
	if len(chunks) == 0 {
		start, end := trimmedRuneBounds(runes, 0, len(runes))
		return []citationTextChunk{{Index: 1, Text: strings.TrimSpace(string(runes[start:end])), CharStart: start, CharEnd: end}}
	}
	return chunks
}

func selectKnowledgeCitationChunks(entry KnowledgeEntryForAI, query string) []citationTextChunk {
	chunks := citationChunksFromEntry(entry)
	if len(chunks) <= citationMaxChunksPerEntry {
		return chunks
	}
	type scoredChunk struct {
		chunk citationTextChunk
		score int
	}
	scored := make([]scoredChunk, 0, len(chunks))
	for _, chunk := range chunks {
		scored = append(scored, scoredChunk{chunk: chunk, score: scoreCitationChunk(query, entry, chunk)})
	}
	sort.SliceStable(scored, func(i, j int) bool {
		if scored[i].score == scored[j].score {
			return scored[i].chunk.Index < scored[j].chunk.Index
		}
		return scored[i].score > scored[j].score
	})
	selected := make([]citationTextChunk, 0, citationMaxChunksPerEntry)
	for i := 0; i < len(scored) && i < citationMaxChunksPerEntry; i++ {
		selected = append(selected, scored[i].chunk)
	}
	sort.SliceStable(selected, func(i, j int) bool {
		return selected[i].Index < selected[j].Index
	})
	return selected
}

func citationChunksFromEntry(entry KnowledgeEntryForAI) []citationTextChunk {
	if len(entry.CitationChunks) == 0 {
		return splitKnowledgeEntryForCitations(entry)
	}
	chunks := make([]citationTextChunk, 0, len(entry.CitationChunks))
	for _, row := range entry.CitationChunks {
		text := strings.TrimSpace(row.Content)
		if text == "" {
			continue
		}
		idx := row.ChunkIndex
		if idx <= 0 {
			idx = len(chunks) + 1
		}
		chunks = append(chunks, citationTextChunk{
			ID:        row.ID,
			Index:     idx,
			Text:      text,
			CharStart: row.CharStart,
			CharEnd:   row.CharEnd,
		})
	}
	sort.SliceStable(chunks, func(i, j int) bool {
		return chunks[i].Index < chunks[j].Index
	})
	return chunks
}

func scoreCitationChunk(query string, entry KnowledgeEntryForAI, chunk citationTextChunk) int {
	query = strings.TrimSpace(query)
	if query == "" {
		return citationMaxChunksPerEntry - minInt(chunk.Index, citationMaxChunksPerEntry)
	}
	normChunk := normalize(chunk.Text + " " + entry.Title + " " + entry.Category + " " + strings.Join(entry.Tags, " "))
	score := 0
	for _, tok := range tokenize(query) {
		if strings.Contains(normChunk, tok) {
			score += 3
		}
	}
	if facetScore := ScoreFacetMatch(ParseQueryFacet(query), entry.Facets); facetScore > 0 {
		score += facetScore
	}
	return score
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func splitCitationTextSegments(content string) []citationTextChunk {
	runes := []rune(content)
	var segments []citationTextChunk
	start := 0
	flush := func(end int) {
		s, e := trimmedRuneBounds(runes, start, end)
		if e > s {
			segments = append(segments, citationTextChunk{
				Index:     len(segments) + 1,
				Text:      strings.TrimSpace(string(runes[s:e])),
				CharStart: s,
				CharEnd:   e,
			})
		}
		start = end
	}
	for i, r := range runes {
		if isCitationSegmentBoundary(r) {
			flush(i + 1)
		}
	}
	if start < len(runes) {
		flush(len(runes))
	}
	return segments
}

func isCitationSegmentBoundary(r rune) bool {
	switch r {
	case '。', '！', '？', '；', '\n', '.', '!', '?', ';':
		return true
	default:
		return false
	}
}

func trimmedRuneBounds(runes []rune, start, end int) (int, int) {
	if start < 0 {
		start = 0
	}
	if end > len(runes) {
		end = len(runes)
	}
	for start < end && strings.TrimSpace(string(runes[start])) == "" {
		start++
	}
	for end > start && strings.TrimSpace(string(runes[end-1])) == "" {
		end--
	}
	return start, end
}

func splitLongCitationWindow(runes []rune, baseStart int) []citationTextChunk {
	if len(runes) == 0 {
		return nil
	}
	var chunks []citationTextChunk
	for start := 0; start < len(runes); start += citationChunkTargetRunes {
		end := start + citationChunkTargetRunes
		if end > len(runes) {
			end = len(runes)
		}
		s, e := trimmedRuneBounds(runes, start, end)
		if e <= s {
			continue
		}
		chunks = append(chunks, citationTextChunk{
			Index:     len(chunks) + 1,
			Text:      strings.TrimSpace(string(runes[s:e])),
			CharStart: baseStart + s,
			CharEnd:   baseStart + e,
		})
	}
	return chunks
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
	for _, entry := range plan.Entries {
		if !IsEvidenceKnowledgeEntry(entry) {
			continue
		}
		chunks := selectKnowledgeCitationChunks(entry, plan.Query)
		if len(chunks) == 0 {
			fallbackText := strings.TrimSpace(firstNonEmpty(entry.Content, entry.Title, entry.Category))
			if fallbackText == "" {
				continue
			}
			chunks = []citationTextChunk{{Index: 1, Text: fallbackText}}
		}
		for _, chunk := range chunks {
			excerpt := normalizeSnippet(firstSentence(chunk.Text, 120))
			if excerpt == "" {
				excerpt = "与本次回答相关的一段经历。"
			}
			id := chunk.ID
			if id == "" {
				id = entry.ID
			}
			if chunk.ID == "" && len(chunks) > 1 {
				id = fmt.Sprintf("%s#chunk-%d", entry.ID, chunk.Index)
			}
			items = append(items, CitationItem{
				CiteIndex:      idx,
				ID:             id,
				SourceType:     "knowledge",
				Title:          entry.Title,
				Excerpt:        excerpt,
				FullContent:    chunk.Text,
				Category:       entry.Category,
				Confidence:     conf,
				Route:          route,
				Facets:         FacetSummary(entry.Facets),
				ParentID:       firstNonEmpty(entry.SourceEntryID, entry.ID),
				ParentTitle:    entry.Title,
				EvidenceUnitID: entry.ID,
				EvidenceKind: func() string {
					if entry.SourceEntryID != "" && entry.SourceEntryID != entry.ID {
						return "event"
					}
					return ""
				}(),
				ChunkIndex: chunk.Index,
				CharStart:  chunk.CharStart,
				CharEnd:    chunk.CharEnd,
			})
			idx++
		}
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
	for _, topic := range topicsForCitationDisplay(plan) {
		excerpt := normalizeSnippet(firstSentence(topic.Summary, 80))
		if excerpt == "" {
			excerpt = "与本次回答相关的一段经历摘要。"
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

// BuildCitationCatalogReferences returns every source exposed to the final
// generation pass. Per-bubble references remain a filtered subset of this list.
func BuildCitationCatalogReferences(catalog CitationCatalog) []map[string]string {
	refs := make([]map[string]string, 0, len(catalog.Items))
	for _, item := range catalog.Items {
		refs = append(refs, citationItemToMap(item, true))
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

func BackfillSegmentCitationsFromReferences(segments []string, refs []map[string]string) ([]string, int) {
	out := make([]string, len(segments))
	copy(out, segments)
	if len(out) == 0 || len(refs) == 0 {
		return out, 0
	}
	backfilled := 0
	for i, seg := range out {
		seg = strings.TrimSpace(NormalizeCitationMarkers(seg))
		out[i] = seg
		if seg == "" {
			continue
		}
		if _, used := ParseInlineCitations(seg); len(used) > 0 {
			continue
		}
		if sentenceIsCitationExempt(seg) {
			continue
		}
		best, second := bestTwoReferenceScores(seg, refs)
		if best.ref == nil || !shouldBackfillReferenceCitation(seg, best, second) {
			continue
		}
		n, err := strconv.Atoi((*best.ref)["citeIndex"])
		if err != nil || n <= 0 {
			continue
		}
		out[i] = appendCitationMarker(seg, n)
		backfilled++
	}
	return out, backfilled
}

const (
	semanticCitationMinSimilarity = float32(0.62)
	semanticCitationMinMargin     = float32(0.04)
)

// SemanticBackfillSegmentCitations assigns at most one source to each still-
// uncited bubble. A weak or ambiguous match intentionally remains uncited.
func SemanticBackfillSegmentCitations(ctx context.Context, embedder Embedder, segments []string, refs []map[string]string) ([]string, int) {
	out := append([]string(nil), segments...)
	if embedder == nil || len(out) == 0 || len(refs) == 0 {
		return out, 0
	}

	type candidate struct {
		refIndex int
		text     string
	}
	candidates := make([]candidate, 0, len(refs))
	for i, ref := range refs {
		if !isSemanticCitationCandidate(ref) {
			continue
		}
		text := strings.TrimSpace(strings.Join([]string{
			ref["title"], ref["displayExcerpt"], ref["excerpt"], ref["fullContent"],
		}, "\n"))
		if text != "" {
			candidates = append(candidates, candidate{refIndex: i, text: text})
		}
	}
	if len(candidates) == 0 {
		return out, 0
	}

	segmentIndexes := make([]int, 0, len(out))
	inputs := make([]string, 0, len(candidates)+len(out))
	for _, candidate := range candidates {
		inputs = append(inputs, candidate.text)
	}
	for i, segment := range out {
		segment = strings.TrimSpace(NormalizeCitationMarkers(segment))
		out[i] = segment
		if segment == "" || sentenceIsCitationExempt(segment) {
			continue
		}
		if _, used := ParseInlineCitations(segment); len(used) > 0 {
			continue
		}
		segmentIndexes = append(segmentIndexes, i)
		inputs = append(inputs, segment)
	}
	if len(segmentIndexes) == 0 {
		return out, 0
	}

	vectors, err := embedder.Embed(ctx, inputs)
	if err != nil || len(vectors) != len(inputs) {
		return out, 0
	}

	backfilled := 0
	for offset, segmentIndex := range segmentIndexes {
		segmentVector := vectors[len(candidates)+offset]
		bestIndex := -1
		bestScore := float32(-1)
		secondScore := float32(-1)
		for candidateIndex := range candidates {
			score := CosineSim(segmentVector, vectors[candidateIndex])
			if score > bestScore {
				secondScore = bestScore
				bestScore = score
				bestIndex = candidateIndex
			} else if score > secondScore {
				secondScore = score
			}
		}
		if bestIndex < 0 || bestScore < semanticCitationMinSimilarity {
			continue
		}
		if len(candidates) > 1 && bestScore-secondScore < semanticCitationMinMargin {
			continue
		}
		ref := refs[candidates[bestIndex].refIndex]
		n, err := strconv.Atoi(ref["citeIndex"])
		if err != nil || n <= 0 {
			continue
		}
		out[segmentIndex] = appendCitationMarker(out[segmentIndex], n)
		backfilled++
	}
	return out, backfilled
}

func isSemanticCitationCandidate(ref map[string]string) bool {
	n, err := strconv.Atoi(ref["citeIndex"])
	if err != nil || n <= 0 {
		return false
	}
	switch strings.ToLower(strings.TrimSpace(ref["factKey"])) {
	case "audience", "welcome_message", "headline":
		return false
	}
	title := strings.ToLower(strings.TrimSpace(ref["title"]))
	return !strings.Contains(title, "适用人群") && !strings.Contains(title, "擅长与适用")
}

type scoredCitationReference struct {
	ref        *map[string]string
	score      int
	anchorHits int
	longHit    bool
}

func bestTwoReferenceScores(seg string, refs []map[string]string) (best, second scoredCitationReference) {
	for i := range refs {
		ref := &refs[i]
		if _, err := strconv.Atoi((*ref)["citeIndex"]); err != nil {
			continue
		}
		score, anchorHits, longHit := segmentReferenceScore(seg, *ref)
		candidate := scoredCitationReference{ref: ref, score: score, anchorHits: anchorHits, longHit: longHit}
		if candidate.score > best.score {
			second = best
			best = candidate
		} else if candidate.score > second.score {
			second = candidate
		}
	}
	return best, second
}

func shouldBackfillReferenceCitation(seg string, best, second scoredCitationReference) bool {
	if best.score < 9 || best.anchorHits < 2 {
		return false
	}
	if !best.longHit && best.score < 12 {
		return false
	}
	if best.score-second.score < 3 {
		return false
	}
	item := citationItemFromReference(*best.ref)
	if citationShouldStrip(seg, item) {
		return false
	}
	return true
}

func citationItemFromReference(ref map[string]string) CitationItem {
	return CitationItem{
		ID:          ref["id"],
		SourceType:  ref["sourceType"],
		Title:       ref["title"],
		Excerpt:     ref["excerpt"],
		FullContent: firstNonEmpty(ref["fullContent"], ref["excerpt"], ref["displayExcerpt"], ref["title"]),
		Category:    ref["category"],
		FactKey:     ref["factKey"],
		TopicGroup:  ref["topicGroup"],
		TopicKey:    ref["topicKey"],
	}
}

func segmentReferenceScore(seg string, ref map[string]string) (int, int, bool) {
	normSeg := normalize(seg)
	score := 0
	anchorHits := 0
	longHit := false
	seen := map[string]bool{}
	addField := func(text string, weight int) {
		for _, term := range referenceMatchTerms(text) {
			normTerm := normalize(term)
			if normTerm == "" || seen[normTerm] || !strings.Contains(normSeg, normTerm) {
				continue
			}
			seen[normTerm] = true
			anchorHits++
			termLen := len([]rune(normTerm))
			points := weight
			if termLen >= 4 {
				points += weight
				longHit = true
			}
			if termLen >= 7 {
				points += weight
			}
			score += points
		}
	}
	addField(ref["displayExcerpt"], 4)
	addField(ref["excerpt"], 3)
	addField(ref["fullContent"], 2)
	return score, anchorHits, longHit
}

func referenceMatchTerms(text string) []string {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}
	seen := map[string]bool{}
	terms := make([]string, 0)
	add := func(term string) {
		term = strings.TrimSpace(term)
		if len([]rune(term)) < 2 || isCitationStopWord(term) || isReferenceBackfillGenericTerm(term) {
			return
		}
		norm := normalize(term)
		if norm == "" || seen[norm] {
			return
		}
		seen[norm] = true
		terms = append(terms, term)
	}
	for _, term := range extractSignificantTerms(text) {
		add(term)
	}
	sample := text
	if len([]rune(sample)) > 160 {
		sample = string([]rune(sample)[:160])
	}
	return terms
}

func isReferenceBackfillGenericTerm(term string) bool {
	switch normalize(term) {
	case "经历", "背景", "本人", "建议", "摘要", "动态", "事实", "主题", "内容", "相关", "个人", "一般", "具体", "项目", "系统", "事情", "时候", "感觉", "真的", "那段", "这段":
		return true
	}
	return false
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

func displayExcerptForCitation(item CitationItem) string {
	text := normalizeSnippet(firstSentence(firstNonEmpty(item.Excerpt, item.FullContent, item.Title), 40))
	if text == "" {
		return "与本次回答相关的经历片段"
	}
	return text
}

func citationItemToMap(item CitationItem, includeCiteIndex bool) map[string]string {
	m := map[string]string{
		"id":              item.ID,
		"sourceType":      item.SourceType,
		"sourceTypeLabel": SourceTypeLabel(item.SourceType),
		"title":           item.Title,
		"excerpt":         item.Excerpt,
		"displayExcerpt":  displayExcerptForCitation(item),
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
	if item.ParentID != "" {
		m["parentId"] = item.ParentID
	}
	if item.ParentTitle != "" {
		m["parentTitle"] = item.ParentTitle
	}
	if item.EvidenceUnitID != "" {
		m["evidenceUnitId"] = item.EvidenceUnitID
	}
	if item.ChunkIndex > 0 {
		m["chunkIndex"] = strconv.Itoa(item.ChunkIndex)
		if item.EvidenceKind == "" {
			m["evidenceKind"] = "chunk"
		}
	}
	if item.EvidenceKind != "" {
		m["evidenceKind"] = item.EvidenceKind
	}
	if item.CharStart > 0 || item.CharEnd > 0 {
		m["charStart"] = strconv.Itoa(item.CharStart)
		m["charEnd"] = strconv.Itoa(item.CharEnd)
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
			cp["displayExcerpt"] = displayExcerptForCitation(item)
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
		if item.ParentTitle != "" && item.ChunkIndex > 0 {
			sb.WriteString(fmt.Sprintf("原条目：%s；片段：%d\n", item.ParentTitle, item.ChunkIndex))
		}
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
	return "9. 【内部来源标注 - 硬约束】每个自然段会作为一条独立气泡发送。凡某段使用了编号素材中的事实，该段末尾必须至少标一次对应的 [n]。" +
		"同一气泡使用多条素材时分别标 [n]；每条素材在同一气泡内最多 1 次，不同气泡必须按实际使用情况重复标注。" +
		"[n] 必须标在转述了编号 n 那条素材事实的句末，禁止按句子顺序或「第几句」填号。" +
		"纯语气、模糊感受、态度、反问句不标。标记只供系统解析，禁止写「根据资料」「知识库」。\n"
}

// EnsureInlineCitations adds [n] markers via a lightweight LLM pass when reconcile omitted them.
func EnsureInlineCitations(ctx context.Context, client *openai.Client, model, text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	if !paragraphsNeedCitationAssignment(text) {
		return ValidateInlineCitationIndexes(NormalizeCitationMarkers(text), catalog)
	}

	system := "你是来源归属助手。每个自然段都是一条独立聊天气泡。任务：在每个使用了编号素材事实的自然段末尾添加对应 [n]，n 与素材编号一致。\n" +
		"规则：已有正确标注必须保留；同一素材在同一段最多 1 次，不同段可以重复；纯语气、感受、态度、反问不标；素材与段落事实无关时禁止标；" +
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
	if out == "" || citationAssignOutputRejected(out, text) {
		log.Printf("[citations] ensureInlineCitations rejected output, keeping original")
		return text
	}
	out = humanizeReply(out)
	if out == "" {
		return text
	}
	return ValidateInlineCitationIndexes(NormalizeCitationMarkers(out), catalog)
}

// citationAssignOutputRejected detects when the citation LLM echoes prompt instructions instead of annotated text.
func citationAssignOutputRejected(output, original string) bool {
	o := strings.TrimSpace(output)
	if o == "" {
		return true
	}
	for _, marker := range []string{
		"请输出加了", "待标注正文", "编号素材", "来源归属助手", "不要加解释", "不要 Markdown",
	} {
		if strings.Contains(o, marker) {
			return true
		}
	}
	origRunes := len([]rune(StripInlineCitations(strings.TrimSpace(original))))
	outRunes := len([]rune(StripInlineCitations(o)))
	if origRunes >= 16 && outRunes < origRunes/3 {
		return true
	}
	return false
}

func paragraphsNeedCitationAssignment(text string) bool {
	for _, para := range splitParagraphs(text) {
		joined := strings.TrimSpace(joinLinesInParagraph(para))
		if joined == "" || len([]rune(StripInlineCitations(joined))) < 12 || sentenceIsCitationExempt(joined) {
			continue
		}
		if _, used := ParseInlineCitations(joined); len(used) == 0 {
			return true
		}
	}
	return false
}

// ValidateInlineCitationIndexes only checks the internal marker protocol. The
// LLM assignment pass has the full source text and performs semantic matching;
// this layer removes hallucinated or unavailable indexes without re-judging by
// brittle keyword overlap.
func ValidateInlineCitationIndexes(text string, catalog CitationCatalog) string {
	valid := make(map[int]bool, len(catalog.Items))
	for _, item := range catalog.Items {
		valid[item.CiteIndex] = true
	}
	return citeBracketRe.ReplaceAllStringFunc(text, func(marker string) string {
		match := citeBracketRe.FindStringSubmatch(marker)
		if len(match) != 2 {
			return ""
		}
		index, err := strconv.Atoi(match[1])
		if err != nil || !valid[index] {
			return ""
		}
		return marker
	})
}

// HeuristicEnsureInlineCitations adds [n] when sentence content matches catalog item semantics.
func HeuristicEnsureInlineCitations(text string, catalog CitationCatalog) string {
	return fillSentenceCitations(text, catalog)
}

// overlapEnsureInlineCitations adds [n] to uncited sentences when content matches catalog.
func overlapEnsureInlineCitations(text string, catalog CitationCatalog) string {
	return fillSentenceCitations(text, catalog)
}

// splitCitationSentences splits a paragraph into Chinese sentences, keeping terminal punctuation.
func splitCitationSentences(para string) []string {
	para = strings.TrimSpace(para)
	if para == "" {
		return nil
	}
	var sentences []string
	var buf strings.Builder
	for _, r := range para {
		buf.WriteRune(r)
		if r == '。' || r == '！' || r == '？' {
			s := strings.TrimSpace(buf.String())
			if s != "" {
				sentences = append(sentences, s)
			}
			buf.Reset()
		}
	}
	if tail := strings.TrimSpace(buf.String()); tail != "" {
		sentences = append(sentences, tail)
	}
	return mergeShortCitationSentences(sentences)
}

func mergeShortCitationSentences(sentences []string) []string {
	if len(sentences) <= 1 {
		return sentences
	}
	out := make([]string, 0, len(sentences))
	for i := 0; i < len(sentences); i++ {
		s := sentences[i]
		if len(out) > 0 && len([]rune(s)) < 10 && len(out[len(out)-1])+len([]rune(s)) < 120 {
			out[len(out)-1] += s
			continue
		}
		out = append(out, s)
	}
	return out
}

// fillSentenceCitations adds [n] to supported sentences. Paragraphs become
// separate chat bubbles, so citation de-duplication is scoped per paragraph.
func fillSentenceCitations(text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	paras := splitParagraphs(text)
	changed := false
	for i, para := range paras {
		joined := strings.TrimSpace(joinLinesInParagraph(para))
		if joined == "" {
			continue
		}
		usedItems := map[int]bool{}
		if _, existing := ParseInlineCitations(joined); len(existing) > 0 {
			for _, n := range existing {
				usedItems[n] = true
			}
		}
		newPara, paraChanged := fillSentenceCitationsInParagraph(joined, catalog, usedItems)
		if paraChanged {
			changed = true
			paras[i] = newPara
		}
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

func fillSentenceCitationsInParagraph(para string, catalog CitationCatalog, usedItems map[int]bool) (string, bool) {
	sentences := splitCitationSentences(para)
	if len(sentences) == 0 {
		return para, false
	}
	changed := false
	for j, sent := range sentences {
		sent = strings.TrimSpace(sent)
		if sent == "" || len([]rune(sent)) < 12 {
			continue
		}
		if _, used := ParseInlineCitations(sent); len(used) > 0 {
			for _, n := range used {
				usedItems[n] = true
			}
			continue
		}
		if sentenceIsCitationExempt(sent) {
			continue
		}
		best, _ := bestTwoCatalogScores(sent, catalog)
		if best.item == nil || usedItems[best.item.CiteIndex] {
			continue
		}
		if !shouldKeepCitation(sent, para, *best.item, catalog) {
			continue
		}
		sentences[j] = appendCitationMarker(sent, best.item.CiteIndex)
		usedItems[best.item.CiteIndex] = true
		changed = true
	}
	if !changed {
		return para, false
	}
	return strings.Join(sentences, ""), true
}

const (
	citationAbsMinScore = 6
	citationScoreMargin = 2
)

type scoredCitationItem struct {
	item  *CitationItem
	score int
}

func bestTwoCatalogScores(sent string, catalog CitationCatalog) (best, second scoredCitationItem) {
	for i := range catalog.Items {
		item := &catalog.Items[i]
		score := sentenceItemGroundingScore(sent, *item)
		if score > best.score {
			second = best
			best = scoredCitationItem{item: item, score: score}
		} else if score > second.score {
			second = scoredCitationItem{item: item, score: score}
		}
	}
	return best, second
}

func bestCatalogMatchForParagraph(para string, catalog CitationCatalog) (*CitationItem, int) {
	best, _ := bestTwoCatalogScores(para, catalog)
	return best.item, best.score
}

// sentenceItemGroundingScore estimates how well a sentence is grounded in one catalog item.
func sentenceItemGroundingScore(para string, item CitationItem) int {
	norm := normalize(para)
	score := contentOverlapScore(para, item.FullContent)
	score += contentPhraseMatchScore(para, item.FullContent)
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
		if isPhysicsCosmologyTalk(norm) {
			score -= 8
		} else if containsAnyNormalized(norm, []string{
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
	case strings.Contains(title, "物理") || strings.Contains(title, "量子") || strings.Contains(title, "相对论"):
		if containsAnyNormalized(norm, []string{"物理", "量子", "相对论", "自学", "小学", "小时候"}) {
			score += 5
		}
	default:
		contentNorm := normalize(item.FullContent)
		if strings.Contains(contentNorm, "量子力学") || strings.Contains(contentNorm, "相对论") {
			if containsAnyNormalized(norm, []string{"物理", "量子", "相对论", "自学", "小学", "小时候"}) {
				score += 5
			}
		}
	}
	if isPhysicsCosmologyTalk(norm) && isBackgroundSummaryItem(item) && !catalogItemMentionsPhysics(item) {
		score -= 15
	}
	if isBackgroundExperienceTalk(norm) && catalogItemMentionsPhysics(item) && !isBackgroundSummaryItem(item) {
		score -= 10
	}
	return score
}

func contentPhraseMatchScore(sentence, evidence string) int {
	normSentence := normalize(sentence)
	longest := 0
	for _, term := range citationContentNGrams(evidence) {
		if isCitationGenericAnchor(term) || !strings.Contains(normSentence, normalize(term)) {
			continue
		}
		if size := len([]rune(term)); size > longest {
			longest = size
		}
	}
	switch {
	case longest >= 8:
		return 6
	case longest >= 6:
		return 5
	case longest >= 4:
		return 3
	default:
		return 0
	}
}

func citationAnchorTerms(item CitationItem) []string {
	seen := map[string]bool{}
	var terms []string
	contentSample := item.FullContent
	if len([]rune(contentSample)) > 200 {
		contentSample = string([]rune(contentSample)[:200])
	}
	for _, term := range extractSignificantTerms(contentSample) {
		if isCitationGenericAnchor(term) || seen[term] {
			continue
		}
		seen[term] = true
		terms = append(terms, term)
	}
	for _, term := range citationContentNGrams(contentSample) {
		if isCitationGenericAnchor(term) || seen[term] {
			continue
		}
		seen[term] = true
		terms = append(terms, term)
	}
	for _, kw := range citationKeywords(item) {
		if len([]rune(kw)) < 2 || isCitationStopWord(kw) || isCitationGenericAnchor(kw) || seen[kw] {
			continue
		}
		seen[kw] = true
		terms = append(terms, kw)
	}
	return terms
}

// citationContentNGrams extracts exact phrases from evidence text only. Titles,
// tags and facets deliberately do not participate in citation validation.
func citationContentNGrams(text string) []string {
	var terms []string
	for _, segment := range strings.FieldsFunc(normalize(text), func(r rune) bool {
		return r == '，' || r == '。' || r == '、' || r == '；' || r == ' ' || r == ':' || r == '：' ||
			r == '\n' || r == '/' || r == '|' || r == ',' || r == '.'
	}) {
		runes := []rune(strings.TrimSpace(segment))
		for size := 4; size <= 8 && size <= len(runes); size++ {
			for start := 0; start+size <= len(runes); start++ {
				terms = append(terms, string(runes[start:start+size]))
			}
		}
	}
	return terms
}

func isCitationGenericAnchor(term string) bool {
	switch term {
	case "经历", "背景", "本人", "建议", "摘要", "动态", "事实", "主题", "内容", "相关", "个人", "一般", "具体",
		"大学", "大学生活", "生活", "工作", "职场", "考研", "留学", "创业", "实习", "项目":
		return true
	}
	return false
}

func citationAnchorHits(sent string, item CitationItem) int {
	norm := normalize(sent)
	hits := 0
	for _, term := range citationAnchorTerms(item) {
		if strings.Contains(norm, normalize(term)) {
			hits++
		}
	}
	return hits
}

// citationGroundingValid requires absolute score, competitive best match, and anchor overlap.
func citationGroundingValid(sent string, item CitationItem, catalog CitationCatalog) bool {
	if citationShouldStrip(sent, item) {
		return false
	}
	score := sentenceItemGroundingScore(sent, item)
	minScore := citationAbsMinScore
	if citationAnchorHits(sent, item) >= 2 {
		minScore = citationAbsMinScore - 1
	}
	if score < minScore {
		return false
	}
	if citationAnchorHits(sent, item) < 1 {
		return false
	}
	best, second := bestTwoCatalogScores(sent, catalog)
	if best.item == nil || best.item.CiteIndex != item.CiteIndex {
		return false
	}
	if len(catalog.Items) > 1 {
		margin := citationScoreMargin
		if citationAnchorHits(sent, *best.item) >= 2 {
			margin = 1
		}
		if best.score-second.score < margin {
			return false
		}
	}
	return true
}

func shouldKeepCitation(sent, para string, item CitationItem, catalog CitationCatalog) bool {
	if citationShouldStripContext(sent, para, item) {
		return false
	}
	return citationGroundingValid(sent, item, catalog)
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

// citationShouldStrip removes clearly wrong source–sentence pairings.
func citationShouldStrip(para string, item CitationItem) bool {
	norm := normalize(para)
	title := normalize(item.Title)
	if isPhysicsCosmologyTalk(norm) && isBackgroundSummaryItem(item) && !catalogItemMentionsPhysics(item) {
		return true
	}
	if isBackgroundExperienceTalk(norm) && !isPhysicsCosmologyTalk(norm) &&
		catalogItemMentionsPhysics(item) && !isBackgroundSummaryItem(item) {
		return true
	}
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

func isPhysicsCosmologyTalk(norm string) bool {
	return containsAnyNormalized(norm, []string{
		"相对论", "量子力学", "量子", "时间简史", "时间膨胀", "尺缩", "科普书", "霍金", "宇宙学",
	})
}

func isBackgroundExperienceTalk(norm string) bool {
	return containsAnyNormalized(norm, []string{
		"温州大学", "双非", "考研", "留学", "创业", "找工作", "四条路", "多元经历",
	})
}

func isBackgroundSummaryItem(item CitationItem) bool {
	title := normalize(item.Title)
	if item.SourceType == "topic" {
		return true
	}
	return strings.Contains(title, "背景") || strings.Contains(title, "多元经历") ||
		strings.Contains(title, "本科背景") || strings.Contains(title, "经历")
}

func catalogItemMentionsPhysics(item CitationItem) bool {
	blob := normalize(item.Title + " " + item.FullContent + " " + item.Excerpt)
	return containsAnyNormalized(blob, []string{
		"物理", "量子", "相对论", "时间简史", "宇宙学",
	})
}

// sentenceIsCitationExempt skips disclaimer / hedging sentences with no verifiable facts to ground.
func sentenceIsCitationExempt(sent string) bool {
	norm := normalize(sent)
	if !containsAnyNormalized(norm, []string{
		"讲不来", "讲不了", "瞎琢磨", "没系统学过", "接不住", "随便问问", "真要让我",
	}) {
		return false
	}
	return !containsAnyNormalized(norm, []string{
		"温州大学", "考研", "留学", "创业", "找工作", "cmu", "985", "211", "双非",
	})
}

func citationKeywords(item CitationItem) []string {
	var kws []string
	contentSample := item.FullContent
	if len([]rune(contentSample)) > 200 {
		contentSample = string([]rune(contentSample)[:200])
	}
	for _, part := range []string{contentSample} {
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

// ValidateInlineCitations strips [n] markers that fail competitive grounding validation.
func ValidateInlineCitations(text string, catalog CitationCatalog) string {
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	paras := splitParagraphs(text)
	changed := false
	for i, para := range paras {
		joined := joinLinesInParagraph(para)
		cleaned := stripInvalidCitationMarkers(joined, catalog)
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

func citationShouldStripContext(sent, para string, item CitationItem) bool {
	if citationShouldStrip(sent, item) {
		return true
	}
	if !isPhysicsCosmologyTalk(normalize(para)) || !isBackgroundSummaryItem(item) || catalogItemMentionsPhysics(item) {
		return false
	}
	// Mixed bubble: keep background cites on sentences that are purely about background.
	if isBackgroundExperienceTalk(normalize(sent)) && !isPhysicsCosmologyTalk(normalize(sent)) {
		return false
	}
	return true
}

func stripInvalidCitationMarkers(para string, catalog CitationCatalog) string {
	byIndex := make(map[int]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byIndex[item.CiteIndex] = item
	}
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
		sent := citationClauseAroundMarker(para, m[0], m[1])
		if ok && shouldKeepCitation(sent, para, item, catalog) {
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

// CapCitationMarkers enforces at-most-once per source within each paragraph.
func CapCitationMarkers(text string, catalog CitationCatalog) string {
	text = strings.TrimSpace(text)
	if text == "" || len(catalog.Items) == 0 {
		return text
	}
	paras := splitParagraphs(text)
	changed := false
	for i, para := range paras {
		joined := joinLinesInParagraph(para)
		seenIndex := map[int]bool{}
		capped := capCitationMarkersInParagraph(joined, catalog, seenIndex)
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

func capCitationMarkersInParagraph(para string, catalog CitationCatalog, seenIndex map[int]bool) string {
	byIndex := make(map[int]CitationItem, len(catalog.Items))
	for _, item := range catalog.Items {
		byIndex[item.CiteIndex] = item
	}
	matches := citeBracketRe.FindAllStringSubmatchIndex(para, -1)
	if len(matches) == 0 {
		return para
	}
	var b strings.Builder
	last := 0
	for _, m := range matches {
		b.WriteString(para[last:m[0]])
		n, _ := strconv.Atoi(para[m[2]:m[3]])
		_, ok := byIndex[n]
		keep := ok && !seenIndex[n]
		if keep {
			b.WriteString(para[m[0]:m[1]])
			seenIndex[n] = true
		}
		last = m[1]
	}
	b.WriteString(para[last:])
	return b.String()
}

// citationClauseAroundMarker bounds the cited clause by punctuation and adjacent citation markers.
func citationClauseAroundMarker(para string, start, end int) string {
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
	if i := lastCitationMarkerEnd(before); i > sentStart {
		sentStart = i
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
	if i := nextCitationMarkerStart(after); i >= 0 {
		candidate := end + i
		if candidate < sentEnd {
			sentEnd = candidate
		}
	}
	clause := strings.TrimSpace(para[sentStart:sentEnd])
	clause = citeBracketRe.ReplaceAllString(clause, "")
	return strings.TrimSpace(clause)
}

func lastCitationMarkerEnd(before string) int {
	matches := citeBracketRe.FindAllStringSubmatchIndex(before, -1)
	if len(matches) == 0 {
		return 0
	}
	return matches[len(matches)-1][1]
}

func nextCitationMarkerStart(after string) int {
	loc := citeBracketRe.FindStringIndex(after)
	if loc == nil {
		return -1
	}
	return loc[0]
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
		if len(catalog.Items) > 0 && paragraphsNeedCitationAssignment(out) {
			out = EnsureInlineCitations(ctx, client, model, out, catalog)
		}
		_, usedIndexes := ParseInlineCitations(out)
		if len(catalog.Items) > 0 && len(usedIndexes) == 0 {
			out = HeuristicEnsureInlineCitations(out, catalog)
		}
		_, usedIndexes = ParseInlineCitations(out)
		if len(catalog.Items) > 0 {
			out = fillSentenceCitations(out, catalog)
		}
		_ = sparse // sparse affects reconcile wording, not whether grounded replies get cites
	} else {
		out = StripInlineCitations(out)
	}

	_, usedIndexes := ParseInlineCitations(out)
	if !citationsEnabled {
		return out, nil
	}
	out = ValidateInlineCitationIndexes(out, catalog)
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
				ID: firstNonEmpty(item.ParentID, item.ID), Title: item.Title, Content: item.FullContent, Category: item.Category,
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
