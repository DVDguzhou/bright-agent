package lifeagent

// working_state.go —— CoALA 四层记忆架构中「工作记忆」的载体。
//
// 一次对话的生命周期：
//   1. handler 进来时 NewWorkingState() 构造空白的 WorkingState
//   2. 感知层（perception.go）填 Perception：当前情绪、意图、长度诉求、元指令、情绪弧
//   3. 语义/情景层（rag.go + episodic.go）填 Retrieved：知识片段、情景回忆
//   4. 策略层（strategy.go）读前两者 + profile，产出 Strategy
//   5. 草稿/最终回复阶段把 Strategy 翻译成 system prompt
//   6. 回合结束，WorkingState 作为 goroutine 输入被异步消费去写 perceptual trace
//      与情景巩固，本身不落库
//
// 之所以把这些打成一个结构而不是散在函数签名里：
//   - 四层都要协同决策（例：情绪=worsening ∧ 意图=deep_consult → 必然 elaborate），
//     把状态聚拢成"一张桌面"比传一堆参数清晰得多；
//   - 未来要加自我反思、外部工具调用，只需往 WorkingState 上挂新字段。

import (
	"time"
)

// WorkingState 一次对话回合的完整 scratchpad。
type WorkingState struct {
	// —— 请求元信息
	ProfileID string
	SessionID string
	BuyerID   string
	TurnIndex int       // 会话内第几轮（新会话从 0 起）
	Now       time.Time // 统一时间锚，便于"三分钟前的消息"之类的判断

	// —— 感知层产出
	Perception PerceptionSnapshot

	// —— 检索层产出（语义 + 情景）
	Retrieved RetrievedContext

	// —— 策略层产出
	Strategy Strategy

	// —— 防重复：本轮之前最近回复里已经用过的素材 / 情景 ID
	AntiRepeat AntiRepeatSet
}

// PerceptionSnapshot 对"当前用户状态"的一次性刻画。
// 所有字段都允许零值（未检测到即空），不拿 enum 是为了 JSON 往 trace 表写更直白。
type PerceptionSnapshot struct {
	Emotion    emotionalTone    // 复用 llm.go 中既有类型
	Intent     chatIntentType   // 复用 llm.go 中既有类型
	LengthPref LengthPreference // 用户是否显式/近期表达过长度诉求
	MetaInstr  MetaInstruction  // 元指令（要求详细 / 别说教 / 换话题 等）
	TopicFocus []string         // 本轮识别到的话题关键词（用于 topic 检索 & trace）
	Arc        EmotionArc       // 跨轮情绪走向
	RawMessage string           // 本轮用户原话，用于 Strategy 识别"求经验型提问"等表层模式
}

// LengthPreference 用户期望的回答长度。
type LengthPreference struct {
	// Direction: "concise" | "neutral" | "elaborate"
	Direction string
	// Source: "explicit"（本轮直说） | "sticky"（前几轮说过，仍在粘性窗口内） | "default"
	Source string
	// TurnsAgo: source=sticky 时离当前多少个用户轮次前表达的，用于衰减
	TurnsAgo int
	// Raw: 触发词原文，便于 prompt 里引用 "你刚才说 '详细点'"
	Raw string
}

// MetaInstruction 元指令；多数回合为空。
type MetaInstruction struct {
	// Type: "want_detail" | "want_brief" | "stop_advice" | "change_topic" | "empathy_only"
	Type    string
	Raw     string
	Present bool
}

// EmotionArc 最近 N 轮的情绪走向。
type EmotionArc struct {
	Current      string // 最近一轮的主导情绪；neutral/空 表示无显著情绪
	Dominant     string // 窗口内出现最多的情绪类型
	Trend        string // "improving" | "worsening" | "steady" | "unknown"
	WindowTurns  int    // 参与统计的用户轮数
	DistinctKind int    // 情绪种类数
}

// RetrievedContext 一次检索的产出。Plan 字段保留是为了不打破既有 reconcile / groundingGuidance 等下游调用。
type RetrievedContext struct {
	Plan     RetrievalPlan
	Semantic []SemanticHit
	Episodic []EpisodeHit
}

// SemanticHit 语义层命中结果（facts / topics / entries / live 的统一视图）。
// Kind 标记来源，用于 prompt 排序和去重。
type SemanticHit struct {
	Kind      string  // "fact" | "topic" | "entry" | "live"
	ID        string  // 可能为空（facts 没 ID）
	Title     string
	Snippet   string
	Lexical   float64 // 归一化到 [0,1]
	Vector    float64 // 归一化到 [0,1]（未启用向量时 0）
	Freshness float64 // 归一化到 [0,1]，只有 live 有意义
	Score     float64 // 融合后综合分
}

// EpisodeHit 情景回忆命中。
type EpisodeHit struct {
	ID         string
	Kind       string
	Title      string
	Situation  string
	UserState  string
	AgentMove  string
	Outcome    string
	Lesson     string
	OccurredAt time.Time
	Lexical    float64
	Vector     float64
	Freshness  float64 // 时间衰减 [0,1]
	Score      float64
}

// Strategy 经过综合推理后，指导 prompt 构建的决策。
type Strategy struct {
	// Register: "smalltalk" | "casual" | "deep" —— 回答调性
	Register string

	// LengthTarget 回答长度锚。buildDraftSystemPrompt 会把它翻译成一条具体的 "长度提示"，
	// 而不是沿用旧的 randomLengthHint 随机采样。
	LengthTarget LengthTarget

	// EmpathyMode: "mirror" | "lead" | "hold_space" | "after_validate" | "none"
	// mirror         —— 轻度情绪镜映
	// lead           —— 引导对方说更多（高情绪强度但用户倾向小扣)
	// hold_space    —— 只承接不建议，对应"抱持 / 陪伴"
	// after_validate —— 先认同再给实质建议
	EmpathyMode string

	// FocusMove: "share_experience" | "listen_only" | "validate_first" | "ask_back"
	FocusMove string

	// FormatRules 硬格式规则，直接注入 system prompt（避免"大一：…"之类的分点格式）
	FormatRules []string

	// PromptLengthHint 由 LengthTarget 派生出的单句指令，取代 randomLengthHint()
	PromptLengthHint string

	// Debug 诊断用的人类可读标签（可选写入日志，不影响回复）
	Debug string
}

// LengthTarget 长度建议的数值化表达。
type LengthTarget struct {
	Label    string // "concise" | "normal" | "elaborate"
	MinChars int
	MaxChars int
	MinParas int
	MaxParas int
}

// AntiRepeatSet 本轮不愿重复引用的 ID。
type AntiRepeatSet struct {
	EntryIDs   []string
	EpisodeIDs []string
}

// NewWorkingState 构造一个只填好元信息的空 state；其余字段由感知/检索/策略阶段逐步填充。
func NewWorkingState(profileID, sessionID, buyerID string, turnIndex int) *WorkingState {
	return &WorkingState{
		ProfileID: profileID,
		SessionID: sessionID,
		BuyerID:   buyerID,
		TurnIndex: turnIndex,
		Now:       time.Now(),
	}
}
