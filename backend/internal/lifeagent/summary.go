package lifeagent

import (
	"context"
	"encoding/json"
	"log"
	"regexp"
	"strings"
	"time"

	openai "github.com/sashabaranov/go-openai"
)

// ChatOptions holds optional memory context for LLM chat.
type ChatOptions struct {
	SessionSummary       string            // compressed summary of earlier messages in this session
	CrossSessionMemory   string            // summaries from buyer's previous sessions with this agent
	AgentSelfConsistency string            // agent's own self-stated biographical facts across sessions (anti-contradiction anchor)
	LiveUpdates          []LiveUpdateForAI // recent live updates from creator
	RecentlyUsedEntryIDs []string          // entry IDs cited in recent replies (for de-duplication)
	KnowledgeContext     string            // facts/topics/entry hints injected right before user message for recency attention
	FeedbackSignals      *FeedbackSignals  // per-topic/entry feedback from users for retrieval reranking + prompt adaptation

	// —— CoALA 四层记忆架构新增字段 ——
	// WorkingState：已经由 handler 完成感知/检索/策略推理的工作记忆；存在则 llm.go 直接消费，
	// 不再在生成阶段重复做意图分类 / 情绪检测 / randomLengthHint。
	WorkingState *WorkingState
	// Embedder：RAG 用；为 nil 时向量路径自动降级为词法。
	Embedder Embedder
	// Episodes：情景回忆候选（已按 buyer_only 过滤）；由 BuildEpisodeHits 做 hybrid 排序。
	Episodes []EpisodeCandidate
	// TurnIndex：会话内第几轮，感知轨迹落库时写入。
	TurnIndex int
}

// EpisodeCandidate 从 DB 读出来、准备参加情景层召回的候选；已做 buyer_only 过滤。
type EpisodeCandidate struct {
	ID         string
	Kind       string
	Title      string
	Situation  string
	UserState  string
	AgentMove  string
	Outcome    string
	Lesson     string
	TopicKeys  []string
	OccurredAt time.Time
	Embedding  []float32
}

// FeedbackSignals 聚合的用户反馈信号，用于 Feedback-Aware Retrieval 和 Adaptive Prompt。
// 学术依据: Relevance Feedback (Rocchio, 1971) — 正向反馈加权、负向反馈降权。
type FeedbackSignals struct {
	TopicStats map[string]FeedbackStat // topicID → 反馈统计
	EntryStats map[string]FeedbackStat // entryID → 反馈统计
}

// FeedbackStat 单个 Topic 或 Entry 的聚合反馈计数。
type FeedbackStat struct {
	Helpful      int
	NotSpecific  int
	FactualError int
	Contradiction int
	TooConfident int
}

// HasNegativeSignals 是否存在显著的负面反馈
func (s FeedbackStat) HasNegativeSignals() bool {
	return s.FactualError > 0 || s.Contradiction > 0 || s.NotSpecific >= 3
}

// DominantIssue 返回最突出的负面反馈类型
func (s FeedbackStat) DominantIssue() string {
	if s.FactualError >= s.NotSpecific && s.FactualError >= s.Contradiction {
		if s.FactualError > 0 {
			return "factual_error"
		}
	}
	if s.NotSpecific >= s.FactualError && s.NotSpecific >= s.Contradiction {
		if s.NotSpecific > 0 {
			return "not_specific"
		}
	}
	if s.Contradiction > 0 {
		return "contradiction"
	}
	if s.TooConfident > 0 {
		return "too_confident"
	}
	return ""
}

type ConversationMemory struct {
	SummaryText          string          `json:"summaryText"`
	UserStatedFacts      []FactCandidate `json:"userStatedFacts,omitempty"`
	UserPreferences      []string        `json:"userPreferences,omitempty"`
	ConversationTopics   []string        `json:"conversationTopics,omitempty"`
	AssistantSuggestions []string        `json:"assistantSuggestions,omitempty"`
	// AgentSelfFacts：Agent 本轮对话里关于"自己"陈述过的生平/身份事实（现状、年级、年份、工作等），
	// 用于跨会话自我一致性约束，避免一次说毕业一次说研一。
	AgentSelfFacts []FactCandidate `json:"agentSelfFacts,omitempty"`
}

// SummarizeConversation 兼容旧调用，只返回摘要文本。
func SummarizeConversation(ctx context.Context, apiKey, model, baseURL string, messages []ChatMessageForAI) string {
	return SummarizeConversationMemory(ctx, apiKey, model, baseURL, messages).SummaryText
}

// SummarizeConversationMemory 生成结构化记忆，避免把自由摘要直接当作长期事实。
func SummarizeConversationMemory(ctx context.Context, apiKey, model, baseURL string, messages []ChatMessageForAI) ConversationMemory {
	if !isLLMEnabled(apiKey, model, baseURL) || len(messages) == 0 {
		return fallbackConversationMemory(messages)
	}
	apiKey = resolveAPIKey(apiKey, baseURL)
	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	var sb strings.Builder
	for _, m := range messages {
		if m.Role == "user" {
			sb.WriteString("用户: ")
		} else {
			sb.WriteString("你: ")
		}
		// truncate very long messages to save tokens
		content := m.Content
		if len([]rune(content)) > 300 {
			content = string([]rune(content)[:300]) + "..."
		}
		sb.WriteString(content)
		sb.WriteString("\n")
	}

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role: openai.ChatMessageRoleSystem,
				Content: `你要把对话整理成结构化记忆，必须输出严格 JSON，不要 markdown。
{
  "summaryText": "100-180字的客观摘要",
  "userStatedFacts": [
    {
      "factKey": "fact_key",
      "factValue": "用户明确说过的事实",
      "factType": "narrative_fact",
      "source": "session_summary",
      "confidence": "medium",
      "status": "pending_review"
    }
  ],
  "userPreferences": ["用户明确表达的偏好"],
  "conversationTopics": ["本次聊到的话题"],
  "assistantSuggestions": ["你给过的关键建议"],
  "agentSelfFacts": [
    {
      "factKey": "life_stage",
      "factValue": "助手在本次对话里关于自己说过的生平/身份事实（如现在研一、已毕业、23年入学、在某公司工作、所在城市等）",
      "factType": "agent_self_fact",
      "source": "agent_statement",
      "confidence": "medium",
      "status": "stated"
    }
  ]
}
规则：
1. 只有用户明确说过的事实，才能写入 userStatedFacts。
2. 没被用户明确说过的，不要脑补成事实。
3. userStatedFacts 默认 status 为 pending_review。
4. summaryText 用第三人称客观描述，不要编号。
5. agentSelfFacts 只记录"助手（你扮演的人）"在本次对话里明确说出来的、关于自己的稳定生平事实：当前人生阶段（研几/是否毕业）、入学或毕业年份、现在的工作/单位、所在城市、学校。助手没明说的不要写。常用 factKey：life_stage、enroll_year、graduate_year、current_job、city、school。`,
			},
			{Role: openai.ChatMessageRoleUser, Content: sb.String()},
		},
		Temperature:         safeTemperature(model, 0.2),
		MaxCompletionTokens: 500,
	})
	if err != nil || len(resp.Choices) == 0 {
		log.Printf("[Summary] failed: %v", err)
		return fallbackConversationMemory(messages)
	}
	raw := extractMemoryJSON(strings.TrimSpace(resp.Choices[0].Message.Content))
	var memory ConversationMemory
	if err := json.Unmarshal([]byte(raw), &memory); err != nil {
		log.Printf("[Summary] parse failed: %v", err)
		return fallbackConversationMemory(messages)
	}
	return normalizeConversationMemory(memory, messages)
}

// BuildCrossSessionMemory 只拼接相对安全的话题/偏好，以及已经确认的事实。
// 增强：按时间倒序排列（最新在前），并做事实去重/矛盾标注。
func BuildCrossSessionMemory(memories []ConversationMemory) string {
	var parts []string
	// memories 已按 updated_at DESC 排列（handler 端保证）
	for i, memory := range memories {
		recency := "最近"
		if i == 1 {
			recency = "上次"
		} else if i >= 2 {
			recency = "更早"
		}
		section := buildMemorySection(memory)
		if section != "" {
			parts = append(parts, "（"+recency+"）"+section)
		}
	}
	if len(parts) == 0 {
		return ""
	}

	// 事实矛盾检测：如果同一个 factKey 在不同会话中有不同的值，标注以最新为准
	contradictions := detectMemoryContradictions(memories)
	result := strings.Join(parts, "\n---\n")
	if len(contradictions) > 0 {
		result += "\n\n注意：" + strings.Join(contradictions, "；") + "。以最近一次说的为准。"
	}
	return result
}

// detectMemoryContradictions 检测跨会话事实矛盾
func detectMemoryContradictions(memories []ConversationMemory) []string {
	// factKey → 按时间从新到旧排列的值列表
	factValues := make(map[string][]string)
	for _, m := range memories {
		for _, f := range m.UserStatedFacts {
			if f.FactValue != "" {
				factValues[f.FactKey] = append(factValues[f.FactKey], f.FactValue)
			}
		}
	}
	var warnings []string
	for key, values := range factValues {
		if len(values) < 2 {
			continue
		}
		// 检查是否有不一致
		first := values[0]
		for _, v := range values[1:] {
			if v != first {
				label := factLabel(key)
				if label == key {
					label = "关于「" + key + "」"
				}
				warnings = append(warnings, label+"用户之前说过「"+v+"」但最近改口说「"+first+"」")
				break
			}
		}
	}
	return warnings
}

// BuildCrossSessionMemoryForQuery 选择性注入：只返回与当前查询相关的记忆片段
func BuildCrossSessionMemoryForQuery(memories []ConversationMemory, query string) string {
	if query == "" {
		return BuildCrossSessionMemory(memories)
	}

	queryNorm := strings.ToLower(query)
	var relevant []ConversationMemory
	for _, m := range memories {
		score := 0
		for _, topic := range m.ConversationTopics {
			if strings.Contains(queryNorm, strings.ToLower(topic)) || strings.Contains(strings.ToLower(topic), queryNorm) {
				score += 3
			}
		}
		for _, pref := range m.UserPreferences {
			if strings.Contains(queryNorm, strings.ToLower(pref)) {
				score += 2
			}
		}
		for _, f := range m.UserStatedFacts {
			if strings.Contains(queryNorm, strings.ToLower(f.FactValue)) {
				score += 2
			}
		}
		// summaryText 粗糙匹配
		words := strings.Fields(queryNorm)
		for _, w := range words {
			if len([]rune(w)) >= 2 && strings.Contains(strings.ToLower(m.SummaryText), w) {
				score++
			}
		}
		if score > 0 {
			relevant = append(relevant, m)
		}
	}

	// 如果没有相关的，回退到全量（至少保留最新一条）
	if len(relevant) == 0 && len(memories) > 0 {
		relevant = memories[:1]
	}
	return BuildCrossSessionMemory(relevant)
}

func ConversationMemoryFromMap(data map[string]interface{}) ConversationMemory {
	if len(data) == 0 {
		return ConversationMemory{}
	}
	raw, err := json.Marshal(data)
	if err != nil {
		return ConversationMemory{}
	}
	var memory ConversationMemory
	if err := json.Unmarshal(raw, &memory); err != nil {
		return ConversationMemory{}
	}
	return memory
}

func fallbackConversationMemory(messages []ChatMessageForAI) ConversationMemory {
	memory := ConversationMemory{
		UserPreferences:      []string{},
		ConversationTopics:   []string{},
		AssistantSuggestions: []string{},
	}
	var topics []string
	var suggestions []string
	for _, message := range messages {
		if message.Role == "user" {
			topics = append(topics, firstSentence(message.Content, 24))
		} else {
			suggestions = append(suggestions, firstSentence(message.Content, 24))
		}
	}
	memory.ConversationTopics = uniqueStrings(topics, 4)
	memory.AssistantSuggestions = uniqueStrings(suggestions, 3)
	if len(memory.ConversationTopics) > 0 {
		memory.SummaryText = "用户最近主要聊了：" + strings.Join(memory.ConversationTopics, "、") + "。"
	}
	return memory
}

func normalizeConversationMemory(memory ConversationMemory, messages []ChatMessageForAI) ConversationMemory {
	if strings.TrimSpace(memory.SummaryText) == "" {
		memory.SummaryText = fallbackConversationMemory(messages).SummaryText
	}
	if len(memory.ConversationTopics) == 0 {
		memory.ConversationTopics = fallbackConversationMemory(messages).ConversationTopics
	}
	memory.UserPreferences = uniqueStrings(memory.UserPreferences, 4)
	memory.ConversationTopics = uniqueStrings(memory.ConversationTopics, 4)
	memory.AssistantSuggestions = uniqueStrings(memory.AssistantSuggestions, 4)
	memory.UserStatedFacts = dedupeFactCandidates(memory.UserStatedFacts)
	for i := range memory.UserStatedFacts {
		if memory.UserStatedFacts[i].FactType == "" {
			memory.UserStatedFacts[i].FactType = "narrative_fact"
		}
		if memory.UserStatedFacts[i].Source == "" {
			memory.UserStatedFacts[i].Source = "session_summary"
		}
		if memory.UserStatedFacts[i].Confidence == "" {
			memory.UserStatedFacts[i].Confidence = "medium"
		}
		if memory.UserStatedFacts[i].Status == "" {
			memory.UserStatedFacts[i].Status = "pending_review"
		}
	}
	memory.AgentSelfFacts = dedupeFactCandidates(memory.AgentSelfFacts)
	for i := range memory.AgentSelfFacts {
		if memory.AgentSelfFacts[i].FactType == "" {
			memory.AgentSelfFacts[i].FactType = "agent_self_fact"
		}
		if memory.AgentSelfFacts[i].Source == "" {
			memory.AgentSelfFacts[i].Source = "agent_statement"
		}
		if memory.AgentSelfFacts[i].Confidence == "" {
			memory.AgentSelfFacts[i].Confidence = "medium"
		}
		if memory.AgentSelfFacts[i].Status == "" {
			memory.AgentSelfFacts[i].Status = "stated"
		}
	}
	return memory
}

// BuildAgentSelfConsistencyAnchor 汇总 Agent 在过往会话里关于"自己"说过的生平事实，
// 形成一条强一致性约束注入到 system prompt，避免跨会话自我矛盾（如一次说毕业、一次说研一）。
// memories 已按 updated_at DESC 排列（最新在前），同一 factKey 以最新一次为准。
func BuildAgentSelfConsistencyAnchor(memories []ConversationMemory) string {
	if len(memories) == 0 {
		return ""
	}
	latest := make(map[string]string)
	order := make([]string, 0)
	for _, m := range memories {
		for _, f := range m.AgentSelfFacts {
			key := strings.TrimSpace(f.FactKey)
			val := strings.TrimSpace(f.FactValue)
			if key == "" || val == "" {
				continue
			}
			if _, seen := latest[key]; seen {
				continue // 最新在前，已记录的就是最新值
			}
			latest[key] = val
			order = append(order, key)
		}
	}
	if len(order) == 0 {
		return ""
	}
	parts := make([]string, 0, len(order))
	for _, key := range order {
		parts = append(parts, latest[key])
	}
	var sb strings.Builder
	sb.WriteString("你在之前的对话里已经说过自己：")
	sb.WriteString(strings.Join(parts, "；"))
	sb.WriteString("。这一轮必须与上面保持完全一致，绝不能改口（比如之前说在读就不能改成已毕业，年级和年份也不能变）。如果这次的问题涉及上面没提到的生平细节，宁可模糊带过也不要现编一个新版本。")
	return sb.String()
}

func buildMemorySection(memory ConversationMemory) string {
	var lines []string
	if len(memory.ConversationTopics) > 0 {
		lines = append(lines, "话题："+strings.Join(memory.ConversationTopics, "、"))
	}
	if len(memory.UserPreferences) > 0 {
		lines = append(lines, "偏好："+strings.Join(memory.UserPreferences, "、"))
	}
	var confirmedFacts []string
	for _, fact := range memory.UserStatedFacts {
		if fact.Status == "confirmed" {
			confirmedFacts = append(confirmedFacts, fact.FactValue)
		}
	}
	if len(confirmedFacts) > 0 {
		lines = append(lines, "已确认事实："+strings.Join(confirmedFacts, "、"))
	}
	return strings.Join(lines, "\n")
}

func extractMemoryJSON(s string) string {
	if m := memoryJSONBlockRe.FindStringSubmatch(s); len(m) >= 2 {
		return strings.TrimSpace(m[1])
	}
	start := strings.Index(s, "{")
	if start < 0 {
		return "{}"
	}
	depth := 0
	for i := start; i < len(s); i++ {
		switch s[i] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return s[start : i+1]
			}
		}
	}
	return s[start:]
}

func uniqueStrings(items []string, max int) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(items))
	for _, item := range items {
		item = strings.TrimSpace(item)
		if item == "" || seen[item] {
			continue
		}
		seen[item] = true
		out = append(out, item)
		if max > 0 && len(out) >= max {
			break
		}
	}
	return out
}

var memoryJSONBlockRe = regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)```")
