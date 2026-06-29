// hide-agents-except：隐藏（published=false）除指定 Agent 外的所有人生 Agent，不删除数据。
//
// 用法（在 backend 目录）：
//
//	go run ./cmd/hide-agents-except                          # dry-run
//	go run ./cmd/hide-agents-except -name "阿青学长3.0"       # 指定保留名称
//	go run ./cmd/hide-agents-except -names "小清学长,张雪峰" # 保留多个名称
//	go run ./cmd/hide-agents-except -names "小清学长|836444684@qq.com,张雪峰" # 同名时用归属邮箱区分
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

type keepSpec struct {
	displayName string
	ownerEmail  string
}

func parseKeepSpecs(rawNames []string) []keepSpec {
	specs := make([]keepSpec, 0, len(rawNames))
	for _, raw := range rawNames {
		displayName, ownerEmail, _ := strings.Cut(raw, "|")
		specs = append(specs, keepSpec{
			displayName: strings.TrimSpace(displayName),
			ownerEmail:  strings.TrimSpace(ownerEmail),
		})
	}
	return specs
}

func resolveKeepAgents(specs []keepSpec) ([]models.LifeAgentProfile, error) {
	keep := make([]models.LifeAgentProfile, 0, len(specs))
	for _, spec := range specs {
		if spec.displayName == "" {
			continue
		}
		if spec.ownerEmail != "" {
			var profile models.LifeAgentProfile
			err := db.DB.Joins("JOIN users ON users.id = life_agent_profiles.user_id").
				Where("life_agent_profiles.display_name = ? AND users.email = ?", spec.displayName, spec.ownerEmail).
				First(&profile).Error
			if err != nil {
				var count int64
				_ = db.DB.Model(&models.LifeAgentProfile{}).Where("display_name = ?", spec.displayName).Count(&count).Error
				if count > 1 {
					return nil, fmt.Errorf("display_name=%q owner_email=%q 未匹配到 Agent（同名共有 %d 个，请核对邮箱）", spec.displayName, spec.ownerEmail, count)
				}
				return nil, fmt.Errorf("display_name=%q owner_email=%q 未匹配到 Agent", spec.displayName, spec.ownerEmail)
			}
			keep = append(keep, profile)
			continue
		}

		var matches []models.LifeAgentProfile
		if err := db.DB.Where("display_name = ?", spec.displayName).Find(&matches).Error; err != nil {
			return nil, fmt.Errorf("query keep agent %q failed: %w", spec.displayName, err)
		}
		if len(matches) != 1 {
			hint := ""
			if len(matches) > 1 {
				hint = "；可用 名称|归属邮箱 区分，例如 小清学长|836444684@qq.com"
			}
			return nil, fmt.Errorf("display_name=%q 匹配到 %d 个 Agent，必须恰好为 1 个%s", spec.displayName, len(matches), hint)
		}
		keep = append(keep, matches[0])
	}
	return keep, nil
}

func main() {
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	name := flag.String("name", "阿青学长3.0", "保留可见（published=true）的 Agent display_name")
	names := flag.String("names", "", "保留多个 Agent，逗号分隔；设置后覆盖 -name")
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

	keepNames := []string{strings.TrimSpace(*name)}
	if strings.TrimSpace(*names) != "" {
		keepNames = nil
		for _, value := range strings.Split(*names, ",") {
			if value = strings.TrimSpace(value); value != "" {
				keepNames = append(keepNames, value)
			}
		}
	}
	if len(keepNames) == 0 || keepNames[0] == "" {
		log.Fatal("name/names 不能为空")
	}

	keepSpecs := parseKeepSpecs(keepNames)
	keep, err := resolveKeepAgents(keepSpecs)
	if err != nil {
		log.Fatal(err)
	}
	keepIDs := make([]string, 0, len(keep))
	seen := make(map[string]struct{}, len(keep))
	for _, profile := range keep {
		if _, ok := seen[profile.ID]; ok {
			continue
		}
		seen[profile.ID] = struct{}{}
		keepIDs = append(keepIDs, profile.ID)
	}

	var toHide []models.LifeAgentProfile
	if err := db.DB.Where("id NOT IN ?", keepIDs).Find(&toHide).Error; err != nil {
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
	for _, profile := range keep {
		fmt.Printf("保留可见: [%s] %s (id=%s, published=%v)\n", profile.DisplayName, profile.Headline, profile.ID, profile.Published)
	}
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
	if err := tx.Model(&models.LifeAgentProfile{}).Where("id NOT IN ?", keepIDs).Update("published", false).Error; err != nil {
		tx.Rollback()
		log.Fatalf("批量隐藏失败: %v", err)
	}
	if err := tx.Model(&models.LifeAgentProfile{}).Where("id IN ?", keepIDs).Update("published", true).Error; err != nil {
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

	fmt.Printf("\n✓ 已隐藏 %d 个 Agent，仅保留 %s 可见。\n", len(hideIDs), strings.Join(keepNames, "、"))
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
