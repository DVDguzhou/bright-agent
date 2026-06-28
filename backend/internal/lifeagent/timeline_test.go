package lifeagent

import "testing"

func TestAnalyzeKnowledgeTimeline_confirmedContentTime(t *testing.T) {
	facets := KnowledgeFacetTags{
		Subjects:    []string{"大四赚钱", "20万"},
		Aspects:     []FacetAspect{{Type: "process", Label: "赚钱路径"}},
		ContentTime: []string{"大四"},
		DocTypes:    []string{"个人经历"},
	}
	got := AnalyzeKnowledgeTimeline("大四赚20万", "经历", "我大四那年开始做商业项目，后来赚到20万。", facets, nil)
	if !got.ShouldTrack {
		t.Fatalf("expected timeline-worthy event")
	}
	if got.Status != "confirmed" {
		t.Fatalf("expected confirmed, got %s", got.Status)
	}
	if got.PeriodLabel != "大四" {
		t.Fatalf("expected period 大四, got %s", got.PeriodLabel)
	}
	if got.EventType != "outcome" {
		t.Fatalf("expected outcome, got %s", got.EventType)
	}
}

func TestAnalyzeKnowledgeTimeline_needsClarification(t *testing.T) {
	facets := KnowledgeFacetTags{
		Subjects: []string{"放弃保研"},
		Aspects:  []FacetAspect{{Type: "tradeoff", Label: "保研与创业取舍"}},
	}
	got := AnalyzeKnowledgeTimeline("放弃保研", "经历", "我当时主动放弃保研，转去做商业项目。", facets, nil)
	if !got.ShouldTrack {
		t.Fatalf("expected timeline-worthy event")
	}
	if got.Status != "needs_clarification" {
		t.Fatalf("expected needs_clarification, got %s", got.Status)
	}
	if got.ClarificationQuestion == "" {
		t.Fatalf("expected clarification question")
	}
}

func TestFormatTimelinePromptSection_omitsEmpty(t *testing.T) {
	section := FormatTimelinePromptSection([]TimelineEventForAI{{Status: "ignored", Title: "噪音"}})
	if section != "" {
		t.Fatalf("expected empty section, got %q", section)
	}
}

func TestAttachTimelineSourceEntriesForUniversityOverview(t *testing.T) {
	plan := RetrievalPlan{
		Entries: []KnowledgeEntryForAI{{ID: "freshman", Title: "大一"}},
	}
	entries := []KnowledgeEntryForAI{
		{ID: "freshman", Title: "大一", Content: "大一适应校园生活"},
		{ID: "sophomore", Title: "大二", Content: "大二做项目和健身"},
		{ID: "junior", Title: "大三", Content: "大三准备考研和留学"},
		{ID: "senior", Title: "大四", Content: "大四完成毕业设计"},
	}
	events := []TimelineEventForAI{
		{Status: "confirmed", SequenceOrder: 1, SourceEntryIDs: []string{"freshman"}},
		{Status: "confirmed", SequenceOrder: 2, SourceEntryIDs: []string{"sophomore"}},
		{Status: "confirmed", SequenceOrder: 3, SourceEntryIDs: []string{"junior"}},
		{Status: "confirmed", SequenceOrder: 4, SourceEntryIDs: []string{"senior"}},
	}

	added := AttachTimelineSourceEntries(&plan, events, entries, "说一下你大一到大四")
	if added != 3 || len(plan.Entries) != 4 {
		t.Fatalf("added=%d entries=%#v, want all four years", added, plan.Entries)
	}
	for _, want := range []string{"freshman", "sophomore", "junior", "senior"} {
		found := false
		for _, entry := range plan.Entries {
			if entry.ID == want {
				found = true
				break
			}
		}
		if !found {
			t.Fatalf("missing timeline source %q in %#v", want, plan.Entries)
		}
	}
}

func TestAttachTimelineSourceEntriesDoesNotExpandUnrelatedQuestion(t *testing.T) {
	plan := RetrievalPlan{}
	entries := []KnowledgeEntryForAI{{ID: "senior", Title: "大四", Content: "毕业设计"}}
	events := []TimelineEventForAI{{Status: "confirmed", SourceEntryIDs: []string{"senior"}}}
	if added := AttachTimelineSourceEntries(&plan, events, entries, "你平时喜欢吃什么"); added != 0 || len(plan.Entries) != 0 {
		t.Fatalf("unrelated question expanded timeline: added=%d plan=%#v", added, plan)
	}
}
