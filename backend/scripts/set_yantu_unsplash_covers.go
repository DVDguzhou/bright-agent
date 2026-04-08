// 将研途榜样系列档案（internal/yantuseed.Profiles 中的 display_name）批量写入 Unsplash 外链封面，
// 并清空 cover_preset_key，便于已有数据库一键补图。
//
// 在 backend 目录执行（需 DATABASE_URL 等，与 seed_yantu_text 相同）：
//
//	go run ./scripts/set_yantu_unsplash_covers.go
//
// 仅打印 SQL 不写入：YANTU_COVERS_DRY_RUN=1 go run ./scripts/set_yantu_unsplash_covers.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dry := os.Getenv("YANTU_COVERS_DRY_RUN") == "1"

	if !dry {
		dsn, err := db.DSNFromEnv()
		if err != nil {
			log.Fatal("dsn:", err)
		}
		if err := db.Init(dsn); err != nil {
			log.Fatal("db init:", err)
		}
	}

	names := make(map[string]struct{})
	for _, p := range yantuseed.Profiles() {
		names[p.DisplayName] = struct{}{}
	}

	for dn := range names {
		u := yantuseed.YantuSeedCoverURL(dn)
		if dry {
			fmt.Printf("[dry-run] %q -> %s\n", dn, u)
			continue
		}
		res := db.DB.Model(&models.LifeAgentProfile{}).
			Where("display_name = ?", dn).
			Updates(map[string]interface{}{
				"cover_image_url":  u,
				"cover_preset_key": nil,
			})
		if res.Error != nil {
			log.Printf("update %q: %v", dn, res.Error)
			continue
		}
		if res.RowsAffected > 0 {
			fmt.Println("updated", dn, "rows=", res.RowsAffected)
		} else {
			fmt.Println("skip (no row)", dn)
		}
	}
	fmt.Println("set_yantu_unsplash_covers done, profiles in seed:", len(names))
}
