package yantuseed

import (
	"fmt"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/wechathtml"
)

var schools985 = map[string]bool{
	"北京大学": true, "清华大学": true, "复旦大学": true, "上海交通大学": true, "浙江大学": true,
	"南京大学": true, "中国科学技术大学": true, "哈尔滨工业大学": true, "西安交通大学": true,
	"北京理工大学": true, "南开大学": true, "天津大学": true, "东南大学": true, "武汉大学": true,
	"华中科技大学": true, "中山大学": true, "厦门大学": true, "山东大学": true, "四川大学": true,
	"吉林大学": true, "大连理工大学": true, "中南大学": true, "湖南大学": true, "重庆大学": true,
	"电子科技大学": true, "西北工业大学": true, "兰州大学": true, "东北大学": true,
	"华南理工大学": true, "北京航空航天大学": true, "同济大学": true, "中国人民大学": true,
	"北京师范大学": true, "中国农业大学": true, "国防科技大学": true, "中央民族大学": true,
	"华东师范大学": true, "西北农林科技大学": true, "中国海洋大学": true,
}

var schools211 = map[string]bool{
	"北京邮电大学": true, "北京交通大学": true, "北京工业大学": true, "北京科技大学": true,
	"北京化工大学": true, "北京林业大学": true, "北京中医药大学": true, "北京外国语大学": true,
	"北京体育大学": true, "中央音乐学院": true, "中国传媒大学": true, "中央财经大学": true,
	"对外经济贸易大学": true, "华北电力大学": true, "中国政法大学": true, "中国矿业大学": true,
	"中国石油大学": true, "中国地质大学": true, "河北工业大学": true, "太原理工大学": true,
	"内蒙古大学": true, "辽宁大学": true, "大连海事大学": true, "延边大学": true,
	"东北师范大学": true, "哈尔滨工程大学": true, "东北农业大学": true, "东北林业大学": true,
	"上海财经大学": true, "上海外国语大学": true, "华东理工大学": true, "东华大学": true,
	"上海大学": true, "苏州大学": true, "南京航空航天大学": true, "南京理工大学": true,
	"中国药科大学": true, "河海大学": true, "江南大学": true, "南京师范大学": true,
	"南京农业大学": true, "安徽大学": true, "合肥工业大学": true, "福州大学": true,
	"南昌大学": true, "郑州大学": true, "武汉理工大学": true, "华中农业大学": true,
	"华中师范大学": true, "中南财经政法大学": true, "暨南大学": true, "华南师范大学": true,
	"广西大学": true, "海南大学": true, "西南交通大学": true, "西南大学": true,
	"西南财经大学": true, "四川农业大学": true, "贵州大学": true, "云南大学": true,
	"西藏大学": true, "西北大学": true, "西安电子科技大学": true, "长安大学": true,
	"陕西师范大学": true, "青海大学": true, "宁夏大学": true, "新疆大学": true,
	"石河子大学": true,
}

func isCNUniversity(school string) bool {
	if allCNUniversities[school] {
		return true
	}
	for k := range allCNUniversities {
		if strings.Contains(school, k) || strings.Contains(k, school) {
			return true
		}
	}
	return false
}

func lookupOverseas(school string) (overseasUnivInfo, bool) {
	if info, ok := overseasUniversities[school]; ok {
		return info, true
	}
	for k, info := range overseasUniversities {
		if strings.Contains(school, k) || strings.Contains(k, school) {
			return info, true
		}
	}
	return overseasUnivInfo{}, false
}

func schoolTierTags(school string) []string {
	s := strings.TrimSpace(school)
	if s == "" {
		return nil
	}
	if schools985[s] {
		return []string{"985", "211", "双一流"}
	}
	if schools211[s] {
		return []string{"211", "双一流"}
	}
	for k := range schools985 {
		if strings.Contains(s, k) || strings.Contains(k, s) {
			return []string{"985", "211", "双一流"}
		}
	}
	for k := range schools211 {
		if strings.Contains(s, k) || strings.Contains(k, s) {
			return []string{"211", "双一流"}
		}
	}
	if isCNUniversity(s) {
		return []string{"双非"}
	}
	if info, ok := lookupOverseas(s); ok {
		tags := []string{"海外院校", info.Tier}
		if info.Country != "" {
			tags = append(tags, info.Country)
		}
		if info.Region != "" {
			tags = append(tags, info.Region)
		}
		return tags
	}
	return []string{"海外院校"}
}

func expertiseTagsFor(p Profile) models.JSONArray {
	var base []string
	if len(p.ExpertiseTags) > 0 {
		base = p.ExpertiseTags
	} else if strings.TrimSpace(p.LongBioPrefix) != "" {
		base = []string{"考研", "数学", "浙江大学", "飞跃手册"}
	} else {
		base = []string{"考研", "计算机考研", "备考经验", "温州大学"}
	}
	tierTags := schoolTierTags(p.School)
	if len(tierTags) == 0 {
		return models.JSONArray(base)
	}
	existing := make(map[string]bool, len(base))
	for _, t := range base {
		existing[t] = true
	}
	merged := append([]string{}, base...)
	for _, t := range tierTags {
		if !existing[t] {
			merged = append(merged, t)
		}
	}
	return models.JSONArray(merged)
}

func sampleQuestionsFor(p Profile) models.JSONArray {
	if len(p.SampleQuestions) > 0 {
		return models.JSONArray(p.SampleQuestions)
	}
	return models.JSONArray{
		"11408 和 22408 怎么选？",
		"数学和专业课怎么安排复习节奏？",
		"调剂时有哪些需要注意的？",
	}
}

func strPtr(s string) *string { return &s }

func strOrNil(s string) *string {
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return &s
}

func shortSeries(title string) string {
	title = strings.TrimSpace(title)
	if i := strings.Index(title, "|"); i >= 0 {
		return strings.TrimSpace(title[i+1:])
	}
	return title
}

func firstSentence(s string) string {
	s = strings.TrimSpace(s)
	for _, sep := range []string{"。", "！", "？", "\n"} {
		if i := strings.Index(s, sep); i > 40 && i < 200 {
			return s[:i+len(sep)]
		}
	}
	return wechathtml.TrimRunes(s, 160)
}

// UpsertProfile 按 display_name + user_id 幂等写入/更新档案与一条知识库。
// coverPreset 非空时写入 cover_preset_key；为空时为该昵称分配稳定 Unsplash 封面 URL（见 YantuCoverPhotoURLs）。
func UpsertProfile(userID, coverPreset string, p Profile) error {
	if strings.TrimSpace(p.KnowledgeBody) == "" {
		return fmt.Errorf("empty knowledge for %q", p.DisplayName)
	}
	title := strings.TrimSpace(p.ArticleTitle)
	headline := fmt.Sprintf("%s · %s", p.DisplayName, shortSeries(title))
	if title == "" {
		headline = p.DisplayName + " · 考研经验分享"
	}
	headline = wechathtml.TrimRunes(headline, 512)

	var longBio string
	if strings.TrimSpace(p.LongBioPrefix) != "" {
		longBio = strings.TrimSpace(p.LongBioPrefix) + " 收录篇目：" + title + "。" + firstSentence(p.KnowledgeBody)
	} else {
		longBio = fmt.Sprintf("本文来自温州大学计算机与人工智能学院微信公众号「研途榜样」系列（%s）。%s", title, firstSentence(p.KnowledgeBody))
	}
	majorLabel := "考研专业"
	if strings.TrimSpace(p.MajorLabel) != "" {
		majorLabel = strings.TrimSpace(p.MajorLabel)
	}
	if strings.TrimSpace(p.MajorLine) != "" {
		longBio += " " + majorLabel + "：" + strings.TrimSpace(p.MajorLine) + "。"
	}
	if strings.TrimSpace(p.ScoreLine) != "" {
		longBio += " " + strings.TrimSpace(p.ScoreLine) + "。"
	}
	short := strings.TrimSpace(p.ShortBio)
	if short == "" {
		short = fmt.Sprintf("%s上岸经验分享，供考研同学参考。", p.DisplayName)
	}
	short = wechathtml.TrimRunes(short, 500)

	var profile models.LifeAgentProfile
	errFound := db.DB.Where("user_id = ? AND display_name = ?", userID, p.DisplayName).First(&profile).Error
	coverURL := ""
	if strings.TrimSpace(coverPreset) == "" {
		coverURL = YantuSeedCoverURL(p.DisplayName)
	}
	if errFound == nil {
		db.DB.Where("profile_id = ?", profile.ID).Delete(&models.LifeAgentKnowledgeEntry{})
		updates := map[string]interface{}{
			"headline":         headline,
			"short_bio":        short,
			"long_bio":         longBio,
			"school":           strOrNil(p.School),
			"published":        true,
			"expertise_tags":   expertiseTagsFor(p),
			"sample_questions": sampleQuestionsFor(p),
		}
		if strings.TrimSpace(p.Audience) != "" {
			updates["audience"] = strings.TrimSpace(p.Audience)
		}
		if strings.TrimSpace(p.WelcomeMessage) != "" {
			updates["welcome_message"] = strings.TrimSpace(p.WelcomeMessage)
		}
		if strings.TrimSpace(p.Education) != "" {
			updates["education"] = strOrNil(p.Education)
		}
		if strings.TrimSpace(p.OriginalAuthor) != "" {
			updates["original_author"] = strOrNil(p.OriginalAuthor)
		}
		if strings.TrimSpace(coverPreset) != "" {
			updates["cover_preset_key"] = strOrNil(coverPreset)
			updates["cover_image_url"] = nil
		} else {
			updates["cover_preset_key"] = nil
			updates["cover_image_url"] = coverURL
		}
		if err := db.DB.Model(&profile).Updates(updates).Error; err != nil {
			return err
		}
		fmt.Println("updated profile", p.DisplayName)
	} else {
		var coverImg *string
		var presetKey *string
		if strings.TrimSpace(coverPreset) != "" {
			presetKey = strOrNil(coverPreset)
		} else {
			coverImg = strPtr(coverURL)
		}
		audience := "正在备考或规划考研的同学，尤其计算机相关专业。"
		if strings.TrimSpace(p.Audience) != "" {
			audience = strings.TrimSpace(p.Audience)
		}
		welcome := fmt.Sprintf("你好，我是%s，欢迎问我关于考研备考、择校和心态调整的问题。", p.DisplayName)
		if strings.TrimSpace(p.WelcomeMessage) != "" {
			welcome = strings.TrimSpace(p.WelcomeMessage)
		}
		edu := "硕士研究生（已录取或就读）"
		if strings.TrimSpace(p.Education) != "" {
			edu = strings.TrimSpace(p.Education)
		}
		profile = models.LifeAgentProfile{
			ID:               models.GenID(),
			UserID:           userID,
			DisplayName:      p.DisplayName,
			Headline:         headline,
			ShortBio:         short,
			LongBio:          longBio,
			Audience:         audience,
			WelcomeMessage:   welcome,
			PricePerQuestion: 990,
			ExpertiseTags:    expertiseTagsFor(p),
			SampleQuestions:  sampleQuestionsFor(p),
			School:           strOrNil(p.School),
			Education:        strPtr(edu),
			OriginalAuthor:   strOrNil(p.OriginalAuthor),
			CoverImageURL:    coverImg,
			CoverPresetKey:   presetKey,
			Published:        true,
		}
		if err := db.DB.Create(&profile).Error; err != nil {
			return err
		}
		fmt.Println("created profile", p.DisplayName)
	}

	kTitle := "研途榜样｜考研经验（原文整理）"
	if title != "" {
		kTitle = "研途榜样｜" + shortSeries(title)
	}
	kCategory := "考研经验"
	if strings.TrimSpace(p.KnowledgeCategory) != "" {
		kCategory = strings.TrimSpace(p.KnowledgeCategory)
	}
	kTags := models.JSONArray{"考研", "经验贴", "计算机"}
	if len(p.KnowledgeTags) > 0 {
		kTags = models.JSONArray(p.KnowledgeTags)
	}
	entry := models.LifeAgentKnowledgeEntry{
		ID:        models.GenID(),
		ProfileID: profile.ID,
		Category:  kCategory,
		Title:     wechathtml.TrimRunes(kTitle, 255),
		Content:   p.KnowledgeBody,
		Tags:      kTags,
		SortOrder: 0,
	}
	if err := db.DB.Create(&entry).Error; err != nil {
		return err
	}
	fmt.Println("  knowledge entry", entry.Title)
	return nil
}

// Profiles 为当前仓库内置的榜样正文：研途榜样 3 人 + 浙大数院飞跃手册（2021）全书目录内学长学姐（考研+保研+境内/境外升学+院外受邀金工）+ 北邮飞跃手册第十四章申请经验谈 23 人 + 华科飞跃手册 2020 光电/工科 27 人 + 南科大飞跃手册 CS/ENG/SCI/BIZ/MED 148 人 + 广工保研手册 8 人 + 川师升学 Wiki 59 人。
func Profiles() []Profile {
	n := 3 + len(zjuFeyue2021Profiles) + len(zjuFeyue2021ProfilesMore) + len(zjuFeyue2021ProfilesAbroad) +
		len(zjuFeyue2021ProfilesDomesticRemain1) + len(zjuFeyue2021ProfilesDomesticRemain2) + len(zjuFeyue2021ProfilesAbroadMore) +
		len(buptFeyueProfiles) + len(hustFeyueProfiles) +
		len(sustechFeyueCSProfiles) + len(sustechFeyueENGProfiles) + len(sustechFeyueSCIProfiles) +
		len(sustechFeyueBIZProfiles) + len(sustechFeyueMEDProfiles) +
		len(gdutFeyueProfiles) + len(sicnuFeyueProfiles1) + len(sicnuFeyueProfiles2)
	out := make([]Profile, 0, n)
	out = append(out, yaoShengJie, zhangGuiShuo, yangChenYang)
	out = append(out, zjuFeyue2021Profiles...)
	out = append(out, zjuFeyue2021ProfilesMore...)
	out = append(out, zjuFeyue2021ProfilesDomesticRemain1...)
	out = append(out, zjuFeyue2021ProfilesDomesticRemain2...)
	out = append(out, zjuFeyue2021ProfilesAbroad...)
	out = append(out, zjuFeyue2021ProfilesAbroadMore...)
	out = append(out, buptFeyueProfiles...)
	out = append(out, hustFeyueProfiles...)
	out = append(out, sustechFeyueCSProfiles...)
	out = append(out, sustechFeyueENGProfiles...)
	out = append(out, sustechFeyueSCIProfiles...)
	out = append(out, sustechFeyueBIZProfiles...)
	out = append(out, sustechFeyueMEDProfiles...)
	out = append(out, gdutFeyueProfiles...)
	out = append(out, sicnuFeyueProfiles1...)
	out = append(out, sicnuFeyueProfiles2...)
	return out
}
