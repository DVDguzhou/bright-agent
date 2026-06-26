package lifeagent

import (
	"strings"
	"testing"
)

func TestDetectIntroIntentElaborate(t *testing.T) {
	got := DetectIntroIntent("详细的介绍一下你自己", nil)
	if got.Kind != IntroIntentElaborate || !got.Present {
		t.Fatalf("got %+v, want elaborate", got)
	}
}

func TestDetectIntroIntentBrief(t *testing.T) {
	got := DetectIntroIntent("你叫什么名字", nil)
	if got.Kind != IntroIntentBrief || !got.Present {
		t.Fatalf("got %+v, want brief", got)
	}
}

func TestDetectIntroIntentContinued(t *testing.T) {
	hist := []ChatMessageForAI{
		{Role: "user", Content: "详细的介绍一下你自己"},
		{Role: "assistant", Content: "我是小清学长，帮助大学生规划大学生活。"},
	}
	got := DetectIntroIntent("详细点", hist)
	if got.Kind != IntroIntentContinuedElaborate || !got.Present {
		t.Fatalf("got %+v, want continued_elaborate", got)
	}
}

func TestWantsBackgroundNotRecency(t *testing.T) {
	intro := IntroIntent{Kind: IntroIntentElaborate, Present: true}
	if !WantsBackgroundNotRecency("详细介绍一下自己", intro) {
		t.Fatal("expected background not recency")
	}
	if WantsBackgroundNotRecency("你最近在忙什么", intro) {
		t.Fatal("recency question should not want background-only")
	}
}

func TestBoostIntroRetrievalLongBio(t *testing.T) {
	plan := RetrievalPlan{Entries: []KnowledgeEntryForAI{}}
	profile := ProfileForAI{
		LongBio: strings.Repeat("我从双非考研上岸985，后来留学顶尖学府。", 20),
	}
	BoostIntroRetrieval(&plan, nil, profile, IntroIntent{Kind: IntroIntentElaborate, Present: true})
	if len(plan.Entries) == 0 || plan.Entries[0].ID != ProfileLongBioEntryID {
		t.Fatalf("expected profile long_bio entry injected, got %+v", plan.Entries)
	}
}

func TestIsIntroKnowledgeEntry(t *testing.T) {
	if !IsIntroKnowledgeEntry(KnowledgeEntryForAI{Title: "我是阿青学长，本科毕业于某高校"}) {
		t.Fatal("title prefix 我是 should match")
	}
	if !IsIntroKnowledgeEntry(KnowledgeEntryForAI{Category: "背景", Title: "个人情况"}) {
		t.Fatal("category 背景 should match")
	}
}

func TestAttachLiveUpdatesSkipsFallbackForIntro(t *testing.T) {
	plan := RetrievalPlan{Query: "详细点 介绍一下自己"}
	updates := []LiveUpdateForAI{
		{ID: "u1", Content: "最近在琢磨帮助大学生规划", Category: "思考", FreshDays: 0},
		{ID: "u2", Content: "今天去见了学弟学妹", Category: "日常", FreshDays: 1},
	}
	intro := IntroIntent{Kind: IntroIntentContinuedElaborate, Present: true}
	AttachLiveUpdatesFiltered(&plan, updates, intro, "详细点")
	if len(plan.LiveUpdates) != 0 {
		t.Fatalf("expected no live update fallback for intro, got %d", len(plan.LiveUpdates))
	}
}

func TestApplySparseStrategyOverrideSkipsIntroWithLongMaterial(t *testing.T) {
	long := strings.Repeat("背景细节。", 50)
	ws := &WorkingState{
		Perception: PerceptionSnapshot{
			IntroIntent: IntroIntent{Kind: IntroIntentElaborate, Present: true},
			MetaInstr:   MetaInstruction{Present: true, Type: "want_detail", Raw: "详细点"},
			LengthPref:  LengthPreference{Source: "explicit", Direction: "elaborate", Raw: "详细点"},
		},
	}
	s := DeriveStrategy(ws, ProfileForAI{})
	plan := RetrievalPlan{
		Entries: []KnowledgeEntryForAI{{ID: "e1", Title: "我是学长", Content: long}},
	}
	ApplySparseStrategyOverride(&s, CatalogSparsity{IsSparse: true}, ws.Perception, plan)
	if s.LengthTarget.Label == "sparse_elaborate" {
		t.Fatalf("sparse override should be skipped for intro with long material, got %q", s.LengthTarget.Label)
	}
}

func TestIsFollowUpElaboration(t *testing.T) {
	if !isFollowUpElaboration("详细点") {
		t.Fatal("详细点 should be follow-up elaboration")
	}
	if isFollowUpElaboration("请详细介绍一下你的考研经历和时间规划") {
		t.Fatal("long message should not be follow-up elaboration")
	}
}
