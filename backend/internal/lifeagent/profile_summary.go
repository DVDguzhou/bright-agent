package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

type ProfileSummaryInput struct {
	DisplayName         string `json:"displayName"`
	Headline            string `json:"headline"`
	ShortBio            string `json:"shortBio"`
	School              string `json:"school"`
	Education           string `json:"education"`
	Job                 string `json:"job"`
	Income              string `json:"income"`
	LongBio             string `json:"longBio"`
	Audience            string `json:"audience"`
	WelcomeMessage      string `json:"welcomeMessage"`
	ExpertiseTagsText   string `json:"expertiseTagsText"`
	SampleQuestionsText string `json:"sampleQuestionsText"`
}

type ProfileSummaryOutput struct {
	SummaryMessage string `json:"summaryMessage"`
	Profile        struct {
		DisplayName     string   `json:"displayName"`
		Headline        string   `json:"headline"`
		ShortBio        string   `json:"shortBio"`
		School          string   `json:"school"`
		Education       string   `json:"education"`
		Job             string   `json:"job"`
		Income          string   `json:"income"`
		LongBio         string   `json:"longBio"`
		Audience        string   `json:"audience"`
		WelcomeMessage  string   `json:"welcomeMessage"`
		ExpertiseTags   []string `json:"expertiseTags"`
		SampleQuestions []string `json:"sampleQuestions"`
	} `json:"profile"`
	KnowledgeEntries []KEntry `json:"knowledgeEntries"`
}

func GenerateProfileCreateSummary(apiKey, model, baseURL string, input *ProfileSummaryInput) (*ProfileSummaryOutput, error) {
	useLLM := (apiKey != "" || baseURL != "") && model != ""
	if !useLLM {
		return fallbackProfileSummary(input), nil
	}
	if apiKey == "" && baseURL != "" {
		apiKey = "ollama"
	}

	systemPrompt := `你在帮助用户创建「人生 Agent」。用户已经通过对话回答了基础资料，你要把这些原始回答整理成结构化资料，并提炼出可直接入库的经验知识。

你的任务：
1. 保留原意，整理用户填写的资料；不要编造事实。
2. 擅长标签整理成最多 8 个简短标签；没有就返回空数组。
3. 示例问题整理成用户可能会问的问题列表；没有就返回空数组。
4. 生成 2 到 4 条 knowledgeEntries，作为这个 Agent 初始经验知识。即使用户有些字段没填，也要尽量根据已有资料整理出至少 2 条。
5. summaryMessage 用自然、友好的中文告诉用户：我已经帮你整理好基础资料，可以进入下一步。

输出必须是严格 JSON，不要 markdown，不要额外解释：
{
  "summaryMessage": "我已经帮你整理好基础资料，下一步继续补充你的真实经历和经验。",
  "profile": {
    "displayName": "",
    "headline": "",
    "shortBio": "",
    "school": "",
    "education": "",
    "job": "",
    "income": "",
    "longBio": "",
    "audience": "",
    "welcomeMessage": "",
    "expertiseTags": ["标签1"],
    "sampleQuestions": ["问题1"]
  },
  "knowledgeEntries": [
    {
      "category": "背景",
      "title": "成长与经历",
      "content": "完整内容",
      "tags": ["标签"]
    }
  ]
}

规则：
- displayName 保持 1 到 10 个字。
- 所有字符串字段都去掉首尾空格。
- knowledgeEntries 的 title/category 要简洁清楚，content 要像可直接给 AI 使用的经验描述。
- 如果用户没有明确填写某个字段，就返回空字符串或空数组。`

	userContent := fmt.Sprintf(`请整理下面这些回答：

名称：%s
一句话介绍：%s
简短介绍：%s
学校：%s
学历：%s
工作：%s
收入：%s
详细背景：%s
适合帮助的人群：%s
首次欢迎语：%s
擅长标签原始回答：%s
示例问题原始回答：%s`,
		input.DisplayName,
		input.Headline,
		input.ShortBio,
		input.School,
		input.Education,
		input.Job,
		input.Income,
		input.LongBio,
		input.Audience,
		input.WelcomeMessage,
		input.ExpertiseTagsText,
		input.SampleQuestionsText,
	)

	cfg := openai.DefaultConfig(apiKey)
	if baseURL != "" {
		cfg.BaseURL = baseURL
	}
	client := openai.NewClientWithConfig(cfg)
	resp, err := client.CreateChatCompletion(context.Background(), openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: userContent},
		},
		Temperature: 0.4,
		MaxTokens:   1200,
	})
	if err != nil || len(resp.Choices) == 0 || resp.Choices[0].Message.Content == "" {
		return fallbackProfileSummary(input), nil
	}

	raw := extractJSONFromProfileContent(strings.TrimSpace(resp.Choices[0].Message.Content))
	var out ProfileSummaryOutput
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return fallbackProfileSummary(input), nil
	}
	normalizeProfileSummary(&out, input)
	return &out, nil
}

func fallbackProfileSummary(input *ProfileSummaryInput) *ProfileSummaryOutput {
	out := &ProfileSummaryOutput{
		SummaryMessage: "我已经帮你整理好基础资料，下一步继续补充你的真实经历和经验。",
	}
	out.Profile.DisplayName = truncateRunes(strings.TrimSpace(input.DisplayName), 10)
	out.Profile.Headline = strings.TrimSpace(input.Headline)
	out.Profile.ShortBio = strings.TrimSpace(input.ShortBio)
	out.Profile.School = strings.TrimSpace(input.School)
	out.Profile.Education = strings.TrimSpace(input.Education)
	out.Profile.Job = strings.TrimSpace(input.Job)
	out.Profile.Income = strings.TrimSpace(input.Income)
	out.Profile.LongBio = strings.TrimSpace(input.LongBio)
	out.Profile.Audience = strings.TrimSpace(input.Audience)
	out.Profile.WelcomeMessage = strings.TrimSpace(input.WelcomeMessage)
	out.Profile.ExpertiseTags = splitListText(input.ExpertiseTagsText, 8)
	out.Profile.SampleQuestions = splitQuestionText(input.SampleQuestionsText, 6)
	out.KnowledgeEntries = buildFallbackKnowledgeEntries(out)
	return out
}

func normalizeProfileSummary(out *ProfileSummaryOutput, input *ProfileSummaryInput) {
	if out.SummaryMessage == "" {
		out.SummaryMessage = "我已经帮你整理好基础资料，下一步继续补充你的真实经历和经验。"
	}
	out.Profile.DisplayName = truncateRunes(strings.TrimSpace(firstNonEmpty(out.Profile.DisplayName, input.DisplayName)), 10)
	out.Profile.Headline = strings.TrimSpace(firstNonEmpty(out.Profile.Headline, input.Headline))
	out.Profile.ShortBio = strings.TrimSpace(firstNonEmpty(out.Profile.ShortBio, input.ShortBio))
	out.Profile.School = strings.TrimSpace(firstNonEmpty(out.Profile.School, input.School))
	out.Profile.Education = strings.TrimSpace(firstNonEmpty(out.Profile.Education, input.Education))
	out.Profile.Job = strings.TrimSpace(firstNonEmpty(out.Profile.Job, input.Job))
	out.Profile.Income = strings.TrimSpace(firstNonEmpty(out.Profile.Income, input.Income))
	out.Profile.LongBio = strings.TrimSpace(firstNonEmpty(out.Profile.LongBio, input.LongBio))
	out.Profile.Audience = strings.TrimSpace(firstNonEmpty(out.Profile.Audience, input.Audience))
	out.Profile.WelcomeMessage = strings.TrimSpace(firstNonEmpty(out.Profile.WelcomeMessage, input.WelcomeMessage))
	if len(out.Profile.ExpertiseTags) == 0 {
		out.Profile.ExpertiseTags = splitListText(input.ExpertiseTagsText, 8)
	}
	if len(out.Profile.SampleQuestions) == 0 {
		out.Profile.SampleQuestions = splitQuestionText(input.SampleQuestionsText, 6)
	}
	if len(out.KnowledgeEntries) < 2 {
		out.KnowledgeEntries = buildFallbackKnowledgeEntries(out)
	}
}

func buildFallbackKnowledgeEntries(out *ProfileSummaryOutput) []KEntry {
	profile := out.Profile
	backgroundParts := make([]string, 0, 8)
	for _, part := range []string{
		profile.ShortBio,
		profile.LongBio,
		profile.School,
		profile.Education,
		profile.Job,
		profile.Income,
	} {
		part = strings.TrimSpace(part)
		if part != "" {
			backgroundParts = append(backgroundParts, part)
		}
	}
	if len(backgroundParts) == 0 {
		backgroundParts = append(backgroundParts, fmt.Sprintf("%s 的定位：%s", firstNonEmpty(profile.DisplayName, "该 Agent"), firstNonEmpty(profile.Headline, profile.WelcomeMessage)))
	}

	directionParts := make([]string, 0, 6)
	if profile.Audience != "" {
		directionParts = append(directionParts, "适合帮助的人群："+profile.Audience)
	}
	if len(profile.ExpertiseTags) > 0 {
		directionParts = append(directionParts, "擅长标签："+strings.Join(profile.ExpertiseTags, "、"))
	}
	if len(profile.SampleQuestions) > 0 {
		directionParts = append(directionParts, "用户可能会问："+strings.Join(profile.SampleQuestions, "；"))
	}
	if profile.WelcomeMessage != "" {
		directionParts = append(directionParts, "欢迎语："+profile.WelcomeMessage)
	}
	if len(directionParts) == 0 {
		directionParts = append(directionParts, fmt.Sprintf("%s 可以从自身经验出发回答用户问题。", firstNonEmpty(profile.DisplayName, "该 Agent")))
	}

	return []KEntry{
		{
			Category: "背景",
			Title:    "成长与经历",
			Content:  strings.Join(backgroundParts, "\n"),
			Tags:     nonEmptyTags(profile.ExpertiseTags),
		},
		{
			Category: "咨询方向",
			Title:    "擅长与适用人群",
			Content:  strings.Join(directionParts, "\n"),
			Tags:     nonEmptyTags(profile.ExpertiseTags),
		},
	}
}

func splitListText(raw string, max int) []string {
	parts := splitterRe.Split(strings.TrimSpace(raw), -1)
	out := make([]string, 0, len(parts))
	seen := map[string]bool{}
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" || seen[part] {
			continue
		}
		seen[part] = true
		out = append(out, part)
		if len(out) >= max {
			break
		}
	}
	return out
}

func splitQuestionText(raw string, max int) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return []string{}
	}
	lines := newlineSplitRe.Split(raw, -1)
	out := make([]string, 0, len(lines))
	seen := map[string]bool{}
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if !questionMarkRe.MatchString(line) && !strings.HasSuffix(line, "？") && !strings.HasSuffix(line, "?") {
			line = line + "？"
		}
		if seen[line] {
			continue
		}
		seen[line] = true
		out = append(out, line)
		if len(out) >= max {
			break
		}
	}
	return out
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func truncateRunes(s string, max int) string {
	runes := []rune(strings.TrimSpace(s))
	if len(runes) <= max {
		return string(runes)
	}
	return string(runes[:max])
}

func nonEmptyTags(tags []string) []string {
	if len(tags) > 0 {
		return tags
	}
	return []string{"经验"}
}

func extractJSONFromProfileContent(s string) string {
	if m := profileJSONBlockRe.FindStringSubmatch(s); len(m) >= 2 {
		return strings.TrimSpace(m[1])
	}
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

var (
	splitterRe         = regexp.MustCompile(`[，,、/；;\n]+`)
	newlineSplitRe     = regexp.MustCompile(`[\n\r]+`)
	questionMarkRe     = regexp.MustCompile(`[?？]`)
	profileJSONBlockRe = regexp.MustCompile("(?s)```(?:json)?\\s*([\\s\\S]*?)```")
)
