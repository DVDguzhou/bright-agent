package lifeagent

import (
	"regexp"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
)

type FactCandidate struct {
	FactKey    string            `json:"factKey"`
	FactValue  string            `json:"factValue"`
	FactType   string            `json:"factType,omitempty"`
	Source     string            `json:"source,omitempty"`
	Confidence string            `json:"confidence,omitempty"`
	Status     string            `json:"status,omitempty"`
	Evidence   map[string]string `json:"evidence,omitempty"`
}

type StructuredFactForAI struct {
	ID              string
	FactKey         string
	FactValue       string
	FactType        string
	Source          string
	Confidence      string
	Status          string
	Evidence        map[string]string
	LastConfirmedAt *time.Time
}

var (
	eventFactPatterns = []*regexp.Regexp{
		regexp.MustCompile(`参加([^，。]+?(?:大赛|比赛|活动))`),
		regexp.MustCompile(`在([^，。]+?(?:公司|学校|大学|学院))`),
	}
)

func BuildStructuredFactsFromProfileSummary(out *ProfileSummaryOutput) []FactCandidate {
	if out == nil {
		return nil
	}
	candidates := buildProfileFactCandidates(map[string]string{
		"display_name":    out.Profile.DisplayName,
		"headline":        out.Profile.Headline,
		"short_bio":       out.Profile.ShortBio,
		"school":          out.Profile.School,
		"education":       out.Profile.Education,
		"job":             out.Profile.Job,
		"income":          out.Profile.Income,
		"audience":        out.Profile.Audience,
		"welcome_message": out.Profile.WelcomeMessage,
	})
	for _, entry := range out.KnowledgeEntries {
		candidates = append(candidates, ExtractStructuredFactsFromText(entry.Content, "knowledge_entry")...)
	}
	return dedupeFactCandidates(candidates)
}

func BuildStructuredFactsFromCreateQuestionOutput(out *CreateQuestionOutput) []FactCandidate {
	if out == nil {
		return nil
	}
	var candidates []FactCandidate
	for _, entry := range out.KnowledgeAdd {
		candidates = append(candidates, ExtractStructuredFactsFromText(entry.Content, "knowledge_add")...)
	}
	return dedupeFactCandidates(candidates)
}

func ExtractStructuredFactsFromText(content, source string) []FactCandidate {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}
	var out []FactCandidate
	for _, re := range eventFactPatterns {
		matches := re.FindAllStringSubmatch(content, -1)
		for _, match := range matches {
			if len(match) < 2 {
				continue
			}
			value := strings.TrimSpace(match[1])
			if value == "" {
				continue
			}
			out = append(out, FactCandidate{
				FactKey:    "event_name",
				FactValue:  value,
				FactType:   "narrative_fact",
				Source:     source,
				Confidence: "medium",
				Status:     "pending_review",
				Evidence:   map[string]string{"excerpt": TruncateToRunes(content, 120)},
			})
		}
	}
	return dedupeFactCandidates(out)
}

func BuildStructuredFactsFromProfileModel(profile models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) []models.LifeAgentStructuredFact {
	candidates := buildProfileFactCandidates(map[string]string{
		"display_name":      profile.DisplayName,
		"headline":          profile.Headline,
		"short_bio":         profile.ShortBio,
		"school":            ptrString(profile.School),
		"education":         ptrString(profile.Education),
		"job":               ptrString(profile.Job),
		"income":            ptrString(profile.Income),
		"country":           ptrString(profile.Country),
		"province":          ptrString(profile.Province),
		"city":              ptrString(profile.City),
		"county":            ptrString(profile.County),
		"audience":          profile.Audience,
		"welcome_message":   profile.WelcomeMessage,
		"persona_archetype": ptrString(profile.PersonaArchetype),
		"tone_style":        ptrString(profile.ToneStyle),
		"response_style":    ptrString(profile.ResponseStyle),
		"mbti":              ptrString(profile.MBTI),
	})
	for _, entry := range entries {
		candidates = append(candidates, ExtractStructuredFactsFromText(entry.Content, "knowledge_entry")...)
	}
	now := time.Now()
	facts := make([]models.LifeAgentStructuredFact, 0, len(candidates))
	for _, item := range dedupeFactCandidates(candidates) {
		fact := models.LifeAgentStructuredFact{
			ID:         models.GenID(),
			ProfileID:  profile.ID,
			FactKey:    item.FactKey,
			FactValue:  item.FactValue,
			FactType:   firstNonEmptyFact(item.FactType, "hard_fact"),
			Source:     firstNonEmptyFact(item.Source, "profile"),
			Confidence: firstNonEmptyFact(item.Confidence, "high"),
			Status:     firstNonEmptyFact(item.Status, "confirmed"),
		}
		if len(item.Evidence) > 0 {
			fact.Evidence = models.JSONMap{}
			for k, v := range item.Evidence {
				fact.Evidence[k] = v
			}
		}
		if fact.Status == "confirmed" {
			fact.LastConfirmedAt = &now
		}
		facts = append(facts, fact)
	}
	return facts
}

func buildProfileFactCandidates(values map[string]string) []FactCandidate {
	out := make([]FactCandidate, 0, len(values))
	for key, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		out = append(out, FactCandidate{
			FactKey:    key,
			FactValue:  value,
			FactType:   "hard_fact",
			Source:     "profile",
			Confidence: "high",
			Status:     "confirmed",
			Evidence:   map[string]string{"field": key},
		})
	}
	return out
}

func BuildStructuredFactsForAI(facts []models.LifeAgentStructuredFact) []StructuredFactForAI {
	out := make([]StructuredFactForAI, 0, len(facts))
	for _, fact := range facts {
		item := StructuredFactForAI{
			ID:              fact.ID,
			FactKey:         fact.FactKey,
			FactValue:       fact.FactValue,
			FactType:        fact.FactType,
			Source:          fact.Source,
			Confidence:      fact.Confidence,
			Status:          fact.Status,
			LastConfirmedAt: fact.LastConfirmedAt,
		}
		if len(fact.Evidence) > 0 {
			item.Evidence = mapStringInterfaceToStringMap(fact.Evidence)
		}
		out = append(out, item)
	}
	return out
}

func dedupeFactCandidates(items []FactCandidate) []FactCandidate {
	seen := map[string]bool{}
	out := make([]FactCandidate, 0, len(items))
	for _, item := range items {
		key := strings.TrimSpace(item.FactKey)
		value := strings.TrimSpace(item.FactValue)
		if key == "" || value == "" {
			continue
		}
		cacheKey := key + "::" + value
		if seen[cacheKey] {
			continue
		}
		seen[cacheKey] = true
		item.FactKey = key
		item.FactValue = value
		out = append(out, item)
	}
	return out
}

func mapStringInterfaceToStringMap(value models.JSONMap) map[string]string {
	out := make(map[string]string, len(value))
	for k, v := range value {
		s, ok := v.(string)
		if ok && strings.TrimSpace(s) != "" {
			out[k] = s
		}
	}
	return out
}

func ptrString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func firstNonEmptyFact(values ...string) string {
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			return value
		}
	}
	return ""
}
