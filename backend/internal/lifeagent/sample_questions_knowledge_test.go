package lifeagent

import "testing"

const fzuKnowledgeExcerpt = `## 保研经验分享

### 个人情况

约三月开始准备，准备内容如下：

- 个人简历一份：PDF 格式
- 推荐信两份：这个一般要用目标院校给的模板
- 六级成绩单，纸质版扫描件

### 同校情况

- 计科绩点排名前二：科大计、浙大直博
- 信安绩点排名第一 + 竞赛国一：上交网安
`

func TestDeriveSampleQuestionsFromKnowledge_fzu(t *testing.T) {
	qs := DeriveSampleQuestions(SampleQuestionInput{
		Knowledge: []KnowledgeSnippet{{
			Title:   "福大飞跃手册 | 保研至北京航空航天大学",
			Content: fzuKnowledgeExcerpt,
			Tags:    []string{"保研", "福州大学"},
		}},
	})
	if len(qs) < 2 {
		t.Fatalf("expected >=2 from knowledge, got %v", qs)
	}
	for _, bad := range []string{"福大考研到985难度大吗？", "转专业到计算机需要什么准备？"} {
		for _, q := range qs {
			if q == bad {
				t.Fatalf("unexpected template question %q in %v", bad, qs)
			}
		}
	}
	found := false
	for _, q := range qs {
		if containsAny(q, "推荐信", "简历", "计科", "绩点", "同校") {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected knowledge-specific hook in %v", qs)
	}
}

func TestDeriveSampleQuestionsFromKnowledge_twoAgentsDiffer(t *testing.T) {
	a := DeriveSampleQuestionsFromKnowledge([]KnowledgeSnippet{{
		Title: "A", Content: "## 夏令营\n\n- 面试：准备专业课\n",
	}})
	b := DeriveSampleQuestionsFromKnowledge([]KnowledgeSnippet{{
		Title: "B", Content: "## 机试技巧\n\n- STL：多刷题\n",
	}})
	if len(a) < 1 || len(b) < 1 {
		t.Fatal("expected questions")
	}
	if a[0] == b[0] {
		t.Fatalf("different knowledge should yield different questions: %q vs %q", a[0], b[0])
	}
}
