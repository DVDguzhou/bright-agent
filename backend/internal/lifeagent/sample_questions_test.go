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
	for _, q := range got {
		if q == stored[0] || q == stored[1] {
			t.Fatalf("expected derived not template, got %v", got)
		}
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
	for _, q := range got {
		if q == stored[0] {
			t.Fatalf("expected personalized, got template %v", got)
		}
	}
}

func TestDeriveSampleQuestions_shuAbroad(t *testing.T) {
	stored := []string{"上大保研需要什么条件？", "考研和保研怎么选择？", "如何平衡学业和实习？"}
	got := DisplaySampleQuestions(stored, SampleQuestionInput{
		DisplayName: "测试",
		ShortBio:    "上海大学数学系专业，University of Southern Califor，分享留学经验与个人历程。",
		School:      "上海大学",
	})
	for _, q := range got {
		if q == stored[0] {
			t.Fatalf("expected personalized, got template %v", got)
		}
	}
}
