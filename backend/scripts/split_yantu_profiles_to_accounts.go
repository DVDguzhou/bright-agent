// 将仍挂在 yantu-import@demo.com 下的研途/飞跃手册人生 Agent，按 display_name 逐条迁到独立登录账号。
// 邮箱列表与 docs/YANTU_ROLE_MODEL_AGENT_ACCOUNTS.md 中「新登录邮箱」一致，顺序与 yantuseed.Profiles() 一致。
//
// 在 backend 目录执行：
//
//	export DATABASE_URL='...'
//	export YANTU_SPLIT_PASSWORD='YantuLa2026!'   # 可选，默认即此
//	go run ./scripts/split_yantu_profiles_to_accounts.go
//
// 仅打印不写入（bash）：
//
//	YANTU_SPLIT_DRY_RUN=1 go run ./scripts/split_yantu_profiles_to_accounts.go
//
// Windows PowerShell：
//
//	$env:YANTU_SPLIT_DRY_RUN = "1"; go run ./scripts/split_yantu_profiles_to_accounts.go
//	Remove-Item Env:YANTU_SPLIT_DRY_RUN -ErrorAction SilentlyContinue
//	go run ./scripts/split_yantu_profiles_to_accounts.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func strPtr(s string) *string { return &s }

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dry := os.Getenv("YANTU_SPLIT_DRY_RUN") == "1" || os.Getenv("YANTU_SPLIT_DRY_RUN") == "true"
	pw := os.Getenv("YANTU_SPLIT_PASSWORD")
	if pw == "" {
		pw = "YantuLa2026!"
	}

	profiles := yantuseed.Profiles()
	if len(yantuseed.SplitAccountEmails) != len(profiles) {
		log.Fatalf("SplitAccountEmails 数量 %d 与 Profiles() %d 不一致，请同步文档与 yantuseed/split_account_emails.go", len(yantuseed.SplitAccountEmails), len(profiles))
	}

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	var importUser models.User
	if err := db.DB.Where("email = ?", yantuseed.ImportUserEmail).First(&importUser).Error; err != nil {
		log.Fatalf("未找到导入账号 %s：%v", yantuseed.ImportUserEmail, err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	if err != nil {
		log.Fatal("bcrypt:", err)
	}
	hashStr := string(hash)

	for i, p := range profiles {
		email := yantuseed.SplitAccountEmails[i]
		var prof models.LifeAgentProfile
		q := db.DB.Where("user_id = ? AND display_name = ?", importUser.ID, p.DisplayName)
		if err := q.First(&prof).Error; err != nil {
			log.Printf("[跳过] 未找到档案 import_user + display_name=%q（可能已迁走或名称不一致）", p.DisplayName)
			continue
		}

		var u models.User
		err := db.DB.Where("email = ?", email).First(&u).Error
		if err != nil {
			u = models.User{
				ID:        models.GenID(),
				Email:     email,
				Password:  hashStr,
				Name:      strPtr(p.DisplayName),
				RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": false},
			}
			if dry {
				log.Printf("[dry-run] 将创建用户 %s 并把 profile %s (%s) 的 user_id 指向该用户", email, prof.ID, p.DisplayName)
				continue
			}
			if err := db.DB.Create(&u).Error; err != nil {
				log.Printf("[失败] 创建用户 %s: %v", email, err)
				continue
			}
			log.Printf("已创建用户 %s", email)
		} else {
			if u.ID == importUser.ID {
				log.Printf("[跳过] 邮箱 %s 仍指向导入账号，请换邮箱", email)
				continue
			}
			if dry {
				log.Printf("[dry-run] 用户已存在 %s，将把 profile %s 迁到其下", email, prof.ID)
			}
		}

		if dry {
			continue
		}
		if prof.UserID == u.ID {
			log.Printf("[已是] %s 已在用户 %s 下", p.DisplayName, email)
			continue
		}
		if err := db.DB.Model(&prof).Update("user_id", u.ID).Error; err != nil {
			log.Printf("[失败] 更新 profile %s user_id: %v", prof.ID, err)
			continue
		}
		log.Printf("已迁移 %q -> %s", p.DisplayName, email)
	}

	if dry {
		fmt.Println("split_yantu_profiles_to_accounts dry-run 结束（未写入数据库）")
	} else {
		fmt.Println("split_yantu_profiles_to_accounts 完成")
	}
}
