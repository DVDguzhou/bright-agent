// audit-fact-intercepts：只读审计 sample_questions 是否会被硬事实直答误拦截。
//
// 用法（在 backend 目录执行）：
//
//	go run ./cmd/audit-fact-intercepts
//	go run ./cmd/audit-fact-intercepts -limit 100 -out fact_intercepts.jsonl
package main

import (
	"encoding/csv"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

type auditRecord struct {
	ProfileID        string   `json:"profileId"`
	DisplayName      string   `json:"displayName"`
	Question         string   `json:"question"`
	FactKey          string   `json:"factKey"`
	HasFactValue     bool     `json:"hasFactValue"`
	ProfileValue     string   `json:"profileValue,omitempty"`
	KnowledgeMatched bool     `json:"knowledgeMatched"`
	KnowledgeTitles  []string `json:"knowledgeTitles,omitempty"`
	Risk             string   `json:"risk"`
}

func main() {
	limit := flag.Int("limit", 0, "最多扫描多少个已发布 Agent（0=不限）")
	outPath := flag.String("out", "", "报告输出路径（默认 fact_intercepts-时间戳.jsonl）")
	databaseURL := flag.String("database-url", "", "数据库连接串；为空时读取 DATABASE_URL")
	includeFeatured := flag.Bool("include-featured", true, "是否包含精选 Agent（只读审计，默认包含）")
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

	profiles, err := loadProfiles(*limit, *includeFeatured)
	if err != nil {
		log.Fatalf("query profiles failed: %v", err)
	}
	entriesByProfile, err := loadEntries(profiles)
	if err != nil {
		log.Fatalf("query entries failed: %v", err)
	}
	factsByProfile, err := loadFacts(profiles)
	if err != nil {
		log.Fatalf("query facts failed: %v", err)
	}

	jsonl, csvFile, err := createReports(*outPath)
	if err != nil {
		log.Fatalf("create report failed: %v", err)
	}
	defer jsonl.Close()
	defer csvFile.Close()
	cw := csv.NewWriter(csvFile)
	defer cw.Flush()
	_ = cw.Write([]string{"profile_id", "display_name", "question", "fact_key", "has_fact_value", "profile_value", "knowledge_matched", "knowledge_titles", "risk"})

	intercepts, risks := 0, 0
	for _, p := range profiles {
		for _, q := range []string(p.SampleQuestions) {
			q = strings.TrimSpace(q)
			if q == "" {
				continue
			}
			intent, ok := lifeagent.DetectFactIntentForAudit(q)
			if !ok {
				continue
			}
			intercepts++
			hasFact, profileValue := hasFactValue(p, factsByProfile[p.ID], intent.Key)
			matched, titles := knowledgeMatchesQuestion(q, entriesByProfile[p.ID])
			risk := "ok"
			if !hasFact && matched {
				risk = "empty_fact_but_knowledge_matches"
				risks++
			} else if !hasFact {
				risk = "empty_fact_no_knowledge_match"
				risks++
			}
			rec := auditRecord{
				ProfileID:        p.ID,
				DisplayName:      p.DisplayName,
				Question:         q,
				FactKey:          intent.Key,
				HasFactValue:     hasFact,
				ProfileValue:     profileValue,
				KnowledgeMatched: matched,
				KnowledgeTitles:  titles,
				Risk:             risk,
			}
			writeRecord(jsonl, cw, rec)
		}
	}
	fmt.Printf("profiles=%d fact_intercepts=%d risks=%d\n", len(profiles), intercepts, risks)
	fmt.Printf("report: %s\ncsv: %s\n", jsonl.Name(), csvFile.Name())
}

func loadProfiles(limit int, includeFeatured bool) ([]models.LifeAgentProfile, error) {
	var profiles []models.LifeAgentProfile
	q := db.DB.Where("published = ?", true).Order("created_at ASC")
	if !includeFeatured {
		q = q.Where("featured_rank IS NULL AND (featured_collection IS NULL OR featured_collection = ?)", "")
	}
	if limit > 0 {
		q = q.Limit(limit)
	}
	return profiles, q.Find(&profiles).Error
}

func loadEntries(profiles []models.LifeAgentProfile) (map[string][]models.LifeAgentKnowledgeEntry, error) {
	ids := profileIDs(profiles)
	var entries []models.LifeAgentKnowledgeEntry
	if len(ids) == 0 {
		return map[string][]models.LifeAgentKnowledgeEntry{}, nil
	}
	if err := db.DB.Where("profile_id IN ?", ids).Order("profile_id ASC, sort_order ASC, created_at ASC").Find(&entries).Error; err != nil {
		return nil, err
	}
	out := make(map[string][]models.LifeAgentKnowledgeEntry, len(profiles))
	for _, e := range entries {
		out[e.ProfileID] = append(out[e.ProfileID], e)
	}
	return out, nil
}

func loadFacts(profiles []models.LifeAgentProfile) (map[string][]models.LifeAgentStructuredFact, error) {
	ids := profileIDs(profiles)
	var facts []models.LifeAgentStructuredFact
	if len(ids) == 0 {
		return map[string][]models.LifeAgentStructuredFact{}, nil
	}
	if err := db.DB.Where("profile_id IN ?", ids).Find(&facts).Error; err != nil {
		return nil, err
	}
	out := make(map[string][]models.LifeAgentStructuredFact, len(profiles))
	for _, f := range facts {
		out[f.ProfileID] = append(out[f.ProfileID], f)
	}
	return out, nil
}

func profileIDs(profiles []models.LifeAgentProfile) []string {
	ids := make([]string, 0, len(profiles))
	for _, p := range profiles {
		ids = append(ids, p.ID)
	}
	return ids
}

func hasFactValue(p models.LifeAgentProfile, facts []models.LifeAgentStructuredFact, key string) (bool, string) {
	for _, f := range facts {
		if f.FactKey == key && strings.TrimSpace(f.FactValue) != "" {
			return true, strings.TrimSpace(f.FactValue)
		}
	}
	value := profileValueForKey(p, key)
	return strings.TrimSpace(value) != "", value
}

func profileValueForKey(p models.LifeAgentProfile, key string) string {
	switch key {
	case "display_name":
		return p.DisplayName
	case "school":
		return ptrVal(p.School)
	case "education":
		return ptrVal(p.Education)
	case "job":
		return ptrVal(p.Job)
	case "income":
		return ptrVal(p.Income)
	case "city":
		if ptrVal(p.City) != "" {
			return ptrVal(p.City)
		}
		return ptrVal(p.Province)
	default:
		return ""
	}
}

func knowledgeMatchesQuestion(question string, entries []models.LifeAgentKnowledgeEntry) (bool, []string) {
	terms := auditEvidenceTerms(question)
	if len(terms) == 0 {
		return false, nil
	}
	var titles []string
	for _, e := range entries {
		corpus := normalizeText(e.Title + "\n" + e.Content + "\n" + strings.Join([]string(e.Tags), "\n"))
		score := 0
		for _, term := range terms {
			if strings.Contains(corpus, normalizeText(term)) {
				score++
			}
		}
		if score >= 2 || (score >= 1 && containsMoneyTerm(question)) {
			titles = append(titles, e.Title)
			if len(titles) >= 3 {
				break
			}
		}
	}
	return len(titles) > 0, titles
}

func auditEvidenceTerms(question string) []string {
	q := normalizeText(question)
	replacer := strings.NewReplacer(
		"怎么做到", " ", "怎么做", " ", "怎么准备", " ", "怎么取舍", " ", "怎么选择", " ",
		"怎么选", " ", "怎么", " ", "如何", " ", "什么", " ", "哪些", " ", "多少", " ",
		"为什么", " ", "是", " ", "的", " ", "吗", " ", "？", " ", "?", " ",
		"你", " ", "他", " ", "她", " ", "这个人", " ",
	)
	cleaned := replacer.Replace(q)
	splitter := func(r rune) bool {
		return r == ' ' || r == '/' || r == '-' || r == '_' || r == '、' || r == ',' || r == '，'
	}
	seen := map[string]bool{}
	var out []string
	for _, term := range strings.FieldsFunc(cleaned, splitter) {
		term = strings.TrimSpace(term)
		if len([]rune(term)) < 2 || seen[term] {
			continue
		}
		seen[term] = true
		out = append(out, term)
	}
	for _, kw := range []string{"保研", "赚钱", "收入", "工资", "年薪", "学校", "工作", "本科", "硕士", "博士", "大四", "20万"} {
		if strings.Contains(q, kw) && !seen[kw] {
			seen[kw] = true
			out = append(out, kw)
		}
	}
	for _, m := range moneyRe.FindAllString(q, -1) {
		if !seen[m] {
			seen[m] = true
			out = append(out, m)
		}
	}
	return out
}

var moneyRe = regexp.MustCompile(`\d+(?:\.\d+)?\s*(?:w|万|k|千|块|元)`)

func containsMoneyTerm(s string) bool {
	return moneyRe.MatchString(strings.ToLower(s)) || strings.Contains(s, "赚钱") || strings.Contains(s, "收入")
}

func normalizeText(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, "？", "?")
	s = strings.ReplaceAll(s, "，", ",")
	return s
}

func createReports(path string) (*os.File, *os.File, error) {
	if strings.TrimSpace(path) == "" {
		path = fmt.Sprintf("fact_intercepts-%s.jsonl", time.Now().Format("20060102-150405"))
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

func writeRecord(jsonl *os.File, cw *csv.Writer, rec auditRecord) {
	b, _ := json.Marshal(rec)
	fmt.Fprintln(jsonl, string(b))
	titles, _ := json.Marshal(rec.KnowledgeTitles)
	_ = cw.Write([]string{
		rec.ProfileID,
		rec.DisplayName,
		rec.Question,
		rec.FactKey,
		fmt.Sprint(rec.HasFactValue),
		rec.ProfileValue,
		fmt.Sprint(rec.KnowledgeMatched),
		string(titles),
		rec.Risk,
	})
}

func ptrVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}
