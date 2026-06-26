package lifeagent

import (
	"strings"
	"testing"
)

func TestParseInlineCitationsSuperscript(t *testing.T) {
	text := "我当年考研时挺拼的¹，后来去了 CMU²。"
	display, indexes := ParseInlineCitations(text)
	if display != text {
		t.Fatalf("display text changed: %q", display)
	}
	if len(indexes) != 2 || indexes[0] != 1 || indexes[1] != 2 {
		t.Fatalf("indexes = %v, want [1 2]", indexes)
	}
}

func TestParseInlineCitationsBracket(t *testing.T) {
	text := "建议先想清楚方向[1]，再行动[2]。"
	_, indexes := ParseInlineCitations(text)
	if len(indexes) != 2 {
		t.Fatalf("indexes = %v", indexes)
	}
}

func TestBuildCitedReferencesFiltersUsed(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Route: RetrievalRouteEntry,
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "A", Content: "content A"},
			{ID: "e2", Title: "B", Content: "content B"},
		},
		Facts: []StructuredFactForAI{
			{ID: "f1", FactKey: "school", FactValue: "CMU"},
		},
	})
	refs := BuildCitedReferences(catalog, []int{2}, true)
	if len(refs) != 1 {
		t.Fatalf("len refs = %d", len(refs))
	}
	if refs[0]["id"] != "e1" {
		t.Fatalf("id = %q", refs[0]["id"])
	}
	if refs[0]["citeIndex"] != "2" {
		t.Fatalf("citeIndex = %q", refs[0]["citeIndex"])
	}
}

func TestRenumberReplySegmentCitationsAnswerLevel(t *testing.T) {
	segments := []string{
		"大二那会儿先把方向定下来[3]。",
		"后面实习也挺关键[5]，但别重复讲[3]。",
	}
	refs := []map[string]string{
		{"id": "unused", "sourceType": "knowledge", "title": "未使用", "excerpt": "unused", "citeIndex": "1"},
		{"id": "entry-a", "sourceType": "knowledge", "title": "方向", "excerpt": "direction", "citeIndex": "3"},
		{"id": "entry-b", "sourceType": "knowledge", "title": "实习", "excerpt": "internship", "citeIndex": "5"},
	}

	gotSegments, gotSegRefs, gotRefs := RenumberReplySegmentCitations(segments, refs)
	if gotSegments[0] != "大二那会儿先把方向定下来[1]。" {
		t.Fatalf("segment 0 = %q", gotSegments[0])
	}
	if gotSegments[1] != "后面实习也挺关键[2]，但别重复讲[1]。" {
		t.Fatalf("segment 1 = %q", gotSegments[1])
	}
	if len(gotRefs) != 2 || gotRefs[0]["id"] != "entry-a" || gotRefs[0]["citeIndex"] != "1" || gotRefs[1]["id"] != "entry-b" || gotRefs[1]["citeIndex"] != "2" {
		t.Fatalf("refs = %#v", gotRefs)
	}
	if len(gotSegRefs) != 2 || len(gotSegRefs[0]) != 1 || gotSegRefs[0][0]["citeIndex"] != "1" || len(gotSegRefs[1]) != 2 {
		t.Fatalf("segment refs = %#v", gotSegRefs)
	}
}

func TestTopicRedundantWithEntries(t *testing.T) {
	topic := TopicSummaryForAI{
		ID:             "t1",
		TopicLabel:     "大二恋爱经历",
		SourceEntryIDs: []string{"e1"},
	}
	entries := []KnowledgeEntryForAI{{ID: "e1", Title: "大二恋爱经历"}}
	if !topicRedundantWithEntries(topic, entries) {
		t.Fatal("expected redundant when entry id matches topic source")
	}
	entries2 := []KnowledgeEntryForAI{{ID: "e2", Title: "大二恋爱经历"}}
	if !topicRedundantWithEntries(topic, entries2) {
		t.Fatal("expected redundant when titles match")
	}
	catalog := BuildCitationCatalog(RetrievalPlan{
		Topics:  []TopicSummaryForAI{topic},
		Entries: entries,
	})
	if len(catalog.Items) != 1 {
		t.Fatalf("catalog len = %d, want 1 (entry only)", len(catalog.Items))
	}
	if catalog.Items[0].SourceType != "knowledge" {
		t.Fatalf("sourceType = %q", catalog.Items[0].SourceType)
	}
}

func TestNormalizeCitationMarkers(t *testing.T) {
	got := NormalizeCitationMarkers("你好¹世界²")
	want := "你好[1]世界[2]"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestHeuristicEnsureInlineCitations(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学准备与大二实习", Content: "留学要早准备，大二实习很重要"},
			{ID: "e2", Title: "大二恋爱经历", Content: "大二谈过恋爱"},
		},
	})
	text := "大一是探索期，可以多试。\n\n大二要定方向加实习。"
	got := HeuristicEnsureInlineCitations(text, catalog)
	if strings.Contains(got, "[2]") {
		t.Fatalf("should not cite 恋爱 on roadmap paragraph, got %q", got)
	}
}

func TestValidateInlineCitationsStripsIrrelevant(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学准备", Content: "留学"},
			{ID: "e2", Title: "大二恋爱经历", Content: "恋爱"},
		},
	})
	text := "大一大胆试，大二定方向[2]。"
	got := ValidateInlineCitations(text, catalog)
	if strings.Contains(got, "[2]") {
		t.Fatalf("expected [2] removed, got %q", got)
	}
}

func TestValidateInlineCitationsStripsPhysicsOnBackgroundTopic(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Topics: []TopicSummaryForAI{{
			ID:         "t1",
			TopicLabel: "本科背景与多元经历",
			Summary:    "本科毕业于温州大学，同时经历了考研、留学、创业和找工作",
		}},
	})
	text := "当时就是看那种科普书，《时间简史》之类的，觉得挺酷的，什么时间膨胀啊尺缩效应啊，也就知道个概念。后来上了大学选了计算机，就没再深入搞物理了[1]。"
	got := ValidateInlineCitations(text, catalog)
	if strings.Contains(got, "[1]") {
		t.Fatalf("expected wrong background topic cite stripped, got %q", got)
	}
}

func TestFillSentenceCitationsSkipsBackgroundOnRelativityTalk(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Topics: []TopicSummaryForAI{{
			ID:         "t1",
			TopicLabel: "本科背景与多元经历",
			Summary:    "本科毕业于温州大学，同时经历了考研、留学、创业和找工作",
		}},
	})
	text := "当时就是看那种科普书，《时间简史》之类的，觉得挺酷的，什么时间膨胀啊尺缩效应啊，也就知道个概念。后来上了大学选了计算机，就没再深入搞物理了。"
	got := fillSentenceCitations(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) != 0 {
		t.Fatalf("expected no cite on relativity talk with only background topic, got %v in %q", used, got)
	}
}

func TestValidateInlineCitationsKeepsRelevant(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学背景", Content: "温州大学 CMU 985 offer"},
		},
	})
	text := "本科在温州大学，后来去了 CMU[1]。"
	got := ValidateInlineCitations(text, catalog)
	if !strings.Contains(got, "[1]") {
		t.Fatalf("expected [1] kept, got %q", got)
	}
}

func TestOverlapEnsureInlineCitations(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "本科与留学", Content: "温州大学 计算机 CMU offer"},
		},
	})
	text := "本科在温州大学读计算机，后来拿到 CMU 的 offer。"
	got := overlapEnsureInlineCitations(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) == 0 {
		t.Fatalf("expected citation, got %q", got)
	}
}

func TestOverlapEnsureFillsUncitedParagraphsWhenSomeExist(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "考研双线规划", Content: "大二下开始准备雅思和考研英语，绩点选修课策略"},
			{ID: "e2", Title: "留学申请", Content: "一亩三分地查项目要求，半DIY中介"},
		},
	})
	text := "行，那我细说说那段日子。\n\n" +
		"大二下册开始琢磨考研和留学双线，绩点压力也很大[1]。\n\n" +
		"早上听雅思，晚上背考研英语单词，天天如此。\n\n" +
		"我还去一亩三分地查项目要求，后来找了半DIY中介。"
	got := overlapEnsureInlineCitations(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) < 2 {
		t.Fatalf("expected cites on multiple paragraphs, got %v in %q", used, got)
	}
}

func TestStripInlineCitations(t *testing.T) {
	got := StripInlineCitations("你好¹世界[2]")
	want := "你好世界"
	if got != want {
		t.Fatalf("got %q want %q", got, want)
	}
}

func TestCapCitationMarkersOnePerParagraph(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{ID: "e1", Title: "留学", Content: "温州大学 CMU"},
			{ID: "e2", Title: "实习", Content: "大二实习"},
		},
	})
	text := "本科温州大学 CMU[1] 大二实习[2]。"
	got := CapCitationMarkers(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) != 2 {
		t.Fatalf("expected both cites kept, got %v in %q", used, got)
	}
}

func TestValidateInlineCitationsStripsPhysicsOnThesisSentence(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Topics: []TopicSummaryForAI{{
			ID:         "t1",
			TopicLabel: "本科背景与多元经历",
			Summary:    "温州大学 计算机 双非 考研 留学 创业 找工作",
		}},
		Entries: []KnowledgeEntryForAI{{
			ID:      "e1",
			Title:   "童年物理兴趣与自学经历",
			Content: "小学自学量子力学和相对论 小时候对物理感兴趣",
		}},
	})
	text := "本科在温州大学读计算机，学习氛围一般[2]。" +
		"毕设做了个游戏化激励系统，投资人感兴趣但最后没成[1]。"
	got := ValidateInlineCitations(text, catalog)
	if !strings.Contains(got, "[2]") {
		t.Fatalf("expected background topic cite kept, got %q", got)
	}
	if strings.Contains(got, "[1]") {
		t.Fatalf("expected physics cite stripped from thesis sentence, got %q", got)
	}
}

func TestFillSentenceCitationsNoPhysicsOnThesisSentence(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Topics: []TopicSummaryForAI{{
			ID:         "t1",
			TopicLabel: "本科背景与多元经历",
			Summary:    "温州大学 计算机 双非 考研 留学 创业 找工作",
		}},
		Entries: []KnowledgeEntryForAI{{
			ID:      "e1",
			Title:   "童年物理兴趣与自学经历",
			Content: "小学自学量子力学和相对论 小时候对物理感兴趣",
		}},
	})
	text := "本科在温州大学读计算机，学习氛围一般[2]。" +
		"毕设做了个游戏化激励系统，投资人感兴趣但最后没成。"
	got := fillSentenceCitations(text, catalog)
	if strings.Contains(got, "[1]") {
		t.Fatalf("expected no physics cite on thesis sentence, got %q", got)
	}
}

func TestCitationGroundingValidTable(t *testing.T) {
	cases := []struct {
		name   string
		plan   RetrievalPlan
		sent   string
		index  int
		expect bool
	}{
		{
			name: "physics item on thesis sentence",
			plan: RetrievalPlan{
				Topics: []TopicSummaryForAI{{
					TopicLabel: "本科背景与多元经历",
					Summary:    "温州大学 计算机 双非",
				}},
				Entries: []KnowledgeEntryForAI{{
					Title: "童年物理兴趣", Content: "小学自学量子力学和相对论",
				}},
			},
			sent:   "毕设做了个游戏化激励系统，投资人感兴趣但最后没成。",
			index:  1,
			expect: false,
		},
		{
			name: "physics item on physics sentence",
			plan: RetrievalPlan{
				Entries: []KnowledgeEntryForAI{{
					Title: "童年物理兴趣", Content: "小学自学量子力学和相对论",
				}},
			},
			sent:   "小时候就对物理特别感兴趣，小学就开始自学量子力学和相对论。",
			index:  1,
			expect: true,
		},
		{
			name: "love item on roadmap sentence",
			plan: RetrievalPlan{
				Entries: []KnowledgeEntryForAI{
					{Title: "留学准备", Content: "留学 申请"},
					{Title: "大二恋爱经历", Content: "大二谈过恋爱"},
				},
			},
			sent:   "大一大胆试，大二定方向。",
			index:  2,
			expect: false,
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			catalog := BuildCitationCatalog(tc.plan)
			item := catalog.Items[tc.index-1]
			got := citationGroundingValid(tc.sent, item, catalog)
			if got != tc.expect {
				t.Fatalf("citationGroundingValid = %v, want %v (item=%q sent=%q)", got, tc.expect, item.Title, tc.sent)
			}
		})
	}
}

func TestKnowledgeEntryCitationChunks(t *testing.T) {
	long := strings.Repeat("第一段讲考研和留学准备，包含雅思、绩点和项目筛选。", 16) +
		strings.Repeat("第二段讲实习和求职准备，包含简历、面试和暑期实践。", 16)
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{{
			ID: "entry-1", Title: "规划经历", Category: "经历", Content: long,
		}},
	})
	if len(catalog.Items) < 2 {
		t.Fatalf("expected long entry split into chunks, got %d", len(catalog.Items))
	}
	if catalog.Items[0].ParentID != "entry-1" || catalog.Items[0].ChunkIndex != 1 {
		t.Fatalf("chunk metadata missing: %#v", catalog.Items[0])
	}
	refs := BuildCitedReferences(catalog, []int{1}, true)
	if len(refs) != 1 {
		t.Fatalf("refs len = %d", len(refs))
	}
	if refs[0]["parentId"] != "entry-1" || refs[0]["evidenceKind"] != "chunk" || refs[0]["charEnd"] == "" {
		t.Fatalf("chunk ref metadata missing: %#v", refs[0])
	}
	if refs[0]["fullContent"] == long {
		t.Fatalf("expected cited fullContent to be a chunk, not the whole entry")
	}
}

func TestBuildCitationCatalogUsesPersistentChunks(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{{
			ID: "entry-1", Title: "规划经历", Category: "经历", Content: strings.Repeat("整条原文很长。", 80),
			CitationChunks: []KnowledgeChunkForAI{
				{ID: "chunk-a", EntryID: "entry-1", ChunkIndex: 1, Content: "考研和留学准备片段。", CharStart: 0, CharEnd: 10},
				{ID: "chunk-b", EntryID: "entry-1", ChunkIndex: 2, Content: "实习和求职准备片段。", CharStart: 10, CharEnd: 20},
			},
		}},
	})
	if len(catalog.Items) != 2 {
		t.Fatalf("catalog len = %d, want 2 persistent chunks", len(catalog.Items))
	}
	if catalog.Items[0].ID != "chunk-a" || catalog.Items[0].ParentID != "entry-1" || catalog.Items[0].FullContent != "考研和留学准备片段。" {
		t.Fatalf("first chunk = %#v", catalog.Items[0])
	}
}

func TestSentenceLevelCitationsMultiSourceInOneBubble(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{
		Entries: []KnowledgeEntryForAI{
			{
				ID:      "e1",
				Title:   "本科背景与四条路",
				Content: "温州大学 计算机 双非 考研 留学 创业 找工作",
			},
			{
				ID:      "e2",
				Title:   "童年物理兴趣",
				Content: "小时候对物理感兴趣 小学自学量子力学和相对论",
			},
		},
	})
	text := "本科在温州大学读计算机，双非。大学那会儿同时经历了考研、留学、创业和找工作四条路，说实话挺折腾的[1]。" +
		"另外小时候就对物理特别感兴趣，小学就开始自学量子力学和相对论。"
	got := fillSentenceCitations(text, catalog)
	_, used := ParseInlineCitations(got)
	if len(used) < 2 {
		t.Fatalf("expected cites on both topic sentences, got %v in %q", used, got)
	}
	refs := BuildCitedReferences(catalog, used, true)
	if len(refs) < 2 {
		t.Fatalf("expected 2 refs, got %d", len(refs))
	}
}
