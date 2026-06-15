package lifeagent

import "testing"

func TestFacetMatch_moneyPathQuestion(t *testing.T) {
	facets := KnowledgeFacetTags{
		Subjects: []string{"万思雨", "大四赚钱", "20万"},
		Aspects: []FacetAspect{
			{Type: "process", Label: "赚钱路径"},
			{Type: "method", Label: "交付价值的方法"},
		},
		ContentTime: []string{"大四"},
		DocTypes:    []string{"访谈", "个人经历"},
	}
	query := ParseQueryFacet("大四赚20万是怎么做到的？")
	score := ScoreFacetMatch(query, facets)
	if score < 12 {
		t.Fatalf("expected strong facet match, got score=%d query=%+v", score, query)
	}
}

func TestFacetSummary_includesContentTimeNotRecordTime(t *testing.T) {
	summary := FacetSummary(KnowledgeFacetTags{
		Subjects:    []string{"放弃保研"},
		ContentTime: []string{"大四"},
		RecordTime:  []string{"2026-06-15"},
		DocTypes:    []string{"访谈"},
	})
	if !containsAny(summary, "内容时间：大四") {
		t.Fatalf("expected content time in summary, got %q", summary)
	}
	if containsAny(summary, "2026-06-15") {
		t.Fatalf("record time should not be injected into answer-facing summary: %q", summary)
	}
}

func TestScoreEntry_usesFacetMatch(t *testing.T) {
	entry := KnowledgeEntryForAI{
		ID:      "entry-1",
		Title:   "访谈片段",
		Content: "这里没有直接重复用户原句。",
		Facets: KnowledgeFacetTags{
			Subjects:    []string{"20万", "大四赚钱"},
			Aspects:     []FacetAspect{{Type: "process", Label: "赚钱路径"}},
			ContentTime: []string{"大四"},
		},
	}
	got := scoreEntry("大四赚20万是怎么做到的？", entry, RetrievalRouteGeneral, nil)
	if got <= 0 {
		t.Fatalf("expected facet match to contribute to entry score, got %d", got)
	}
}
