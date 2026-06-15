// tag-knowledge-facets：为 Life Agent 知识条目生成后组式分面标签。
//
// 用法（在 backend 目录执行）：
//
//	go run ./cmd/tag-knowledge-facets -limit 100
//	go run ./cmd/tag-knowledge-facets -llm -limit 100
//	go run ./cmd/tag-knowledge-facets -apply -llm
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
	openai "github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type reportRecord struct {
	EntryID   string                       `json:"entryId"`
	ProfileID string                       `json:"profileId"`
	Title     string                       `json:"title"`
	Old       models.JSONMap               `json:"old,omitempty"`
	New       lifeagent.KnowledgeFacetTags `json:"new"`
	Issues    []string                     `json:"issues,omitempty"`
	Source    string                       `json:"source"`
	Error     string                       `json:"error,omitempty"`
}

func main() {
	apply := flag.Bool("apply", false, "写入 facet_tags（默认 dry-run）")
	useLLM := flag.Bool("llm", false, "用 LLM 在规则候选基础上归一化分面标签")
	force := flag.Bool("force", false, "已有 facet_tags 也重新生成")
	limit := flag.Int("limit", 0, "最多处理多少条知识（0=不限）")
	profileID := flag.String("profile-id", "", "只处理某个 profile id")
	outPath := flag.String("out", "", "报告输出路径（默认 facet_tags_report-时间戳.jsonl）")
	databaseURL := flag.String("database-url", "", "数据库连接串；为空时读取 DATABASE_URL")
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
	hasFacetColumn, err := facetTagsColumnExists(db.DB)
	if err != nil {
		log.Fatalf("check facet_tags column failed: %v", err)
	}
	if *apply {
		if err := ensureFacetTagsColumn(db.DB); err != nil {
			log.Fatalf("ensure facet_tags column failed: %v", err)
		}
		hasFacetColumn = true
	}

	var llmClient *openai.Client
	var llmModel string
	if *useLLM {
		cfg := config.Load()
		if cfg == nil || strings.TrimSpace(cfg.OpenAIApiKey) == "" || strings.TrimSpace(cfg.OpenAIModel) == "" {
			log.Fatal("OPENAI_API_KEY and OPENAI_MODEL are required when -llm is set")
		}
		llmModel = cfg.OpenAIModel
		ocfg := openai.DefaultConfig(cfg.OpenAIApiKey)
		if strings.TrimSpace(cfg.OpenAIBaseURL) != "" {
			ocfg.BaseURL = cfg.OpenAIBaseURL
		}
		llmClient = openai.NewClientWithConfig(ocfg)
	}

	entries, err := loadEntries(*profileID, *limit, *force, hasFacetColumn)
	if err != nil {
		log.Fatalf("query entries failed: %v", err)
	}
	if len(entries) == 0 {
		fmt.Println("no knowledge entries to tag")
		return
	}

	jsonl, csvFile, err := createReports(*outPath)
	if err != nil {
		log.Fatalf("create report failed: %v", err)
	}
	defer jsonl.Close()
	defer csvFile.Close()
	cw := csv.NewWriter(csvFile)
	defer cw.Flush()
	_ = cw.Write([]string{"entry_id", "profile_id", "title", "source", "subjects", "aspects", "space", "content_time", "doc_types", "issues", "error"})

	written, failed := 0, 0
	for i, e := range entries {
		fmt.Printf("[%d/%d] %s\n", i+1, len(entries), e.Title)
		facets := lifeagent.InferKnowledgeFacetTags(e.Title, e.Category, e.Content, []string(e.Tags))
		source := "rules"
		var genErr error
		if llmClient != nil {
			if llmFacets, err := generateFacetsWithLLM(context.Background(), llmClient, llmModel, e, facets); err == nil {
				facets = llmFacets
				source = "llm"
			} else {
				genErr = err
			}
		}
		facets = lifeagent.NormalizeKnowledgeFacetTags(facets)
		issues := lifeagent.ValidateKnowledgeFacetTags(facets)
		rec := reportRecord{
			EntryID:   e.ID,
			ProfileID: e.ProfileID,
			Title:     e.Title,
			Old:       e.FacetTags,
			New:       facets,
			Issues:    issues,
			Source:    source,
		}
		if genErr != nil {
			rec.Error = genErr.Error()
			failed++
		}
		writeReport(jsonl, cw, rec)
		if *apply {
			if len(issues) > 0 {
				failed++
				continue
			}
			if err := db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("id = ?", e.ID).
				Update("facet_tags", models.JSONMap(lifeagent.KnowledgeFacetTagsToMap(facets))).Error; err != nil {
				log.Printf("update failed %s: %v", e.ID, err)
				failed++
				continue
			}
			written++
		}
	}

	fmt.Printf("entries=%d written=%d failed=%d\n", len(entries), written, failed)
	fmt.Printf("report: %s\ncsv: %s\n", jsonl.Name(), csvFile.Name())
	if !*apply {
		fmt.Println("dry-run only; pass -apply to write facet_tags")
	}
}

func loadEntries(profileID string, limit int, force bool, hasFacetColumn bool) ([]models.LifeAgentKnowledgeEntry, error) {
	var entries []models.LifeAgentKnowledgeEntry
	q := db.DB.Order("profile_id ASC, sort_order ASC, created_at ASC")
	if strings.TrimSpace(profileID) != "" {
		q = q.Where("profile_id = ?", strings.TrimSpace(profileID))
	}
	if !force && hasFacetColumn {
		q = q.Where("facet_tags IS NULL OR JSON_LENGTH(facet_tags) = 0")
	}
	if limit > 0 {
		q = q.Limit(limit)
	}
	return entries, q.Find(&entries).Error
}

func ensureFacetTagsColumn(gdb *gorm.DB) error {
	exists, err := facetTagsColumnExists(gdb)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return gdb.Exec("ALTER TABLE life_agent_knowledge_entries ADD COLUMN facet_tags JSON NULL").Error
}

func facetTagsColumnExists(gdb *gorm.DB) (bool, error) {
	type col struct{ Count int }
	var c col
	if err := gdb.Raw(`
		SELECT COUNT(*) AS count
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'life_agent_knowledge_entries'
		  AND COLUMN_NAME = 'facet_tags'
	`).Scan(&c).Error; err != nil {
		return false, err
	}
	return c.Count > 0, nil
}

func generateFacetsWithLLM(ctx context.Context, client *openai.Client, model string, e models.LifeAgentKnowledgeEntry, seed lifeagent.KnowledgeFacetTags) (lifeagent.KnowledgeFacetTags, error) {
	seedJSON, _ := json.Marshal(seed)
	content := e.Content
	if len([]rune(content)) > 5000 {
		content = string([]rune(content)[:5000])
	}
	system := `你是知识组织专家。请把一条人生 Agent 知识条目归一化成后组式分面标签。

只输出严格 JSON，不要 markdown。
schema:
{
  "subjects": ["主要论述对象，1-8个"],
  "aspects": [{"type": "background|reason|process|method|condition|state|property|tradeoff|comparison|influence|application|risk|advice", "label": "自然语言标签", "object": "可选，对比较/影响/应用/关联对象"}],
  "space": ["知识发生的地点、机构、平台或场域"],
  "contentTime": ["知识内容发生的时间，如大四、2023秋招"],
  "recordTime": ["记录/访谈/发布发生的时间；没有则空数组"],
  "docTypes": ["访谈|个人经历|经验贴|观点复盘|政策材料|官方材料等"],
  "audience": ["适合参考的人群"],
  "confidence": "low|medium|high"
}

规则：
- contentTime 和 recordTime 必须区分。
- aspect.type 必须来自 schema 里的受控词。
- 不要把“互联网赛道/小红书赛道”硬当地理位置，可放在 space 表示场域。
- 不要编造条目里没有的信息。`
	user := fmt.Sprintf("标题：%s\n分类：%s\n原 tags：%s\n规则候选：%s\n\n正文：\n%s",
		e.Title, e.Category, strings.Join([]string(e.Tags), "、"), string(seedJSON), content)
	req := openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: system},
			{Role: openai.ChatMessageRoleUser, Content: user},
		},
		Temperature:         0.2,
		MaxCompletionTokens: 900,
	}
	cctx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()
	resp, err := client.CreateChatCompletion(cctx, req)
	if err != nil {
		return lifeagent.KnowledgeFacetTags{}, err
	}
	if len(resp.Choices) == 0 {
		return lifeagent.KnowledgeFacetTags{}, fmt.Errorf("empty LLM choices")
	}
	raw := extractJSON(strings.TrimSpace(resp.Choices[0].Message.Content))
	var out lifeagent.KnowledgeFacetTags
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return lifeagent.KnowledgeFacetTags{}, err
	}
	return lifeagent.NormalizeKnowledgeFacetTags(out), nil
}

func extractJSON(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimSuffix(s, "```")
		s = strings.TrimSpace(s)
	}
	if start := strings.Index(s, "{"); start >= 0 {
		if end := strings.LastIndex(s, "}"); end > start {
			return s[start : end+1]
		}
	}
	return s
}

func createReports(path string) (*os.File, *os.File, error) {
	if strings.TrimSpace(path) == "" {
		path = fmt.Sprintf("facet_tags_report-%s.jsonl", time.Now().Format("20060102-150405"))
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

func writeReport(jsonl *os.File, cw *csv.Writer, rec reportRecord) {
	b, _ := json.Marshal(rec)
	fmt.Fprintln(jsonl, string(b))
	var aspectLabels []string
	for _, a := range rec.New.Aspects {
		label := a.Type
		if a.Label != "" {
			label += "/" + a.Label
		}
		if a.Object != "" {
			label += "->" + a.Object
		}
		aspectLabels = append(aspectLabels, label)
	}
	_ = cw.Write([]string{
		rec.EntryID,
		rec.ProfileID,
		rec.Title,
		rec.Source,
		strings.Join(rec.New.Subjects, " | "),
		strings.Join(aspectLabels, " | "),
		strings.Join(rec.New.Space, " | "),
		strings.Join(rec.New.ContentTime, " | "),
		strings.Join(rec.New.DocTypes, " | "),
		strings.Join(rec.Issues, " | "),
		rec.Error,
	})
}
