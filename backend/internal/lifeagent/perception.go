package lifeagent

// perception.go —— 感知层（Perceptual Memory）实现。
//
// 核心职责：
//   A) 从单轮消息 + 最近历史 + 感知轨迹表 构造 PerceptionSnapshot；
//   B) 把一次回合的感知信号落到 LifeAgentPerceptualTrace 表，供下一轮看"情绪走向"。
//
// 取舍说明：
//   - 情绪/意图复用 detectUserEmotionalTone / classifyChatIntent（llm.go 已有的词典版），
//     不再引入额外 LLM 调用；感知层要便宜，要能每回合跑。
//   - LengthPreference 是新能力：现阶段只做显式触发词检测 + 粘性窗口（前 3 轮内用户说过），
//     足以修掉"用户说'详细点'但回复依旧短"的核心问题。
//   - MetaInstruction 只覆盖 5 类：want_detail / want_brief / stop_advice /
//     change_topic / empathy_only；每类都直接能驱动一条 FormatRule。
//   - EmotionArc 用最近 5 个用户轮算走向，3 级（improving/worsening/steady），
//     足够给 Strategy 做 "情绪在恶化 → hold_space" 这类决策。

import (
	"context"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/models"
	"gorm.io/gorm"
)

// --- 触发词典：长度偏好 ---

var lengthElaborateCues = []string{
	"详细", "具体点", "具体讲", "具体一点", "展开", "展开说", "展开讲",
	"多说说", "再说说", "再讲讲", "多讲讲", "讲讲你", "讲详细",
	"细说", "说详细", "详细点", "说细一点", "说清楚", "说得具体", "说清楚点",
	"能不能说说", "能不能讲", "能详细", "多一点", "再多一点", "深入",
	"仔细说", "仔细讲", "讲讲细节", "给我讲讲",
}

var lengthConciseCues = []string{
	"简单说", "一句话", "别太长", "太长了", "短点", "简短", "简要",
	"一两句", "别啰嗦", "别废话", "长话短说", "短一点", "简单点",
}

// --- 触发词典：元指令 ---

type metaTriggerRule struct {
	Type     string
	Triggers []string
}

var metaInstructionRules = []metaTriggerRule{
	// want_detail 和 LengthPreference 有重合，但含义不同：
	//   LengthPreference 影响"长度锚"（50 字还是 400 字）；
	//   MetaInstruction.want_detail 影响"格式"（禁止列表，要连贯叙述），优先级更高。
	{Type: "want_detail", Triggers: []string{
		"详细", "具体点", "具体一点", "展开说", "展开讲", "多说说", "再讲讲",
		"细说", "说详细", "说清楚", "能详细", "讲详细", "讲讲细节",
	}},
	{Type: "want_brief", Triggers: []string{
		"简单说", "一句话", "别太长", "太长了", "短点", "一两句", "简短",
	}},
	{Type: "stop_advice", Triggers: []string{
		"别说教", "别给建议", "不用建议", "别劝我", "别讲道理", "不用建议了",
		"不是来找建议的", "不想听建议",
	}},
	{Type: "change_topic", Triggers: []string{
		"换个话题", "聊别的", "换个事", "说点别的", "不聊这个", "别聊这个",
	}},
	{Type: "empathy_only", Triggers: []string{
		"让我说一下", "让我讲完", "你先听", "只想聊聊", "只是想吐槽",
		"不是来求助的", "就是想说说",
	}},
}

// --- 对外入口 ---

// BuildPerceptionSnapshot 组合四个维度产出当前回合的感知快照。
// traces 是按 turn_index 升序的历史感知轨迹（不含本轮），可以为空。
func BuildPerceptionSnapshot(message string, history []ChatMessageForAI, traces []models.LifeAgentPerceptualTrace) PerceptionSnapshot {
	emotion := detectUserEmotionalTone(message, history)
	intent := classifyChatIntent(message)
	lengthPref := DetectLengthPreference(message, history, traces)
	meta := DetectMetaInstruction(message)
	focus := extractTopicFocus(message)
	arc := BuildEmotionArc(traces, emotion.Type)

	return PerceptionSnapshot{
		Emotion:    emotion,
		Intent:     intent,
		LengthPref: lengthPref,
		MetaInstr:  meta,
		TopicFocus: focus,
		Arc:        arc,
		RawMessage: message,
	}
}

// DetectLengthPreference 优先级：本轮显式 > 粘性窗口（最近 3 个用户轮） > 近 3 轮感知轨迹 > default。
func DetectLengthPreference(message string, history []ChatMessageForAI, traces []models.LifeAgentPerceptualTrace) LengthPreference {
	msg := strings.ToLower(strings.TrimSpace(message))

	// 1) 本轮显式
	if hit := firstMatch(msg, lengthElaborateCues); hit != "" {
		return LengthPreference{Direction: "elaborate", Source: "explicit", TurnsAgo: 0, Raw: hit}
	}
	if hit := firstMatch(msg, lengthConciseCues); hit != "" {
		return LengthPreference{Direction: "concise", Source: "explicit", TurnsAgo: 0, Raw: hit}
	}

	// 2) 粘性：最近 3 个用户轮里有没有 cues
	turnsAgo := 0
	for i := len(history) - 1; i >= 0; i-- {
		if history[i].Role != "user" {
			continue
		}
		turnsAgo++
		if turnsAgo > 3 {
			break
		}
		h := strings.ToLower(history[i].Content)
		if hit := firstMatch(h, lengthElaborateCues); hit != "" {
			return LengthPreference{Direction: "elaborate", Source: "sticky", TurnsAgo: turnsAgo, Raw: hit}
		}
		if hit := firstMatch(h, lengthConciseCues); hit != "" {
			return LengthPreference{Direction: "concise", Source: "sticky", TurnsAgo: turnsAgo, Raw: hit}
		}
	}

	// 3) 最近感知轨迹里如果有明确 length_pref 记录，也算粘性
	for i := len(traces) - 1; i >= 0; i-- {
		t := traces[i]
		if t.LengthPref == "" || t.LengthPref == "neutral" {
			continue
		}
		ago := len(traces) - i
		if ago > 3 {
			break
		}
		return LengthPreference{Direction: t.LengthPref, Source: "sticky", TurnsAgo: ago}
	}

	return LengthPreference{Direction: "neutral", Source: "default"}
}

// DetectMetaInstruction 只看本轮消息；元指令都是用户当下的 hard 指令，不做粘性。
func DetectMetaInstruction(message string) MetaInstruction {
	msg := strings.ToLower(strings.TrimSpace(message))
	if msg == "" {
		return MetaInstruction{}
	}
	for _, rule := range metaInstructionRules {
		if hit := firstMatch(msg, rule.Triggers); hit != "" {
			return MetaInstruction{Type: rule.Type, Raw: hit, Present: true}
		}
	}
	return MetaInstruction{}
}

// BuildEmotionArc 从 traces 里算最近 5 轮的情绪走向。
// 规则（够用主义）：
//   - 定义负面情绪集合 {anxious, frustrated, angry, confused}
//   - 前半窗口负面占比 > 后半负面占比        → improving
//   - 前半 < 后半                             → worsening
//   - 都一样（含 0）且 Current 非 neutral    → steady
//   - 其他                                    → unknown
func BuildEmotionArc(traces []models.LifeAgentPerceptualTrace, currentEmotion string) EmotionArc {
	if len(traces) == 0 {
		return EmotionArc{Current: currentEmotion, Trend: "unknown"}
	}
	window := 5
	if len(traces) < window {
		window = len(traces)
	}
	recent := traces[len(traces)-window:]
	counts := map[string]int{}
	var dominant string
	for _, t := range recent {
		if t.Emotion == "" {
			continue
		}
		counts[t.Emotion]++
	}
	best := 0
	for k, v := range counts {
		if v > best {
			best = v
			dominant = k
		}
	}

	negatives := map[string]bool{"anxious": true, "frustrated": true, "angry": true, "confused": true}
	half := window / 2
	if half == 0 {
		half = 1
	}
	var firstNeg, lastNeg int
	for i, t := range recent {
		if !negatives[t.Emotion] {
			continue
		}
		if i < half {
			firstNeg++
		} else {
			lastNeg++
		}
	}
	trend := "unknown"
	switch {
	case firstNeg > lastNeg:
		trend = "improving"
	case firstNeg < lastNeg:
		trend = "worsening"
	case firstNeg == lastNeg && (currentEmotion != "" && currentEmotion != "neutral"):
		trend = "steady"
	}

	return EmotionArc{
		Current:      currentEmotion,
		Dominant:     dominant,
		Trend:        trend,
		WindowTurns:  window,
		DistinctKind: len(counts),
	}
}

// extractTopicFocus 非常粗的启发式：从消息里挑出与 topicGroupRules 匹配的组名。
// 不做完美分词；保证感知 trace 里至少能留一点 topic 线索供下次召回使用。
func extractTopicFocus(message string) []string {
	msg := strings.ToLower(strings.TrimSpace(message))
	if msg == "" {
		return nil
	}
	hit := map[string]bool{}
	for _, rule := range topicGroupRules {
		for _, kw := range rule.keywords {
			if strings.Contains(msg, kw) {
				hit[rule.group] = true
				break
			}
		}
	}
	if len(hit) == 0 {
		return nil
	}
	out := make([]string, 0, len(hit))
	for g := range hit {
		out = append(out, g)
	}
	return out
}

func firstMatch(s string, cues []string) string {
	for _, c := range cues {
		if strings.Contains(s, c) {
			return c
		}
	}
	return ""
}

// --- DB helpers ---

// LoadRecentPerceptualTraces 按 turn_index 升序加载某会话的感知轨迹（最多 limit 条，返回最老到最新）。
func LoadRecentPerceptualTraces(gdb *gorm.DB, sessionID string, limit int) []models.LifeAgentPerceptualTrace {
	if gdb == nil || sessionID == "" {
		return nil
	}
	if limit <= 0 {
		limit = 20
	}
	var rows []models.LifeAgentPerceptualTrace
	// 先按 turn_index 降序取 limit，再在内存中反转，保证返回的是时间正序。
	gdb.Where("session_id = ?", sessionID).
		Order("turn_index DESC").
		Limit(limit).
		Find(&rows)
	for i, j := 0, len(rows)-1; i < j; i, j = i+1, j-1 {
		rows[i], rows[j] = rows[j], rows[i]
	}
	return rows
}

// WritePerceptualTrace 异步落库一次回合的感知快照；出错只吞日志，不影响主回复链路。
// 调用方应该在主回复返回后用 goroutine 调用。
func WritePerceptualTrace(ctx context.Context, gdb *gorm.DB, sessionID string, turnIndex int, snap PerceptionSnapshot) error {
	if gdb == nil || sessionID == "" {
		return nil
	}
	var metaPtr *string
	if snap.MetaInstr.Present {
		v := snap.MetaInstr.Type
		metaPtr = &v
	}
	row := models.LifeAgentPerceptualTrace{
		ID:         models.GenID(),
		SessionID:  sessionID,
		TurnIndex:  turnIndex,
		Emotion:    snap.Emotion.Type,
		Intensity:  "medium", // 现阶段不精细打分；留字段供后续升级
		Intent:     string(snap.Intent),
		LengthPref: snap.LengthPref.Direction,
		MetaInstr:  metaPtr,
		TopicFocus: models.JSONArray(snap.TopicFocus),
		CreatedAt:  time.Now(),
	}
	return gdb.WithContext(ctx).Create(&row).Error
}
