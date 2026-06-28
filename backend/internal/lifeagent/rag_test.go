package lifeagent

import (
	"context"
	"testing"
)

type staticTestEmbedder struct {
	query []float32
}

func (e staticTestEmbedder) Embed(_ context.Context, inputs []string) ([][]float32, error) {
	out := make([][]float32, len(inputs))
	for i := range out {
		out[i] = e.query
	}
	return out, nil
}

func (staticTestEmbedder) Model() string { return "test" }
func (staticTestEmbedder) Dim() int      { return 2 }

func TestRunHybridRetrievalUsesSemanticEvidenceWithoutTextFallback(t *testing.T) {
	entries := []KnowledgeEntryForAI{
		{
			ID:        "metadata",
			Category:  "咨询方向",
			Title:     "擅长与适用人群",
			Content:   "适合帮助的人群：所有人",
			Embedding: []float32{1, 0},
		},
		{
			ID:       "college",
			Category: "经验",
			Title:    "成长时间线",
			Content:  "刚入学时主动认识老师和同学，后来组建团队做科创项目。",
		},
		{
			ID:        "physics",
			Category:  "兴趣",
			Title:     "童年兴趣",
			Content:   "小时候喜欢量子力学。",
			Embedding: []float32{0, 1},
		},
	}

	plan, _ := RunHybridRetrieval(
		context.Background(), staticTestEmbedder{query: []float32{1, 0}},
		"讲一下你的大学生活", nil, nil, nil, entries, nil, nil,
		ProfileForAI{}, IntroIntent{}, "讲一下你的大学生活",
	)
	if len(plan.Entries) != 1 || plan.Entries[0].ID != "college" {
		t.Fatalf("semantic entries = %#v, want only college evidence", plan.Entries)
	}
}

func TestRunHybridRetrievalExpandsTopicToRawSourceEntries(t *testing.T) {
	entries := []KnowledgeEntryForAI{{
		ID:        "college-source",
		Category:  "经验",
		Title:     "成长时间线原文",
		Content:   "刚入学时主动认识老师和同学，后来组建团队做科创项目。",
		Embedding: []float32{0, 1},
	}}
	topics := []TopicSummaryForAI{{
		ID:             "college-topic",
		TopicLabel:     "大学阶段成长",
		Summary:        "本科四年的探索与项目经历",
		SourceEntryIDs: []string{"college-source"},
	}}

	plan, _ := RunHybridRetrieval(
		context.Background(), staticTestEmbedder{query: []float32{1, 0}},
		"讲一下你的大学生活", nil, nil, topics, entries, nil, nil,
		ProfileForAI{}, IntroIntent{}, "讲一下你的大学生活",
	)
	if len(plan.Entries) != 1 || plan.Entries[0].ID != "college-source" {
		t.Fatalf("topic source entries = %#v, want raw source entry", plan.Entries)
	}
	catalog := BuildCitationCatalog(plan)
	if len(catalog.Items) != 1 || catalog.Items[0].SourceType != "knowledge" {
		t.Fatalf("catalog = %#v, want raw knowledge source only", catalog.Items)
	}
}
