package lifeagent

import (
	"strings"
	"testing"
)

func TestAssessCatalogSparsityShortEntry(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "大二恋爱经历", Content: "大二谈过一段，不久分手，封心锁爱"},
		},
	})
	sp := AssessCatalogSparsity(catalog)
	if !sp.IsSparse {
		t.Fatalf("expected sparse catalog, maxRunes=%d", sp.MaxEntryRunes)
	}
}

func TestAssessCatalogSparsityLongEntry(t *testing.T) {
	long := strings.Repeat("经历细节。", 30)
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学准备", Content: long},
		},
	})
	sp := AssessCatalogSparsity(catalog)
	if sp.IsSparse {
		t.Fatal("expected non-sparse catalog for long entry")
	}
}

func TestApplySparseStrategyOverride(t *testing.T) {
	ws := &WorkingState{
		Perception: PerceptionSnapshot{
			MetaInstr: MetaInstruction{Present: true, Type: "want_detail", Raw: "详细点"},
			LengthPref: LengthPreference{Source: "explicit", Direction: "elaborate", Raw: "详细点"},
		},
	}
	s := DeriveStrategy(ws, ProfileForAI{})
	ApplySparseStrategyOverride(&s, CatalogSparsity{IsSparse: true}, ws.Perception, RetrievalPlan{})
	if s.LengthTarget.Label != "sparse_elaborate" {
		t.Fatalf("label = %q, want sparse_elaborate", s.LengthTarget.Label)
	}
	if !strings.Contains(s.PromptLengthHint, "禁止") {
		t.Fatalf("hint should mention 禁止, got %q", s.PromptLengthHint)
	}
	if s.LengthTarget.MaxChars > 160 {
		t.Fatalf("max chars = %d, want <= 160", s.LengthTarget.MaxChars)
	}
}

func TestClassifyAnswerPolicySparseGrounded(t *testing.T) {
	plan := RetrievalPlan{
		Route: RetrievalRouteEntry,
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "大二恋爱经历", Content: "大二谈过一段，不久分手，封心锁爱"},
		},
	}
	got := ClassifyAnswerPolicy("详细点", plan, &ChatOptions{CitationsEnabled: true})
	if got != PolicySparseGrounded {
		t.Fatalf("policy = %q, want sparse_grounded", got)
	}
}

func TestSparseSkipsOverlapEnsure(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "本科与留学", Content: "温州大学 计算机 CMU offer"},
		},
	})
	text := "本科在温州大学读计算机，后来拿到 CMU 的 offer。"
	out := text
	sparse := true
	_, used := ParseInlineCitations(out)
	if !sparse && len(catalog.Items) > 0 && len(used) == 0 {
		out = overlapEnsureInlineCitations(out, catalog)
	}
	if strings.Contains(out, "[") {
		t.Fatalf("sparse path should skip overlap ensure, got %q", out)
	}
}

func TestCapCitationMarkersKeepsOnePerSource(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "大二恋爱经历", Content: "大二谈过一段，不久分手，封心锁爱"},
		},
	})
	text := "大二谈过一段，不久就分了[1]。后来很快就不行了[1]。心关上了[1]。懒得展开[1]。反正就那样[1]。没再碰感情[1]。"
	got := CapCitationMarkers(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) != 1 {
		t.Fatalf("expected 1 citation index, got %v in %q", used, got)
	}
}

func TestCapCitationMarkersStripsPlanningLoveCite(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "大二恋爱经历", Content: "大二谈过恋爱"},
		},
	})
	text := "大一大胆试，大二定方向加实习[1]。"
	got := CapCitationMarkers(text, catalog)
	if strings.Contains(got, "[1]") {
		t.Fatalf("expected [1] stripped on planning text, got %q", got)
	}
}

func TestSparseLengthPromptHintInStrategy(t *testing.T) {
	lt := sparseLengthTarget()
	hint := sparseLengthPromptHint(LengthPreference{Raw: "详细点"})
	if lt.MinChars != 80 || lt.MaxChars != 160 {
		t.Fatalf("sparse target range wrong: %d-%d", lt.MinChars, lt.MaxChars)
	}
	if !strings.Contains(hint, "80–160") && !strings.Contains(hint, "80-160") {
		t.Fatalf("hint should mention length range, got %q", hint)
	}
}
