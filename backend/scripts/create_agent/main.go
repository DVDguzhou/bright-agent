// 命令行创建人生 Agent
// 用法: go run ./scripts/create_agent/main.go <邮箱> <描述>
// 示例: go run ./scripts/create_agent/main.go seller@demo.com "擅长帮大学生做职业规划的学长，风格直接不绕弯"
package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Fprintf(os.Stderr, "用法: %s <邮箱> <描述>\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "示例: %s seller@demo.com \"擅长帮大学生做职业规划的学长\"\n", os.Args[0])
		os.Exit(1)
	}

	email := strings.TrimSpace(os.Args[1])
	desc := strings.TrimSpace(strings.Join(os.Args[2:], " "))
	if email == "" || desc == "" {
		log.Fatal("邮箱和描述不能为空")
	}

	// 连接数据库
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "guzhoudvd:Hu957843!@tcp(rm-bp176012tca6793kcoo.mysql.rds.aliyuncs.com:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	if err := db.Init(dsn); err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 查找用户
	var user models.User
	if err := db.DB.Where("email = ?", email).First(&user).Error; err != nil {
		log.Fatalf("未找到邮箱为 %s 的用户: %v", email, err)
	}
	fmt.Printf("找到用户: %s (ID: %s)\n", email, user.ID)

	// 从描述中提取显示名称（取前10个字符或第一个逗号/句号前的内容）
	displayName := extractDisplayName(desc)

	profileID := models.GenID()
	p := models.LifeAgentProfile{
		ID:               profileID,
		UserID:           user.ID,
		DisplayName:      displayName,
		Headline:         desc,
		ShortBio:         desc,
		LongBio:          desc,
		Audience:         "所有人",
		WelcomeMessage:   fmt.Sprintf("你好，我是%s，有什么想聊的直接说。", displayName),
		PricePerQuestion: 990,
		ExpertiseTags:    models.JSONArray{},
		SampleQuestions:   models.JSONArray{},
		ForbiddenPhrases: models.JSONArray{},
		ExampleReplies:   models.JSONArray{},
		Regions:          models.JSONArray{},
		Published:        true,
	}
	if err := db.DB.Create(&p).Error; err != nil {
		log.Fatalf("创建 Agent 失败: %v", err)
	}

	// 创建一条默认知识库条目
	db.DB.Create(&models.LifeAgentKnowledgeEntry{
		ID:        models.GenID(),
		ProfileID: profileID,
		Category:  "自我介绍",
		Title:     "关于我",
		Content:   desc,
		Tags:      models.JSONArray{"介绍"},
		SortOrder: 0,
	})

	fmt.Println("========================================")
	fmt.Printf("Agent 创建成功！\n")
	fmt.Printf("  ID:       %s\n", profileID)
	fmt.Printf("  名称:     %s\n", displayName)
	fmt.Printf("  描述:     %s\n", desc)
	fmt.Printf("  所属用户: %s\n", email)
	fmt.Printf("\n编辑地址:   /dashboard/life-agents/%s\n", profileID)
	fmt.Printf("对话调教:   /dashboard/life-agents/%s/co-edit\n", profileID)
	fmt.Println("========================================")
}

func extractDisplayName(desc string) string {
	// 尝试从描述中提取一个简短名称
	// 优先取"的"前面的部分，如 "擅长XX的学长" → "学长"
	runes := []rune(desc)

	// 如果描述很短，直接用
	if len(runes) <= 10 {
		return desc
	}

	// 尝试按标点截断
	for _, sep := range []string{"，", ",", "。", ".", "；", "、"} {
		if idx := strings.Index(desc, sep); idx > 0 {
			part := []rune(desc[:idx])
			if len(part) <= 10 && len(part) >= 1 {
				return string(part)
			}
		}
	}

	// 直接截取前10个字符
	if len(runes) > 10 {
		return string(runes[:10])
	}
	return desc
}
