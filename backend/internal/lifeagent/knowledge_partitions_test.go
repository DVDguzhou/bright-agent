package lifeagent

import (
	"strings"
	"testing"

	"github.com/agent-marketplace/backend/internal/models"
)

func TestBuildKnowledgeEntriesForAISplitsUniversityStages(t *testing.T) {
	rows := []models.LifeAgentKnowledgeEntry{{
		ID: "college", Category: "经历", Title: "大一", Content: "大一适应校园，住在A区。大二做VR项目，也开始健身。大三准备考研和留学。大四完成毕业设计。",
	}}

	entries := BuildKnowledgeEntriesForAI(rows)
	if len(entries) != 4 {
		t.Fatalf("entries=%#v, want four stage evidence units", entries)
	}
	for i, stage := range []string{"大一", "大二", "大三", "大四"} {
		if !strings.HasPrefix(entries[i].Title, stage) || entries[i].SourceEntryID != "college" {
			t.Fatalf("entry %d=%#v", i, entries[i])
		}
		if !strings.Contains(entries[i].Content, stage) {
			t.Fatalf("entry %d content=%q does not contain %s", i, entries[i].Content, stage)
		}
	}
}

func TestBuildKnowledgeEntriesForAIDoesNotSplitSingleStage(t *testing.T) {
	rows := []models.LifeAgentKnowledgeEntry{{
		ID: "freshman", Category: "经历", Title: "大一", Content: "大一刚入学时适应校园，大一结束时过了四级。",
	}}
	entries := BuildKnowledgeEntriesForAI(rows)
	if len(entries) != 1 || entries[0].ID != "freshman" || entries[0].SourceEntryID != "freshman" {
		t.Fatalf("entries=%#v, want original entry", entries)
	}
}

func TestPartitionKnowledgeEntrySupportsGeneralEventBoundaries(t *testing.T) {
	tests := []struct {
		name    string
		content string
		prefix  []string
	}{
		{name: "calendar", content: "2022年开始做产品运营，负责冷启动。2023年加入新公司，负责商业化。", prefix: []string{"2022年", "2023年"}},
		{name: "compound anchors", content: "2022年入职后负责支付系统，处理高并发。2024年转行后开始做产品，负责教育业务。", prefix: []string{"2022年 · 入职后", "2024年 · 转行后"}},
		{name: "education career", content: "高中阶段参加信息学竞赛，拿到省奖。第一份工作做后端开发，负责支付系统。", prefix: []string{"高中", "第一份工作"}},
		{name: "project", content: "准备阶段访谈了二十名用户，确认需求。上线后持续看留存数据，调整功能。", prefix: []string{"准备阶段", "上线后"}},
		{name: "location", content: "搬到上海后进入互联网行业，主要做增长。回到杭州后开始创业，组建团队。", prefix: []string{"搬到上海后", "回到杭州后"}},
		{name: "sections", content: "【求学经历】\n本科读计算机，参加科创。\n【职业经历】\n毕业后做产品经理，负责教育业务。", prefix: []string{"求学经历", "职业经历"}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			parts := PartitionKnowledgeEntry(KnowledgeEntryForAI{ID: "source", Title: "个人经历", Content: tc.content})
			if len(parts) != len(tc.prefix) {
				t.Fatalf("parts=%#v, want %d", parts, len(tc.prefix))
			}
			for i, prefix := range tc.prefix {
				if !strings.HasPrefix(parts[i].Title, prefix) || parts[i].SourceEntryID != "source" {
					t.Fatalf("part %d=%#v, want prefix %q", i, parts[i], prefix)
				}
			}
		})
	}
}

func TestBuildTopicSummariesAggregatesUniversityStages(t *testing.T) {
	profile := models.LifeAgentProfile{ID: "profile"}
	entries := []models.LifeAgentKnowledgeEntry{
		{ID: "y1", Category: "经历", Title: "大一适应校园", Content: "大一住在A区。"},
		{ID: "y2", Category: "经历", Title: "大二项目", Content: "大二做VR项目。"},
		{ID: "y3", Category: "经历", Title: "大三规划", Content: "大三准备考研。"},
		{ID: "y4", Category: "经历", Title: "大四毕业", Content: "大四完成毕业设计。"},
	}

	topics := BuildTopicSummariesFromProfileModel(profile, entries)
	if len(topics) != 1 {
		t.Fatalf("topics=%#v, want one aggregate topic", topics)
	}
	if topics[0].TopicGroup != "collegeLife" || topics[0].TopicLabel != "大学生活" {
		t.Fatalf("topic=%#v, want 大学生活 aggregate", topics[0])
	}
	if len(topics[0].SourceEntryIDs) != 4 {
		t.Fatalf("source ids=%#v, want four raw entries", topics[0].SourceEntryIDs)
	}
}

func TestBuildTopicSummariesCreatesDomainHierarchy(t *testing.T) {
	profile := models.LifeAgentProfile{ID: "profile"}
	entries := []models.LifeAgentKnowledgeEntry{
		{ID: "career-1", Category: "经历", Title: "第一份工作", Content: "第一份工作做后端开发。"},
		{ID: "career-2", Category: "经历", Title: "转行产品", Content: "转行后开始做产品经理。"},
		{ID: "relationship", Category: "经历", Title: "一段恋爱", Content: "谈过一段恋爱，后来和平分手。"},
	}

	topics := BuildTopicSummariesFromProfileModel(profile, entries)
	labels := map[string]bool{}
	for _, topic := range topics {
		labels[topic.TopicLabel] = true
	}
	if !labels["职业经历"] || !labels["感情经历"] {
		t.Fatalf("topics=%#v, want hierarchical career and relationship topics", topics)
	}
}

func TestTopicCitationIsHiddenWhenPartitionedRawEntryExists(t *testing.T) {
	topic := TopicSummaryForAI{ID: "topic", TopicLabel: "大学生活", SourceEntryIDs: []string{"college"}}
	entry := KnowledgeEntryForAI{ID: "college#event-2", SourceEntryID: "college", Title: "大二 · VR项目", Content: "大二做VR项目。"}
	if !topicRedundantWithEntries(topic, []KnowledgeEntryForAI{entry}) {
		t.Fatal("aggregate topic should not replace its raw stage evidence citation")
	}
}

func TestLegacyStageTopicIsHiddenBySpecificStageEvidence(t *testing.T) {
	topic := TopicSummaryForAI{ID: "legacy-topic", TopicLabel: "大一"}
	entry := KnowledgeEntryForAI{ID: "college#event-1", SourceEntryID: "college", Title: "大一 · 适应校园", Content: "大一适应校园。"}
	if !topicRedundantWithEntries(topic, []KnowledgeEntryForAI{entry}) {
		t.Fatal("legacy stage topic should be hidden when specific event evidence exists")
	}
}

func TestPartitionedCitationKeepsOriginalParentID(t *testing.T) {
	catalog := BuildCitationCatalog(RetrievalPlan{Entries: []KnowledgeEntryForAI{{
		ID: "college#event-2", SourceEntryID: "college", Title: "大二 · VR项目", Content: "大二做VR项目。",
	}}})
	if len(catalog.Items) != 1 || catalog.Items[0].ParentID != "college" || catalog.Items[0].Title != "大二 · VR项目" {
		t.Fatalf("catalog=%#v", catalog.Items)
	}
	refs := BuildCitationCatalogReferences(catalog)
	if len(refs) != 1 || refs[0]["evidenceKind"] != "event" || refs[0]["evidenceUnitId"] != "college#event-2" {
		t.Fatalf("refs=%#v, want child event identity", refs)
	}
}
