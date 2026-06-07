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
