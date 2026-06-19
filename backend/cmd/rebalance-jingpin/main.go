// rebalance-jingpin：按「双非及同档 × 考研/求职」主滩头策略重排 jingpin 精选、打轴标签、预览主 feed 排序。
//
// 用法（backend 目录）：
//
//	go run ./cmd/rebalance-jingpin              # dry-run，输出三张清单
//	go run ./cmd/rebalance-jingpin -apply       # 写库（全部保持 published=true）
//	go run ./cmd/rebalance-jingpin -out report.json
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
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

type featuredRow struct {
	DisplayName        string   `json:"displayName"`
	FeaturedRank       int      `json:"featuredRank"`
	PathTags           []string `json:"pathTags"`
	IdentityTag        string   `json:"identityTag,omitempty"`
	FeaturedCollection string   `json:"featuredCollection"`
	Tier               string   `json:"tier"`
}

type tagRow struct {
	DisplayName string   `json:"displayName"`
	Identity    string   `json:"identity,omitempty"`
	Paths       []string `json:"paths"`
	ICPHit      bool     `json:"icpHit"`
}

type feedRow struct {
	Rank        int    `json:"rank"`
	DisplayName string `json:"displayName"`
	Identity    string `json:"identity,omitempty"`
	Paths       string `json:"paths"`
	ICPHit      bool   `json:"icpHit"`
	FeaturedRank *int  `json:"featuredRank,omitempty"`
}

type report struct {
	Featured   []featuredRow               `json:"featured"`
	TagMatrix  []tagRow                    `json:"tagMatrix"`
	FeedTop10  []feedRow                   `json:"feedTop10"`
	Gap        yantuseed.FeaturedGapReport `json:"gap"`
	DryRun     bool                        `json:"dryRun"`
	Updated    int                         `json:"updated"`
}

func main() {
	apply := flag.Bool("apply", false, "写入数据库（默认 dry-run）")
	outPath := flag.String("out", "", "可选：将报告写入 JSON 文件")
	maxFeatured := flag.Int("max-featured", 5, "jingpin 精选最多几条")
	flag.Parse()

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")
	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	var profiles []models.LifeAgentProfile
	if err := db.DB.Find(&profiles).Error; err != nil {
		log.Fatal("load profiles:", err)
	}

	published := make([]models.LifeAgentProfile, 0, len(profiles))
	for _, p := range profiles {
		if p.Published {
			published = append(published, p)
		}
	}

	candidates := make([]yantuseed.FeaturedCandidate, 0, len(published))
	facetByID := make(map[string]yantuseed.ProfileFacetInput, len(profiles))
	tagsByID := make(map[string][]string, len(profiles))

	for _, p := range profiles {
		in := yantuseed.ProfileFacetInputFromModel(p)
		facetByID[p.ID] = in
		tagsByID[p.ID] = yantuseed.MergeAxisExpertiseTags([]string(p.ExpertiseTags), in)
	}

	for _, p := range published {
		in := facetByID[p.ID]
		tier := yantuseed.ClassifyFeaturedTier(in)
		if tier == yantuseed.FeaturedNone {
			continue
		}
		paths := yantuseed.InferPathTags(in)
		pathTags := make([]string, 0, len(paths))
		for _, path := range paths {
			pathTags = append(pathTags, yantuseed.AxisPathPrefix+path)
		}
		candidates = append(candidates, yantuseed.FeaturedCandidate{
			ProfileID:   p.ID,
			DisplayName: p.DisplayName,
			Tier:        tier,
			UpdatedAt:   p.UpdatedAt,
			Paths:       pathTags,
			Identity:    identityPrefixed(yantuseed.InferIdentityTag(in.School)),
		})
	}

	selected, gap := yantuseed.SelectJingpinFeatured(candidates, *maxFeatured)
	selectedIDs := make(map[string]int, len(selected))
	for i, c := range selected {
		selectedIDs[c.ProfileID] = i + 1
	}

	rep := report{
		Featured:  make([]featuredRow, 0, len(selected)),
		TagMatrix: make([]tagRow, 0, len(profiles)),
		FeedTop10: []feedRow{},
		Gap:       gap,
		DryRun:    !*apply,
	}

	for i, c := range selected {
		identity := c.Identity
		if identity == "" {
			in := facetByID[c.ProfileID]
			identity = identityPrefixed(yantuseed.InferIdentityTag(in.School))
		}
		rep.Featured = append(rep.Featured, featuredRow{
			DisplayName:        c.DisplayName,
			FeaturedRank:       i + 1,
			PathTags:           c.Paths,
			IdentityTag:        strings.TrimPrefix(identity, yantuseed.AxisIdentityPrefix),
			FeaturedCollection: yantuseed.JingpinCollection,
			Tier:               yantuseed.FeaturedTierLabel(c.Tier),
		})
	}

	for _, p := range published {
		in := facetByID[p.ID]
		identity := yantuseed.InferIdentityTag(in.School)
		paths := yantuseed.InferPathTags(in)
		rep.TagMatrix = append(rep.TagMatrix, tagRow{
			DisplayName: p.DisplayName,
			Identity:    identity,
			Paths:       paths,
			ICPHit:      yantuseed.FeedICPHit(in),
		})
	}
	sort.Slice(rep.TagMatrix, func(i, j int) bool {
		return rep.TagMatrix[i].DisplayName < rep.TagMatrix[j].DisplayName
	})

	feedPreview := append([]models.LifeAgentProfile{}, published...)
	yantuseed.SortProfilesForDiscoverFeed(feedPreview, facetByID)
	topN := 10
	if len(feedPreview) < topN {
		topN = len(feedPreview)
	}
	for i := 0; i < topN; i++ {
		p := feedPreview[i]
		in := facetByID[p.ID]
		rep.FeedTop10 = append(rep.FeedTop10, feedRow{
			Rank:         i + 1,
			DisplayName:  p.DisplayName,
			Identity:     yantuseed.InferIdentityTag(in.School),
			Paths:        strings.Join(yantuseed.InferPathTags(in), ","),
			ICPHit:       yantuseed.FeedICPHit(in),
			FeaturedRank: p.FeaturedRank,
		})
	}

	printReport(rep)

	if *outPath != "" {
		b, _ := json.MarshalIndent(rep, "", "  ")
		if err := os.WriteFile(*outPath, b, 0644); err != nil {
			log.Fatal("write report:", err)
		}
		fmt.Printf("\n报告已写入 %s\n", *outPath)
	}

	if !*apply {
		fmt.Println("\n[dry-run] 加 -apply 写库")
		return
	}

	jingpin := yantuseed.JingpinCollection
	for _, p := range profiles {
		updates := map[string]interface{}{
			"expertise_tags": models.JSONArray(tagsByID[p.ID]),
			"published":      true,
		}

		if rank, ok := selectedIDs[p.ID]; ok {
			updates["featured_rank"] = rank
			updates["featured_collection"] = jingpin
		} else {
			updates["featured_rank"] = nil
			if p.FeaturedCollection != nil && *p.FeaturedCollection == jingpin {
				updates["featured_collection"] = nil
			}
		}

		if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).Updates(updates).Error; err != nil {
			log.Printf("[warn] update %q: %v", p.DisplayName, err)
			continue
		}
		rep.Updated++
	}

	// 恢复此前被误设为 published=false 的档案
	if res := db.DB.Model(&models.LifeAgentProfile{}).Where("published = ?", false).Update("published", true); res.Error != nil {
		log.Printf("[warn] republish hidden profiles: %v", res.Error)
	} else if res.RowsAffected > 0 {
		fmt.Printf("[apply] 已恢复 published=true：%d 条\n", res.RowsAffected)
	}

	fmt.Printf("\n[apply] 已更新 %d 条档案\n", rep.Updated)
}

func identityPrefixed(identity string) string {
	if identity == "" {
		return ""
	}
	return yantuseed.AxisIdentityPrefix + identity
}

func printReport(rep report) {
	fmt.Println("========== ① 进精选（jingpin）==========")
	if len(rep.Featured) == 0 {
		fmt.Println("（无）")
	} else {
		for _, row := range rep.Featured {
			fmt.Printf("  #%d %s | 身份:%s | 路径:%s | tier=%s\n",
				row.FeaturedRank,
				row.DisplayName,
				row.IdentityTag,
				strings.Join(stripPrefix(row.PathTags, yantuseed.AxisPathPrefix), ","),
				row.Tier,
			)
		}
	}
	if rep.Gap.NeedsMoreShuangfeiCore {
		fmt.Printf("\n⚠ 缺口：%s（当前双非×考研/求职/实习=%d 条）\n",
			rep.Gap.Message, rep.Gap.ShuangfeiCoreCount)
	}

	fmt.Printf("\n========== ② 两轴标签一览（共 %d 条 published）==========\n", len(rep.TagMatrix))
	showN := len(rep.TagMatrix)
	if showN > 30 {
		fmt.Printf("（stdout 仅展示前 30 条，完整见 -out JSON）\n")
		showN = 30
	}
	for i := 0; i < showN; i++ {
		row := rep.TagMatrix[i]
		icp := " "
		if row.ICPHit {
			icp = "*"
		}
		fmt.Printf("  %s %s | 身份:%s | 路径:%s\n", icp, row.DisplayName, row.Identity, strings.Join(row.Paths, ","))
	}
	fmt.Println("  (* = 主 feed ICP 命中)")

	fmt.Println("\n========== ③ 主 feed 预览 Top 10（改 ORDER BY 后）==========")
	for _, row := range rep.FeedTop10 {
		fr := "-"
		if row.FeaturedRank != nil {
			fr = fmt.Sprintf("%d", *row.FeaturedRank)
		}
		icp := ""
		if row.ICPHit {
			icp = "ICP"
		}
		fmt.Printf("  #%d %s | %s | 身份:%s | 路径:%s | featuredRank:%s\n",
			row.Rank, row.DisplayName, icp, row.Identity, row.Paths, fr)
	}
}

func stripPrefix(tags []string, prefix string) []string {
	out := make([]string, 0, len(tags))
	for _, t := range tags {
		out = append(out, strings.TrimPrefix(t, prefix))
	}
	return out
}
