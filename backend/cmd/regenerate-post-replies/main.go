// 批量删除帖子下的 Agent 自动回复并重新生成（保留用户真实评论）。
//
// 用法:
//   go run ./cmd/regenerate-post-replies/              # dry-run
//   go run ./cmd/regenerate-post-replies/ -apply       # 执行
//   go run ./cmd/regenerate-post-replies/ -apply -limit=3
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
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
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

func recountComments(tx *gorm.DB, postID string) error {
	var userComments int64
	if err := tx.Model(&models.PostComment{}).Where("post_id = ?", postID).Count(&userComments).Error; err != nil {
		return err
	}
	var agentReplies int64
	if err := tx.Model(&models.PostAgentReply{}).Where("post_id = ?", postID).Count(&agentReplies).Error; err != nil {
		return err
	}
	total := int(userComments + agentReplies)
	return tx.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", total).Error
}

func main() {
	apply := flag.Bool("apply", false, "delete old agent replies and regenerate")
	production := flag.Bool("production", true, "use production DATABASE_URL from docker-compose.production.yml")
	limit := flag.Int("limit", 0, "max posts to process (0 = all)")
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
	if *apply && (cfg == nil || cfg.OpenAIApiKey == "") {
		log.Fatal("OPENAI_API_KEY not set; cannot regenerate replies")
	}

	var posts []postRow
	q := db.DB.Table("posts").Select("posts.id, posts.content").Order("posts.created_at ASC")
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

	var totalOld int64
	db.DB.Model(&models.PostAgentReply{}).Count(&totalOld)
	fmt.Printf("posts=%d existing_agent_replies=%d apply=%v\n", len(posts), totalOld, *apply)

	deletedTotal := 0
	createdTotal := 0
	for i, p := range posts {
		var oldCount int64
		db.DB.Model(&models.PostAgentReply{}).Where("post_id = ?", p.ID).Count(&oldCount)

		preview := strings.TrimSpace(p.Content)
		if len([]rune(preview)) > 40 {
			preview = string([]rune(preview)[:40]) + "…"
		}

		if !*apply {
			fmt.Printf("[%d/%d] would delete=%d post=%s content=%q\n", i+1, len(posts), oldCount, p.ID[:8], preview)
			continue
		}

		start := time.Now()
		if err := db.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Delete(&models.PostAgentReply{}, "post_id = ?", p.ID).Error; err != nil {
				return err
			}
			return recountComments(tx, p.ID)
		}); err != nil {
			log.Printf("[%d/%d] delete failed post=%s: %v", i+1, len(posts), p.ID, err)
			continue
		}
		deletedTotal += int(oldCount)

		n, err := handler.TriggerAgentRepliesSync(p.ID, p.Content)
		if err != nil {
			log.Printf("[%d/%d] regenerate failed post=%s: %v", i+1, len(posts), p.ID, err)
			continue
		}
		createdTotal += n
		fmt.Printf("[%d/%d] deleted=%d created=%d elapsed=%s content=%q\n",
			i+1, len(posts), oldCount, n, time.Since(start).Round(time.Millisecond), preview)
	}

	if *apply {
		fmt.Printf("done: posts=%d deleted_replies=%d new_replies=%d\n", len(posts), deletedTotal, createdTotal)
	} else {
		fmt.Println("dry-run only; pass -apply to delete and regenerate")
	}
}
