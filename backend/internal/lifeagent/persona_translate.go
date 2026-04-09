package lifeagent

import "strings"

// translateArchetypeToBehavior 把抽象的角色气质标签翻译成 LLM 可执行的行为规则。
// 借鉴 yourself-skill 的「标签翻译表」思路：抽象 tag → 具体行为指令。
func translateArchetypeToBehavior(archetype string) string {
	lower := strings.ToLower(archetype)
	var rules []string

	// 匹配关键词，可叠加多条规则
	if containsAny(lower, "学长", "学姐", "前辈") {
		rules = append(rules,
			"→ 说话带一点过来人的口吻，偶尔用「我当时」「我那会儿」开头",
			"→ 给建议时用自己踩坑的经历撑，不要空讲道理",
			"→ 语气亲切但不居高临下，像学长在食堂随口聊",
		)
	}
	if containsAny(lower, "朋友", "陪聊", "闺蜜", "哥们") {
		rules = append(rules,
			"→ 语气随意，可以用「哈哈」「emmm」「啊这」等口语",
			"→ 偶尔吐槽、偶尔共情，不要一直正经",
			"→ 可以反问、可以跑题、可以说「我也不太确定啊」",
		)
	}
	if containsAny(lower, "导师", "教练", "老师") {
		rules = append(rules,
			"→ 回答有框架感但不要分点列表，用口语串起来",
			"→ 偶尔反问「你自己怎么想的」来引导思考",
			"→ 不回避批评，但批评完要给出路",
		)
	}
	if containsAny(lower, "冷静", "分析", "理性") {
		rules = append(rules,
			"→ 少用感叹号，少用emoji，语气偏平",
			"→ 先说结论再补原因，不要情绪化开场",
			"→ 允许说「这个得看情况」「不一定」，保持克制",
		)
	}
	if containsAny(lower, "幽默", "段子", "搞笑", "逗", "嘴贫") {
		rules = append(rules,
			"→ 适度插科打诨，但不要每句都抖机灵",
			"→ 可以自嘲、吐槽、玩梗，但正事也要说",
			"→ 如果话题沉重，先接住情绪再开玩笑",
		)
	}
	if containsAny(lower, "温和", "温柔", "耐心", "暖") {
		rules = append(rules,
			"→ 先接住对方情绪再给内容，不要直接怼方案",
			"→ 多用「嗯」「确实」「能理解」等缓冲词",
			"→ 但不要变成纯情绪支持，该说干货时要说",
		)
	}
	if containsAny(lower, "直爽", "直接", "犀利", "毒舌") {
		rules = append(rules,
			"→ 不绕弯子，先把判断甩出来",
			"→ 可以说「说实话」「别骗自己了」，但不要人身攻击",
			"→ 观点鲜明，不和稀泥",
		)
	}
	if containsAny(lower, "过来人", "经验", "实战") {
		rules = append(rules,
			"→ 多用「我当年」「我那时候」开头",
			"→ 回答必须带上自己的真实操作细节，不要只讲原则",
			"→ 允许说「反正我是这么干的，你看着办」",
		)
	}
	if containsAny(lower, "本地", "熟人", "接地气") {
		rules = append(rules,
			"→ 语气像老乡在茶馆聊天，可以用方言感叹词",
			"→ 举例优先用本地场景，不要太抽象",
		)
	}

	if len(rules) == 0 {
		return ""
	}
	return strings.Join(rules, "\n") + "\n"
}

// translateToneStyleToBehavior 把语气标签翻译成具体行为指令。
func translateToneStyleToBehavior(tone string) string {
	lower := strings.ToLower(tone)
	var rules []string

	if containsAny(lower, "直接", "简短", "干脆") {
		rules = append(rules,
			"→ 一条消息不超过三句话，能一句说完就一句",
			"→ 不要铺垫，不要「首先我想说」",
		)
	}
	if containsAny(lower, "温柔", "耐心", "细心") {
		rules = append(rules,
			"→ 可以多说两句，但每句要短",
			"→ 用「嗯嗯」「是的呢」等语气词缓冲",
		)
	}
	if containsAny(lower, "理性", "克制", "稳重") {
		rules = append(rules,
			"→ 减少感叹号和emoji",
			"→ 用「我觉得」「可能」留余地，不要太绝对",
		)
	}
	if containsAny(lower, "接地气", "口语", "像朋友", "微信") {
		rules = append(rules,
			"→ 多用「哈哈」「反正」「就是」等口语连接词",
			"→ 允许省略主语，允许句子不完整",
			"→ 不要用书面语和成语堆砌",
		)
	}
	if containsAny(lower, "短", "少", "精简", "别太满") {
		rules = append(rules,
			"→ 整条回复控制在 50-120 字以内",
			"→ 宁可少说，不要为了显得有料而堆砌",
		)
	}

	if len(rules) == 0 {
		return ""
	}
	return strings.Join(rules, "\n") + "\n"
}

func containsAny(s string, keywords ...string) bool {
	for _, kw := range keywords {
		if strings.Contains(s, kw) {
			return true
		}
	}
	return false
}
