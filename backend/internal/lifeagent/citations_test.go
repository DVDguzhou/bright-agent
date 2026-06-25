package lifeagent

import "testing"

func TestParseInlineCitationsSuperscript(t *testing.T) {
	text := "我当年考研时挺拼的¹，后来去了 CMU²。"
	display, indexes := ParseInlineCitations(text)
	if display != text {
		t.Fatalf("display text changed: %q", display)
	}
	if len(indexes) != 2 || indexes[0] != 1 || indexes[1] != 2 {
		t.Fatalf("indexes = %v, want [1 2]", indexes)
	}
}

func TestParseInlineCitationsBracket(t *testing.T) {
	text := "建议先想清楚方向[1]，再行动[2]。"
	_, indexes := ParseInlineCitations(text)
	if len(indexes) != 2 {
		t.Fatalf("indexes = %v", indexes)
	}
}

func TestBuildCitedReferencesFiltersUsed(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Route: RetrievalRouteEntry,
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "A", Content: "content A"},
			{ID: "e2", Title: "B", Content: "content B"},
		},
		Facts: []StructuredFactForAI{
			{ID: "f1", FactKey: "school", FactValue: "CMU"},
		},
	})
	refs := BuildCitedReferences(catalog, []int{2}, true)
	if len(refs) != 1 {
		t.Fatalf("len refs = %d", len(refs))
	}
	if refs[0]["id"] != "e1" {
		t.Fatalf("id = %q", refs[0]["id"])
	}
	if refs[0]["citeIndex"] != "2" {
		t.Fatalf("citeIndex = %q", refs[0]["citeIndex"])
	}
}

func TestStripInlineCitations(t *testing.T) {
	got := StripInlineCitations("你好¹世界[2]")
	want := "你好世界"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}
