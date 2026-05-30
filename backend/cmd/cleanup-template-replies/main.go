// 删除 post_agent_replies 中旧的模板回复（generateSimpleReply 遗留），并修正 posts.comments_count。
//
// 用法:
//   go run ./cmd/cleanup-template-replies              # 生产库 dry-run
//   go run ./cmd/cleanup-template-replies -apply       # 实际删除
//   go run ./cmd/cleanup-template-replies -regenerate # 删除后为受影响帖子重新触发 LLM 回复
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/handler"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

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

func isTemplateReply(content string) bool {
	return strings.Contains(content, "很感兴趣，想听听更多细节") ||
		strings.Contains(content, "看到了你的分享，想和你深入聊聊这个话题")
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
	apply := flag.Bool("apply", false, "actually delete template replies (default: dry-run)")
	regenerate := flag.Bool("regenerate", false, "after cleanup, trigger LLM replies for affected posts")
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

	var replies []models.PostAgentReply
	if err := db.DB.Order("created_at ASC").Find(&replies).Error; err != nil {
		log.Fatalf("query replies failed: %v", err)
	}

	var toDelete []models.PostAgentReply
	for _, r := range replies {
		if isTemplateReply(r.Content) {
			toDelete = append(toDelete, r)
		}
	}

	if len(toDelete) == 0 {
		fmt.Println("no template replies found")
		return
	}

	fmt.Printf("found %d template replies (of %d total agent replies)\n", len(toDelete), len(replies))
	postIDs := make(map[string]string) // postID -> content preview
	for _, r := range toDelete {
		preview := strings.TrimSpace(r.Content)
		if len([]rune(preview)) > 60 {
			preview = string([]rune(preview)[:60]) + "…"
		}
		fmt.Printf("  [%s] agent=%s post=%s\n    %q\n", r.ID[:8], r.DisplayName, r.PostID[:8], preview)
		postIDs[r.PostID] = ""
	}

	if !*apply {
		fmt.Println("\ndry-run only; pass -apply to delete")
		return
	}

	ids := make([]string, len(toDelete))
	for i, r := range toDelete {
		ids[i] = r.ID
	}
	if err := db.DB.Delete(&models.PostAgentReply{}, "id IN ?", ids).Error; err != nil {
		log.Fatalf("delete failed: %v", err)
	}
	fmt.Printf("deleted %d template replies\n", len(ids))

	for postID := range postIDs {
		if err := recountComments(db.DB, postID); err != nil {
			log.Printf("recount failed for post %s: %v", postID, err)
		}
	}
	fmt.Printf("updated comments_count for %d posts\n", len(postIDs))

	if !*regenerate {
		return
	}

	cfg := config.Load()
	if cfg == nil || cfg.OpenAIApiKey == "" {
		log.Fatal("OPENAI_API_KEY not set; cannot regenerate replies")
	}

	var posts []struct {
		ID      string
		Content string
	}
	if err := db.DB.Table("posts").Select("id, content").Where("id IN ?", keys(postIDs)).Find(&posts).Error; err != nil {
		log.Fatalf("load posts failed: %v", err)
	}

	total := 0
	for _, p := range posts {
		n, err := handler.TriggerAgentRepliesSync(p.ID, p.Content)
		if err != nil {
			log.Printf("regenerate post=%s error: %v", p.ID, err)
			continue
		}
		total += n
		fmt.Printf("regenerated post=%s replies=%d\n", p.ID[:8], n)
	}
	fmt.Printf("regenerated %d LLM replies for %d posts\n", total, len(posts))
}

func keys(m map[string]string) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}
