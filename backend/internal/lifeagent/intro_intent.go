package lifeagent

import "strings"

// IntroIntentKind classifies self-introduction / background questions.
type IntroIntentKind string

const (
	IntroIntentNone               IntroIntentKind = ""
	IntroIntentBrief              IntroIntentKind = "brief"
	IntroIntentElaborate          IntroIntentKind = "elaborate"
	IntroIntentContinuedElaborate IntroIntentKind = "continued_elaborate"
)

// ProfileLongBioEntryID is the synthetic knowledge entry ID for profile.LongBio injection.
const ProfileLongBioEntryID = "__profile_long_bio__"

// IntroIntent captures whether the user is asking for identity / background narrative.
type IntroIntent struct {
	Kind    IntroIntentKind
	Present bool
}

var introElaborateCues = []string{
	"详细", "具体", "展开", "背景", "经历", "故事", "履历", "怎么过来的",
	"讲讲你", "聊聊你", "说一下你",
}

var introIdentityCues = []string{
	"你叫什么", "你叫什么名字", "你叫啥",
	"你是谁", "你谁", "介绍你", "介绍一下你", "介绍下自己", "自我介绍",
	"怎么称呼", "贵姓", "如何称呼", "请问你是",
}

var introBackgroundCues = []string{
	"你的背景", "你背景", "你的经历", "你经历", "你的故事", "你故事", "你的履历",
}

var introBriefOnlyCues = []string{
	"你叫什么", "你叫什么名字", "你叫啥", "怎么称呼", "贵姓", "如何称呼",
}

var recencyCues = []string{
	"最近", "现在", "目前", "近况", "在忙什么", "在做什么", "最近在",
}

// DetectIntroIntent identifies intro / background intent from the current message and history.
func DetectIntroIntent(message string, history []ChatMessageForAI) IntroIntent {
	if isContinuedIntroElaboration(message, history) {
		return IntroIntent{Kind: IntroIntentContinuedElaborate, Present: true}
	}

	norm := normalizeIntroMessage(message)
	if !messageLooksLikeIntro(norm) {
		return IntroIntent{}
	}

	if isBriefIntroOnly(norm) {
		return IntroIntent{Kind: IntroIntentBrief, Present: true}
	}
	if containsAnyNormalized(norm, introElaborateCues) {
		return IntroIntent{Kind: IntroIntentElaborate, Present: true}
	}
	if strings.Contains(norm, "你是谁") || strings.Contains(norm, "你谁") {
		return IntroIntent{Kind: IntroIntentBrief, Present: true}
	}
	return IntroIntent{Kind: IntroIntentElaborate, Present: true}
}

func normalizeIntroMessage(message string) string {
	msg := strings.ToLower(strings.TrimSpace(message))
	return identityRe.ReplaceAllString(msg, "")
}

func messageLooksLikeIntro(norm string) bool {
	for _, p := range introIdentityCues {
		if strings.Contains(norm, p) {
			return true
		}
	}
	for _, p := range introBackgroundCues {
		if strings.Contains(norm, p) {
			return true
		}
	}
	return false
}

func isBriefIntroOnly(norm string) bool {
	for _, p := range introBriefOnlyCues {
		if !strings.Contains(norm, p) {
			continue
		}
		if strings.Contains(norm, "详细") || strings.Contains(norm, "背景") || strings.Contains(norm, "经历") {
			return false
		}
		for _, e := range introElaborateCues {
			if e == "讲讲你" || e == "聊聊你" || e == "说一下你" {
				continue
			}
			if strings.Contains(norm, e) {
				return false
			}
		}
		return true
	}
	return false
}

func isContinuedIntroElaboration(message string, history []ChatMessageForAI) bool {
	msg := strings.ToLower(strings.TrimSpace(message))
	if firstMatch(msg, lengthElaborateCues) == "" {
		return false
	}
	for i := len(history) - 1; i >= 0; i-- {
		if history[i].Role != "user" {
			continue
		}
		prior := detectIntroIntentDirect(history[i].Content)
		return prior.Present
	}
	return false
}

// detectIntroIntentDirect classifies intro intent without continued-elaboration detection (avoids recursion).
func detectIntroIntentDirect(message string) IntroIntent {
	norm := normalizeIntroMessage(message)
	if !messageLooksLikeIntro(norm) {
		return IntroIntent{}
	}
	if isBriefIntroOnly(norm) {
		return IntroIntent{Kind: IntroIntentBrief, Present: true}
	}
	if containsAnyNormalized(norm, introElaborateCues) {
		return IntroIntent{Kind: IntroIntentElaborate, Present: true}
	}
	if strings.Contains(norm, "你是谁") || strings.Contains(norm, "你谁") {
		return IntroIntent{Kind: IntroIntentBrief, Present: true}
	}
	return IntroIntent{Kind: IntroIntentElaborate, Present: true}
}

// WantsBackgroundNotRecency is true when the user wants background narrative, not live updates.
func WantsBackgroundNotRecency(message string, intro IntroIntent) bool {
	if !intro.Present {
		return false
	}
	if intro.Kind != IntroIntentElaborate && intro.Kind != IntroIntentContinuedElaborate {
		return false
	}
	msg := strings.ToLower(strings.TrimSpace(message))
	for _, c := range recencyCues {
		if strings.Contains(msg, c) {
			return false
		}
	}
	return true
}

// IsIntroKnowledgeEntry returns true for knowledge entries that describe the agent's background.
func IsIntroKnowledgeEntry(e KnowledgeEntryForAI) bool {
	title := strings.TrimSpace(e.Title)
	if strings.HasPrefix(title, "我是") {
		return true
	}
	cat := strings.ToLower(strings.TrimSpace(e.Category))
	if cat == "背景" || strings.Contains(cat, "背景") {
		return true
	}
	for _, tag := range e.Tags {
		t := strings.ToLower(strings.TrimSpace(tag))
		if t == "自我介绍" || strings.Contains(t, "自我介绍") {
			return true
		}
	}
	return false
}

// BoostIntroRetrieval forces intro-relevant sources to the front of the retrieval plan.
func BoostIntroRetrieval(plan *RetrievalPlan, entries []KnowledgeEntryForAI, profile ProfileForAI, intro IntroIntent) {
	if plan == nil || !intro.Present {
		return
	}
	if intro.Kind == IntroIntentBrief {
		return
	}

	var introEntries []KnowledgeEntryForAI
	for _, e := range entries {
		if IsIntroKnowledgeEntry(e) {
			introEntries = append(introEntries, e)
		}
	}

	seen := map[string]bool{}
	var merged []KnowledgeEntryForAI
	for _, e := range introEntries {
		if seen[e.ID] {
			continue
		}
		merged = append(merged, e)
		seen[e.ID] = true
	}
	for _, e := range plan.Entries {
		if seen[e.ID] {
			continue
		}
		merged = append(merged, e)
		seen[e.ID] = true
	}
	plan.Entries = merged

	lb := strings.TrimSpace(profile.LongBio)
	if lb == "" {
		return
	}
	hasLong := false
	for _, e := range plan.Entries {
		if e.ID == ProfileLongBioEntryID || len([]rune(strings.TrimSpace(e.Content))) >= 200 {
			hasLong = true
			break
		}
	}
	if hasLong {
		return
	}
	virtual := KnowledgeEntryForAI{
		ID:       ProfileLongBioEntryID,
		Category: "背景",
		Title:    "详细介绍",
		Content:  lb,
		Tags:     []string{"自我介绍"},
	}
	plan.Entries = append([]KnowledgeEntryForAI{virtual}, plan.Entries...)
	plan.Reasons = append(plan.Reasons, "intro:profile_long_bio")
}

func hasIntroBackgroundMaterial(intro IntroIntent, plan RetrievalPlan) bool {
	if !intro.Present {
		return false
	}
	if intro.Kind != IntroIntentElaborate && intro.Kind != IntroIntentContinuedElaborate {
		return false
	}
	for _, e := range plan.Entries {
		if len([]rune(strings.TrimSpace(e.Content))) >= 200 {
			return true
		}
	}
	return false
}

func introDraftKnowledgeGuidance(intro IntroIntent) string {
	if !intro.Present {
		return ""
	}
	switch intro.Kind {
	case IntroIntentElaborate, IntroIntentContinuedElaborate:
		return "【自我介绍 / 背景介绍 - 硬约束】\n" +
			"对方想了解你的履历与转折，不是最近在琢磨什么。\n" +
			"用口语讲学历路径、关键转折、现在在帮谁；禁止逐字复述人设里的「一句话」「短介绍」字段。\n" +
			"除非对方明确问近况，否则不要主动讲最近动态。\n\n"
	case IntroIntentBrief:
		return "【简短自我介绍】\n" +
			"对方只问名字或称呼，一两句口语回答即可；不要复读 headline 或短介绍全文。\n\n"
	default:
		return ""
	}
}

func introSystemPromptGuidance(intro IntroIntent) string {
	if !intro.Present {
		return ""
	}
	switch intro.Kind {
	case IntroIntentElaborate, IntroIntentContinuedElaborate:
		return "【自我介绍场景】这轮对方要详细了解你的背景。讲履历、转折、为何做现在的事；" +
			"用口语重述素材，禁止复制粘贴「一句话」「短介绍」原文；不要切换到最近在琢磨什么。\n"
	case IntroIntentBrief:
		return "【自我介绍场景】这轮只需简短回答名字/称呼，口语化即可，不要展开成长篇。\n"
	default:
		return ""
	}
}
