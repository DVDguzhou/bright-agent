// extract-persona：从 yantuseed 种子（或数据库）按 display_name 导出 Markdown，供 GPT 扩写 / import-persona 导入。
//
// 用法（backend 目录）：
//
//	go run ./cmd/extract-persona -names "努力的芋圆,勤劳的板栗ya"
//	go run ./cmd/extract-persona -names "努力的芋圆" -out ../docs/agent-interview/
//	go run ./cmd/extract-persona -names "努力的芋圆" -from-db   # 从数据库导出（需 DATABASE_URL）
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

var headingRe = regexp.MustCompile(`(?m)^#{1,3}\s+`)

func main() {
	namesArg := flag.String("names", "", "逗号分隔的 display_name")
	outDir := flag.String("out", "../docs/agent-interview", "输出目录")
	fromDB := flag.Bool("from-db", false, "从数据库导出（默认从 yantuseed 种子）")
	splitSections := flag.Bool("split", true, "按 Markdown 标题拆成多条 ## 小节")
	flag.Parse()

	names := splitNames(*namesArg)
	if len(names) == 0 {
		log.Fatal("必须提供 -names")
	}

	if *fromDB {
		_ = godotenv.Load(".env")
		_ = godotenv.Load("../.env")
		_ = godotenv.Load("../../.env")
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
		}
		if err := db.Connect(dsn); err != nil {
			log.Fatalf("db connect: %v", err)
		}
	}

	if err := os.MkdirAll(*outDir, 0755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}

	for _, name := range names {
		var body string
		var meta profileMeta
		if *fromDB {
			b, m, err := loadFromDB(name)
			if err != nil {
				log.Printf("[跳过] %s: %v", name, err)
				continue
			}
			body, meta = b, m
		} else {
			p, ok := findSeed(name)
			if !ok {
				log.Printf("[跳过] 种子中未找到 %q", name)
				continue
			}
			body, meta = buildFromSeed(p)
		}

		sections := []section{{title: meta.articleTitle, body: body}}
		if *splitSections {
			if chunks := splitByHeadings(body); len(chunks) > 0 {
				sections = chunks
			}
		}

		outPath := filepath.Join(*outDir, safeFilename(name)+"-extract.md")
		if err := writeExtract(outPath, meta, sections); err != nil {
			log.Fatalf("write %s: %v", outPath, err)
		}
		fmt.Printf("✓ %s → %s（%d 小节，约 %d 字）\n", name, outPath, len(sections), runeLen(body))
	}
}

type profileMeta struct {
	displayName     string
	school          string
	major           string
	score           string
	articleTitle    string
	shortBio        string
	source          string
	originalAuthor  string
	expertiseTags   string
	sampleQuestions string
	longBioPrefix   string
	knowledgeCat    string
}

type section struct {
	title string
	body  string
}

func findSeed(name string) (yantuseed.Profile, bool) {
	for _, p := range yantuseed.Profiles() {
		if p.DisplayName == name {
			return p, true
		}
	}
	return yantuseed.Profile{}, false
}

func buildFromSeed(p yantuseed.Profile) (string, profileMeta) {
	meta := profileMeta{
		displayName:    p.DisplayName,
		school:         p.School,
		major:          p.MajorLine,
		score:          p.ScoreLine,
		articleTitle:   p.ArticleTitle,
		shortBio:       p.ShortBio,
		source:         p.Source,
		originalAuthor: p.OriginalAuthor,
		longBioPrefix:  p.LongBioPrefix,
		knowledgeCat:   p.KnowledgeCategory,
	}
	if len(p.ExpertiseTags) > 0 {
		meta.expertiseTags = strings.Join(p.ExpertiseTags, ", ")
	}
	if len(p.SampleQuestions) > 0 {
		meta.sampleQuestions = strings.Join(p.SampleQuestions, " | ")
	}
	return strings.TrimSpace(p.KnowledgeBody), meta
}

func loadFromDB(name string) (string, profileMeta, error) {
	var profiles []models.LifeAgentProfile
	if err := db.DB.Where("display_name = ?", name).Find(&profiles).Error; err != nil {
		return "", profileMeta{}, err
	}
	if len(profiles) == 0 {
		return "", profileMeta{}, fmt.Errorf("数据库无此 Agent")
	}
	if len(profiles) > 1 {
		fmt.Printf("[警告] %q 有 %d 条同名档案，合并全部知识条目\n", name, len(profiles))
	}
	p := profiles[0]
	meta := profileMeta{
		displayName: p.DisplayName,
		shortBio:    p.ShortBio,
		articleTitle: p.Headline,
	}
	if p.School != nil {
		meta.school = *p.School
	}
	if p.OriginalAuthor != nil {
		meta.originalAuthor = *p.OriginalAuthor
	}
	if p.Source != nil {
		meta.source = *p.Source
	}
	if len(p.ExpertiseTags) > 0 {
		meta.expertiseTags = strings.Join(p.ExpertiseTags, ", ")
	}
	if len(p.SampleQuestions) > 0 {
		meta.sampleQuestions = strings.Join(p.SampleQuestions, " | ")
	}

	var all []models.LifeAgentKnowledgeEntry
	for _, prof := range profiles {
		var entries []models.LifeAgentKnowledgeEntry
		if err := db.DB.Where("profile_id = ?", prof.ID).Order("sort_order").Find(&entries).Error; err != nil {
			return "", profileMeta{}, err
		}
		all = append(all, entries...)
	}
	var b strings.Builder
	for i, e := range all {
		if i > 0 {
			b.WriteString("\n\n---\n\n")
		}
		if t := strings.TrimSpace(e.Title); t != "" {
			b.WriteString("# ")
			b.WriteString(t)
			b.WriteString("\n\n")
		}
		b.WriteString(e.Content)
	}
	return b.String(), meta, nil
}

func splitByHeadings(body string) []section {
	body = strings.TrimSpace(body)
	if body == "" {
		return nil
	}
	// 去掉最外层单个 # 标题（常与第一个 ## 重复）
	lines := strings.Split(body, "\n")
	start := 0
	if len(lines) > 0 && strings.HasPrefix(strings.TrimSpace(lines[0]), "# ") && !strings.HasPrefix(strings.TrimSpace(lines[0]), "## ") {
		start = 1
		for start < len(lines) && strings.TrimSpace(lines[start]) == "" {
			start++
		}
	}
	body = strings.Join(lines[start:], "\n")

	idx := headingRe.FindAllStringIndex(body, -1)
	if len(idx) == 0 {
		return []section{{title: "正文", body: body}}
	}

	var out []section
	// 导语（第一个标题之前）
	if idx[0][0] > 0 {
		pre := strings.TrimSpace(body[:idx[0][0]])
		if runeLen(pre) >= 40 {
			out = append(out, section{title: "背景与导读", body: pre})
		}
	}

	for i, loc := range idx {
		end := len(body)
		if i+1 < len(idx) {
			end = idx[i+1][0]
		}
		chunk := strings.TrimSpace(body[loc[0]:end])
		title, content := parseHeadingBlock(chunk)
		if title == "" || runeLen(content) < 15 {
			continue
		}
		out = append(out, section{title: title, body: content})
	}
	return out
}

func parseHeadingBlock(block string) (title, content string) {
	lines := strings.Split(block, "\n")
	if len(lines) == 0 {
		return "", ""
	}
	first := strings.TrimSpace(lines[0])
	first = strings.TrimLeft(first, "#")
	first = strings.TrimSpace(first)
	var rest []string
	for _, ln := range lines[1:] {
		rest = append(rest, ln)
	}
	return first, strings.TrimSpace(strings.Join(rest, "\n"))
}

func writeExtract(path string, meta profileMeta, sections []section) error {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("# %s · 提取知识库\n\n", meta.displayName))
	b.WriteString("> 供 GPT 扩写对话 / import-persona 导入。只基于下列真实材料加工，勿编造。\n\n")
	b.WriteString("## Agent 元信息\n\n")
	writeKV(&b, "昵称", meta.displayName)
	writeKV(&b, "学校/领域", meta.school)
	writeKV(&b, "方向", meta.major)
	if meta.score != "" {
		writeKV(&b, "成绩/备注", meta.score)
	}
	writeKV(&b, "篇目", meta.articleTitle)
	writeKV(&b, "简介", meta.shortBio)
	writeKV(&b, "来源", meta.source)
	if meta.originalAuthor != "" {
		writeKV(&b, "原作者", meta.originalAuthor)
	}
	if meta.expertiseTags != "" {
		writeKV(&b, "标签", meta.expertiseTags)
	}
	if meta.sampleQuestions != "" {
		writeKV(&b, "现有样例问题", meta.sampleQuestions)
	}
	b.WriteString("\n---\n\n")

	for _, s := range sections {
		b.WriteString("## ")
		b.WriteString(s.title)
		b.WriteString("\n\n")
		b.WriteString(s.body)
		b.WriteString("\n\n")
	}
	return os.WriteFile(path, []byte(b.String()), 0644)
}

func writeKV(b *strings.Builder, k, v string) {
	v = strings.TrimSpace(v)
	if v == "" {
		return
	}
	b.WriteString(fmt.Sprintf("- **%s**：%s\n", k, v))
}

func splitNames(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if v := strings.TrimSpace(p); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func safeFilename(name string) string {
	re := regexp.MustCompile(`[\\/:*?"<>|]`)
	return re.ReplaceAllString(name, "_")
}

func runeLen(s string) int { return len([]rune(s)) }
