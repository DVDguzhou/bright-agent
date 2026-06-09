// clean-featured-copy：清理精选 Agent 的门面文案。
//
// 解决两类问题：
//  1. 脱敏把随机昵称注入了正文（如 Time芒果_花卷ord、香港大学MM芒果_花卷ab直博），
//     以及多出来的空格 —— 用「按昵称」或「按锚点子串」定位后整段改写（幂等，重复跑安全）。
//  2. 自动生成的垃圾示例问题（后缀「有什么实战经验？」「可以对应哪些去向？」
//     「具体要注意什么？」「能分享什么？」以及残缺的「](https…」）—— 用模式批量删除。
//
// 作用范围：仅「精选」Agent（featured_rank 或 featured_collection 非空），与 list-featured-copy 一致。
// 默认 dry-run，只有加 -apply 才写库。每一处改动都会打印；显式规则若一行都没匹配上会告警。
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

// ——— 字段修正：按「昵称」或「锚点子串」定位，整段替换为 newVal（幂等）———
// byName 优先：display_name 精确等于 byName 即命中。
// 否则用 anchor：该字段当前值包含 anchor 即命中。
// 锚点都挑了不含空格的稳定片段，避开终端折行产生的假空格。

type fieldFix struct {
	field  string // "headline" | "short_bio" | "welcome_message"
	byName string
	anchor string
	newVal string
}

var fieldFixes = []fieldFix{
	// —— 标题 ——
	{field: "headline", byName: "鲸鱼ya吃火锅", newVal: "鲸鱼ya吃火锅"},
	// 爱丁堡HPC 去重：保留慵懒的锦鲤7，把它的标题/简介换成新版（海星_麻薯 已移出 jingpin）
	{field: "headline", byName: "慵懒的锦鲤7", newVal: "深大计软→爱丁堡 HPC， 低gpa"},

	// —— 简介 ——
	{field: "short_bio", byName: "用AI做图文带货的阿龙",
		newVal: "阿龙先做直播带货和囤货，亏过钱，后来用AI做电商图文带货。"},
	{field: "short_bio", byName: "慵懒的锦鲤7", newVal: "低gpa怎么翻盘"},
	{field: "short_bio", anchor: "不死磕一条路",
		newVal: "不死磕一条路，做过HRBP、安永金融咨询、阳狮广告，最后选了Marketing。"},
	{field: "short_bio", anchor: "宪法学与行政",
		newVal: "分享考研经验与备考心得"},
	{field: "short_bio", byName: "安静的松鼠君",
		newVal: "深圳大学CompSci计软，分享保研经验 与备考心得。"},
	{field: "short_bio", byName: "葡萄呀泡咖啡",
		newVal: "华东理工大学社会与公共管理学院行政管理保研山东大学"},

	// —— 欢迎语 ——
	{field: "welcome_message", byName: "从计算机转运营的红总",
		newVal: "我是红总。计算机背景，但走的是大厂运营。你想聊计算机学生转运营、美团实习、校招准备、实习和课程怎么平衡，可以问我"},
	{field: "welcome_message", byName: "豆奶_红豆",
		newVal: "我是豆奶_红豆。要不要海投、怎么挑自己真想去的项目、港中文体验如何，都能聊。"},
	{field: "welcome_message", byName: "猫头鹰x去爬山",
		newVal: "我是猫头鹰x去爬山。该不该出国、怎么权衡得失、怎么过滤情绪化信息，都能找我聊。"},
	{field: "welcome_message", byName: "Timelord",
		newVal: "你好这里是Timelord，有什么需要帮忙的吗"},
	{field: "welcome_message", byName: "凌晨四点半",
		newVal: "Hello，我是凌晨四点半。可以解答考研怎么熬、408怎么准备、上岸之后读研工作体验。"},
	{field: "welcome_message", byName: "专升本进AI数据岗的学长",
		newVal: "我走过职高、专升本，也做过字节AI数据运营。你想聊学历一般怎么找机会、AI岗位、信息差、实习路径，可以问我。"},
	{field: "welcome_message", byName: "从理想销售转招聘的Jeff",
		newVal: "你好呀，我是Jeff。机械本科、人文地理研究生，做过理想汽车销售，也转到美团招聘。你想聊跨专业求职、销售转HR、猎头实习、校招路径，可以问我。"},
}

// ——— 示例问题：显式「旧→新」（保留并清洗，必须在垃圾过滤之前生效）———
// 一次性规则：首轮 -apply 已生效；重复跑时旧值已不存在会安静跳过，不影响结果。

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
	{`豆奶_红豆`, `申请港校`},        // 与「怎么申请港校」重复，去掉这条
	{`海星_麻薯`, `国外生活是怎么样的`}, // 该 Agent 不要这条（其余 Agent 仍保留同名问题）
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

	fixMatched := make([]int, len(fieldFixes)) // 每条 fieldFix 命中了几个 Agent
	changedProfiles := 0
	totalSampleRemoved := 0

	for i := range profiles {
		p := &profiles[i]
		updates := map[string]any{}

		// 字段修正
		for fi := range fieldFixes {
			fx := fieldFixes[fi]
			cur := fieldValue(p, fx.field)
			if !fixMatches(p, fx, cur) {
				continue
			}
			fixMatched[fi]++
			if cur == fx.newVal {
				continue // 已是目标值，幂等跳过
			}
			label := map[string]string{"headline": "标题", "short_bio": "简介", "welcome_message": "欢迎语"}[fx.field]
			fmt.Printf("[%s] %s\n  - %s\n  + %s\n", label, p.DisplayName, cur, fx.newVal)
			updates[fx.field] = fx.newVal
		}

		// 示例问题清洗
		orig := []string(p.SampleQuestions)
		cleaned, removed, _ := cleanSamples(orig, p.DisplayName)
		if len(removed) > 0 {
			fmt.Printf("[示例问题] %s  （%d→%d）\n", p.DisplayName, len(orig), len(cleaned))
			for _, r := range removed {
				fmt.Printf("    ✗ %s\n", r)
			}
			updates["sample_questions"] = models.JSONArray(cleaned)
			totalSampleRemoved += len(removed)
		} else if !sameStrings(orig, cleaned) {
			// 仅顺序内改写（无删除）也要落库
			updates["sample_questions"] = models.JSONArray(cleaned)
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

	// 字段修正命中情况：没命中说明昵称/锚点和库里对不上，需要反馈
	fmt.Println("\n——— 字段修正命中情况 ———")
	for fi, fx := range fieldFixes {
		key := fx.byName
		if key == "" {
			key = "锚点:" + fx.anchor
		}
		if fixMatched[fi] == 0 {
			fmt.Printf("  ⚠ [%s] 未匹配任何 Agent：%s\n", fx.field, key)
		} else {
			fmt.Printf("  ✓ [%s] 命中 %d 个：%s\n", fx.field, fixMatched[fi], key)
		}
	}

	fmt.Printf("\n=== 汇总：%d 个 Agent 有改动，删除示例问题 %d 条 ===\n", changedProfiles, totalSampleRemoved)
	if !*apply {
		fmt.Println("[dry-run] 未写库。确认无误后加 -apply 执行。")
	} else {
		fmt.Println("✓ 已写入。")
	}
}

func fieldValue(p *models.LifeAgentProfile, field string) string {
	switch field {
	case "headline":
		return p.Headline
	case "short_bio":
		return p.ShortBio
	case "welcome_message":
		return p.WelcomeMessage
	}
	return ""
}

func fixMatches(p *models.LifeAgentProfile, fx fieldFix, cur string) bool {
	if fx.byName != "" {
		return p.DisplayName == fx.byName
	}
	if fx.anchor != "" {
		return strings.Contains(cur, fx.anchor)
	}
	return false
}

// cleanSamples 处理一个 Agent 的示例问题：先按显式表改写，再按昵称删除，
// 再按垃圾模式删除，最后去重（保留首次出现）。返回清洗后列表、被删项、改写次数。
func cleanSamples(qs []string, name string) (out []string, removed []string, replaced int) {
	replaceMap := map[string]string{}
	for _, r := range sampleReplaces {
		replaceMap[r[0]] = r[1]
	}
	seen := map[string]bool{}
	for _, q := range qs {
		cur := q
		if nv, ok := replaceMap[cur]; ok {
			cur = nv
			replaced++
		}
		if isScopedDeleted(name, cur) {
			removed = append(removed, q)
			continue
		}
		if isJunk(cur) {
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

func isJunk(q string) bool {
	for _, sub := range junkSubstrings {
		if strings.Contains(q, sub) {
			return true
		}
	}
	return false
}

func sameStrings(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
