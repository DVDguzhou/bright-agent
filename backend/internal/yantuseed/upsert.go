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
	if strings.TrimSpace(p.MajorLine) != "" {
		longBio += " 考研专业：" + strings.TrimSpace(p.MajorLine) + "。"
	}
	if strings.TrimSpace(p.ScoreLine) != "" {
		longBio += " " + strings.TrimSpace(p.ScoreLine) + "。"
	}
	short := fmt.Sprintf("%s上岸经验分享，供考研同学参考。", p.DisplayName)
	short = wechathtml.TrimRunes(short, 500)

	var profile models.LifeAgentProfile
	errFound := db.DB.Where("user_id = ? AND display_name = ?", userID, p.DisplayName).First(&profile).Error
	if errFound == nil {
		db.DB.Where("profile_id = ?", profile.ID).Delete(&models.LifeAgentKnowledgeEntry{})
		updates := map[string]interface{}{
			"headline":         headline,
			"short_bio":        short,
			"long_bio":         longBio,
			"school":           strOrNil(p.School),
			"published":        true,
			"cover_preset_key": coverPreset,
			"expertise_tags":   expertiseTagsFor(p),
			"sample_questions": sampleQuestionsFor(p),
		}
		if err := db.DB.Model(&profile).Updates(updates).Error; err != nil {
			return err
		}
		fmt.Println("updated profile", p.DisplayName)
	} else {
		profile = models.LifeAgentProfile{
			ID:               models.GenID(),
			UserID:           userID,
			DisplayName:      p.DisplayName,
			Headline:         headline,
			ShortBio:         short,
			LongBio:          longBio,
			Audience:         "正在备考或规划考研的同学，尤其计算机相关专业。",
			WelcomeMessage:   fmt.Sprintf("你好，我是%s，欢迎问我关于考研备考、择校和心态调整的问题。", p.DisplayName),
			PricePerQuestion: 990,
			ExpertiseTags:    expertiseTagsFor(p),
			SampleQuestions:  sampleQuestionsFor(p),
			School:         strOrNil(p.School),
			Education:      strPtr("硕士研究生（已录取或就读）"),
			CoverPresetKey: strPtr(coverPreset),
			Published:      true,
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
	entry := models.LifeAgentKnowledgeEntry{
		ID:        models.GenID(),
		ProfileID: profile.ID,
		Category:  "考研经验",
		Title:     wechathtml.TrimRunes(kTitle, 255),
		Content:   p.KnowledgeBody,
		Tags:      models.JSONArray{"考研", "经验贴", "计算机"},
		SortOrder: 0,
	}
	if err := db.DB.Create(&entry).Error; err != nil {
		return err
	}
	fmt.Println("  knowledge entry", entry.Title)
	return nil
}

// Profiles 为当前仓库内置的榜样正文：研途榜样 3 人 + 浙大数院飞跃手册（2021）节选 15 人（考研+保研）。
func Profiles() []Profile {
	n := 3 + len(zjuFeyue2021Profiles) + len(zjuFeyue2021ProfilesMore)
	out := make([]Profile, 0, n)
	out = append(out, yaoShengJie, zhangGuiShuo, yangChenYang)
	out = append(out, zjuFeyue2021Profiles...)
	out = append(out, zjuFeyue2021ProfilesMore...)
	return out
}
