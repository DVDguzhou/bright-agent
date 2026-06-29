package yantuseed

import (
	"strings"
	"testing"
)

func TestZhangXuefengDecisionProfileIsTransparentAndAtomic(t *testing.T) {
	p := ZhangXuefengDecisionProfile()
	if !strings.Contains(p.ShortBio, "非官方") || !strings.Contains(p.LongBio, "不代表本人") {
		t.Fatal("public-figure profile must disclose that it is unofficial")
	}
	if len(p.KnowledgeEntries) < 10 {
		t.Fatalf("knowledge is too coarse: got %d entries", len(p.KnowledgeEntries))
	}
	if len(p.TopicSummaries) < 10 {
		t.Fatalf("topic coverage is too small: got %d", len(p.TopicSummaries))
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
	for _, topic := range p.TopicSummaries {
		if topic.Key == "" || topic.Label == "" || len(topic.SourceTitles) == 0 {
			t.Fatalf("topic %q is incomplete", topic.Label)
		}
		for _, title := range topic.SourceTitles {
			if !seen[title] {
				t.Fatalf("topic %q references missing knowledge %q", topic.Label, title)
			}
		}
	}
}

func TestZhangXuefengDecisionProfileAccountMapping(t *testing.T) {
	for _, profile := range Profiles() {
		if profile.DisplayName == zhangXuefengDecisionProfile.DisplayName {
			t.Fatal("dedicated profile must not be part of the legacy bulk seed")
		}
	}
	if len(Profiles()) != len(SplitAccountEmails) {
		t.Fatalf("legacy profiles and owner accounts differ: %d != %d", len(Profiles()), len(SplitAccountEmails))
	}
}
