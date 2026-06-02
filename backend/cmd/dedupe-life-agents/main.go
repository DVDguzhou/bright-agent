// 去重人生 Agent：删除知识库内容完全相同的重复档案，并回填个性化 sample_questions。
//
// 用法（backend 目录）:
//
//	go run ./cmd/dedupe-life-agents/              # dry-run
//	go run ./cmd/dedupe-life-agents/ -apply       # 写入数据库
//	go run ./cmd/dedupe-life-agents/ -apply -skip-dedupe   # 仅刷新示例问题
//	go run ./cmd/dedupe-life-agents/ -apply -skip-questions # 仅去重 Agent
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
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

type profileMeta struct {
	Profile        models.LifeAgentProfile
	KnowledgeCount int
	SessionCount   int64
	PackCount      int64
	Fingerprint    string
}

func normalizeKnowledge(s string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(s)), " ")
}

func knowledgeFingerprint(entries []models.LifeAgentKnowledgeEntry) string {
	if len(entries) == 0 {
		return ""
	}
	contents := make([]string, len(entries))
	for i, e := range entries {
		contents[i] = normalizeKnowledge(e.Content)
	}
	sort.Strings(contents)
	sum := sha256.Sum256([]byte(strings.Join(contents, "\x1f")))
	return hex.EncodeToString(sum[:])
}

func keepScore(m profileMeta) int {
	score := 0
	if m.Profile.Published {
		score += 10
	}
	score += m.KnowledgeCount
	score += int(m.SessionCount) * 100
	score += int(m.PackCount) * 500
	if m.Profile.OriginalAuthor != nil && strings.TrimSpace(*m.Profile.OriginalAuthor) != "" {
		score += 5
	}
	return score
}

func main() {
	apply := flag.Bool("apply", false, "write updates to database")
	production := flag.Bool("production", true, "use production DATABASE_URL from docker-compose.production.yml")
	skipDedupe := flag.Bool("skip-dedupe", false, "skip duplicate agent removal")
	skipQuestions := flag.Bool("skip-questions", false, "skip sample_questions refresh")
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
	if err := db.DB.Order("created_at ASC").Find(&profiles).Error; err != nil {
		log.Fatalf("query profiles failed: %v", err)
	}

	entriesByProfile := map[string][]models.LifeAgentKnowledgeEntry{}
	var allEntries []models.LifeAgentKnowledgeEntry
	if err := db.DB.Order("profile_id, sort_order").Find(&allEntries).Error; err != nil {
		log.Fatalf("query knowledge failed: %v", err)
	}
	for _, e := range allEntries {
		entriesByProfile[e.ProfileID] = append(entriesByProfile[e.ProfileID], e)
	}

	sessions := map[string]int64{}
	packs := map[string]int64{}
	var sessRows []struct {
		ProfileID string
		Cnt       int64
	}
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_chat_sessions GROUP BY profile_id").Scan(&sessRows)
	for _, r := range sessRows {
		sessions[r.ProfileID] = r.Cnt
	}
	var packRows []struct {
		ProfileID string
		Cnt       int64
	}
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_question_packs GROUP BY profile_id").Scan(&packRows)
	for _, r := range packRows {
		packs[r.ProfileID] = r.Cnt
	}

	metas := make([]profileMeta, 0, len(profiles))
	for _, p := range profiles {
		entries := entriesByProfile[p.ID]
		fp := knowledgeFingerprint(entries)
		if fp == "" {
			continue
		}
		metas = append(metas, profileMeta{
			Profile:        p,
			KnowledgeCount: len(entries),
			SessionCount:   sessions[p.ID],
			PackCount:      packs[p.ID],
			Fingerprint:    fp,
		})
	}

	deleted := 0
	if !*skipDedupe {
		groups := map[string][]profileMeta{}
		for _, m := range metas {
			groups[m.Fingerprint] = append(groups[m.Fingerprint], m)
		}
		for fp, group := range groups {
			if len(group) < 2 {
				continue
			}
			sort.Slice(group, func(i, j int) bool {
				si, sj := keepScore(group[i]), keepScore(group[j])
				if si != sj {
					return si > sj
				}
				return group[i].Profile.CreatedAt.Before(group[j].Profile.CreatedAt)
			})
			keeper := group[0]
			fmt.Printf("\n[knowledge dup] fingerprint=%s… keep=%q (%s) score=%d\n",
				fp[:12], keeper.Profile.DisplayName, keeper.Profile.ID[:8], keepScore(keeper))
			for _, dup := range group[1:] {
				if dup.SessionCount > 0 || dup.PackCount > 0 {
					fmt.Printf("  skip delete %q (%s): has activity sessions=%d packs=%d\n",
						dup.Profile.DisplayName, dup.Profile.ID[:8], dup.SessionCount, dup.PackCount)
					continue
				}
				fmt.Printf("  delete %q (%s)\n", dup.Profile.DisplayName, dup.Profile.ID[:8])
				deleted++
				if *apply {
					if err := yantuseed.DeleteLifeAgentProfileCascade(db.DB, dup.Profile.ID); err != nil {
						log.Printf("delete failed %s: %v", dup.Profile.ID, err)
					}
				}
			}
		}
		fmt.Printf("\nDuplicate agents to remove: %d\n", deleted)
	}

	refreshed := 0
	if !*skipQuestions {
		// Re-load profiles after dedupe in apply mode
		if *apply && deleted > 0 {
			profiles = nil
			if err := db.DB.Order("created_at ASC").Find(&profiles).Error; err != nil {
				log.Fatalf("re-query profiles failed: %v", err)
			}
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
			refreshed++
			preview, _ := json.Marshal(derived)
			fmt.Printf("[questions] %s %q\n  -> %s\n", p.ID[:8], p.DisplayName, string(preview))
			if *apply {
				if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).
					Update("sample_questions", models.JSONArray(derived)).Error; err != nil {
					log.Printf("update sample_questions failed for %s: %v", p.ID, err)
				}
			}
		}
		fmt.Printf("\nSample questions to refresh: %d / %d\n", refreshed, len(profiles))
	}

	if !*apply {
		fmt.Println("\ndry-run only; pass -apply to write")
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
