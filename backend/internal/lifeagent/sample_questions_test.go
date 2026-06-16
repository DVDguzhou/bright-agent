package lifeagent

import "testing"

func TestIsGenericSampleQuestions(t *testing.T) {
	if !IsGenericSampleQuestions([]string{"双非背景如何拿大厂offer？", "秋招时间线怎么安排？"}) {
		t.Fatal("expected generic")
	}
	if IsGenericSampleQuestions([]string{"北邮本科申请美国ECE方向PhD有多大把握？"}) {
		t.Fatal("expected non-generic")
	}
}

func TestDeriveSampleQuestions_jobExp(t *testing.T) {
	qs := DeriveSampleQuestions(SampleQuestionInput{
		DisplayName:   "架构缓存_coder",
		Headline:      "百日阿里成长路",
		ShortBio:      "C/C++后端方向，拿下阿里等offer，分享秋招/春招求职历程。",
		ExpertiseTags: []string{"求职面试", "互联网校招", "C/C++后端", "阿里"},
	})
	if len(qs) < 2 {
		t.Fatalf("expected at least 2 questions, got %v", qs)
	}
	allSame := true
	for _, q := range qs {
		if q == "双非背景如何拿大厂offer？" || q == "秋招时间线怎么安排？" {
			continue
		}
		allSame = false
	}
	if allSame {
		t.Fatalf("expected personalized questions, got %v", qs)
	}
}

func TestDeriveSampleQuestions_tencent(t *testing.T) {
	qs := DeriveSampleQuestions(SampleQuestionInput{
		Headline:      "在腾讯连拿六个五星",
		ExpertiseTags: []string{"求职面试", "腾讯"},
	})
	found := false
	for _, q := range qs {
		if containsAny(q, "腾讯", "绩效", "五星") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected tencent-related question, got %v", qs)
	}
}

func TestDisplaySampleQuestions_keepsCustom(t *testing.T) {
	custom := []string{"北邮本科申请美国ECE方向PhD有多大把握？", "要不要放弃保研名额全力准备出国？"}
	got := DisplaySampleQuestions(custom, SampleQuestionInput{Headline: "ignored"})
	if len(got) != 2 || got[0] != custom[0] {
		t.Fatalf("expected custom preserved, got %v", got)
	}
}

func TestNormalizeSampleQuestion_stripsBadNumberPrefix(t *testing.T) {
	got := NormalizeSampleQuestion("3面试一般会问什么？")
	if got != "面试一般会问什么？" {
		t.Fatalf("expected number prefix stripped, got %q", got)
	}
}

func TestRejectSampleQuestionReason_brokenTransition(t *testing.T) {
	if reason := RejectSampleQuestionReason("从海南大学到有哪些经验？", nil); reason != "broken_transition" {
		t.Fatalf("expected broken_transition, got %q", reason)
	}
}

func TestDisplaySampleQuestions_filtersStoredBadFormat(t *testing.T) {
	stored := []string{"3面试一般会问什么？", "从海南大学到有哪些经验？"}
	got := DisplaySampleQuestions(stored, SampleQuestionInput{
		ShortBio: "海南大学数学与应用数学专业，保研至厦门大学，分享保研经验。",
		School:   "海南大学",
		Knowledge: []KnowledgeSnippet{{
			Title: "海南大学保研经验",
			Content: `## 夏令营
- 面试：准备数学分析和高等代数
- 推荐信：提前找老师沟通`,
		}},
	})
	for _, q := range got {
		if q == stored[0] || q == stored[1] {
			t.Fatalf("expected bad stored questions filtered, got %v", got)
		}
	}
}

func TestDeriveSampleQuestions_fzuPostgrad(t *testing.T) {
	qs := DeriveSampleQuestions(SampleQuestionInput{
		DisplayName: "机灵的橙子鸭",
		ShortBio:    "福州大学，保研至厦门大学，分享保研经验与备考心得。",
		School:      "福州大学",
		Headline:    "机灵的橙子鸭 · 保研至厦门大学",
	})
	if len(qs) < 2 {
		t.Fatalf("expected at least 2 questions, got %v", qs)
	}
	for _, bad := range []string{"福大考研到985难度大吗？", "转专业到计算机需要什么准备？"} {
		for _, q := range qs {
			if q == bad {
				t.Fatalf("expected personalized questions, got generic %q in %v", bad, qs)
			}
		}
	}
	found := false
	for _, q := range qs {
		if containsAny(q, "厦门大学", "保研") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected XMU/保研 related question, got %v", qs)
	}
}

func TestDisplaySampleQuestions_replacesFzuTemplate(t *testing.T) {
	stored := []string{"福大考研到985难度大吗？", "转专业到计算机需要什么准备？", "408和自命题怎么选？"}
	got := DisplaySampleQuestions(stored, SampleQuestionInput{
		DisplayName: "年糕做蛋糕",
		ShortBio:    "福州大学，考研至中国科学技术大学，分享考研经验。",
		School:      "福州大学",
		Headline:    "年糕做蛋糕 · 考研至中国科学技术大学",
	})
	if len(got) != 0 {
		t.Fatalf("expected generic templates not displayed, got %v", got)
	}
}

func TestDeriveSampleQuestions_ahuBaoyan(t *testing.T) {
	qs := DeriveSampleQuestions(SampleQuestionInput{
		DisplayName: "测试",
		ShortBio:    "安徽大学互联网学院通信专业，中国科学技术大学，分享保研/升学经验与备考心得。",
		School:      "安徽大学",
	})
	if len(qs) < 2 {
		t.Fatalf("expected >=2, got %v", qs)
	}
	found := false
	for _, q := range qs {
		if containsAny(q, "中科大", "中国科学技术大学", "安徽大学") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected school-specific question, got %v", qs)
	}
}

func TestDeriveSampleQuestions_szuBaoyan(t *testing.T) {
	stored := []string{"深大保研到985难度大吗？", "双非背景如何提升竞争力？", "考研和保研怎么选择？"}
	got := DisplaySampleQuestions(stored, SampleQuestionInput{
		DisplayName: "测试",
		ShortBio:    "深圳大学CompSci计算机，中国科学技术大学，分享保研经验与备考心得。",
		School:      "深圳大学",
	})
	if len(got) != 0 {
		t.Fatalf("expected generic templates not displayed, got %v", got)
	}
}

func TestDisplaySampleQuestions_prefersKnowledgeOverStored(t *testing.T) {
	stored := []string{"关于「研途榜样」能分享什么？", "关于「保研」能分享什么？"}
	got := DisplaySampleQuestions(stored, SampleQuestionInput{
		ShortBio: "福州大学，保研至厦门大学，分享保研经验。",
		School:   "福州大学",
		Knowledge: []KnowledgeSnippet{{
			Title: "福大飞跃手册 | 保研至厦门大学",
			Content: `## 夏令营
- 推荐信两份：要用目标院校模板
- 计科绩点排名前二：科大计、浙大直博
`,
			Tags: []string{"保研", "福州大学"},
		}},
	})
	if len(got) != 0 {
		t.Fatalf("expected no display without stored good questions, got %v", got)
	}
}

func TestDeriveSampleQuestions_shuAbroad(t *testing.T) {
	stored := []string{"上大保研需要什么条件？", "考研和保研怎么选择？", "如何平衡学业和实习？"}
	got := DisplaySampleQuestions(stored, SampleQuestionInput{
		DisplayName: "测试",
		ShortBio:    "上海大学数学系专业，University of Southern Califor，分享留学经验与个人历程。",
		School:      "上海大学",
	})
	if len(got) != 0 {
		t.Fatalf("expected generic templates not displayed, got %v", got)
	}
}

func TestDisplaySampleQuestions_emptyAfterDelete(t *testing.T) {
	got := DisplaySampleQuestions(nil, SampleQuestionInput{
		ShortBio: "来自北大CS自学指南的课程推荐与学习经验：UCB CS169: software engineerin。",
		Knowledge: []KnowledgeSnippet{{
			Title:   "UCB CS169",
			Content: "## Descriptions\n- Offered by: UC Berkeley\n",
		}},
	})
	if len(got) != 0 {
		t.Fatalf("expected empty after delete, got %v", got)
	}
}
