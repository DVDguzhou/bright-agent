// gate-broken-copy：把「标题/简介被脱敏污染」的 Agent 从前台下架（published=false），做发现页质量门槛。
//
// 精确检测污染（三个信号任一命中即判脏）：
//   1. 占位符没填：学校名称 / 项目名称 / 录取学校名 / 录取公司名 / 起一个标题
//   2. markdown 残渣：](  \[  \]
//   3. 昵称残渣：标题/简介里出现了「别的 Agent 的 display_name」（脱敏全局替换把别人的昵称
//      塞进了本条正文，尤其英文词里）。只算长度≥4 的昵称，避免短串误伤。
//
// 安全：只处理「非精选（featured_collection 为空）且当前 published=true」的 Agent；精选一律不动。
// 可回滚：-apply 时把下架的 id 写到 gate-hidden-<时间>.txt；用 -restore <文件> 可重新上架。
//
// 用法（backend 目录）：
//   go run ./cmd/gate-broken-copy                 # dry-run：统计 + 列出将下架的
//   go run ./cmd/gate-broken-copy -apply          # 下架（写 id 清单文件）
//   go run ./cmd/gate-broken-copy -restore gate-hidden-20260609.txt -apply  # 回滚
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

var placeholderMarkers = []string{"学校名称", "项目名称", "录取学校名", "录取公司名", "起一个标题", "录入信息"}
var markdownMarkers = []string{"](", "\\[", "\\]"}

func main() {
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	restore := flag.String("restore", "", "回滚：读入 id 清单文件，把这些 Agent 重新 published=true")
	limit := flag.Int("limit", 60, "dry-run 明细最多打印多少条（0=全部）")
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

	// 1) 收集所有 display_name（长度≥4）作为「别人昵称」检测集
	var all []models.LifeAgentProfile
	db.DB.Find(&all)
	nameSet := make(map[string]bool, len(all))
	for _, p := range all {
		if len([]rune(p.DisplayName)) >= 4 {
			nameSet[p.DisplayName] = true
		}
	}

	// 2) 只在「非精选 + 已发布」里找脏的
	var pubs []models.LifeAgentProfile
	db.DB.Where("published = ? AND featured_collection IS NULL", true).Find(&pubs)

	type hit struct {
		id, name, reason, sample string
	}
	var hits []hit
	for _, p := range pubs {
		if reason, sample, bad := corrupt(p, nameSet); bad {
			hits = append(hits, hit{p.ID, p.DisplayName, reason, sample})
		}
	}

	fmt.Printf("=== 质量门槛：非精选已发布中检出污染 %d 个 ===\n", len(hits))
	shown := 0
	for _, h := range hits {
		if *limit > 0 && shown >= *limit {
			fmt.Printf("…（还有 %d 个，-limit 0 看全部）\n", len(hits)-shown)
			break
		}
		fmt.Printf("  [%s] %-16s «%s»\n", h.reason, truncate(h.name, 16), h.sample)
		shown++
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写库。确认后加 -apply 下架（精选不受影响，可用 -restore 回滚）。")
		return
	}

	// 3) 写库 + 记录 id 清单
	fname := fmt.Sprintf("gate-hidden-%s.txt", time.Now().Format("20060102-150405"))
	f, err := os.Create(fname)
	if err != nil {
		log.Fatalf("无法创建回滚清单 %s: %v", fname, err)
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	done := 0
	for _, h := range hits {
		if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", h.id).Update("published", false).Error; err != nil {
			log.Printf("  ⚠ 下架失败 %s: %v", h.name, err)
			continue
		}
		fmt.Fprintln(w, h.id)
		done++
	}
	w.Flush()
	fmt.Printf("\n✓ 已下架 %d 个。回滚清单：backend/%s\n", done, fname)
	fmt.Printf("  回滚：go run ./cmd/gate-broken-copy -restore %s -apply\n", fname)
}

func corrupt(p models.LifeAgentProfile, nameSet map[string]bool) (reason, sample string, bad bool) {
	for _, field := range []string{p.Headline, p.ShortBio} {
		field = strings.TrimSpace(field)
		if field == "" {
			continue
		}
		if hasAny(field, placeholderMarkers) {
			return "占位符", truncate(field, 46), true
		}
		if hasAny(field, markdownMarkers) {
			return "markdown残渣", truncate(field, 46), true
		}
		// 去掉本人昵称后，若还出现别人的昵称（长度≥4），判为脱敏污染
		rest := strings.ReplaceAll(field, p.DisplayName, "")
		for name := range nameSet {
			if name != p.DisplayName && strings.Contains(rest, name) {
				return "昵称残渣", truncate(field, 46), true
			}
		}
	}
	return "", "", false
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
	if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id IN ?", ids).Update("published", true).Error; err != nil {
		log.Fatalf("回滚失败: %v", err)
	}
	fmt.Printf("✓ 已重新上架 %d 个。\n", len(ids))
}

func hasAny(s string, subs []string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n]) + "…"
}
