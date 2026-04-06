// 从保存的微信公众号 HTML（研途榜样系列）导入人生 Agent 档案与知识库。
//
// 本地（未传参数、未设 YANTU_HTML_DIR）：读当前用户桌面上的研途榜样②～⑤ 四个固定文件名。
//
// 服务器上推荐：
//
//	1. 把若干 .html 放到同一目录，例如 /var/app/yantu-html/
//	2. export DATABASE_URL='user:pass@tcp(127.0.0.1:3306)/agent_marketplace?charset=utf8mb4&parseTime=True'
//	   （把主机改成你服务器上 MySQL 的地址；若在 Docker 里常是服务名如 mysql:3306）
//	3. export YANTU_HTML_DIR=/var/app/yantu-html
//	4. 在 backend 目录：go run ./scripts/import_yantu_life_agents.go
//
// 也可显式传文件路径（优先级最高）：go run ./scripts/import_yantu_life_agents.go /path/a.html /path/b.html
//
// Linux 上单独编译二进制（在 backend 目录、装 Go 的机器上）：
//
//	GOOS=linux GOARCH=amd64 go build -o import_yantu_life_agents ./scripts/import_yantu_life_agents.go
//
// 将二进制与 html 目录一起拷到服务器后：DATABASE_URL=... YANTU_HTML_DIR=... ./import_yantu_life_agents
package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/wechathtml"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	paths := resolveHTMLPaths()
	if len(paths) == 0 {
		log.Fatal("no html files: pass paths as args, or set YANTU_HTML_DIR, or use default Desktop files on Windows/macOS")
	}

	if err = db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	user := yantuseed.EnsureImportUser()
	// 不写 preset 或与 seed 相同策略；展示 URL 由 lifeAgentShippedCoverPresetPNGs 控制
	cover := ""

	for _, p := range paths {
		if err := importOneHTML(p, user.ID, cover); err != nil {
			log.Printf("skip/fail %s: %v", p, err)
		}
	}
	fmt.Println("import_yantu_life_agents done")
}

func resolveHTMLPaths() []string {
	if len(os.Args) > 1 {
		return os.Args[1:]
	}
	if dir := strings.TrimSpace(os.Getenv("YANTU_HTML_DIR")); dir != "" {
		matches, err := filepath.Glob(filepath.Join(dir, "*.html"))
		if err != nil {
			log.Fatal("YANTU_HTML_DIR glob:", err)
		}
		sort.Strings(matches)
		return matches
	}
	desk, err := os.UserHomeDir()
	if err != nil {
		return nil
	}
	desk = filepath.Join(desk, "Desktop")
	candidates := []string{
		filepath.Join(desk, "研途榜样② _ 研途备考凝力，榜样传经上岸.html"),
		filepath.Join(desk, "研途榜样③ _ 凝思知其所向，笃行方至其远.html"),
		filepath.Join(desk, "研途榜样④ _ 制心一处 , 无事不办.html"),
		filepath.Join(desk, "研途榜样⑤ _ 笔耕有涯，梦想无疆.html"),
	}
	var out []string
	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && !st.IsDir() {
			out = append(out, p)
		}
	}
	return out
}

func importOneHTML(path, userID, coverPreset string) error {
	b, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	htmlStr := string(b)
	title := wechathtml.ExtractArticleTitle(htmlStr)
	if title == "" {
		return fmt.Errorf("no article title")
	}
	lines := wechathtml.ExtractLeafLines(htmlStr)
	parsed := wechathtml.ParseYantuArticle(title, lines)
	if parsed.KnowledgeBody == "" {
		return fmt.Errorf("empty body")
	}

	headline := fmt.Sprintf("%s · %s", parsed.DisplayName, shortSeries(title))
	headline = wechathtml.TrimRunes(headline, 512)
	longBio := fmt.Sprintf("本文来自温州大学计算机与人工智能学院微信公众号「研途榜样」系列推送（%s）。%s", title, firstSentence(parsed.KnowledgeBody))
	if strings.TrimSpace(parsed.MajorLine) != "" {
		longBio += " 考研专业：" + strings.TrimSpace(parsed.MajorLine) + "。"
	}
	if strings.TrimSpace(parsed.ScoreLine) != "" {
		longBio += " " + strings.TrimSpace(parsed.ScoreLine) + "。"
	}
	short := fmt.Sprintf("%s上岸经验分享，供考研同学参考。", parsed.DisplayName)
	short = wechathtml.TrimRunes(short, 500)

	var profile models.LifeAgentProfile
	errFound := db.DB.Where("user_id = ? AND display_name = ?", userID, parsed.DisplayName).First(&profile).Error
	if errFound == nil {
		db.DB.Where("profile_id = ?", profile.ID).Delete(&models.LifeAgentKnowledgeEntry{})
		updates := map[string]interface{}{
			"headline":         headline,
			"short_bio":        short,
			"long_bio":         longBio,
			"school":           strOrNil(parsed.School),
			"published":        true,
			"cover_preset_key": strOrNil(coverPreset),
		}
		if err := db.DB.Model(&profile).Updates(updates).Error; err != nil {
			return err
		}
		fmt.Println("updated profile", parsed.DisplayName)
	} else {
		profile = models.LifeAgentProfile{
			ID:               models.GenID(),
			UserID:           userID,
			DisplayName:      parsed.DisplayName,
			Headline:         headline,
			ShortBio:         short,
			LongBio:          longBio,
			Audience:         "正在备考或规划考研的同学，尤其计算机相关专业。",
			WelcomeMessage:   fmt.Sprintf("你好，我是%s，欢迎问我关于考研备考、择校和心态调整的问题。", parsed.DisplayName),
			PricePerQuestion: 990,
			ExpertiseTags:    models.JSONArray{"考研", "计算机考研", "备考经验", "温州大学"},
			SampleQuestions: models.JSONArray{
				"11408 和 22408 怎么选？",
				"数学和专业课怎么安排复习节奏？",
				"调剂时有哪些需要注意的？",
			},
			School:         strOrNil(parsed.School),
			Education:      strPtr("硕士研究生（已录取或就读）"),
			CoverPresetKey: strOrNil(coverPreset),
			Published:      true,
		}
		if err := db.DB.Create(&profile).Error; err != nil {
			return err
		}
		fmt.Println("created profile", parsed.DisplayName)
	}

	kTitle := "研途榜样｜考研经验（原文整理）"
	if parsed.ArticleTitle != "" {
		kTitle = "研途榜样｜" + shortSeries(parsed.ArticleTitle)
	}
	entry := models.LifeAgentKnowledgeEntry{
		ID:        models.GenID(),
		ProfileID: profile.ID,
		Category:  "考研经验",
		Title:     wechathtml.TrimRunes(kTitle, 255),
		Content:   parsed.KnowledgeBody,
		Tags:      models.JSONArray{"考研", "经验贴", "计算机"},
		SortOrder: 0,
	}
	if err := db.DB.Create(&entry).Error; err != nil {
		return err
	}
	fmt.Println("  knowledge entry", entry.Title)
	return nil
}

func shortSeries(title string) string {
	title = strings.TrimSpace(title)
	if i := strings.Index(title, "|"); i >= 0 {
		return strings.TrimSpace(title[i+1:])
	}
	return title
}

func firstSentence(s string) string {
	s = strings.TrimSpace(s)
	for _, sep := range []string{"。", "！", "？", "\n"} {
		if i := strings.Index(s, sep); i > 40 && i < 200 {
			return s[:i+len(sep)]
		}
	}
	return wechathtml.TrimRunes(s, 160)
}

func strPtr(s string) *string { return &s }

func strOrNil(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}
