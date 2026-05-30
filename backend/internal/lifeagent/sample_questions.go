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
}

var genericSampleQuestions = map[string]bool{
	"双非背景如何拿大厂offer？":   true,
	"秋招时间线怎么安排？":       true,
	"技术面试怎么准备？":         true,
	"如何选择offer？":          true,
	"程序员怎么搞副业？":         true,
	"有什么好的赚钱方法？":       true,
	"副业能赚多少？":             true,
	"清华出国读PhD怎么准备？":    true,
	"怎么选留学方向？":           true,
	"留学申请时间线？":           true,
	"山大申请海外PhD需要什么条件？": true,
	"如何准备GRE和托福？":        true,
	"985背景如何定位选校？":      true,
	"上大保研需要什么条件？":     true,
	"考研和保研怎么选择？":       true,
	"如何平衡学业和实习？":       true,
	"11408 和 224408 怎么选？":  true,
	"数学和专业课怎么安排复习节奏？": true,
	"调剂时有哪些需要注意的？":   true,
	"关于赚钱有什么建议？":       true,
	"关于变现有什么建议？":       true,
}

var genericExpertiseTags = map[string]bool{
	"求职面试": true, "互联网校招": true, "秋招": true, "春招": true, "校招": true,
	"求职": true, "面试": true, "互联网": true, "大厂": true, "offer": true,
	"考研": true, "计算机考研": true, "备考经验": true, "出国留学": true,
	"经验贴": true, "飞跃手册": true, "程序员": true, "副业": true,
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
		if genericSampleQuestions[strings.TrimSpace(q)] {
			genericCount++
		}
	}
	return genericCount >= 2
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
	cleaned := cleanSampleQuestions(stored)
	if !IsGenericSampleQuestions(cleaned) {
		return limitSampleQuestions(cleaned, 4)
	}
	derived := DeriveSampleQuestions(in)
	if len(derived) >= 2 {
		return limitSampleQuestions(derived, 4)
	}
	return limitSampleQuestions(cleaned, 4)
}

// DeriveSampleQuestions 根据档案内容生成个性化示例问题。
func DeriveSampleQuestions(in SampleQuestionInput) []string {
	var out []string
	out = append(out, questionsFromHeadline(in.Headline)...)
	out = append(out, questionsFromTags(in.ExpertiseTags)...)
	out = append(out, questionsFromBio(in.ShortBio)...)
	if job := strings.TrimSpace(in.Job); job != "" {
		out = append(out, "做"+truncateRunes(job, 16)+"有哪些经验？")
	}
	if school := strings.TrimSpace(in.School); school != "" && !strings.Contains(school, "求职") {
		out = append(out, school+"背景求职/升学有什么建议？")
	}
	return limitSampleQuestions(uniqueSampleQuestions(out), 4)
}

func questionsFromHeadline(headline string) []string {
	headline = strings.TrimSpace(headline)
	if headline == "" {
		return nil
	}
	var out []string
	if topic := headlineTopic(headline); topic != "" {
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
