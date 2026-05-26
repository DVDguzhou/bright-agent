package lifeagent

import (
	"math"
	"strings"

	"github.com/agent-marketplace/backend/internal/models"
)

// MindScoreBreakdown 心智值分项（无上限成长分，非百分制）。
type MindScoreBreakdown struct {
	Foundation           int     `json:"foundation"`
	TopicCoverage        int     `json:"topicCoverage"`
	TopicDepth           int     `json:"topicDepth"`
	Experience           int     `json:"experience"`
	Relationship         int     `json:"relationship"`
	Opinion              int     `json:"opinion"`
	Style                int     `json:"style"`
	Conversation         int     `json:"conversation"`
	FeedbackFix          int     `json:"feedbackFix"`
	Total                int     `json:"total"`
	Level                int     `json:"level"`
	LevelLabel           string  `json:"levelLabel"`
	FeedbackQualityRatio float64 `json:"feedbackQualityRatio"`
}

// MindScoreInput 计算心智值所需的 Agent 快照。
type MindScoreInput struct {
	Profile      *models.LifeAgentProfile
	Entries      []models.LifeAgentKnowledgeEntry
	Facts        []models.LifeAgentStructuredFact
	Topics       []models.LifeAgentTopicSummary
	HasVoice     bool
	SessionCount int64
	Helpful      int64
	NotSpecific  int64
	NotSuitable  int64
	FactualError int64
	Contradict   int64
	TooConfident int64
	BlindSpots   int64
}

func powGrowth(n int, weight float64, alpha float64) int {
	if n <= 0 {
		return 0
	}
	return int(math.Round(weight * math.Pow(float64(n), alpha)))
}

func satGrowth(n int, maxScore float64, k float64) int {
	if n <= 0 {
		return 0
	}
	return int(math.Round(maxScore * (1 - math.Exp(-k*float64(n)))))
}

func bayesianQuality(positive, total int64) float64 {
	const alpha = 3.0
	const beta = 3.0
	if total <= 0 {
		return (alpha) / (alpha + beta)
	}
	return (float64(positive) + alpha) / (float64(total) + alpha + beta)
}

func countExperiences(entries []models.LifeAgentKnowledgeEntry) int {
	n := 0
	for _, e := range entries {
		if len(strings.TrimSpace(e.Content)) >= 30 {
			n++
		}
	}
	return n
}

func countRelationships(entries []models.LifeAgentKnowledgeEntry, facts []models.LifeAgentStructuredFact) int {
	seen := map[string]struct{}{}
	for _, f := range facts {
		key := strings.ToLower(strings.TrimSpace(f.FactKey))
		if strings.Contains(key, "person") || strings.Contains(key, "relationship") ||
			strings.Contains(key, "friend") || strings.Contains(key, "relation") ||
			strings.Contains(key, "人物") || strings.Contains(key, "关系") {
			val := strings.TrimSpace(f.FactValue)
			if val != "" {
				seen[val] = struct{}{}
			}
		}
	}
	for _, e := range entries {
		cat := strings.ToLower(strings.TrimSpace(e.Category))
		if strings.Contains(cat, "关系") || strings.Contains(cat, "人物") || strings.Contains(cat, "朋友") {
			title := strings.TrimSpace(e.Title)
			if title != "" {
				seen[title] = struct{}{}
			}
		}
	}
	return len(seen)
}

func countOpinions(entries []models.LifeAgentKnowledgeEntry, facts []models.LifeAgentStructuredFact) int {
	n := 0
	for _, f := range facts {
		ft := strings.ToLower(strings.TrimSpace(f.FactType))
		if strings.Contains(ft, "preference") || strings.Contains(ft, "opinion") || strings.Contains(ft, "judgment") {
			n++
		}
	}
	for _, e := range entries {
		cat := strings.ToLower(strings.TrimSpace(e.Category))
		if strings.Contains(cat, "观点") || strings.Contains(cat, "判断") || strings.Contains(cat, "偏好") {
			n++
		}
	}
	return n
}

func countStyleSamples(p *models.LifeAgentProfile, hasVoice bool) int {
	n := len(p.ExampleReplies)
	if hasVoice {
		n++
	}
	if len(p.ForbiddenPhrases) > 0 {
		n += len(p.ForbiddenPhrases) / 2
		if n == len(p.ExampleReplies) {
			n++
		}
	}
	if ts := strings.TrimSpace(ptrStrVal(p.ToneStyle)); ts != "" {
		n++
	}
	if ps := strings.TrimSpace(ptrStrVal(p.PersonaArchetype)); ps != "" {
		n++
	}
	return n
}

func ptrStrVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func computeFoundation(p *models.LifeAgentProfile, hasVoice bool) int {
	score := 0
	if strings.TrimSpace(p.DisplayName) != "" {
		score += 15
	}
	if strings.TrimSpace(p.Headline) != "" {
		score += 30
	}
	if strings.TrimSpace(p.WelcomeMessage) != "" {
		score += 30
	}
	if len(p.ExpertiseTags) >= 3 {
		score += 30
	}
	if len(p.ExampleReplies) >= 2 {
		score += 40
	}
	if strings.TrimSpace(ptrStrVal(p.NotSuitableFor)) != "" {
		score += 30
	}
	if hasVoice {
		score += 20
	}
	if strings.TrimSpace(ptrStrVal(p.CoverImageURL)) != "" || strings.TrimSpace(ptrStrVal(p.CoverPresetKey)) != "" {
		score += 5
	}
	if score > 200 {
		return 200
	}
	return score
}

func topicEvidenceCount(t models.LifeAgentTopicSummary, entries []models.LifeAgentKnowledgeEntry) int {
	if len(t.SourceEntryIDs) > 0 {
		return len(t.SourceEntryIDs)
	}
	n := 0
	label := strings.ToLower(strings.TrimSpace(t.TopicLabel))
	for _, e := range entries {
		if strings.Contains(strings.ToLower(e.Content), label) ||
			strings.Contains(strings.ToLower(e.Title), label) {
			n++
		}
	}
	if n == 0 && len(strings.TrimSpace(t.Summary)) >= 20 {
		n = 1
	}
	return n
}

func uniqueTopicCount(p *models.LifeAgentProfile, topics []models.LifeAgentTopicSummary) int {
	seen := map[string]struct{}{}
	for _, t := range topics {
		if strings.TrimSpace(t.TopicLabel) != "" {
			seen[strings.ToLower(strings.TrimSpace(t.TopicLabel))] = struct{}{}
		}
	}
	for _, tag := range p.ExpertiseTags {
		if strings.TrimSpace(tag) != "" {
			seen[strings.ToLower(strings.TrimSpace(tag))] = struct{}{}
		}
	}
	return len(seen)
}

func mindScoreLevel(total int) (int, string) {
	thresholds := []struct {
		min   int
		level int
		label string
	}{
		{7300, 10, "持续成长中"},
		{5200, 9, "高拟真分身"},
		{3600, 8, "有完整人生脉络"},
		{2400, 7, "像熟人一样回答"},
		{1500, 6, "能举你的例子"},
		{900, 5, "有稳定口吻"},
		{500, 4, "越来越像你"},
		{250, 3, "能回答常见问题"},
		{100, 2, "有基本资料"},
		{0, 1, "刚认识你"},
	}
	for _, t := range thresholds {
		if total >= t.min {
			return t.level, t.label
		}
	}
	return 1, "刚认识你"
}

// ComputeMindScore 计算 Agent 心智值（无上限）。
func ComputeMindScore(in MindScoreInput) MindScoreBreakdown {
	p := in.Profile
	if p == nil {
		return MindScoreBreakdown{Level: 1, LevelLabel: "刚认识你"}
	}

	foundation := computeFoundation(p, in.HasVoice)
	topicCount := uniqueTopicCount(p, in.Topics)
	topicCoverage := powGrowth(topicCount, 100, 0.65)

	topicDepth := 0
	for _, t := range in.Topics {
		evidence := topicEvidenceCount(t, in.Entries)
		topicDepth += satGrowth(evidence, 300, 0.10)
	}

	experience := powGrowth(countExperiences(in.Entries), 40, 0.65)
	relationship := powGrowth(countRelationships(in.Entries, in.Facts), 40, 0.65)
	opinion := powGrowth(countOpinions(in.Entries, in.Facts), 35, 0.65)
	style := powGrowth(countStyleSamples(p, in.HasVoice), 30, 0.65)

	totalFeedback := in.Helpful + in.NotSpecific + in.NotSuitable + in.FactualError + in.Contradict + in.TooConfident
	quality := bayesianQuality(in.Helpful, totalFeedback)
	conversationVolume := powGrowth(int(in.SessionCount), 25, 0.60)
	conversation := int(math.Round(float64(conversationVolume) * quality))

	fixedIssues := in.Helpful / 3
	if fixedIssues < int64(in.NotSpecific/2) {
		fixedIssues = int64(in.NotSpecific / 2)
	}
	unresolved := in.FactualError + in.Contradict + in.BlindSpots
	feedbackFix := powGrowth(int(fixedIssues), 50, 0.70) - powGrowth(int(unresolved), 40, 0.50)
	if feedbackFix < 0 {
		feedbackFix = 0
	}

	total := foundation + topicCoverage + topicDepth + experience + relationship + opinion + style + conversation + feedbackFix
	level, label := mindScoreLevel(total)

	return MindScoreBreakdown{
		Foundation:           foundation,
		TopicCoverage:        topicCoverage,
		TopicDepth:           topicDepth,
		Experience:           experience,
		Relationship:         relationship,
		Opinion:              opinion,
		Style:                style,
		Conversation:         conversation,
		FeedbackFix:          feedbackFix,
		Total:                total,
		Level:                level,
		LevelLabel:           label,
		FeedbackQualityRatio: quality,
	}
}
