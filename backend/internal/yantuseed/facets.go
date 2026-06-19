package yantuseed

import (
	"sort"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
)

const (
	AxisPathPrefix     = "路径:"
	AxisIdentityPrefix = "身份:"
	JingpinCollection  = "jingpin"
)

// DiscoverFeedICPOrderSQL 主 feed ICP 命中优先（0=命中，1=未命中）。依赖 expertise_tags 中的轴标签。
const DiscoverFeedICPOrderSQL = `CASE WHEN (
	expertise_tags LIKE '%"` + AxisIdentityPrefix + `双非"%' OR
	expertise_tags LIKE '%"` + AxisIdentityPrefix + `二本"%' OR
	expertise_tags LIKE '%"` + AxisIdentityPrefix + `专科"%' OR
	expertise_tags LIKE '%"` + AxisIdentityPrefix + `普通一本"%' OR
	expertise_tags LIKE '%"` + AxisIdentityPrefix + `211"%'
) AND (
	expertise_tags LIKE '%"` + AxisPathPrefix + `考研"%' OR
	expertise_tags LIKE '%"` + AxisPathPrefix + `留学"%' OR
	expertise_tags LIKE '%"` + AxisPathPrefix + `找工作"%' OR
	expertise_tags LIKE '%"` + AxisPathPrefix + `找实习"%' OR
	expertise_tags LIKE '%"` + AxisPathPrefix + `创业"%'
) THEN 0 ELSE 1 END ASC`

// 路径轴受控词（按 ICP 相关度分组）。
var (
	pathCore    = []string{"考研", "留学", "找工作", "找实习", "创业"}
	pathMinor   = []string{"保研", "转专业", "专升本"}
	allPathKeys = append(append([]string{}, pathCore...), pathMinor...)
)

// ProfileFacetInput 用于路径/身份推断的字段集合（yantuseed Profile 与 DB 模型共用）。
type ProfileFacetInput struct {
	DisplayName     string
	Headline        string
	ShortBio        string
	LongBio         string
	Audience        string
	Job             string
	School          string
	ExpertiseTags   []string
	SampleQuestions []string
}

// ProfileFacetInputFromModel 从 DB 模型构造推断输入。
func ProfileFacetInputFromModel(p models.LifeAgentProfile) ProfileFacetInput {
	school := ""
	if p.School != nil {
		school = *p.School
	}
	job := ""
	if p.Job != nil {
		job = *p.Job
	}
	return ProfileFacetInput{
		DisplayName:     p.DisplayName,
		Headline:        p.Headline,
		ShortBio:        p.ShortBio,
		LongBio:         p.LongBio,
		Audience:        p.Audience,
		Job:             job,
		School:          school,
		ExpertiseTags:   []string(p.ExpertiseTags),
		SampleQuestions: []string(p.SampleQuestions),
	}
}

func profileFacetInputFromSeed(p Profile) ProfileFacetInput {
	return ProfileFacetInput{
		DisplayName:     p.DisplayName,
		Headline:        strings.TrimSpace(p.Headline),
		ShortBio:        strings.TrimSpace(p.ShortBio),
		LongBio:         strings.TrimSpace(p.LongBioPrefix),
		Audience:        strings.TrimSpace(p.Audience),
		Job:             "",
		School:          strings.TrimSpace(p.School),
		ExpertiseTags:   append([]string{}, p.ExpertiseTags...),
		SampleQuestions: append([]string{}, p.SampleQuestions...),
	}
}

func corpusText(in ProfileFacetInput) string {
	parts := []string{
		in.DisplayName, in.Headline, in.ShortBio, in.LongBio, in.Audience, in.Job, in.School,
	}
	parts = append(parts, in.ExpertiseTags...)
	parts = append(parts, in.SampleQuestions...)
	return strings.Join(parts, " ")
}

// contentCorpusText 用于路径推断的正文语料，不含 Audience 等模板话术（常含「保研、考研或升学深造」泛化描述）。
func contentCorpusText(in ProfileFacetInput) string {
	parts := []string{
		in.DisplayName, in.Headline, in.ShortBio, in.LongBio, in.Job, in.School,
	}
	parts = append(parts, stripAxisTags(in.ExpertiseTags)...)
	parts = append(parts, in.SampleQuestions...)
	return strings.Join(parts, " ")
}

// pathSignalCorpusText 用于核心路径（考研/求职/实习）推断，排除 LongBio 模板前缀，避免「升学就业经验Wiki」等误触。
func pathSignalCorpusText(in ProfileFacetInput) string {
	parts := []string{in.DisplayName, in.Headline, in.ShortBio, in.Job}
	parts = append(parts, stripAxisTags(in.ExpertiseTags)...)
	parts = append(parts, in.SampleQuestions...)
	return strings.Join(parts, " ")
}

func hasStrongKaoyanSignal(text string) bool {
	return hasKeyword(text,
		"408", "初试", "复试", "调剂", "二战",
		"考研经验", "考研至", "考研→", "考研->",
		"Sociology 考研", "考研上岸", "考研专业",
	)
}

func isExplicitKaoyanContent(text string) bool {
	if hasStrongKaoyanSignal(text) {
		return true
	}
	if !hasKeyword(text, "考研") {
		return false
	}
	// 排除样例问题里的泛化对比句（如「考研和保研怎么选择？」），不作为真实考研路径。
	if hasKeyword(text, "考研和保研", "保研和考研", "考研或保研", "保研或考研") &&
		!hasKeyword(text, "考研经验", "分享考研", "考研至", "考研→", "考研->", "初试", "408") {
		return false
	}
	return true
}

func isPrimarilyBaoyanProfile(in ProfileFacetInput) bool {
	signal := pathSignalCorpusText(in)
	primary := strings.Join([]string{in.Headline, in.ShortBio}, " ")
	if tags := strings.Join(in.ExpertiseTags, " "); tags != "" {
		primary += " " + tags
	}
	if !hasKeyword(primary, "保研", "推免", "预推免", "夏令营") {
		return false
	}
	if hasKeyword(primary, "实习", "转正", "就业经验", "分享就业", "秋招", "春招", "校招", "求职", "面试", "腾讯", "字节", "美团") {
		return false
	}
	return !isExplicitKaoyanContent(signal)
}

func hasKeyword(text string, keywords ...string) bool {
	for _, kw := range keywords {
		if kw != "" && strings.Contains(text, kw) {
			return true
		}
	}
	return false
}

// InferPathTags 推断路径轴标签（可多个，按优先级排序去重）。
func InferPathTags(in ProfileFacetInput) []string {
	content := contentCorpusText(in)
	signal := pathSignalCorpusText(in)
	existing := make(map[string]bool)
	for _, t := range in.ExpertiseTags {
		t = strings.TrimSpace(t)
		if t == "" || strings.HasPrefix(t, AxisPathPrefix) || strings.HasPrefix(t, AxisIdentityPrefix) {
			continue
		}
		for _, p := range allPathKeys {
			if t == p || strings.Contains(t, p) {
				existing[p] = true
			}
		}
	}

	add := func(path string) {
		if path == "" {
			return
		}
		switch path {
		case "考研":
			if isExplicitKaoyanContent(signal) ||
				hasKeyword(signal, "408", "初试", "复试", "调剂", "二战", "上岸") {
				existing["考研"] = true
			}
		case "留学":
			if hasKeyword(content, "留学", "申请", "文书", "选校", "雅思", "托福", "GRE", "offer", "港校", "飞跃") {
				existing["留学"] = true
			}
		case "找工作":
			if hasKeyword(signal, "找工作", "求职", "秋招", "春招", "校招", "面试", "简历", "offer", "大厂", "转行", "就业经验", "分享就业") {
				existing["找工作"] = true
			}
		case "找实习":
			if hasKeyword(signal, "实习", "暑期实习", "日常实习") && !existing["找工作"] {
				existing["找实习"] = true
			}
			if hasKeyword(signal, "找实习") {
				existing["找实习"] = true
			}
		case "创业":
			if hasKeyword(signal, "创业", "开店", "带货", "自媒体", "一人企业", "副业") {
				existing["创业"] = true
			}
		case "保研":
			if hasKeyword(content, "保研", "推免", "夏令营", "预推免") {
				existing["保研"] = true
			}
		case "转专业":
			if hasKeyword(content, "转专业", "转系", "换专业") {
				existing["转专业"] = true
			}
		case "专升本":
			if hasKeyword(content, "专升本", "3+2", "职高") {
				existing["专升本"] = true
			}
		}
	}

	for _, p := range allPathKeys {
		add(p)
	}

	if hasKeyword(content, "升学深造") {
		if !existing["考研"] && !existing["留学"] && !existing["保研"] {
			if hasKeyword(content, "申请", "留学", "雅思", "托福", "港", "爱丁堡", "曼大", "墨大") {
				existing["留学"] = true
			} else if hasKeyword(content, "保研", "推免", "夏令营") {
				existing["保研"] = true
			}
		}
	}

	if isPrimarilyBaoyanProfile(in) {
		delete(existing, "考研")
		delete(existing, "找工作")
		delete(existing, "找实习")
	}

	out := make([]string, 0, len(existing))
	for _, p := range allPathKeys {
		if existing[p] {
			out = append(out, p)
		}
	}
	if len(out) == 0 {
		if isExplicitKaoyanContent(signal) || hasKeyword(signal, "408", "上岸") {
			out = append(out, "考研")
		}
	}
	return out
}

// InferIdentityTag 依据 school 推断身份轴（唯一）；无法判定返回空。
func InferIdentityTag(school string) string {
	s := strings.TrimSpace(school)
	if s == "" {
		return ""
	}
	if strings.Contains(s, "专科") || strings.Contains(s, "职高") || strings.Contains(s, "高职") {
		return "专科"
	}
	if schools985[s] {
		return "985"
	}
	if schools211[s] {
		return "211"
	}
	if allCNUniversities[s] {
		return "双非"
	}
	return ""
}

func isFeaturedStoreIdentity(identity string) bool {
	switch identity {
	case "双非", "二本", "专科", "普通一本":
		return true
	default:
		return false
	}
}

func isFeedICPIdentity(identity string) bool {
	switch identity {
	case "双非", "二本", "专科", "普通一本", "211":
		return true
	default:
		return false
	}
}

func hasCorePath(pathSet map[string]bool) bool {
	for _, p := range pathCore {
		if pathSet[p] {
			return true
		}
	}
	return false
}

func pathSetFrom(in ProfileFacetInput) map[string]bool {
	paths := InferPathTags(in)
	set := make(map[string]bool, len(paths))
	for _, p := range paths {
		set[p] = true
	}
	return set
}

// FeedICPHit 主 feed ICP 命中：身份∈双非及同档+211 且 路径∈核心路径。
func FeedICPHit(in ProfileFacetInput) bool {
	identity := InferIdentityTag(in.School)
	if !isFeedICPIdentity(identity) {
		return false
	}
	return hasCorePath(pathSetFrom(in))
}

// DiscoverFeedOrderClauses 主 feed（发现列表）ORDER BY 子句，与 handler 共用。
func DiscoverFeedOrderClauses() []string {
	return []string{
		DiscoverFeedICPOrderSQL,
		"featured_rank IS NULL ASC",
		"featured_rank ASC",
		"updated_at DESC",
		"id DESC",
	}
}

// DiscoverFeedLess 主 feed 排序比较（与 SQL ORDER BY 语义一致）。
func DiscoverFeedLess(aIn ProfileFacetInput, aRank *int, aUpdated time.Time, aID string,
	bIn ProfileFacetInput, bRank *int, bUpdated time.Time, bID string) bool {
	aICP, bICP := FeedICPHit(aIn), FeedICPHit(bIn)
	if aICP != bICP {
		return aICP
	}
	aHasRank, bHasRank := aRank != nil, bRank != nil
	if aHasRank != bHasRank {
		return aHasRank
	}
	if aHasRank && bHasRank && *aRank != *bRank {
		return *aRank < *bRank
	}
	if !aUpdated.Equal(bUpdated) {
		return aUpdated.After(bUpdated)
	}
	return aID > bID
}

func stripAxisTags(tags []string) []string {
	out := make([]string, 0, len(tags))
	for _, t := range tags {
		t = strings.TrimSpace(t)
		if t == "" || strings.HasPrefix(t, AxisPathPrefix) || strings.HasPrefix(t, AxisIdentityPrefix) {
			continue
		}
		out = append(out, t)
	}
	return out
}

// MergeAxisExpertiseTags 注入 路径:/身份: 前缀标签，保留原有具体标签（最多 8 个）。
func MergeAxisExpertiseTags(base []string, in ProfileFacetInput) []string {
	paths := InferPathTags(in)
	identity := InferIdentityTag(in.School)
	content := stripAxisTags(base)

	out := make([]string, 0, 8)
	seen := make(map[string]bool)
	add := func(t string) {
		t = strings.TrimSpace(t)
		if t == "" || seen[t] || len(out) >= 8 {
			return
		}
		seen[t] = true
		out = append(out, t)
	}
	for _, p := range paths {
		add(AxisPathPrefix + p)
	}
	if identity != "" {
		add(AxisIdentityPrefix + identity)
	}
	for _, t := range content {
		add(t)
	}
	return out
}

const (
	featureTierShuangfeiCore   = 300
	featureTierShuangfeiAbroad = 200
	featureTierChuangye        = 100
)

// FeaturedTier 精选优先级档位（仅双非及同档，不含 211/985）。
type FeaturedTier int

const (
	FeaturedNone FeaturedTier = iota
	FeaturedShuangfeiCore
	FeaturedShuangfeiAbroad
	FeaturedChuangye
)

// ClassifyFeaturedTier 判断 jingpin 精选档位；211/985/保研门面均不进精选。
func ClassifyFeaturedTier(in ProfileFacetInput) FeaturedTier {
	identity := InferIdentityTag(in.School)
	if !isFeaturedStoreIdentity(identity) {
		return FeaturedNone
	}
	pathSet := pathSetFrom(in)
	if !hasCorePath(pathSet) {
		return FeaturedNone
	}
	hasCore := pathSet["考研"] || pathSet["找工作"] || pathSet["找实习"]
	hasAbroad := pathSet["留学"]
	hasChuangye := pathSet["创业"]

	if hasCore {
		return FeaturedShuangfeiCore
	}
	if hasAbroad {
		return FeaturedShuangfeiAbroad
	}
	if hasChuangye {
		return FeaturedChuangye
	}
	return FeaturedNone
}

func featuredTierScore(t FeaturedTier) int {
	switch t {
	case FeaturedShuangfeiCore:
		return featureTierShuangfeiCore
	case FeaturedShuangfeiAbroad:
		return featureTierShuangfeiAbroad
	case FeaturedChuangye:
		return featureTierChuangye
	default:
		return 0
	}
}

// FeaturedTierLabel 返回档位说明。
func FeaturedTierLabel(t FeaturedTier) string {
	switch t {
	case FeaturedShuangfeiCore:
		return "双非及同档×考研/求职/实习"
	case FeaturedShuangfeiAbroad:
		return "双非及同档×留学"
	case FeaturedChuangye:
		return "创业"
	default:
		return ""
	}
}

// FeaturedCandidate 精选候选。
type FeaturedCandidate struct {
	ProfileID   string
	DisplayName string
	Tier        FeaturedTier
	UpdatedAt   time.Time
	Paths       []string
	Identity    string
}

// SelectJingpinFeatured 选出 jingpin 精选（仅双非及同档主滩头，不凑 211/985/保研）。
func SelectJingpinFeatured(candidates []FeaturedCandidate, maxFeatured int) ([]FeaturedCandidate, FeaturedGapReport) {
	report := FeaturedGapReport{}
	if maxFeatured <= 0 {
		maxFeatured = 5
	}

	pool := make([]FeaturedCandidate, 0, len(candidates))
	for _, c := range candidates {
		if c.Tier == FeaturedNone {
			continue
		}
		pool = append(pool, c)
	}

	sort.SliceStable(pool, func(i, j int) bool {
		si, sj := featuredTierScore(pool[i].Tier), featuredTierScore(pool[j].Tier)
		if si != sj {
			return si > sj
		}
		return pool[i].UpdatedAt.After(pool[j].UpdatedAt)
	})

	for _, c := range pool {
		if c.Tier == FeaturedShuangfeiCore {
			report.ShuangfeiCoreCount++
		}
	}

	selected := pool
	if len(selected) > maxFeatured {
		selected = selected[:maxFeatured]
	}

	if report.ShuangfeiCoreCount < 3 {
		report.NeedsMoreShuangfeiCore = true
		report.Message = "主滩头「双非×考研/找工作/找实习」不足 3 条，未用保研/211/985 凑数"
	}

	return selected, report
}

// FeaturedGapReport 主滩头缺口报告。
type FeaturedGapReport struct {
	ShuangfeiCoreCount     int
	NeedsMoreShuangfeiCore bool
	Message                string
}

// SortProfilesForDiscoverFeed 按主 feed 规则排序（仅 published 档案预览用）。
func SortProfilesForDiscoverFeed(profiles []models.LifeAgentProfile, facetByID map[string]ProfileFacetInput) {
	sort.SliceStable(profiles, func(i, j int) bool {
		a, b := profiles[i], profiles[j]
		return DiscoverFeedLess(
			facetByID[a.ID], a.FeaturedRank, a.UpdatedAt, a.ID,
			facetByID[b.ID], b.FeaturedRank, b.UpdatedAt, b.ID,
		)
	})
}
