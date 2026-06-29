package yantuseed

import (
	"fmt"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
)

// FinalizeZhangXuefengProfile syncs chunks, timeline events, and structured facts after UpsertProfile.
func FinalizeZhangXuefengProfile(profileID string, p Profile) error {
	if profileID == "" {
		return fmt.Errorf("empty profile id")
	}
	var entries []models.LifeAgentKnowledgeEntry
	if err := db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries).Error; err != nil {
		return err
	}
	entryIDsByTitle := make(map[string]string, len(entries))
	for _, entry := range entries {
		entryIDsByTitle[entry.Title] = entry.ID
		if err := lifeagent.SyncKnowledgeEntryChunks(db.DB, entry); err != nil {
			return fmt.Errorf("sync chunks for %q: %w", entry.Title, err)
		}
	}
	if err := db.DB.Where("profile_id = ?", profileID).Delete(&models.LifeAgentTimelineEvent{}).Error; err != nil {
		return err
	}
	for _, seed := range p.TimelineSeeds {
		sourceIDs := []string{}
		if id := entryIDsByTitle[seed.SourceTitle]; id != "" {
			sourceIDs = append(sourceIDs, id)
		}
		granularity := seed.PeriodGranularity
		if granularity == "" {
			granularity = "year"
		}
		eventType := seed.EventType
		if eventType == "" {
			eventType = "experience"
		}
		event := models.LifeAgentTimelineEvent{
			ID:                models.GenID(),
			ProfileID:         profileID,
			PeriodLabel:       seed.PeriodLabel,
			PeriodGranularity: granularity,
			SequenceOrder:     seed.SequenceOrder,
			EventType:         eventType,
			Title:             seed.Title,
			Summary:           seed.Summary,
			SourceEntryIDs:    models.JSONArray(sourceIDs),
			Confidence:        "high",
			Status:            "confirmed",
		}
		if err := db.DB.Create(&event).Error; err != nil {
			return fmt.Errorf("create timeline %q: %w", seed.Title, err)
		}
	}
	var profile models.LifeAgentProfile
	if err := db.DB.Where("id = ?", profileID).First(&profile).Error; err != nil {
		return err
	}
	facts := lifeagent.BuildStructuredFactsFromProfileModel(profile, entries)
	if err := db.DB.Where("profile_id = ?", profileID).Delete(&models.LifeAgentStructuredFact{}).Error; err != nil {
		return err
	}
	for _, fact := range facts {
		if err := db.DB.Create(&fact).Error; err != nil {
			return err
		}
	}
	fmt.Printf("finalized %q: %d knowledge entries, %d timeline nodes\n", p.DisplayName, len(entries), len(p.TimelineSeeds))
	return nil
}
