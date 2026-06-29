package yantuseed

// Profile 为「研途榜样」系列纯文本一条（可配合 seed_yantu_text 写入人生 Agent）。
type Profile struct {
	DisplayName   string
	School        string
	MajorLine     string
	ScoreLine     string
	ArticleTitle  string // 用于知识条目标题与 longBio 说明
	KnowledgeBody string
	// LongBioPrefix 非空时：longBio = LongBioPrefix + " 收录篇目：" + ArticleTitle + "。" + 首句摘要…
	// 为空时沿用「研途榜样」公众号导语（温州大学计院系列）。
	LongBioPrefix string
	// SampleQuestions 非空则写入档案；为空用默认三问。
	SampleQuestions []string
	// ExpertiseTags 非空则写入档案；为空则按 LongBioPrefix 等规则推断。
	ExpertiseTags []string

	// ---- 以下字段为可选覆盖，为空则沿用默认值 ----

	Headline          string   // 非空时替代自动生成的 headline
	ShortBio          string   // 非空时替代自动生成的 shortBio
	Audience          string   // 非空时替代默认 Audience
	WelcomeMessage    string   // 非空时替代默认 WelcomeMessage
	Education         string   // 非空时替代默认 Education
	MajorLabel        string   // 非空时替代 longBio 中的"考研专业"标签，如"申请方向"
	KnowledgeCategory string   // 非空时替代默认知识条目类别"考研经验"
	KnowledgeTags     []string // 非空时替代默认知识条目标签
	OriginalAuthor    string   // 原作者真实姓名/笔名，写入数据库 original_author 字段用于内部溯源
	Source            string   // 内容来源，如"浙江大学飞跃手册"
	City              string   // 非空时直接写入 city 字段；为空则从 School 自动推导
	Province          string   // 非空时直接写入 province 字段
	CoverImageURL     string   // 非空时直接写入 cover_image_url
	LongBio           string   // 非空时完整覆盖自动生成的 long bio
	KnowledgeEntries  []KnowledgeEntry
	TopicSummaries    []TopicSummary
	TimelineSeeds     []TimelineSeed // 仅专用 seed 脚本使用，bulk upsert 不处理

	// 人设语气（非空时写入 life_agent_profiles）
	PersonaArchetype string
	ToneStyle        string
	ResponseStyle    string
	ForbiddenPhrases []string
	ExampleReplies   []string
	NotSuitableFor   string
}

type TimelineSeed struct {
	PeriodLabel       string
	PeriodGranularity string
	SequenceOrder     int
	EventType         string
	Title             string
	Summary           string
	SourceTitle       string // 对应知识条目标题，用于关联 source_entry_ids
}

type TopicSummary struct {
	Group            string
	Key              string
	Label            string
	Summary          string
	Aliases          []string
	QuestionPatterns []string
	SourceTitles     []string
}

// KnowledgeEntry is one independently retrievable fact or decision framework.
// Keeping entries narrow improves topic labels and bubble-level citations.
type KnowledgeEntry struct {
	Title    string
	Category string
	Content  string
	Tags     []string
}
