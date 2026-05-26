package lifeagent

import (
	"math"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/agent-marketplace/backend/internal/models"
)

// NextSuggestion 每次调教后生成的单条下一步建议。
type NextSuggestion struct {
	RuleID        string  `json:"ruleId"`
	Type          string  `json:"type"`
	Title         string  `json:"title"`
	Reason        string  `json:"reason"`
	Prompt        string  `json:"prompt"`
	Priority      float64 `json:"priority"`
	EstimatedGain int     `json:"estimatedGain,omitempty"`
}

// NextSuggestionContext 生成下一步建议所需的 Agent 快照与本次调教上下文。
type NextSuggestionContext struct {
	Profile             *models.LifeAgentProfile
	Entries             []models.LifeAgentKnowledgeEntry
	Facts               []models.LifeAgentStructuredFact
	Topics              []models.LifeAgentTopicSummary
	HasVoice            bool
	FeedbackSignals     *FeedbackSignals
	TopicLabels         map[string]string
	BlindSpots          []BlindSpotForFollowUp
	LastMessage         string
	TurnCount           int
	RecentSuggestionIDs []string
	ToneChanged         bool
	ExampleRepliesChanged bool
}

type suggestionCandidate struct {
	suggestion NextSuggestion
	score      float64
}

var (
	personMentionRe = regexp.MustCompile(`(?:我和|跟|与|和|跟)([\p{Han}A-Za-z·]{2,8})(?:一起|经常|是|的|聊|吃|玩|见|认识|合作|工作)?`)
	opinionCueRe    = regexp.MustCompile(`(我觉得|我认为|我倾向|我更喜欢|我不认同|我反对|我支持|应该|不应该|一定要|千万别|最好|最差)`)
	experienceCueRe = regexp.MustCompile(`(当时|后来|曾经|以前|那次|经历|做过|去了|决定|选择|辞职|跳槽|考研|创业|失败|成功|踩坑)`)
	vagueAnswerRe   = regexp.MustCompile(`^(还行|一般|看情况|差不多|都可以|还好|还好吧|就那样|还好啦|还好吧|随便|不一定)[。！？!?.]*$`)
)

var highRiskTags = []string{
	"医疗", "法律", "投资", "金融", "理财", "情感", "心理", "抑郁", "焦虑", "婚恋", "移民", "签证",
}

// GenerateNextSuggestion 根据当前 Agent 状态与最近一次调教内容，生成 1 条优先级最高的建议。
func GenerateNextSuggestion(ctx NextSuggestionContext) *NextSuggestion {
	if ctx.Profile == nil {
		return nil
	}
	msg := strings.TrimSpace(ctx.LastMessage)
	var candidates []suggestionCandidate

	if msg != "" {
		candidates = append(candidates, rulePersonRelationship(ctx, msg)...)
		candidates = append(candidates, ruleExperienceJudgment(ctx, msg)...)
		candidates = append(candidates, ruleOpinionExample(ctx, msg)...)
		candidates = append(candidates, ruleNewFactUsage(ctx, msg)...)
		candidates = append(candidates, ruleDuplicateContent(ctx, msg)...)
		candidates = append(candidates, ruleVagueAnswer(ctx, msg)...)
	}
	candidates = append(candidates, ruleTagsWithoutExperience(ctx)...)
	candidates = append(candidates, ruleTopicPoorFeedback(ctx)...)
	candidates = append(candidates, ruleMissingToneSamples(ctx)...)
	candidates = append(candidates, ruleHighRiskBoundaries(ctx)...)
	candidates = append(candidates, ruleToneWithoutExamples(ctx)...)
	candidates = append(candidates, ruleFoundationGaps(ctx)...)

	if len(candidates) == 0 {
		return fallbackSuggestion(ctx)
	}

	best := candidates[0]
	for _, c := range candidates[1:] {
		if c.score > best.score {
			best = c
		}
	}
	if best.score < 0.15 {
		return fallbackSuggestion(ctx)
	}
	s := best.suggestion
	s.Priority = math.Round(best.score*100) / 100
	return &s
}

func rulePersonRelationship(ctx NextSuggestionContext, msg string) []suggestionCandidate {
	names := extractPersonNames(msg)
	if len(names) == 0 {
		return nil
	}
	known := knownRelationshipNames(ctx)
	var target string
	for _, n := range names {
		if !known[n] {
			target = n
			break
		}
	}
	if target == "" {
		return nil
	}
	impact := 0.9
	relevance := 1.0
	gap := 0.85
	ease := 0.9
	confidence := 0.8
	score := suggestionPriority(impact, relevance, gap, ease, confidence, "person_relationship", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "person_relationship",
			Type:          "add_relationship",
			Title:         "补充你和「" + target + "」的关系",
			Reason:        "你刚提到了 " + target + "，但 Agent 还不知道你们是什么关系、通常聊什么。",
			Prompt:        "补充一下你和" + target + "是什么关系？你们通常聊什么、为什么会一起出现？",
			EstimatedGain: 45,
		},
		score: score,
	}}
}

func ruleExperienceJudgment(ctx NextSuggestionContext, msg string) []suggestionCandidate {
	if !experienceCueRe.MatchString(msg) {
		return nil
	}
	if strings.Contains(msg, "因为") || strings.Contains(msg, "判断") || strings.Contains(msg, "标准") {
		return nil
	}
	score := suggestionPriority(0.85, 0.95, 0.75, 0.85, 0.75, "experience_judgment", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "experience_judgment",
			Type:          "add_judgment",
			Title:         "补充你当时的判断标准",
			Reason:        "你刚讲了一个经历，但还缺「为什么这么做」的判断逻辑，Agent 以后很难用你的方式回答类似问题。",
			Prompt:        "再补一句：你当时是怎么判断、为什么做出这个决定的？以后遇到类似情况，你会按什么标准来选？",
			EstimatedGain: 40,
		},
		score: score,
	}}
}

func ruleOpinionExample(ctx NextSuggestionContext, msg string) []suggestionCandidate {
	if !opinionCueRe.MatchString(msg) {
		return nil
	}
	if strings.Contains(msg, "比如") || strings.Contains(msg, "例如") || strings.Contains(msg, "举个例子") {
		return nil
	}
	score := suggestionPriority(0.8, 0.9, 0.7, 0.85, 0.7, "opinion_example", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "opinion_example",
			Type:          "add_example",
			Title:         "给这个观点举一个真实例子",
			Reason:        "你刚表达了一个观点，但还缺具体例子，Agent 容易说得像套话。",
			Prompt:        "围绕你刚才的观点，讲一个真实发生过的小例子：当时发生了什么、你最后怎么处理的？",
			EstimatedGain: 35,
		},
		score: score,
	}}
}

func ruleTagsWithoutExperience(ctx NextSuggestionContext) []suggestionCandidate {
	tags := ctx.Profile.ExpertiseTags
	if len(tags) < 3 {
		return nil
	}
	expCount := countExperiences(ctx.Entries)
	if expCount >= len(tags) {
		return nil
	}
	tag := tags[expCount%len(tags)]
	gap := math.Min(1.0, float64(len(tags)-expCount)/float64(len(tags)))
	score := suggestionPriority(0.75, 0.5, gap, 0.7, 0.85, "tag_experience", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "tag_experience",
			Type:          "add_experience",
			Title:         "为「" + tag + "」补一个真实经历",
			Reason:        "你有 " + strconv.Itoa(len(tags)) + " 个擅长标签，但真实经历偏少，回答容易泛泛而谈。",
			Prompt:        "讲一个和「" + tag + "」相关的真实经历：当时什么情况、你怎么做、最后学到了什么？",
			EstimatedGain: 50,
		},
		score: score,
	}}
}

func ruleTopicPoorFeedback(ctx NextSuggestionContext) []suggestionCandidate {
	if ctx.FeedbackSignals == nil {
		return nil
	}
	var worstID string
	var worstScore float64
	for topicID, stat := range ctx.FeedbackSignals.TopicStats {
		if stat.NotSpecific < 2 && stat.FactualError == 0 {
			continue
		}
		label := ctx.TopicLabels[topicID]
		if label == "" {
			continue
		}
		severity := float64(stat.NotSpecific)*0.6 + float64(stat.FactualError)*1.2 + float64(stat.Contradiction)*1.0
		if severity > worstScore {
			worstScore = severity
			worstID = topicID
		}
	}
	if worstID == "" {
		return nil
	}
	label := ctx.TopicLabels[worstID]
	gap := math.Min(1.0, worstScore/5.0)
	score := suggestionPriority(0.85, 0.55, gap, 0.65, 0.9, "topic_feedback", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "topic_feedback",
			Type:          "add_case",
			Title:         "为「" + label + "」补一个更具体的案例",
			Reason:        "用户在这个主题上反馈回答不够具体或有事实问题，补案例能明显提升质量。",
			Prompt:        "围绕「" + label + "」，讲一个更具体的案例：时间、地点、数字、你的判断过程都可以写进去。",
			EstimatedGain: 55,
		},
		score: score,
	}}
}

func ruleMissingToneSamples(ctx NextSuggestionContext) []suggestionCandidate {
	sampleCount := countStyleSamples(ctx.Profile, ctx.HasVoice)
	if sampleCount >= 4 {
		return nil
	}
	gap := math.Min(1.0, float64(4-sampleCount)/4.0)
	score := suggestionPriority(0.65, 0.45, gap, 0.8, 0.85, "tone_samples", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "tone_samples",
			Type:          "add_phrase",
			Title:         "补几句你平时会说的原话",
			Reason:        "Agent 还缺足够的语气样本，补几句你真实会说的话，口吻会更像你。",
			Prompt:        "随便写 2-3 句你平时真的会说的原话，可以是安慰朋友、给建议、或者吐槽时的说法。",
			EstimatedGain: 30,
		},
		score: score,
	}}
}

func ruleVagueAnswer(ctx NextSuggestionContext, msg string) []suggestionCandidate {
	if utf8.RuneCountInString(msg) > 40 {
		return nil
	}
	if !vagueAnswerRe.MatchString(msg) && !strings.Contains(msg, "看情况") {
		return nil
	}
	score := suggestionPriority(0.7, 0.85, 0.8, 0.9, 0.65, "vague_answer", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "vague_answer",
			Type:          "add_boundary",
			Title:         "把这个回答说得更具体一点",
			Reason:        "你刚才的回答偏笼统，Agent 以后也容易说「看情况」这类空话。",
			Prompt:        "围绕你刚才说的内容，补一个反例或边界：什么情况下你会不这么选？或者你会怎么具体判断？",
			EstimatedGain: 35,
		},
		score: score,
	}}
}

func ruleHighRiskBoundaries(ctx NextSuggestionContext) []suggestionCandidate {
	if strings.TrimSpace(ptrStrVal(ctx.Profile.NotSuitableFor)) != "" {
		return nil
	}
	var hit string
	for _, tag := range ctx.Profile.ExpertiseTags {
		for _, risk := range highRiskTags {
			if strings.Contains(tag, risk) {
				hit = tag
				break
			}
		}
		if hit != "" {
			break
		}
	}
	if hit == "" {
		return nil
	}
	score := suggestionPriority(0.9, 0.4, 0.95, 0.75, 0.9, "risk_boundary", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "risk_boundary",
			Type:          "add_boundary",
			Title:         "设置 Agent 不该回答的问题",
			Reason:        "你的 Agent 涉及「" + hit + "」这类高风险主题，建议明确哪些不能答。",
			Prompt:        "列出 2-3 类你不希望 Agent 回答的问题，比如需要专业资质、涉及隐私、或者你根本不想聊的话题。",
			EstimatedGain: 45,
		},
		score: score,
	}}
}

func ruleToneWithoutExamples(ctx NextSuggestionContext) []suggestionCandidate {
	if !ctx.ToneChanged && !ctx.ExampleRepliesChanged {
		return nil
	}
	if len(ctx.Profile.ExampleReplies) >= 2 {
		return nil
	}
	score := suggestionPriority(0.75, 0.8, 0.7, 0.85, 0.8, "tone_examples", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "tone_examples",
			Type:          "add_phrase",
			Title:         "给新语气配几句示范回答",
			Reason:        "你刚调整了语气或人设，但示范回答还偏少，Agent 不容易稳定模仿。",
			Prompt:        "写 2 条示范回答：就像你平时在微信里回复朋友那样，短一点、口语一点。",
			EstimatedGain: 35,
		},
		score: score,
	}}
}

func ruleNewFactUsage(ctx NextSuggestionContext, msg string) []suggestionCandidate {
	if utf8.RuneCountInString(msg) < 12 {
		return nil
	}
	if experienceCueRe.MatchString(msg) || opinionCueRe.MatchString(msg) {
		return nil
	}
	if extractPersonNames(msg) != nil {
		return nil
	}
	score := suggestionPriority(0.6, 0.9, 0.55, 0.8, 0.55, "fact_usage", ctx.RecentSuggestionIDs, ctx.TurnCount)
	return []suggestionCandidate{{
		suggestion: NextSuggestion{
			RuleID:        "fact_usage",
			Type:          "add_context",
			Title:         "说明这条信息什么时候该用",
			Reason:        "你刚补充了新信息，但 Agent 还不知道什么场景下该拿出来讲。",
			Prompt:        "补充一下：用户问什么类型的问题时，你才希望 Agent 提到刚才这条信息？有没有不适合提的场景？",
			EstimatedGain: 30,
		},
		score: score,
	}}
}

func ruleDuplicateContent(ctx NextSuggestionContext, msg string) []suggestionCandidate {
	msgNorm := normalizeForCompare(msg)
	if msgNorm == "" {
		return nil
	}
	for _, e := range ctx.Entries {
		if similarityRatio(msgNorm, normalizeForCompare(e.Content)) > 0.72 {
			score := suggestionPriority(0.55, 0.85, 0.65, 0.7, 0.7, "duplicate_content", ctx.RecentSuggestionIDs, ctx.TurnCount)
			return []suggestionCandidate{{
				suggestion: NextSuggestion{
					RuleID:        "duplicate_content",
					Type:          "add_variation",
					Title:         "换个方向补充新内容",
					Reason:        "这条内容和已有记忆很接近，Agent 容易重复自己。",
					Prompt:        "试着从另一个角度补充：不同场景、不同结果，或者你后来有没有改变看法？",
					EstimatedGain: 25,
				},
				score: score,
			}}
		}
	}
	return nil
}

func ruleFoundationGaps(ctx NextSuggestionContext) []suggestionCandidate {
	p := ctx.Profile
	var out []suggestionCandidate
	if strings.TrimSpace(p.WelcomeMessage) == "" {
		out = append(out, candidateFoundation("welcome", "补一段欢迎语", "欢迎语还是空的，用户第一眼会觉得 Agent 还没准备好。", "写一段你平时怎么跟新朋友打招呼的欢迎语，20-60 字就行。", 25, 0.55, ctx.RecentSuggestionIDs, ctx.TurnCount))
	}
	if len(p.ExampleReplies) < 2 {
		out = append(out, candidateFoundation("examples", "补 2 条示范回答", "示范回答偏少，Agent 不容易学会你的说话方式。", "写 2 条你平时真的会这样回复朋友的话。", 30, 0.6, ctx.RecentSuggestionIDs, ctx.TurnCount))
	}
	if len(p.ExpertiseTags) < 3 {
		out = append(out, candidateFoundation("tags", "再补几个擅长标签", "擅长标签还偏少，用户不容易知道该问你什么。", "再写 2-3 个你真正擅长、也愿意聊的主题标签。", 20, 0.5, ctx.RecentSuggestionIDs, ctx.TurnCount))
	}
	return out
}

func candidateFoundation(ruleID, title, reason, prompt string, gain int, impact float64, recent []string, turnCount int) suggestionCandidate {
	score := suggestionPriority(impact, 0.35, 0.6, 0.85, 0.9, ruleID, recent, turnCount)
	return suggestionCandidate{
		suggestion: NextSuggestion{
			RuleID: ruleID, Type: "foundation", Title: title, Reason: reason, Prompt: prompt, EstimatedGain: gain,
		},
		score: score,
	}
}

func fallbackSuggestion(ctx NextSuggestionContext) *NextSuggestion {
	score := ComputeMindScore(MindScoreInput{
		Profile: ctx.Profile, Entries: ctx.Entries, Facts: ctx.Facts, Topics: ctx.Topics, HasVoice: ctx.HasVoice,
	})
	if score.Experience < score.TopicCoverage {
		return &NextSuggestion{
			RuleID: "fallback_experience", Type: "add_experience",
			Title: "讲一个最近印象深的真实经历",
			Reason: "再补一条具体经历，能让 Agent 的回答更有你的个人色彩。",
			Prompt: "讲一个最近印象比较深的真实经历：发生了什么、你怎么想、最后结果如何？",
			Priority: 0.4, EstimatedGain: 35,
		}
	}
	return &NextSuggestion{
		RuleID: "fallback_depth", Type: "add_depth",
		Title: "把某个主题说得更深一点",
		Reason: "你的 Agent 已有基础资料，继续往深处补细节会更有成长感。",
		Prompt: "选一个你最擅长的话题，补充一个带数字、时间或具体场景的细节。",
		Priority: 0.35, EstimatedGain: 30,
	}
}

func suggestionPriority(impact, relevance, gap, ease, confidence float64, ruleID string, recent []string, turnCount int) float64 {
	repeatPenalty := 0.0
	for _, id := range recent {
		if id == ruleID {
			repeatPenalty = 0.35
			break
		}
	}
	fatiguePenalty := 0.0
	if turnCount >= 8 {
		fatiguePenalty = 0.1
	}
	return impact*relevance*gap*ease*confidence - repeatPenalty - fatiguePenalty
}

func extractPersonNames(msg string) []string {
	seen := map[string]struct{}{}
	var names []string
	for _, m := range personMentionRe.FindAllStringSubmatch(msg, -1) {
		if len(m) < 2 {
			continue
		}
		name := strings.TrimSpace(m[1])
		if name == "" || isCommonWord(name) {
			continue
		}
		if _, ok := seen[name]; ok {
			continue
		}
		seen[name] = struct{}{}
		names = append(names, name)
	}
	return names
}

func knownRelationshipNames(ctx NextSuggestionContext) map[string]bool {
	known := map[string]bool{}
	for _, f := range ctx.Facts {
		key := strings.ToLower(f.FactKey)
		if strings.Contains(key, "person") || strings.Contains(key, "relationship") || strings.Contains(key, "人物") || strings.Contains(key, "关系") {
			known[strings.TrimSpace(f.FactValue)] = true
		}
	}
	for _, e := range ctx.Entries {
		cat := strings.ToLower(e.Category)
		if strings.Contains(cat, "关系") || strings.Contains(cat, "人物") {
			known[strings.TrimSpace(e.Title)] = true
		}
	}
	return known
}

func isCommonWord(s string) bool {
	common := []string{"我们", "大家", "别人", "自己", "朋友", "同事", "老师", "同学", "家人", "父母", "老板", "客户"}
	for _, c := range common {
		if s == c {
			return true
		}
	}
	return false
}

func normalizeForCompare(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = regexp.MustCompile(`\s+`).ReplaceAllString(s, "")
	return s
}

func similarityRatio(a, b string) float64 {
	if a == "" || b == "" {
		return 0
	}
	if strings.Contains(a, b) || strings.Contains(b, a) {
		shorter := float64(utf8.RuneCountInString(a))
		longer := float64(utf8.RuneCountInString(b))
		if shorter > longer {
			shorter, longer = longer, shorter
		}
		if longer == 0 {
			return 0
		}
		return shorter / longer
	}
	return 0
}
