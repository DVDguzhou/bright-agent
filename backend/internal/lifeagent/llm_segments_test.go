package lifeagent

import "testing"

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
