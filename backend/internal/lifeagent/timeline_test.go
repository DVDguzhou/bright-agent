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
