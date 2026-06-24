// hide-agents-by-owner：按用户邮箱批量隐藏/显示其名下的全部人生 Agent（published 字段，不删数据）。
//
// 用法（backend 目录）：
//   go run ./cmd/hide-agents-by-owner -hide-email tmxiand@gmail.com -show-email 836444684@qq.com
//   go run ./cmd/hide-agents-by-owner -hide-email tmxiand@gmail.com -show-email 836444684@qq.com -apply
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

func splitEmails(raw string) []string {
	var out []string
	for _, p := range strings.Split(raw, ",") {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}

func loadUser(email string) (models.User, error) {
	var u models.User
	err := db.DB.Where("email = ?", strings.TrimSpace(email)).First(&u).Error
	return u, err
}

func listAgents(userID string) ([]models.LifeAgentProfile, error) {
	var agents []models.LifeAgentProfile
	err := db.DB.Where("user_id = ?", userID).Order("display_name").Find(&agents).Error
	return agents, err
}

func main() {
	hideEmails := flag.String("hide-email", "", "要隐藏的归属邮箱（逗号分隔）")
	showEmails := flag.String("show-email", "", "要显示的归属邮箱（逗号分隔）")
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	flag.Parse()

	hide := splitEmails(*hideEmails)
	show := splitEmails(*showEmails)
	if len(hide) == 0 && len(show) == 0 {
		log.Fatal("至少指定 -hide-email 或 -show-email")
	}

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

	fmt.Println("=== 按归属邮箱隐藏/显示 Agent ===")

	type change struct {
		agent models.LifeAgentProfile
		owner string
		to    bool
	}
	var changes []change
	var rollbackHide, rollbackShow []string

	for _, email := range hide {
		u, err := loadUser(email)
		if err != nil {
			log.Fatalf("未找到用户 %q: %v", email, err)
		}
		agents, err := listAgents(u.ID)
		if err != nil {
			log.Fatalf("查询 Agent 失败: %v", err)
		}
		fmt.Printf("\n隐藏 <%s> (%s) — %d 个 Agent\n", email, ptrStr(u.Name), len(agents))
		for _, a := range agents {
			fmt.Printf("  - %s  published %v -> false\n", a.DisplayName, a.Published)
			if a.Published {
				rollbackHide = append(rollbackHide, a.ID)
			}
			changes = append(changes, change{agent: a, owner: email, to: false})
		}
	}

	for _, email := range show {
		u, err := loadUser(email)
		if err != nil {
			log.Fatalf("未找到用户 %q: %v", email, err)
		}
		agents, err := listAgents(u.ID)
		if err != nil {
			log.Fatalf("查询 Agent 失败: %v", err)
		}
		fmt.Printf("\n显示 <%s> (%s) — %d 个 Agent\n", email, ptrStr(u.Name), len(agents))
		for _, a := range agents {
			fmt.Printf("  - %s  published %v -> true\n", a.DisplayName, a.Published)
			if !a.Published {
				rollbackShow = append(rollbackShow, a.ID)
			}
			changes = append(changes, change{agent: a, owner: email, to: true})
		}
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写库。加 -apply 执行。")
		return
	}

	tx := db.DB.Begin()
	for _, c := range changes {
		if err := tx.Model(&models.LifeAgentProfile{}).Where("id = ?", c.agent.ID).Update("published", c.to).Error; err != nil {
			tx.Rollback()
			log.Fatalf("更新 %s 失败: %v", c.agent.DisplayName, err)
		}
	}
	if err := tx.Commit().Error; err != nil {
		log.Fatalf("commit failed: %v", err)
	}

	fname := fmt.Sprintf("owner-agent-visibility-%s.txt", time.Now().Format("20060102-150405"))
	f, err := os.Create(fname)
	if err != nil {
		log.Fatalf("无法创建回滚清单: %v", err)
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	fmt.Fprintln(w, "# hide")
	for _, id := range rollbackHide {
		fmt.Fprintln(w, id)
	}
	fmt.Fprintln(w, "# show")
	for _, id := range rollbackShow {
		fmt.Fprintln(w, id)
	}
	w.Flush()

	fmt.Printf("\n✓ 已更新 %d 个 Agent。\n", len(changes))
	fmt.Printf("  回滚清单：backend/%s\n", fname)
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return strings.TrimSpace(*s)
}
