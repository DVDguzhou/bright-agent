// audit-copy：只读审计已发布 Agent 的门面文案数据质量。
//
// 扫 headline / short_bio / welcome_message / sample_questions，标出：
//   - 未填的模板占位符（学校名称 / 项目名称 / 录取学校名 / 录取公司名 / 起一个标题 / xx）
//   - markdown 链接/转义残渣（](  \[  \]  http）
//   - 脱敏注入的下划线昵称残渣（如 薯条7听播客、荔枝_棒子 这类「中文_中文/数字」拼接）——启发式，可能有误报
//
// 纯只读，不改任何数据。用来评估「卡片/详情页乱码」问题的规模，决定是隐藏还是批量修。
//
// 用法（backend 目录）：
//   go run ./cmd/audit-copy            # 人读汇总 + 明细
//   go run ./cmd/audit-copy -featured  # 只看精选（featured_collection 非空）
//   go run ./cmd/audit-copy -limit 0   # 不截断明细
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

var placeholderMarkers = []string{
	"学校名称", "项目名称", "录取学校名", "录取公司名", "起一个标题",
	"录入信息", "在这里", "xxxx", "xxx", "xx",
}

var markdownMarkers = []string{"](", "\\[", "\\]", "http"}

// 脱敏注入残渣：中文/字母 + 下划线 + 中文/字母/数字，且不是正常词。启发式。
var underscoreNameRe = regexp.MustCompile(`[\p{Han}A-Za-z]_[\p{Han}A-Za-z0-9]`)

type issue struct {
	id, name, field, sample string
	kinds                   []string
}

func main() {
	featuredOnly := flag.Bool("featured", false, "只审计 featured_collection 非空的 Agent")
	limit := flag.Int("limit", 80, "每类明细最多打印多少条（0=不截断）")
	flag.Parse()

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

	q := db.DB.Where("published = ?", true)
	if *featuredOnly {
		q = q.Where("featured_collection IS NOT NULL")
	}
	var profiles []models.LifeAgentProfile
	q.Find(&profiles)

	var issues []issue
	kindCount := map[string]int{}
	dirtyAgents := map[string]bool{}

	check := func(p models.LifeAgentProfile, field, text string) {
		text = strings.TrimSpace(text)
		if text == "" {
			return
		}
		var kinds []string
		if hasAny(text, placeholderMarkers) {
			kinds = append(kinds, "占位符")
		}
		if hasAny(text, markdownMarkers) {
			kinds = append(kinds, "markdown残渣")
		}
		if underscoreNameRe.MatchString(text) {
			kinds = append(kinds, "下划线残渣?")
		}
		if len(kinds) == 0 {
			return
		}
		for _, k := range kinds {
			kindCount[k]++
		}
		dirtyAgents[p.ID] = true
		issues = append(issues, issue{
			id: p.ID, name: p.DisplayName, field: field,
			sample: truncate(text, 50), kinds: kinds,
		})
	}

	for _, p := range profiles {
		check(p, "标题", p.Headline)
		check(p, "简介", p.ShortBio)
		check(p, "欢迎语", p.WelcomeMessage)
		for _, sq := range []string(p.SampleQuestions) {
			check(p, "示例问题", sq)
		}
	}

	fmt.Printf("=== 文案数据审计（已发布%s共 %d 个 Agent）===\n",
		map[bool]string{true: "·精选", false: ""}[*featuredOnly], len(profiles))
	fmt.Printf("有问题的 Agent：%d 个\n", len(dirtyAgents))
	fmt.Printf("命中字段次数：占位符 %d · markdown残渣 %d · 下划线残渣? %d\n\n",
		kindCount["占位符"], kindCount["markdown残渣"], kindCount["下划线残渣?"])

	// 标题/简介里的问题最显眼，优先列；示例问题数量多，单独折叠计数
	sort.SliceStable(issues, func(i, j int) bool {
		rank := func(f string) int {
			switch f {
			case "标题":
				return 0
			case "简介":
				return 1
			case "欢迎语":
				return 2
			default:
				return 3
			}
		}
		return rank(issues[i].field) < rank(issues[j].field)
	})

	shown := 0
	for _, it := range issues {
		if it.field == "示例问题" {
			continue // 示例问题展示层已过滤，这里不逐条刷屏
		}
		if *limit > 0 && shown >= *limit {
			fmt.Printf("…（标题/简介/欢迎语问题还有更多，-limit 0 看全部）\n")
			break
		}
		fmt.Printf("  [%s] %-16s %v  «%s»\n", it.field, truncate(it.name, 16), it.kinds, it.sample)
		shown++
	}
}

func hasAny(s string, subs []string) bool {
	for _, sub := range subs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n]) + "…"
}
