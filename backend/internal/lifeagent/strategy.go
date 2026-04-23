package lifeagent

// strategy.go —— 把「感知快照 + 画像」翻译成「具体的 prompt 决策」。
//
// 这是整个新架构里最能直接修复"回复太短 / 莫名分点"的地方：
//   - 旧实现里 randomLengthHint 随机给一个长度提示，跟用户诉求/情绪/画像都脱钩；
//   - 新实现由 DeriveStrategy 产出确定性的 LengthTarget + PromptLengthHint，
//     覆盖"用户要详细 → elaborate 锚"与"用户在低能量吐槽 → concise hold_space"两类极端。
//
// 策略分三块：
//   A) Register  回答调性（smalltalk / casual / deep）
//   B) Length    长度锚（数值范围 + 单句 prompt 提示）
//   C) Empathy   共情模式 + FocusMove（是先听还是先说自己的经历）
//   D) FormatRules  硬格式约束（禁止标签分点、禁止每句一行 等），直接进 system prompt

import (
	"strings"
)

// DeriveStrategy 总入口：读 ws.Perception + profile，写 ws.Strategy 同时返回副本。
func DeriveStrategy(ws *WorkingState, profile ProfileForAI) Strategy {
	if ws == nil {
		return Strategy{}
	}
	perc := ws.Perception

	register := resolveRegister(perc)
	length := resolveLengthTarget(perc, profile)
	empathy := resolveEmpathyMode(perc)
	focus := resolveFocusMove(perc, register)
	rules := buildFormatRules(perc, length, empathy, profile)

	hint := lengthPromptHint(length, perc.LengthPref, register)

	s := Strategy{
		Register:         register,
		LengthTarget:     length,
		EmpathyMode:      empathy,
		FocusMove:        focus,
		FormatRules:      rules,
		PromptLengthHint: hint,
		Debug: joinNonEmpty(" | ",
			"reg="+register,
			"len="+length.Label,
			"empathy="+empathy,
			"focus="+focus,
			"arc="+perc.Arc.Trend,
		),
	}
	ws.Strategy = s
	return s
}

// --- 调性 ---

func resolveRegister(p PerceptionSnapshot) string {
	switch p.Intent {
	case chatIntentSmallTalk:
		return "smalltalk"
	case chatIntentDeepConsult:
		return "deep"
	}
	// 情绪强烈且是负面 → 即使关键词识别为 casual_info，也按 deep 处理
	if p.Emotion.Type == "anxious" || p.Emotion.Type == "frustrated" || p.Emotion.Type == "angry" {
		return "deep"
	}
	return "casual"
}

// --- 长度 ---
//
// 规则（优先级从高到低）：
//   1. MetaInstruction: want_detail / want_brief 立即决定
//   2. 显式 LengthPreference
//   3. 粘性 LengthPreference（加适度衰减）
//   4. intent + emotion 组合：
//      deep + 负面 / anxious                          → elaborate（情绪需要被"承接够"）
//      deep + 其他                                     → normal-偏长
//      casual_info                                     → normal
//      smalltalk                                       → concise
//   5. profile.ResponseStyle 有"短句"倾向 → 在同级里偏短；但不低于场景的最小锚（即不能让 deep_consult 退化成一两句）

func resolveLengthTarget(p PerceptionSnapshot, profile ProfileForAI) LengthTarget {
	// 1) MetaInstruction 强信号
	if p.MetaInstr.Present {
		switch p.MetaInstr.Type {
		case "want_detail":
			return LengthTarget{Label: "elaborate", MinChars: 220, MaxChars: 520, MinParas: 2, MaxParas: 4}
		case "want_brief":
			return LengthTarget{Label: "concise", MinChars: 30, MaxChars: 140, MinParas: 1, MaxParas: 1}
		case "empathy_only":
			return LengthTarget{Label: "concise", MinChars: 40, MaxChars: 160, MinParas: 1, MaxParas: 2}
		}
	}

	// 2) 显式长度诉求
	if p.LengthPref.Source == "explicit" {
		switch p.LengthPref.Direction {
		case "elaborate":
			return LengthTarget{Label: "elaborate", MinChars: 200, MaxChars: 500, MinParas: 2, MaxParas: 4}
		case "concise":
			return LengthTarget{Label: "concise", MinChars: 30, MaxChars: 140, MinParas: 1, MaxParas: 1}
		}
	}

	// 3) 粘性长度诉求（衰减：2 轮内保留，3 轮后不强制）
	if p.LengthPref.Source == "sticky" && p.LengthPref.TurnsAgo <= 2 {
		switch p.LengthPref.Direction {
		case "elaborate":
			return LengthTarget{Label: "elaborate", MinChars: 160, MaxChars: 420, MinParas: 2, MaxParas: 3}
		case "concise":
			return LengthTarget{Label: "concise", MinChars: 40, MaxChars: 160, MinParas: 1, MaxParas: 1}
		}
	}

	// 4) 场景 + 情绪 组合
	base := LengthTarget{Label: "normal", MinChars: 90, MaxChars: 260, MinParas: 1, MaxParas: 3}
	switch p.Intent {
	case chatIntentDeepConsult:
		// 深度咨询 + 负面情绪：需要"先被接住"，偏长，但不过于冗长
		if isNegativeEmotion(p.Emotion.Type) || p.Arc.Trend == "worsening" {
			base = LengthTarget{Label: "elaborate", MinChars: 180, MaxChars: 420, MinParas: 2, MaxParas: 3}
		} else {
			base = LengthTarget{Label: "normal", MinChars: 120, MaxChars: 320, MinParas: 2, MaxParas: 3}
		}
	case chatIntentSmallTalk:
		base = LengthTarget{Label: "concise", MinChars: 20, MaxChars: 90, MinParas: 1, MaxParas: 1}
	case chatIntentCasualInfo:
		base = LengthTarget{Label: "normal", MinChars: 70, MaxChars: 220, MinParas: 1, MaxParas: 2}
	}

	// 5) profile.ResponseStyle 的「偏短」倾向：同级里下限再压一点，但不改 Label。
	if profileLeansShort(profile.ResponseStyle) && base.Label != "elaborate" {
		base.MinChars = maxInt(20, base.MinChars-20)
		base.MaxChars = maxInt(base.MinChars+40, base.MaxChars-60)
	}
	return base
}

func isNegativeEmotion(t string) bool {
	switch t {
	case "anxious", "frustrated", "angry", "confused":
		return true
	}
	return false
}

func profileLeansShort(responseStyle string) bool {
	s := strings.ToLower(strings.TrimSpace(responseStyle))
	if s == "" {
		return false
	}
	return strings.Contains(s, "短句") || strings.Contains(s, "简短") ||
		strings.Contains(s, "言简") || strings.Contains(s, "话少") ||
		strings.Contains(s, "几个字")
}

// --- 共情模式 ---

func resolveEmpathyMode(p PerceptionSnapshot) string {
	// 明确说了"只想吐槽 / 别给建议" → hold_space
	if p.MetaInstr.Present && (p.MetaInstr.Type == "stop_advice" || p.MetaInstr.Type == "empathy_only") {
		return "hold_space"
	}
	// 负面情绪且走向在恶化 → 抱持
	if isNegativeEmotion(p.Emotion.Type) && p.Arc.Trend == "worsening" {
		return "hold_space"
	}
	// 负面情绪但走向还算稳 / 在好转 → 先认同再建议
	if isNegativeEmotion(p.Emotion.Type) {
		return "after_validate"
	}
	// 困惑 → 镜像映射 + 引导
	if p.Emotion.Type == "confused" {
		return "mirror"
	}
	// 兴奋 → 跟随节奏
	if p.Emotion.Type == "excited" || p.Emotion.Type == "grateful" {
		return "lead"
	}
	return "none"
}

func resolveFocusMove(p PerceptionSnapshot, register string) string {
	if p.MetaInstr.Present {
		switch p.MetaInstr.Type {
		case "empathy_only", "stop_advice":
			return "listen_only"
		case "change_topic":
			return "ask_back"
		}
	}
	if register == "deep" && isNegativeEmotion(p.Emotion.Type) {
		return "validate_first"
	}
	if register == "smalltalk" {
		return "ask_back"
	}
	return "share_experience"
}

// --- 格式硬规则 ---

func buildFormatRules(p PerceptionSnapshot, length LengthTarget, empathy string, profile ProfileForAI) []string {
	rules := []string{}

	// 这一条是本次重构的关键修复：无论什么长度，都不要给 LLM「列标签分点」的许可。
	// 之前模型会自发产出「大一：… / 大二：… / 大三：…」的格式，humanizeReply 无法清洗。
	rules = append(rules,
		"禁止用「大X：」「第X年：」「阶段X：」「一、二、三」这类中文标签式分点；要点用自然语言串起来，一段讲一件事。",
	)

	// elaborate 模式下，还要防"每句一行"的短消息风格。
	if length.Label == "elaborate" {
		rules = append(rules,
			"这次要写得完整：每段内部是两三句连贯的话，不要把每一句都单独成行。段与段之间可以空一行分隔不同侧面。",
			"先讲感受和经历，再讲你当时怎么做的，最后再自然收束；不要像做 PPT 那样列 1/2/3。",
		)
	}

	if length.Label == "concise" {
		rules = append(rules,
			"控制在一两段内，宁可留白也不要把多个点堆在一起。",
		)
	}

	switch empathy {
	case "hold_space":
		rules = append(rules,
			"这轮以情绪承接为主，不要给建议、不要讲道理、也不要试图「帮对方解决」；让对方感到被听见就够了。",
		)
	case "after_validate":
		rules = append(rules,
			"先用一两句话接住情绪，再分享你自己类似经历里最有感触的一个片段；建议要给得克制，最多一两条，且必须从你的经历里自然长出来。",
		)
	case "lead":
		rules = append(rules,
			"跟上对方的节奏，可以短但别泼冷水；如果有提醒，顺带一句即可。",
		)
	}

	// 元指令专属规则
	if p.MetaInstr.Present {
		switch p.MetaInstr.Type {
		case "stop_advice":
			rules = append(rules, "对方明确说了不想听建议，本轮只做分享和陪伴，不给任何 advice。")
		case "change_topic":
			rules = append(rules, "对方想换话题，优雅地转向，不要继续旧话题的余温。")
		}
	}

	// 画像禁语复盘：已经在别处注入，不在这里重复
	_ = profile

	return rules
}

// lengthPromptHint 取代原来的 randomLengthHint()：产出一条和用户诉求锁定的确定性提示。
func lengthPromptHint(target LengthTarget, pref LengthPreference, register string) string {
	// 用户显式说了「详细点」→ 直接在 hint 里引用原话，让模型知道「你收到了」
	if pref.Source == "explicit" && pref.Direction == "elaborate" {
		return "对方这轮明确要求展开说（原话里提到「" + pref.Raw + "」），请写得完整连贯，控制在 200–500 字、2–4 段，段内多句成段而非一句一行。"
	}
	if pref.Source == "explicit" && pref.Direction == "concise" {
		return "对方这轮明确要求简短，直接在一两句话内把最想说的那一点讲清楚，不要超过 140 字。"
	}

	switch target.Label {
	case "elaborate":
		return "这轮把你最相关的经历完整讲一讲，" +
			charRange(target) +
			"，分两三个自然段（每段两三句连贯的话），不要用「大一：」「第X年：」之类的标签分点。"
	case "concise":
		if register == "smalltalk" {
			return "闲聊口吻，一两句话带过就好，" + charRange(target) + "。"
		}
		return "这轮简短回答，" + charRange(target) + "，只讲最想表达的那一点。"
	default: // normal
		return "像跟朋友聊一件事，" + charRange(target) + "，两三段以内，连贯叙述不要列表分点。"
	}
}

func charRange(t LengthTarget) string {
	return "大约 " + itoa(t.MinChars) + "–" + itoa(t.MaxChars) + " 字"
}

// --- 小工具 ---

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	sign := ""
	if n < 0 {
		sign = "-"
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	return sign + string(buf[i:])
}

func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func joinNonEmpty(sep string, parts ...string) string {
	nonEmpty := parts[:0]
	for _, p := range parts {
		if strings.TrimSpace(p) != "" {
			nonEmpty = append(nonEmpty, p)
		}
	}
	return strings.Join(nonEmpty, sep)
}
