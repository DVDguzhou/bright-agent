package yantuseed

import (
	"strings"
	"testing"
)

func TestZhangXuefengDecisionProfileIsTransparentAndAtomic(t *testing.T) {
	p := zhangXuefengDecisionProfile
	if !strings.Contains(p.ShortBio, "非官方") || !strings.Contains(p.LongBio, "不代表本人") {
		t.Fatal("public-figure profile must disclose that it is unofficial")
	}
	if len(p.KnowledgeEntries) < 10 {
		t.Fatalf("knowledge is too coarse: got %d entries", len(p.KnowledgeEntries))
	}
	seen := map[string]bool{}
	for _, entry := range p.KnowledgeEntries {
		if strings.TrimSpace(entry.Title) == "" || strings.TrimSpace(entry.Content) == "" {
			t.Fatal("knowledge entry must have title and content")
		}
		if seen[entry.Title] {
			t.Fatalf("duplicate knowledge title %q", entry.Title)
		}
		seen[entry.Title] = true
	}
}

func TestZhangXuefengDecisionProfileAccountMapping(t *testing.T) {
	profiles := Profiles()
	if len(profiles) != len(SplitAccountEmails) {
		t.Fatalf("profiles and owner accounts differ: %d != %d", len(profiles), len(SplitAccountEmails))
	}
	if profiles[3].DisplayName != zhangXuefengDecisionProfile.DisplayName || SplitAccountEmails[3] != "agent_zxf_decision@163.com" {
		t.Fatal("distilled profile and owner account must stay aligned at index 3")
	}
}
