package yantuseed

import (
	"fmt"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/wechathtml"
)

func expertiseTagsFor(p Profile) models.JSONArray {
	if len(p.ExpertiseTags) > 0 {
		return models.JSONArray(p.ExpertiseTags)
	}
	if strings.TrimSpace(p.LongBioPrefix) != "" {
		return models.JSONArray{"考研", "数学", "浙江大学", "飞跃手册"}
	}
	return models.JSONArray{"考研", "计算机考研", "备考经验", "温州大学"}
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

// Profiles 为当前仓库内置的榜样正文：研途榜样 3 人 + 浙大数院飞跃手册（2021）全书目录内学长学姐（考研+保研+境内/境外升学+院外受邀金工）+ 北邮飞跃手册第十四章申请经验谈 23 人 + 华科飞跃手册 2020 光电/工科 27 人 + 南科大飞跃手册 CS/ENG/SCI/BIZ/MED 148 人。
func Profiles() []Profile {
	n := 3 + len(zjuFeyue2021Profiles) + len(zjuFeyue2021ProfilesMore) + len(zjuFeyue2021ProfilesAbroad) +
		len(zjuFeyue2021ProfilesDomesticRemain1) + len(zjuFeyue2021ProfilesDomesticRemain2) + len(zjuFeyue2021ProfilesAbroadMore) +
		len(buptFeyueProfiles) + len(hustFeyueProfiles) +
		len(sustechFeyueCSProfiles) + len(sustechFeyueENGProfiles) + len(sustechFeyueSCIProfiles) +
		len(sustechFeyueBIZProfiles) + len(sustechFeyueMEDProfiles)
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
	return out
}
