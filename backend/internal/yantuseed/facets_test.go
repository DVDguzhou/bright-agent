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
