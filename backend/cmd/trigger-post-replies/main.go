// 批量为帖子触发 Agent 自动回复（与发帖 API 相同逻辑）。
// 用法:
//   go run ./cmd/trigger-post-replies
//   go run ./cmd/trigger-post-replies -limit=5
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/handler"
	"github.com/joho/godotenv"
)

type postRow struct {
	ID      string
	Content string
}

func loadProductionDSN() (string, error) {
	for _, path := range []string{"docker-compose.production.yml", "../docker-compose.production.yml", "../../docker-compose.production.yml"} {
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}
		re := regexp.MustCompile(`DATABASE_URL:\s*\$\{DATABASE_URL:-([^}]+)\}`)
		m := re.FindSubmatch(data)
		if len(m) < 2 {
			continue
		}
		return string(m[1]), nil
	}
	return "", fmt.Errorf("production DATABASE_URL not found in docker-compose.production.yml")
}

func main() {
	limit := flag.Int("limit", 0, "max posts to process (0 = all)")
	onlyMissing := flag.Bool("only-missing", true, "only posts without agent replies")
	production := flag.Bool("production", true, "use production DATABASE_URL from docker-compose.production.yml")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

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

	cfg := config.Load()
	if cfg == nil || cfg.OpenAIApiKey == "" {
		log.Println("warning: OPENAI_API_KEY not set; agent replies will be skipped")
	}

	var posts []postRow
	q := db.DB.Table("posts").Select("posts.id, posts.content").Order("posts.created_at ASC")
	if *onlyMissing {
		q = q.Joins("LEFT JOIN post_agent_replies par ON par.post_id = posts.id").
			Group("posts.id, posts.content").
			Having("COUNT(par.id) = 0")
	}
	if *limit > 0 {
		q = q.Limit(*limit)
	}
	if err := q.Scan(&posts).Error; err != nil {
		log.Fatalf("query posts failed: %v", err)
	}

	if len(posts) == 0 {
		fmt.Println("no posts to process")
		return
	}

	fmt.Printf("processing %d posts...\n", len(posts))
	totalReplies := 0
	for i, p := range posts {
		start := time.Now()
		n, err := handler.TriggerAgentRepliesSync(p.ID, p.Content)
		if err != nil {
			log.Printf("[%d/%d] post=%s error: %v", i+1, len(posts), p.ID, err)
			continue
		}
		totalReplies += n
		preview := strings.TrimSpace(p.Content)
		if len([]rune(preview)) > 40 {
			preview = string([]rune(preview)[:40]) + "…"
		}
		fmt.Printf("[%d/%d] replies=%d elapsed=%s content=%q\n", i+1, len(posts), n, time.Since(start).Round(time.Millisecond), preview)
	}
	fmt.Printf("done: posts=%d agent_replies=%d\n", len(posts), totalReplies)
}
