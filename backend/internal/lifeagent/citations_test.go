package lifeagent

import (
	"strings"
	"testing"
)

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

func TestTopicRedundantWithEntries(t *testing.T) {
	topic := TopicSummaryForAI{
		ID:         "t1",
		TopicLabel: "大二恋爱经历",
		SourceEntryIDs: []string{"e1"},
	}
	entries := []KnowledgeEntryForAI{{ID: "e1", Title: "大二恋爱经历"}}
	if !topicRedundantWithEntries(topic, entries) {
		t.Fatal("expected redundant when entry id matches topic source")
	}
	entries2 := []KnowledgeEntryForAI{{ID: "e2", Title: "大二恋爱经历"}}
	if !topicRedundantWithEntries(topic, entries2) {
		t.Fatal("expected redundant when titles match")
	}
	catalog := BuildCitationCatalog(RetrievalPlan{
		Topics:  []TopicSummaryForAI{topic},
		Entries: entries,
	})
	if len(catalog.Items) != 1 {
		t.Fatalf("catalog len = %d, want 1 (entry only)", len(catalog.Items))
	}
	if catalog.Items[0].SourceType != "knowledge" {
		t.Fatalf("sourceType = %q", catalog.Items[0].SourceType)
	}
}

func TestNormalizeCitationMarkers(t *testing.T) {
	got := NormalizeCitationMarkers("你好¹世界²")
	want := "你好[1]世界[2]"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestHeuristicEnsureInlineCitations(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学准备与大二实习", Content: "留学要早准备，大二实习很重要"},
			{ID: "e2", Title: "大二恋爱经历", Content: "大二谈过恋爱"},
		},
	})
	text := "大一是探索期，可以多试。\n\n大二要定方向加实习。"
	got := HeuristicEnsureInlineCitations(text, catalog)
	if strings.Contains(got, "[2]") {
		t.Fatalf("should not cite 恋爱 on roadmap paragraph, got %q", got)
	}
}

func TestValidateInlineCitationsStripsIrrelevant(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学准备", Content: "留学"},
			{ID: "e2", Title: "大二恋爱经历", Content: "恋爱"},
		},
	})
	text := "大一大胆试，大二定方向[2]。"
	got := ValidateInlineCitations(text, catalog)
	if strings.Contains(got, "[2]") {
		t.Fatalf("expected [2] removed, got %q", got)
	}
}

func TestValidateInlineCitationsKeepsRelevant(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学背景", Content: "温州大学 CMU 985 offer"},
		},
	})
	text := "本科在温州大学，后来去了 CMU[1]。"
	got := ValidateInlineCitations(text, catalog)
	if !strings.Contains(got, "[1]") {
		t.Fatalf("expected [1] kept, got %q", got)
	}
}

func TestOverlapEnsureInlineCitations(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "本科与留学", Content: "温州大学 计算机 CMU offer"},
		},
	})
	text := "本科在温州大学读计算机，后来拿到 CMU 的 offer。"
	got := overlapEnsureInlineCitations(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) == 0 {
		t.Fatalf("expected citation, got %q", got)
	}
}

func TestStripInlineCitations(t *testing.T) {
	got := StripInlineCitations("你好¹世界[2]")
	want := "你好世界"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestCapCitationMarkersOnePerParagraph(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学", Content: "温州大学 CMU"},
			{ID: "e2", Title: "实习", Content: "大二实习"},
		},
	})
	text := "本科温州大学 CMU[1] 大二实习[2]。"
	got := CapCitationMarkers(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) > 2 {
		t.Fatalf("too many cites: %v in %q", used, got)
	}
}
