// copy-user-avatar-from-agent：把某个 Agent 的封面复制到指定用户头像（并同步其名下的 Agent 封面）。
//
// 用法（backend 目录）：
//   go run ./cmd/copy-user-avatar-from-agent -source "凌晨四点半" -target-user "Timelord"
//   go run ./cmd/copy-user-avatar-from-agent -source "凌晨四点半" -target-user "Timelord" -apply
package main

import (
	"flag"
	"fmt"
	"log"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

const defaultCoverURL = "/life-agent-cover-presets/default-cover.png"

func resolveCover(p *models.LifeAgentProfile) string {
	if p.CoverImageURL != nil {
		if s := strings.TrimSpace(*p.CoverImageURL); s != "" {
			return s
		}
	}
	if p.CoverPresetKey != nil {
		if k := strings.TrimSpace(*p.CoverPresetKey); k != "" {
			return "/life-agent-cover-presets/" + k + ".png"
		}
	}
	return defaultCoverURL
}

func applyAvatarBinding(userID, coverURL string) error {
	coverURL = strings.TrimSpace(coverURL)
	var userUpdate interface{}
	if coverURL == "" {
		userUpdate = nil
	} else {
		userUpdate = coverURL
	}
	if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", userUpdate).Error; err != nil {
		return err
	}
	updates := map[string]interface{}{
		"cover_preset_key": nil,
	}
	if coverURL == "" {
		updates["cover_image_url"] = nil
	} else {
		updates["cover_image_url"] = coverURL
	}
	return db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", userID).Updates(updates).Error
}

func main() {
	sourceName := flag.String("source", "凌晨四点半", "来源 Agent display_name")
	targetUser := flag.String("target-user", "Timelord", "目标用户 name 字段")
	targetEmail := flag.String("target-email", "", "可选：按邮箱精确匹配目标用户（优先于 target-user）")
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatalf("dsn: %v", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatalf("db init: %v", err)
	}

	var source models.LifeAgentProfile
	if err := db.DB.Where("display_name = ?", strings.TrimSpace(*sourceName)).First(&source).Error; err != nil {
		log.Fatalf("未找到来源 Agent %q: %v", *sourceName, err)
	}
	coverURL := resolveCover(&source)

	var user models.User
	q := db.DB
	if email := strings.TrimSpace(*targetEmail); email != "" {
		if err := q.Where("email = ?", email).First(&user).Error; err != nil {
			log.Fatalf("未找到用户 email=%q: %v", email, err)
		}
	} else {
		name := strings.TrimSpace(*targetUser)
		if name == "" {
			log.Fatal("target-user 不能为空")
		}
		var users []models.User
		if err := q.Where("name = ?", name).Find(&users).Error; err != nil {
			log.Fatalf("查询用户失败: %v", err)
		}
		if len(users) == 0 {
			log.Fatalf("未找到 name=%q 的用户", name)
		}
		if len(users) > 1 {
			log.Fatalf("name=%q 匹配到 %d 个用户，请改用 -target-email 指定", name, len(users))
		}
		user = users[0]
	}

	var agentCount int64
	db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", user.ID).Count(&agentCount)

	fmt.Printf("=== 复制头像 ===\n")
	fmt.Printf("来源 Agent: %s (id=%s)\n", source.DisplayName, source.ID)
	fmt.Printf("封面 URL:   %s\n", coverURL)
	fmt.Printf("目标用户:   %s <%s> (id=%s)\n", ptrStr(user.Name), user.Email, user.ID)
	fmt.Printf("当前头像:   %s\n", ptrStr(user.AvatarURL))
	fmt.Printf("名下 Agent: %d 个（将同步封面）\n", agentCount)

	if !*apply {
		fmt.Println("\n[dry-run] 未写库。加 -apply 执行。")
		return
	}

	if err := applyAvatarBinding(user.ID, coverURL); err != nil {
		log.Fatalf("更新失败: %v", err)
	}
	fmt.Println("\n✓ 已更新用户头像，并同步到其名下的 Agent 封面。")
}

func ptrStr(s *string) string {
	if s == nil {
		return "(null)"
	}
	t := strings.TrimSpace(*s)
	if t == "" {
		return "(empty)"
	}
	return t
}
