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
