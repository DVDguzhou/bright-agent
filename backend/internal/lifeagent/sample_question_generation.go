package lifeagent

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

type GroundedSampleQuestionInput struct {
	DisplayName       string
	Headline          string
	ShortBio          string
	ExpertiseTags     []string
	School            string
	Education         string
	Job               string
	ExistingQuestions []string
	Knowledge         []KnowledgeSnippet
}

type GroundedSampleQuestionResult struct {
	Questions      []string
	Rejected       []SampleQuestionValidationIssue
	KnowledgeBrief string
	Raw            string
}

type SampleQuestionValidationIssue struct {
	Question string `json:"question"`
	Reason   string `json:"reason"`
}

var numberedQuestionPrefixRe = regexp.MustCompile(`^\s*(?:[-*]\s*)?(?:\d{1,2}|[一二三四五六七八九十]{1,3})[\.、．\)\s]*`)

// GenerateGroundedSampleQuestions uses the profile knowledge base as the source of truth for user-facing sample questions.
func GenerateGroundedSampleQuestions(ctx context.Context, apiKey, model, baseURL string, in GroundedSampleQuestionInput) (*GroundedSampleQuestionResult, error) {
	if !isLLMEnabled(apiKey, model, baseURL) {
		return nil, fmt.Errorf("LLM is not configured")
	}
	brief := BuildSampleQuestionKnowledgeBrief(in.Knowledge, 9000)
	if strings.TrimSpace(brief) == "" {
		return nil, fmt.Errorf("profile has no knowledge content")
	}
	apiKey = resolveAPIKey(apiKey, baseURL)

	systemPrompt := `你在为「人生 Agent」生成展示给用户点击的示例问题。

要求：
1. 只能根据「知识库摘录」里的信息生成，不能只根据学校、学历、资料卡片脑补。
2. 问题要像真实用户会问的短句，直接、自然、有具体关注点。
3. 每条 8-24 个中文字符左右，最多 28 字。
4. 不要编号，不要 markdown，不要解释，只输出严格 JSON 数组。
5. 禁止这些假问题写法：
   - "关于「X」能分享什么？"
   - "X有什么实战经验？"
   - "从X到有哪些经验？"
   - 只问学校/学历/地区本身的泛问题
   - 与知识库无关的问题
6. 优先覆盖知识库里具体可咨询的话题，例如面试、复试、夏令营、简历、推荐信、绩点、竞赛、时间线、踩坑、去向选择、职业/岗位体验。

输出示例：
["夏令营面试一般问什么？","推荐信怎么准备更稳？","绩点排名对录取影响大吗？","复试有哪些容易踩的坑？"]`

	userContent := fmt.Sprintf(`Agent 档案：
名称：%s
一句话：%s
简介：%s
学校：%s
学历：%s
工作：%s
标签：%s
当前示例问题：%s

知识库摘录：
%s

请生成 6 条候选问题，后续系统会筛选前 4 条合格问题。`,
		in.DisplayName,
		in.Headline,
		in.ShortBio,
		in.School,
		in.Education,
		in.Job,
		strings.Join(in.ExpertiseTags, "、"),
		strings.Join(in.ExistingQuestions, "；"),
		brief,
	)

	ctx, cancel := withLLMTimeout(ctx)
	defer cancel()
	client := getClient(apiKey, baseURL)
	req := openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{Role: openai.ChatMessageRoleSystem, Content: systemPrompt},
			{Role: openai.ChatMessageRoleUser, Content: userContent},
		},
		Temperature: safeTemperature(model, 0.3),
	}
	setMaxTokens(&req, model, 900)
	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, err
	}
	if len(resp.Choices) == 0 || strings.TrimSpace(resp.Choices[0].Message.Content) == "" {
		return nil, fmt.Errorf("LLM returned empty response")
	}
	raw := strings.TrimSpace(resp.Choices[0].Message.Content)
	candidates, err := parseSampleQuestionJSON(raw)
	if err != nil {
		return &GroundedSampleQuestionResult{KnowledgeBrief: brief, Raw: raw}, err
	}
	accepted, rejected := CleanAndValidateSampleQuestions(candidates, in.Knowledge)
	return &GroundedSampleQuestionResult{
		Questions:      limitSampleQuestions(accepted, 6),
		Rejected:       rejected,
		KnowledgeBrief: brief,
		Raw:            raw,
	}, nil
}

func BuildSampleQuestionKnowledgeBrief(entries []KnowledgeSnippet, maxChars int) string {
	if maxChars <= 0 {
		maxChars = 9000
	}
	var b strings.Builder
	used := 0
	for i, e := range entries {
		if used >= maxChars {
			break
		}
		title := strings.TrimSpace(e.Title)
		content := compactKnowledgeForSampleQuestions(e.Content, 1100)
		if title == "" && content == "" {
			continue
		}
		chunk := fmt.Sprintf("\n[%d] 标题：%s\n标签：%s\n内容：%s\n", i+1, title, strings.Join(e.Tags, "、"), content)
		if used+len([]rune(chunk)) > maxChars {
			chunk = truncateRunes(chunk, maxChars-used)
		}
		b.WriteString(chunk)
		used += len([]rune(chunk))
	}
	return strings.TrimSpace(b.String())
}

func compactKnowledgeForSampleQuestions(content string, maxChars int) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return ""
	}
	lines := strings.Split(content, "\n")
	keywords := []string{"面试", "复试", "夏令营", "预推免", "推免", "简历", "推荐信", "绩点", "排名", "竞赛", "时间", "节点", "踩坑", "避坑", "选择", "去向", "offer", "岗位", "实习", "转专业", "申请", "套磁", "文书", "机试"}
	var picked []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if strings.HasPrefix(line, "#") || strings.HasPrefix(line, "-") || strings.HasPrefix(line, "*") || containsAny(line, keywords...) {
			picked = append(picked, line)
		}
		if len(picked) >= 18 {
			break
		}
	}
	if len(picked) == 0 {
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line != "" {
				picked = append(picked, line)
			}
			if len(picked) >= 8 {
				break
			}
		}
	}
	return truncateRunes(strings.Join(picked, "\n"), maxChars)
}

func parseSampleQuestionJSON(raw string) ([]string, error) {
	s := strings.TrimSpace(raw)
	if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimSuffix(s, "```")
		s = strings.TrimSpace(s)
	}
	if start := strings.Index(s, "["); start >= 0 {
		if end := strings.LastIndex(s, "]"); end > start {
			s = s[start : end+1]
		}
	}
	var out []string
	if err := json.Unmarshal([]byte(s), &out); err != nil {
		return nil, err
	}
	return out, nil
}

func CleanAndValidateSampleQuestions(in []string, knowledge []KnowledgeSnippet) ([]string, []SampleQuestionValidationIssue) {
	out := make([]string, 0, len(in))
	var rejected []SampleQuestionValidationIssue
	seen := map[string]bool{}
	for _, raw := range in {
		q := NormalizeSampleQuestion(raw)
		if q == "" {
			continue
		}
		if reason := RejectSampleQuestionReason(q, knowledge); reason != "" {
			rejected = append(rejected, SampleQuestionValidationIssue{Question: q, Reason: reason})
			continue
		}
		if seen[q] {
			continue
		}
		seen[q] = true
		out = append(out, q)
	}
	return out, rejected
}

func NormalizeSampleQuestion(q string) string {
	q = strings.TrimSpace(q)
	q = strings.Trim(q, "\"'`“”‘’")
	q = strings.ReplaceAll(q, "?", "？")
	q = strings.ReplaceAll(q, "：", ":")
	q = strings.TrimSpace(q)
	if m := numberedQuestionPrefixRe.FindString(q); m != "" {
		rest := strings.TrimSpace(strings.TrimPrefix(q, m))
		if rest != "" && looksLikeQuestion(rest) {
			q = rest
		}
	}
	q = strings.TrimSpace(q)
	q = strings.TrimSuffix(q, "。")
	q = strings.TrimSuffix(q, "；")
	if q != "" && !strings.HasSuffix(q, "？") {
		q += "？"
	}
	return q
}

func RejectSampleQuestionReason(q string, knowledge []KnowledgeSnippet) string {
	q = strings.TrimSpace(q)
	if q == "" {
		return "empty"
	}
	runes := []rune(q)
	if len(runes) < 6 {
		return "too_short"
	}
	if len(runes) > 32 {
		return "too_long"
	}
	if runes[0] >= '0' && runes[0] <= '9' {
		return "leading_number"
	}
	if strings.Contains(q, "到有哪些") || strings.Contains(q, "从到") || strings.Contains(q, "从哪些") {
		return "broken_transition"
	}
	if strings.Contains(q, "关于「") || strings.ContainsAny(q, "「」【】") {
		return "template_brackets"
	}
	if isStupidSampleQuestion(q) {
		return "template_or_junk"
	}
	if strings.Count(q, "？") > 1 || strings.Contains(q, "？？") {
		return "bad_punctuation"
	}
	if len(knowledge) > 0 && !hasKnowledgeEvidence(q, knowledge) {
		return "no_knowledge_evidence"
	}
	return ""
}

func looksLikeQuestion(q string) bool {
	return strings.Contains(q, "？") || containsAny(q, "什么", "怎么", "如何", "哪些", "吗", "要不要", "有没有", "能不能")
}

func hasKnowledgeEvidence(q string, knowledge []KnowledgeSnippet) bool {
	corpus := strings.Builder{}
	for _, e := range knowledge {
		corpus.WriteString(e.Title)
		corpus.WriteString("\n")
		corpus.WriteString(e.Content)
		corpus.WriteString("\n")
		corpus.WriteString(strings.Join(e.Tags, "\n"))
	}
	text := corpus.String()
	for _, term := range evidenceTerms(q) {
		if strings.Contains(text, term) {
			return true
		}
	}
	return false
}

func evidenceTerms(q string) []string {
	replacer := strings.NewReplacer(
		"？", " ", "怎么", " ", "如何", " ", "什么", " ", "哪些", " ", "一般", " ",
		"可以", " ", "分享", " ", "经验", " ", "建议", " ", "准备", " ", "注意", " ",
		"关于", " ", "要不要", " ", "有没有", " ", "能不能", " ", "的", " ",
		"从", " ", "到", " ", "在", " ", "里", " ", "中", " ", "和", " ", "与", " ",
	)
	cleaned := replacer.Replace(q)
	separators := func(r rune) bool {
		return r == ' ' || r == '/' || r == '-' || r == '_' || r == '、' || r == ',' || r == '，'
	}
	seen := map[string]bool{}
	var out []string
	for _, t := range strings.FieldsFunc(cleaned, separators) {
		t = strings.TrimSpace(t)
		if len([]rune(t)) < 2 || seen[t] {
			continue
		}
		seen[t] = true
		out = append(out, t)
	}
	for _, t := range []string{"面试", "复试", "夏令营", "预推免", "推免", "简历", "推荐信", "绩点", "排名", "竞赛", "机试", "套磁", "文书", "offer", "实习", "岗位", "转专业"} {
		if strings.Contains(q, t) && !seen[t] {
			seen[t] = true
			out = append(out, t)
		}
	}
	return out
}
