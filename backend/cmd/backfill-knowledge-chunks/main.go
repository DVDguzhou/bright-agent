package main

import (
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
	apply := flag.Bool("apply", false, "写入数据库；默认 dry-run")
	profileID := flag.String("id", "", "只处理某个 profile id")
	limit := flag.Int("limit", 0, "最多处理多少条 knowledge entry（0=不限）")
	force := flag.Bool("force", false, "即使已有最新 chunk 也重建")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}
	if err := db.DB.AutoMigrate(&models.LifeAgentKnowledgeChunk{}); err != nil {
		log.Fatalf("chunk table migrate failed: %v", err)
	}

	q := db.DB.Model(&models.LifeAgentKnowledgeEntry{})
	if strings.TrimSpace(*profileID) != "" {
		q = q.Where("profile_id = ?", strings.TrimSpace(*profileID))
	}
	if *limit > 0 {
		q = q.Limit(*limit)
	}
	var entries []models.LifeAgentKnowledgeEntry
	if err := q.Order("profile_id ASC, sort_order ASC, created_at ASC").Find(&entries).Error; err != nil {
		log.Fatalf("load entries failed: %v", err)
	}
	if len(entries) == 0 {
		fmt.Println("没有 knowledge entry 需要处理。")
		return
	}

	type chunkState struct {
		Count       int
		MaxRevision int
	}
	states := map[string]chunkState{}
	if !*force {
		ids := make([]string, 0, len(entries))
		for _, e := range entries {
			ids = append(ids, e.ID)
		}
		type row struct {
			EntryID     string `gorm:"column:entry_id"`
			Count       int    `gorm:"column:cnt"`
			MaxRevision int    `gorm:"column:max_rev"`
		}
		var rows []row
		if err := db.DB.Model(&models.LifeAgentKnowledgeChunk{}).
			Select("entry_id, COUNT(*) AS cnt, COALESCE(MAX(entry_revision), 0) AS max_rev").
			Where("entry_id IN ?", ids).
			Group("entry_id").
			Scan(&rows).Error; err != nil {
			log.Fatalf("load chunk state failed: %v", err)
		}
		for _, r := range rows {
			states[r.EntryID] = chunkState{Count: r.Count, MaxRevision: r.MaxRevision}
		}
	}

	var pending []models.LifeAgentKnowledgeEntry
	for _, e := range entries {
		state := states[e.ID]
		if *force || state.Count == 0 || state.MaxRevision < e.Revision {
			pending = append(pending, e)
		}
	}

	fmt.Printf("扫描 knowledge entries: %d 条；待重建 chunks: %d 条。\n", len(entries), len(pending))
	if len(pending) == 0 {
		return
	}
	preview := len(pending)
	if preview > 10 {
		preview = 10
	}
	for i := 0; i < preview; i++ {
		fmt.Printf("[%d] profile=%s entry=%s title=%s revision=%d\n",
			i+1, pending[i].ProfileID, pending[i].ID, truncate(pending[i].Title, 48), pending[i].Revision)
	}
	if !*apply {
		fmt.Println("\n[dry-run] 未写入。确认无误后加 -apply 执行。")
		return
	}

	done := 0
	for _, e := range pending {
		if err := lifeagent.SyncKnowledgeEntryChunks(db.DB, e); err != nil {
			log.Printf("sync chunks failed entry=%s profile=%s: %v", e.ID, e.ProfileID, err)
			continue
		}
		done++
	}
	fmt.Printf("\n完成：成功重建 %d/%d 条 knowledge entry 的 chunks。\n", done, len(pending))
}

func truncate(s string, n int) string {
	r := []rune(strings.TrimSpace(s))
	if len(r) <= n {
		return string(r)
	}
	return string(r[:n]) + "..."
}
