package lifeagent

import "testing"

func TestClassifyAnswerPolicyGrounded(t *testing.T) {
	plan := RetrievalPlan{
		Entries: []KnowledgeEntryForAI{{ID: "e1", Title: "考研", Content: "..."}},
	}
	opts := &ChatOptions{AllowGeneralKnowledge: true}
	got := ClassifyAnswerPolicy("你当时考研怎么准备的？", plan, opts)
	if got != PolicyGrounded {
		t.Fatalf("got %q want grounded", got)
	}
}

func TestClassifyAnswerPolicyAdvisory(t *testing.T) {
	plan := RetrievalPlan{}
	opts := &ChatOptions{AllowGeneralKnowledge: true}
	got := ClassifyAnswerPolicy("转行做产品有什么建议？", plan, opts)
	if got != PolicyAdvisory {
		t.Fatalf("got %q want advisory", got)
	}
}

func TestClassifyAnswerPolicyGroundedWhenHasTargets(t *testing.T) {
	plan := RetrievalPlan{
		Entries: []KnowledgeEntryForAI{{ID: "e1", Title: "路线", Content: "..."}},
	}
	opts := &ChatOptions{AllowGeneralKnowledge: true}
	got := ClassifyAnswerPolicy("大学路线怎么规划？", plan, opts)
	if got != PolicyGrounded {
		t.Fatalf("got %q want grounded when knowledge hits exist", got)
	}
}

func TestClassifyAnswerPolicySoftPersonal(t *testing.T) {
	plan := RetrievalPlan{}
	opts := &ChatOptions{AllowGeneralKnowledge: true}
	got := ClassifyAnswerPolicy("你大二恋爱经历是怎样的？", plan, opts)
	if got != PolicySoftPersonal {
		t.Fatalf("got %q want soft_personal", got)
	}
}

func TestClassifyAnswerPolicyHardFallback(t *testing.T) {
	plan := RetrievalPlan{}
	opts := &ChatOptions{AllowGeneralKnowledge: false}
	got := ClassifyAnswerPolicy("随便问个事", plan, opts)
	if got != PolicyHardFallback {
		t.Fatalf("got %q want hard_fallback", got)
	}
}

func TestApplyClaimGuardWithPolicyNoHardReject(t *testing.T) {
	plan := RetrievalPlan{Confidence: "low"}
	content := "我觉得可以先想清楚方向再行动。"
	got := ApplyClaimGuardWithPolicy("你建议怎么选专业？", content, nil, plan, PolicyAdvisory)
	if got != content {
		t.Fatalf("advisory should not replace content, got %q", got)
	}
}
