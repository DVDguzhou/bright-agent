package lifeagent

import (
	"testing"

	"github.com/agent-marketplace/backend/internal/models"
)

func strPtr(s string) *string { return &s }

func TestComputeMindScore_FoundationCap(t *testing.T) {
	p := &models.LifeAgentProfile{
		DisplayName:    "测试",
		Headline:       "一句话介绍足够长",
		WelcomeMessage: "欢迎语",
		ExpertiseTags:  models.JSONArray{"A", "B", "C"},
		ExampleReplies: models.JSONArray{"示范1", "示范2", "示范3", "示范4"},
		NotSuitableFor: strPtr("医疗诊断"),
	}
	score := ComputeMindScore(MindScoreInput{Profile: p, HasVoice: true})
	if score.Foundation > 200 {
		t.Fatalf("foundation should cap at 200, got %d", score.Foundation)
	}
	if score.Level != 1 && score.Total < 100 {
		t.Fatalf("expected at least level progression with foundation, total=%d level=%d", score.Total, score.Level)
	}
}

func TestComputeMindScore_GrowsWithExperiences(t *testing.T) {
	p := &models.LifeAgentProfile{DisplayName: "测试", Headline: "介绍", WelcomeMessage: "欢迎"}
	base := ComputeMindScore(MindScoreInput{Profile: p})
	entries := []models.LifeAgentKnowledgeEntry{
		{Content: "这是一段足够长的真实经历内容，包含具体场景和结果。"},
		{Content: "第二段真实经历，描述了决策过程和踩坑教训。"},
		{Content: "第三段真实经历，补充了更多细节和时间线。"},
	}
	grown := ComputeMindScore(MindScoreInput{Profile: p, Entries: entries})
	if grown.Experience <= base.Experience {
		t.Fatalf("experience score should grow, base=%d grown=%d", base.Experience, grown.Experience)
	}
	if grown.Total <= base.Total {
		t.Fatalf("total score should grow, base=%d grown=%d", base.Total, grown.Total)
	}
}

func TestGenerateNextSuggestion_PersonRelationship(t *testing.T) {
	p := &models.LifeAgentProfile{DisplayName: "测试", ExpertiseTags: models.JSONArray{"就业"}}
	s := GenerateNextSuggestion(NextSuggestionContext{
		Profile:     p,
		LastMessage: "我经常和张雪峰一起吃巧乐兹。",
		TurnCount:   1,
	})
	if s == nil {
		t.Fatal("expected suggestion")
	}
	if s.RuleID != "person_relationship" {
		t.Fatalf("expected person_relationship, got %s", s.RuleID)
	}
}

func TestGenerateNextSuggestion_ExperienceJudgment(t *testing.T) {
	p := &models.LifeAgentProfile{DisplayName: "测试"}
	s := GenerateNextSuggestion(NextSuggestionContext{
		Profile:     p,
		LastMessage: "我当时决定不去那个公司。",
		TurnCount:   1,
	})
	if s == nil {
		t.Fatal("expected suggestion")
	}
	if s.RuleID != "experience_judgment" {
		t.Fatalf("expected experience_judgment, got %s", s.RuleID)
	}
}

func TestMindScoreLevel(t *testing.T) {
	level, label := mindScoreLevel(520)
	if level != 4 || label == "" {
		t.Fatalf("expected level 4, got %d %s", level, label)
	}
}
