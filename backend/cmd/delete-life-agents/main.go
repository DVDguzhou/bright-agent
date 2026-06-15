// delete-life-agents：按 id 前缀或名称删除测试/废弃 Life Agent。
//
// 用法（在 backend 目录执行）：
//
//	go run ./cmd/delete-life-agents -ids ba643f47,ec31eb00
//	go run ./cmd/delete-life-agents -ids ba643f47,ec31eb00 -apply
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

func main() {
	idsArg := flag.String("ids", "", "逗号分隔的 profile id 或 id 前缀")
	namesArg := flag.String("names", "", "逗号分隔的 display_name 精确匹配")
	apply := flag.Bool("apply", false, "执行删除；默认 dry-run")
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

	targets, err := findProfiles(splitCSV(*idsArg), splitCSV(*namesArg))
	if err != nil {
		log.Fatal(err)
	}
	if len(targets) == 0 {
		fmt.Println("no matching Life Agents")
		return
	}

	fmt.Printf("matched %d Life Agents:\n", len(targets))
	for _, p := range targets {
		fmt.Printf("- %s (%s) user=%s featured=%s rank=%s\n", p.DisplayName, shortID(p.ID), p.UserID, ptrVal(p.FeaturedCollection), intPtrVal(p.FeaturedRank))
	}
	if !*apply {
		fmt.Println("\ndry-run only; pass -apply to delete")
		return
	}

	for _, p := range targets {
		if err := yantuseed.DeleteLifeAgentProfileCascade(db.DB, p.ID); err != nil {
			log.Printf("delete failed %s (%s): %v", p.DisplayName, p.ID, err)
			continue
		}
		fmt.Printf("deleted %s (%s)\n", p.DisplayName, shortID(p.ID))
	}
}

func findProfiles(ids, names []string) ([]models.LifeAgentProfile, error) {
	seen := map[string]bool{}
	var out []models.LifeAgentProfile
	for _, id := range ids {
		id = strings.TrimSpace(id)
		if id == "" {
			continue
		}
		var matches []models.LifeAgentProfile
		if err := db.DB.Where("id LIKE ?", id+"%").Find(&matches).Error; err != nil {
			return nil, err
		}
		if len(matches) != 1 {
			return nil, fmt.Errorf("id prefix %q matched %d profiles; expected exactly 1", id, len(matches))
		}
		if !seen[matches[0].ID] {
			seen[matches[0].ID] = true
			out = append(out, matches[0])
		}
	}
	for _, name := range names {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		var matches []models.LifeAgentProfile
		if err := db.DB.Where("display_name = ?", name).Find(&matches).Error; err != nil {
			return nil, err
		}
		if len(matches) == 0 {
			return nil, fmt.Errorf("name %q matched 0 profiles", name)
		}
		for _, p := range matches {
			if !seen[p.ID] {
				seen[p.ID] = true
				out = append(out, p)
			}
		}
	}
	return out, nil
}

func splitCSV(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func shortID(id string) string {
	if len(id) <= 8 {
		return id
	}
	return id[:8]
}

func ptrVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func intPtrVal(p *int) string {
	if p == nil {
		return ""
	}
	return fmt.Sprint(*p)
}
