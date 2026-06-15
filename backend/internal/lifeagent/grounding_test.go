package lifeagent

import "testing"

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
	if len(refs) != 1 || refs[0]["factKey"] != "income" {
		t.Fatalf("expected income reference, got %v", refs)
	}
}

func TestResolveGroundedFactReply_highRiskStillBlocks(t *testing.T) {
	reply, _, ok := ResolveGroundedFactReply(ProfileForAI{}, nil, "你住在哪？")
	if !ok || reply == "" {
		t.Fatalf("expected high-risk question blocked, got ok=%v reply=%q", ok, reply)
	}
}
