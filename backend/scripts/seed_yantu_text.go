// 将仓库内置的研途榜样纯文本（internal/yantuseed）写入人生 Agent 与知识库。
// 不依赖 HTML 文件，适合直接随代码部署到服务器。
//
// 每条档案归属 **docs/YANTU_ROLE_MODEL_AGENT_ACCOUNTS.md** 中对应 @163.com 用户（与 SplitAccountEmails 顺序一致），
// 不再默认全部挂在 yantu-import@demo.com。若库里某条仍在导入账号下，本脚本会先改 user_id 再 upsert。
// 新建拆分用户口令：环境变量 YANTU_SPLIT_PASSWORD，默认 YantuLa2026!（与 ensure/split 脚本一致）。
//
// 在 backend 目录执行；会自动尝试加载 .env 与 ../.env。
// 连接串优先级：环境变量 DATABASE_URL（Go DSN 或 mysql://）> DATABASE_PRISMA_URL（mysql://）> 默认本地。
//
//	go run ./scripts/seed_yantu_text.go
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

	// cover 传空串时，UpsertProfile 会为每个 display_name 写入稳定 Unsplash 外链封面（见 internal/yantuseed/yantu_cover_photos.go）。
	// 若要用预设键，传入非空 preset，并确保 public 内已有对应 PNG 且已同步 lifeAgentShippedCoverPresetPNGs。
	cover := ""
	profiles := yantuseed.Profiles()
	for i, p := range profiles {
		owner, err := yantuseed.EnsureSplitUserForIndex(i, pw)
		if err != nil {
			log.Fatalf("ensure user index %d: %v", i, err)
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
	fmt.Println("seed_yantu_text done（63 条档案已归属各 @163.com；口令见 YANTU_SPLIT_PASSWORD / 文档）")
}
