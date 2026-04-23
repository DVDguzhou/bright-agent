package lifeagent

import (
	"fmt"
	"hash/fnv"
	"regexp"
	"sort"
	"strings"

	"github.com/agent-marketplace/backend/internal/models"
)

type TopicSummaryForAI struct {
	ID               string
	TopicGroup       string
	TopicKey         string
	TopicLabel       string
	Summary          string
	Aliases          []string
	QuestionPatterns []string
	SourceEntryIDs   []string
	Confidence       string
	Status           string
	// Embedding 可选；存在则参与 hybrid RAG 的向量召回。
	Embedding []float32
}

type topicAccumulator struct {
	group          string
	label          string
	key            string
	aliases        []string
	questionPats   []string
	sourceEntryIDs []string
	snippets       []string
}

var topicGroupRules = []struct {
	group    string
	keywords []string
}{
	{group: "education", keywords: []string{"学校", "学历", "考研", "读研", "读书", "高考", "保研", "留学", "学习", "本科", "硕士", "博士", "升学"}},
	{group: "career", keywords: []string{"工作", "职业", "求职", "实习", "面试", "转行", "转岗", "晋升", "职场", "产品经理", "运营", "程序员"}},
	{group: "industry", keywords: []string{"行业", "互联网", "金融", "教育行业", "医疗行业", "消费", "to b", "to c"}},
	{group: "cityChoice", keywords: []string{"城市", "留在", "回老家", "北上广", "杭州", "上海", "北京", "深圳", "定居", "异地"}},
	{group: "startup", keywords: []string{"创业", "公司", "项目", "团队", "招人", "融资", "大赛", "参赛", "商业计划"}},
	{group: "money", keywords: []string{"收入", "工资", "年薪", "钱", "存款", "副业", "成本", "预算", "财务"}},
	{group: "relationship", keywords: []string{"感情", "恋爱", "分手", "结婚", "对象", "伴侣", "相亲", "异地恋"}},
	{group: "family", keywords: []string{"父母", "家里", "家庭", "孩子", "亲戚", "婆媳", "原生家庭"}},
	{group: "mental", keywords: []string{"焦虑", "压力", "情绪", "内耗", "崩溃", "迷茫", "抑郁", "自卑", "状态"}},
	{group: "lifeChoice", keywords: []string{"选择", "方向", "决定", "取舍", "人生", "规划", "长期主义", "路径"}},
	{group: "social", keywords: []string{"社交", "朋友", "人脉", "沟通", "表达", "同事关系", "合作"}},
}

var topicStopWordsRe = regexp.MustCompile(`[^\p{Han}a-zA-Z0-9]+`)

func BuildTopicSummariesFromProfileModel(profile models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) []models.LifeAgentTopicSummary {
	if len(entries) == 0 {
		return nil
	}
	accs := map[string]*topicAccumulator{}
	for _, entry := range entries {
		group := inferTopicGroup(entry)
		label := inferTopicLabel(entry)
		key := buildTopicKey(group, label, entry)
		acc := accs[key]
		if acc == nil {
			acc = &topicAccumulator{
				group: group,
				label: label,
				key:   key,
			}
			accs[key] = acc
		}
		acc.aliases = append(acc.aliases, collectTopicAliases(entry)...)
		acc.questionPats = append(acc.questionPats, buildTopicQuestionPatterns(group, label)...)
		acc.sourceEntryIDs = append(acc.sourceEntryIDs, entry.ID)
		acc.snippets = append(acc.snippets, strings.TrimSpace(entry.Content))
	}
	keys := make([]string, 0, len(accs))
	for key := range accs {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	out := make([]models.LifeAgentTopicSummary, 0, len(keys))
	for _, key := range keys {
		acc := accs[key]
		if acc == nil || strings.TrimSpace(acc.label) == "" {
			continue
		}
		confidence := "medium"
		if len(uniqueStrings(acc.sourceEntryIDs, 0)) >= 2 {
			confidence = "high"
		}
		out = append(out, models.LifeAgentTopicSummary{
			ID:               models.GenID(),
			ProfileID:        profile.ID,
			TopicGroup:       acc.group,
			TopicKey:         acc.key,
			TopicLabel:       acc.label,
			Summary:          buildTopicSummary(acc.label, acc.snippets),
			Aliases:          models.JSONArray(uniqueStrings(acc.aliases, 8)),
			QuestionPatterns: models.JSONArray(uniqueStrings(acc.questionPats, 6)),
			SourceEntryIDs:   models.JSONArray(uniqueStrings(acc.sourceEntryIDs, 0)),
			Source:           "knowledge",
			Confidence:       confidence,
			Status:           "active",
		})
	}
	return out
}

func BuildTopicCandidatesFromConversationMemory(profileID, sessionID string, memory ConversationMemory) []models.LifeAgentTopicSummary {
	if profileID == "" || sessionID == "" || len(memory.ConversationTopics) == 0 {
		return nil
	}
	out := make([]models.LifeAgentTopicSummary, 0, len(memory.ConversationTopics))
	for _, topicText := range uniqueStrings(memory.ConversationTopics, 4) {
		topicText = cleanTopicLabel(topicText)
		if topicText == "" {
			continue
		}
		entry := models.LifeAgentKnowledgeEntry{
			Category: "会话话题",
			Title:    topicText,
			Content:  strings.Join(uniqueStrings([]string{memory.SummaryText, strings.Join(memory.AssistantSuggestions, "；")}, 0), "\n"),
			Tags:     models.JSONArray{topicText},
		}
		group := inferTopicGroup(entry)
		label := inferTopicLabel(entry)
		key := buildTopicKey(group, label, entry)
		summaryParts := []string{
			"这是从长期会话记忆里提炼出的候选话题：" + label + "。",
		}
		if strings.TrimSpace(memory.SummaryText) != "" {
			summaryParts = append(summaryParts, memory.SummaryText)
		}
		if len(memory.AssistantSuggestions) > 0 {
			summaryParts = append(summaryParts, "相关建议："+strings.Join(uniqueStrings(memory.AssistantSuggestions, 2), "；"))
		}
		out = append(out, models.LifeAgentTopicSummary{
			ID:               models.GenID(),
			ProfileID:        profileID,
			TopicGroup:       group,
			TopicKey:         key,
			TopicLabel:       label,
			Summary:          strings.Join(summaryParts, "\n"),
			Aliases:          models.JSONArray(uniqueStrings([]string{label, topicText}, 4)),
			QuestionPatterns: models.JSONArray(buildTopicQuestionPatterns(group, label)),
			SourceEntryIDs:   models.JSONArray{"session:" + sessionID},
			Source:           "memory",
			Confidence:       "low",
			Status:           "candidate",
		})
	}
	return out
}

func BuildTopicSummariesForAI(topics []models.LifeAgentTopicSummary) []TopicSummaryForAI {
	out := make([]TopicSummaryForAI, 0, len(topics))
	for _, topic := range topics {
		out = append(out, TopicSummaryForAI{
			ID:               topic.ID,
			TopicGroup:       topic.TopicGroup,
			TopicKey:         topic.TopicKey,
			TopicLabel:       topic.TopicLabel,
			Summary:          topic.Summary,
			Aliases:          jsonArrayToStrings(topic.Aliases),
			QuestionPatterns: jsonArrayToStrings(topic.QuestionPatterns),
			SourceEntryIDs:   jsonArrayToStrings(topic.SourceEntryIDs),
			Confidence:       topic.Confidence,
			Status:           topic.Status,
			Embedding:        DecodeVector(topic.Embedding),
		})
	}
	return out
}

func inferTopicGroup(entry models.LifeAgentKnowledgeEntry) string {
	candidates := []string{entry.Category, entry.Title, entry.Content, strings.Join(jsonArrayToStrings(entry.Tags), " ")}
	norm := normalize(strings.Join(candidates, " "))
	for _, rule := range topicGroupRules {
		for _, keyword := range rule.keywords {
			if strings.Contains(norm, normalize(keyword)) {
				return rule.group
			}
		}
	}
	return "other"
}

func inferTopicLabel(entry models.LifeAgentKnowledgeEntry) string {
	for _, candidate := range []string{entry.Title, firstNonEmptyTag(jsonArrayToStrings(entry.Tags)), entry.Category} {
		candidate = cleanTopicLabel(candidate)
		if candidate != "" {
			return candidate
		}
	}
	return "经验主题"
}

func cleanTopicLabel(value string) string {
	value = strings.TrimSpace(value)
	value = strings.Trim(value, "。！？,.!?:：;； ")
	value = strings.ReplaceAll(value, "\n", " ")
	value = strings.Join(strings.Fields(value), " ")
	if len([]rune(value)) > 24 {
		value = string([]rune(value)[:24])
	}
	return strings.TrimSpace(value)
}

func buildTopicKey(group, label string, entry models.LifeAgentKnowledgeEntry) string {
	base := cleanTopicLabel(label)
	normalized := strings.ToLower(topicStopWordsRe.ReplaceAllString(base, "_"))
	normalized = strings.Trim(normalized, "_")
	if normalized != "" && normalized != "_" {
		return group + "_" + normalized
	}
	hashInput := strings.Join([]string{group, label, entry.Title, entry.Category}, "|")
	return fmt.Sprintf("%s_%x", group, shortTopicHash(hashInput))
}

func shortTopicHash(value string) uint32 {
	h := fnv.New32a()
	_, _ = h.Write([]byte(value))
	return h.Sum32()
}

func collectTopicAliases(entry models.LifeAgentKnowledgeEntry) []string {
	aliases := []string{cleanTopicLabel(entry.Title), cleanTopicLabel(entry.Category)}
	for _, tag := range jsonArrayToStrings(entry.Tags) {
		aliases = append(aliases, cleanTopicLabel(tag))
	}
	return uniqueStrings(aliases, 0)
}

func buildTopicQuestionPatterns(group, label string) []string {
	base := cleanTopicLabel(label)
	patterns := []string{
		base + " 怎么办",
		base + " 应该怎么选",
		base + " 有什么经验",
	}
	switch group {
	case "career":
		patterns = append(patterns, "遇到"+base+"怎么处理", "想做"+base+"要准备什么")
	case "education":
		patterns = append(patterns, base+" 值不值得", "关于"+base+"怎么规划")
	case "cityChoice":
		patterns = append(patterns, base+" 应该留下还是离开", "关于"+base+"怎么取舍")
	case "startup":
		patterns = append(patterns, base+" 踩过什么坑", "做"+base+"最容易忽略什么")
	}
	return uniqueStrings(patterns, 0)
}

func buildTopicSummary(label string, snippets []string) string {
	snippets = uniqueStrings(snippets, 3)
	parts := make([]string, 0, len(snippets)+1)
	if label != "" {
		parts = append(parts, "这个主题主要围绕"+label+"。")
	}
	for _, snippet := range snippets {
		snippet = strings.TrimSpace(snippet)
		if snippet == "" {
			continue
		}
		runes := []rune(snippet)
		if len(runes) > 140 {
			snippet = string(runes[:140]) + "..."
		}
		parts = append(parts, snippet)
	}
	return strings.Join(parts, "\n")
}

func jsonArrayToStrings(items models.JSONArray) []string {
	out := make([]string, 0, len(items))
	for _, item := range items {
		text := strings.TrimSpace(item)
		if text != "" {
			out = append(out, text)
		}
	}
	return out
}

func firstNonEmptyTag(items []string) string {
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item != "" {
			return item
		}
	}
	return ""
}

func MergeJSONArrayStrings(left, right models.JSONArray, max int) models.JSONArray {
	return models.JSONArray(uniqueStrings(append(jsonArrayToStrings(left), jsonArrayToStrings(right)...), max))
}
