// backfill-timeline-events：为存量知识条目补 timeline 元数据并写入 life_agent_timeline_events。
//
//	go run ./cmd/backfill-timeline-events -limit 100
//	go run ./cmd/backfill-timeline-events -apply
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	apply := flag.Bool("apply", false, "写入 timeline_status / facet_tags / timeline_events")
	force := flag.Bool("force", false, "已有 timeline 事件也重新处理")
	limit := flag.Int("limit", 0, "最多处理多少条（0=不限）")
	profileID := flag.String("profile-id", "", "只处理某个 profile")
	databaseURL := flag.String("database-url", "", "数据库连接串")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	dsn := strings.TrimSpace(*databaseURL)
	if dsn == "" {
		dsn = strings.TrimSpace(os.Getenv("DATABASE_URL"))
	}
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty")
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	if *apply {
		if err := db.DB.AutoMigrate(&models.LifeAgentKnowledgeEntry{}, &models.LifeAgentTimelineEvent{}); err != nil {
			log.Fatalf("migrate failed: %v", err)
		}
	}

	entries, err := loadEntries(*profileID, *limit, *force)
	if err != nil {
		log.Fatalf("query entries failed: %v", err)
	}
	if len(entries) == 0 {
		fmt.Println("no knowledge entries to backfill")
		return
	}

	tracked, written, skipped, failed := 0, 0, 0, 0
	for i, e := range entries {
		fmt.Printf("[%d/%d] %s\n", i+1, len(entries), e.Title)
		facets := lifeagent.ParseKnowledgeFacetTags(e.FacetTags)
		if len(facets.Subjects) == 0 && len(facets.Aspects) == 0 {
			facets = lifeagent.InferKnowledgeFacetTags(e.Title, e.Category, e.Content, []string(e.Tags))
		}
		facets = lifeagent.NormalizeKnowledgeFacetTags(facets)
		analysis := lifeagent.AnalyzeKnowledgeTimeline(e.Title, e.Category, e.Content, facets, &e.CreatedAt)
		if !analysis.ShouldTrack {
			skipped++
			continue
		}
		tracked++
		if !*apply {
			fmt.Printf("  would track: period=%s status=%s type=%s\n", analysis.PeriodLabel, analysis.Status, analysis.EventType)
			continue
		}
		updates := map[string]interface{}{
			"facet_tags":      models.JSONMap(lifeagent.KnowledgeFacetTagsToMap(facets)),
			"timeline_status": analysis.Status,
			"timeline_meta":   timelineMetaMap(analysis),
		}
		if strings.TrimSpace(e.SourceType) == "" {
			updates["source_type"] = "backfill"
		}
		if err := db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("id = ?", e.ID).Updates(updates).Error; err != nil {
			log.Printf("update entry failed %s: %v", e.ID, err)
			failed++
			continue
		}
		entryJSON, _ := json.Marshal(e.ID)
		if *force {
			_ = db.DB.Where("profile_id = ? AND JSON_CONTAINS(source_entry_ids, ?)", e.ProfileID, string(entryJSON)).
				Delete(&models.LifeAgentTimelineEvent{}).Error
		} else {
			var existing int64
			_ = db.DB.Model(&models.LifeAgentTimelineEvent{}).
				Where("profile_id = ? AND JSON_CONTAINS(source_entry_ids, ?)", e.ProfileID, string(entryJSON)).
				Count(&existing).Error
			if existing > 0 {
				skipped++
				continue
			}
		}
		event := models.LifeAgentTimelineEvent{
			ID:                models.GenID(),
			ProfileID:         e.ProfileID,
			PeriodLabel:       analysis.PeriodLabel,
			PeriodGranularity: analysis.PeriodGranularity,
			SequenceOrder:     analysis.SequenceOrder,
			EventType:         analysis.EventType,
			Title:             analysis.Title,
			Summary:           analysis.Summary,
			Causes:            models.JSONArray(analysis.Causes),
			Outcomes:          models.JSONArray(analysis.Outcomes),
			Tradeoffs:         models.JSONArray(analysis.Tradeoffs),
			SourceEntryIDs:    models.JSONArray([]string{e.ID}),
			Confidence:        analysis.Confidence,
			Status:            analysis.Status,
			MissingFields:     models.JSONArray(analysis.MissingFields),
		}
		if q := strings.TrimSpace(analysis.ClarificationQuestion); q != "" {
			event.ClarificationQuestion = &q
		}
		if err := db.DB.Create(&event).Error; err != nil {
			log.Printf("create timeline event failed %s: %v", e.ID, err)
			failed++
			continue
		}
		written++
	}

	fmt.Printf("entries=%d tracked=%d written=%d skipped=%d failed=%d\n", len(entries), tracked, written, skipped, failed)
	if !*apply {
		fmt.Println("dry-run only; pass -apply to write")
	}
}

func loadEntries(profileID string, limit int, force bool) ([]models.LifeAgentKnowledgeEntry, error) {
	var entries []models.LifeAgentKnowledgeEntry
	q := db.DB.Order("profile_id ASC, sort_order ASC, created_at ASC")
	if strings.TrimSpace(profileID) != "" {
		q = q.Where("profile_id = ?", strings.TrimSpace(profileID))
	}
	if !force {
		q = q.Where("timeline_status IS NULL OR timeline_status IN ('', 'not_timeline')")
	}
	if limit > 0 {
		q = q.Limit(limit)
	}
	return entries, q.Find(&entries).Error
}

func timelineMetaMap(a lifeagent.TimelineAnalysis) models.JSONMap {
	b, _ := json.Marshal(map[string]interface{}{
		"shouldTrack":           a.ShouldTrack,
		"status":                a.Status,
		"periodLabel":           a.PeriodLabel,
		"periodGranularity":     a.PeriodGranularity,
		"sequenceOrder":         a.SequenceOrder,
		"eventType":             a.EventType,
		"missingFields":         a.MissingFields,
		"clarificationQuestion": a.ClarificationQuestion,
		"confidence":            a.Confidence,
	})
	var out models.JSONMap
	_ = json.Unmarshal(b, &out)
	return out
}
