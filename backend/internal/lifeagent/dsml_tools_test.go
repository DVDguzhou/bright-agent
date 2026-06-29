package lifeagent

import "testing"

func TestExtractDSMLWebSearchQuery(t *testing.T) {
	raw := `<|DSML|tool_calls><|DSML|invoke name="web_search"><|DSML|parameter name="query" string="true">2026年浙江高考最高分 第一名</|DSML|parameter></|DSML|invoke></|DSML|tool_calls>`
	q, ok := extractDSMLWebSearchQuery(raw)
	if !ok {
		t.Fatal("expected query")
	}
	if q != "2026年浙江高考最高分 第一名" {
		t.Fatalf("query=%q", q)
	}
	stripped := stripDSMLMarkup(raw)
	if stripped != "" {
		t.Fatalf("expected empty stripped content, got %q", stripped)
	}
}

func TestAbsorbDSMLToolCalls(t *testing.T) {
	raw := `<|DSML|tool_calls><|DSML|invoke name="web_search"><|DSML|parameter name="query" string="true">浙江本科线</|DSML|parameter></|DSML|invoke></|DSML|tool_calls>`
	result := streamResult{Content: raw}
	absorbDSMLToolCalls(&result)
	if len(result.ToolCalls) != 1 || result.ToolCalls[0].Function.Name != "web_search" {
		t.Fatalf("unexpected tool calls: %+v", result.ToolCalls)
	}
	if result.Content != "" {
		t.Fatalf("content should be stripped, got %q", result.Content)
	}
}
