// list-featured-copy：只读列出精选 Agent 的门面文案（欢迎语 + 示例问题）。
//
// 用途：把每个精选 Agent 当前库里的 welcome_message / sample_questions 打印出来，
// 方便核对、复制或导出。纯只读，不写任何字段。
//
// 默认列出所有「精选」Agent：featured_rank 非空 或 featured_collection 非空。
// 也可用 -names 指定昵称（逗号分隔；单个昵称内多个候选名用 | 分隔）。
//
// 用法（在 backend 目录下运行）：
//
//	go run ./cmd/list-featured-copy                       # 列出全部精选 Agent
//	go run ./cmd/list-featured-copy -collection chuangye  # 只看某个合集
//	go run ./cmd/list-featured-copy -names "凌晨四点半,豆奶_红豆"
//	go run ./cmd/list-featured-copy -json                 # 输出 JSON，方便程序消费
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

type item struct {
	DisplayName     string   `json:"display_name"`
	Collection      string   `json:"featured_collection,omitempty"`
	Rank            *int     `json:"featured_rank,omitempty"`
	Headline        string   `json:"headline"`
	ShortBio        string   `json:"short_bio"`
	WelcomeMessage  string   `json:"welcome_message"`
	SampleQuestions []string `json:"sample_questions"`
}

func main() {
	collection := flag.String("collection", "", "只列出该合集（featured_collection）的 Agent；留空=全部精选")
	namesArg := flag.String("names", "", "逗号分隔的昵称（display_name）；单个昵称内多候选用 | 分隔。指定后忽略 -collection")
	asJSON := flag.Bool("json", false, "以 JSON 数组输出（默认为人读文本）")
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

	var profiles []models.LifeAgentProfile
	switch {
	case strings.TrimSpace(*namesArg) != "":
		profiles = loadByNames(*namesArg)
	case strings.TrimSpace(*collection) != "":
		db.DB.Where("featured_collection = ?", strings.TrimSpace(*collection)).Find(&profiles)
	default:
		db.DB.Where("featured_rank IS NOT NULL OR featured_collection IS NOT NULL").Find(&profiles)
	}

	// 排序：先按合集（全站精选——空合集——排在最前），再按 rank，最后按昵称兜底。
	sort.SliceStable(profiles, func(i, j int) bool {
		ci, cj := ptrVal(profiles[i].FeaturedCollection), ptrVal(profiles[j].FeaturedCollection)
		if ci != cj {
			return ci < cj
		}
		ri, rj := intVal(profiles[i].FeaturedRank), intVal(profiles[j].FeaturedRank)
		if ri != rj {
			return ri < rj
		}
		return profiles[i].DisplayName < profiles[j].DisplayName
	})

	items := make([]item, 0, len(profiles))
	for _, p := range profiles {
		items = append(items, item{
			DisplayName:     p.DisplayName,
			Collection:      ptrVal(p.FeaturedCollection),
			Rank:            p.FeaturedRank,
			Headline:        p.Headline,
			ShortBio:        p.ShortBio,
			WelcomeMessage:  p.WelcomeMessage,
			SampleQuestions: []string(p.SampleQuestions),
		})
	}

	if *asJSON {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		enc.SetEscapeHTML(false)
		if err := enc.Encode(items); err != nil {
			log.Fatalf("json encode failed: %v", err)
		}
		return
	}

	fmt.Printf("=== 精选 Agent 文案（共 %d 个）===\n", len(items))
	for i, it := range items {
		coll := it.Collection
		if coll == "" {
			coll = "全站精选"
		}
		rank := "-"
		if it.Rank != nil {
			rank = fmt.Sprintf("%d", *it.Rank)
		}
		fmt.Printf("\n#%d  %s  [合集 %s · rank %s]\n", i+1, it.DisplayName, coll, rank)
		fmt.Printf("  标题：%s\n", it.Headline)
		fmt.Printf("  简介：%s\n", it.ShortBio)
		fmt.Printf("  欢迎语：%s\n", it.WelcomeMessage)
		if len(it.SampleQuestions) == 0 {
			fmt.Printf("  示例问题：（无）\n")
		} else {
			fmt.Printf("  示例问题：\n")
			for _, q := range it.SampleQuestions {
				fmt.Printf("    - %s\n", q)
			}
		}
	}
}

// loadByNames 按昵称查；单个昵称内可用 | 分隔多个候选名，命中第一个即可。
func loadByNames(arg string) []models.LifeAgentProfile {
	groups := strings.Split(arg, ",")
	out := make([]models.LifeAgentProfile, 0, len(groups))
	for _, g := range groups {
		candidates := make([]string, 0)
		for _, c := range strings.Split(g, "|") {
			if t := strings.TrimSpace(c); t != "" {
				candidates = append(candidates, t)
			}
		}
		if len(candidates) == 0 {
			continue
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("display_name IN ?", candidates).First(&p).Error; err != nil {
			fmt.Printf("  ⚠ 未找到 Agent：%s（跳过）\n", strings.Join(candidates, "|"))
			continue
		}
		out = append(out, p)
	}
	return out
}

func ptrVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func intVal(p *int) int {
	if p == nil {
		return 1 << 30 // nil rank 排到最后
	}
	return *p
}
