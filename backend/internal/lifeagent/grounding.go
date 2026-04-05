package lifeagent

import (
	"fmt"
	"regexp"
	"strings"
)

type RetrievalPlan struct {
	Facts      []StructuredFactForAI
	Topics     []TopicSummaryForAI
	Entries    []KnowledgeEntryForAI
	Confidence string
	Reasons    []string
}

type rankedFact struct {
	fact  StructuredFactForAI
	score int
}

type factIntent struct {
	Key      string
	HighRisk bool
}

var factIntentRules = []struct {
	pattern *regexp.Regexp
	intent  factIntent
}{
	{regexp.MustCompile(`你.*(叫什么|名字|称呼)`), factIntent{Key: "display_name"}},
	{regexp.MustCompile(`(哪所学校|哪个学校|毕业于|就读于|学校)`), factIntent{Key: "school"}},
	{regexp.MustCompile(`(学历|本科|硕士|博士)`), factIntent{Key: "education"}},
	{regexp.MustCompile(`(工作|职业|做什么)`), factIntent{Key: "job"}},
	{regexp.MustCompile(`(收入|年薪|工资|赚)`), factIntent{Key: "income"}},
	{regexp.MustCompile(`(在哪个城市|哪里人|哪个城市|哪个地方)`), factIntent{Key: "city"}},
	{regexp.MustCompile(`(住在哪|住哪里|地址|电话|手机号|微信|身份证|银行卡)`), factIntent{Key: "contact", HighRisk: true}},
	{regexp.MustCompile(`(什么比赛|比赛叫什么|参加过什么比赛|活动叫什么)`), factIntent{Key: "event_name"}},
}

func BuildRetrievalPlan(message string, history []ChatMessageForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI) RetrievalPlan {
	query := buildContextQuery(message, history)
	selectedFacts, factScore := selectFacts(query, facts)
	selectedTopics, topicScore := selectTopics(query, topics)
	selectedEntries, entryScore := selectEntriesWithScores(query, entries)
	confidence := "low"
	switch {
	case factScore >= 8 || topicScore >= 10 || entryScore >= 10:
		confidence = "high"
	case factScore >= 4 || topicScore >= 5 || entryScore >= 5:
		confidence = "medium"
	}
	reasons := make([]string, 0, len(selectedFacts)+len(selectedTopics)+len(selectedEntries))
	for _, fact := range selectedFacts {
		reasons = append(reasons, "fact:"+fact.FactKey)
	}
	for _, topic := range selectedTopics {
		reasons = append(reasons, "topic:"+topic.TopicKey)
	}
	for _, entry := range selectedEntries {
		reasons = append(reasons, "knowledge:"+entry.Title)
	}
	return RetrievalPlan{
		Facts:      selectedFacts,
		Topics:     selectedTopics,
		Entries:    selectedEntries,
		Confidence: confidence,
		Reasons:    reasons,
	}
}

func ResolveGroundedFactReply(profile ProfileForAI, facts []StructuredFactForAI, message string) (string, []map[string]string, bool) {
	intent, ok := detectFactIntent(message)
	if !ok {
		return "", nil, false
	}
	if intent.HighRisk {
		return "这种具体到门牌号真名啥的我不接招啊，咱聊点别的。", nil, true
	}
	matched := factsForKey(intent.Key, facts)
	if len(matched) == 0 && intent.Key == "city" {
		matched = append(matched, factsForKey("province", facts)...)
	}
	if len(matched) == 0 {
		if intent.Key == "display_name" && profile.DisplayName != "" {
			return "我是" + profile.DisplayName + "。", []map[string]string{{"sourceType": "profile", "factKey": "display_name", "title": "名字", "excerpt": profile.DisplayName}}, true
		}
		return "这题我一时答不上来，脑子有点糊，你换种问法或者先说你想干啥。", nil, true
	}
	reply := buildFactReply(intent.Key, matched)
	refs := make([]map[string]string, 0, len(matched))
	for _, fact := range matched {
		refs = append(refs, map[string]string{
			"id":         fact.ID,
			"sourceType": "fact",
			"factKey":    fact.FactKey,
			"title":      factLabel(fact.FactKey),
			"excerpt":    fact.FactValue,
			"confidence": fact.Confidence,
		})
	}
	return reply, refs, true
}

func ApplyClaimGuard(message, content string, facts []StructuredFactForAI, plan RetrievalPlan) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return content
	}
	if plan.Confidence == "low" && looksLikeFactualQuestion(message) {
		return "哎哟你这问得我有点接不住，就先聊到这儿吧，你心里大概有数就行。"
	}
	if intent, ok := detectFactIntent(message); ok {
		matched := factsForKey(intent.Key, facts)
		if len(matched) > 0 {
			expected := matched[0].FactValue
			if intent.Key != "event_name" && !strings.Contains(content, expected) {
				return buildFactReply(intent.Key, matched)
			}
		}
	}
	return content
}

func BuildRetrievalReferences(plan RetrievalPlan) []map[string]string {
	refs := make([]map[string]string, 0, len(plan.Facts)+len(plan.Topics)+len(plan.Entries))
	for _, fact := range plan.Facts {
		refs = append(refs, map[string]string{
			"id":         fact.ID,
			"sourceType": "fact",
			"factKey":    fact.FactKey,
			"title":      factLabel(fact.FactKey),
			"excerpt":    fact.FactValue,
			"confidence": fact.Confidence,
		})
	}
	for _, topic := range plan.Topics {
		excerpt := normalizeSnippet(firstSentence(topic.Summary, 80))
		if excerpt == "" {
			excerpt = "基于该主题经验生成的摘要。"
		}
		refs = append(refs, map[string]string{
			"id":         topic.ID,
			"sourceType": "topic",
			"topicGroup": topic.TopicGroup,
			"topicKey":   topic.TopicKey,
			"title":      topic.TopicLabel,
			"excerpt":    excerpt,
			"confidence": topic.Confidence,
		})
	}
	for _, entry := range plan.Entries {
		excerpt := normalizeSnippet(firstSentence(entry.Content, 80))
		if excerpt == "" {
			excerpt = "基于已有经历给到的一条可执行建议。"
		}
		refs = append(refs, map[string]string{
			"id":         entry.ID,
			"sourceType": "knowledge",
			"category":   entry.Category,
			"title":      entry.Title,
			"excerpt":    excerpt,
			"confidence": plan.Confidence,
		})
	}
	return refs
}

func selectTopics(query string, topics []TopicSummaryForAI) ([]TopicSummaryForAI, int) {
	ranked := make([]struct {
		topic TopicSummaryForAI
		score int
	}, 0, len(topics))
	best := 0
	for _, topic := range topics {
		score := scoreTopic(query, topic)
		if score <= 0 {
			continue
		}
		if score > best {
			best = score
		}
		ranked = append(ranked, struct {
			topic TopicSummaryForAI
			score int
		}{topic: topic, score: score})
	}
	for i := 0; i < len(ranked)-1; i++ {
		for j := i + 1; j < len(ranked); j++ {
			if ranked[j].score > ranked[i].score {
				ranked[i], ranked[j] = ranked[j], ranked[i]
			}
		}
	}
	selected := make([]TopicSummaryForAI, 0, 3)
	for _, item := range ranked {
		if len(selected) >= 3 {
			break
		}
		if best > 0 && len(selected) > 0 && item.score < best/2 {
			break
		}
		selected = append(selected, item.topic)
	}
	return selected, best
}

func selectFacts(query string, facts []StructuredFactForAI) ([]StructuredFactForAI, int) {
	ranked := make([]rankedFact, 0, len(facts))
	best := 0
	for _, fact := range facts {
		score := scoreFact(query, fact)
		if score <= 0 {
			continue
		}
		if score > best {
			best = score
		}
		ranked = append(ranked, rankedFact{fact: fact, score: score})
	}
	sortRankedFacts(ranked)
	selected := make([]StructuredFactForAI, 0, 4)
	for _, item := range ranked {
		if len(selected) >= 4 {
			break
		}
		if best > 0 && item.score < best/2 {
			break
		}
		selected = append(selected, item.fact)
	}
	return selected, best
}

func selectEntriesWithScores(query string, entries []KnowledgeEntryForAI) ([]KnowledgeEntryForAI, int) {
	ranked := make([]struct {
		entry KnowledgeEntryForAI
		score int
	}, len(entries))
	best := 0
	for i, e := range entries {
		score := scoreEntry(query, e)
		if score > best {
			best = score
		}
		ranked[i] = struct {
			entry KnowledgeEntryForAI
			score int
		}{e, score}
	}
	for i := 0; i < len(ranked)-1; i++ {
		for j := i + 1; j < len(ranked); j++ {
			if ranked[j].score > ranked[i].score {
				ranked[i], ranked[j] = ranked[j], ranked[i]
			}
		}
	}
	var top []KnowledgeEntryForAI
	for _, r := range ranked {
		if r.score <= 0 {
			continue
		}
		top = append(top, r.entry)
		if len(top) >= 4 {
			break
		}
		if len(top) >= 3 && best > 0 && r.score < best/2 {
			break
		}
	}
	// 若关键词完全未命中，仍注入若干条知识库原文，避免模型在「零上下文」下编造长篇人生故事
	if len(top) == 0 && len(entries) > 0 {
		maxFallback := 8
		if len(entries) < maxFallback {
			maxFallback = len(entries)
		}
		for i := 0; i < maxFallback; i++ {
			top = append(top, entries[i])
		}
		if best <= 0 {
			best = 1 // 标记为弱相关，配合系统提示要求紧扣条目
		}
	}
	return top, best
}

func detectFactIntent(message string) (factIntent, bool) {
	msg := strings.TrimSpace(message)
	for _, rule := range factIntentRules {
		if rule.pattern.MatchString(msg) {
			return rule.intent, true
		}
	}
	return factIntent{}, false
}

func looksLikeFactualQuestion(message string) bool {
	_, ok := detectFactIntent(message)
	return ok || isHighRiskFactQuestion(message)
}

func factsForKey(key string, facts []StructuredFactForAI) []StructuredFactForAI {
	var out []StructuredFactForAI
	for _, fact := range facts {
		if fact.FactKey == key {
			out = append(out, fact)
		}
	}
	return out
}

func buildFactReply(key string, facts []StructuredFactForAI) string {
	values := make([]string, 0, len(facts))
	seen := map[string]bool{}
	for _, fact := range facts {
		value := strings.TrimSpace(fact.FactValue)
		if value == "" || seen[value] {
			continue
		}
		seen[value] = true
		values = append(values, value)
	}
	if len(values) == 0 {
		return "这个我记混了，不敢瞎扯，咱跳过这茬吧。"
	}
	switch key {
	case "display_name":
		return "我是" + values[0] + "。"
	case "school":
		return "学校那块写的是" + values[0] + "。"
	case "education":
		return "我的学历是" + values[0] + "。"
	case "job":
		return "我现在主要做" + values[0] + "。"
	case "income":
		return "数字大概是" + values[0] + "吧。"
	case "city":
		return "地方算是" + values[0] + "那边。"
	case "event_name":
		return "我能确认的有：" + strings.Join(values, "、") + "。"
	default:
		return values[0]
	}
}

func factLabel(key string) string {
	switch key {
	case "display_name":
		return "名字"
	case "school":
		return "学校"
	case "education":
		return "学历"
	case "job":
		return "工作"
	case "income":
		return "收入"
	case "city":
		return "城市"
	case "event_name":
		return "事件"
	default:
		return key
	}
}

func scoreFact(message string, fact StructuredFactForAI) int {
	normMsg := normalize(message)
	score := 0
	if strings.Contains(normMsg, normalize(fact.FactValue)) {
		score += 8
	}
	if strings.Contains(normMsg, normalize(factLabel(fact.FactKey))) {
		score += 6
	}
	for _, alias := range factAliases(fact.FactKey) {
		if strings.Contains(normMsg, alias) {
			score += 5
		}
	}
	for _, tok := range tokenize(message) {
		if strings.Contains(normalize(fact.FactValue), tok) {
			score += 3
		}
	}
	if fact.Status == "confirmed" {
		score += 1
	}
	return score
}

func scoreTopic(message string, topic TopicSummaryForAI) int {
	normMsg := normalize(message)
	score := 0
	if strings.Contains(normMsg, normalize(topic.TopicLabel)) {
		score += 7
	}
	if strings.Contains(normMsg, normalize(topic.TopicKey)) {
		score += 5
	}
	for _, alias := range topic.Aliases {
		if strings.Contains(normMsg, normalize(alias)) {
			score += 6
		}
	}
	for _, pattern := range topic.QuestionPatterns {
		if strings.Contains(normMsg, normalize(pattern)) {
			score += 6
		}
	}
	for _, tok := range tokenize(message) {
		if strings.Contains(normalize(topic.Summary), tok) {
			score += 2
		}
	}
	if topic.Status == "active" {
		score += 1
	}
	if topic.Confidence == "high" {
		score += 1
	}
	return score
}

func factAliases(key string) []string {
	switch key {
	case "display_name":
		return []string{"名字", "叫啥", "称呼"}
	case "school":
		return []string{"学校", "毕业", "就读"}
	case "education":
		return []string{"学历", "本科", "硕士", "博士"}
	case "job":
		return []string{"工作", "职业", "做什么"}
	case "income":
		return []string{"收入", "工资", "年薪"}
	case "city":
		return []string{"城市", "哪里人", "地方"}
	case "event_name":
		return []string{"比赛", "活动", "项目"}
	default:
		return nil
	}
}

func sortRankedFacts(items []rankedFact) {
	for i := 0; i < len(items)-1; i++ {
		for j := i + 1; j < len(items); j++ {
			if items[j].score > items[i].score {
				items[i], items[j] = items[j], items[i]
			}
		}
	}
}

func BuildFactsPromptSection(facts []StructuredFactForAI) string {
	if len(facts) == 0 {
		return "暂无高置信结构化事实。"
	}
	lines := make([]string, 0, len(facts))
	for _, fact := range facts {
		lines = append(lines, fmt.Sprintf("- %s: %s（%s/%s）", factLabel(fact.FactKey), fact.FactValue, fact.Status, fact.Confidence))
	}
	return strings.Join(lines, "\n")
}

func BuildTopicsPromptSection(topics []TopicSummaryForAI) string {
	if len(topics) == 0 {
		return "暂无高相关 topic 摘要。"
	}
	lines := make([]string, 0, len(topics))
	for i, topic := range topics {
		lines = append(lines, fmt.Sprintf("[%d] %s（%s/%s）\n%s", i+1, topic.TopicLabel, topic.TopicGroup, topic.Confidence, topic.Summary))
	}
	return strings.Join(lines, "\n\n")
}
