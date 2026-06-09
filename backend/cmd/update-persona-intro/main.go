// update-persona-intro：只更新一个人生 Agent 的「门面字段」，不动知识库与其它字段。
//
// 解决的问题：import-persona 未传 -headline/-short/-welcome 时会套默认模板，
// 导致多个 Agent 简介又水又重复、不像真人。
// 本工具按 display_name 定位档案，只更新你显式提供的字段（留空的字段保持不变），
// -name 可传多个候选 display_name，用 | 分隔，方便兼容已经改过展示名的线上数据。
// 不重刷知识、不覆盖 school/major/author/source 等已有内容。
//
// 用法（在 backend 目录下运行，默认 dry-run，加 -apply 才写库）：
//
//	go run ./cmd/update-persona-intro -name "豆奶_红豆" \
//	  -display "只申港中文的豆奶_红豆" \
//	  -headline "一个拒绝申请季演变得很苦的人" \
//	  -short "申请港校" \
//	  -welcome "我是豆奶_红豆。要不要海投、怎么挑真想去的项目、港中文体验如何，都能聊。" \
//	  -audience "被『申请季必须很苦』裹挟、想要松弛打法的同学。" \
//	  -sample "只申三个项目会不会太冒险？|怎么判断一个项目是不是我真想去的？|港中文读起来什么体验？" \
//	  -apply
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	name := flag.String("name", "", "Agent 昵称（display_name，必填；多个候选用 | 分隔）")
	display := flag.String("display", "", "新的 Agent 昵称（display_name；留空不改）")
	headline := flag.String("headline", "", "一句话简介（留空不改）")
	shortBio := flag.String("short", "", "短简介（留空不改）")
	welcome := flag.String("welcome", "", "欢迎语（留空不改）")
	audience := flag.String("audience", "", "适合人群（留空不改）")
	sample := flag.String("sample", "", "示例问题，竖线 | 分隔（留空不改；传 \"-\" 可清空）")
	apply := flag.Bool("apply", false, "写入数据库（缺省为 dry-run 预览）")
	flag.Parse()

	if strings.TrimSpace(*name) == "" {
		log.Fatal("必须提供 -name")
	}

	updates := map[string]any{}
	if v := strings.TrimSpace(*display); v != "" {
		updates["display_name"] = truncate(v, 120)
	}
	if v := strings.TrimSpace(*headline); v != "" {
		updates["headline"] = truncate(v, 500)
	}
	if v := strings.TrimSpace(*shortBio); v != "" {
		updates["short_bio"] = truncate(v, 480)
	}
	if v := strings.TrimSpace(*welcome); v != "" {
		updates["welcome_message"] = v
	}
	if v := strings.TrimSpace(*audience); v != "" {
		updates["audience"] = v
	}
	if v := strings.TrimSpace(*sample); v != "" {
		if v == "-" {
			updates["sample_questions"] = models.JSONArray{}
		} else {
			arr := models.JSONArray{}
			for _, q := range strings.Split(v, "|") {
				if t := strings.TrimSpace(q); t != "" {
					arr = append(arr, t)
				}
			}
			updates["sample_questions"] = arr
		}
	}

	if len(updates) == 0 {
		log.Fatal("没有要更新的字段；至少提供 -display/-headline/-short/-welcome/-audience/-sample 之一")
	}

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	if err := db.Connect(dsn); err != nil {
		log.Fatalf("db connect failed: %v", err)
	}

	names := splitNames(*name)
	var profile models.LifeAgentProfile
	var found bool
	for _, candidate := range names {
		if err := db.DB.Where("display_name = ?", candidate).First(&profile).Error; err == nil {
			found = true
			break
		}
	}
	if !found {
		log.Fatalf("找不到昵称为 %q 的人生 Agent", *name)
	}

	fmt.Printf("=== 更新门面字段 · %s (%s) ===\n", profile.DisplayName, profile.ID)
	for k, v := range updates {
		switch k {
		case "display_name":
			fmt.Printf("  display:   %q → %q\n", profile.DisplayName, v)
		case "headline":
			fmt.Printf("  headline:  %q → %q\n", profile.Headline, v)
		case "short_bio":
			fmt.Printf("  short_bio: %q → %q\n", profile.ShortBio, v)
		case "welcome_message":
			fmt.Printf("  welcome:   %q → %q\n", profile.WelcomeMessage, v)
		case "audience":
			fmt.Printf("  audience:  %q → %q\n", profile.Audience, v)
		case "sample_questions":
			fmt.Printf("  sample:    %v → %v\n", []string(profile.SampleQuestions), v)
		}
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写入。确认无误后加 -apply 执行。")
		return
	}

	if err := db.DB.Model(&profile).Updates(updates).Error; err != nil {
		log.Fatalf("更新失败: %v", err)
	}
	fmt.Printf("\n✓ 已更新 %d 个字段。\n", len(updates))
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}

func splitNames(s string) []string {
	parts := strings.Split(s, "|")
	names := make([]string, 0, len(parts))
	for _, part := range parts {
		if t := strings.TrimSpace(part); t != "" {
			names = append(names, t)
		}
	}
	return names
}
