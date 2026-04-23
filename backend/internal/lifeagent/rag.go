package lifeagent

// rag.go —— 语义层 Hybrid Retrieval。
//
// 设计要点：
//   1. 复用既有 BuildRetrievalPlan 的词法打分（它已经吸收了 topic/fact/entry 路由、
//      最小分阈值、去重等业务规则），保证「纯词法可用」是下限。
//   2. 在词法基础上，用 Embedder 做向量召回，把未被词法选中但语义相似的 entry/topic
//      合并到 plan 里（按综合分 re-rank），这就是 "Hybrid"。
//   3. 缺向量时平滑降级为纯词法；向量回填失败或 API key 缺失，不阻塞回复主链路。
//   4. 向量懒回填：handler 加载 entries/topics 后可以判断 Embedding 是否缺失，
//      用 BackfillEmbeddingsAsync 把缺失项异步写回库；当次请求还是词法命中，
//      下一轮起自动享用向量召回。
//
// 分数融合（0..1）：
//   hit.Score = 0.55 * lexNorm + 0.35 * vecNorm + 0.10 * freshnessBonus
//   其中 lexNorm 由"是否被词法 plan 选中 + 命中路由"归一化；vecNorm 来自 cosine。

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
	"gorm.io/gorm"
)

// RAGWeights 各源权重。小改动这里就能调 hybrid 调性。
type RAGWeights struct {
	Lexical   float64
	Vector    float64
	Freshness float64
}

var defaultRAGWeights = RAGWeights{Lexical: 0.55, Vector: 0.35, Freshness: 0.10}

// RunHybridRetrieval 在词法 plan 基础上融合向量召回。
// 返回的 plan 会被 in-place 扩充（Entries / Topics 可能新增来自向量的命中），
// hits 是带分数的统一视图，供 WorkingState.Retrieved.Semantic 存档 / 日志。
func RunHybridRetrieval(
	ctx context.Context,
	embedder Embedder,
	query string,
	history []ChatMessageForAI,
	facts []StructuredFactForAI,
	topics []TopicSummaryForAI,
	entries []KnowledgeEntryForAI,
	live []LiveUpdateForAI,
	recentlyUsed []string,
) (RetrievalPlan, []SemanticHit) {
	plan := BuildRetrievalPlan(query, history, facts, topics, entries)
	AttachLiveUpdates(&plan, live)
	DeweightRecentlyUsedEntries(&plan, recentlyUsed)

	hits := seedHitsFromPlan(plan)

	if embedder == nil || strings.TrimSpace(query) == "" {
		return plan, hits
	}

	vecs, err := embedder.Embed(ctx, []string{query})
	if err != nil || len(vecs) == 0 || len(vecs[0]) == 0 {
		return plan, hits
	}
	qv := vecs[0]

	// 采集"被词法选中"的 ID，用于标记 lexical 分。
	picked := map[string]bool{}
	for _, e := range plan.Entries {
		picked[e.ID] = true
	}
	for _, t := range plan.Topics {
		picked[t.ID] = true
	}

	// 全量遍历候选做 cosine；条目一般在百级内，直接 CPU 算没问题。
	var vecEntries []SemanticHit
	for _, e := range entries {
		if len(e.Embedding) == 0 {
			continue
		}
		cos := CosineSim(qv, e.Embedding)
		if cos < 0.15 { // 阈值：低于此基本不相关，避免引入噪音
			continue
		}
		lex := 0.0
		if picked[e.ID] {
			lex = 1.0
		}
		vecEntries = append(vecEntries, SemanticHit{
			Kind:    "entry",
			ID:      e.ID,
			Title:   e.Title,
			Snippet: firstRunes(e.Content, 120),
			Lexical: lex,
			Vector:  NormalizeCosine(cos),
		})
	}

	var vecTopics []SemanticHit
	for _, t := range topics {
		if len(t.Embedding) == 0 {
			continue
		}
		cos := CosineSim(qv, t.Embedding)
		if cos < 0.15 {
			continue
		}
		lex := 0.0
		if picked[t.ID] {
			lex = 1.0
		}
		vecTopics = append(vecTopics, SemanticHit{
			Kind:    "topic",
			ID:      t.ID,
			Title:   t.TopicLabel,
			Snippet: firstRunes(t.Summary, 120),
			Lexical: lex,
			Vector:  NormalizeCosine(cos),
		})
	}

	// 合并已有 hits + 向量新增，去重后打分。
	merged := mergeHits(hits, append(vecEntries, vecTopics...))
	// 时效性 bonus 暂时只加到 live；future topic 可加 "recent change" 信号。
	for i := range merged {
		if merged[i].Kind == "live" {
			merged[i].Vector += 0.05 // live 本身新鲜度高时略微加权
		}
	}
	scoreHits(merged, defaultRAGWeights)
	sort.SliceStable(merged, func(i, j int) bool { return merged[i].Score > merged[j].Score })

	// 把向量带来的新 entry / topic 注入 plan，便于 llm.go 现有流程直接消费。
	injectVectorHitsIntoPlan(&plan, merged, entries, topics)

	return plan, merged
}

// seedHitsFromPlan 把词法 plan 里的命中项转成带分的 SemanticHit；lexical=1.0，vector=0。
func seedHitsFromPlan(plan RetrievalPlan) []SemanticHit {
	hits := make([]SemanticHit, 0, len(plan.Facts)+len(plan.Topics)+len(plan.Entries)+len(plan.LiveUpdates))
	for _, f := range plan.Facts {
		hits = append(hits, SemanticHit{
			Kind:    "fact",
			ID:      f.ID,
			Title:   f.FactKey,
			Snippet: f.FactValue,
			Lexical: 1.0,
			Score:   1.0,
		})
	}
	for _, t := range plan.Topics {
		hits = append(hits, SemanticHit{
			Kind:    "topic",
			ID:      t.ID,
			Title:   t.TopicLabel,
			Snippet: firstRunes(t.Summary, 120),
			Lexical: 1.0,
			Score:   1.0,
		})
	}
	for _, e := range plan.Entries {
		hits = append(hits, SemanticHit{
			Kind:    "entry",
			ID:      e.ID,
			Title:   e.Title,
			Snippet: firstRunes(e.Content, 120),
			Lexical: 1.0,
			Score:   1.0,
		})
	}
	for _, u := range plan.LiveUpdates {
		hits = append(hits, SemanticHit{
			Kind:    "live",
			ID:      u.ID,
			Title:   u.Category,
			Snippet: firstRunes(u.Content, 120),
			Lexical: 1.0,
			Score:   1.0,
		})
	}
	return hits
}

// mergeHits 按 Kind+ID 合并（以较高分者胜出）。
func mergeHits(primary, extra []SemanticHit) []SemanticHit {
	seen := make(map[string]int, len(primary)+len(extra))
	merged := make([]SemanticHit, 0, len(primary)+len(extra))
	for _, h := range primary {
		k := h.Kind + "|" + h.ID
		seen[k] = len(merged)
		merged = append(merged, h)
	}
	for _, h := range extra {
		k := h.Kind + "|" + h.ID
		if idx, ok := seen[k]; ok {
			if h.Vector > merged[idx].Vector {
				merged[idx].Vector = h.Vector
			}
			if h.Lexical > merged[idx].Lexical {
				merged[idx].Lexical = h.Lexical
			}
			continue
		}
		seen[k] = len(merged)
		merged = append(merged, h)
	}
	return merged
}

func scoreHits(hits []SemanticHit, w RAGWeights) {
	for i := range hits {
		hits[i].Score = w.Lexical*hits[i].Lexical + w.Vector*hits[i].Vector + w.Freshness*hits[i].Freshness
	}
}

// injectVectorHitsIntoPlan 把词法漏掉但向量命中的 entry / topic 追加进 plan（带最大数量与最低分门槛）。
func injectVectorHitsIntoPlan(plan *RetrievalPlan, hits []SemanticHit, allEntries []KnowledgeEntryForAI, allTopics []TopicSummaryForAI) {
	const (
		maxExtraEntries = 2
		maxExtraTopics  = 2
		minVectorOnly   = 0.65 // 只靠向量命中的最低阈值（更严格）
	)
	// 建立 lookup，按 ID 取回原对象
	entryByID := make(map[string]KnowledgeEntryForAI, len(allEntries))
	for _, e := range allEntries {
		entryByID[e.ID] = e
	}
	topicByID := make(map[string]TopicSummaryForAI, len(allTopics))
	for _, t := range allTopics {
		topicByID[t.ID] = t
	}

	existingEntry := map[string]bool{}
	for _, e := range plan.Entries {
		existingEntry[e.ID] = true
	}
	existingTopic := map[string]bool{}
	for _, t := range plan.Topics {
		existingTopic[t.ID] = true
	}

	addedEntries, addedTopics := 0, 0
	for _, h := range hits {
		// 只考虑纯靠向量新进来的：Lexical==0
		if h.Lexical > 0 {
			continue
		}
		if h.Vector < minVectorOnly {
			continue
		}
		switch h.Kind {
		case "entry":
			if existingEntry[h.ID] || addedEntries >= maxExtraEntries {
				continue
			}
			if e, ok := entryByID[h.ID]; ok {
				plan.Entries = append(plan.Entries, e)
				plan.Reasons = append(plan.Reasons, "vector:entry:"+e.Title)
				existingEntry[h.ID] = true
				addedEntries++
			}
		case "topic":
			if existingTopic[h.ID] || addedTopics >= maxExtraTopics {
				continue
			}
			if t, ok := topicByID[h.ID]; ok {
				plan.Topics = append(plan.Topics, t)
				plan.Reasons = append(plan.Reasons, "vector:topic:"+t.TopicLabel)
				existingTopic[h.ID] = true
				addedTopics++
			}
		}
	}
	// 如果一开始是 low，但向量给补了新料，升到 medium。
	if (addedEntries > 0 || addedTopics > 0) && plan.Confidence == "low" {
		plan.Confidence = "medium"
	}
}

// --- 懒回填：异步把缺 embedding 的知识条目 / topic / live 算出来写回库 ---

// embeddingBackfillSem 限制同一进程的回填并发，避免单个大 profile 撑爆 embedding API。
var embeddingBackfillSem = make(chan struct{}, 2)

// BackfillEmbeddingsAsync 非阻塞；若 embedder 为 nil 或无缺失，立即返回。
// 只处理 entries / topics / live 三类；episode 由 episodic.go 自己掌管。
func BackfillEmbeddingsAsync(
	ctx context.Context,
	gdb *gorm.DB,
	embedder Embedder,
	profileID string,
	entries []models.LifeAgentKnowledgeEntry,
	topics []models.LifeAgentTopicSummary,
	live []models.LifeAgentLiveUpdate,
) {
	if embedder == nil || gdb == nil || profileID == "" {
		return
	}
	// 先挑需要回填的
	type pending struct {
		kind string // "entry" / "topic" / "live"
		id   string
		text string
	}
	var todo []pending
	for _, e := range entries {
		if len(e.Embedding) > 0 {
			continue
		}
		text := buildEntryEmbedText(e)
		if text == "" {
			continue
		}
		todo = append(todo, pending{"entry", e.ID, text})
	}
	for _, t := range topics {
		if len(t.Embedding) > 0 {
			continue
		}
		text := buildTopicEmbedText(t)
		if text == "" {
			continue
		}
		todo = append(todo, pending{"topic", t.ID, text})
	}
	for _, u := range live {
		if len(u.Embedding) > 0 {
			continue
		}
		text := buildLiveEmbedText(u)
		if text == "" {
			continue
		}
		todo = append(todo, pending{"live", u.ID, text})
	}
	if len(todo) == 0 {
		return
	}

	go func(items []pending) {
		select {
		case embeddingBackfillSem <- struct{}{}:
			defer func() { <-embeddingBackfillSem }()
		default:
			return // 已经有回填任务在跑，跳过本次（下轮再试）
		}
		// 单次上限：避免某 profile 上千条一次性把配额打满
		if len(items) > 40 {
			items = items[:40]
		}
		texts := make([]string, len(items))
		for i, it := range items {
			texts[i] = it.text
		}
		bctx, cancel := context.WithTimeout(ctx, 60*time.Second)
		defer cancel()
		vecs, err := embedder.Embed(bctx, texts)
		if err != nil {
			return
		}
		now := time.Now()
		model := embedder.Model()
		var mu sync.Mutex
		var wg sync.WaitGroup
		for i, it := range items {
			if i >= len(vecs) || len(vecs[i]) == 0 {
				continue
			}
			blob := EncodeVector(vecs[i])
			wg.Add(1)
			go func(it pending, blob []byte) {
				defer wg.Done()
				mu.Lock()
				defer mu.Unlock()
				switch it.kind {
				case "entry":
					gdb.Model(&models.LifeAgentKnowledgeEntry{}).
						Where("id = ?", it.id).
						Updates(map[string]interface{}{
							"embedding":   blob,
							"embed_model": model,
							"embed_at":    now,
						})
				case "topic":
					gdb.Model(&models.LifeAgentTopicSummary{}).
						Where("id = ?", it.id).
						Updates(map[string]interface{}{
							"embedding":   blob,
							"embed_model": model,
							"embed_at":    now,
						})
				case "live":
					gdb.Model(&models.LifeAgentLiveUpdate{}).
						Where("id = ?", it.id).
						Updates(map[string]interface{}{
							"embedding":   blob,
							"embed_model": model,
							"embed_at":    now,
						})
				}
			}(it, blob)
		}
		wg.Wait()
	}(todo)
}

// HydrateEntryEmbeddings 把 DB 行的 Embedding 字节解码到 ForAI 视图里，
// 便于 RunHybridRetrieval 时直接用。传入两个切片必须一一对应。
func HydrateEntryEmbeddings(rows []models.LifeAgentKnowledgeEntry, out []KnowledgeEntryForAI) {
	if len(rows) != len(out) {
		return
	}
	for i := range rows {
		out[i].Embedding = DecodeVector(rows[i].Embedding)
	}
}

// HydrateLiveEmbeddings 同上，作用于 LiveUpdateForAI。
func HydrateLiveEmbeddings(rows []models.LifeAgentLiveUpdate, out []LiveUpdateForAI) {
	if len(rows) != len(out) {
		return
	}
	for i := range rows {
		out[i].Embedding = DecodeVector(rows[i].Embedding)
	}
}

// --- 文本构造：决定什么字段进 embedding，直接影响召回质量 ---

func buildEntryEmbedText(e models.LifeAgentKnowledgeEntry) string {
	parts := []string{}
	if s := strings.TrimSpace(e.Title); s != "" {
		parts = append(parts, s)
	}
	if s := strings.TrimSpace(e.Category); s != "" {
		parts = append(parts, "类别："+s)
	}
	if tags := []string(e.Tags); len(tags) > 0 {
		parts = append(parts, "标签："+strings.Join(tags, "、"))
	}
	if s := strings.TrimSpace(e.Content); s != "" {
		parts = append(parts, s)
	}
	return strings.Join(parts, "\n")
}

func buildTopicEmbedText(t models.LifeAgentTopicSummary) string {
	parts := []string{}
	if s := strings.TrimSpace(t.TopicLabel); s != "" {
		parts = append(parts, s)
	}
	if s := strings.TrimSpace(t.TopicGroup); s != "" {
		parts = append(parts, "分组："+s)
	}
	if aliases := []string(t.Aliases); len(aliases) > 0 {
		parts = append(parts, "别名："+strings.Join(aliases, "、"))
	}
	if s := strings.TrimSpace(t.Summary); s != "" {
		parts = append(parts, s)
	}
	return strings.Join(parts, "\n")
}

func buildLiveEmbedText(u models.LifeAgentLiveUpdate) string {
	parts := []string{}
	if s := strings.TrimSpace(u.Category); s != "" {
		parts = append(parts, "类别："+s)
	}
	if u.Location != nil && strings.TrimSpace(*u.Location) != "" {
		parts = append(parts, "地点："+strings.TrimSpace(*u.Location))
	}
	if s := strings.TrimSpace(u.Content); s != "" {
		parts = append(parts, s)
	}
	return strings.Join(parts, "\n")
}

// firstRunes 截取前 n 个 rune，中文友好。
func firstRunes(s string, n int) string {
	r := []rune(strings.TrimSpace(s))
	if len(r) <= n {
		return string(r)
	}
	return string(r[:n]) + "…"
}
