package lifeagent

import (
	"strings"
	"testing"
)

func TestNeedsRealtimeWebSearch(t *testing.T) {
	cases := []struct {
		msg  string
		want bool
	}{
		{"浙江2025年高考分数线多少", true},
		{"这个学校去年录取位次大概多少", true},
		{"你好呀", false},
		{"考研该怎么准备", false},
		{"帮我查一下今年江苏物理类本科线", true},
		{"", false},
	}
	for _, tc := range cases {
		got := NeedsRealtimeWebSearch(tc.msg)
		if got != tc.want {
			t.Errorf("NeedsRealtimeWebSearch(%q) = %v, want %v", tc.msg, got, tc.want)
		}
	}
}

func TestBuildWebSearchQuery(t *testing.T) {
	hist := []ChatMessageForAI{
		{Role: "user", Content: "我是浙江考生"},
		{Role: "assistant", Content: "好的"},
		{Role: "user", Content: "2025年特控线多少"},
	}
	q := BuildWebSearchQuery("2025年特控线多少", hist)
	for _, part := range []string{"浙江", "2025", "特控线"} {
		if !strings.Contains(q, part) {
			t.Fatalf("query=%q missing %q", q, part)
		}
	}
}

func TestFormatBochaResults(t *testing.T) {
	raw := []byte(`{
		"data": {
			"webPages": {
				"value": [
					{"name": "标题A", "url": "https://example.com/a", "summary": "摘要A"},
					{"name": "标题B", "url": "https://example.com/b", "summary": "摘要B"}
				]
			}
		}
	}`)
	text, err := formatBochaResults(raw)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(text, "标题A") || !strings.Contains(text, "摘要A") {
		t.Fatalf("unexpected text: %s", text)
	}
}
