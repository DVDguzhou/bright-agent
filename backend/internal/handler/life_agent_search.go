package handler

import (
	"log"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"unicode"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

// =============================================================================
// LifeAgentsSearch —— 广场搜索后端实现
//
// 目标：
//  1) 将原先在前端 `life-agent-feed-search.ts` 的打分移到后端，避免拉全量数据到浏览器。
//  2) 支持中文 query（二元切分，兼容无空格中文整句）。
//  3) 空查询：按业务指标排序；有查询但无词法命中：兜底按业务指标返回，携带 fallback=true。
//
// 路由：GET /api/life-agents/search?q=&limit=&offset=
// 返回：{ items, nextCursor, total, fallback }
// =============================================================================

// 查询归一化规则（与前端保持一致）
var queryAliasPatterns = []struct {
	re   *regexp.Regexp
	repl string
}{
	{regexp.MustCompile(`(?i)qs\s*(?:top\s*)?(\d+)`), "qs前$1"},
	{regexp.MustCompile(`(?i)(^|\s)top\s*(\d+)(\s|$)`), "$1qs前$2$3"},
	{regexp.MustCompile(`(^|\s)前(\d+)(\s|$)`), "$1qs前$2$3"},
	{regexp.MustCompile(`(?i)shuang\s*fei`), "双非"},
	{regexp.MustCompile(`(?i)shuang\s*yi\s*liu`), "双一流"},
}

// 同义/相关词扩展
var relatedTermGroups = [][]string{
	{"考研", "就业", "读研", "保研", "调剂"},
	{"求职", "秋招", "春招", "面试", "简历"},
	{"转行", "offer", "跳槽"},
	{"职业规划", "副业", "创业"},
	{"体制内", "考公", "考编"},
	{"留学", "托福", "雅思", "申请", "文书", "gre", "toefl", "ielts"},
	{"实习", "校招", "社招", "内推"},
	{"产品", "运营", "开发", "设计"},
	{"金融", "互联网", "咨询"},
	{"北京", "上海", "广州", "深圳"},
	{"杭州", "成都", "南京", "武汉"},
	{"远程", "居家", "线下", "兼职"},
	{"大厂", "初创", "外企"},
	{"离职", "offer", "裸辞"},
	{"涨薪", "晋升", "转岗"},
	{"985", "211", "双一流", "双非", "海外院校"},
	{"qs前50", "qs前100", "qs前200", "qs200以下"},
	{"美国", "英国", "澳大利亚", "加拿大", "新加坡", "日本", "韩国"},
	{"欧洲", "北美", "亚洲", "大洋洲"},
	{"中国香港", "中国台湾"},
	{"phd", "博士", "直博", "读博", "博士申请"},
	{"硕士", "master", "ms", "研究生"},
}

// 高频无意义字/词，避免把查询里 "我想找个..." 之类的助词当作搜索关键词导致误匹配
var stopwords = map[string]bool{
	// 中文助词
	"我": true, "你": true, "他": true, "她": true, "的": true, "了": true,
	"想": true, "要": true, "找": true, "个": true, "和": true, "是": true,
	"怎": true, "么": true, "吗": true, "呢": true, "啊": true, "哦": true,
	"一": true, "这": true, "那": true, "有": true, "请": true, "帮": true,
	"给": true, "在": true, "把": true, "被": true, "吧": true, "也": true,
	"都": true, "就": true, "还": true, "但": true, "对": true, "从": true,
	// 英文 stop words
	"a": true, "an": true, "the": true, "is": true, "are": true, "am": true,
	"of": true, "to": true, "for": true, "and": true, "or": true, "in": true,
	"on": true, "how": true, "what": true, "with": true, "by": true, "at": true,
	"as": true, "be": true, "it": true, "its": true, "this": true, "that": true,
}

type expandedQuery struct {
	raw          string
	normalized   string
	directTerms  map[string]float64 // term -> weight multiplier
	relatedTerms map[string]float64
	hasQuery     bool
}

// normalizeQuery 做 lowercase + 预定义别名替换
func normalizeQuery(raw string) string {
	q := strings.ToLower(strings.TrimSpace(raw))
	for _, rule := range queryAliasPatterns {
		q = rule.re.ReplaceAllString(q, rule.repl)
	}
	return strings.TrimSpace(q)
}

// isCJK 判断是否是 CJK 文字（中/日/韩）
func isCJK(r rune) bool {
	return unicode.Is(unicode.Han, r)
}

// isWordRune 判断是否是可作为搜索 term 一部分的字符
func isWordRune(r rune) bool {
	if r == '+' || r == '#' || r == '.' {
		return true
	}
	return unicode.IsLetter(r) || unicode.IsDigit(r)
}

// tokenize 将查询切成搜索 term：
//   - 连续 CJK 字符视作一段，整段 + 所有 bigram 都作为 term
//   - 连续 ASCII 字母数字视作一段，整段作为 term（需 >=2 字符）
//   - 过滤停用词
func tokenize(normalized string) map[string]float64 {
	terms := map[string]float64{}
	runes := []rune(normalized)
	n := len(runes)
	i := 0
	for i < n {
		r := runes[i]
		if !isWordRune(r) {
			i++
			continue
		}
		if isCJK(r) {
			// 找到 CJK 连续段
			j := i
			for j < n && isCJK(runes[j]) {
				j++
			}
			seg := string(runes[i:j])
			segLen := j - i
			// 整段：权重 1
			if segLen >= 2 && !stopwords[seg] {
				terms[seg] = max64(terms[seg], 1.0)
			} else if segLen == 1 && !stopwords[seg] {
				// 单字一般信息量低，给较低权重但仍然保留
				terms[seg] = max64(terms[seg], 0.4)
			}
			// bigram：权重 0.55
			if segLen >= 2 {
				for k := i; k < j-1; k++ {
					bi := string(runes[k : k+2])
					if stopwords[bi] {
						continue
					}
					// 避免单字停用词组成的无意义 bigram（例如 "我的"、"的人"）
					if stopwords[string(runes[k])] && stopwords[string(runes[k+1])] {
						continue
					}
					terms[bi] = max64(terms[bi], 0.55)
				}
			}
			i = j
		} else {
			// ASCII / 数字段
			j := i
			for j < n && isWordRune(runes[j]) && !isCJK(runes[j]) {
				j++
			}
			seg := string(runes[i:j])
			if len(seg) >= 2 && !stopwords[seg] {
				terms[seg] = max64(terms[seg], 1.0)
			} else if len(seg) == 1 && unicode.IsDigit(runes[i]) {
				// 单个数字也保留（比如 "5"）
				terms[seg] = max64(terms[seg], 0.4)
			}
			i = j
		}
	}
	return terms
}

func max64(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

// expandQuery 对外暴露（导出便于测试）：归一化 + 切词 + 同义扩展
func expandQuery(raw string) expandedQuery {
	normalized := normalizeQuery(raw)
	if normalized == "" {
		return expandedQuery{raw: raw}
	}
	direct := tokenize(normalized)
	// 把整条归一化查询也作为一个 term（匹配长词组整句命中）
	if _, ok := direct[normalized]; !ok && !stopwords[normalized] {
		direct[normalized] = max64(direct[normalized], 1.0)
	}

	related := map[string]float64{}
	for _, group := range relatedTermGroups {
		matched := false
		for _, t := range group {
			tl := strings.ToLower(t)
			if strings.Contains(normalized, tl) {
				matched = true
				break
			}
			if _, ok := direct[tl]; ok {
				matched = true
				break
			}
		}
		if !matched {
			continue
		}
		for _, t := range group {
			tl := strings.ToLower(t)
			if _, ok := direct[tl]; ok {
				continue
			}
			related[tl] = max64(related[tl], 1.0)
		}
	}

	return expandedQuery{
		raw:          raw,
		normalized:   normalized,
		directTerms:  direct,
		relatedTerms: related,
		hasQuery:     true,
	}
}

// searchField 单个字段
type searchField struct {
	name   string
	value  string
	weight float64
}

func collectSearchFields(p *models.LifeAgentProfile) []searchField {
	return []searchField{
		{"displayName", p.DisplayName, 8.0},
		{"expertiseTags", strings.Join([]string(p.ExpertiseTags), " "), 7.0},
		{"headline", p.Headline, 5.5},
		{"sampleQuestions", strings.Join([]string(p.SampleQuestions), " "), 5.0},
		{"shortBio", p.ShortBio, 4.5},
		{"longBio", p.LongBio, 2.0},
		{"audience", p.Audience, 3.0},
		{"school", ptrStr(p.School), 4.0},
		{"job", ptrStr(p.Job), 4.0},
		{"education", ptrStr(p.Education), 3.5},
		{"regions", strings.Join([]string(p.Regions), " "), 3.0},
		{"country", ptrStr(p.Country), 2.5},
		{"province", ptrStr(p.Province), 2.5},
		{"city", ptrStr(p.City), 2.5},
		{"county", ptrStr(p.County), 2.0},
		{"welcomeMessage", p.WelcomeMessage, 1.5},
		{"income", ptrStr(p.Income), 1.5},
		{"notSuitableFor", ptrStr(p.NotSuitableFor), 0.8},
	}
}

type fieldScore struct {
	score   float64
	matched bool
}

func scoreField(f searchField, q expandedQuery) fieldScore {
	if !q.hasQuery {
		return fieldScore{}
	}
	v := strings.ToLower(f.value)
	if v == "" {
		return fieldScore{}
	}
	var score float64
	directHits := 0
	relatedHits := 0

	// 整条 query 子串命中（强信号）
	if strings.Contains(v, q.normalized) {
		score += f.weight * 1.8
	}

	for term, w := range q.directTerms {
		if term == "" {
			continue
		}
		if strings.Contains(v, term) {
			directHits++
			score += f.weight * w
		}
	}
	for term, w := range q.relatedTerms {
		if term == "" {
			continue
		}
		if strings.Contains(v, term) {
			relatedHits++
			score += f.weight * 0.35 * w
		}
	}

	if directHits > 1 {
		score += f.weight * 0.6
	}
	if directHits == 0 && relatedHits >= 2 {
		score += f.weight * 0.4
	}

	return fieldScore{score: score, matched: score > 0}
}

// profileStats 业务指标
type profileStats struct {
	KnowledgeCount    int64
	SoldQuestionPacks int64
	SessionCount      int64
	RatingAvg         float64
	RatingRaters      int64
}

func normalizeBusinessMetric(v float64, scale float64) float64 {
	if v <= 0 || scale <= 0 {
		return 0
	}
	x := v / scale
	if x > 1 {
		x = 1
	}
	return x
}

func scoreBusiness(s profileStats) float64 {
	sold := normalizeBusinessMetric(float64(s.SoldQuestionPacks), 80)
	sessions := normalizeBusinessMetric(float64(s.SessionCount), 120)
	knowledge := normalizeBusinessMetric(float64(s.KnowledgeCount), 40)
	ratingScore := normalizeBusinessMetric(s.RatingAvg, 5)
	ratingTrust := normalizeBusinessMetric(float64(s.RatingRaters), 50)
	return sold*0.42 + sessions*0.18 + knowledge*0.12 + ratingScore*0.18 + ratingTrust*0.10
}

// loadProfileStats 统一读取业务指标（一次性批量查询，避免 N+1）
func loadProfileStats(ids []string) map[string]profileStats {
	res := make(map[string]profileStats, len(ids))
	if len(ids) == 0 {
		return res
	}
	for _, id := range ids {
		res[id] = profileStats{}
	}
	type row struct {
		ProfileID string  `gorm:"column:profile_id"`
		Cnt       int64   `gorm:"column:cnt"`
		Avg       float64 `gorm:"column:avg"`
	}
	var kRows []row
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_knowledge_entries WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&kRows)
	for _, r := range kRows {
		s := res[r.ProfileID]
		s.KnowledgeCount = r.Cnt
		res[r.ProfileID] = s
	}
	var qpRows []row
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_question_packs WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&qpRows)
	for _, r := range qpRows {
		s := res[r.ProfileID]
		s.SoldQuestionPacks = r.Cnt
		res[r.ProfileID] = s
	}
	var sessRows []row
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_chat_sessions WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&sessRows)
	for _, r := range sessRows {
		s := res[r.ProfileID]
		s.SessionCount = r.Cnt
		res[r.ProfileID] = s
	}
	var rRows []row
	db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt, COALESCE(AVG(score),0) AS avg FROM life_agent_ratings WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&rRows)
	for _, r := range rRows {
		s := res[r.ProfileID]
		s.RatingRaters = r.Cnt
		s.RatingAvg = r.Avg
		res[r.ProfileID] = s
	}
	return res
}

type scoredProfile struct {
	profile models.LifeAgentProfile
	lexical float64
	total   float64
	matched []string
}

// LifeAgentsSearch 搜索端点
func LifeAgentsSearch(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw := strings.TrimSpace(c.Query("q"))
		limit := 24
		if s := strings.TrimSpace(c.Query("limit")); s != "" {
			if v, err := strconv.Atoi(s); err == nil && v > 0 {
				limit = v
			}
		}
		if limit > 100 {
			limit = 100
		}
		offset := 0
		if s := strings.TrimSpace(c.Query("offset")); s != "" {
			if v, err := strconv.Atoi(s); err == nil && v >= 0 {
				offset = v
			}
		} else if cur := strings.TrimSpace(c.Query("cursor")); cur != "" {
			if v, err := strconv.Atoi(cur); err == nil && v >= 0 {
				offset = v
			}
		}

		var profiles []models.LifeAgentProfile
		if err := db.DB.Where("published = ?", true).
			Order("updated_at DESC").Order("id DESC").
			Find(&profiles).Error; err != nil {
			log.Printf("[life-agent-search] load profiles failed: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		// 收集 profile id 以批量加载业务指标
		ids := make([]string, len(profiles))
		for i, p := range profiles {
			ids[i] = p.ID
		}
		stats := loadProfileStats(ids)

		q := expandQuery(raw)

		scored := make([]scoredProfile, 0, len(profiles))
		for i := range profiles {
			p := profiles[i]
			var lex float64
			var matched []string
			if q.hasQuery {
				for _, f := range collectSearchFields(&p) {
					fs := scoreField(f, q)
					lex += fs.score
					if fs.matched {
						matched = append(matched, f.name)
					}
				}
			}
			biz := scoreBusiness(stats[p.ID])
			var total float64
			if q.hasQuery {
				total = lex*0.9 + biz*10
			} else {
				total = biz
			}
			scored = append(scored, scoredProfile{
				profile: p,
				lexical: lex,
				total:   total,
				matched: matched,
			})
		}

		fallback := false
		if q.hasQuery {
			tmp := make([]scoredProfile, 0, len(scored))
			for _, s := range scored {
				if s.lexical > 0 {
					tmp = append(tmp, s)
				}
			}
			if len(tmp) == 0 {
				// 词法完全无命中 —— 兜底按业务分返回，避免前端"啥也搜不出来"
				fallback = true
				for i := range scored {
					scored[i].total = scoreBusiness(stats[scored[i].profile.ID])
				}
			} else {
				scored = tmp
			}
		}

		sort.SliceStable(scored, func(i, j int) bool {
			if scored[i].total != scored[j].total {
				return scored[i].total > scored[j].total
			}
			if scored[i].lexical != scored[j].lexical {
				return scored[i].lexical > scored[j].lexical
			}
			return stats[scored[i].profile.ID].SoldQuestionPacks > stats[scored[j].profile.ID].SoldQuestionPacks
		})

		total := len(scored)
		if offset > total {
			offset = total
		}
		end := offset + limit
		if end > total {
			end = total
		}
		pageProfiles := make([]models.LifeAgentProfile, 0, end-offset)
		for _, s := range scored[offset:end] {
			pageProfiles = append(pageProfiles, s.profile)
		}

		items := lifeAgentListResponseItems(pageProfiles)
		nextCursor := ""
		if end < total {
			nextCursor = strconv.Itoa(end)
		}

		c.JSON(http.StatusOK, gin.H{
			"items":      items,
			"nextCursor": nextCursor,
			"total":      total,
			"fallback":   fallback,
			"query":      raw,
		})
	}
}
