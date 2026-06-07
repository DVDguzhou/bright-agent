// rechunk-knowledge：把"一坨长正文塞进单条知识库"的 seed Agent，按 Markdown 小节（## 标题）
// 切分成多条原子知识条目。显著改善 RAG 检索，并让大量"知识1"Agent 越过质量门槛。
//
// 只处理正文里含 >=2 个同级 Markdown 标题的条目；用户手动建的短条目（无 ## 结构）不受影响。
//
// 用法（在 backend 目录下运行）：
//
//	go run ./cmd/rechunk-knowledge                       # dry-run 预览全量
//	go run ./cmd/rechunk-knowledge -limit 20             # 只看前 20 条候选
//	go run ./cmd/rechunk-knowledge -id <profileID>       # 只处理某个 Agent
//	go run ./cmd/rechunk-knowledge -min-sections 3       # 至少能切出 3 条才动（默认 2）
//	go run ./cmd/rechunk-knowledge -apply                # 写入（默认自动 JSON 备份原条目）
//	go run ./cmd/rechunk-knowledge -apply -no-backup     # 写入且不备份
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

type section struct {
	title string
	body  string
}

var tocLineRe = regexp.MustCompile(`^\s*[-*]\s*\[.*\]\(#.*\)\s*$`)
var dividerRe = regexp.MustCompile(`^\s*-{3,}\s*$`)

func main() {
	apply := flag.Bool("apply", false, "写入数据库（缺省为 dry-run 预览）")
	limit := flag.Int("limit", 0, "最多处理多少条候选（0=不限）")
	idArg := flag.String("id", "", "只处理某个 profile id 的知识条目")
	minSections := flag.Int("min-sections", 2, "至少能切出这么多条才动手（建议 3）")
	noBackup := flag.Bool("no-backup", false, "写入前不做 JSON 备份")
	junk := flag.Bool("junk", false, "只审计废条目（标题黑名单 + 内容过短），不切分、不写入")
	junkMaxChars := flag.Int("junk-maxchars", 40, "内容字符数低于此视为「过短」废条目")
	cleanJunk := flag.Bool("clean-junk", false, "删除废条目（默认 dry-run；配合 -apply 写入，自动备份）")
	keepMin := flag.Int("keep-min", 2, "保护下限：删后该 Agent 至少保留这么多条，否则跳过其废条目")
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

	// 废条目审计模式：只统计，不写入
	if *junk {
		runJunkAudit(*junkMaxChars, strings.TrimSpace(*idArg))
		return
	}

	// 废条目清理模式：删除（带保护下限 + 备份）
	if *cleanJunk {
		runCleanJunk(*junkMaxChars, *keepMin, strings.TrimSpace(*idArg), *apply, *noBackup)
		return
	}

	// 预筛：正文含 "## " 标题的条目（再在 Go 里精确校验切分结果）
	q := db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("content LIKE ?", "%## %")
	if strings.TrimSpace(*idArg) != "" {
		q = q.Where("profile_id = ?", strings.TrimSpace(*idArg))
	}
	var entries []models.LifeAgentKnowledgeEntry
	if err := q.Order("profile_id, sort_order").Find(&entries).Error; err != nil {
		log.Fatalf("query entries failed: %v", err)
	}

	type plan struct {
		original models.LifeAgentKnowledgeEntry
		chunks   []section
	}
	var plans []plan
	for _, e := range entries {
		chunks := chunkEntry(e)
		if len(chunks) < *minSections {
			continue
		}
		plans = append(plans, plan{original: e, chunks: chunks})
		if *limit > 0 && len(plans) >= *limit {
			break
		}
	}

	if len(plans) == 0 {
		fmt.Println("没有可切分的候选条目。")
		return
	}

	// 预览
	totalNew := 0
	affectedProfiles := map[string]bool{}
	previewCap := 15
	fmt.Printf("=== 可切分候选：%d 条 ===\n", len(plans))
	for i, pl := range plans {
		totalNew += len(pl.chunks)
		affectedProfiles[pl.original.ProfileID] = true
		if i < previewCap {
			fmt.Printf("\n[%d] profile=%s  原标题《%s》 → %d 条：\n", i+1, pl.original.ProfileID, truncate(pl.original.Title, 28), len(pl.chunks))
			for j, c := range pl.chunks {
				fmt.Printf("     %2d. %s\n", j+1, truncate(c.title, 40))
			}
		}
	}
	if len(plans) > previewCap {
		fmt.Printf("\n...（其余 %d 条候选省略预览）\n", len(plans)-previewCap)
	}
	fmt.Printf("\n汇总：%d 条原始 → %d 条切分后，涉及 %d 个 Agent。\n", len(plans), totalNew, len(affectedProfiles))

	if !*apply {
		fmt.Println("\n[dry-run] 未写入。确认无误后加 -apply 执行。")
		return
	}

	// 备份原条目
	if !*noBackup {
		originals := make([]models.LifeAgentKnowledgeEntry, 0, len(plans))
		for _, pl := range plans {
			originals = append(originals, pl.original)
		}
		fname := fmt.Sprintf("rechunk-backup-%s.json", time.Now().Format("20060102-150405"))
		data, _ := json.MarshalIndent(originals, "", "  ")
		if err := os.WriteFile(fname, data, 0644); err != nil {
			log.Fatalf("写备份失败（已中止，未改库）: %v", err)
		}
		fmt.Printf("已备份 %d 条原条目到 %s\n", len(originals), fname)
	}

	// 逐条事务替换：删原条目 + 建新条目
	done := 0
	for _, pl := range plans {
		err := db.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Delete(&models.LifeAgentKnowledgeEntry{}, "id = ?", pl.original.ID).Error; err != nil {
				return err
			}
			for j, c := range pl.chunks {
				ne := models.LifeAgentKnowledgeEntry{
					ID:        models.GenID(),
					ProfileID: pl.original.ProfileID,
					Category:  pl.original.Category,
					Title:     truncateRunes(c.title, 200),
					Content:   c.body,
					Tags:      pl.original.Tags,
					SortOrder: pl.original.SortOrder + j,
				}
				if err := tx.Create(&ne).Error; err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			log.Printf("替换失败 profile=%s entry=%s: %v", pl.original.ProfileID, pl.original.ID, err)
			continue
		}
		done++
	}
	fmt.Printf("\n✓ 完成：成功切分 %d 条。\n", done)
}

// junkTitleDenylist：明显无咨询价值的页脚/套话/资源页标题（已归一化为小写去空格）。
var junkTitleDenylist = map[string]bool{
	"说明": true, "联系方式": true, "参考资料": true, "参考": true, "参考文献": true,
	"资源汇总": true, "资源": true, "课程资源": true, "其他资源": true, "资源链接": true,
	"附录": true, "致谢": true, "结语": true, "写在最后": true, "后记": true, "免责声明": true,
	"references": true, "reference": true, "resources": true, "course resources": true,
	"personal resources": true, "descriptions": true, "description": true,
	"instructor information": true, "links": true, "appendix": true,
}

func normalizeTitle(s string) string {
	return strings.ToLower(strings.Join(strings.Fields(strings.TrimSpace(s)), ""))
}

// runJunkAudit 扫描全部知识条目，统计废条目（标题黑名单 / 内容过短）并展示构成。只读。
func runJunkAudit(maxChars int, profileID string) {
	type row struct {
		ID        string
		ProfileID string `gorm:"column:profile_id"`
		Title     string
		CLen      int `gorm:"column:clen"`
	}
	q := db.DB.Model(&models.LifeAgentKnowledgeEntry{}).
		Select("id, profile_id, title, CHAR_LENGTH(content) AS clen")
	if profileID != "" {
		q = q.Where("profile_id = ?", profileID)
	}
	var rows []row
	if err := q.Scan(&rows).Error; err != nil {
		log.Fatalf("scan entries failed: %v", err)
	}

	total := len(rows)
	var denylisted, tooShort, junkTotal int
	titleFreq := map[string]int{}
	for _, r := range rows {
		isDeny := junkTitleDenylist[normalizeTitle(r.Title)]
		isShort := r.CLen < maxChars
		if isDeny {
			denylisted++
		}
		if isShort && !isDeny {
			tooShort++
		}
		if isDeny || isShort {
			junkTotal++
			titleFreq[strings.TrimSpace(r.Title)]++
		}
	}

	fmt.Printf("=== 废条目审计（内容<%d 字符 视为过短）===\n", maxChars)
	fmt.Printf("知识条目总数：%d\n", total)
	fmt.Printf("  废条目合计：%d（占 %.1f%%）\n", junkTotal, pct(junkTotal, total))
	fmt.Printf("    - 标题黑名单：%d\n", denylisted)
	fmt.Printf("    - 内容过短  ：%d\n", tooShort)

	if junkTotal == 0 {
		return
	}

	type tf struct {
		title string
		cnt   int
	}
	tops := make([]tf, 0, len(titleFreq))
	for t, c := range titleFreq {
		tops = append(tops, tf{t, c})
	}
	sort.SliceStable(tops, func(i, j int) bool { return tops[i].cnt > tops[j].cnt })
	if len(tops) > 30 {
		tops = tops[:30]
	}
	fmt.Printf("\n废条目标题 TOP（最多 30）：\n")
	for _, t := range tops {
		fmt.Printf("  %4d × %s\n", t.cnt, truncate(t.title, 50))
	}
}

func pct(a, b int) float64 {
	if b == 0 {
		return 0
	}
	return float64(a) * 100 / float64(b)
}

// runCleanJunk 删除废条目（标题黑名单 / 内容过短）。带保护：删后某 Agent 条目数不得低于 keepMin，
// 否则跳过该 Agent 的废条目（避免把瘦档案删空）。默认 dry-run，-apply 才写入并先备份。
func runCleanJunk(maxChars, keepMin int, profileID string, apply, noBackup bool) {
	q := db.DB.Model(&models.LifeAgentKnowledgeEntry{})
	if profileID != "" {
		q = q.Where("profile_id = ?", profileID)
	}
	var all []models.LifeAgentKnowledgeEntry
	if err := q.Order("profile_id, sort_order").Find(&all).Error; err != nil {
		log.Fatalf("query entries failed: %v", err)
	}

	// 按 profile 分组，统计总数与废条目
	totalByProfile := map[string]int{}
	junkByProfile := map[string][]models.LifeAgentKnowledgeEntry{}
	for _, e := range all {
		totalByProfile[e.ProfileID]++
		if junkTitleDenylist[normalizeTitle(e.Title)] || runeLen(e.Content) < maxChars {
			junkByProfile[e.ProfileID] = append(junkByProfile[e.ProfileID], e)
		}
	}

	var toDelete []models.LifeAgentKnowledgeEntry
	skippedProfiles := 0
	for pid, junks := range junkByProfile {
		if totalByProfile[pid]-len(junks) < keepMin {
			// 删完会低于保护下限：本 Agent 的废条目整体跳过
			skippedProfiles++
			continue
		}
		toDelete = append(toDelete, junks...)
	}

	fmt.Printf("=== 废条目清理（内容<%d 视为过短；删后每个 Agent 至少留 %d 条）===\n", maxChars, keepMin)
	fmt.Printf("知识条目总数：%d\n", len(all))
	fmt.Printf("  计划删除：%d 条\n", len(toDelete))
	fmt.Printf("  因保护下限跳过的 Agent：%d 个\n", skippedProfiles)

	if len(toDelete) == 0 {
		return
	}

	titleFreq := map[string]int{}
	for _, e := range toDelete {
		titleFreq[strings.TrimSpace(e.Title)]++
	}
	type tf struct {
		title string
		cnt   int
	}
	tops := make([]tf, 0, len(titleFreq))
	for t, c := range titleFreq {
		tops = append(tops, tf{t, c})
	}
	sort.SliceStable(tops, func(i, j int) bool { return tops[i].cnt > tops[j].cnt })
	if len(tops) > 30 {
		tops = tops[:30]
	}
	fmt.Printf("\n待删标题 TOP（最多 30）：\n")
	for _, t := range tops {
		fmt.Printf("  %4d × %s\n", t.cnt, truncate(t.title, 50))
	}

	if !apply {
		fmt.Println("\n[dry-run] 未写入。确认无误后加 -apply 执行。")
		return
	}

	if !noBackup {
		fname := fmt.Sprintf("cleanjunk-backup-%s.json", time.Now().Format("20060102-150405"))
		data, _ := json.MarshalIndent(toDelete, "", "  ")
		if err := os.WriteFile(fname, data, 0644); err != nil {
			log.Fatalf("写备份失败（已中止，未删）: %v", err)
		}
		fmt.Printf("\n已备份 %d 条待删条目到 %s\n", len(toDelete), fname)
	}

	ids := make([]string, len(toDelete))
	for i, e := range toDelete {
		ids[i] = e.ID
	}
	// 分批删，避免超长 IN 列表
	const batch = 200
	deleted := 0
	for i := 0; i < len(ids); i += batch {
		end := i + batch
		if end > len(ids) {
			end = len(ids)
		}
		if err := db.DB.Delete(&models.LifeAgentKnowledgeEntry{}, "id IN ?", ids[i:end]).Error; err != nil {
			log.Printf("删除批次失败 [%d:%d]: %v", i, end, err)
			continue
		}
		deleted += end - i
	}
	fmt.Printf("\n✓ 完成：删除 %d 条废条目。\n", deleted)
}

// chunkEntry 把单条知识的正文按 Markdown 小节切成多条。无法有效切分时返回 nil。
func chunkEntry(e models.LifeAgentKnowledgeEntry) []section {
	content := strings.ReplaceAll(e.Content, "\r\n", "\n")
	lines := strings.Split(content, "\n")
	lvl := detectHeadingLevel(lines)
	if lvl == 0 {
		return nil
	}

	var preamble []string
	var secs []section
	cur := -1
	for _, raw := range lines {
		l := strings.TrimRight(raw, "\r")
		if title, ok := headingAt(l, lvl); ok {
			secs = append(secs, section{title: title})
			cur = len(secs) - 1
			continue
		}
		if cur < 0 {
			preamble = append(preamble, l)
		} else {
			secs[cur].body += l + "\n"
		}
	}

	out := make([]section, 0, len(secs)+1)

	// 导读/概述：清洗掉目录与套话后若仍有实质内容，作为第 0 条保留原标题
	intro := cleanPreamble(preamble)
	if runeLen(intro) >= 60 {
		title := strings.TrimSpace(e.Title)
		if title == "" {
			title = "导读"
		}
		out = append(out, section{title: title, body: intro})
	}

	for _, s := range secs {
		body := strings.TrimSpace(s.body)
		if runeLen(body) < 12 { // 空小节（仅分隔线等）跳过
			continue
		}
		title := strings.TrimSpace(s.title)
		if title == "" {
			title = strings.TrimSpace(e.Category)
		}
		out = append(out, section{title: title, body: body})
	}

	if len(out) < 2 {
		return nil
	}
	return out
}

// detectHeadingLevel 选出"出现 >=2 次的最浅标题级别"作为切分级别；没有则返回 0。
func detectHeadingLevel(lines []string) int {
	counts := map[int]int{}
	for _, raw := range lines {
		l := strings.TrimRight(raw, "\r")
		if n := leadingHashes(l); n >= 1 && n <= 6 {
			counts[n]++
		}
	}
	for lvl := 1; lvl <= 6; lvl++ {
		if counts[lvl] >= 2 {
			return lvl
		}
	}
	return 0
}

// leadingHashes 返回行首恰好 n 个 '#' 且后接空白时的 n；否则 0。
func leadingHashes(l string) int {
	i := 0
	for i < len(l) && l[i] == '#' {
		i++
	}
	if i == 0 || i >= len(l) {
		return 0
	}
	if l[i] == ' ' || l[i] == '\t' {
		return i
	}
	return 0
}

// headingAt 当行是恰好 lvl 级标题时返回标题文本。
func headingAt(l string, lvl int) (string, bool) {
	if leadingHashes(l) != lvl {
		return "", false
	}
	return strings.TrimSpace(l[lvl:]), true
}

// cleanPreamble 去掉目录列表、分隔线、套话，返回清洗后的导读文本。
func cleanPreamble(lines []string) string {
	var kept []string
	for _, l := range lines {
		t := strings.TrimSpace(l)
		if t == "" {
			kept = append(kept, "")
			continue
		}
		if tocLineRe.MatchString(l) || dividerRe.MatchString(l) {
			continue
		}
		if strings.Contains(t, "下面是作者全文") || strings.Contains(t, "请仔细认真阅读") {
			continue
		}
		kept = append(kept, t)
	}
	return strings.TrimSpace(strings.Join(kept, "\n"))
}

func runeLen(s string) int { return len([]rune(s)) }

func truncateRunes(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}

func truncate(s string, n int) string { return truncateRunes(s, n) }
