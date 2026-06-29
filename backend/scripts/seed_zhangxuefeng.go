// Seed only the distilled Zhang Xuefeng Agent. It never iterates the legacy
// yantuseed profile list, so deleted Agents are not recreated.
//
// Run from backend:
//
//	go run ./scripts/seed_zhangxuefeng.go
package main

import (
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

const ownerEmail = "agent_zxf_decision@163.com"

func main() {
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
	if err := yantuseed.UpsertProfile(owner.ID, "", profile); err != nil {
		log.Fatal("upsert profile: ", err)
	}
	log.Printf("seeded only %q under %s", profile.DisplayName, ownerEmail)
}
