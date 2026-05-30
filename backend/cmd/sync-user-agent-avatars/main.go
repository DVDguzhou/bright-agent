// 批量将 users.avatar_url 与名下主 Agent 封面对齐。
// 用法: go run ./cmd/sync-user-agent-avatars -production
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

const lifeAgentDefaultCoverURL = "/life-agent-cover-presets/default-cover.png"

func loadProductionDSN() (string, error) {
	for _, path := range []string{"docker-compose.production.yml", "../docker-compose.production.yml"} {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		re := regexp.MustCompile(`DATABASE_URL:\s*\$\{DATABASE_URL:-([^}]+)\}`)
		m := re.FindSubmatch(data)
		if len(m) >= 2 {
			return string(m[1]), nil
		}
	}
	return "", fmt.Errorf("production DATABASE_URL not found")
}

func agentCoverURL(p *models.LifeAgentProfile) string {
	if p.CoverImageURL != nil && *p.CoverImageURL != "" {
		return *p.CoverImageURL
	}
	return lifeAgentDefaultCoverURL
}

func main() {
	production := flag.Bool("production", true, "use production DATABASE_URL from docker-compose.production.yml")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	dsn := os.Getenv("DATABASE_URL")
	if *production {
		prodDSN, err := loadProductionDSN()
		if err != nil {
			log.Fatal(err)
		}
		dsn = prodDSN
	}
	if dsn == "" {
		log.Fatal("DATABASE_URL is empty")
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	var agents []models.LifeAgentProfile
	if err := db.DB.Order("published DESC, updated_at DESC").Find(&agents).Error; err != nil {
		log.Fatalf("query agents failed: %v", err)
	}

	coverByUser := make(map[string]string, len(agents))
	for _, a := range agents {
		if _, ok := coverByUser[a.UserID]; ok {
			continue
		}
		coverByUser[a.UserID] = agentCoverURL(&a)
	}

	synced := 0
	for userID, cover := range coverByUser {
		if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", cover).Error; err != nil {
			log.Printf("user=%s error: %v", userID, err)
			continue
		}
		synced++
	}

	var userIDs []string
	if err := db.DB.Model(&models.User{}).Pluck("id", &userIDs).Error; err != nil {
		log.Fatalf("query users failed: %v", err)
	}
	cleared := 0
	for _, userID := range userIDs {
		if _, ok := coverByUser[userID]; ok {
			continue
		}
		if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", nil).Error; err != nil {
			log.Printf("clear user=%s error: %v", userID, err)
			continue
		}
		cleared++
	}

	fmt.Printf("done: agent_owners=%d synced=%d no_agent_cleared=%d\n", len(coverByUser), synced, cleared)
}
