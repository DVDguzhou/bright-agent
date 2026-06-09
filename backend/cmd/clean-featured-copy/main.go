// clean-featured-copy：清理精选 Agent 的门面文案。
//
// 解决两类问题：
//  1. 脱敏把随机昵称注入了正文（如 Time芒果_花卷ord、香港大学MM芒果_花卷ab直博），
//     以及多出来的空格（如「港中文体验 如何」）—— 用显式「旧→新」逐条修正。
//  2. 自动生成的垃圾示例问题（后缀「有什么实战经验？」「可以对应哪些去向？」
//     「具体要注意什么？」「能分享什么？」以及残缺的「](https…」）—— 用模式批量删除。
//
// 作用范围：仅「精选」Agent（featured_rank 或 featured_collection 非空），与 list-featured-copy 一致。
// 默认 dry-run，只有加 -apply 才写库。每一处改动都会打印；显式「旧值」若一行都没匹配上会告警，
// 方便你把没生效的条目反馈给我再修。
package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

// ——— 显式字段修正（按字段精确匹配旧值，命中即替换；跨 Agent 生效）———

var headlineEdits = [][2]string{
	{`鲸鱼ya吃火锅 · 芒果_花卷a薯条7听播客 考研`, `鲸鱼ya吃火锅`},
}

var shortBioEdits = [][2]string{
	{`阿龙先做直播带货和囤货，亏过钱，后来用AI做电商图文带货。他更常聊选品、退货率、流量能力，以及为什么后来转向个人IP。`,
		`阿龙先做直播带货和囤货，亏过钱，后来用AI做电商图文带货。`},
	{`大二下才决定出国，前几学期绩点烂掉，靠科研实习把曲线拉回来。讲清楚后期能补什么、补不了什么`,
		`大二下才决定出国，前几学期绩点烂，但靠科研实习把曲线拉回来。`},
	{`不死磕一条路，做过HRBP、安永金融咨询、阳狮广告，最后选了Marketing。相信「适合自己的才最好」`,
		`不死磕一条路，做过HRBP、安永金融咨询、阳狮广告，最后选了Marketing。`},
	{`深圳大学芒果_花卷a薯条7听播客法学，中国政法大学法学宪法学与行政 法学专业，分享考研经验与备考心得。`,
		`分享考研经验与备考心得`},
	{`深圳大学CompSci计软，香港大学MM芒果_花卷ab直博@CS，分享保研经验与备考心得。`,
		`深圳大学CompSci计软，分享保研经验 与备考心得。`},
	{`华东理工大学社会与公共管理学院行政管理，山东大学，分享保研经验。`,
		`华东理工大学社会与公共管理学院行政管理保研山东大学`},
}

var welcomeEdits = [][2]string{
	{`我是红总。计算机背景，但走的是大厂运营路。你想聊计算机学生转运营、美团实习、校招准备、实习和课程怎么平衡，可以问我。`,
		`我是红总。计算机背景，但走的是大厂运营。你想聊计算机学生转运营、美团实习、校招准备、实习和课程怎么平衡，可以问我`},
	{`我是豆奶_红豆。要不要海投、怎么挑自己真想去的项目、港中文体验 如何，都能聊。`,
		`我是豆奶_红豆。要不要海投、怎么挑自己真想去的项目、港中文体验如何，都能聊。`},
	{`我是猫头鹰x去爬山。该不该出国、怎么权衡得失、怎么过滤情绪化信 息，都能找我聊。`,
		`我是猫头鹰x去爬山。该不该出国、怎么权衡得失、怎么过滤情绪化信息，都能找我聊。`},
	{`你好这里是Time芒果_花卷ord，有什么需要帮忙的吗`,
		`你好这里是Timelord，有什么需要帮忙的吗`},
}

// ——— 示例问题：显式「旧→新」（保留并清洗，必须在垃圾过滤之前生效）———

var sampleReplaces = [][2]string{
	{`学长当时的考研的目标院校是明确的还是有所变化有什么实战经验？`, `当时的考研的目标院校是明确的还是有所变化？`},
	{`学姐关于确定专业及院校有何经验？有什么实战经验？`, `学姐关于确定专业及院校有何经验？`},
	{`初试各个科目学姐是如何备考的？有什么实战经验？`, `初试各个科目学姐是如何备考的？`},
	{`内推/提前批有什么实战经验？`, `内推/提前批有什么经验？`},
	{`成绩排名：对录取影响大吗？`, `成绩排名对录取影响大吗？`},
	{`综合排名：对录取影响大吗？`, `综合排名对录取影响大吗？`},
	{`绩点：对录取影响大吗？`, `绩点对录取影响大吗？`},
}

// ——— 示例问题：按 Agent 昵称精确删除（避免误删别人同名问题）———

type scopedDel struct{ name, q string }

var scopedDeletes = []scopedDel{
	{`豆奶_红豆`, `申请港校`}, // 与「怎么申请港校」重复，去掉这条
}

// ——— 示例问题：垃圾模式（命中任一子串即删除）———
// 注意：清洗替换（sampleReplaces）先执行，保留下来的问题已不含这些后缀，故不会误删。

var junkSubstrings = []string{
	`有什么实战经验`,
	`可以对应哪些去向`,
	`具体要注意什么`,
	`能分享什么`,
	`](https`,
}

func main() {
	apply := flag.Bool("apply", false, "写入数据库（缺省为 dry-run 预览）")
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
	db.DB.Where("featured_rank IS NOT NULL OR featured_collection IS NOT NULL").Find(&profiles)

	// 统计每条显式规则命中了几行，便于事后告警没生效的条目。
	hit := map[string]int{}
	mark := func(old string) { hit[old]++ }

	changedProfiles := 0
	totalSampleRemoved := 0

	for i := range profiles {
		p := &profiles[i]
		updates := map[string]any{}

		if nv, ok := applyFieldEdit(p.Headline, headlineEdits, mark); ok {
			fmt.Printf("[标题] %s\n  - %s\n  + %s\n", p.DisplayName, p.Headline, nv)
			updates["headline"] = nv
		}
		if nv, ok := applyFieldEdit(p.ShortBio, shortBioEdits, mark); ok {
			fmt.Printf("[简介] %s\n  - %s\n  + %s\n", p.DisplayName, p.ShortBio, nv)
			updates["short_bio"] = nv
		}
		if nv, ok := applyFieldEdit(p.WelcomeMessage, welcomeEdits, mark); ok {
			fmt.Printf("[欢迎语] %s\n  - %s\n  + %s\n", p.DisplayName, p.WelcomeMessage, nv)
			updates["welcome_message"] = nv
		}

		orig := []string(p.SampleQuestions)
		cleaned, removed, replaced := cleanSamples(orig, p.DisplayName, mark)
		if len(removed) > 0 || replaced > 0 {
			fmt.Printf("[示例问题] %s  （%d→%d）\n", p.DisplayName, len(orig), len(cleaned))
			for _, r := range removed {
				fmt.Printf("    ✗ %s\n", r)
			}
			updates["sample_questions"] = models.JSONArray(cleaned)
			totalSampleRemoved += len(removed)
		}

		if len(updates) == 0 {
			continue
		}
		changedProfiles++
		if *apply {
			if err := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).Updates(updates).Error; err != nil {
				log.Printf("  ⚠ 写入失败 %s: %v", p.DisplayName, err)
			}
		}
	}

	// 没命中的显式规则告警（昵称/正文如有差异，这里会暴露出来）。
	fmt.Println("\n——— 显式规则命中情况 ———")
	warnUnmatched("标题", headlineEdits, hit)
	warnUnmatched("简介", shortBioEdits, hit)
	warnUnmatched("欢迎语", welcomeEdits, hit)
	warnUnmatched("示例问题改写", sampleReplaces, hit)

	fmt.Printf("\n=== 汇总：%d 个 Agent 有改动，删除示例问题 %d 条 ===\n", changedProfiles, totalSampleRemoved)
	if !*apply {
		fmt.Println("[dry-run] 未写库。确认无误后加 -apply 执行。")
	} else {
		fmt.Println("✓ 已写入。")
	}
}

// applyFieldEdit 在编辑表里找精确等于 cur 的旧值，命中则返回新值。
func applyFieldEdit(cur string, edits [][2]string, mark func(string)) (string, bool) {
	for _, e := range edits {
		if cur == e[0] {
			mark(e[0])
			return e[1], true
		}
	}
	return "", false
}

// cleanSamples 处理一个 Agent 的示例问题：先按显式表改写，再按昵称删除，
// 再按垃圾模式删除，最后去重（保留首次出现）。返回清洗后列表、被删项、改写次数。
func cleanSamples(qs []string, name string, mark func(string)) (out []string, removed []string, replaced int) {
	replaceMap := map[string]string{}
	for _, r := range sampleReplaces {
		replaceMap[r[0]] = r[1]
	}
	seen := map[string]bool{}
	for _, q := range qs {
		cur := q
		if nv, ok := replaceMap[cur]; ok {
			mark(cur)
			cur = nv
			replaced++
		}
		if isScopedDeleted(name, cur) {
			removed = append(removed, q)
			continue
		}
		if junk, _ := isJunk(cur); junk {
			removed = append(removed, q)
			continue
		}
		if seen[cur] {
			removed = append(removed, q+"  (重复)")
			continue
		}
		seen[cur] = true
		out = append(out, cur)
	}
	return out, removed, replaced
}

func isScopedDeleted(name, q string) bool {
	for _, d := range scopedDeletes {
		if d.name == name && d.q == q {
			return true
		}
	}
	return false
}

func isJunk(q string) (bool, string) {
	for _, sub := range junkSubstrings {
		if strings.Contains(q, sub) {
			return true, sub
		}
	}
	return false, ""
}

func warnUnmatched(label string, edits [][2]string, hit map[string]int) {
	for _, e := range edits {
		if hit[e[0]] == 0 {
			fmt.Printf("  ⚠ [%s] 未匹配任何行：%q\n", label, e[0])
		} else {
			fmt.Printf("  ✓ [%s] 命中 %d 行：%.30s…\n", label, hit[e[0]], e[1])
		}
	}
}
