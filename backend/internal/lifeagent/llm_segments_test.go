package lifeagent

import (
	"strings"
	"testing"
)

func TestSplitReplySegmentsSingle(t *testing.T) {
	segs := SplitReplySegments("就一句。")
	if len(segs) != 1 || segs[0] != "就一句。" {
		t.Fatalf("segs = %v", segs)
	}
}

func TestSplitReplySegmentsMulti(t *testing.T) {
	input := "第一段。\n\n第二段。\n\n第三段。"
	segs := SplitReplySegments(input)
	if len(segs) != 3 {
		t.Fatalf("len = %d, want 3", len(segs))
	}
}

func TestBuildDraftSystemPromptOnlyIncludesLongBioForIntro(t *testing.T) {
	profile := ProfileForAI{DisplayName: "测试", LongBio: "ONLY_FOR_INTRO_LONG_BIO"}
	regular := buildDraftSystemPrompt(profile, nil, nil, nil, nil, IntroIntent{})
	if strings.Contains(regular, profile.LongBio) {
		t.Fatal("regular answer prompt must not expose unselected long bio facts")
	}
	intro := buildDraftSystemPrompt(profile, nil, nil, nil, nil, IntroIntent{Present: true, Kind: IntroIntentElaborate})
	if !strings.Contains(intro, profile.LongBio) {
		t.Fatal("intro prompt should include long bio")
	}
}

func TestDeliverFinalReplyDefersCitedContentToSegmentDelivery(t *testing.T) {
	streamed := false
	opts := &ChatOptions{ReplyUseSegmentDelivery: true}
	content, _, err := deliverFinalReply("带内部来源[1]。", nil, func(string) { streamed = true }, opts)
	if err != nil || content == "" {
		t.Fatalf("deliverFinalReply error=%v content=%q", err, content)
	}
	if streamed {
		t.Fatal("cited content must not stream before internal markers are stripped")
	}
}
