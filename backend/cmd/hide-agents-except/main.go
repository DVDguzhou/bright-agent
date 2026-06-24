// hide-agents-except：隐藏（published=false）除指定 Agent 外的所有人生 Agent，不删除数据。
//
// 用法（在 backend 目录）：
//
//	go run ./cmd/hide-agents-except                          # dry-run
//	go run ./cmd/hide-agents-except -name "阿青学长3.0"       # 指定保留名称
//	go run ./cmd/hide-agents-except -apply                   # 写库
//	go run ./cmd/hide-agents-except -restore hidden-xxx.txt -apply  # 回滚上架
package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	name := flag.String("name", "阿青学长3.0", "保留可见（published=true）的 Agent display_name")
	restore := flag.String("restore", "", "回滚：读入 id 清单，把这些 Agent 重新 published=true")
	limit := flag.Int("limit", 40, "dry-run 明细最多打印多少条（0=全部）")
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

	if strings.TrimSpace(*restore) != "" {
		runRestore(*restore, *apply)
		return
	}

	keepName := strings.TrimSpace(*name)
	if keepName == "" {
		log.Fatal("name 不能为空")
	}

	var keep []models.LifeAgentProfile
	if err := db.DB.Where("display_name = ?", keepName).Find(&keep).Error; err != nil {
		log.Fatalf("query keep agent failed: %v", err)
	}
	if len(keep) == 0 {
		log.Fatalf("未找到 display_name=%q 的 Agent，请确认名称或先用 export-life-agents 查看", keepName)
	}
	if len(keep) > 1 {
		log.Fatalf("display_name=%q 匹配到 %d 个 Agent，请先 dedupe 或改用唯一名称", keepName, len(keep))
	}
	keepAgent := keep[0]

	var toHide []models.LifeAgentProfile
	if err := db.DB.Where("id <> ?", keepAgent.ID).Find(&toHide).Error; err != nil {
		log.Fatalf("query agents failed: %v", err)
	}

	var hideIDs []string
	publishedBefore := 0
	for _, p := range toHide {
		hideIDs = append(hideIDs, p.ID)
		if p.Published {
			publishedBefore++
		}
	}

	fmt.Printf("=== 隐藏 Agent（published=false，不删数据）===\n")
	fmt.Printf("保留可见: [%s] %s (id=%s, published=%v)\n", keepAgent.DisplayName, keepAgent.Headline, keepAgent.ID, keepAgent.Published)
	fmt.Printf("将隐藏: 共 %d 个（其中当前 published=true 的有 %d 个）\n", len(hideIDs), publishedBefore)

	shown := 0
	for _, p := range toHide {
		if !p.Published {
			continue
		}
		if *limit > 0 && shown >= *limit {
			fmt.Printf("…（还有更多已发布 Agent，-limit 0 看全部）\n")
			break
		}
		fmt.Printf("  - %s  id=%s\n", p.DisplayName, p.ID)
		shown++
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写库。确认后加 -apply 执行。")
		fmt.Println("回滚文件会在 -apply 时生成，可用 -restore <文件> -apply 恢复被隐藏的 Agent。")
		return
	}

	fname := fmt.Sprintf("hidden-agents-except-%s.txt", time.Now().Format("20060102-150405"))
	f, err := os.Create(fname)
	if err != nil {
		log.Fatalf("无法创建回滚清单 %s: %v", fname, err)
	}
	defer f.Close()
	w := bufio.NewWriter(f)

	tx := db.DB.Begin()
	if err := tx.Model(&models.LifeAgentProfile{}).Where("id <> ?", keepAgent.ID).Update("published", false).Error; err != nil {
		tx.Rollback()
		log.Fatalf("批量隐藏失败: %v", err)
	}
	if err := tx.Model(&models.LifeAgentProfile{}).Where("id = ?", keepAgent.ID).Update("published", true).Error; err != nil {
		tx.Rollback()
		log.Fatalf("保留 Agent 上架失败: %v", err)
	}
	if err := tx.Commit().Error; err != nil {
		log.Fatalf("commit failed: %v", err)
	}

	for _, id := range hideIDs {
		fmt.Fprintln(w, id)
	}
	w.Flush()

	fmt.Printf("\n✓ 已隐藏 %d 个 Agent，仅保留 %q 可见。\n", len(hideIDs), keepAgent.DisplayName)
	fmt.Printf("  回滚清单：backend/%s\n", fname)
	fmt.Printf("  回滚：go run ./cmd/hide-agents-except -restore %s -apply\n", fname)
}

func runRestore(file string, apply bool) {
	data, err := os.ReadFile(file)
	if err != nil {
		log.Fatalf("读不到清单 %s: %v", file, err)
	}
	var ids []string
	for _, line := range strings.Split(string(data), "\n") {
		if t := strings.TrimSpace(line); t != "" {
			ids = append(ids, t)
		}
	}
	fmt.Printf("将重新上架 %d 个 Agent（published=true）。\n", len(ids))
	if !apply {
		fmt.Println("[dry-run] 未写库。加 -apply 执行。")
		return
	}
	if len(ids) == 0 {
		fmt.Println("清单为空，无需回滚。")
		return
	}
	if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id IN ?", ids).Update("published", true).Error; err != nil {
		log.Fatalf("回滚失败: %v", err)
	}
	fmt.Printf("✓ 已重新上架 %d 个。\n", len(ids))
}
