// refresh-sample-questions：用最新生成器重算并覆盖 Agent 的 sample_questions。
//
// 背景：过去某次任务把生成的问题写进了 DB；展示层「策划值优先」会直接返回存储值，
// 导致生成器的改进（实体问法、垃圾过滤等）不生效。这里离线重算并写回，把机器问题换成更自然的。
//
// 安全：编辑精选 jingpin 的 13 个一律跳过（保留手写）。-apply 写库并备份旧值到 jsonl，可对照恢复。
//
// 用法（backend 目录）：
//   go run ./cmd/refresh-sample-questions            # dry-run：统计 + 抽样 before/after
//   go run ./cmd/refresh-sample-questions -apply     # 写库 + 备份
package main

import (
	"bufio"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	limit := flag.Int("limit", 30, "dry-run 抽样打印多少条（0=全部）")
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

	var w *bufio.Writer
	if *apply {
		fname := fmt.Sprintf("refresh-sample-q-backup-%s.jsonl", time.Now().Format("20060102-150405"))
		f, err := os.Create(fname)
		if err != nil {
			log.Fatalf("无法创建备份 %s: %v", fname, err)
		}
		defer f.Close()
		w = bufio.NewWriter(f)
		defer w.Flush()
		fmt.Printf("旧值备份：backend/%s\n", fname)
	}

	// 已发布、且不属于编辑精选 jingpin
	var profiles []models.LifeAgentProfile
	db.DB.Where("published = ? AND (featured_collection IS NULL OR featured_collection <> ?)", true, "jingpin").Find(&profiles)

	changed, becameThin := 0, 0
	shown := 0
	for i := range profiles {
		p := &profiles[i]

		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", p.ID).Order("sort_order asc").Find(&entries)
		ks := make([]lifeagent.KnowledgeSnippet, 0, len(entries))
		for _, e := range entries {
			ks = append(ks, lifeagent.KnowledgeSnippet{Title: e.Title, Content: e.Content, Tags: []string(e.Tags)})
		}

		in := lifeagent.SampleQuestionInput{
			DisplayName:   p.DisplayName,
			Headline:      p.Headline,
			ShortBio:      p.ShortBio,
			ExpertiseTags: []string(p.ExpertiseTags),
			Job:           ptrVal(p.Job),
			School:        ptrVal(p.School),
			Knowledge:     ks,
		}
		newQs := lifeagent.DeriveSampleQuestions(in)
		old := []string(p.SampleQuestions)
		if equalStrings(old, newQs) {
			continue
		}
		changed++
		if len(newQs) < 2 {
			becameThin++
		}

		if *apply {
			rec := map[string]any{"id": p.ID, "name": p.DisplayName, "old": old, "new": newQs}
			b, _ := json.Marshal(rec)
			fmt.Fprintln(w, string(b))
			if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).
				Update("sample_questions", models.JSONArray(newQs)).Error; err != nil {
				log.Printf("  ⚠ 更新失败 %s: %v", p.DisplayName, err)
			}
		} else if *limit == 0 || shown < *limit {
			fmt.Printf("[%s]\n  旧: %v\n  新: %v\n", p.DisplayName, old, newQs)
			shown++
		}
	}

	fmt.Printf("\n=== 汇总 ===\n候选（非精选已发布）：%d\n有变化：%d\n重算后不足2条：%d\n",
		len(profiles), changed, becameThin)
	if !*apply {
		fmt.Println("\n[dry-run] 未写库。确认后加 -apply。")
	} else {
		fmt.Printf("✓ 已写入 %d 个。\n", changed)
	}
}

func equalStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func ptrVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}
