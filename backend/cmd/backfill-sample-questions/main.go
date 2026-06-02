// 为批量导入的 Agent 回填个性化 sample_questions。
//
// 用法:
//   go run ./cmd/backfill-sample-questions/        # dry-run
//   go run ./cmd/backfill-sample-questions/ -apply
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func loadProductionDSN() (string, error) {
	for _, path := range []string{"docker-compose.production.yml", "../docker-compose.production.yml", "../../docker-compose.production.yml"} {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		re := regexp.MustCompile(`DATABASE_URL:\s*\$\{DATABASE_URL:-([^}]+)\}`)
		m := re.FindSubmatch(data)
		if len(m) < 2 {
			continue
		}
		return string(m[1]), nil
	}
	return "", fmt.Errorf("production DATABASE_URL not found in docker-compose.production.yml")
}

func main() {
	apply := flag.Bool("apply", false, "write updates to database")
	production := flag.Bool("production", true, "use production DATABASE_URL from docker-compose.production.yml")
	limit := flag.Int("limit", 0, "max profiles to update (0 = all)")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	dsn := os.Getenv("DATABASE_URL")
	if *production {
		prodDSN, err := loadProductionDSN()
		if err != nil {
			log.Fatal(err)
		}
		dsn = prodDSN
	}
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty")
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	var profiles []models.LifeAgentProfile
	q := db.DB.Where("published = ?", true).Order("created_at ASC")
	if *limit > 0 {
		q = q.Limit(*limit)
	}
	if err := q.Find(&profiles).Error; err != nil {
		log.Fatalf("query profiles failed: %v", err)
	}

	updated := 0
	entriesByProfile := map[string][]models.LifeAgentKnowledgeEntry{}
	var allEntries []models.LifeAgentKnowledgeEntry
	if err := db.DB.Order("profile_id ASC, sort_order ASC").Find(&allEntries).Error; err != nil {
		log.Fatalf("query knowledge failed: %v", err)
	}
	for _, e := range allEntries {
		entriesByProfile[e.ProfileID] = append(entriesByProfile[e.ProfileID], e)
	}
	for _, p := range profiles {
		stored := []string(p.SampleQuestions)
		if !lifeagent.NeedsSampleQuestionRefresh(stored) {
			continue
		}
		derived := lifeagent.DeriveSampleQuestions(sampleQuestionInput(p, entriesByProfile[p.ID]))
		if len(derived) < 2 {
			continue
		}
		updated++
		preview, _ := json.Marshal(derived)
		fmt.Printf("[%s] %s\n  -> %s\n", p.ID[:8], p.DisplayName, string(preview))
		if *apply {
			if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).
				Update("sample_questions", models.JSONArray(derived)).Error; err != nil {
				log.Printf("update failed for %s: %v", p.ID, err)
			}
		}
	}
	fmt.Printf("\nprofiles needing update: %d / %d\n", updated, len(profiles))
	if !*apply {
		fmt.Println("dry-run only; pass -apply to write")
	}
}

func strVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func sampleQuestionInput(p models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) lifeagent.SampleQuestionInput {
	in := lifeagent.SampleQuestionInput{
		DisplayName:   p.DisplayName,
		Headline:      p.Headline,
		ShortBio:      p.ShortBio,
		ExpertiseTags: []string(p.ExpertiseTags),
		Job:           strVal(p.Job),
		School:        strVal(p.School),
	}
	for _, e := range entries {
		in.Knowledge = append(in.Knowledge, lifeagent.KnowledgeSnippet{
			Title: e.Title, Content: e.Content, Tags: []string(e.Tags),
		})
	}
	return in
}
