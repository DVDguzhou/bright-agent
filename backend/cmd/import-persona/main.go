// import-persona：把一份 Markdown 问答文件导入成「一个人生 Agent + N 条知识条目」。
//
// 适用场景：你用访谈/GPT 整理出一组问答（每个问题一条），想一次性建成一个可对话的 Agent。
// A/B 测试两版（GPT 生成版 vs 你的真实经历版）只需换文件、换 -name 各跑一次。
//
// 文件格式（极简）：每条知识用一个二级标题开头，标题即"问题/小节名"，下面是正文。
//
//	## 读研还有时间谈恋爱吗？
//	有时间，但要看你怎么安排……（正文，可多段）
//
//	## 如果重来，你还会考研吗？
//	大概率会，但我会更早准备……
//
// 说明：
//   - 每条正文里若出现以"事实/虚构说明"开头的行，从该行起到本条结尾会被自动剔除（那是内部备注，不入库）。
//   - 默认 dry-run 只预览，加 -apply 才写库。
//
// 用法（在 backend 目录下运行）：
//
//	go run ./cmd/import-persona -file ../docs/学长.md -merge-out ../docs/agent-interview/凌晨四点半-merged.md
//	go run ./cmd/import-persona -file ../docs/agent-interview/凌晨四点半-merged.md -name "凌晨四点半" -apply
//	    -school "杭州电子科技大学" -major "计算机技术" -score "总分314" \
//	    -tags "考研,计算机考研,408,双非,杭电" -author "陈杰豪" \
//	    -source "研途榜样·AI分身" -apply
package main

import (
	"crypto/md5"
	"encoding/hex"
	"flag"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

type qa struct {
	title   string
	content string
}

func main() {
	file := flag.String("file", "", "Markdown 问答文件路径（## 标题 = 一条知识）")
	name := flag.String("name", "", "Agent 昵称（display_name，必填）")
	headline := flag.String("headline", "", "一句话简介；缺省自动生成")
	shortBio := flag.String("short", "", "短简介；缺省自动生成")
	school := flag.String("school", "", "学校")
	major := flag.String("major", "", "专业/方向")
	score := flag.String("score", "", "成绩行，如 总分314")
	welcome := flag.String("welcome", "", "欢迎语；缺省自动生成")
	audience := flag.String("audience", "", "适合人群；缺省自动生成")
	tags := flag.String("tags", "", "专长标签，逗号分隔")
	category := flag.String("category", "考研经验", "知识条目类别")
	price := flag.Int("price", 990, "单次咨询价格（分）")
	author := flag.String("author", "", "原作者/溯源（写入 original_author）")
	source := flag.String("source", "", "内容来源（写入 source）")
	cover := flag.String("cover", "", "封面预设 key（如 01-student-panda）；缺省留空")
	ownerEmail := flag.String("owner", "", "归属用户邮箱；缺省为每个 Agent 自动创建独立账号（creator 显示名=Agent 名）")
	sharedOwner := flag.Bool("shared-owner", false, "使用共享研途导入账号 yantu-import@demo.com（creator 会显示「研途榜样导入」）")
	mergeOut := flag.String("merge-out", "", "只合并清洗后写出到该路径（不写库）；可与 -apply 分开用")
	apply := flag.Bool("apply", false, "写入数据库（缺省为 dry-run 预览）")
	flag.Parse()

	if strings.TrimSpace(*file) == "" {
		log.Fatal("必须提供 -file")
	}
	if strings.TrimSpace(*mergeOut) == "" && strings.TrimSpace(*name) == "" {
		log.Fatal("写库需提供 -name；仅合并可只用 -merge-out")
	}

	raw, err := os.ReadFile(*file)
	if err != nil {
		log.Fatalf("读文件失败: %v", err)
	}
	items := parsePersonaMD(string(raw))
	if len(items) == 0 {
		log.Fatal("没解析出任何条目；确认文件含 '## 标题' 或 '## N. 问题' 格式")
	}

	label := strings.TrimSpace(*name)
	if label == "" {
		label = "(合并预览)"
	}
	fmt.Printf("=== 导入预览 · %s ===\n", label)
	fmt.Printf("解析到 %d 条知识条目：\n", len(items))
	for i, it := range items {
		fmt.Printf("  #%-2d %s（正文 %d 字）\n", i+1, truncate(it.title, 40), runeLen(it.content))
	}

	if out := strings.TrimSpace(*mergeOut); out != "" {
		if err := writeMergedMD(out, items); err != nil {
			log.Fatalf("写出合并文件失败: %v", err)
		}
		fmt.Printf("\n✓ 已写出合并文件：%s（%d 条）\n", out, len(items))
		if !*apply {
			return
		}
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写入。确认无误后加 -apply 执行。")
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

	owner := ensurePersonaOwner(*name, strings.TrimSpace(*ownerEmail), *sharedOwner)
	fmt.Printf("归属账号：%s（显示名：%s）\n", ownerEmailLabel(owner), ptrStr(owner.Name))

	// 组装档案默认值
	hl := strings.TrimSpace(*headline)
	if hl == "" {
		hl = *name + " · 考研上岸 & 之后的人生"
	}
	sb := strings.TrimSpace(*shortBio)
	if sb == "" {
		sb = fmt.Sprintf("%s：从备考上岸到读研、工作、生活的真实经历分享。", *name)
	}
	var lb strings.Builder
	lb.WriteString(sb)
	if s := strings.TrimSpace(*school); s != "" {
		lb.WriteString(" 学校：" + s + "。")
	}
	if m := strings.TrimSpace(*major); m != "" {
		lb.WriteString(" 专业：" + m + "。")
	}
	if sc := strings.TrimSpace(*score); sc != "" {
		lb.WriteString(" " + strings.TrimSpace(*score) + "。")
	}
	aud := strings.TrimSpace(*audience)
	if aud == "" {
		aud = "正在备考、纠结考研，或想了解上岸之后真实生活的同学。"
	}
	wel := strings.TrimSpace(*welcome)
	if wel == "" {
		wel = fmt.Sprintf("你好，我是%s。考研、读研、工作、生活，想问什么都可以聊。", *name)
	}
	tagArr := splitTags(*tags)
	// 样例问题取前 3 条标题
	samples := models.JSONArray{}
	for i := 0; i < len(items) && i < 3; i++ {
		samples = append(samples, items[i].title)
	}

	// 幂等：按 display_name 查找（可迁移到新归属账号）
	var profile models.LifeAgentProfile
	found := db.DB.Where("display_name = ?", *name).First(&profile).Error == nil

	if found {
		db.DB.Where("profile_id = ?", profile.ID).Delete(&models.LifeAgentKnowledgeEntry{})
		updates := map[string]interface{}{
			"user_id":            owner.ID,
			"headline":           truncate(hl, 500),
			"short_bio":        truncate(sb, 480),
			"long_bio":         lb.String(),
			"audience":         aud,
			"welcome_message":  wel,
			"price_per_question": *price,
			"expertise_tags":   tagArr,
			"sample_questions": samples,
			"school":           strOrNil(*school),
			"original_author":  strOrNil(*author),
			"source":           strOrNil(*source),
			"is_generated":     true,
			"published":        true,
		}
		if c := strings.TrimSpace(*cover); c != "" {
			updates["cover_preset_key"] = &c
		}
		if err := db.DB.Model(&profile).Updates(updates).Error; err != nil {
			log.Fatalf("更新档案失败: %v", err)
		}
		fmt.Printf("\n更新已有档案 %s (%s)\n", *name, profile.ID)
	} else {
		profile = models.LifeAgentProfile{
			ID:               models.GenID(),
			UserID:           owner.ID,
			DisplayName:      *name,
			Headline:         truncate(hl, 500),
			ShortBio:         truncate(sb, 480),
			LongBio:          lb.String(),
			Audience:         aud,
			WelcomeMessage:   wel,
			PricePerQuestion: *price,
			ExpertiseTags:    tagArr,
			SampleQuestions:  samples,
			School:           strOrNil(*school),
			OriginalAuthor:   strOrNil(*author),
			Source:           strOrNil(*source),
			IsGenerated:      true,
			Published:        true,
		}
		if c := strings.TrimSpace(*cover); c != "" {
			profile.CoverPresetKey = &c
		}
		if err := db.DB.Create(&profile).Error; err != nil {
			log.Fatalf("创建档案失败: %v", err)
		}
		fmt.Printf("\n创建档案 %s (%s)\n", *name, profile.ID)
	}

	for i, it := range items {
		entry := models.LifeAgentKnowledgeEntry{
			ID:        models.GenID(),
			ProfileID: profile.ID,
			Category:  *category,
			Title:     truncate(it.title, 250),
			Content:   it.content,
			Tags:      tagArr,
			SortOrder: i,
		}
		if err := db.DB.Create(&entry).Error; err != nil {
			log.Printf("  条目写入失败 [%s]: %v", it.title, err)
			continue
		}
	}
	fmt.Printf("✓ 写入 %d 条知识条目。\n", len(items))
	fmt.Printf("\nAgent ID：%s\n", profile.ID)
	fmt.Printf("登录邮箱：%s（密码 password123）\n", ownerEmailLabel(owner))
}

func ensurePersonaOwner(displayName, explicitEmail string, sharedOwner bool) *models.User {
	if sharedOwner || explicitEmail == yantuseed.ImportUserEmail {
		return yantuseed.EnsureImportUser()
	}
	if explicitEmail != "" {
		var u models.User
		if err := db.DB.Where("email = ?", explicitEmail).First(&u).Error; err != nil {
			log.Fatalf("找不到归属用户 %s", explicitEmail)
		}
		return &u
	}
	email := personaOwnerEmail(displayName)
	var u models.User
	if db.DB.Where("email = ?", email).First(&u).Error == nil {
		if u.Name == nil || strings.TrimSpace(*u.Name) != displayName {
			db.DB.Model(&u).Update("name", displayName)
			u.Name = strPtr(displayName)
		}
		return &u
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), 12)
	if err != nil {
		log.Fatal("bcrypt:", err)
	}
	u = models.User{
		ID:        models.GenID(),
		Email:     email,
		Password:  string(hash),
		Name:      strPtr(displayName),
		RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": true},
	}
	if err := db.DB.Create(&u).Error; err != nil {
		log.Fatalf("create persona owner failed: %v", err)
	}
	fmt.Println("created persona owner", email, "password: password123")
	return &u
}

func personaOwnerEmail(displayName string) string {
	if strings.TrimSpace(displayName) == "" {
		log.Fatal("displayName empty")
	}
	h := md5.Sum([]byte(displayName))
	return fmt.Sprintf("persona+%s@demo.local", hex.EncodeToString(h[:8]))
}

func ownerEmailLabel(u *models.User) string {
	if u == nil {
		return ""
	}
	return u.Email
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func strPtr(s string) *string { return &s }

var numberedHeadingRe = regexp.MustCompile(`^##\s+\d+\.\s+(?:标题[：:]\s*)?(.+)$`)

// parsePersonaMD 解析 Markdown 人设库。支持：
//   - ## 问题标题？
//   - ## 1. 标题：叙事小节名
//   - ## 1. 双非考杭电……？
//
// 自动剔除：归属线、虚构标注、事实/虚构说明、批次小结等非正文块。
func parsePersonaMD(text string) []qa {
	lines := strings.Split(strings.ReplaceAll(text, "\r\n", "\n"), "\n")
	var out []qa
	var cur *qa
	var buf []string
	flush := func() {
		if cur == nil {
			return
		}
		body := cleanEntryBody(strings.Join(buf, "\n"))
		body = strings.TrimSpace(body)
		if body != "" && runeLen(body) >= 20 {
			cur.content = body
			out = append(out, *cur)
		}
		cur = nil
		buf = nil
	}
	for _, ln := range lines {
		if t, ok := headingTitle(ln); ok {
			flush()
			cur = &qa{title: t}
			continue
		}
		if cur != nil {
			buf = append(buf, ln)
		}
	}
	flush()
	return out
}

func headingTitle(line string) (string, bool) {
	s := strings.TrimSpace(line)
	if !strings.HasPrefix(s, "## ") {
		return "", false
	}
	rest := strings.TrimSpace(strings.TrimPrefix(s, "## "))
	if m := numberedHeadingRe.FindStringSubmatch(s); len(m) == 2 {
		return strings.TrimSpace(m[1]), true
	}
	// 跳过批次小结等非条目标题
	if strings.HasPrefix(rest, "当前进度") {
		return "", false
	}
	return rest, true
}

func writeMergedMD(path string, items []qa) error {
	var b strings.Builder
	b.WriteString("# 凌晨四点半 · 合并知识库\n\n")
	b.WriteString("> 由 docs/学长.md 自动合并：20 条叙事 + 52 条问答，已剔除批次小结与虚构标注。\n\n")
	for _, it := range items {
		b.WriteString("## ")
		b.WriteString(it.title)
		b.WriteString("\n\n")
		b.WriteString(it.content)
		b.WriteString("\n\n")
	}
	return os.WriteFile(path, []byte(b.String()), 0644)
}

// cleanEntryBody 提取正文，保留追问补充，去掉内部元数据。
func cleanEntryBody(raw string) string {
	lines := strings.Split(raw, "\n")
	var out []string
	for i := 0; i < len(lines); i++ {
		t := strings.TrimSpace(lines[i])
		if t == "---" {
			continue
		}
		if isMetaStopLine(t) {
			break
		}
		if t == "**回答：**" || t == "**正文：**" {
			continue
		}
		if strings.HasPrefix(t, "**追问补充：**") {
			extra := strings.TrimSpace(strings.TrimPrefix(t, "**追问补充：**"))
			if extra != "" {
				out = append(out, extra)
			}
			continue
		}
		if strings.HasPrefix(t, "**适合 AI 学长") {
			// 追问补充块：标题行跳过，后续正文保留到 meta 停止线
			for j := i + 1; j < len(lines); j++ {
				tt := strings.TrimSpace(lines[j])
				if isMetaStopLine(tt) {
					i = j
					break
				}
				if tt != "" && tt != "---" {
					out = append(out, lines[j])
				}
				i = j
			}
			continue
		}
		out = append(out, lines[i])
	}
	return strings.TrimSpace(strings.Join(out, "\n"))
}

func isMetaStopLine(t string) bool {
	if t == "" {
		return false
	}
	if strings.HasPrefix(t, "**归属线") {
		return true
	}
	if strings.HasPrefix(t, "**🔴") {
		return true
	}
	if strings.HasPrefix(t, "事实/虚构说明") || strings.HasPrefix(t, "事实/虚构") {
		return true
	}
	if strings.HasPrefix(t, "**事实/虚构") {
		return true
	}
	if strings.HasPrefix(t, "真实依据：") || strings.HasPrefix(t, "虚构部分：") {
		return true
	}
	return false
}


func splitTags(s string) models.JSONArray {
	out := models.JSONArray{}
	for _, t := range strings.Split(s, ",") {
		if v := strings.TrimSpace(t); v != "" {
			out = append(out, v)
		}
	}
	return out
}

func strOrNil(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	v := strings.TrimSpace(s)
	return &v
}

func runeLen(s string) int { return len([]rune(s)) }

func truncate(s string, n int) string {
	r := []rune(s)
	if len(r) <= n {
		return s
	}
	return string(r[:n])
}
