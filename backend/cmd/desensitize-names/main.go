// desensitize-names：替换 Agent 知识库与档案中的真实姓名/笔名，用于内容脱敏。
//
// 用法（在 backend 目录下运行）：
//
//	# 审计：列出所有 original_author 及在正文中的出现次数
//	go run ./cmd/desensitize-names -audit
//
//	# 预览：按 original_author → display_name 替换（不写库）
//	go run ./cmd/desensitize-names
//
//	# 写入数据库（自动 JSON 备份）
//	go run ./cmd/desensitize-names -apply
//
//	# 替换为「佚名」而非 display_name
//	go run ./cmd/desensitize-names -replace-with anonymous -apply
//
//	# 额外手工映射（逗号分隔 from=to）
//	go run ./cmd/desensitize-names -map "姚圣杰=凌晨四点半,陈杰豪=佚名" -apply
//
//	# 脱敏单个 markdown 文件
//	go run ./cmd/desensitize-names -file ../../docs/学长.md -map "姚圣杰=凌晨四点半" -apply
//
//	# 导出 DB 里所有 original_author → display_name 映射
//	go run ./cmd/desensitize-names -export-map names-map.txt
//
//	# 默认会一并清理「研途榜样导入 / AI / 导入」等字样；可用 -no-labels 关闭
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

type replaceRule struct {
	From string
	To   string
}

var anonymousMarkers = map[string]bool{
	"": true, "-": true, "—": true, "–": true,
	"佚名": true, "匿名": true, "未知": true, "none": true, "n/a": true,
	"anonymous": true, "unknown": true,
}

var authorSplitRe = regexp.MustCompile(`[,，、/|;|]+`)

func main() {
	apply := flag.Bool("apply", false, "写入（缺省 dry-run）")
	audit := flag.Bool("audit", false, "只审计 original_author 与正文命中，不替换")
	idArg := flag.String("id", "", "只处理某个 profile id")
	limit := flag.Int("limit", 0, "最多处理多少个 profile（0=不限）")
	replaceWith := flag.String("replace-with", "display_name", "替换目标：display_name | anonymous | strip（删除姓名）")
	mapArg := flag.String("map", "", "额外映射，逗号分隔 from=to")
	mapFile := flag.String("map-file", "", "映射文件，每行 from=to 或 from -> to")
	fileArg := flag.String("file", "", "脱敏 markdown/文本文件（不连库）")
	outArg := flag.String("out", "", "文件模式输出路径（默认覆盖原文件并留 .bak）")
	exportMap := flag.String("export-map", "", "导出 original_author→display_name 映射到文件后退出")
	noBackup := flag.Bool("no-backup", false, "写入前不做 JSON 备份")
	scope := flag.String("scope", "global", "替换范围：global（全库正文）| profile（仅各 Agent 自己的 original_author 出现在自己的条目里）")
	clearAuthor := flag.Bool("clear-author", true, "写入后将 original_author 设为 NULL（或 anonymous 模式设为佚名）")
	stripLabels := flag.Bool("strip-labels", true, "清理研途榜样导入/AI/导入等痕迹（默认开启）")
	noLabels := flag.Bool("no-labels", false, "等同 -strip-labels=false")
	flag.Parse()

	if *noLabels {
		*stripLabels = false
	}

	extraRules, err := loadExtraRules(*mapArg, *mapFile)
	if err != nil {
		log.Fatalf("load map: %v", err)
	}

	// 纯文件模式
	if strings.TrimSpace(*fileArg) != "" {
		fileRules := extraRules
		if *stripLabels {
			fileRules = mergeRules(fileRules, labelRulesForProfile(""))
		}
		runFileMode(*fileArg, *outArg, fileRules, *apply)
		return
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

	var profiles []models.LifeAgentProfile
	q := db.DB.Order("created_at")
	if strings.TrimSpace(*idArg) != "" {
		q = q.Where("id = ?", strings.TrimSpace(*idArg))
	}
	if err := q.Find(&profiles).Error; err != nil {
		log.Fatalf("query profiles failed: %v", err)
	}
	if *limit > 0 && len(profiles) > *limit {
		profiles = profiles[:*limit]
	}

	rules, ambig := buildRulesFromProfiles(profiles, *replaceWith)
	rules = mergeRules(rules, extraRules)
	if len(ambig) > 0 {
		fmt.Println("=== 歧义姓名（同一姓名对应多个 Agent，已改用佚名）===")
		for _, a := range ambig {
			fmt.Printf("  %s → 佚名（曾对应: %s）\n", a.from, strings.Join(a.targets, ", "))
		}
		fmt.Println()
	}

	if *exportMap != "" {
		if err := writeMapFile(*exportMap, rules); err != nil {
			log.Fatalf("export map: %v", err)
		}
		fmt.Printf("已导出 %d 条映射 → %s\n", len(rules), *exportMap)
		return
	}

	if *audit {
		auditRules := rules
		if *stripLabels {
			auditRules = mergeRules(auditRules, labelRulesForProfile("学长本人"))
		}
		runAudit(profiles, auditRules)
		if *stripLabels {
			fmt.Println("\n=== 创建者账号（含导入/AI 字样）===")
			previewFixUserNames(false)
		}
		return
	}

	targetLabel := replacementLabel(*replaceWith)
	labelsNote := "关闭"
	if *stripLabels {
		labelsNote = "开启"
	}
	fmt.Printf("=== 脱敏预览 ===\n姓名规则: %d  标签清理: %s  目标: %s  范围: %s  模式: %s\n\n",
		len(rules), labelsNote, targetLabel, *scope, modeLabel(*apply))

	type profileChange struct {
		ProfileID   string
		DisplayName string
		Fields      []string
		EntryHits   int
		AuthorOld   string
		AuthorNew   string
		SourceOld   string
		SourceNew   string
	}
	var changes []profileChange
	totalEntryHits := 0

	for _, p := range profiles {
		pc := profileChange{
			ProfileID:   p.ID,
			DisplayName: p.DisplayName,
		}
		if p.OriginalAuthor != nil {
			pc.AuthorOld = *p.OriginalAuthor
		}

		profileRules := effectiveRules(p, rules, *scope, *replaceWith, extraRules, *stripLabels)

		newHeadline := applyRules(p.Headline, profileRules)
		newShort := applyRules(p.ShortBio, profileRules)
		newLong := applyRules(p.LongBio, profileRules)
		newWelcome := applyRules(p.WelcomeMessage, profileRules)
		newSample := applyRulesJSONArray(p.SampleQuestions, profileRules)
		newTags := applyRulesJSONArray(p.ExpertiseTags, profileRules)
		var newSource *string
		if p.Source != nil {
			pc.SourceOld = *p.Source
		}
		newSource = sanitizeSource(p.Source, profileRules)
		if newSource != nil {
			pc.SourceNew = *newSource
		} else if p.Source != nil {
			pc.SourceNew = "(NULL)"
		}

		if newHeadline != p.Headline {
			pc.Fields = append(pc.Fields, "headline")
		}
		if newShort != p.ShortBio {
			pc.Fields = append(pc.Fields, "short_bio")
		}
		if newLong != p.LongBio {
			pc.Fields = append(pc.Fields, "long_bio")
		}
		if newWelcome != p.WelcomeMessage {
			pc.Fields = append(pc.Fields, "welcome_message")
		}
		if stringJSON(newSample) != stringJSON(p.SampleQuestions) {
			pc.Fields = append(pc.Fields, "sample_questions")
		}
		if stringJSON(newTags) != stringJSON(p.ExpertiseTags) {
			pc.Fields = append(pc.Fields, "expertise_tags")
		}
		if sourceChanged(p.Source, newSource) {
			pc.Fields = append(pc.Fields, "source")
		}

		var entries []models.LifeAgentKnowledgeEntry
		if err := db.DB.Where("profile_id = ?", p.ID).Find(&entries).Error; err != nil {
			log.Fatalf("query entries for %s: %v", p.ID, err)
		}
		for _, e := range entries {
			nt := applyRules(e.Title, profileRules)
			nc := applyRules(e.Content, profileRules)
			if nt != e.Title || nc != e.Content {
				pc.EntryHits++
			}
		}
		totalEntryHits += pc.EntryHits

		if *clearAuthor {
			if *replaceWith == "anonymous" {
				pc.AuthorNew = "佚名"
			} else {
				pc.AuthorNew = "(NULL)"
			}
		}

		if len(pc.Fields) > 0 || pc.EntryHits > 0 || (pc.AuthorOld != "" && *clearAuthor) {
			changes = append(changes, pc)
		}
	}

	if *stripLabels {
		fmt.Println("=== 创建者账号 ===")
		userFixes := previewFixUserNames(false)
		if userFixes == 0 {
			fmt.Println("  （无需修改）")
		}
		fmt.Println()
	}

	previewCap := 20
	fmt.Printf("将影响 %d 个 Agent，共 %d 条知识条目\n", len(changes), totalEntryHits)
	for i, c := range changes {
		if i >= previewCap {
			fmt.Printf("\n... 还有 %d 个 Agent\n", len(changes)-previewCap)
			break
		}
		fields := strings.Join(c.Fields, ", ")
		if fields == "" {
			fields = "-"
		}
		fmt.Printf("[%d] %s  id=%s  字段:%s  知识:%d条  author:%q→%s\n",
			i+1, c.DisplayName, c.ProfileID, fields, c.EntryHits, c.AuthorOld, c.AuthorNew)
	}

	if !*apply {
		fmt.Println("\n(dry-run) 确认后加 -apply 写入。")
		return
	}

	if !*noBackup {
		if err := backupProfiles(profiles); err != nil {
			log.Fatalf("backup failed: %v", err)
		}
	}

	updatedProfiles := 0
	updatedEntries := 0
	for _, p := range profiles {
		profileRules := effectiveRules(p, rules, *scope, *replaceWith, extraRules, *stripLabels)

		newHeadline := applyRules(p.Headline, profileRules)
		newShort := applyRules(p.ShortBio, profileRules)
		newLong := applyRules(p.LongBio, profileRules)
		newWelcome := applyRules(p.WelcomeMessage, profileRules)
		newSample := applyRulesJSONArray(p.SampleQuestions, profileRules)
		newTags := applyRulesJSONArray(p.ExpertiseTags, profileRules)
		newSource := sanitizeSource(p.Source, profileRules)

		changed := newHeadline != p.Headline ||
			newShort != p.ShortBio ||
			newLong != p.LongBio ||
			newWelcome != p.WelcomeMessage ||
			stringJSON(newSample) != stringJSON(p.SampleQuestions) ||
			stringJSON(newTags) != stringJSON(p.ExpertiseTags) ||
			sourceChanged(p.Source, newSource) ||
			(p.OriginalAuthor != nil && *clearAuthor)

		var entries []models.LifeAgentKnowledgeEntry
		if err := db.DB.Where("profile_id = ?", p.ID).Find(&entries).Error; err != nil {
			log.Fatalf("query entries: %v", err)
		}
		for _, e := range entries {
			if applyRules(e.Title, profileRules) != e.Title || applyRules(e.Content, profileRules) != e.Content {
				changed = true
				break
			}
		}
		if !changed {
			continue
		}

		updates := map[string]interface{}{
			"headline":          newHeadline,
			"short_bio":         newShort,
			"long_bio":          newLong,
			"welcome_message":   newWelcome,
			"sample_questions":  newSample,
			"expertise_tags":    newTags,
			"source":            newSource,
		}
		if *clearAuthor {
			if *replaceWith == "anonymous" {
				v := "佚名"
				updates["original_author"] = &v
			} else {
				updates["original_author"] = nil
			}
		}

		if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).Updates(updates).Error; err != nil {
			log.Fatalf("update profile %s: %v", p.ID, err)
		}
		updatedProfiles++

		for _, e := range entries {
			nt := applyRules(e.Title, profileRules)
			nc := applyRules(e.Content, profileRules)
			if nt == e.Title && nc == e.Content {
				continue
			}
			if err := db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("id = ?", e.ID).
				Updates(map[string]interface{}{"title": nt, "content": nc}).Error; err != nil {
				log.Fatalf("update entry %s: %v", e.ID, err)
			}
			updatedEntries++
		}
	}

	updatedUsers := 0
	if *stripLabels {
		updatedUsers = previewFixUserNames(true)
	}

	fmt.Printf("\n完成：更新 %d 个 Agent 档案，%d 条知识条目，%d 个创建者账号。\n",
		updatedProfiles, updatedEntries, updatedUsers)
}

type ambigName struct {
	from    string
	targets []string
}

func buildRulesFromProfiles(profiles []models.LifeAgentProfile, replaceWith string) ([]replaceRule, []ambigName) {
	// from -> set of display names
	buckets := map[string]map[string]bool{}
	for _, p := range profiles {
		if p.OriginalAuthor == nil {
			continue
		}
		for _, fragment := range authorNameFragments(*p.OriginalAuthor) {
			if isAnonymous(fragment) {
				continue
			}
			if buckets[fragment] == nil {
				buckets[fragment] = map[string]bool{}
			}
			buckets[fragment][p.DisplayName] = true
		}
	}

	var ambig []ambigName
	var rules []replaceRule
	for from, targets := range buckets {
		to := targetForProfileNames(targets, replaceWith)
		if len(targets) > 1 {
			ambig = append(ambig, ambigName{from: from, targets: sortedKeys(targets)})
			to = "佚名"
		}
		if from == to {
			continue
		}
		rules = append(rules, replaceRule{From: from, To: to})
	}
	sort.Slice(rules, func(i, j int) bool {
		if len(rules[i].From) != len(rules[j].From) {
			return len(rules[i].From) > len(rules[j].From)
		}
		return rules[i].From < rules[j].From
	})
	sort.Slice(ambig, func(i, j int) bool { return ambig[i].from < ambig[j].from })
	return rules, ambig
}

func rulesForProfile(p models.LifeAgentProfile, replaceWith string) []replaceRule {
	if p.OriginalAuthor == nil {
		return nil
	}
	to := p.DisplayName
	switch replaceWith {
	case "anonymous":
		to = "佚名"
	case "strip":
		to = ""
	}
	var rules []replaceRule
	for _, fragment := range authorNameFragments(*p.OriginalAuthor) {
		if isAnonymous(fragment) || fragment == to {
			continue
		}
		rules = append(rules, replaceRule{From: fragment, To: to})
	}
	sort.Slice(rules, func(i, j int) bool { return len(rules[i].From) > len(rules[j].From) })
	return rules
}

func targetForProfileNames(targets map[string]bool, replaceWith string) string {
	switch replaceWith {
	case "anonymous":
		return "佚名"
	case "strip":
		return ""
	default:
		names := sortedKeys(targets)
		if len(names) == 1 {
			return names[0]
		}
		return names[0]
	}
}

func authorNameFragments(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	// 去掉括号内说明，保留括号前的姓名
	if idx := strings.Index(raw, "("); idx > 0 {
		raw = strings.TrimSpace(raw[:idx])
	}
	if idx := strings.Index(raw, "（"); idx > 0 {
		raw = strings.TrimSpace(raw[:idx])
	}
	parts := authorSplitRe.Split(raw, -1)
	seen := map[string]bool{}
	var out []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" || seen[p] {
			continue
		}
		seen[p] = true
		out = append(out, p)
	}
	return out
}

func isAnonymous(s string) bool {
	return anonymousMarkers[strings.ToLower(strings.TrimSpace(s))]
}

func mergeRules(base, extra []replaceRule) []replaceRule {
	byFrom := map[string]string{}
	for _, r := range base {
		if r.From != "" {
			byFrom[r.From] = r.To
		}
	}
	for _, r := range extra {
		if r.From != "" {
			byFrom[r.From] = r.To
		}
	}
	var out []replaceRule
	for from, to := range byFrom {
		if from == to {
			continue
		}
		out = append(out, replaceRule{From: from, To: to})
	}
	sort.Slice(out, func(i, j int) bool {
		if len(out[i].From) != len(out[j].From) {
			return len(out[i].From) > len(out[j].From)
		}
		return out[i].From < out[j].From
	})
	return out
}

func applyRules(text string, rules []replaceRule) string {
	if text == "" || len(rules) == 0 {
		return text
	}
	out := text
	for _, r := range rules {
		if r.From == "" {
			continue
		}
		out = strings.ReplaceAll(out, r.From, r.To)
	}
	return out
}

func loadExtraRules(mapArg, mapFile string) ([]replaceRule, error) {
	var rules []replaceRule
	if strings.TrimSpace(mapArg) != "" {
		for _, part := range strings.Split(mapArg, ",") {
			r, err := parseMapLine(part)
			if err != nil {
				return nil, err
			}
			if r.From != "" {
				rules = append(rules, r)
			}
		}
	}
	if strings.TrimSpace(mapFile) != "" {
		data, err := os.ReadFile(mapFile)
		if err != nil {
			return nil, err
		}
		for _, line := range strings.Split(string(data), "\n") {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			r, err := parseMapLine(line)
			if err != nil {
				return nil, fmt.Errorf("%s: %w", mapFile, err)
			}
			if r.From != "" {
				rules = append(rules, r)
			}
		}
	}
	return rules, nil
}

func parseMapLine(line string) (replaceRule, error) {
	line = strings.TrimSpace(line)
	line = strings.ReplaceAll(line, "->", "=")
	parts := strings.SplitN(line, "=", 2)
	if len(parts) != 2 {
		return replaceRule{}, fmt.Errorf("invalid map line: %q (want from=to)", line)
	}
	return replaceRule{
		From: strings.TrimSpace(parts[0]),
		To:   strings.TrimSpace(parts[1]),
	}, nil
}

func runAudit(profiles []models.LifeAgentProfile, rules []replaceRule) {
	fmt.Println("=== original_author 分布 ===")
	authorCount := map[string]int{}
	for _, p := range profiles {
		if p.OriginalAuthor == nil || strings.TrimSpace(*p.OriginalAuthor) == "" {
			continue
		}
		authorCount[*p.OriginalAuthor]++
	}
	type kv struct {
		k string
		v int
	}
	var authors []kv
	for k, v := range authorCount {
		authors = append(authors, kv{k, v})
	}
	sort.Slice(authors, func(i, j int) bool {
		if authors[i].v != authors[j].v {
			return authors[i].v > authors[j].v
		}
		return authors[i].k < authors[j].k
	})
	for _, a := range authors {
		fmt.Printf("  %3d  %s\n", a.v, a.k)
	}
	fmt.Printf("\n共 %d 种 original_author，%d 条映射规则\n\n", len(authors), len(rules))

	fmt.Println("=== 正文命中（全库 knowledge title+content）===")
	var entries []models.LifeAgentKnowledgeEntry
	if err := db.DB.Select("id, profile_id, title, content").Find(&entries).Error; err != nil {
		log.Fatalf("query entries: %v", err)
	}
	hits := map[string]int{}
	for _, e := range entries {
		text := e.Title + "\n" + e.Content
		for _, r := range rules {
			if r.From != "" && strings.Contains(text, r.From) {
				hits[r.From] += strings.Count(text, r.From)
			}
		}
	}
	type hitKV struct {
		k string
		v int
	}
	var hitList []hitKV
	for k, v := range hits {
		hitList = append(hitList, hitKV{k, v})
	}
	sort.Slice(hitList, func(i, j int) bool {
		if hitList[i].v != hitList[j].v {
			return hitList[i].v > hitList[j].v
		}
		return hitList[i].k < hitList[j].k
	})
	if len(hitList) == 0 {
		fmt.Println("  （无命中）")
	} else {
		for _, h := range hitList {
			fmt.Printf("  %4d  %s\n", h.v, h.k)
		}
	}
}

func runFileMode(path, out string, rules []replaceRule, apply bool) {
	data, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("read file: %v", err)
	}
	orig := string(data)
	newText := applyRules(orig, rules)
	if orig == newText {
		fmt.Println("文件无变化。")
		return
	}
	hitCount := 0
	for _, r := range rules {
		hitCount += strings.Count(orig, r.From)
	}
	fmt.Printf("文件: %s\n规则: %d 条  预计替换: %d 处\n", path, len(rules), hitCount)
	if !apply {
		fmt.Println("(dry-run) 加 -apply 写入。")
		return
	}
	dest := out
	if dest == "" {
		dest = path
	}
	if dest == path {
		bak := path + ".bak"
		if err := os.WriteFile(bak, data, 0644); err != nil {
			log.Fatalf("backup: %v", err)
		}
		fmt.Printf("已备份 → %s\n", bak)
	}
	if err := os.WriteFile(dest, []byte(newText), 0644); err != nil {
		log.Fatalf("write: %v", err)
	}
	fmt.Printf("已写入 → %s\n", dest)
}

func backupProfiles(profiles []models.LifeAgentProfile) error {
	type backupProfile struct {
		Profile models.LifeAgentProfile
		Entries []models.LifeAgentKnowledgeEntry
	}
	var payload []backupProfile
	for _, p := range profiles {
		var entries []models.LifeAgentKnowledgeEntry
		if err := db.DB.Where("profile_id = ?", p.ID).Find(&entries).Error; err != nil {
			return err
		}
		payload = append(payload, backupProfile{Profile: p, Entries: entries})
	}
	name := fmt.Sprintf("desensitize-names-backup-%s.json", time.Now().Format("20060102-150405"))
	path := filepath.Join("backups", name)
	if err := os.MkdirAll("backups", 0755); err != nil {
		return err
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(payload); err != nil {
		return err
	}
	fmt.Printf("已备份 %d 个 Agent → %s\n", len(payload), path)
	return nil
}

func writeMapFile(path string, rules []replaceRule) error {
	var lines []string
	for _, r := range rules {
		lines = append(lines, fmt.Sprintf("%s=%s", r.From, r.To))
	}
	sort.Strings(lines)
	return os.WriteFile(path, []byte(strings.Join(lines, "\n")+"\n"), 0644)
}

func sortedKeys(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

func replacementLabel(mode string) string {
	switch mode {
	case "anonymous":
		return "佚名"
	case "strip":
		return "删除"
	default:
		return "display_name"
	}
}

func modeLabel(apply bool) string {
	if apply {
		return "写入"
	}
	return "dry-run"
}

func stringJSON(arr models.JSONArray) string {
	if len(arr) == 0 {
		return "[]"
	}
	b, err := json.Marshal(arr)
	if err != nil {
		return ""
	}
	return string(b)
}

func sourceChanged(old, neu *string) bool {
	if old == nil && neu == nil {
		return false
	}
	if old == nil || neu == nil {
		return true
	}
	return *old != *neu
}
