package lifeagent

import (
	"strings"
)

// SampleQuestionInput 用于从档案字段推导展示用示例问题。
type SampleQuestionInput struct {
	DisplayName   string
	Headline      string
	ShortBio      string
	ExpertiseTags []string
	Job           string
	School        string
	// Knowledge 非空时优先从知识库正文生成问题（而非学校/标题）。
	Knowledge []KnowledgeSnippet
}

var genericSampleQuestions = map[string]bool{
	"2+2和4+X怎么选？":              true,
	"211背景如何选择目标院校？":       true,
	"211背景怎么提升竞争力？":         true,
	"408和自命题怎么选？":             true,
	"985背景如何选择目标学校？":       true,
	"985背景如何定位选校？":           true,
	"11408 和 224408 怎么选？":      true,
	"AI方向学什么课？":                true,
	"XJTLU申请海外名校需要什么条件？": true,
	"一人企业怎么起步？":              true,
	"上交生存有什么建议？":            true,
	"交大申请北美PhD需要什么条件？":   true,
	"体制内工作是什么样的？":          true,
	"保研夏令营怎么准备？":            true,
	"保研怎么准备？":                  true,
	"公务员工资待遇如何？":            true,
	"公务员考试怎么准备？":            true,
	"出国留学值得吗？":                true,
	"出国留学怎么准备？":              true,
	"华南理工保研难吗？":              true,
	"华南理工就业怎么样？":            true,
	"华理保研需要什么条件？":          true,
	"南开CS保研情况？":                true,
	"南开计算机怎么样？":              true,
	"博士毕业后怎么找工作？":          true,
	"双非背景如何拿大厂offer？":       true,
	"双非背景如何提升竞争力？":        true,
	"双非背景怎么提升保研竞争力？":    true,
	"四川大学保研怎么样？":            true,
	"夏令营和预推免哪个更容易拿offer？": true,
	"夏令营和预推免哪个更容易？":      true,
	"大学应该怎么规划？":              true,
	"如何准备GMAT/GRE？":              true,
	"如何准备夏令营面试？":            true,
	"如何准备套磁和文书？":            true,
	"如何准备GRE和托福？":             true,
	"如何在双非院校准备升学深造？":  true,
	"如何找到适合的副业方向？":        true,
	"如何构建被动收入？":              true,
	"如何规划人生方向？":              true,
	"如何选导师？":                    true,
	"如何高效阅读文献？":              true,
	"如何平衡学业和实习？":            true,
	"安大保研到985的难度大吗？":       true,
	"就业前景如何？":                  true,
	"川大出国容易吗？":                true,
	"川大就业前景如何？":              true,
	"川师保研需要什么条件？":          true,
	"广工保研到985的难度大吗？":       true,
	"怎么平衡学习和学生工作？":        true,
	"怎么系统学习计算机？":            true,
	"怎么选导师？":                    true,
	"怎么选留学方向？":                true,
	"怎么选课比较好？":                true,
	"有哪些好的CS公开课？":            true,
	"海外生活是什么样的？":            true,
	"海大保研到985难度大吗？":         true,
	"深大保研到985难度大吗？":         true,
	"独立开发怎么变现？":              true,
	"福大考研到985难度大吗？":         true,
	"程序员怎么搞副业？":              true,
	"程序员转公务员难吗？":            true,
	"考研和保研怎么选？":              true,
	"考研和保研怎么选择？":            true,
	"计算机保研面试考什么？":          true,
	"计算机自学怎么入门？":            true,
	"读博值得吗？":                    true,
	"转专业到计算机需要什么准备？":    true,
	"这所大学出国怎么样？":            true,
	"这门课难不难？":                  true,
	"秋招时间线怎么安排？":            true,
	"技术面试怎么准备？":              true,
	"如何选择offer？":                 true,
	"有什么好的赚钱方法？":            true,
	"副业能赚多少？":                  true,
	"清华出国读PhD怎么准备？":         true,
	"留学申请时间线？":                true,
	"山大申请海外PhD需要什么条件？":   true,
	"上大保研需要什么条件？":          true,
	"数学和专业课怎么安排复习节奏？":  true,
	"调剂时有哪些需要注意的？":        true,
	"关于赚钱有什么建议？":            true,
	"关于变现有什么建议？":            true,
}

var genericExpertiseTags = map[string]bool{
	"求职面试": true, "互联网校招": true, "秋招": true, "春招": true, "校招": true,
	"求职": true, "面试": true, "互联网": true, "大厂": true, "offer": true,
	"考研": true, "保研": true, "转专业": true, "升学深造": true,
	"计算机考研": true, "备考经验": true, "出国留学": true, "留学": true,
	"经验贴": true, "飞跃手册": true, "研途榜样": true, "程序员": true, "副业": true,
	"赚钱": true, "变现": true, "程序员副业": true, "海外院校": true,
}

var knownCompanies = []string{
	"阿里巴巴", "阿里", "腾讯", "字节跳动", "字节", "美团", "百度", "华为",
	"京东", "拼多多", "快手", "网易", "小米", "Google", "Microsoft", "微软",
	"Meta", "Facebook", "Amazon", "亚马逊", "Apple", "Netflix", "Shopee",
}

// NeedsSampleQuestionRefresh 判断是否需要重新生成示例问题（含半通用混合数据）。
func NeedsSampleQuestionRefresh(questions []string) bool {
	if IsGenericSampleQuestions(questions) {
		return true
	}
	genericCount := 0
	for _, q := range questions {
		q = strings.TrimSpace(q)
		if genericSampleQuestions[q] || isSemiGenericSampleQuestion(q) || isStupidSampleQuestion(q) {
			genericCount++
		}
	}
	return genericCount >= 2
}

// isSemiGenericSampleQuestion 识别「关于「保研」能分享什么？」类半通用展示问题。
func isSemiGenericSampleQuestion(q string) bool {
	q = strings.TrimSpace(q)
	for _, g := range []string{
		"研途榜样", "保研", "考研", "经验分享", "飞跃手册", "升学深造", "转专业",
		"经验贴", "备考", "留学", "基本信息", "录入信息",
	} {
		if strings.Contains(q, "「"+g+"」") {
			return true
		}
		if strings.HasPrefix(q, "关于"+g) && len([]rune(q)) <= len([]rune(g))+12 {
			return true
		}
	}
	return false
}

func isStupidSampleQuestion(q string) bool {
	if isSemiGenericSampleQuestion(q) {
		return true
	}
	if strings.HasPrefix(q, "关于「") && strings.HasSuffix(q, "」能分享什么？") {
		inner := strings.TrimPrefix(q, "关于「")
		inner = strings.TrimSuffix(inner, "」能分享什么？")
		if skipKnowledgeHeaders[inner] || isSchoolNameHook(inner) {
			return true
		}
	}
	return false
}

func filterStupidSampleQuestions(in []string) []string {
	out := make([]string, 0, len(in))
	for _, q := range in {
		if !isStupidSampleQuestion(q) {
			out = append(out, q)
		}
	}
	return out
}

func IsGenericSampleQuestions(questions []string) bool {
	if len(questions) == 0 {
		return true
	}
	for _, q := range questions {
		q = strings.TrimSpace(q)
		if q == "" {
			continue
		}
		if !genericSampleQuestions[q] {
			return false
		}
	}
	return true
}

// DisplaySampleQuestions 返回用于发现页/详情页展示的示例问题。
func DisplaySampleQuestions(stored []string, in SampleQuestionInput) []string {
	// 有知识库时始终优先从正文推导，避免 DB 里半通用旧问题挡住更新。
	if len(in.Knowledge) > 0 {
		if derived := DeriveSampleQuestions(in); len(derived) >= 2 {
			return limitSampleQuestions(derived, 4)
		}
	}
	cleaned := cleanSampleQuestions(stored)
	if !NeedsSampleQuestionRefresh(cleaned) {
		return limitSampleQuestions(cleaned, 4)
	}
	derived := DeriveSampleQuestions(in)
	if len(derived) >= 2 {
		return limitSampleQuestions(derived, 4)
	}
	return limitSampleQuestions(cleaned, 4)
}

// DeriveSampleQuestions 根据知识库或档案内容生成个性化示例问题。
func DeriveSampleQuestions(in SampleQuestionInput) []string {
	var out []string
	if len(in.Knowledge) > 0 {
		out = append(out, DeriveSampleQuestionsFromKnowledge(in.Knowledge)...)
	}
	out = append(out, questionsFromShortBio(in.ShortBio, in.School)...)
	out = append(out, questionsFromHeadline(in.Headline)...)
	out = append(out, questionsFromTags(in.ExpertiseTags)...)
	if len(out) < 2 {
		if job := strings.TrimSpace(in.Job); job != "" {
			out = append(out, "做"+truncateRunes(job, 16)+"有哪些经验？")
		}
		if school := strings.TrimSpace(in.School); school != "" && !strings.Contains(school, "求职") {
			out = append(out, school+"背景升学有什么具体建议？")
		}
	}
	return limitSampleQuestions(filterStupidSampleQuestions(uniqueSampleQuestions(out)), 4)
}

// questionsFromShortBio 从 shortBio 提取个性化问题（福大/安大/深大/上大等批量导入格式）。
func questionsFromShortBio(bio, school string) []string {
	bio = strings.TrimSpace(bio)
	if bio == "" {
		return nil
	}
	var out []string
	out = append(out, questionsFromExplicitDest(bio, school)...)
	out = append(out, questionsFromCommaBio(bio, school)...)
	out = append(out, questionsFromSourcePrefix(bio)...)
	return uniqueSampleQuestions(out)
}

func questionsFromExplicitDest(bio, school string) []string {
	var out []string
	for _, prefix := range []string{"转专业至", "保研至", "考研至", "考博至", "申请至", "录取至", "上岸"} {
		idx := strings.Index(bio, prefix)
		if idx < 0 {
			continue
		}
		rest := bio[idx+len(prefix):]
		dest := trimToClause(rest)
		if dest == "" || len([]rune(dest)) > 24 {
			continue
		}
		out = append(out, prefix+dest+"有哪些经验可以分享？")
		fromSchool := strings.TrimSpace(school)
		if fromSchool == "" {
			fromSchool = inferHomeSchool(bio[:idx])
		}
		if fromSchool != "" && fromSchool != dest {
			switch prefix {
			case "转专业至":
				out = append(out, "从"+truncateRunes(fromSchool, 12)+"转专业到"+truncateRunes(dest, 12)+"要补哪些课？")
				out = append(out, "跨考到"+truncateRunes(dest, 12)+"最难的一步是什么？")
			case "保研至":
				out = append(out, "从"+truncateRunes(fromSchool, 12)+"保研到"+truncateRunes(dest, 12)+"要注意什么？")
			case "考研至":
				out = append(out, truncateRunes(fromSchool, 12)+"考"+truncateRunes(dest, 12)+"难吗？")
			}
		}
		break
	}
	return out
}

// questionsFromCommaBio 解析「安徽大学xx专业，中国科学技术大学，分享保研…」类格式。
func questionsFromCommaBio(bio, school string) []string {
	parts := splitBioParts(bio)
	if len(parts) < 2 {
		return nil
	}
	dest := parts[1]
	if !isMeaningfulDest(dest) {
		return nil
	}
	home := strings.TrimSpace(school)
	if home == "" {
		home = inferHomeSchool(parts[0])
	}
	kind := bioShareKind(bio)
	destShort := truncateRunes(dest, 18)
	homeShort := truncateRunes(home, 12)
	var out []string
	switch kind {
	case "保研":
		if homeShort != "" && homeShort != destShort {
			out = append(out, "从"+homeShort+"保研到"+destShort+"要注意什么？")
		}
		out = append(out, destShort+"保研有哪些关键准备？")
	case "考研":
		if homeShort != "" {
			out = append(out, homeShort+"考"+destShort+"难吗？")
		}
		out = append(out, destShort+"考研复试有什么经验？")
	case "留学":
		if homeShort != "" {
			out = append(out, homeShort+"申请"+destShort+"有哪些经验？")
		} else {
			out = append(out, "申请"+destShort+"要注意什么？")
		}
	default:
		if homeShort != "" && homeShort != destShort {
			out = append(out, "从"+homeShort+"到"+destShort+"有哪些经验？")
		}
	}
	if major := extractMajorHint(parts[0]); major != "" {
		out = append(out, major+"方向升学有什么建议？")
	}
	return out
}

func questionsFromSourcePrefix(bio string) []string {
	idx := strings.Index(bio, "来自")
	if idx < 0 {
		return nil
	}
	rest := bio[idx+len("来自"):]
	colon := strings.IndexAny(rest, "：:")
	if colon < 0 {
		return nil
	}
	after := rest[colon+1:]
	if strings.HasPrefix(rest[colon:], "：") {
		after = rest[colon+len("："):]
	}
	topic := trimToClause(after)
	if topic == "" || len([]rune(topic)) < 3 || strings.Contains(topic, "xx") {
		return nil
	}
	topic = truncateRunes(topic, 18)
	return []string{
		"关于「" + topic + "」有什么经验？",
		topic + "有哪些实操建议？",
	}
}

func splitBioParts(bio string) []string {
	bio = strings.ReplaceAll(bio, ",", "，")
	var parts []string
	for _, p := range strings.Split(bio, "，") {
		p = strings.TrimSpace(p)
		if p != "" {
			parts = append(parts, p)
		}
	}
	return parts
}

func bioShareKind(bio string) string {
	switch {
	case strings.Contains(bio, "分享保研"), strings.Contains(bio, "保研经验"), strings.Contains(bio, "保研/"):
		return "保研"
	case strings.Contains(bio, "分享考研"), strings.Contains(bio, "考研经验"):
		return "考研"
	case strings.Contains(bio, "分享留学"), strings.Contains(bio, "留学经验"), strings.Contains(bio, "北美PhD"), strings.Contains(bio, "出国"):
		return "留学"
	case strings.Contains(bio, "分享求职"), strings.Contains(bio, "秋招"), strings.Contains(bio, "春招"):
		return "求职"
	default:
		return ""
	}
}

func inferHomeSchool(firstPart string) string {
	firstPart = strings.TrimSpace(firstPart)
	if i := strings.Index(firstPart, "大学"); i >= 0 {
		return firstPart[:i+len("大学")]
	}
	if len([]rune(firstPart)) > 12 {
		return truncateRunes(firstPart, 12)
	}
	return firstPart
}

func extractMajorHint(firstPart string) string {
	idx := strings.Index(firstPart, "专业")
	if idx <= 0 {
		return ""
	}
	start := idx - 10
	if start < 0 {
		start = 0
	}
	return strings.TrimSpace(firstPart[start:idx])
}

func isMeaningfulDest(dest string) bool {
	dest = strings.TrimSpace(dest)
	if dest == "" || len([]rune(dest)) < 2 {
		return false
	}
	for _, skip := range []string{
		"留学", "深造上岸", "分享", "xx", "xxxx", "xxx", "录取学校名", "录取公司名",
		"在这里", "起一个标题", "个人历程", "备考心得",
	} {
		if strings.Contains(dest, skip) {
			return false
		}
	}
	return true
}

func trimToClause(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	for i, r := range s {
		if r == '，' || r == ',' || r == '。' || r == '；' || r == ';' || r == ' ' && i > 1 {
			return strings.TrimSpace(s[:i])
		}
	}
	return s
}

func questionsFromHeadline(headline string) []string {
	headline = strings.TrimSpace(headline)
	if headline == "" {
		return nil
	}
	var out []string
	if topic := headlineTopic(headline); topic != "" {
		for _, prefix := range []string{"转专业至", "保研至", "考研至", "考博至", "申请至", "录取至"} {
			if strings.Contains(topic, prefix) {
				dest := strings.TrimSpace(strings.TrimPrefix(topic, prefix))
				if dest != "" {
					switch prefix {
					case "转专业至":
						out = append(out, "转专业到"+dest+"要补哪些先修课？")
					default:
						out = append(out, prefix+dest+"有哪些经验可以分享？")
					}
				}
				break
			}
		}
		out = append(out, "关于"+topic+"有什么经验？")
		if strings.Contains(topic, "资产") || strings.Contains(topic, "副业") || strings.Contains(topic, "赚钱") {
			out = append(out, topic+"具体怎么做？")
		}
	}
	for _, co := range knownCompanies {
		if !strings.Contains(headline, co) {
			continue
		}
		short := shortenCompanyName(co)
		switch {
		case containsAny(headline, "实习", "暑期", "日常实习"):
			out = append(out, short+"实习有哪些经验可以分享？")
		case containsAny(headline, "成长", "新人", "百日", "初入", "10天", "100天"):
			out = append(out, short+"新人怎么快速适应？")
		case containsAny(headline, "绩效", "五星", "晋升", "P7", "P6", "职级"):
			out = append(out, "在"+short+"怎么拿高绩效？")
		case containsAny(headline, "offer", "Offer", "OFFER", "拿到", "斩获", "拿下"):
			out = append(out, "拿"+short+" offer 的关键是什么？")
		default:
			out = append(out, "在"+short+"工作/实习是什么体验？")
		}
		break
	}
	for _, role := range []string{"后端", "前端", "算法", "客户端", "iOS", "Android", "测试", "运维", "产品经理", "C/C++", "Java", "Go", "嵌入式", "FPGA"} {
		if strings.Contains(headline, role) {
			out = append(out, role+"方向求职要注意什么？")
			break
		}
	}
	if containsAny(headline, "秋招", "春招", "校招", "社招", "转行", "Gap", "gap") {
		if containsAny(headline, "秋招") {
			out = append(out, "秋招过程中有哪些关键节点？")
		} else if containsAny(headline, "转行") {
			out = append(out, "转行互联网有哪些坑要避免？")
		} else if containsAny(headline, "Gap", "gap") {
			out = append(out, "Gap 期间怎么保持竞争力？")
		}
	}
	hook := headlineHook(headline)
	if hook != "" {
		out = append(out, "关于「"+hook+"」能分享什么？")
	}
	return uniqueSampleQuestions(out)
}

func questionsFromTags(tags []string) []string {
	var out []string
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag == "" || genericExpertiseTags[tag] {
			continue
		}
		if isKnownCompany(tag) {
			out = append(out, "进"+shortenCompanyName(tag)+"有什么经验？")
			continue
		}
		if len([]rune(tag)) <= 14 {
			out = append(out, "关于"+tag+"有什么建议？")
		}
		if len(out) >= 2 {
			break
		}
	}
	return out
}

func questionsFromBio(bio string) []string {
	bio = strings.TrimSpace(bio)
	if bio == "" {
		return nil
	}
	if i := strings.Index(bio, "："); i >= 0 && i+1 < len(bio) {
		tail := strings.TrimSpace(bio[i+len("："):])
		if hook := headlineHook(tail); hook != "" {
			return []string{hook + "有哪些实操建议？"}
		}
	}
	hook := headlineHook(bio)
	if hook == "" {
		return nil
	}
	return []string{"你的「" + hook + "」经历是怎样的？"}
}

func headlineHook(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	if topic := headlineTopic(s); topic != "" {
		return truncateRunes(topic, 18)
	}
	runes := []rune(s)
	if len(runes) > 18 {
		return string(runes[:18])
	}
	return s
}

// headlineTopic 取 headline 中 · 后的主题片段，跳过昵称前缀。
func headlineTopic(headline string) string {
	parts := strings.Split(headline, "·")
	if len(parts) < 2 {
		return ""
	}
	topic := strings.TrimSpace(parts[len(parts)-1])
	if topic == "" {
		return ""
	}
	return truncateRunes(topic, 22)
}

func shortenCompanyName(name string) string {
	switch name {
	case "阿里巴巴":
		return "阿里"
	case "字节跳动":
		return "字节"
	default:
		return name
	}
}

func isKnownCompany(name string) bool {
	for _, co := range knownCompanies {
		if name == co || strings.Contains(name, co) {
			return true
		}
	}
	return false
}

func cleanSampleQuestions(in []string) []string {
	out := make([]string, 0, len(in))
	for _, q := range in {
		q = strings.TrimSpace(q)
		if q != "" {
			out = append(out, q)
		}
	}
	return out
}

func uniqueSampleQuestions(in []string) []string {
	seen := make(map[string]bool, len(in))
	out := make([]string, 0, len(in))
	for _, q := range in {
		q = strings.TrimSpace(q)
		if q == "" || seen[q] {
			continue
		}
		seen[q] = true
		out = append(out, q)
	}
	return out
}

func limitSampleQuestions(in []string, max int) []string {
	if max <= 0 || len(in) <= max {
		return in
	}
	return in[:max]
}
