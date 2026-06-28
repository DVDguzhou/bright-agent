package lifeagent

import (
	"strings"
	"testing"
)

func TestDetectFactIntent_allowsExperienceQuestions(t *testing.T) {
	cases := []string{
		"大四赚20万是怎么做到的？",
		"保研和赚钱怎么取舍？",
		"海南大学保研怎么准备？",
		"这份工作怎么做到的？",
	}
	for _, msg := range cases {
		if intent, ok := detectFactIntent(msg); ok {
			t.Fatalf("%q should not be intercepted as fact intent, got %+v", msg, intent)
		}
	}
}

func TestDetectFactIntent_keepsDirectFactQuestions(t *testing.T) {
	cases := map[string]string{
		"你收入多少？":    "income",
		"你在哪个学校？":   "school",
		"你现在做什么工作？": "job",
		"你的学历是什么？":  "education",
		"你叫什么名字？":   "display_name",
	}
	for msg, want := range cases {
		intent, ok := detectFactIntent(msg)
		if !ok {
			t.Fatalf("%q should be detected as fact intent", msg)
		}
		if intent.Key != want {
			t.Fatalf("%q intent = %q, want %q", msg, intent.Key, want)
		}
	}
}

func TestResolveGroundedFactReply_emptyFactFallsThroughToRAG(t *testing.T) {
	reply, refs, ok := ResolveGroundedFactReply(ProfileForAI{}, nil, "你收入多少？")
	if ok {
		t.Fatalf("empty fact should fall through to RAG, got reply=%q refs=%v", reply, refs)
	}
}

func TestResolveGroundedFactReply_directFactStillAnswers(t *testing.T) {
	facts := []StructuredFactForAI{{
		ID:         "fact-1",
		FactKey:    "income",
		FactValue:  "大四赚20万",
		Confidence: "high",
	}}
	reply, refs, ok := ResolveGroundedFactReply(ProfileForAI{}, facts, "你收入多少？")
	if !ok {
		t.Fatal("expected direct fact reply")
	}
	if reply == "" || !containsAny(reply, "大四赚20万") {
		t.Fatalf("expected income in reply, got %q", reply)
	}
	if !strings.Contains(reply, "[1]") {
		t.Fatalf("expected inline citation in reply, got %q", reply)
	}
	if len(refs) != 1 || refs[0]["factKey"] != "income" || refs[0]["citeIndex"] != "1" {
		t.Fatalf("expected income reference, got %v", refs)
	}
}

func TestResolveGroundedFactReply_highRiskStillBlocks(t *testing.T) {
	reply, _, ok := ResolveGroundedFactReply(ProfileForAI{}, nil, "你住在哪？")
	if !ok || reply == "" {
		t.Fatalf("expected high-risk question blocked, got ok=%v reply=%q", ok, reply)
	}
}

func TestBuildRetrievalPlanShortInternshipQueryRecallsUEEntry(t *testing.T) {
	entries := []KnowledgeEntryForAI{
		{
			ID:       "ue-internship",
			Title:    "UE开发实习经历",
			Category: "实习",
			Content:  "当时在一个做 VR+教育的初创团队，主要做 UE4 的开发，一边上班一边写 BP，还跟客户需求和产品沟通。",
		},
		{
			ID:      "physics",
			Title:   "童年物理兴趣",
			Content: "小时候对量子力学和相对论很感兴趣。",
		},
	}
	plan := BuildRetrievalPlanStrict("介绍一下实习", nil, nil, nil, entries)
	if len(plan.Entries) == 0 {
		t.Fatalf("expected internship query to recall UE entry, got none")
	}
	if plan.Entries[0].ID != "ue-internship" {
		t.Fatalf("top entry = %q, want ue-internship; entries=%#v", plan.Entries[0].ID, plan.Entries)
	}
}

func TestBuildRetrievalPlanUEQueryUsesEntryRoute(t *testing.T) {
	plan := BuildRetrievalPlanStrict("UE这一块讲讲", nil, nil, nil, []KnowledgeEntryForAI{{
		ID:      "ue-internship",
		Title:   "UE开发实习经历",
		Content: "UE开发 BP 客户需求 产品",
	}})
	if plan.Route != RetrievalRouteEntry {
		t.Fatalf("route = %q, want %q", plan.Route, RetrievalRouteEntry)
	}
	if len(plan.Entries) == 0 || plan.Entries[0].ID != "ue-internship" {
		t.Fatalf("expected UE entry recalled, got %#v", plan.Entries)
	}
}

func TestBuildRetrievalPlanDoesNotFallbackByPosition(t *testing.T) {
	entries := []KnowledgeEntryForAI{
		{
			ID:       "metadata",
			Category: "咨询方向",
			Title:    "擅长与适用人群",
			Content:  "适合帮助的人群：所有人\n擅长标签：考研、留学、生活、创业、职场",
		},
		{
			ID:      "unrelated",
			Title:   "童年物理兴趣",
			Content: "小时候自学量子力学和相对论。",
		},
	}

	plan := BuildRetrievalPlan("讲一下你的大学生活", nil, nil, nil, entries)
	if len(plan.Entries) != 0 {
		t.Fatalf("expected no position-based fallback entries, got %#v", plan.Entries)
	}
}

func TestStrictFromPlanDropsNonEvidenceMetadata(t *testing.T) {
	full := RetrievalPlan{
		Query: "大学生活",
		Entries: []KnowledgeEntryForAI{
			{ID: "metadata", Category: "咨询方向", Title: "擅长与适用人群", Content: "适合帮助的人群：所有人"},
			{ID: "college", Category: "经验", Title: "大一探索", Content: "大一每天复盘并主动突破舒适圈。"},
		},
	}

	strict := StrictFromPlan(full)
	if len(strict.Entries) != 1 || strict.Entries[0].ID != "college" {
		t.Fatalf("strict entries = %#v, want only evidence entry", strict.Entries)
	}
}

func TestDeweightRecentlyUsedEntriesKeepsRequiredEvidence(t *testing.T) {
	plan := RetrievalPlan{Entries: []KnowledgeEntryForAI{
		{ID: "college#event-2", SourceEntryID: "college", Title: "大二恋爱经历", Content: "大二谈过一段恋爱。"},
		{ID: "cmu", SourceEntryID: "cmu", Title: "CMU经历", Content: "在CMU做科研。"},
	}}
	DeweightRecentlyUsedEntries(&plan, []string{"college#event-2"})
	if len(plan.Entries) != 2 {
		t.Fatalf("entries=%#v, reused evidence must not be filtered", plan.Entries)
	}
	if plan.Entries[1].ID != "college#event-2" {
		t.Fatalf("entries=%#v, reused evidence should only move behind fresh evidence", plan.Entries)
	}
}
