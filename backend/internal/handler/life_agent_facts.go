package handler

import (
	"encoding/json"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
)

func refreshLifeAgentStructuredFacts(profileID string) {
	if profileID == "" {
		return
	}
	var profile models.LifeAgentProfile
	if err := db.DB.Where("id = ?", profileID).First(&profile).Error; err != nil {
		return
	}
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries)
	facts := lifeagent.BuildStructuredFactsFromProfileModel(profile, entries)
	db.DB.Where("profile_id = ?", profileID).Delete(&models.LifeAgentStructuredFact{})
	for _, fact := range facts {
		db.DB.Create(&fact)
	}
}

func refreshLifeAgentTopicSummaries(profileID string) {
	if profileID == "" {
		return
	}
	var profile models.LifeAgentProfile
	if err := db.DB.Where("id = ?", profileID).First(&profile).Error; err != nil {
		return
	}
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries)
	generated := lifeagent.BuildTopicSummariesFromProfileModel(profile, entries)
	var existing []models.LifeAgentTopicSummary
	db.DB.Where("profile_id = ?", profileID).Find(&existing)
	existingByKey := make(map[string]models.LifeAgentTopicSummary, len(existing))
	for _, topic := range existing {
		if strings.TrimSpace(topic.TopicKey) != "" {
			existingByKey[topic.TopicKey] = topic
		}
	}
	seenKeys := map[string]bool{}
	for _, generatedTopic := range generated {
		seenKeys[generatedTopic.TopicKey] = true
		if current, ok := existingByKey[generatedTopic.TopicKey]; ok {
			current.TopicGroup = generatedTopic.TopicGroup
			current.TopicKey = generatedTopic.TopicKey
			current.Source = "knowledge"
			current.Confidence = generatedTopic.Confidence
			current.SourceEntryIDs = lifeagent.MergeJSONArrayStrings(current.SourceEntryIDs, generatedTopic.SourceEntryIDs, 0)
			if !current.ManualEdited {
				current.TopicLabel = generatedTopic.TopicLabel
				current.Summary = generatedTopic.Summary
				current.Aliases = generatedTopic.Aliases
				current.QuestionPatterns = generatedTopic.QuestionPatterns
			} else {
				current.Aliases = lifeagent.MergeJSONArrayStrings(current.Aliases, generatedTopic.Aliases, 8)
				current.QuestionPatterns = lifeagent.MergeJSONArrayStrings(current.QuestionPatterns, generatedTopic.QuestionPatterns, 8)
			}
			if current.Status == "" || current.Status == "candidate" {
				current.Status = "active"
			}
			if current.MergedIntoTopicID != nil && current.Status != "archived" {
				current.MergedIntoTopicID = nil
			}
			db.DB.Save(&current)
			continue
		}
		db.DB.Create(&generatedTopic)
	}
	for _, topic := range existing {
		if topic.Source != "knowledge" || seenKeys[topic.TopicKey] || topic.Status == "archived" {
			continue
		}
		db.DB.Model(&topic).Updates(map[string]interface{}{
			"status": "archived",
		})
	}
}

func upsertTopicCandidatesFromConversationMemory(profileID, sessionID string, memory lifeagent.ConversationMemory) {
	if profileID == "" || sessionID == "" || len(memory.ConversationTopics) == 0 {
		return
	}
	candidates := lifeagent.BuildTopicCandidatesFromConversationMemory(profileID, sessionID, memory)
	if len(candidates) == 0 {
		return
	}
	var existing []models.LifeAgentTopicSummary
	db.DB.Where("profile_id = ? AND status IN ?", profileID, []string{"candidate", "active"}).Find(&existing)
	for _, candidate := range candidates {
		if matched, ok := matchExistingTopicCandidate(candidate, existing); ok {
			matched.Aliases = lifeagent.MergeJSONArrayStrings(matched.Aliases, candidate.Aliases, 8)
			matched.QuestionPatterns = lifeagent.MergeJSONArrayStrings(matched.QuestionPatterns, candidate.QuestionPatterns, 8)
			matched.SourceEntryIDs = lifeagent.MergeJSONArrayStrings(matched.SourceEntryIDs, candidate.SourceEntryIDs, 0)
			if matched.Source == "memory" && !matched.ManualEdited {
				matched.Summary = mergeTopicSummaries(matched.Summary, candidate.Summary)
			}
			db.DB.Save(&matched)
			continue
		}
		db.DB.Create(&candidate)
		existing = append(existing, candidate)
	}
}

func matchExistingTopicCandidate(candidate models.LifeAgentTopicSummary, existing []models.LifeAgentTopicSummary) (models.LifeAgentTopicSummary, bool) {
	bestScore := 0
	var best models.LifeAgentTopicSummary
	for _, current := range existing {
		score := topicSimilarityScore(candidate, current)
		if score > bestScore {
			bestScore = score
			best = current
		}
	}
	return best, bestScore >= 8
}

func topicSimilarityScore(left, right models.LifeAgentTopicSummary) int {
	if strings.TrimSpace(left.TopicKey) != "" && left.TopicKey == right.TopicKey {
		return 12
	}
	score := 0
	leftLabel := normalizeTopicText(left.TopicLabel)
	rightLabel := normalizeTopicText(right.TopicLabel)
	if leftLabel != "" && rightLabel != "" {
		if leftLabel == rightLabel {
			score += 9
		} else if strings.Contains(leftLabel, rightLabel) || strings.Contains(rightLabel, leftLabel) {
			score += 6
		}
	}
	for _, alias := range append([]string{left.TopicLabel}, left.Aliases...) {
		aliasNorm := normalizeTopicText(alias)
		if aliasNorm == "" {
			continue
		}
		if aliasNorm == rightLabel {
			score += 4
			break
		}
	}
	if left.TopicGroup != "" && left.TopicGroup == right.TopicGroup {
		score += 1
	}
	return score
}

func normalizeTopicText(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	value = strings.ReplaceAll(value, "_", "")
	value = strings.ReplaceAll(value, "-", "")
	value = strings.ReplaceAll(value, " ", "")
	return value
}

func mergeTopicSummaries(current, incoming string) string {
	current = strings.TrimSpace(current)
	incoming = strings.TrimSpace(incoming)
	switch {
	case current == "":
		return incoming
	case incoming == "" || strings.Contains(current, incoming):
		return current
	default:
		return current + "\n" + incoming
	}
}

func conversationMemoryJSON(memory lifeagent.ConversationMemory) models.JSONMap {
	raw, err := json.Marshal(memory)
	if err != nil {
		return nil
	}
	var out models.JSONMap
	if err := json.Unmarshal(raw, &out); err != nil {
		return nil
	}
	return out
}
