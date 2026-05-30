// 为缺少性格配置的 Agent 批量写入 persona_archetype / tone_style 等字段。
//
// 用法:
//   go run ./cmd/backfill-agent-personas/        # dry-run
//   go run ./cmd/backfill-agent-personas/ -apply
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
	for _, p := range profiles {
		if !lifeagent.NeedsPersonaPreset(
			ptrStr(p.PersonaArchetype),
			ptrStr(p.ToneStyle),
			ptrStr(p.ResponseStyle),
			ptrStr(p.MBTI),
			[]string(p.ExampleReplies),
		) {
			continue
		}
		preset := lifeagent.PersonaPresetForID(p.ID)
		updated++
		preview, _ := json.Marshal(map[string]any{
			"personaArchetype": preset.PersonaArchetype,
			"toneStyle":        preset.ToneStyle,
			"responseStyle":    preset.ResponseStyle,
			"mbti":             preset.MBTI,
		})
		fmt.Printf("[%s] %s -> %s\n", p.ID[:8], p.DisplayName, string(preview))
		if !*apply {
			continue
		}
		upd := map[string]any{
			"persona_archetype": preset.PersonaArchetype,
			"tone_style":        preset.ToneStyle,
			"response_style":    preset.ResponseStyle,
			"mbti":              preset.MBTI,
			"example_replies":   models.JSONArray(preset.ExampleReplies),
			"forbidden_phrases": models.JSONArray(preset.ForbiddenPhrases),
		}
		if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).Updates(upd).Error; err != nil {
			log.Printf("update failed for %s: %v", p.ID, err)
		}
	}
	fmt.Printf("\nprofiles needing persona: %d / %d\n", updated, len(profiles))
	if !*apply {
		fmt.Println("dry-run only; pass -apply to write")
	}
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
