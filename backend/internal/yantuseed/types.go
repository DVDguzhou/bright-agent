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

	ShortBio          string   // 非空时替代自动生成的 shortBio
	Audience          string   // 非空时替代默认 Audience
	WelcomeMessage    string   // 非空时替代默认 WelcomeMessage
	Education         string   // 非空时替代默认 Education
	MajorLabel        string   // 非空时替代 longBio 中的"考研专业"标签，如"申请方向"
	KnowledgeCategory string   // 非空时替代默认知识条目类别"考研经验"
	KnowledgeTags     []string // 非空时替代默认知识条目标签
}
