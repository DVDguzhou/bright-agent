package lifeagent

import (
	"fmt"
	"regexp"
	"strings"
)

type RetrievalRoute string

const (
	RetrievalRouteFact    RetrievalRoute = "fact"
	RetrievalRouteTopic   RetrievalRoute = "topic"
	RetrievalRouteEntry   RetrievalRoute = "entry"
	RetrievalRouteGeneral RetrievalRoute = "general"
)

type RetrievalPlan struct {
	Query      string
	Route      RetrievalRoute
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

type rankedTopic struct {
	topic TopicSummaryForAI
	score int
}

type rankedEntry struct {
	entry KnowledgeEntryForAI
	score int
}

type factIntent struct {
	Key      string
	HighRisk bool
}

type retrievalRouteConfig struct {
	factLimit          int
	topicLimit         int
	entryLimit         int
	factMinScore       int
	topicMinScore      int
	entryMinScore      int
	scoreRelativeFloor float64
	allowEntryFallback bool
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
	return buildRetrievalPlan(message, history, facts, topics, entries, true)
}

// BuildRetrievalPlanStrict 仅保留关键词真正命中的知识条目，不注入「前 N 条」兜底，用于双阶段流程里判断是否要知识库仲裁。
func BuildRetrievalPlanStrict(message string, history []ChatMessageForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI) RetrievalPlan {
	return buildRetrievalPlan(message, history, facts, topics, entries, false)
}

func buildRetrievalPlan(message string, history []ChatMessageForAI, facts []StructuredFactForAI, topics []TopicSummaryForAI, entries []KnowledgeEntryForAI, entryFallback bool) RetrievalPlan {
	query := buildContextQuery(message, history)
	route := classifyRetrievalRoute(message)
	intent, hasIntent := detectFactIntent(message)
	cfg := retrievalConfigForRoute(route, entryFallback)
	var intentPtr *factIntent
	if hasIntent {
		intentPtr = &intent
	}

	selectedFacts, factScore := selectFacts(query, facts, route, intentPtr, cfg)
	selectedTopics, topicScore := selectTopics(query, topics, route, cfg)
	selectedEntries, entryScore := selectEntriesWithScores(query, entries, selectedTopics, route, cfg)
	confidence := deriveRetrievalConfidence(route, factScore, topicScore, entryScore)
	reasons := make([]string, 0, len(selectedFacts)+len(selectedTopics)+len(selectedEntries)+1)
	reasons = append(reasons, "route:"+string(route))
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
		Query:      query,
		Route:      route,
		Facts:      selectedFacts,
		Topics:     selectedTopics,
		Entries:    selectedEntries,
		Confidence: confidence,
		Reasons:    reasons,
	}
}

// PlanHasArbitrationTargets 是否有可用于与用户草稿对齐的结构化事实 / topic / 知识条目（严格检索下非空）。
func PlanHasArbitrationTargets(p RetrievalPlan) bool {
	return len(p.Facts) > 0 || len(p.Topics) > 0 || len(p.Entries) > 0
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
			"route":      string(plan.Route),
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
			"route":      string(plan.Route),
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
			"route":      string(plan.Route),
			"category":   entry.Category,
			"title":      entry.Title,
			"excerpt":    excerpt,
			"confidence": plan.Confidence,
		})
	}
	return refs
}

func retrievalConfigForRoute(route RetrievalRoute, allowEntryFallback bool) retrievalRouteConfig {
	switch route {
	case RetrievalRouteFact:
		return retrievalRouteConfig{
			factLimit:          4,
			topicLimit:         1,
			entryLimit:         0,
			factMinScore:       4,
			topicMinScore:      8,
			entryMinScore:      99,
			scoreRelativeFloor: 0.6,
		}
	case RetrievalRouteTopic:
		return retrievalRouteConfig{
			factLimit:          2,
			topicLimit:         3,
			entryLimit:         2,
			factMinScore:       5,
			topicMinScore:      4,
			entryMinScore:      4,
			scoreRelativeFloor: 0.45,
		}
	case RetrievalRouteEntry:
		return retrievalRouteConfig{
			factLimit:          1,
			topicLimit:         2,
			entryLimit:         4,
			factMinScore:       5,
			topicMinScore:      4,
			entryMinScore:      4,
			scoreRelativeFloor: 0.4,
		}
	default:
		return retrievalRouteConfig{
			factLimit:          2,
			topicLimit:         3,
			entryLimit:         3,
			factMinScore:       4,
			topicMinScore:      4,
			entryMinScore:      4,
			scoreRelativeFloor: 0.5,
			allowEntryFallback: allowEntryFallback,
		}
	}
}

func classifyRetrievalRoute(message string) RetrievalRoute {
	if looksLikeFactualQuestion(message) {
		return RetrievalRouteFact
	}
	norm := normalize(message)
	if containsAnyNormalized(norm, []string{
		"具体", "细节", "案例", "例子", "原话", "复盘", "项目", "比赛", "面试", "简历", "offer", "当时",
	}) {
		return RetrievalRouteEntry
	}
	if containsAnyNormalized(norm, []string{
		"经历", "经验", "怎么办", "怎么选", "如何", "建议", "要不要", "值不值", "规划", "路径", "踩坑",
		"转行", "求职", "秋招", "春招", "实习", "考研", "留学", "职场", "焦虑", "迷茫",
	}) {
		return RetrievalRouteTopic
	}
	return RetrievalRouteGeneral
}

func deriveRetrievalConfidence(route RetrievalRoute, factScore, topicScore, entryScore int) string {
	switch route {
	case RetrievalRouteFact:
		switch {
		case factScore >= 12:
			return "high"
		case factScore >= 6:
			return "medium"
		default:
			return "low"
		}
	case RetrievalRouteEntry:
		switch {
		case entryScore >= 12 || topicScore >= 10:
			return "high"
		case entryScore >= 6 || topicScore >= 5:
			return "medium"
		default:
			return "low"
		}
	default:
		switch {
		case factScore >= 10 || topicScore >= 10 || entryScore >= 10:
			return "high"
		case factScore >= 5 || topicScore >= 5 || entryScore >= 5:
			return "medium"
		default:
			return "low"
		}
	}
}

func containsAnyNormalized(norm string, terms []string) bool {
	for _, term := range terms {
		if strings.Contains(norm, normalize(term)) {
			return true
		}
	}
	return false
}

func scoreCutoff(best int, minScore int, relativeFloor float64) int {
	if best <= 0 {
		return minScore
	}
	cutoff := int(float64(best) * relativeFloor)
	if cutoff < minScore {
		return minScore
	}
	return cutoff
}

func selectTopics(query string, topics []TopicSummaryForAI, route RetrievalRoute, cfg retrievalRouteConfig) ([]TopicSummaryForAI, int) {
	if cfg.topicLimit <= 0 {
		return nil, 0
	}
	ranked := make([]rankedTopic, 0, len(topics))
	best := 0
	for _, topic := range topics {
		score := scoreTopic(query, topic, route)
		if score <= 0 {
			continue
		}
		if score > best {
			best = score
		}
		ranked = append(ranked, rankedTopic{topic: topic, score: score})
	}
	for i := 0; i < len(ranked)-1; i++ {
		for j := i + 1; j < len(ranked); j++ {
			if ranked[j].score > ranked[i].score {
				ranked[i], ranked[j] = ranked[j], ranked[i]
			}
		}
	}
	selected := make([]TopicSummaryForAI, 0, cfg.topicLimit)
	cutoff := scoreCutoff(best, cfg.topicMinScore, cfg.scoreRelativeFloor)
	for _, item := range ranked {
		if len(selected) >= cfg.topicLimit {
			break
		}
		if item.score < cutoff {
			break
		}
		selected = append(selected, item.topic)
	}
	return selected, best
}

func selectFacts(query string, facts []StructuredFactForAI, route RetrievalRoute, intent *factIntent, cfg retrievalRouteConfig) ([]StructuredFactForAI, int) {
	if cfg.factLimit <= 0 {
		return nil, 0
	}
	ranked := make([]rankedFact, 0, len(facts))
	best := 0
	for _, fact := range facts {
		score := scoreFact(query, fact, route, intent)
		if score <= 0 {
			continue
		}
		if score > best {
			best = score
		}
		ranked = append(ranked, rankedFact{fact: fact, score: score})
	}
	sortRankedFacts(ranked)
	selected := make([]StructuredFactForAI, 0, cfg.factLimit)
	cutoff := scoreCutoff(best, cfg.factMinScore, cfg.scoreRelativeFloor)
	for _, item := range ranked {
		if len(selected) >= cfg.factLimit {
			break
		}
		if item.score < cutoff {
			break
		}
		selected = append(selected, item.fact)
	}
	return selected, best
}

func selectEntriesWithScores(query string, entries []KnowledgeEntryForAI, selectedTopics []TopicSummaryForAI, route RetrievalRoute, cfg retrievalRouteConfig) ([]KnowledgeEntryForAI, int) {
	if cfg.entryLimit <= 0 {
		return nil, 0
	}
	ranked := make([]rankedEntry, len(entries))
	best := 0
	for i, e := range entries {
		score := scoreEntry(query, e, route, selectedTopics)
		if score > best {
			best = score
		}
		ranked[i] = rankedEntry{entry: e, score: score}
	}
	for i := 0; i < len(ranked)-1; i++ {
		for j := i + 1; j < len(ranked); j++ {
			if ranked[j].score > ranked[i].score {
				ranked[i], ranked[j] = ranked[j], ranked[i]
			}
		}
	}
	var top []KnowledgeEntryForAI
	cutoff := scoreCutoff(best, cfg.entryMinScore, cfg.scoreRelativeFloor)
	for _, r := range ranked {
		if r.score < cutoff {
			continue
		}
		top = append(top, r.entry)
		if len(top) >= cfg.entryLimit {
			break
		}
	}
	// 仅对低风险开放问答启用弱兜底，避免把不相关原文强塞给事实类问题。
	if cfg.allowEntryFallback && len(top) == 0 && len(entries) > 0 && shouldAllowEntryFallback(query, route) {
		maxFallback := 3
		if len(entries) < maxFallback {
			maxFallback = len(entries)
		}
		for i := 0; i < maxFallback; i++ {
			top = append(top, entries[i])
		}
		if best <= 0 {
			best = 1
		}
	}
	return top, best
}

func shouldAllowEntryFallback(query string, route RetrievalRoute) bool {
	if route != RetrievalRouteGeneral {
		return false
	}
	norm := normalize(query)
	return containsAnyNormalized(norm, []string{"怎么", "怎么办", "如何", "是不是", "最近", "想", "要不要", "值不值"})
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

func scoreFact(message string, fact StructuredFactForAI, route RetrievalRoute, intent *factIntent) int {
	normMsg := normalize(message)
	score := 0
	if intent != nil {
		switch {
		case fact.FactKey == intent.Key:
			score += 8
		case intent.Key == "city" && fact.FactKey == "province":
			score += 5
		case route == RetrievalRouteFact:
			return 0
		}
	}
	if strings.Contains(normMsg, normalize(fact.FactValue)) {
		score += 8
	}
	if strings.Contains(normMsg, normalize(factLabel(fact.FactKey))) {
		score += 6
	}
	for _, alias := range factAliases(fact.FactKey) {
		if strings.Contains(normMsg, normalize(alias)) {
			score += 5
		}
	}
	for _, tok := range tokenize(message) {
		if strings.Contains(normalize(fact.FactValue), tok) {
			score += 3
		}
	}
	if fact.Status == "confirmed" {
		score += 2
	}
	if fact.Confidence == "high" {
		score += 1
	}
	if route == RetrievalRouteFact {
		score += 1
	}
	return score
}

func scoreTopic(message string, topic TopicSummaryForAI, route RetrievalRoute) int {
	normMsg := normalize(message)
	score := 0
	if strings.Contains(normMsg, normalize(topic.TopicLabel)) {
		score += 8
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
			score += 7
		}
	}
	for _, tok := range tokenize(message) {
		if strings.Contains(normalize(topic.Summary), tok) || strings.Contains(normalize(topic.TopicLabel), tok) {
			score += 2
		}
	}
	if topic.Status == "active" {
		score += 2
	}
	if topic.Confidence == "high" {
		score += 2
	}
	if route == RetrievalRouteTopic {
		score += 2
	}
	if route == RetrievalRouteFact {
		score /= 2
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
