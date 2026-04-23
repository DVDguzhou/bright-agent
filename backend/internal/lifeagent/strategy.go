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
	// 锚点设计口径：「经验分享 + 情绪陪伴」是核心业务，来人就是来听真实经历的，
	// 所以 deep_consult 的默认下限必须足够厚，才压得住"微信感 → 一两句话"的惯性。
	base := LengthTarget{Label: "normal", MinChars: 90, MaxChars: 260, MinParas: 1, MaxParas: 3}
	asksForExperience := looksLikeExperienceQuery(p.RawMessage)
	switch p.Intent {
	case chatIntentDeepConsult:
		switch {
		case isNegativeEmotion(p.Emotion.Type) || p.Arc.Trend == "worsening":
			// 负面情绪：先承接再展开，适当更长
			base = LengthTarget{Label: "elaborate", MinChars: 240, MaxChars: 560, MinParas: 2, MaxParas: 4}
		case asksForExperience:
			// 「秋招怎么准备 / 留学怎么准备 / 有什么经验」等取经型提问：直接按 elaborate 给
			base = LengthTarget{Label: "elaborate", MinChars: 260, MaxChars: 600, MinParas: 2, MaxParas: 4}
		default:
			base = LengthTarget{Label: "normal", MinChars: 180, MaxChars: 460, MinParas: 2, MaxParas: 3}
		}
	case chatIntentSmallTalk:
		base = LengthTarget{Label: "concise", MinChars: 20, MaxChars: 90, MinParas: 1, MaxParas: 1}
	case chatIntentCasualInfo:
		// 资讯类问题命中"求经验"句式时也适度抬升，不然「怎么准备」会被当成快问快答
		if asksForExperience {
			base = LengthTarget{Label: "normal", MinChars: 160, MaxChars: 400, MinParas: 2, MaxParas: 3}
		} else {
			base = LengthTarget{Label: "normal", MinChars: 90, MaxChars: 260, MinParas: 1, MaxParas: 2}
		}
	}

	// 5) profile.ResponseStyle 的「偏短」倾向：同级里下限再压一点，但不改 Label。
	//
	// 例外：用户明确在问"怎么准备 / 有什么经验"这类取经型问题时，profile 的默认调性
	// 要让位于用户当下的具体诉求——总不能一个说"回答简洁"的 agent 被问秋招经验时还回
	// "加油努力吧" 三个字。同理，用户本轮显式说"详细点"、或处于负面情绪需要承接时，
	// 也不再按 profile 偏短来压。
	overridesShortProfile := asksForExperience ||
		(p.LengthPref.Source == "explicit" && p.LengthPref.Direction == "elaborate") ||
		isNegativeEmotion(p.Emotion.Type)
	if profileLeansShort(profile.ResponseStyle) && base.Label != "elaborate" && !overridesShortProfile {
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

// looksLikeExperienceQuery 识别"求经验/取经"型提问。
// 命中这些模式时，即使没有显式"详细点"诉求，也认为用户天然期望一条够厚、带亲历细节的回答。
// 核心业务是经验分享，这里宁可宽一点也不要漏掉"秋招怎么准备""留学怎么走"这种典型场景。
func looksLikeExperienceQuery(message string) bool {
	m := strings.ToLower(strings.TrimSpace(message))
	if m == "" {
		return false
	}
	// 纯"怎么"太泛会误伤（比如"怎么回事"），所以要组合关键词
	cues := []string{
		"怎么准备", "如何准备", "怎么规划", "如何规划",
		"怎么选择", "如何选择", "怎么走", "怎么走过来", "怎么过来",
		"怎么做到", "如何做到", "怎么搞", "怎么办到",
		"有什么建议", "有什么经验", "有什么心得", "有什么套路",
		"有啥建议", "有啥经验",
		"你当时", "你是怎么", "你怎么", "你当初", "你那会",
		"经验分享", "过来人", "踩过的坑", "趟过的雷",
		"从头讲", "详细讲讲", "讲讲你",
		"需要准备什么", "要准备什么", "要做什么准备",
	}
	for _, c := range cues {
		if strings.Contains(m, c) {
			return true
		}
	}
	// 英文常见求经验模式
	enCues := []string{"how to prepare", "how do you", "any advice", "any tips", "your experience", "walk me through"}
	for _, c := range enCues {
		if strings.Contains(m, c) {
			return true
		}
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
		// 严禁"每句话独立成行"的卡片感。这是模型在引用知识库短条目时最容易滑向的格式。
		"同一件事情不要一句一行地甩出来——相关的几句要用「，」「。」「还有」「不过」之类自然连起来，写成完整的一段。真人在微信里不会这样分行发。",
	)

	// elaborate 模式下，还要防"每句一行"的短消息风格，并且必须明确对抗
	// 系统提示里"宁可说少一点"的底层默认——否则这类"怎么准备"的问题会被压成一段话。
	if length.Label == "elaborate" {
		rules = append(rules,
			"这次要写得完整：每段内部是两三句连贯的话，不要把每一句都单独成行。段与段之间可以空一行分隔不同侧面。",
			"先讲感受和经历，再讲你当时怎么做的，最后再自然收束；不要像做 PPT 那样列 1/2/3。",
			// 这一条就是针对用户反馈"还不够详细"的直接对冲：
			"对方来找你就是来听你的真实经历的。这轮有理由写长：把你真实做过的事、当时具体的时间线、投了多少家/看了多少学校/花了多少钱、心里的纠结和转变，挑能讲的具体展开。之前系统提示里说「宁可说少一点」是指别讲空洞的道理，不是让你压缩亲历细节——亲历细节越具体越好。",
		)
	}

	if length.Label == "concise" {
		rules = append(rules,
			"控制在一两段内，宁可留白也不要把多个点堆在一起。",
		)
	}

	if length.Label == "normal" {
		// normal 也加一条"别过度压缩经历"的软提示，防止 deep_consult 默认走保守路线时被压得过短
		rules = append(rules,
			"别因为「真人微信感」就把经历讲得太干——至少带一到两处具体细节（数字、地名、公司名、时间点），让对方感觉是真听到了一段故事。",
		)
	}

	// profile 自带"简洁/短句"倾向、但用户明显在求经验时，本轮用户诉求优先。
	// 不盖过整体人设（还是这个人在说话），只豁免"简短"这一项默认。
	if looksLikeExperienceQuery(p.RawMessage) && profileLeansShort(profile.ResponseStyle) {
		rules = append(rules,
			"你平时回答偏简短，但对方这轮在明确取经——人设里的「简洁」默认本轮让位给具体经验。语气维持你本人的味道（冷淡/直接/爱吐槽都行），但内容要给得足，不能敷衍成一两句。",
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
