// set-featured：给人生 Agent 设置精选位 / 校园合集（featured_rank / featured_collection）。
//
// 语义：
//   - 全站精选：featured_rank 非空且 featured_collection 为空 → 浮到主广场首屏。
//   - 合集成员：featured_collection 非空 → 只在 /c/<collection> 合集内按 featured_rank 置顶，
//     不污染主广场首屏。
//
// 用法（在 backend 目录下运行）：
//
//	# 预览：把含「考研/二战/调剂」关键词的前 12 个 Agent 归入 kaoyan 合集（dry-run，不写库）
//	go run ./cmd/set-featured -collection kaoyan -match 考研,二战,调剂,初试,复试 -limit 12
//
//	# 写入：加 -apply
//	go run ./cmd/set-featured -collection liuxue -match 留学,飞跃,申请,文书,选校 -limit 12 -apply
//	go run ./cmd/set-featured -collection qiuzhi -match 求职,秋招,春招,面试,简历,offer -limit 12 -apply
//
//	# 全站精选（顶主广场）：按 ID 指定，rank 按给定顺序 1..N
//	go run ./cmd/set-featured -global -ids 10000000-0000-0000-0000-000000000001 -apply
//
//	# 清空某合集 / 清空全站精选
//	go run ./cmd/set-featured -collection kaoyan -clear -apply
//	go run ./cmd/set-featured -global -clear -apply
package main

import (
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

type candidate struct {
	profile   models.LifeAgentProfile
	knowledge int64
	sessions  int64
	packs     int64
}

func main() {
	collection := flag.String("collection", "", "合集 key（如 kaoyan/liuxue/qiuzhi）；与 -global 二选一")
	global := flag.Bool("global", false, "设为全站精选（顶主广场），不归入任何合集")
	match := flag.String("match", "", "逗号分隔关键词，匹配 displayName/headline/expertiseTags/school/audience/shortBio")
	idsArg := flag.String("ids", "", "逗号分隔的 profile id，显式指定（优先于 -match）")
	limit := flag.Int("limit", 12, "最多精选多少个")
	minKnowledge := flag.Int("min-knowledge", 0, "质量门槛：知识条目数下限（match 模式生效，挡住空壳号）")
	minSessions := flag.Int("min-sessions", 0, "质量门槛：会话数下限（match 模式生效）")
	clear := flag.Bool("clear", false, "清空该合集（或全站精选）的 featured 设置，而非设置")
	report := flag.Bool("report", false, "只出内容深度审计报告，不做任何写入（可配合 -match 按主题统计）")
	apply := flag.Bool("apply", false, "写入数据库（缺省为 dry-run 预览）")
	flag.Parse()

	if !*report && !*global && strings.TrimSpace(*collection) == "" {
		log.Fatal("必须指定 -collection <key> 或 -global（或用 -report 出报告）")
	}
	if *global && strings.TrimSpace(*collection) != "" {
		log.Fatal("-global 与 -collection 不能同时使用")
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
	// 确保 featured_rank / featured_collection 两列已存在（只新增列，不删表/列）。
	if err := db.DB.AutoMigrate(&models.LifeAgentProfile{}); err != nil {
		log.Fatalf("ensure columns failed: %v", err)
	}

	// 报告模式：只统计，不写入
	if *report {
		runReport(splitCSV(*match))
		return
	}

	// 清空模式
	if *clear {
		clearFeatured(*global, strings.TrimSpace(*collection), *apply)
		return
	}

	// 选出候选
	ids := splitCSV(*idsArg)
	var chosen []candidate
	if len(ids) > 0 {
		chosen = loadCandidatesByIDs(ids)
		// 显式 ids：保持给定顺序
	} else {
		keywords := splitCSV(*match)
		if len(keywords) == 0 {
			log.Fatal("请提供 -ids 或 -match 关键词")
		}
		chosen = loadCandidatesByMatch(keywords)
		// 质量门槛：挡住「知识1 会话1」的空壳号，避免合集被灌水
		if *minKnowledge > 0 || *minSessions > 0 {
			filtered := chosen[:0]
			for _, c := range chosen {
				if c.knowledge < int64(*minKnowledge) {
					continue
				}
				if c.sessions < int64(*minSessions) {
					continue
				}
				filtered = append(filtered, c)
			}
			chosen = filtered
		}
		// 综合分排序：内容厚度为主，真实成交为强信号，会话只作弱加权（避免 1 次会话的噪音盖过厚内容）。
		// score = 知识条目 + 成交*3 + 会话*0.5
		featScore := func(c candidate) float64 {
			return float64(c.knowledge) + float64(c.packs)*3 + float64(c.sessions)*0.5
		}
		sort.SliceStable(chosen, func(i, j int) bool {
			si, sj := featScore(chosen[i]), featScore(chosen[j])
			if si != sj {
				return si > sj
			}
			return chosen[i].knowledge > chosen[j].knowledge
		})
		if len(chosen) > *limit {
			chosen = chosen[:*limit]
		}
	}

	if len(chosen) == 0 {
		fmt.Println("没有匹配到任何 Agent。")
		return
	}

	target := "全站精选（主广场置顶）"
	if !*global {
		target = fmt.Sprintf("合集 [%s]", *collection)
	}
	fmt.Printf("将设置 %d 个 Agent 为 %s：\n", len(chosen), target)
	for i, c := range chosen {
		rank := i + 1
		fmt.Printf("  #%-2d  %-18s  知识%-3d 会话%-3d 成交%-3d  (%s)\n",
			rank, truncate(c.profile.DisplayName, 18), c.knowledge, c.sessions, c.packs, c.profile.ID)
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写入。确认无误后加 -apply 执行。")
		return
	}

	var collPtr *string
	if !*global {
		v := strings.TrimSpace(*collection)
		collPtr = &v
	}
	for i, c := range chosen {
		rank := i + 1
		updates := map[string]any{
			"featured_rank":       rank,
			"featured_collection": collPtr, // 全站精选时为 nil
		}
		if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", c.profile.ID).Updates(updates).Error; err != nil {
			log.Printf("update failed %s: %v", c.profile.ID, err)
		}
	}
	fmt.Printf("\n✓ 已写入 %d 条。\n", len(chosen))
}

// runReport 出内容深度审计：按知识库条目数分桶。无 -match 时统计全站；
// 有 -match 时只统计命中该主题的 Agent，并列出可主打（知识≥8）/可用（3-7）名单。
func runReport(keywords []string) {
	var cands []candidate
	scope := "全站"
	if len(keywords) > 0 {
		cands = loadCandidatesByMatch(keywords)
		scope = fmt.Sprintf("主题[%s]", strings.Join(keywords, "/"))
	} else {
		var profiles []models.LifeAgentProfile
		db.DB.Where("published = ?", true).Find(&profiles)
		cands = make([]candidate, 0, len(profiles))
		for _, p := range profiles {
			cands = append(cands, withStats(p))
		}
	}

	var strong, usable, thin int // ≥8 / 3-7 / ≤2
	for _, c := range cands {
		switch {
		case c.knowledge >= 8:
			strong++
		case c.knowledge >= 3:
			usable++
		default:
			thin++
		}
	}

	fmt.Printf("=== 内容深度审计 · %s ===\n", scope)
	fmt.Printf("已发布 Agent 总数：%d\n", len(cands))
	fmt.Printf("  可主打（知识≥8）：%d\n", strong)
	fmt.Printf("  可用  （知识3-7）：%d\n", usable)
	fmt.Printf("  空壳  （知识≤2）：%d\n", thin)

	if len(cands) == 0 {
		return
	}

	// 列出有料的（知识≥3），按知识条目降序，方便挑主打 / 盯补厚进度
	ranked := make([]candidate, 0, len(cands))
	for _, c := range cands {
		if c.knowledge >= 3 {
			ranked = append(ranked, c)
		}
	}
	sort.SliceStable(ranked, func(i, j int) bool {
		if ranked[i].knowledge != ranked[j].knowledge {
			return ranked[i].knowledge > ranked[j].knowledge
		}
		return ranked[i].packs > ranked[j].packs
	})
	fmt.Printf("\n有料名单（知识≥3，共 %d 个）：\n", len(ranked))
	for _, c := range ranked {
		tag := "可用"
		if c.knowledge >= 8 {
			tag = "可主打"
		}
		fmt.Printf("  [%s] %-18s 知识%-3d 会话%-3d 成交%-3d  (%s)\n",
			tag, truncate(c.profile.DisplayName, 18), c.knowledge, c.sessions, c.packs, c.profile.ID)
	}
}

func clearFeatured(global bool, collection string, apply bool) {
	q := db.DB.Model(&models.LifeAgentProfile{})
	desc := ""
	if global {
		q = q.Where("featured_rank IS NOT NULL AND featured_collection IS NULL")
		desc = "全站精选"
	} else {
		q = q.Where("featured_collection = ?", collection)
		desc = fmt.Sprintf("合集 [%s]", collection)
	}
	var cnt int64
	q.Count(&cnt)
	fmt.Printf("将清空 %s 的 %d 个 Agent 的 featured 设置。\n", desc, cnt)
	if !apply {
		fmt.Println("[dry-run] 未写入。加 -apply 执行。")
		return
	}
	if err := q.Updates(map[string]any{"featured_rank": nil, "featured_collection": nil}).Error; err != nil {
		log.Fatalf("clear failed: %v", err)
	}
	fmt.Printf("✓ 已清空 %d 条。\n", cnt)
}

func loadCandidatesByIDs(ids []string) []candidate {
	var profiles []models.LifeAgentProfile
	db.DB.Where("id IN ?", ids).Where("published = ?", true).Find(&profiles)
	byID := make(map[string]models.LifeAgentProfile, len(profiles))
	for _, p := range profiles {
		byID[p.ID] = p
	}
	// 保持调用方给定的 id 顺序
	out := make([]candidate, 0, len(ids))
	for _, id := range ids {
		if p, ok := byID[id]; ok {
			out = append(out, withStats(p))
		}
	}
	return out
}

func loadCandidatesByMatch(keywords []string) []candidate {
	var profiles []models.LifeAgentProfile
	db.DB.Where("published = ?", true).Find(&profiles)
	lowered := make([]string, len(keywords))
	for i, k := range keywords {
		lowered[i] = strings.ToLower(strings.TrimSpace(k))
	}
	out := make([]candidate, 0)
	for _, p := range profiles {
		hay := strings.ToLower(strings.Join([]string{
			p.DisplayName, p.Headline, p.ShortBio, p.Audience,
			strings.Join([]string(p.ExpertiseTags), " "),
			ptrVal(p.School), ptrVal(p.Job),
		}, " "))
		matched := false
		for _, kw := range lowered {
			if kw != "" && strings.Contains(hay, kw) {
				matched = true
				break
			}
		}
		if matched {
			out = append(out, withStats(p))
		}
	}
	return out
}

func withStats(p models.LifeAgentProfile) candidate {
	c := candidate{profile: p}
	db.DB.Raw("SELECT COUNT(*) FROM life_agent_knowledge_entries WHERE profile_id = ?", p.ID).Scan(&c.knowledge)
	db.DB.Raw("SELECT COUNT(*) FROM life_agent_chat_sessions WHERE profile_id = ?", p.ID).Scan(&c.sessions)
	db.DB.Raw("SELECT COUNT(*) FROM life_agent_question_packs WHERE profile_id = ?", p.ID).Scan(&c.packs)
	return c
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		t := strings.TrimSpace(p)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

func ptrVal(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}
