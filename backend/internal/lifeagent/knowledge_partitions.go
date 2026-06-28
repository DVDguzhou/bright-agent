package lifeagent

import (
	"fmt"
	"regexp"
	"sort"
	"strings"
)

const knowledgePartitionMinRunes = 6

type knowledgeBoundaryRule struct {
	kind    string
	pattern *regexp.Regexp
}

type knowledgeBoundary struct {
	start int
	end   int
	kind  string
	label string
}

var knowledgeBoundaryRules = []knowledgeBoundaryRule{
	{kind: "section", pattern: regexp.MustCompile(`(?m)^(?:【[^】\n]{2,20}】|#{1,6}\s*[^#\n]{2,30}|[^，。；\n]{2,16}(?:阶段|时期|经历)[:：])`)},
	{kind: "calendar", pattern: regexp.MustCompile(`(?:19|20)\d{2}年(?:\d{1,2}月)?`)},
	{kind: "education", pattern: regexp.MustCompile(`大(?:学)?[一二三四](?:年级)?|小学(?:阶段|期间)?|初中(?:阶段|期间)?|高中(?:阶段|期间)?|本科(?:阶段|期间)?|研究生(?:阶段|期间)?|硕士(?:阶段|期间)?|博士(?:阶段|期间)?|毕业后`)},
	{kind: "career", pattern: regexp.MustCompile(`实习(?:阶段|期间|时)?|第一份工作|第二份工作|入职(?:初期|后|时)?|转行(?:后|阶段)?|离职(?:后|时)?|创业(?:初期|阶段|后)?`)},
	{kind: "project", pattern: regexp.MustCompile(`准备阶段|启动阶段|开发阶段|执行阶段|上线(?:阶段|后)?|运营阶段|复盘阶段|失败后`)},
	{kind: "location", pattern: regexp.MustCompile(`(?:搬到|来到|回到)[^，。；\n]{1,12}(?:后|时)?`)},
	{kind: "transition", pattern: regexp.MustCompile(`(?m)^(?:起初|一开始|后来|之后|再后来|最后)[，,:： ]?`)},
}

var partitionTitleNoise = regexp.MustCompile(`^(?:那年|那会儿|那时候|的时候|期间|阶段|我|是|就|开始|主要是|当时)+`)

// PartitionKnowledgeEntry creates child evidence units at explicit structural
// and event boundaries while retaining the original source entry.
func PartitionKnowledgeEntry(entry KnowledgeEntryForAI) []KnowledgeEntryForAI {
	content := strings.TrimSpace(entry.Content)
	boundaries := detectKnowledgeBoundaries(content)
	if len(boundaries) < 2 {
		return []KnowledgeEntryForAI{normalizeKnowledgeSourceID(entry)}
	}

	parentID := firstNonEmpty(entry.SourceEntryID, entry.ID)
	parts := make([]KnowledgeEntryForAI, 0, len(boundaries))
	partIndexByKey := make(map[string]int, len(boundaries))
	for i, boundary := range boundaries {
		end := len(content)
		if i+1 < len(boundaries) {
			end = boundaries[i+1].start
		}
		start := boundary.start
		if i == 0 && strings.TrimSpace(content[:start]) != "" {
			start = 0
		}
		segment := strings.TrimSpace(content[start:end])
		if len([]rune(StripInlineCitations(segment))) < knowledgePartitionMinRunes {
			if len(parts) > 0 {
				parts[len(parts)-1].Content += " " + segment
			}
			continue
		}

		key := boundary.kind + ":" + normalize(boundary.label)
		if partIndex, exists := partIndexByKey[key]; exists {
			parts[partIndex].Content += "\n" + segment
			continue
		}
		part := entry
		part.ID = fmt.Sprintf("%s#event-%d", parentID, len(parts)+1)
		part.SourceEntryID = parentID
		part.Title = buildKnowledgePartitionTitle(boundary.label, segment)
		part.Content = segment
		part.Tags = uniqueStrings(append(append([]string(nil), entry.Tags...), boundary.kind, boundary.label), 0)
		part.CitationChunks = nil
		if boundary.kind == "calendar" || boundary.kind == "education" || boundary.kind == "career" {
			part.Facets.ContentTime = uniqueStrings(append([]string{boundary.label}, part.Facets.ContentTime...), 3)
		}
		parts = append(parts, part)
		partIndexByKey[key] = len(parts) - 1
	}
	if len(parts) < 2 {
		return []KnowledgeEntryForAI{normalizeKnowledgeSourceID(entry)}
	}
	return parts
}

// PartitionKnowledgeEntryByStage is retained for callers compiled against the
// first stage-only implementation.
func PartitionKnowledgeEntryByStage(entry KnowledgeEntryForAI) []KnowledgeEntryForAI {
	return PartitionKnowledgeEntry(entry)
}

func detectKnowledgeBoundaries(content string) []knowledgeBoundary {
	var candidates []knowledgeBoundary
	var sectionCandidates []knowledgeBoundary
	for _, rule := range knowledgeBoundaryRules {
		for _, match := range rule.pattern.FindAllStringIndex(content, -1) {
			label := canonicalKnowledgeBoundaryLabel(rule.kind, content[match[0]:match[1]])
			if label != "" {
				candidate := knowledgeBoundary{start: match[0], end: match[1], kind: rule.kind, label: label}
				candidates = append(candidates, candidate)
				if rule.kind == "section" {
					sectionCandidates = append(sectionCandidates, candidate)
				}
			}
		}
	}
	// Explicit document structure is stronger than inferred event markers.
	if len(sectionCandidates) >= 2 {
		candidates = sectionCandidates
	}
	sort.SliceStable(candidates, func(i, j int) bool {
		if candidates[i].start == candidates[j].start {
			return candidates[i].end > candidates[j].end
		}
		return candidates[i].start < candidates[j].start
	})

	out := make([]knowledgeBoundary, 0, len(candidates))
	for _, candidate := range candidates {
		if len(out) > 0 && candidate.start < out[len(out)-1].end {
			continue
		}
		if len(out) > 0 {
			previous := &out[len(out)-1]
			gap := strings.TrimSpace(content[previous.end:candidate.start])
			if gap == "" && previous.kind != candidate.kind && previous.kind != "section" && candidate.kind != "section" {
				previous.end = candidate.end
				previous.label += " · " + candidate.label
				continue
			}
		}
		out = append(out, candidate)
	}
	return out
}

func buildKnowledgePartitionTitle(label, segment string) string {
	descriptor := strings.TrimSpace(segment)
	for _, labelPart := range strings.Split(label, " · ") {
		descriptor = strings.TrimLeft(descriptor, "：:，,。；;、 -")
		if strings.HasPrefix(descriptor, labelPart) {
			descriptor = strings.TrimPrefix(descriptor, labelPart)
		}
	}
	descriptor = strings.TrimLeft(descriptor, "：:，,。；;、 -")
	descriptor = partitionTitleNoise.ReplaceAllString(descriptor, "")
	if fields := strings.FieldsFunc(descriptor, func(r rune) bool {
		return r == '，' || r == '。' || r == '；' || r == '\n' || r == ',' || r == '.' || r == ';'
	}); len(fields) > 0 {
		descriptor = strings.TrimSpace(fields[0])
	}
	descriptor = TruncateToRunes(descriptor, 14)
	if len([]rune(descriptor)) >= 2 && normalize(descriptor) != normalize(label) {
		return label + " · " + descriptor
	}
	if strings.HasSuffix(label, "经历") || strings.HasSuffix(label, "阶段") || strings.HasSuffix(label, "时期") {
		return label
	}
	return label + "经历"
}

func normalizeKnowledgeSourceID(entry KnowledgeEntryForAI) KnowledgeEntryForAI {
	if strings.TrimSpace(entry.SourceEntryID) == "" {
		entry.SourceEntryID = entry.ID
	}
	return entry
}

func canonicalKnowledgeBoundaryLabel(kind, value string) string {
	value = strings.TrimSpace(value)
	if kind == "education" {
		for _, stage := range []string{"大一", "大二", "大三", "大四", "小学", "初中", "高中", "本科", "研究生", "硕士", "博士", "毕业后"} {
			if strings.Contains(normalize(value), normalize(stage)) {
				return stage
			}
		}
	}
	if kind == "section" {
		value = strings.TrimSpace(strings.Trim(value, "#【】：: "))
	}
	return strings.Trim(value, "，。；：:、 ")
}

func hasMultipleUniversityStages(text string) bool {
	distinct := map[string]bool{}
	for _, boundary := range detectKnowledgeBoundaries(text) {
		if boundary.kind == "education" && strings.HasPrefix(boundary.label, "大") && len([]rune(boundary.label)) == 2 {
			distinct[boundary.label] = true
		}
	}
	return len(distinct) >= 2
}

func hasKnowledgeBoundaryKind(text, kind string) bool {
	for _, boundary := range detectKnowledgeBoundaries(text) {
		if boundary.kind == kind {
			return true
		}
	}
	return false
}
