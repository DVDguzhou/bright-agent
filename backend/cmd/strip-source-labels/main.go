// strip-source-labels：移除「飞跃手册」「研途榜样」两个来源/品牌字样的所有出现。
//
// - 档案门面字段（headline/short_bio/long_bio/audience/welcome/source/expertise_tags）：
//   Go 精细处理：删词后清理空括号、悬空分隔符、首尾标点。tag 删空则整条移除，source 变空设 NULL。
// - 知识库（title/content/category/tags，约数万条）：SQL 批量 REPLACE，去掉词即可（正文不强求排版）。
//
// 默认 dry-run；-apply 写库，并把档案字段的「旧→新」备份到 strip-labels-backup-<时间>.jsonl。
//
// 用法（backend 目录）：
//   go run ./cmd/strip-source-labels            # dry-run 预览
//   go run ./cmd/strip-source-labels -apply     # 写库 + 备份
package main

import (
	"bufio"
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
)

var phrases = []string{"飞跃手册", "研途榜样"}

var multiSpaceRe = regexp.MustCompile(`[ \t　]{2,}`)

func main() {
	apply := flag.Bool("apply", false, "写库（缺省 dry-run）")
	limit := flag.Int("limit", 40, "dry-run 档案明细最多打印多少条（0=全部）")
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

	// 备份文件
	var w *bufio.Writer
	if *apply {
		fname := fmt.Sprintf("strip-labels-backup-%s.jsonl", time.Now().Format("20060102-150405"))
		f, err := os.Create(fname)
		if err != nil {
			log.Fatalf("无法创建备份 %s: %v", fname, err)
		}
		defer f.Close()
		w = bufio.NewWriter(f)
		defer w.Flush()
		fmt.Printf("档案改动备份：backend/%s\n", fname)
	}

	// ---------- 1) 档案门面字段 ----------
	var profiles []models.LifeAgentProfile
	db.DB.Find(&profiles)

	changedProfiles := 0
	shown := 0
	for i := range profiles {
		p := &profiles[i]
		updates := map[string]any{}
		var diffs []string

		if nv, ok := stripText(p.Headline); ok {
			diffs = append(diffs, "标题: "+p.Headline+" → "+nv)
			updates["headline"] = nv
		}
		if nv, ok := stripText(p.ShortBio); ok {
			diffs = append(diffs, "简介: "+p.ShortBio+" → "+nv)
			updates["short_bio"] = nv
		}
		if nv, ok := stripText(p.LongBio); ok {
			updates["long_bio"] = nv
		}
		if nv, ok := stripText(p.Audience); ok {
			updates["audience"] = nv
		}
		if nv, ok := stripText(p.WelcomeMessage); ok {
			updates["welcome_message"] = nv
		}
		if p.Source != nil {
			if nv, ok := stripText(*p.Source); ok {
				diffs = append(diffs, "来源: "+*p.Source+" → "+nv)
				if nv == "" {
					updates["source"] = nil
				} else {
					updates["source"] = nv
				}
			}
		}
		if nt, ok := stripTags(p.ExpertiseTags); ok {
			diffs = append(diffs, fmt.Sprintf("标签: %v → %v", []string(p.ExpertiseTags), []string(nt)))
			updates["expertise_tags"] = nt
		}

		if len(updates) == 0 {
			continue
		}
		changedProfiles++
		if *apply {
			rec := map[string]any{"type": "profile", "id": p.ID, "name": p.DisplayName, "updates": updates}
			b, _ := json.Marshal(rec)
			fmt.Fprintln(w, string(b))
			if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).Updates(updates).Error; err != nil {
				log.Printf("  ⚠ 更新失败 %s: %v", p.DisplayName, err)
			}
		} else if len(diffs) > 0 && (*limit == 0 || shown < *limit) {
			fmt.Printf("[%s]\n", p.DisplayName)
			for _, d := range diffs {
				fmt.Printf("    %s\n", d)
			}
			shown++
		}
	}

	// ---------- 2) 知识库（SQL 批量）----------
	var kbCount int64
	like := "title LIKE ? OR content LIKE ? OR category LIKE ? OR CAST(tags AS CHAR) LIKE ?"
	args := []any{}
	condParts := []string{}
	for _, ph := range phrases {
		condParts = append(condParts, "("+like+")")
		p := "%" + ph + "%"
		args = append(args, p, p, p, p)
	}
	cond := strings.Join(condParts, " OR ")
	db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where(cond, args...).Count(&kbCount)

	fmt.Printf("\n=== 汇总 ===\n档案有改动：%d 个 Agent\n知识库含字样的条目：%d 条\n", changedProfiles, kbCount)

	if !*apply {
		fmt.Println("\n[dry-run] 未写库。确认后加 -apply 执行。")
		return
	}

	for _, ph := range phrases {
		sql := `UPDATE life_agent_knowledge_entries SET
			title = REPLACE(title, ?, ''),
			content = REPLACE(content, ?, ''),
			category = REPLACE(category, ?, ''),
			tags = REPLACE(CAST(tags AS CHAR), ?, '')`
		if err := db.DB.Exec(sql, ph, ph, ph, ph).Error; err != nil {
			log.Fatalf("知识库 REPLACE 失败（%s）: %v", ph, err)
		}
	}
	fmt.Printf("✓ 档案 %d 个、知识库字样已清理。\n", changedProfiles)
}

// stripText 删除两个字样并整理；返回新值与是否变化。
func stripText(s string) (string, bool) {
	orig := s
	for _, ph := range phrases {
		s = strings.ReplaceAll(s, ph, "")
	}
	if s == orig {
		return "", false
	}
	return tidy(s), true
}

func tidy(s string) string {
	// 反复去空括号
	prev := ""
	for s != prev {
		prev = s
		for _, wrap := range []string{"「」", "（）", "()", "【】", "《》", "[]", "“”", "\"\""} {
			s = strings.ReplaceAll(s, wrap, "")
		}
	}
	// 折叠悬空分隔符
	for _, pr := range [][2]string{
		{"｜ ｜", "｜"}, {"｜｜", "｜"}, {"| |", "|"}, {"||", "|"},
		{"· ·", "·"}, {"··", "·"}, {"、、", "、"}, {"，，", "，"}, {",,", ","},
		{" ｜", "｜"}, {"｜ ", "｜"},
	} {
		for strings.Contains(s, pr[0]) {
			s = strings.ReplaceAll(s, pr[0], pr[1])
		}
	}
	s = multiSpaceRe.ReplaceAllString(s, " ")
	s = strings.TrimSpace(s)
	s = strings.Trim(s, " 　｜|·、，,。.-—:：")
	return strings.TrimSpace(s)
}

// stripTags 逐条清理标签，删空则丢弃；返回新数组与是否变化。
func stripTags(tags models.JSONArray) (models.JSONArray, bool) {
	changed := false
	out := models.JSONArray{}
	for _, t := range []string(tags) {
		nv, ok := stripText(t)
		if !ok {
			out = append(out, t)
			continue
		}
		changed = true
		if strings.TrimSpace(nv) != "" {
			out = append(out, nv)
		}
	}
	if !changed {
		return nil, false
	}
	return out, true
}
