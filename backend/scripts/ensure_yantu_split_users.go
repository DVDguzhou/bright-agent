// 批量创建研途拆分用 @163.com 登录账号（与 yantuseed.SplitAccountEmails 顺序、
// yantuseed.Profiles() 展示名一一对应）。在「数据只剩研途导入账号」时，请先执行本脚本再跑 split_yantu_profiles_to_accounts。
//
// 在 backend 目录：
//
//	go run ./scripts/ensure_yantu_split_users.go
//
// 口令与拆分脚本一致，默认 YantuLa2026!，可用环境变量 YANTU_SPLIT_PASSWORD 覆盖。
// 仅打印：YANTU_SPLIT_DRY_RUN=1 go run ./scripts/ensure_yantu_split_users.go
//
// 对已存在用户重置密码（谨慎）：YANTU_ENSURE_RESET_PASSWORD=1 go run ./scripts/ensure_yantu_split_users.go
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
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func strPtr(s string) *string { return &s }

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dry := os.Getenv("YANTU_SPLIT_DRY_RUN") == "1" || os.Getenv("YANTU_SPLIT_DRY_RUN") == "true"
	resetPw := os.Getenv("YANTU_ENSURE_RESET_PASSWORD") == "1" || os.Getenv("YANTU_ENSURE_RESET_PASSWORD") == "true"
	pw := os.Getenv("YANTU_SPLIT_PASSWORD")
	if pw == "" {
		pw = "YantuLa2026!"
	}

	profiles := yantuseed.Profiles()
	if len(yantuseed.SplitAccountEmails) != len(profiles) {
		log.Fatalf("SplitAccountEmails 数量 %d 与 Profiles() %d 不一致", len(yantuseed.SplitAccountEmails), len(profiles))
	}

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	if err != nil {
		log.Fatal("bcrypt:", err)
	}
	hashStr := string(hash)

	var importUser models.User
	hasImport := db.DB.Where("email = ?", yantuseed.ImportUserEmail).First(&importUser).Error == nil

	created, skipped, updated := 0, 0, 0
	for i, p := range profiles {
		email := yantuseed.SplitAccountEmails[i]
		var u models.User
		err := db.DB.Where("email = ?", email).First(&u).Error
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Fatalf("查询用户 %s: %v", email, err)
		}
		if err == nil {
			if hasImport && u.ID == importUser.ID {
				log.Printf("[异常] 邮箱 %s 不应指向导入账号，请人工处理", email)
				skipped++
				continue
			}
			if resetPw {
				if dry {
					log.Printf("[dry-run] 将重置密码 %s", email)
					continue
				}
				if err := db.DB.Model(&u).Update("password", hashStr).Error; err != nil {
					log.Printf("[失败] 更新密码 %s: %v", email, err)
					continue
				}
				log.Printf("已重置密码 %s", email)
				updated++
				continue
			}
			skipped++
			continue
		}

		if dry {
			log.Printf("[dry-run] 将创建用户 %s（展示名 %q）", email, p.DisplayName)
			created++
			continue
		}

		u = models.User{
			ID:        models.GenID(),
			Email:     email,
			Password:  hashStr,
			Name:      strPtr(p.DisplayName),
			RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": false},
		}
		if err := db.DB.Create(&u).Error; err != nil {
			log.Printf("[失败] 创建用户 %s: %v", email, err)
			continue
		}
		log.Printf("已创建用户 %s", email)
		created++
	}

	if dry {
		fmt.Printf("ensure_yantu_split_users dry-run：将新建约 %d 个，已存在跳过 %d\n", created, skipped)
	} else {
		fmt.Printf("ensure_yantu_split_users 完成：新建 %d，已存在跳过 %d，重置密码 %d\n", created, skipped, updated)
		fmt.Println("下一步：go run ./scripts/split_yantu_profiles_to_accounts.go（把档案从 yantu-import 迁到上述账号）")
	}
}
