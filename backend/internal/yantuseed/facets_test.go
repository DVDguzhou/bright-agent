package yantuseed

import (
	"testing"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
)

func TestInferIdentityTag(t *testing.T) {
	if got := InferIdentityTag("深圳大学"); got != "双非" {
		t.Fatalf("深圳大学 identity = %q", got)
	}
	if got := InferIdentityTag("上海大学"); got != "211" {
		t.Fatalf("上海大学 identity = %q", got)
	}
	if got := InferIdentityTag(""); got != "" {
		t.Fatalf("empty school should be blank")
	}
}

func TestClassifyFeaturedTier(t *testing.T) {
	tier := ClassifyFeaturedTier(ProfileFacetInput{
		DisplayName:   "慵懒的锦鲤7",
		School:        "深圳大学",
		ExpertiseTags: []string{"升学深造", "留学"},
		Headline:      "深大计软→爱丁堡 HPC",
	})
	if tier != FeaturedShuangfeiAbroad {
		t.Fatalf("慵懒的锦鲤7 tier = %v", tier)
	}

	// 211 不进精选门面
	if got := ClassifyFeaturedTier(ProfileFacetInput{
		DisplayName:   "豆奶_红豆",
		School:        "上海大学",
		ExpertiseTags: []string{"升学深造", "留学"},
		Headline:      "申请港校",
	}); got != FeaturedNone {
		t.Fatalf("豆奶_红豆 tier = %v, want none", got)
	}

	// 纯保研不进精选
	if got := ClassifyFeaturedTier(ProfileFacetInput{
		DisplayName:   "阳光的桂花__",
		School:        "安徽大学",
		ExpertiseTags: []string{"保研", "升学深造"},
		ShortBio:      "分享保研经验",
	}); got != FeaturedNone {
		t.Fatalf("阳光的桂花__ tier = %v, want none", got)
	}
}

func TestFeedICPHit(t *testing.T) {
	if FeedICPHit(ProfileFacetInput{
		School:        "安徽大学",
		ExpertiseTags: []string{"保研", "升学深造"},
		ShortBio:      "分享保研经验",
	}) {
		t.Fatal("211+保研-only should not ICP hit")
	}
	if !FeedICPHit(ProfileFacetInput{
		School:        "上海大学",
		ExpertiseTags: []string{"留学", "升学深造"},
		Headline:      "申请港校",
	}) {
		t.Fatal("211+留学 should ICP hit")
	}
}

func TestMergeAxisExpertiseTags(t *testing.T) {
	out := MergeAxisExpertiseTags(
		[]string{"计算机考研", "408"},
		ProfileFacetInput{
			School:        "杭州电子科技大学",
			ExpertiseTags: []string{"考研", "计算机考研", "408"},
		},
	)
	if len(out) == 0 || out[0] != "路径:考研" {
		t.Fatalf("expected path prefix first, got %v", out)
	}
	foundIdentity := false
	for _, tag := range out {
		if tag == "身份:双非" {
			foundIdentity = true
		}
	}
	if !foundIdentity {
		t.Fatalf("expected 身份:双非 in %v", out)
	}
}

func TestSelectJingpinFeaturedRespectsMax(t *testing.T) {
	pool := make([]FeaturedCandidate, 0, 6)
	for i := 0; i < 6; i++ {
		pool = append(pool, FeaturedCandidate{
			DisplayName: "c",
			Tier:        FeaturedShuangfeiCore,
			UpdatedAt:   time.Now(),
		})
	}
	selected, _ := SelectJingpinFeatured(pool, 5)
	if len(selected) != 5 {
		t.Fatalf("expected max 5, got %d", len(selected))
	}
}

func TestDiscoverFeedLessBaoyanSinks(t *testing.T) {
	now := time.Now()
	baoyan := ProfileFacetInput{
		DisplayName:   "阳光的桂花__",
		School:        "安徽大学",
		ExpertiseTags: []string{"保研"},
	}
	kaoyan := ProfileFacetInput{
		DisplayName:   "凌晨四点半",
		School:        "杭州电子科技大学",
		ExpertiseTags: []string{"考研"},
	}
	if !DiscoverFeedLess(kaoyan, nil, now, "b", baoyan, nil, now, "a") {
		t.Fatal("kaoyan ICP should rank above baoyan-only")
	}
}

func TestSortProfilesForDiscoverFeed(t *testing.T) {
	now := time.Now()
	profiles := []models.LifeAgentProfile{
		{ID: "1", DisplayName: "保研人", School: ptr("安徽大学"), UpdatedAt: now, ExpertiseTags: models.JSONArray{"保研"}},
		{ID: "2", DisplayName: "考研人", School: ptr("杭州电子科技大学"), UpdatedAt: now.Add(-time.Hour), ExpertiseTags: models.JSONArray{"考研"}},
	}
	facetByID := map[string]ProfileFacetInput{
		"1": ProfileFacetInputFromModel(profiles[0]),
		"2": ProfileFacetInputFromModel(profiles[1]),
	}
	SortProfilesForDiscoverFeed(profiles, facetByID)
	if profiles[0].DisplayName != "考研人" {
		t.Fatalf("expected 考研人 first, got %s", profiles[0].DisplayName)
	}
}

func ptr(s string) *string { return &s }

func seedFacetInputByDisplayName(t *testing.T, displayName string) ProfileFacetInput {
	t.Helper()
	for _, p := range Profiles() {
		if p.DisplayName == displayName {
			return profileFacetInputFromSeed(p)
		}
	}
	t.Fatalf("seed profile %q not found", displayName)
	return ProfileFacetInput{}
}

func pathsContain(paths []string, path string) bool {
	for _, p := range paths {
		if p == path {
			return true
		}
	}
	return false
}

func TestInferPathTags_baoyanSicnuSeedsNoFalseKaoyan(t *testing.T) {
	names := []string{
		"荔枝ii看电影", "银杏_萤火虫", "蘑菇_菠萝", "可可骑单车", "杨梅ii搬砖中",
	}
	for _, name := range names {
		paths := InferPathTags(seedFacetInputByDisplayName(t, name))
		if pathsContain(paths, "考研") {
			t.Errorf("%s: should not infer 考研 from template/boilerplate, got %v", name, paths)
		}
		if !pathsContain(paths, "保研") {
			t.Errorf("%s: expected 保研 path, got %v", name, paths)
		}
	}
}

func TestInferPathTags_realKaoyanSeedKeepsKaoyan(t *testing.T) {
	paths := InferPathTags(seedFacetInputByDisplayName(t, "麻雀钓鱼中"))
	if !pathsContain(paths, "考研") {
		t.Fatalf("麻雀钓鱼中 should keep 考研, got %v", paths)
	}
}

func TestInferPathTags_jobSeedKeepsInternship(t *testing.T) {
	paths := InferPathTags(seedFacetInputByDisplayName(t, "蓝莓酱_草莓"))
	if !pathsContain(paths, "找实习") && !pathsContain(paths, "找工作") {
		t.Fatalf("蓝莓酱_草莓 should infer 找实习 or 找工作, got %v", paths)
	}
}

func TestClassifyFeaturedTier_productionSeeds(t *testing.T) {
	cases := []struct {
		name string
		want FeaturedTier
	}{
		{"荔枝ii看电影", FeaturedNone},
		{"银杏_萤火虫", FeaturedNone},
		{"蘑菇_菠萝", FeaturedNone},
		{"可可骑单车", FeaturedNone},
		{"蓝莓酱_草莓", FeaturedShuangfeiCore},
		{"麻雀钓鱼中", FeaturedShuangfeiCore},
		{"阳光的豆沙zzz", FeaturedShuangfeiAbroad},
	}
	for _, tc := range cases {
		in := seedFacetInputByDisplayName(t, tc.name)
		got := ClassifyFeaturedTier(in)
		if got != tc.want {
			t.Errorf("%s paths=%v tier=%v, want %v", tc.name, InferPathTags(in), got, tc.want)
		}
	}
}

func TestFeedICPHit_baoyanSicnuSeeds(t *testing.T) {
	for _, name := range []string{"荔枝ii看电影", "蘑菇_菠萝", "银杏_萤火虫"} {
		if FeedICPHit(seedFacetInputByDisplayName(t, name)) {
			t.Errorf("%s: baoyan-only seed should not ICP hit", name)
		}
	}
}

func TestFeedICPHit_icpSeeds(t *testing.T) {
	for _, name := range []string{"蓝莓酱_草莓", "麻雀钓鱼中", "阳光的豆沙zzz"} {
		if !FeedICPHit(seedFacetInputByDisplayName(t, name)) {
			t.Errorf("%s: should ICP hit", name)
		}
	}
}

func TestSelectJingpinFeatured_excludesBaoyanOnlySeeds(t *testing.T) {
	baoyanOnly := map[string]bool{
		"荔枝ii看电影": true,
		"银杏_萤火虫": true,
		"蘑菇_菠萝":  true,
	}
	var candidates []FeaturedCandidate
	for _, p := range Profiles() {
		in := profileFacetInputFromSeed(p)
		tier := ClassifyFeaturedTier(in)
		if tier == FeaturedNone {
			continue
		}
		candidates = append(candidates, FeaturedCandidate{
			ProfileID:   p.DisplayName,
			DisplayName: p.DisplayName,
			Tier:        tier,
			UpdatedAt:   time.Now(),
		})
	}
	selected, _ := SelectJingpinFeatured(candidates, 8)
	for _, c := range selected {
		if baoyanOnly[c.DisplayName] {
			t.Errorf("jingpin selected baoyan-only profile %q", c.DisplayName)
		}
	}
}

func TestInferPathTags_ignoresStaleAxisTagsFromDB(t *testing.T) {
	in := ProfileFacetInputFromModel(models.LifeAgentProfile{
		DisplayName: "荔枝ii看电影",
		Headline:    "荔枝ii看电影 · 物理与电子工程学院电子信息",
		School:      ptr("四川师范大学"),
		ShortBio:    "四川师范大学电子信息专业，**电子科技大学-电子信息**，分享学业规划、竞赛科研与保研历程。",
		LongBio:     "本文来自四川师范大学升学就业经验Wiki…",
		ExpertiseTags: models.JSONArray{
			"路径:考研", "路径:找工作", "路径:保研", "身份:双非",
			"保研", "升学深造", "四川师范大学", "电子信息",
		},
		SampleQuestions: models.JSONArray{
			"保研综成绩绩点和量化占比多少？",
			"竞赛加分国一国二各加几分？",
		},
	})
	paths := InferPathTags(in)
	if pathsContain(paths, "考研") || pathsContain(paths, "找工作") {
		t.Fatalf("stale DB axis tags must not be re-used, got %v", paths)
	}
	if ClassifyFeaturedTier(in) != FeaturedNone {
		t.Fatalf("荔枝 with stale tags should not enter jingpin, tier=%v", ClassifyFeaturedTier(in))
	}
}

func TestMergeAxisExpertiseTags_baoyanSeedNoKaoyanAxis(t *testing.T) {
	in := seedFacetInputByDisplayName(t, "荔枝ii看电影")
	out := MergeAxisExpertiseTags(in.ExpertiseTags, in)
	for _, tag := range out {
		if tag == AxisPathPrefix+"考研" {
			t.Fatalf("baoyan seed should not get 路径:考研, got %v", out)
		}
	}
}
