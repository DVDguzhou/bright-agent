package lifeagent

// episodic.go —— 情景记忆（Episodic Memory）。
//
// 目标：让同一个买家（buyer_id）跟同一个 Agent（profile_id）之间产生"能回忆起上次怎么聊过"
// 的关系感，而不是每次对话从零开始。这是「情绪陪伴」主旨的长期积累层。
//
// 职责：
//   A) 回忆加载：按 buyer_id + profile_id 过滤最近 N 条 episode，解码向量（buyer-only 隐私）；
//   B) 回忆打分：lexical + vector + freshness + outcome bias 四项融合，选 top 3；
//   C) 回忆巩固：一次会话里够"有感触"时，调用 LLM 反思，抽出 1-3 条 episode 写库。
//
// 严格遵守 buyer-only：
//   - 所有检索 SQL 都携带 profile_id AND buyer_id；
//   - PrivacyLevel 默认 buyer_only，不给跨买家聚合留口子；
//   - 回填向量时也按 profile_id+buyer_id 限定。

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
	openai "github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

// --- 候选加载 ---

// LoadEpisodeCandidates 严格 buyer-only 读取 profile × buyer 维度的 episode 列表。
// 会按 OccurredAt 降序取 limit 条（太老的情景不再进入召回，交给 freshness 衰减）。
func LoadEpisodeCandidates(gdb *gorm.DB, profileID, buyerID string, limit int) []EpisodeCandidate {
	if gdb == nil || profileID == "" || buyerID == "" {
		return nil
	}
	if limit <= 0 {
		limit = 40
	}
	var rows []models.LifeAgentEpisode
	gdb.Where("profile_id = ? AND buyer_id = ?", profileID, buyerID).
		Order("occurred_at DESC").
		Limit(limit).
		Find(&rows)
	out := make([]EpisodeCandidate, 0, len(rows))
	for _, r := range rows {
		lesson := ""
		if r.Lesson != nil {
			lesson = *r.Lesson
		}
		out = append(out, EpisodeCandidate{
			ID:         r.ID,
			Kind:       r.Kind,
			Title:      r.Title,
			Situation:  r.Situation,
			UserState:  r.UserState,
			AgentMove:  r.AgentMove,
			Outcome:    r.Outcome,
			Lesson:     lesson,
			TopicKeys:  []string(r.TopicKeys),
			OccurredAt: r.OccurredAt,
			Embedding:  DecodeVector(r.Embedding),
		})
	}
	return out
}

// --- 召回打分 ---

// BuildEpisodeHits 对 candidates 做 hybrid 排序，返回 top-K。
// 权重：lexical 0.35 + vector 0.40 + freshness 0.15 + outcome 0.10
//
// 现阶段的权重倾向"向量略胜一筹"——情景记忆的价值就在于"语义相似但字面不一样"的召回；
// 纯关键字匹配能做到的事情，知识条目已经在做了。
func BuildEpisodeHits(
	ctx context.Context,
	embedder Embedder,
	query string,
	intent chatIntentType,
	candidates []EpisodeCandidate,
	antiRepeat []string,
) []EpisodeHit {
	if len(candidates) == 0 {
		return nil
	}
	antiSet := make(map[string]bool, len(antiRepeat))
	for _, id := range antiRepeat {
		antiSet[id] = true
	}

	// 1) 计算 query 向量（最多一次）
	var qVec []float32
	if embedder != nil && strings.TrimSpace(query) != "" {
		if vs, err := embedder.Embed(ctx, []string{query}); err == nil && len(vs) == 1 {
			qVec = vs[0]
		}
	}

	// 2) 逐个打分
	normQ := strings.ToLower(query)
	qTokens := tokenize(normQ)
	now := time.Now()
	hits := make([]EpisodeHit, 0, len(candidates))
	for _, c := range candidates {
		lex := lexicalMatchScore(c, qTokens)
		var vec float64
		if len(qVec) > 0 && len(c.Embedding) > 0 {
			vec = NormalizeCosine(CosineSim(qVec, c.Embedding))
		}
		fresh := freshnessScore(now, c.OccurredAt)
		out := outcomeBias(c.Outcome)

		// 反重复：最近复述过的 episode 直接对向量分打 0.5 折扣（不完全屏蔽，避免相关话题被意外杀干净）
		if antiSet[c.ID] {
			lex *= 0.5
			vec *= 0.5
		}

		// 过低分的直接丢
		if lex < 0.05 && vec < 0.2 {
			continue
		}

		score := 0.35*lex + 0.40*vec + 0.15*fresh + 0.10*out
		hits = append(hits, EpisodeHit{
			ID:         c.ID,
			Kind:       c.Kind,
			Title:      c.Title,
			Situation:  c.Situation,
			UserState:  c.UserState,
			AgentMove:  c.AgentMove,
			Outcome:    c.Outcome,
			Lesson:     c.Lesson,
			OccurredAt: c.OccurredAt,
			Lexical:    lex,
			Vector:     vec,
			Freshness:  fresh,
			Score:      score,
		})
	}

	// 3) 排序并挑 top
	// "经验分享/情感陪伴"语境下：
	//   deep_consult  —— 情景召回 TopK=3，且不低于 Semantic（所以这里不限死）
	//   casual_info   —— TopK=1（显著低于 Semantic）
	//   small_talk    —— TopK=1
	topK := 3
	if intent == chatIntentCasualInfo || intent == chatIntentSmallTalk {
		topK = 1
	}
	sortHitsDesc(hits)
	if len(hits) > topK {
		hits = hits[:topK]
	}
	return hits
}

// lexicalMatchScore 在 title + situation + userState + lesson 上做 token 匹配，归一到 [0,1]。
func lexicalMatchScore(c EpisodeCandidate, qTokens []string) float64 {
	if len(qTokens) == 0 {
		return 0
	}
	hay := strings.ToLower(c.Title + " " + c.Situation + " " + c.UserState + " " + c.Lesson + " " + strings.Join(c.TopicKeys, " "))
	if hay == "" {
		return 0
	}
	hit := 0
	for _, tok := range qTokens {
		if strings.Contains(hay, tok) {
			hit++
		}
	}
	// 用"命中数/总token数"作为归一，超过 0.6 基本就是强相关
	ratio := float64(hit) / float64(len(qTokens))
	if ratio > 1 {
		ratio = 1
	}
	return ratio
}

// freshnessScore 以 30 天为半衰期的指数衰减；60 天前的 episode 约 0.25，180 天后 < 0.05。
func freshnessScore(now, occurredAt time.Time) float64 {
	if occurredAt.IsZero() {
		return 0
	}
	days := now.Sub(occurredAt).Hours() / 24
	if days < 0 {
		days = 0
	}
	return math.Pow(0.5, days/30.0)
}

// sortHitsDesc 简单冒泡；hits 规模 < 50，足够。
func sortHitsDesc(hits []EpisodeHit) {
	for i := 0; i < len(hits); i++ {
		for j := i + 1; j < len(hits); j++ {
			if hits[j].Score > hits[i].Score {
				hits[i], hits[j] = hits[j], hits[i]
			}
		}
	}
}

func outcomeBias(outcome string) float64 {
	switch outcome {
	case "helpful":
		return 1.0
	case "neutral", "":
		return 0.5
	case "bad":
		return 0.0
	}
	return 0.5
}

// --- 回忆巩固（反思式提取 + 异步写库） ---

// ConsolidateEpisodesAsync 在会话发生"值得沉淀"时调一次：
//   - 消息数 ≥ 6（初步有互动）
//   - 或刚收到显式 helpful 反馈
// 这里做了两件事：调 LLM 抽 1-3 条 episode；算 embedding 并 upsert 到 life_agent_episodes。
// 失败了就吞日志，不抛给主请求。
func ConsolidateEpisodesAsync(
	ctx context.Context,
	gdb *gorm.DB,
	embedder Embedder,
	apiKey, model, baseURL string,
	profileID, sessionID, buyerID string,
	messages []ChatMessageForAI,
) {
	if gdb == nil || profileID == "" || sessionID == "" || buyerID == "" {
		return
	}
	if !isLLMEnabled(apiKey, model, baseURL) || len(messages) < 4 {
		return
	}
	go func() {
		defer func() {
			if r := recover(); r != nil {
				// 情景巩固不能影响主链路；任何 panic 都吞
			}
		}()
		episodes, err := extractEpisodesFromConversation(ctx, apiKey, model, baseURL, messages)
		if err != nil || len(episodes) == 0 {
			return
		}

		// 避免同一次巩固产生和最近 episode 重复的 situation：简单去重，按 title 前 30 字
		var recent []models.LifeAgentEpisode
		gdb.Where("profile_id = ? AND buyer_id = ?", profileID, buyerID).
			Order("occurred_at DESC").Limit(20).Find(&recent)
		recentTitles := make(map[string]bool, len(recent))
		for _, r := range recent {
			recentTitles[normalizeEpisodeKey(r.Title, r.Situation)] = true
		}

		// 向量化所有新 episode
		texts := make([]string, 0, len(episodes))
		for _, e := range episodes {
			texts = append(texts, buildEpisodeEmbedText(e))
		}
		var vecs [][]float32
		if embedder != nil {
			ectx, cancel := context.WithTimeout(ctx, 30*time.Second)
			defer cancel()
			vecs, _ = embedder.Embed(ectx, texts)
		}
		now := time.Now()
		var model64 *string
		if embedder != nil {
			m := embedder.Model()
			model64 = &m
		}
		for i, e := range episodes {
			if recentTitles[normalizeEpisodeKey(e.Title, e.Situation)] {
				continue
			}
			var blob []byte
			if i < len(vecs) && len(vecs[i]) > 0 {
				blob = EncodeVector(vecs[i])
			}
			var lessonPtr *string
			if strings.TrimSpace(e.Lesson) != "" {
				ls := e.Lesson
				lessonPtr = &ls
			}
			var embedAt *time.Time
			if len(blob) > 0 {
				embedAt = &now
			}
			row := models.LifeAgentEpisode{
				ID:           models.GenID(),
				ProfileID:    profileID,
				SessionID:    sessionID,
				BuyerID:      buyerID,
				Kind:         coalesceStr(e.Kind, "experience_shared"),
				Title:        truncateRunes(e.Title, 120),
				Situation:    truncateRunes(e.Situation, 400),
				UserState:    truncateRunes(e.UserState, 200),
				AgentMove:    truncateRunes(e.AgentMove, 400),
				Outcome:      coalesceStr(e.Outcome, "neutral"),
				Lesson:       lessonPtr,
				TopicKeys:    models.JSONArray(e.TopicKeys),
				EntryIDs:     models.JSONArray(e.EntryIDs),
				Embedding:    blob,
				EmbedModel:   model64,
				EmbedAt:      embedAt,
				OccurredAt:   now,
				PrivacyLevel: "buyer_only",
				CreatedAt:    now,
			}
			if err := gdb.Create(&row).Error; err != nil {
				continue
			}
		}
	}()
}

// --- LLM 反思：从对话里抽 episode ---

type extractedEpisode struct {
	Kind      string   `json:"kind"`
	Title     string   `json:"title"`
	Situation string   `json:"situation"`
	UserState string   `json:"user_state"`
	AgentMove string   `json:"agent_move"`
	Outcome   string   `json:"outcome"`
	Lesson    string   `json:"lesson"`
	TopicKeys []string `json:"topic_keys"`
	EntryIDs  []string `json:"entry_ids"`
}

func extractEpisodesFromConversation(ctx context.Context, apiKey, model, baseURL string, messages []ChatMessageForAI) ([]extractedEpisode, error) {
	// 只把最近 30 轮送进去，控制 token
	if len(messages) > 30 {
		messages = messages[len(messages)-30:]
	}
	var b strings.Builder
	for _, m := range messages {
		b.WriteString(m.Role)
		b.WriteString(": ")
		b.WriteString(m.Content)
		b.WriteString("\n")
	}
	transcript := b.String()

	system := `你在观察一段"人生 Agent 和用户"的对话。` +
		`任务：把这段对话中值得被长期记住的"情景片段"抽出来，严格 JSON 数组返回，不要多余文字。` +
		"\n" +
		`取舍原则：
- 只记录"这一次会话里实际发生过的事"（Agent 分享的经历、对用户情绪的承接、给过的建议、遇到的盲区）；
- 一次对话最多 3 条；没有值得记录的就返回空数组；
- 不要把抽象价值观、通用道理写成 episode——那是 knowledge entry 的领域；
- 每条要带 user_state（用户当时情感/诉求）和 agent_move（Agent 做了什么），不要只写结论。` +
		"\n" +
		`字段说明：
- kind: experience_shared / empathy_moment / advice_given / boundary_kept / confusion_resolved / blind_spot
- outcome: helpful / neutral / bad（未知写 neutral）
- topic_keys: 从对话推断出的话题词（小写，中文关键词，最多 3 个）
- entry_ids: 留空数组即可（本轮无法回溯到具体 knowledge entry）
- lesson: 可选；一两句话，从这段情景里自己学到的元规则`

	schemaHint := `JSON 示例：
[
  {
    "kind": "empathy_moment",
    "title": "买家凌晨焦虑保研，先承接再分享",
    "situation": "买家在凌晨 2 点问保研焦虑",
    "user_state": "焦虑 + 自我怀疑，需要有人先听",
    "agent_move": "没直接给建议，先说自己大三下那两个月也睡不着",
    "outcome": "helpful",
    "topic_keys": ["保研", "焦虑"],
    "entry_ids": [],
    "lesson": "凌晨的焦虑问题先承接情绪，再谈操作"
  }
]`

	msgs := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: system + "\n" + schemaHint},
		{Role: openai.ChatMessageRoleUser, Content: "对话记录：\n" + transcript},
	}
	client := getClient(resolveAPIKey(apiKey, baseURL), baseURL)
	req := openai.ChatCompletionRequest{
		Model:    model,
		Messages: msgs,
	}
	if !isReasoningModel(model) {
		req.Temperature = 0.2
	}
	setMaxTokens(&req, model, 800)

	cctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	resp, err := client.CreateChatCompletion(cctx, req)
	if err != nil {
		return nil, fmt.Errorf("episode extract: %w", err)
	}
	if len(resp.Choices) == 0 {
		return nil, errors.New("episode extract: empty response")
	}
	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	// 剥掉可能出现的 ```json ... ```
	raw = trimCodeFence(raw)
	var out []extractedEpisode
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		// 尝试在文本里找第一段 JSON 数组
		if start := strings.Index(raw, "["); start >= 0 {
			if end := strings.LastIndex(raw, "]"); end > start {
				if err2 := json.Unmarshal([]byte(raw[start:end+1]), &out); err2 == nil {
					return out, nil
				}
			}
		}
		return nil, fmt.Errorf("episode extract parse: %w", err)
	}
	return out, nil
}

func buildEpisodeEmbedText(e extractedEpisode) string {
	parts := []string{}
	if s := strings.TrimSpace(e.Title); s != "" {
		parts = append(parts, s)
	}
	if s := strings.TrimSpace(e.Situation); s != "" {
		parts = append(parts, "情境："+s)
	}
	if s := strings.TrimSpace(e.UserState); s != "" {
		parts = append(parts, "用户状态："+s)
	}
	if s := strings.TrimSpace(e.AgentMove); s != "" {
		parts = append(parts, "Agent："+s)
	}
	return strings.Join(parts, "\n")
}

func normalizeEpisodeKey(title, situation string) string {
	r := []rune(strings.ToLower(strings.TrimSpace(title + "|" + situation)))
	if len(r) > 40 {
		r = r[:40]
	}
	return string(r)
}

// --- 小工具（episodic 内部，避免跟别的文件冲突） ---

func coalesceStr(s, fallback string) string {
	if strings.TrimSpace(s) == "" {
		return fallback
	}
	return s
}

func trimCodeFence(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```") {
		if i := strings.Index(s, "\n"); i >= 0 {
			s = s[i+1:]
		}
		s = strings.TrimSuffix(s, "```")
		s = strings.TrimSpace(s)
	}
	return s
}

