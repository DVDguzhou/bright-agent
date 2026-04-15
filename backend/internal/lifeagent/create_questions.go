package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// CreateQuestionInput 创建流程中「生成下一个问题」的请求
type CreateQuestionInput struct {
	BasicInfo struct {
		DisplayName string `json:"displayName"`
		Headline    string `json:"headline"`
		ShortBio    string `json:"shortBio"`
	} `json:"basicInfo"`
	ChatHistory      []ChatMessageForAI `json:"chatHistory"`
	KnowledgeEntries []struct {
		Category string `json:"category"`
		Title    string `json:"title"`
		Content  string `json:"content"`
	} `json:"knowledgeEntries"`
}

// CreateQuestionOutput 生成结果：下一问、或完成信号，以及暗中提取的语气风格
type CreateQuestionOutput struct {
	Done              bool            `json:"done"`                              // 是否已收集足够信息
	NextQuestion      string          `json:"nextQuestion,omitempty"`            // 下一个问题（done=false 时）
	QuestionDimension string          `json:"questionDimension,omitempty"`       // fact|decision|regret|adaptation|advice
	SummaryMessage    string          `json:"summaryMessage,omitempty"`          // 完成时的收尾话（done=true 时）
	KnowledgeAdd      []KEntry        `json:"knowledgeAdd,omitempty"`            // 本轮回答可提炼的知识条目（AI 可选返回）
	ExtractedTone     *ToneHints      `json:"extractedTone,omitempty"`           // 从用户回复中学习的语气风格
	SuggestedTags     []string        `json:"suggestedTags,omitempty"`           // 建议的擅长标签
	FactCandidates    []FactCandidate `json:"factCandidates,omitempty"`          // 可升级为结构化事实的候选项
}

type KEntry struct {
	Category string   `json:"category"`
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Tags     []string `json:"tags,omitempty"`
}

type ToneHints struct {
	PersonaArchetype string `json:"personaArchetype,omitempty"`
	ToneStyle        string `json:"toneStyle,omitempty"`
	ResponseStyle    string `json:"responseStyle,omitempty"`
}

// GenerateNextCreateQuestion 根据对话历史生成下一个问题，或判断是否已收集足够信息
// 暗中从用户回复中学习其语气风格，用于后续 Agent 人格设定
func GenerateNextCreateQuestion(ctx context.Context, apiKey, model, baseURL string, input *CreateQuestionInput) (*CreateQuestionOutput, error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		return fallbackNextQuestion(input), nil
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	systemPrompt := `你是在帮助用户创建「人生 Agent」的采访助手。用户会通过对话逐步分享自己的经历、经验，你要通过提问引导他们输出全面、具体、对未来咨询者最有价值的信息。

【你的目标】
1. 根据用户已分享的内容，提出下一个追问，沿七个维度逐步挖深，如果某个维度不适用当前主题，则跳过该维度：
   a) 具体事实：步骤、时间线、数字、结果
   b) 决策过程：当时有哪些选项、为什么选了这个、犹豫的点是什么
   c) 后悔与意外：回头看最大的误判是什么、有什么当时不知道但现在觉得很重要的
   d) 对不同背景的判断：如果来问你的人背景和你不同（专业不同、城市不同、资金不同），你的建议会有什么区别
   e) 最想告诉后来人的一句话：如果有个人正站在你当时的位置，你最想提醒他什么
   f) 当前状态：你现在这个领域/行业的最新情况怎么样？跟你当时比有什么变化？（用于收集时效性信息）
   g) 本地实况：你所在的城市/地区目前在这方面的情况怎么样？比如当地政策、物价水平、租房行情、学区资源、社区氛围、求职环境等（用于收集地方性信息，让 Agent 能回答「你那边怎么样」「杭州现在XX如何」类问题）
2. 仔细观察用户的说话风格，在 extractedTone 中给出具体描述（不是选枚举值，而是用用户实际表现来描述）。
3. 当用户已经分享了至少 2 个主题、每个主题都覆盖了决策过程和具体细节，且没有明显可追问的点时，输出 done=true，用 summaryMessage 友好收尾。

【追问策略】
- 用户讲了一个经历的结果后→追问决策过程（"当时还考虑过什么别的选择吗？"）
- 用户讲了决策过程后→追问后悔与意外（"做了这个选择之后，有没有什么出乎意料的？"）
- 用户讲了自己的判断后→追问对不同背景的适用性（"如果是一个xxx背景的人来问你同样的问题，你的建议会不一样吗？"）
- 用户讲了足够深的单一主题后→根据当前状态，决定追问当前状态（"你觉得现在这个行业/领域跟你当时比变化大吗？最新情况是什么样的？"）
- 用户讲了当前状态后→追问本地实况（"你那边现在这方面的环境怎么样？比如当地的政策、价格、资源这些有什么特别的吗？"）
- 用户讲了本地实况后→换到另一个主题方向

【输出格式】必须严格输出一个 JSON 对象，不要 markdown 代码块、不要额外说明：
{
  "done": false,
  "nextQuestion": "下一个问题，自然口语化，一次只问一个方向",
  "questionDimension": "fact|decision|regret|adaptation|advice|current|local 之一，标记本次追问所属维度",
  "extractedTone": {
    "personaArchetype": "基于用户实际表现描述，如：说话直来直去带点自嘲的过来人、温和但有主见的学姐、嘴贫但干货多的技术人",
    "toneStyle": "基于用户实际用词描述，如：句子偏短，爱用省略号，偶尔用哈哈，不用emoji，语气比较随意口语化",
    "responseStyle": "基于用户回答习惯描述，如：先给结论再补细节，喜欢举自己例子，一段话3-5句，不爱铺垫直入主题"
  },
  "suggestedTags": ["标签1", "标签2"],
  "knowledgeAdd": [],
  "factCandidates": []
}

当 done=true 时：
{
  "done": true,
  "summaryMessage": "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」继续设置 Agent 的回答风格即可～",
  "extractedTone": { ... },
  "suggestedTags": [ ... ]
}

【规则】
- 每次只问一个问题，不要一次问多个。
- 追问要基于用户上一句或之前的内容，不要跳脱。
- 不要反复在同一个维度上追问。如果连续两轮都在问"具体事实"，下一轮应该转到"决策过程"或"后悔与意外"或"当前状态"。
- 用户回答「暂无」「无」「没有」等时，可适当换个维度或方向问，或若已有足够信息则结束。
- extractedTone 不要选枚举值，要基于用户实际回复的用词、句式、长度、语气词来具体描述。例如：用户爱用"反正""其实""说白了"这类词→写到 toneStyle 里；用户回答很长很细→写到 responseStyle 里。每轮都更新，越来越准。
- suggestedTags 最多 8 个，基于用户分享的领域提炼。
- knowledgeAdd 可选：若用户某段回复可直接作为一条「知识条目」存储（有明确 category/title/content），可填；否则留空数组。对于决策过程、后悔、建议类回答，category 建议用「决策经验」「踩坑教训」「给后来人的建议」。对于当前状态类回答，category 建议用「最新动态」「行业近况」。对于本地实况类回答，category 建议用「本地情报」「当地政策」「当地资源」，并在 tags 里加入具体城市/区域名。
- factCandidates 可选：若用户明确说出学校、学历、工作、城市、比赛名等事实，可抽成结构化事实候选；若不明确则留空数组。`

	// 构建对话内容
	var historyText strings.Builder
	for _, m := range input.ChatHistory {
		role := "用户"
		if m.Role == "assistant" {
			role = "助手"
		}
		historyText.WriteString(fmt.Sprintf("%s：%s\n", role, m.Content))
	}

	var entriesText strings.Builder
	for _, e := range input.KnowledgeEntries {
		entriesText.WriteString(fmt.Sprintf("- %s / %s：%s\n", e.Category, e.Title, truncate(e.Content, 120)))
	}

	basic := input.BasicInfo
	userContent := fmt.Sprintf(`【创建者基本信息】
- 名称：%s
- 一句话：%s
- 简介：%s

【已有知识条目】
%s

【对话历史】
%s

请根据以上内容，生成下一个问题或判断是否结束。只输出 JSON。`,
		basic.DisplayName,
		basic.Headline,
		truncate(basic.ShortBio, 200),
		entriesText.String(),
		historyText.String(),
	)

	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model:       model,
		Messages:    []openai.ChatCompletionMessage{{Role: openai.ChatMessageRoleSystem, Content: systemPrompt}, {Role: openai.ChatMessageRoleUser, Content: userContent}},
		Temperature:         safeTemperature(model, 0.5),
		MaxCompletionTokens: 1000,
	})
	if err != nil {
		return fallbackNextQuestion(input), nil
	}

	if len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		return fallbackNextQuestion(input), nil
	}

	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	raw = extractJSONFromContent(raw)

	var out CreateQuestionOutput
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return fallbackNextQuestion(input), nil
	}

	// 若 AI 未返回 summaryMessage，给默认
	if out.Done && out.SummaryMessage == "" {
		out.SummaryMessage = "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」继续设置 Agent 的回答风格即可～"
	}
	if len(out.FactCandidates) == 0 {
		out.FactCandidates = BuildStructuredFactsFromCreateQuestionOutput(&out)
	}

	return &out, nil
}

func truncate(s string, max int) string {
	r := []rune(strings.TrimSpace(s))
	if len(r) <= max {
		return string(r)
	}
	return string(r[:max]) + "..."
}

func extractJSONFromContent(s string) string {
	// 尝试从 markdown 代码块提取
	if m := jsonBlockRe.FindStringSubmatch(s); len(m) >= 2 {
		return strings.TrimSpace(m[1])
	}
	// 尝试提取 {} 包裹的 JSON
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

func fallbackNextQuestion(input *CreateQuestionInput) *CreateQuestionOutput {
	entries := len(input.KnowledgeEntries)
	turns := len(input.ChatHistory)
	if entries >= 2 && turns >= 6 {
		return &CreateQuestionOutput{
			Done:           true,
			SummaryMessage: "很好！你的经验已经记录下来，AI 会基于这些内容来回答来访者。点击下方「下一步」继续设置 Agent 的回答风格即可～",
		}
	}

	type fallbackQ struct {
		question  string
		dimension string
	}

	var q fallbackQ
	switch {
	case turns == 0:
		q = fallbackQ{"你希望分享什么样的经验？可以简单说说你擅长的领域或想帮别人解决什么问题。", "fact"}
	case entries == 0 && turns >= 2:
		q = fallbackQ{"可以举个具体的例子吗？比如时间、你做了什么、最后结果怎么样？", "fact"}
	case turns%7 == 1:
		q = fallbackQ{"在做这个选择的时候，你当时还考虑过什么别的方案吗？最后为什么选了这个？", "decision"}
	case turns%7 == 2:
		q = fallbackQ{"回头看这段经历，有没有什么当时不知道、但现在觉得很重要的事？", "regret"}
	case turns%7 == 3:
		q = fallbackQ{"如果一个和你背景不太一样的人来问你同样的问题，你的建议会有什么不同？", "adaptation"}
	case turns%7 == 4:
		q = fallbackQ{"如果有个人正站在你当时的位置，你最想提醒他的一件事是什么？", "advice"}
	case turns%7 == 5:
		q = fallbackQ{"你觉得你这个领域现在最新的情况怎么样？跟你当时比有什么变化？", "current"}
	case turns%7 == 6:
		q = fallbackQ{"你所在的城市或地区，在这方面现在的环境怎么样？比如当地的政策、物价、资源、氛围，有什么外地人不太知道的？", "local"}
	default:
		q = fallbackQ{"还有什么你觉得重要的经历想补充吗？", "fact"}
	}

	out := &CreateQuestionOutput{Done: false, NextQuestion: q.question, QuestionDimension: q.dimension}
	out.FactCandidates = BuildStructuredFactsFromCreateQuestionOutput(out)
	return out
}

// ── Feedback-Driven Follow-up Questions ──
//
// Active Learning (Settles, 2012): 主动找到知识库中的"洞"（blind spots + 负面反馈），
// 生成针对性追问推送给创建者。闭合 用户反馈 → 创建者补充 → Agent 变好 的飞轮。

// FeedbackFollowUpInput 用于生成反馈驱动的追问
type FeedbackFollowUpInput struct {
	DisplayName string
	Headline    string
	BlindSpots  []BlindSpotForFollowUp
	WeakTopics  []WeakTopicForFollowUp
}

// BlindSpotForFollowUp 用户问了但 Agent 接不住的问题
type BlindSpotForFollowUp struct {
	UserQuestion string
	Route        string
}

// WeakTopicForFollowUp 有负面反馈的 Topic
type WeakTopicForFollowUp struct {
	TopicLabel   string
	DominantIssue string // not_specific, factual_error, contradiction, too_confident
	FeedbackCount int
}

// FeedbackFollowUpOutput 生成的追问列表
type FeedbackFollowUpOutput struct {
	Questions []FollowUpQuestion `json:"questions"`
}

// FollowUpQuestion 单条追问
type FollowUpQuestion struct {
	Question  string `json:"question"`
	Reason    string `json:"reason"`    // 为什么问这个（展示给创建者看）
	Source    string `json:"source"`    // blind_spot / weak_topic
	Priority string `json:"priority"`  // urgent / high / medium / low
	Color    string `json:"color"`     // red / orange / yellow / blue
}

// FeedbackAlert 创建者仪表盘上的反馈告警条目
type FeedbackAlert struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Detail   string `json:"detail"`
	Priority string `json:"priority"` // urgent / high / medium / low
	Color    string `json:"color"`    // red / orange / yellow / blue
	Source   string `json:"source"`   // blind_spot / factual_error / not_specific / contradiction / too_confident
	TopicID  string `json:"topicId,omitempty"`
	Action   string `json:"action"`   // 建议的操作文案
}

// priorityColor 优先级 → 颜色映射
//
//	urgent → red:    事实错误/前后矛盾，直接影响信任
//	high   → orange: 多次盲区命中，用户需求强但接不住
//	medium → yellow: 不够具体/太绝对，体验可改善
//	low    → blue:   轻微建议，锦上添花
func priorityColor(priority string) string {
	switch priority {
	case "urgent":
		return "red"
	case "high":
		return "orange"
	case "medium":
		return "yellow"
	default:
		return "blue"
	}
}

// BuildFeedbackAlerts 从反馈信号和盲区生成创建者告警列表。
// 每条告警有明确的优先级(urgent/high/medium/low)和颜色(red/orange/yellow/blue)。
func BuildFeedbackAlerts(fb *FeedbackSignals, topicLabels map[string]string, blindSpots []BlindSpotForFollowUp) []FeedbackAlert {
	var alerts []FeedbackAlert

	// 从反馈信号生成告警
	if fb != nil {
		for topicID, stat := range fb.TopicStats {
			label := topicLabels[topicID]
			if label == "" {
				continue
			}

			// 事实错误 → urgent/red
			if stat.FactualError > 0 {
				alerts = append(alerts, FeedbackAlert{
					ID:       "fb-" + topicID + "-factual",
					Title:    "事实错误",
					Detail:   fmt.Sprintf("「%s」有 %d 位用户报告事实错误，请核实关键信息", label, stat.FactualError),
					Priority: "urgent",
					Color:    "red",
					Source:   "factual_error",
					TopicID:  topicID,
					Action:   "去修改这个话题的内容",
				})
			}

			// 前后矛盾 → urgent/red
			if stat.Contradiction > 0 {
				alerts = append(alerts, FeedbackAlert{
					ID:       "fb-" + topicID + "-contradiction",
					Title:    "前后矛盾",
					Detail:   fmt.Sprintf("「%s」有 %d 位用户反馈你前后说法不一致", label, stat.Contradiction),
					Priority: "urgent",
					Color:    "red",
					Source:   "contradiction",
					TopicID:  topicID,
					Action:   "去理清这个话题的信息",
				})
			}

			// 不够具体 → medium/yellow
			if stat.NotSpecific >= 2 {
				alerts = append(alerts, FeedbackAlert{
					ID:       "fb-" + topicID + "-specific",
					Title:    "不够具体",
					Detail:   fmt.Sprintf("「%s」有 %d 位用户觉得回答不够具体，建议补充数字、时间、细节", label, stat.NotSpecific),
					Priority: "medium",
					Color:    "yellow",
					Source:   "not_specific",
					TopicID:  topicID,
					Action:   "去补充更多细节",
				})
			}

			// 太绝对 → low/blue
			if stat.TooConfident >= 2 {
				alerts = append(alerts, FeedbackAlert{
					ID:       "fb-" + topicID + "-confident",
					Title:    "过于绝对",
					Detail:   fmt.Sprintf("「%s」有 %d 位用户觉得说得太绝对", label, stat.TooConfident),
					Priority: "low",
					Color:    "blue",
					Source:   "too_confident",
					TopicID:  topicID,
					Action:   "考虑补充一些限定条件",
				})
			}
		}
	}

	// 从盲区生成告警
	// 统计同类问题出现次数
	blindSpotCounts := make(map[string]int)
	blindSpotExamples := make(map[string]string)
	for _, spot := range blindSpots {
		key := spot.Route
		if key == "" {
			key = "general"
		}
		blindSpotCounts[key]++
		if _, exists := blindSpotExamples[key]; !exists {
			q := spot.UserQuestion
			if len([]rune(q)) > 60 {
				q = string([]rune(q)[:60]) + "..."
			}
			blindSpotExamples[key] = q
		}
	}

	if total := len(blindSpots); total > 0 {
		priority := "medium"
		color := "yellow"
		if total >= 5 {
			priority = "high"
			color = "orange"
		}

		example := ""
		for _, ex := range blindSpotExamples {
			example = ex
			break
		}

		alerts = append(alerts, FeedbackAlert{
			ID:       "blindspot-summary",
			Title:    "知识盲区",
			Detail:   fmt.Sprintf("有 %d 个用户问题你的 Agent 接不住，例如：「%s」", total, example),
			Priority: priority,
			Color:    color,
			Source:   "blind_spot",
			Action:   "去补充经验",
		})
	}

	// 按优先级排序：urgent > high > medium > low
	order := map[string]int{"urgent": 0, "high": 1, "medium": 2, "low": 3}
	for i := 0; i < len(alerts)-1; i++ {
		for j := i + 1; j < len(alerts); j++ {
			if order[alerts[j].Priority] < order[alerts[i].Priority] {
				alerts[i], alerts[j] = alerts[j], alerts[i]
			}
		}
	}

	return alerts
}

// GenerateFollowUpFromFeedback 基于盲区和负面反馈，生成创建者需要补充的追问。
// 如果有 LLM 可用，用 LLM 生成自然语言的追问；否则用规则生成。
func GenerateFollowUpFromFeedback(ctx context.Context, apiKey, model, baseURL string, input *FeedbackFollowUpInput) *FeedbackFollowUpOutput {
	// 先用规则生成基础追问（保底）
	questions := buildRuleBasedFollowUps(input)

	// 有 LLM 时用 LLM 润色和补充
	if isLLMEnabled(apiKey, model, baseURL) {
		if llmQuestions := generateLLMFollowUps(ctx, apiKey, model, baseURL, input); len(llmQuestions) > 0 {
			questions = llmQuestions
		}
	}

	// 填充颜色
	for i := range questions {
		if questions[i].Color == "" {
			questions[i].Color = priorityColor(questions[i].Priority)
		}
	}
	// 按优先级排序：urgent > high > medium > low
	priorityOrder := map[string]int{"urgent": 0, "high": 1, "medium": 2, "low": 3}
	for i := 0; i < len(questions)-1; i++ {
		for j := i + 1; j < len(questions); j++ {
			if priorityOrder[questions[j].Priority] < priorityOrder[questions[i].Priority] {
				questions[i], questions[j] = questions[j], questions[i]
			}
		}
	}

	if len(questions) > 8 {
		questions = questions[:8]
	}
	return &FeedbackFollowUpOutput{Questions: questions}
}

// buildRuleBasedFollowUps 规则驱动的追问生成
func buildRuleBasedFollowUps(input *FeedbackFollowUpInput) []FollowUpQuestion {
	var questions []FollowUpQuestion

	// 从盲区生成追问
	seen := make(map[string]bool)
	for _, spot := range input.BlindSpots {
		q := spot.UserQuestion
		if len([]rune(q)) > 50 {
			q = string([]rune(q)[:50]) + "..."
		}
		if seen[q] {
			continue
		}
		seen[q] = true
		questions = append(questions, FollowUpQuestion{
			Question: fmt.Sprintf("有用户问过你「%s」，但 Agent 接不住。你在这方面有经验吗？能补充一些具体的经历或看法吗？", q),
			Reason:   "有用户问了这个问题但 Agent 没有足够的信息回答",
			Source:   "blind_spot",
			Priority: "high",
			Color:    "orange",
		})
	}

	// 从负面反馈生成追问
	for _, weak := range input.WeakTopics {
		var question, reason, priority, color string
		switch weak.DominantIssue {
		case "not_specific":
			question = fmt.Sprintf("关于「%s」，有用户觉得你的回答不够具体。能补充一些具体的数字、时间线、操作步骤吗？比如你当时具体做了什么、花了多久、结果怎么样？", weak.TopicLabel)
			reason = fmt.Sprintf("%d 位用户认为这个话题回答不够具体", weak.FeedbackCount)
			priority = "medium"
			color = "yellow"
		case "factual_error":
			question = fmt.Sprintf("关于「%s」，有用户指出事实错误。你能重新确认一下这方面的关键信息吗？比如具体的数字、名称、时间等。", weak.TopicLabel)
			reason = fmt.Sprintf("%d 位用户报告了事实错误", weak.FeedbackCount)
			priority = "urgent"
			color = "red"
		case "contradiction":
			question = fmt.Sprintf("关于「%s」，有用户反馈你前后说法不一致。能帮忙理清一下这方面的情况吗？", weak.TopicLabel)
			reason = fmt.Sprintf("%d 位用户反馈前后矛盾", weak.FeedbackCount)
			priority = "urgent"
			color = "red"
		case "too_confident":
			question = fmt.Sprintf("关于「%s」，有用户觉得你说得太绝对了。这方面是否有一些不确定的地方、或者因人而异的情况？", weak.TopicLabel)
			reason = fmt.Sprintf("%d 位用户认为回答过于绝对", weak.FeedbackCount)
			priority = "low"
			color = "blue"
		default:
			continue
		}
		questions = append(questions, FollowUpQuestion{
			Question: question,
			Reason:   reason,
			Source:   "weak_topic",
			Priority: priority,
			Color:    color,
		})
	}

	return questions
}

// generateLLMFollowUps 用 LLM 生成更自然的追问
func generateLLMFollowUps(ctx context.Context, apiKey, model, baseURL string, input *FeedbackFollowUpInput) []FollowUpQuestion {
	apiKey = resolveAPIKey(apiKey, baseURL)
	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("你是「%s」（%s）的 Agent 运营助手。\n\n", input.DisplayName, input.Headline))
	sb.WriteString("以下是用户反馈中发现的问题，请为创建者生成针对性的追问，帮助他们补充信息来解决这些问题。\n\n")

	if len(input.BlindSpots) > 0 {
		sb.WriteString("【知识盲区 - 用户问了但 Agent 回答不了的问题】\n")
		for i, spot := range input.BlindSpots {
			if i >= 5 {
				break
			}
			sb.WriteString(fmt.Sprintf("- %s\n", spot.UserQuestion))
		}
		sb.WriteString("\n")
	}

	if len(input.WeakTopics) > 0 {
		sb.WriteString("【质量问题 - 用户反馈不满意的话题】\n")
		for _, weak := range input.WeakTopics {
			issue := ""
			switch weak.DominantIssue {
			case "not_specific":
				issue = "不够具体"
			case "factual_error":
				issue = "有事实错误"
			case "contradiction":
				issue = "前后矛盾"
			case "too_confident":
				issue = "说得太绝对"
			}
			sb.WriteString(fmt.Sprintf("- 话题「%s」：%d 人反馈%s\n", weak.TopicLabel, weak.FeedbackCount, issue))
		}
	}

	systemPrompt := `根据以上问题，生成 3-6 个追问。每个追问要：
1. 口语化、友好，像朋友在帮忙改进
2. 具体指出需要补充什么（不要泛泛地说"能详细说说吗"）
3. 对知识盲区：询问创建者在这方面有没有经验
4. 对质量问题：引导创建者补充缺失的细节

输出严格 JSON，不要 markdown：
{"questions":[{"question":"追问内容","reason":"为什么问这个","source":"blind_spot或weak_topic","priority":"high/medium/low"}]}`

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: sb.String()},
		},
		Temperature:         safeTemperature(model, 0.5),
		MaxCompletionTokens: 1200,
	})
	if err != nil || len(resp.Choices) == 0 {
		return nil
	}

	raw := extractJSONFromContent(strings.TrimSpace(resp.Choices[0].Message.Content))
	var out FeedbackFollowUpOutput
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return nil
	}
	return out.Questions
}

// 兼容可能的 markdown 代码块
var jsonBlockRe = regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)```")
