// generate-sample-questions：基于 Life Agent 知识库批量生成更自然的展示示例问题。
//
// 用法（在 backend 目录执行）：
//
//	go run ./cmd/generate-sample-questions -limit 20
//	go run ./cmd/generate-sample-questions -profile-id <id>
//	go run ./cmd/generate-sample-questions -force -limit 50
//	go run ./cmd/generate-sample-questions -database-url "$DATABASE_URL" -limit 20
//	go run ./cmd/generate-sample-questions -apply -force
package main

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

type reportRecord struct {
	ProfileID       string                                    `json:"profileId"`
	DisplayName     string                                    `json:"displayName"`
	Status          string                                    `json:"status"`
	OldQuestions    []string                                  `json:"oldQuestions"`
	NewQuestions    []string                                  `json:"newQuestions"`
	Rejected        []lifeagent.SampleQuestionValidationIssue `json:"rejected,omitempty"`
	Error           string                                    `json:"error,omitempty"`
	KnowledgeTitles []string                                  `json:"knowledgeTitles,omitempty"`
	Raw             string                                    `json:"raw,omitempty"`
}

func main() {
	apply := flag.Bool("apply", false, "写入数据库（默认 dry-run，只生成报告）")
	limit := flag.Int("limit", 0, "最多处理多少个 Agent（0=不限）")
	profileID := flag.String("profile-id", "", "只处理某个 profile id")
	force := flag.Bool("force", false, "即使已有非通用示例问题也重新生成")
	includeFeatured := flag.Bool("include-featured", false, "dry-run 审计时包含精选 Agent；-apply 会拒绝写入精选 Agent")
	minQuestions := flag.Int("min-questions", 3, "至少生成多少条合格问题才允许写入")
	outPath := flag.String("out", "", "报告输出路径（默认 sample_questions_report-时间戳.jsonl）")
	databaseURL := flag.String("database-url", "", "数据库连接串；为空时读取 DATABASE_URL")
	flag.Parse()

	if *apply && *includeFeatured {
		log.Fatal("refusing to write featured agents; run without -include-featured for apply")
	}

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	dsn := strings.TrimSpace(*databaseURL)
	if dsn == "" {
		dsn = strings.TrimSpace(os.Getenv("DATABASE_URL"))
	}
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty; set it explicitly before running this batch command")
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	cfg := config.Load()
	if cfg == nil || strings.TrimSpace(cfg.OpenAIApiKey) == "" || strings.TrimSpace(cfg.OpenAIModel) == "" {
		log.Fatal("OPENAI_API_KEY and OPENAI_MODEL are required")
	}

	profiles, err := loadProfiles(strings.TrimSpace(*profileID), *limit, *includeFeatured)
	if err != nil {
		log.Fatalf("query profiles failed: %v", err)
	}
	if len(profiles) == 0 {
		fmt.Println("no profiles to process")
		return
	}
	entriesByProfile, err := loadKnowledgeEntries(profiles)
	if err != nil {
		log.Fatalf("query knowledge failed: %v", err)
	}

	report, csvReport, err := createReports(*outPath)
	if err != nil {
		log.Fatalf("create report failed: %v", err)
	}
	defer report.Close()
	defer csvReport.Close()
	cw := csv.NewWriter(csvReport)
	defer cw.Flush()
	_ = cw.Write([]string{"profile_id", "display_name", "status", "old_questions", "new_questions", "rejected", "error", "knowledge_titles"})

	var backup *os.File
	if *apply {
		backupName := fmt.Sprintf("sample_questions_backup-%s.jsonl", time.Now().Format("20060102-150405"))
		backup, err = os.Create(backupName)
		if err != nil {
			log.Fatalf("create backup failed: %v", err)
		}
		defer backup.Close()
		fmt.Printf("backup: %s\n", backupName)
	}

	processed, skipped, generated, written, failed := 0, 0, 0, 0, 0
	ctx := context.Background()
	for i, p := range profiles {
		entries := entriesByProfile[p.ID]
		old := []string(p.SampleQuestions)
		rec := reportRecord{
			ProfileID:       p.ID,
			DisplayName:     p.DisplayName,
			OldQuestions:    old,
			KnowledgeTitles: knowledgeTitles(entries, 8),
		}
		if len(entries) == 0 {
			rec.Status = "skipped_no_knowledge"
			skipped++
			writeReports(report, cw, rec)
			continue
		}
		if !*force && !lifeagent.NeedsSampleQuestionRefresh(old) {
			rec.Status = "skipped_existing_good"
			skipped++
			writeReports(report, cw, rec)
			continue
		}

		processed++
		fmt.Printf("[%d/%d] %s (%s)\n", i+1, len(profiles), p.DisplayName, shortID(p.ID))
		result, err := lifeagent.GenerateGroundedSampleQuestions(ctx, cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL, sampleInput(p, entries))
		if err != nil {
			rec.Status = "failed_generate"
			rec.Error = err.Error()
			failed++
			writeReports(report, cw, rec)
			continue
		}
		rec.NewQuestions = limitStrings(result.Questions, 6)
		rec.Rejected = result.Rejected
		rec.Raw = result.Raw
		if len(rec.NewQuestions) < *minQuestions {
			rec.Status = "failed_quality_gate"
			rec.Error = fmt.Sprintf("only %d accepted questions", len(rec.NewQuestions))
			failed++
			writeReports(report, cw, rec)
			continue
		}
		generated++
		rec.Status = "generated"
		if *apply {
			if err := backupOldQuestions(backup, p, old); err != nil {
				rec.Status = "failed_backup"
				rec.Error = err.Error()
				failed++
				writeReports(report, cw, rec)
				continue
			}
			if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).
				Update("sample_questions", models.JSONArray(rec.NewQuestions)).Error; err != nil {
				rec.Status = "failed_update"
				rec.Error = err.Error()
				failed++
				writeReports(report, cw, rec)
				continue
			}
			rec.Status = "written"
			written++
		}
		writeReports(report, cw, rec)
	}

	fmt.Printf("\nprofiles=%d processed=%d skipped=%d generated=%d written=%d failed=%d\n", len(profiles), processed, skipped, generated, written, failed)
	fmt.Printf("report: %s\ncsv: %s\n", report.Name(), csvReport.Name())
	if !*apply {
		fmt.Println("dry-run only; pass -apply to write accepted questions")
	}
}

func loadProfiles(profileID string, limit int, includeFeatured bool) ([]models.LifeAgentProfile, error) {
	var profiles []models.LifeAgentProfile
	q := db.DB.Where("published = ?", true).Order("created_at ASC")
	if profileID != "" {
		q = q.Where("id = ?", profileID)
	}
	if !includeFeatured {
		q = q.Where("featured_rank IS NULL AND (featured_collection IS NULL OR featured_collection = ?)", "")
	}
	if limit > 0 {
		q = q.Limit(limit)
	}
	return profiles, q.Find(&profiles).Error
}

func loadKnowledgeEntries(profiles []models.LifeAgentProfile) (map[string][]models.LifeAgentKnowledgeEntry, error) {
	ids := make([]string, 0, len(profiles))
	for _, p := range profiles {
		ids = append(ids, p.ID)
	}
	var entries []models.LifeAgentKnowledgeEntry
	if err := db.DB.Where("profile_id IN ?", ids).Order("profile_id ASC, sort_order ASC, created_at ASC").Find(&entries).Error; err != nil {
		return nil, err
	}
	out := make(map[string][]models.LifeAgentKnowledgeEntry, len(profiles))
	for _, e := range entries {
		out[e.ProfileID] = append(out[e.ProfileID], e)
	}
	return out, nil
}

func sampleInput(p models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) lifeagent.GroundedSampleQuestionInput {
	in := lifeagent.GroundedSampleQuestionInput{
		DisplayName:       p.DisplayName,
		Headline:          p.Headline,
		ShortBio:          p.ShortBio,
		ExpertiseTags:     []string(p.ExpertiseTags),
		School:            ptrVal(p.School),
		Education:         ptrVal(p.Education),
		Job:               ptrVal(p.Job),
		ExistingQuestions: []string(p.SampleQuestions),
	}
	for _, e := range entries {
		in.Knowledge = append(in.Knowledge, lifeagent.KnowledgeSnippet{
			Title:   e.Title,
			Content: e.Content,
			Tags:    []string(e.Tags),
		})
	}
	return in
}

func createReports(path string) (*os.File, *os.File, error) {
	if strings.TrimSpace(path) == "" {
		path = fmt.Sprintf("sample_questions_report-%s.jsonl", time.Now().Format("20060102-150405"))
	}
	if dir := filepath.Dir(path); dir != "." && dir != "" {
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, nil, err
		}
	}
	jsonl, err := os.Create(path)
	if err != nil {
		return nil, nil, err
	}
	csvPath := strings.TrimSuffix(path, filepath.Ext(path)) + ".csv"
	csvFile, err := os.Create(csvPath)
	if err != nil {
		jsonl.Close()
		return nil, nil, err
	}
	return jsonl, csvFile, nil
}

func writeReports(jsonl *os.File, cw *csv.Writer, rec reportRecord) {
	b, _ := json.Marshal(rec)
	fmt.Fprintln(jsonl, string(b))
	rejected, _ := json.Marshal(rec.Rejected)
	oldQ, _ := json.Marshal(rec.OldQuestions)
	newQ, _ := json.Marshal(rec.NewQuestions)
	_ = cw.Write([]string{
		rec.ProfileID,
		rec.DisplayName,
		rec.Status,
		string(oldQ),
		string(newQ),
		string(rejected),
		rec.Error,
		strings.Join(rec.KnowledgeTitles, " | "),
	})
}

func backupOldQuestions(f *os.File, p models.LifeAgentProfile, old []string) error {
	if f == nil {
		return nil
	}
	rec := map[string]any{"id": p.ID, "displayName": p.DisplayName, "sampleQuestions": old}
	b, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	_, err = fmt.Fprintln(f, string(b))
	return err
}

func knowledgeTitles(entries []models.LifeAgentKnowledgeEntry, max int) []string {
	var out []string
	for _, e := range entries {
		title := strings.TrimSpace(e.Title)
		if title == "" {
			continue
		}
		out = append(out, title)
		if len(out) >= max {
			break
		}
	}
	return out
}

func ptrVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func shortID(id string) string {
	if len(id) <= 8 {
		return id
	}
	return id[:8]
}

func limitStrings(in []string, max int) []string {
	if max <= 0 || len(in) <= max {
		return in
	}
	return in[:max]
}
