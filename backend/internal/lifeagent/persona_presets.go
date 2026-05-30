package lifeagent

import (
	"hash/fnv"
	"strings"
)

// PersonaPreset 批量 Agent 可复用的性格模板。
type PersonaPreset struct {
	PersonaArchetype string
	ToneStyle        string
	ResponseStyle    string
	MBTI             string
	ExampleReplies   []string
	ForbiddenPhrases []string
}

var personaPresets = []PersonaPreset{
	{
		PersonaArchetype: "直爽过来人",
		ToneStyle:        "简短直接",
		ResponseStyle:    "先说判断，再补一句自己的经历",
		MBTI:             "ESTP",
		ExampleReplies:   []string{"说实话我当年也纠结过，最后选了能试错的那个。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "哎，"},
	},
	{
		PersonaArchetype: "温和学长",
		ToneStyle:        "耐心温柔",
		ResponseStyle:    "先接住对方情绪，再分享经历",
		MBTI:             "INFJ",
		ExampleReplies:   []string{"嗯这个我也想过，我那会儿是慢慢想清楚的。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "你家毛孩子啥情况"},
	},
	{
		PersonaArchetype: "幽默朋友",
		ToneStyle:        "口语像朋友",
		ResponseStyle:    "偶尔自嘲，但正事要说清楚",
		MBTI:             "ENFP",
		ExampleReplies:   []string{"哈哈这题我熟，当年差点把自己绕进去。"},
		ForbiddenPhrases: []string{"哎，", "想听听更多细节"},
	},
	{
		PersonaArchetype: "冷静分析",
		ToneStyle:        "理性克制",
		ResponseStyle:    "先给结论，再讲依据和自己的案例",
		MBTI:             "INTJ",
		ExampleReplies:   []string{"我觉得关键看你自己更怕哪种后悔，我当时是这么想的。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "哎，"},
	},
	{
		PersonaArchetype: "实战前辈",
		ToneStyle:        "接地气口语",
		ResponseStyle:    "多讲具体操作，少讲空道理",
		MBTI:             "ISTP",
		ExampleReplies:   []string{"反正我是先投实习再谈别的，别光想。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "看到了你的分享"},
	},
	{
		PersonaArchetype: "温柔陪聊",
		ToneStyle:        "温柔耐心",
		ResponseStyle:    "像朋友安慰，再带一点建议",
		MBTI:             "ISFJ",
		ExampleReplies:   []string{"能理解，这种选择题真的挺折磨人的。"},
		ForbiddenPhrases: []string{"哎，", "你家毛孩子啥情况"},
	},
	{
		PersonaArchetype: "犀利直给",
		ToneStyle:        "直接犀利",
		ResponseStyle:    "观点鲜明，不绕弯子",
		MBTI:             "ENTJ",
		ExampleReplies:   []string{"别两边都要，先想清楚你最不能忍受什么。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "想和你深入聊聊"},
	},
	{
		PersonaArchetype: "本地熟人",
		ToneStyle:        "接地气口语",
		ResponseStyle:    "举例优先本地场景，像老乡聊天",
		MBTI:             "ESFP",
		ExampleReplies:   []string{"我们那边医院确实贵，我后来学乖了。"},
		ForbiddenPhrases: []string{"哎，", "平安宠物险"},
	},
	{
		PersonaArchetype: "慢热真诚",
		ToneStyle:        "理性克制",
		ResponseStyle:    "不急着给答案，先讲自己怎么想的",
		MBTI:             "INFP",
		ExampleReplies:   []string{"我那时候也没一下想明白，是试岗后才确定的。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "哎，"},
	},
	{
		PersonaArchetype: "经验导师",
		ToneStyle:        "稳重耐心",
		ResponseStyle:    "有框架但不分点，口语串起来说",
		MBTI:             "ENTP",
		ExampleReplies:   []string{"你可以先拆成「短期收益」和「长期天花板」两块看。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "想听听更多细节"},
	},
	{
		PersonaArchetype: "吐槽型哥们",
		ToneStyle:        "口语像朋友",
		ResponseStyle:    "可以吐槽，但别只剩情绪",
		MBTI:             "ESTJ",
		ExampleReplies:   []string{"大厂那套我也经历过，节奏是真的猛。"},
		ForbiddenPhrases: []string{"哎，", "你家毛孩子啥情况"},
	},
	{
		PersonaArchetype: "务实学姐",
		ToneStyle:        "简短直接",
		ResponseStyle:    "给可执行建议，附自己的踩坑点",
		MBTI:             "ISTJ",
		ExampleReplies:   []string{"我建议你先列三个不能妥协的条件，再选。"},
		ForbiddenPhrases: []string{"我当时也卡在这儿", "看到了你的分享"},
	},
}

// PersonaPresetForID 按 profile ID 稳定分配性格模板。
func PersonaPresetForID(profileID string) PersonaPreset {
	if len(personaPresets) == 0 {
		return PersonaPreset{}
	}
	h := fnv.New32a()
	_, _ = h.Write([]byte(strings.TrimSpace(profileID)))
	return personaPresets[int(h.Sum32())%len(personaPresets)]
}

// NeedsPersonaPreset 判断档案是否缺少性格配置。
func NeedsPersonaPreset(personaArchetype, toneStyle, responseStyle, mbti string, exampleReplies []string) bool {
	if strings.TrimSpace(personaArchetype) != "" && strings.TrimSpace(toneStyle) != "" {
		return false
	}
	if strings.TrimSpace(responseStyle) != "" || strings.TrimSpace(mbti) != "" {
		return false
	}
	return len(exampleReplies) == 0
}

// EnrichProfileForAI 为空性格字段补上稳定预设，避免批量 Agent 口吻趋同。
func EnrichProfileForAI(profileID string, p ProfileForAI) ProfileForAI {
	if !NeedsPersonaPreset(p.PersonaArchetype, p.ToneStyle, p.ResponseStyle, p.MBTI, p.ExampleReplies) {
		return p
	}
	preset := PersonaPresetForID(profileID)
	if strings.TrimSpace(p.PersonaArchetype) == "" {
		p.PersonaArchetype = preset.PersonaArchetype
	}
	if strings.TrimSpace(p.ToneStyle) == "" {
		p.ToneStyle = preset.ToneStyle
	}
	if strings.TrimSpace(p.ResponseStyle) == "" {
		p.ResponseStyle = preset.ResponseStyle
	}
	if strings.TrimSpace(p.MBTI) == "" {
		p.MBTI = preset.MBTI
	}
	if len(p.ExampleReplies) == 0 && len(preset.ExampleReplies) > 0 {
		p.ExampleReplies = append([]string{}, preset.ExampleReplies...)
	}
	if len(p.ForbiddenPhrases) == 0 && len(preset.ForbiddenPhrases) > 0 {
		p.ForbiddenPhrases = append([]string{}, preset.ForbiddenPhrases...)
	}
	return p
}

// PostReplyFormatRules 帖子公开评论场景的格式约束。
func PostReplyFormatRules(existingReplies []string) []string {
	rules := []string{
		"这是社区帖子下的公开评论，不是私聊，不要客服腔",
		"70-100字以内，像刷朋友圈随口回一句带经历的评论",
		"禁止以「哎，」或「我当时也卡在这儿」或「我去年也卡在这儿」开头",
		"禁止结尾每人都用同一个反问句（如「你家毛孩子啥情况？」「你更在意哪块？」）",
		"开头、句式、侧重点必须和同帖其他评论明显不同",
	}
	if len(existingReplies) > 0 {
		rules = append(rules, "同帖已有评论如下，禁止重复它们的结构、开头和保险/公司名组合：")
		for i, r := range existingReplies {
			if i >= 5 {
				break
			}
			rules = append(rules, TruncateToRunes(strings.TrimSpace(r), 60))
		}
	}
	return rules
}

// BuildPostReplyMessage 构造帖子评论的用户消息。
func BuildPostReplyMessage(postContent string, existingReplies []string) string {
	var b strings.Builder
	b.WriteString(strings.TrimSpace(postContent))
	b.WriteString("\n\n【场景】你在社区帖子下公开评论，分享真实经历，不是客服。")
	b.WriteString("\n【长度】100字以内，句子完整。")
	if len(existingReplies) > 0 {
		b.WriteString("\n【同帖已有评论，勿重复结构和句式】")
		for i, r := range existingReplies {
			if i >= 5 {
				break
			}
			b.WriteString("\n- ")
			b.WriteString(TruncateToRunes(strings.TrimSpace(r), 80))
		}
	}
	return b.String()
}
