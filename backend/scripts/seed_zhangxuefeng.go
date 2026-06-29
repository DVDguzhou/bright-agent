// Seed only the distilled Zhang Xuefeng Agent. It never iterates the legacy
// yantuseed profile list, so deleted Agents are not recreated.
//
// Run from backend:
//
//	go run ./scripts/seed_zhangxuefeng.go
//	go run ./scripts/seed_zhangxuefeng.go -reset-password   # 已有账号时强制重置为默认/环境变量密码
package main

import (
	"flag"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

const ownerEmail = "agent_zxf_decision@163.com"

func main() {
	resetPassword := flag.Bool("reset-password", true, "将登录密码重置为 ZHANGXUEFENG_AGENT_PASSWORD 或默认值")
	flag.Parse()

	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn: ", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init: ", err)
	}

	password := os.Getenv("ZHANGXUEFENG_AGENT_PASSWORD")
	if password == "" {
		password = "ZhangXuefeng2026!"
	}
	profile := yantuseed.ZhangXuefengDecisionProfile()
	owner, err := yantuseed.EnsureAgentUser(ownerEmail, profile.DisplayName, password)
	if err != nil {
		log.Fatal("ensure owner: ", err)
	}
	if *resetPassword {
		if err := yantuseed.SetAgentUserPassword(ownerEmail, password); err != nil {
			log.Fatal("reset password: ", err)
		}
		// 与其他 Agent 归属账号一致，允许管理名下人生 Agent。
		if err := db.DB.Model(owner).Update("role_flags", models.JSONMap{"is_buyer": true, "is_seller": true}).Error; err != nil {
			log.Fatal("update role flags: ", err)
		}
		log.Printf("reset password for %s", ownerEmail)
	}
	if err := yantuseed.UpsertProfile(owner.ID, "", profile); err != nil {
		log.Fatal("upsert profile: ", err)
	}
	log.Printf("seeded only %q under %s (login password: %s)", profile.DisplayName, ownerEmail, password)
}
