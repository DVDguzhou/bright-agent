// 仅写入四批播客人生 Agent（59 条），不触碰飞跃手册等其它 yantuseed 档案。
//
// 在 backend 目录执行：
//
//	go run ./scripts/seed_podcast_text.go
package main

import (
	"errors"
	"fmt"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	pw := os.Getenv("YANTU_SPLIT_PASSWORD")
	if pw == "" {
		pw = "YantuLa2026!"
	}

	var importUser models.User
	hasImport := db.DB.Where("email = ?", yantuseed.ImportUserEmail).First(&importUser).Error == nil

	cover := ""
	profiles := yantuseed.PodcastProfiles()
	base := yantuseed.PodcastProfileStartIndex()

	for i, p := range profiles {
		idx := base + i
		owner, err := yantuseed.EnsureSplitUserForIndex(idx, pw)
		if err != nil {
			log.Fatalf("ensure user index %d: %v", idx, err)
		}
		if hasImport && owner.ID != importUser.ID {
			var prof models.LifeAgentProfile
			if err := db.DB.Where("user_id = ? AND display_name = ?", importUser.ID, p.DisplayName).First(&prof).Error; err == nil {
				if err := db.DB.Model(&prof).Update("user_id", owner.ID).Error; err != nil {
					log.Printf("[warn] 迁移档案 %q 离开导入账号失败: %v", p.DisplayName, err)
				} else {
					_ = db.DB.Model(&models.LifeAgentCoEditState{}).Where("profile_id = ?", prof.ID).Update("user_id", owner.ID)
					fmt.Printf("已把档案 %q 从导入账号迁到 %s\n", p.DisplayName, owner.Email)
				}
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("[warn] 查询导入账号下档案 %q: %v", p.DisplayName, err)
			}
		}
		if err := yantuseed.UpsertProfile(owner.ID, cover, p); err != nil {
			log.Printf("fail %s: %v", p.DisplayName, err)
		}
	}
	fmt.Printf("seed_podcast_text done（%d 条播客档案；口令见 YANTU_SPLIT_PASSWORD / 文档）\n", len(profiles))
}
