package handler

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
func strOpt(v string) *string {
	if v == "" {
		return nil
	}
	return &v
}

func coalesceVerificationStatus(v string) string {
	switch v {
	case "verified", "pending":
		return v
	default:
		return "none"
	}
}

func buildLifeAgentRatingState(profileID, buyerID string) gin.H {
	var usedQuestions int
	db.DB.Raw(
		"SELECT COALESCE(SUM(questions_used), 0) FROM life_agent_question_packs WHERE profile_id = ? AND buyer_id = ? AND status = ?",
		profileID, buyerID, "paid",
	).Scan(&usedQuestions)

	var rating models.LifeAgentRating
	hasRating := db.DB.Where("profile_id = ? AND buyer_id = ?", profileID, buyerID).First(&rating).Error == nil

	currentMilestone := (usedQuestions / 10) * 10
	eligible := currentMilestone >= 10 && (usedQuestions%10 == 0 || (hasRating && rating.LastRatedMilestone == currentMilestone))
	nextMilestone := 10
	if currentMilestone >= 10 {
		if eligible && (!hasRating || rating.LastRatedMilestone < currentMilestone) {
			nextMilestone = currentMilestone
		} else {
			nextMilestone = currentMilestone + 10
		}
	}

	state := gin.H{
		"usedQuestions":      usedQuestions,
		"eligible":           eligible,
		"nextMilestone":      nextMilestone,
		"currentMilestone":   currentMilestone,
		"lastRatedMilestone": 0,
		"currentScore":       nil,
		"currentComment":     "",
	}
	if hasRating {
		state["lastRatedMilestone"] = rating.LastRatedMilestone
		state["currentScore"] = rating.Score
		state["currentComment"] = ptrStr(rating.Comment)
	}
	return state
}

func buildLifeAgentRatingsSummary(profileID string, limit int) gin.H {
	var average float64
	var raters int64
	db.DB.Model(&models.LifeAgentRating{}).Where("profile_id = ?", profileID).Count(&raters)
	db.DB.Model(&models.LifeAgentRating{}).Where("profile_id = ?", profileID).Select("COALESCE(AVG(score),0)").Scan(&average)

	var recent []models.LifeAgentRating
	db.DB.Where("profile_id = ?", profileID).Order("updated_at DESC").Limit(limit).Find(&recent)
	list := make([]gin.H, 0, len(recent))
	for _, r := range recent {
		list = append(list, gin.H{
			"id":        r.ID,
			"score":     r.Score,
			"comment":   r.Comment,
			"updatedAt": r.UpdatedAt.Format("2006-01-02 15:04"),
		})
	}

	return gin.H{
		"averageScore": average,
		"raters":       raters,
		"recent":       list,
	}
}

func buildLifeAgentChatReferences(refs models.JSONAny) []gin.H {
	list := make([]gin.H, 0, len(refs))
	for _, item := range refs {
		refMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		list = append(list, gin.H{
			"id":       refMap["id"],
			"category": refMap["category"],
			"title":    refMap["title"],
			"excerpt":  refMap["excerpt"],
		})
	}
	return list
}

func buildLifeAgentSessionTitle(message string) string {
	title := strings.TrimSpace(message)
	if title == "" {
		return "新的聊天"
	}
	runes := []rune(title)
	if len(runes) > 40 {
		return string(runes[:40])
	}
	return title
}

func LifeAgentsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var profiles []models.LifeAgentProfile
		if err := db.DB.Where("published = ?", true).Order("updated_at DESC").Find(&profiles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		if len(profiles) == 0 {
			c.JSON(http.StatusOK, []gin.H{})
			return
		}
		ids := make([]string, len(profiles))
		userIDs := make(map[string]bool)
		for i, p := range profiles {
			ids[i] = p.ID
			userIDs[p.UserID] = true
		}
		uniqueUserIDs := make([]string, 0, len(userIDs))
		for uid := range userIDs {
			uniqueUserIDs = append(uniqueUserIDs, uid)
		}
		var users []models.User
		db.DB.Where("id IN ?", uniqueUserIDs).Find(&users)
		userMap := make(map[string]models.User)
		for _, u := range users {
			userMap[u.ID] = u
		}
		type aggRow struct {
			ProfileID string `gorm:"column:profile_id"`
			Cnt       int64  `gorm:"column:cnt"`
		}
		kMap := make(map[string]int64)
		var kRows []aggRow
		db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_knowledge_entries WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&kRows)
		for _, r := range kRows {
			kMap[r.ProfileID] = r.Cnt
		}
		qpMap := make(map[string]int64)
		var qpRows []aggRow
		db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_question_packs WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&qpRows)
		for _, r := range qpRows {
			qpMap[r.ProfileID] = r.Cnt
		}
		sessMap := make(map[string]int64)
		var sessRows []aggRow
		db.DB.Raw("SELECT profile_id, COUNT(*) AS cnt FROM life_agent_chat_sessions WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&sessRows)
		for _, r := range sessRows {
			sessMap[r.ProfileID] = r.Cnt
		}
		type ratingAgg struct {
			ProfileID string  `gorm:"column:profile_id"`
			Raters    int64   `gorm:"column:raters"`
			Avg       float64 `gorm:"column:avg"`
		}
		ratingMap := make(map[string]gin.H)
		var ratingRows []ratingAgg
		db.DB.Raw("SELECT profile_id, COUNT(*) AS raters, COALESCE(AVG(score),0) AS avg FROM life_agent_ratings WHERE profile_id IN ? GROUP BY profile_id", ids).Scan(&ratingRows)
		for _, r := range ratingRows {
			ratingMap[r.ProfileID] = gin.H{"averageScore": r.Avg, "raters": r.Raters, "recent": []gin.H{}}
		}
		for _, id := range ids {
			if _, ok := ratingMap[id]; !ok {
				ratingMap[id] = gin.H{"averageScore": 0.0, "raters": 0, "recent": []gin.H{}}
			}
		}
		var resp []gin.H
		for _, p := range profiles {
			u := userMap[p.UserID]
			ratingsSummary := ratingMap[p.ID]
			resp = append(resp, gin.H{
				"id":                 p.ID,
				"displayName":        p.DisplayName,
				"headline":           p.Headline,
				"shortBio":           p.ShortBio,
				"audience":           p.Audience,
				"welcomeMessage":     p.WelcomeMessage,
				"pricePerQuestion":   p.PricePerQuestion,
				"expertiseTags":      p.ExpertiseTags,
				"sampleQuestions":    p.SampleQuestions,
				"education":          ptrStr(p.Education),
				"income":             ptrStr(p.Income),
				"job":                ptrStr(p.Job),
				"school":             ptrStr(p.School),
				"country":            ptrStr(p.Country),
				"province":           ptrStr(p.Province),
				"city":               ptrStr(p.City),
				"county":             ptrStr(p.County),
				"regions":            p.Regions,
				"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
				"creator":            gin.H{"id": u.ID, "name": u.Name, "email": u.Email},
				"knowledgeCount":     kMap[p.ID],
				"soldQuestionPacks":  qpMap[p.ID],
				"sessionCount":       sessMap[p.ID],
				"ratings":            ratingsSummary,
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			DisplayName        string   `json:"displayName" binding:"required,min=2"`
			Headline           string   `json:"headline" binding:"required,min=4"`
			ShortBio           string   `json:"shortBio" binding:"required"`
			LongBio            string   `json:"longBio" binding:"required"`
			Audience           string   `json:"audience" binding:"required"`
			WelcomeMessage     string   `json:"welcomeMessage" binding:"required,min=10"`
			PricePerQuestion   int      `json:"pricePerQuestion"`
			Education          string   `json:"education"`
			Income             string   `json:"income"`
			Job                string   `json:"job"`
			School             string   `json:"school"`
			Country            string   `json:"country"`
			Province           string   `json:"province"`
			City               string   `json:"city"`
			County             string   `json:"county"`
			Regions            []string `json:"regions" binding:"omitempty,max=2,dive,min=1"`
			MBTI               string   `json:"mbti"`
			PersonaArchetype   string   `json:"personaArchetype"`
			ToneStyle          string   `json:"toneStyle"`
			ResponseStyle      string   `json:"responseStyle"`
			ForbiddenPhrases   []string `json:"forbiddenPhrases" binding:"max=8,dive,min=1"`
			ExampleReplies     []string `json:"exampleReplies" binding:"required,min=2,max=3,dive,min=10"`
			ExpertiseTags      []string `json:"expertiseTags" binding:"required,min=1,max=8,dive,min=1"`
			SampleQuestions    []string `json:"sampleQuestions" binding:"required,min=2,max=6,dive,min=3"`
			NotSuitableFor     string   `json:"notSuitableFor"`
			VerificationStatus string   `json:"verificationStatus"` // none, pending, verified
			KnowledgeEntries   []struct {
				Category string   `json:"category" binding:"required"`
				Title    string   `json:"title" binding:"required"`
				Content  string   `json:"content" binding:"required"`
				Tags     []string `json:"tags" binding:"required,min=1,dive,min=1"`
			} `json:"knowledgeEntries" binding:"required,min=2,max=30,dive"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": err.Error()})
			return
		}
		if body.PricePerQuestion <= 0 {
			body.PricePerQuestion = 990
		}

		profileID := models.GenID()
		p := models.LifeAgentProfile{
			ID:                 profileID,
			UserID:             user.ID,
			DisplayName:        body.DisplayName,
			Headline:           body.Headline,
			ShortBio:           body.ShortBio,
			LongBio:            body.LongBio,
			Audience:           body.Audience,
			WelcomeMessage:     body.WelcomeMessage,
			PricePerQuestion:   body.PricePerQuestion,
			ExpertiseTags:      models.JSONArray(body.ExpertiseTags),
			SampleQuestions:    models.JSONArray(body.SampleQuestions),
			Education:          strOpt(body.Education),
			Income:             strOpt(body.Income),
			Job:                strOpt(body.Job),
			School:             strOpt(body.School),
			Country:            strOpt(body.Country),
			Province:           strOpt(body.Province),
			City:               strOpt(body.City),
			County:             strOpt(body.County),
			Regions:            models.JSONArray(body.Regions),
			MBTI:               strOpt(body.MBTI),
			PersonaArchetype:   strOpt(body.PersonaArchetype),
			ToneStyle:          strOpt(body.ToneStyle),
			ResponseStyle:      strOpt(body.ResponseStyle),
			ForbiddenPhrases:   models.JSONArray(body.ForbiddenPhrases),
			ExampleReplies:     models.JSONArray(body.ExampleReplies),
			NotSuitableFor:     strOpt(body.NotSuitableFor),
			VerificationStatus: coalesceVerificationStatus(body.VerificationStatus),
			Published:          true,
		}
		if err := db.DB.Create(&p).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		for i, e := range body.KnowledgeEntries {
			k := models.LifeAgentKnowledgeEntry{
				ID:        models.GenID(),
				ProfileID: profileID,
				Category:  e.Category,
				Title:     e.Title,
				Content:   e.Content,
				Tags:      models.JSONArray(e.Tags),
				SortOrder: i,
			}
			db.DB.Create(&k)
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", profileID).Order("sort_order").Find(&entries)
		c.JSON(http.StatusOK, gin.H{"id": profileID, "knowledgeEntries": entries})
	}
}

func LifeAgentsMine(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var profiles []models.LifeAgentProfile
		db.DB.Where("user_id = ?", user.ID).Order("updated_at DESC").Find(&profiles)
		var resp []gin.H
		for _, p := range profiles {
			var kCount, qpCount, sessCount int64
			var revenue int
			db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("profile_id = ?", p.ID).Count(&kCount)
			db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", p.ID).Count(&qpCount)
			db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", p.ID).Count(&sessCount)
			db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ? AND status = ?", p.ID, "paid").Select("COALESCE(SUM(amount_paid),0)").Scan(&revenue)
			resp = append(resp, gin.H{
				"id":                 p.ID,
				"displayName":        p.DisplayName,
				"headline":           p.Headline,
				"shortBio":           p.ShortBio,
				"pricePerQuestion":   p.PricePerQuestion,
				"country":            ptrStr(p.Country),
				"province":           ptrStr(p.Province),
				"city":               ptrStr(p.City),
				"county":             ptrStr(p.County),
				"regions":            p.Regions,
				"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
				"published":          p.Published,
				"knowledgeCount":     kCount,
				"sessionCount":       sessCount,
				"soldPacks":          qpCount,
				"totalRevenue":       revenue,
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

// LifeAgentsFeedbackAll 返回当前用户所有人生 Agent 的反馈汇总
func LifeAgentsFeedbackAll(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var profiles []models.LifeAgentProfile
		db.DB.Where("user_id = ?", user.ID).Find(&profiles)
		if len(profiles) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"counts":  gin.H{"helpful": 0, "notSpecific": 0, "notSuitable": 0},
				"ratings": gin.H{"averageScore": 0, "raters": 0, "recent": []gin.H{}},
				"recent":  []gin.H{},
			})
			return
		}
		ids := make([]string, len(profiles))
		profileMap := make(map[string]string)
		for i, p := range profiles {
			ids[i] = p.ID
			profileMap[p.ID] = p.DisplayName
		}
		var helpful, notSpecific, notSuitable int64
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "helpful").Count(&helpful)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "not_specific").Count(&notSpecific)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id IN ? AND feedback_type = ?", ids, "not_suitable").Count(&notSuitable)
		var recent []models.LifeAgentFeedback
		db.DB.Where("profile_id IN ?", ids).Order("created_at DESC").Limit(50).Find(&recent)
		var recentRatings []models.LifeAgentRating
		db.DB.Where("profile_id IN ?", ids).Order("updated_at DESC").Limit(20).Find(&recentRatings)
		var list []gin.H
		for _, f := range recent {
			list = append(list, gin.H{
				"id":               f.ID,
				"profileId":        f.ProfileID,
				"profileName":      profileMap[f.ProfileID],
				"feedbackType":     f.FeedbackType,
				"assistantExcerpt": f.AssistantExcerpt,
				"comment":          f.Comment,
				"createdAt":        f.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
		var average float64
		var raters int64
		db.DB.Model(&models.LifeAgentRating{}).Where("profile_id IN ?", ids).Count(&raters)
		db.DB.Model(&models.LifeAgentRating{}).Where("profile_id IN ?", ids).Select("COALESCE(AVG(score),0)").Scan(&average)
		var ratingList []gin.H
		for _, r := range recentRatings {
			ratingList = append(ratingList, gin.H{
				"id":          r.ID,
				"profileId":   r.ProfileID,
				"profileName": profileMap[r.ProfileID],
				"score":       r.Score,
				"comment":     r.Comment,
				"updatedAt":   r.UpdatedAt.Format("2006-01-02 15:04"),
			})
		}
		c.JSON(http.StatusOK, gin.H{
			"counts": gin.H{
				"helpful":     helpful,
				"notSpecific": notSpecific,
				"notSuitable": notSuitable,
			},
			"ratings": gin.H{
				"averageScore": average,
				"raters":       raters,
				"recent":       ratingList,
			},
			"recent": list,
		})
	}
}

// LifeAgentsPurchased 返回当前用户购买过额度的人生 Agent（作为咨询者）
func LifeAgentsPurchased(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var packs []models.LifeAgentQuestionPack
		db.DB.Where("buyer_id = ? AND status = ?", user.ID, "paid").Order("created_at DESC").Find(&packs)
		seen := make(map[string]bool)
		var resp []gin.H
		for _, pk := range packs {
			if seen[pk.ProfileID] {
				continue
			}
			seen[pk.ProfileID] = true
			var p models.LifeAgentProfile
			if db.DB.Where("id = ?", pk.ProfileID).First(&p).Error != nil {
				continue
			}
			var remaining int
			db.DB.Raw("SELECT COALESCE(SUM(question_count - questions_used), 0) FROM life_agent_question_packs WHERE profile_id = ? AND buyer_id = ? AND status = ?",
				pk.ProfileID, user.ID, "paid").Scan(&remaining)
			resp = append(resp, gin.H{
				"id":                 p.ID,
				"displayName":        p.DisplayName,
				"headline":           p.Headline,
				"pricePerQuestion":   p.PricePerQuestion,
				"remainingQuestions": remaining,
				"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsGet(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		var u models.User
		db.DB.Where("id = ?", p.UserID).First(&u)
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)

		user := middleware.MustGetUser(c)
		remaining := 0
		var ratingState gin.H
		if user != nil {
			var packs []models.LifeAgentQuestionPack
			db.DB.Where("profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Find(&packs)
			for _, pk := range packs {
				remaining += pk.QuestionCount - pk.QuestionsUsed
			}
			ratingState = buildLifeAgentRatingState(id, user.ID)
		}

		var sessCount, qpCount int64
		db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", id).Count(&sessCount)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", id).Count(&qpCount)
		ratingsSummary := buildLifeAgentRatingsSummary(id, 5)

		c.JSON(http.StatusOK, gin.H{
			"id":                 p.ID,
			"displayName":        p.DisplayName,
			"headline":           p.Headline,
			"shortBio":           p.ShortBio,
			"longBio":            p.LongBio,
			"audience":           p.Audience,
			"welcomeMessage":     p.WelcomeMessage,
			"pricePerQuestion":   p.PricePerQuestion,
			"expertiseTags":      p.ExpertiseTags,
			"sampleQuestions":    p.SampleQuestions,
			"education":          ptrStr(p.Education),
			"income":             ptrStr(p.Income),
			"job":                ptrStr(p.Job),
			"school":             ptrStr(p.School),
			"country":            ptrStr(p.Country),
			"province":           ptrStr(p.Province),
			"city":               ptrStr(p.City),
			"county":             ptrStr(p.County),
			"regions":            p.Regions,
			"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
			"mbti":               ptrStr(p.MBTI),
			"personaArchetype":   ptrStr(p.PersonaArchetype),
			"toneStyle":          ptrStr(p.ToneStyle),
			"responseStyle":      ptrStr(p.ResponseStyle),
			"forbiddenPhrases":   p.ForbiddenPhrases,
			"exampleReplies":     p.ExampleReplies,
			"notSuitableFor":     ptrStr(p.NotSuitableFor),
			"published":          p.Published,
			"creator":            gin.H{"id": u.ID, "name": u.Name, "email": u.Email},
			"knowledgeEntries":   entries,
			"stats": gin.H{
				"sessionCount":      sessCount,
				"soldQuestionPacks": qpCount,
				"knowledgeCount":    len(entries),
			},
			"ratings": ratingsSummary,
			"viewerState": gin.H{
				"isLoggedIn":         user != nil,
				"isOwner":            user != nil && user.ID == p.UserID,
				"remainingQuestions": remaining,
				"rating":             ratingState,
			},
		})
	}
}

func LifeAgentsUpdate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var body struct {
			DisplayName        *string   `json:"displayName"`
			Headline           *string   `json:"headline"`
			ShortBio           *string   `json:"shortBio"`
			LongBio            *string   `json:"longBio"`
			Audience           *string   `json:"audience"`
			WelcomeMessage     *string   `json:"welcomeMessage"`
			PricePerQuestion   *int      `json:"pricePerQuestion"`
			Published          *bool     `json:"published"`
			Education          *string   `json:"education"`
			Income             *string   `json:"income"`
			Job                *string   `json:"job"`
			School             *string   `json:"school"`
			Country            *string   `json:"country"`
			Province           *string   `json:"province"`
			City               *string   `json:"city"`
			County             *string   `json:"county"`
			Regions            *[]string `json:"regions" binding:"omitempty,max=2,dive,min=1"`
			VerificationStatus *string   `json:"verificationStatus"`
			MBTI               *string   `json:"mbti"`
			PersonaArchetype   *string   `json:"personaArchetype"`
			ToneStyle          *string   `json:"toneStyle"`
			ResponseStyle      *string   `json:"responseStyle"`
			ExpertiseTags      []string  `json:"expertiseTags"`
			SampleQuestions    []string  `json:"sampleQuestions"`
			ForbiddenPhrases   []string  `json:"forbiddenPhrases"`
			ExampleReplies     []string  `json:"exampleReplies"`
			NotSuitableFor     *string   `json:"notSuitableFor"`
			KnowledgeEntries   *[]struct {
				Category string   `json:"category"`
				Title    string   `json:"title"`
				Content  string   `json:"content"`
				Tags     []string `json:"tags"`
			} `json:"knowledgeEntries"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		upd := db.DB.Model(&p)
		if body.DisplayName != nil {
			upd.Update("display_name", *body.DisplayName)
		}
		if body.Headline != nil {
			upd.Update("headline", *body.Headline)
		}
		if body.ShortBio != nil {
			upd.Update("short_bio", *body.ShortBio)
		}
		if body.LongBio != nil {
			upd.Update("long_bio", *body.LongBio)
		}
		if body.Audience != nil {
			upd.Update("audience", *body.Audience)
		}
		if body.WelcomeMessage != nil {
			upd.Update("welcome_message", *body.WelcomeMessage)
		}
		if body.PricePerQuestion != nil {
			upd.Update("price_per_question", *body.PricePerQuestion)
		}
		if body.Published != nil {
			upd.Update("published", *body.Published)
		}
		if body.Education != nil {
			upd.Update("education", *body.Education)
		}
		if body.Income != nil {
			upd.Update("income", *body.Income)
		}
		if body.Job != nil {
			upd.Update("job", *body.Job)
		}
		if body.School != nil {
			upd.Update("school", *body.School)
		}
		if body.Country != nil {
			upd.Update("country", *body.Country)
		}
		if body.Province != nil {
			upd.Update("province", *body.Province)
		}
		if body.City != nil {
			upd.Update("city", *body.City)
		}
		if body.County != nil {
			upd.Update("county", *body.County)
		}
		if body.Regions != nil {
			upd.Update("regions", models.JSONArray(*body.Regions))
		}
		if body.VerificationStatus != nil {
			upd.Update("verification_status", coalesceVerificationStatus(*body.VerificationStatus))
		}
		if body.MBTI != nil {
			upd.Update("mbti", *body.MBTI)
		}
		if body.PersonaArchetype != nil {
			upd.Update("persona_archetype", *body.PersonaArchetype)
		}
		if body.ToneStyle != nil {
			upd.Update("tone_style", *body.ToneStyle)
		}
		if body.ResponseStyle != nil {
			upd.Update("response_style", *body.ResponseStyle)
		}
		if body.NotSuitableFor != nil {
			upd.Update("not_suitable_for", *body.NotSuitableFor)
		}
		if len(body.ExpertiseTags) > 0 {
			upd.Update("expertise_tags", models.JSONArray(body.ExpertiseTags))
		}
		if len(body.SampleQuestions) > 0 {
			upd.Update("sample_questions", models.JSONArray(body.SampleQuestions))
		}
		if body.ForbiddenPhrases != nil {
			upd.Update("forbidden_phrases", models.JSONArray(body.ForbiddenPhrases))
		}
		if body.ExampleReplies != nil {
			upd.Update("example_replies", models.JSONArray(body.ExampleReplies))
		}
		if body.KnowledgeEntries != nil {
			db.DB.Where("profile_id = ?", id).Delete(&models.LifeAgentKnowledgeEntry{})
			for i, e := range *body.KnowledgeEntries {
				k := models.LifeAgentKnowledgeEntry{
					ID:        models.GenID(),
					ProfileID: id,
					Category:  e.Category,
					Title:     e.Title,
					Content:   e.Content,
					Tags:      models.JSONArray(e.Tags),
					SortOrder: i,
				}
				db.DB.Create(&k)
			}
		}
		db.DB.Where("id = ?", id).First(&p)
		c.JSON(http.StatusOK, gin.H{
			"id":               p.ID,
			"displayName":      p.DisplayName,
			"headline":         p.Headline,
			"shortBio":         p.ShortBio,
			"longBio":          p.LongBio,
			"audience":         p.Audience,
			"welcomeMessage":   p.WelcomeMessage,
			"pricePerQuestion": p.PricePerQuestion,
			"expertiseTags":    p.ExpertiseTags,
			"sampleQuestions":  p.SampleQuestions,
			"education":        ptrStr(p.Education),
			"income":           ptrStr(p.Income),
			"job":              ptrStr(p.Job),
			"school":           ptrStr(p.School),
			"country":          ptrStr(p.Country),
			"province":         ptrStr(p.Province),
			"city":             ptrStr(p.City),
			"county":           ptrStr(p.County),
			"regions":          p.Regions,
			"mbti":             ptrStr(p.MBTI),
			"personaArchetype": ptrStr(p.PersonaArchetype),
			"toneStyle":        ptrStr(p.ToneStyle),
			"responseStyle":    ptrStr(p.ResponseStyle),
			"forbiddenPhrases": p.ForbiddenPhrases,
			"exampleReplies":   p.ExampleReplies,
			"notSuitableFor":   ptrStr(p.NotSuitableFor),
			"published":        p.Published,
		})
	}
}

func LifeAgentsModifyViaChat(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var body struct {
			Message     string                       `json:"message" binding:"required"`
			ChatHistory []lifeagent.ChatMessageForAI `json:"chatHistory"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR", "detail": err.Error()})
			return
		}
		state := buildModifyStateString(&p, entries)
		intent, err := lifeagent.InterpretModificationIntent(
			cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
			state, body.ChatHistory, body.Message,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "LLM_ERROR", "detail": err.Error()})
			return
		}
		reply := intent.Reply
		if intent.Changes != nil {
			ch := intent.Changes
			upd := db.DB.Model(&p)
			if len(ch.ExpertiseTags) > 0 {
				tags := ch.ExpertiseTags
				if len(tags) > 8 {
					tags = tags[:8]
				}
				upd.Update("expertise_tags", models.JSONArray(tags))
			}
			if len(ch.SampleQuestions) > 0 {
				qs := ch.SampleQuestions
				if len(qs) > 6 {
					qs = qs[:6]
				}
				upd.Update("sample_questions", models.JSONArray(qs))
			}
			if ch.WelcomeMessage != "" {
				upd.Update("welcome_message", ch.WelcomeMessage)
			}
			if ch.PersonaArchetype != "" {
				upd.Update("persona_archetype", ch.PersonaArchetype)
			}
			if ch.ToneStyle != "" {
				upd.Update("tone_style", ch.ToneStyle)
			}
			if ch.ResponseStyle != "" {
				upd.Update("response_style", ch.ResponseStyle)
			}
			if len(ch.ForbiddenPhrases) > 0 {
				fp := ch.ForbiddenPhrases
				if len(fp) > 8 {
					fp = fp[:8]
				}
				upd.Update("forbidden_phrases", models.JSONArray(fp))
			}
			if len(ch.ExampleReplies) > 0 {
				er := ch.ExampleReplies
				if len(er) > 3 {
					er = er[:3]
				}
				upd.Update("example_replies", models.JSONArray(er))
			}
			for i, add := range ch.KnowledgeAdd {
				if add.Content == "" {
					continue
				}
				tags := add.Tags
				if len(tags) == 0 {
					tags = []string{add.Category}
				}
				cat, title := add.Category, add.Title
				if cat == "" {
					cat = "经验"
				}
				if title == "" {
					title = add.Content
					if len(title) > 50 {
						title = title[:50] + "..."
					}
				}
				k := models.LifeAgentKnowledgeEntry{
					ID:        models.GenID(),
					ProfileID: id,
					Category:  cat,
					Title:     title,
					Content:   add.Content,
					Tags:      models.JSONArray(tags),
					SortOrder: len(entries) + i,
				}
				db.DB.Create(&k)
				entries = append(entries, k)
			}
			db.DB.Where("id = ?", id).First(&p)
			db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		}
		profileResp := buildManageProfileResp(&p, entries)
		c.JSON(http.StatusOK, gin.H{
			"assistantMessage": reply,
			"profile":          profileResp,
		})
	}
}

func buildModifyStateString(p *models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("名称: %s\n", p.DisplayName))
	b.WriteString(fmt.Sprintf("一句话介绍: %s\n", p.Headline))
	b.WriteString(fmt.Sprintf("目标人群: %s\n", p.Audience))
	b.WriteString(fmt.Sprintf("欢迎语: %s\n", p.WelcomeMessage))
	if len(p.ExpertiseTags) > 0 {
		b.WriteString(fmt.Sprintf("擅长标签: %s\n", strings.Join(p.ExpertiseTags, ", ")))
	}
	if len(p.SampleQuestions) > 0 {
		b.WriteString(fmt.Sprintf("示例问题: %s\n", strings.Join(p.SampleQuestions, " | ")))
	}
	b.WriteString(fmt.Sprintf("角色: %s | 语气: %s | 回答习惯: %s\n",
		ptrStr(p.PersonaArchetype), ptrStr(p.ToneStyle), ptrStr(p.ResponseStyle)))
	if len(p.ForbiddenPhrases) > 0 {
		b.WriteString(fmt.Sprintf("禁止用语: %s\n", strings.Join(p.ForbiddenPhrases, ", ")))
	}
	if len(p.ExampleReplies) > 0 {
		b.WriteString("示范回答:\n")
		for i, r := range p.ExampleReplies {
			excerpt := r
			if len(excerpt) > 80 {
				excerpt = excerpt[:80] + "..."
			}
			b.WriteString(fmt.Sprintf("  %d. %s\n", i+1, excerpt))
		}
	}
	b.WriteString("\n【知识库条目】\n")
	for i, e := range entries {
		excerpt := e.Content
		if len(excerpt) > 120 {
			excerpt = excerpt[:120] + "..."
		}
		tags := e.Tags
		b.WriteString(fmt.Sprintf("%d. [%s] %s (tags: %v): %s\n", i+1, e.Category, e.Title, tags, excerpt))
	}
	return b.String()
}

func buildManageProfileResp(p *models.LifeAgentProfile, entries []models.LifeAgentKnowledgeEntry) gin.H {
	type ke struct {
		ID       string   `json:"id"`
		Category string   `json:"category"`
		Title    string   `json:"title"`
		Content  string   `json:"content"`
		Tags     []string `json:"tags"`
	}
	var keList []ke
	for _, e := range entries {
		keList = append(keList, ke{
			ID: e.ID, Category: e.Category, Title: e.Title, Content: e.Content, Tags: []string(e.Tags),
		})
	}
	return gin.H{
		"id":               p.ID,
		"displayName":      p.DisplayName,
		"headline":         p.Headline,
		"shortBio":         p.ShortBio,
		"longBio":          p.LongBio,
		"audience":         p.Audience,
		"welcomeMessage":   p.WelcomeMessage,
		"pricePerQuestion": p.PricePerQuestion,
		"expertiseTags":    p.ExpertiseTags,
		"sampleQuestions":  p.SampleQuestions,
		"education":        ptrStr(p.Education),
		"income":           ptrStr(p.Income),
		"job":              ptrStr(p.Job),
		"school":           ptrStr(p.School),
		"country":          ptrStr(p.Country),
		"province":         ptrStr(p.Province),
		"city":             ptrStr(p.City),
		"county":           ptrStr(p.County),
		"regions":          p.Regions,
		"mbti":             ptrStr(p.MBTI),
		"personaArchetype": ptrStr(p.PersonaArchetype),
		"toneStyle":        ptrStr(p.ToneStyle),
		"responseStyle":    ptrStr(p.ResponseStyle),
		"forbiddenPhrases": p.ForbiddenPhrases,
		"exampleReplies":   p.ExampleReplies,
		"notSuitableFor":   ptrStr(p.NotSuitableFor),
		"published":        p.Published,
		"knowledgeEntries": keList,
	}
}

func LifeAgentsManage(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if p.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var packs []models.LifeAgentQuestionPack
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Limit(50).Find(&packs)
		var sessions []models.LifeAgentChatSession
		db.DB.Where("profile_id = ?", id).Order("updated_at DESC").Limit(50).Find(&sessions)
		var totalRevenue int
		var totalPacks, totalSess int64
		var helpful, notSpecific, notSuitable int64
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ? AND status = ?", id, "paid").Select("COALESCE(SUM(amount_paid),0)").Scan(&totalRevenue)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", id).Count(&totalPacks)
		db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", id).Count(&totalSess)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "helpful").Count(&helpful)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_specific").Count(&notSpecific)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_suitable").Count(&notSuitable)
		var recentFb []models.LifeAgentFeedback
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Limit(20).Find(&recentFb)
		type fbResp struct {
			ID               string  `json:"id"`
			FeedbackType     string  `json:"feedbackType"`
			AssistantExcerpt *string `json:"assistantExcerpt"`
			Comment          *string `json:"comment"`
			CreatedAt        string  `json:"createdAt"`
		}
		var fbList []fbResp
		for _, f := range recentFb {
			fbList = append(fbList, fbResp{
				ID: f.ID, FeedbackType: f.FeedbackType,
				AssistantExcerpt: f.AssistantExcerpt, Comment: f.Comment,
				CreatedAt: f.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
		ratingsSummary := buildLifeAgentRatingsSummary(id, 20)

		type packResp struct {
			ID            string `json:"id"`
			QuestionCount int    `json:"questionCount"`
			QuestionsUsed int    `json:"questionsUsed"`
			AmountPaid    int    `json:"amountPaid"`
			CreatedAt     string `json:"createdAt"`
			Buyer         gin.H  `json:"buyer"`
		}
		var packResps []packResp
		for _, pk := range packs {
			var b models.User
			db.DB.Where("id = ?", pk.BuyerID).First(&b)
			packResps = append(packResps, packResp{
				ID: pk.ID, QuestionCount: pk.QuestionCount, QuestionsUsed: pk.QuestionsUsed,
				AmountPaid: pk.AmountPaid, CreatedAt: pk.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				Buyer: gin.H{"email": b.Email, "name": b.Name},
			})
		}
		type sessResp struct {
			ID           string `json:"id"`
			Title        string `json:"title"`
			MessageCount int64  `json:"messageCount"`
			CreatedAt    string `json:"createdAt"`
			UpdatedAt    string `json:"updatedAt"`
			Buyer        gin.H  `json:"buyer"`
		}
		var sessResps []sessResp
		for _, s := range sessions {
			var b models.User
			db.DB.Where("id = ?", s.BuyerID).First(&b)
			var cnt int64
			db.DB.Model(&models.LifeAgentChatMessage{}).Where("session_id = ?", s.ID).Count(&cnt)
			sessResps = append(sessResps, sessResp{
				ID: s.ID, Title: "咨询会话", MessageCount: cnt,
				CreatedAt: s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				UpdatedAt: s.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				Buyer:     gin.H{"email": b.Email, "name": b.Name},
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"profile": gin.H{
				"id":                 p.ID,
				"displayName":        p.DisplayName,
				"headline":           p.Headline,
				"shortBio":           p.ShortBio,
				"longBio":            p.LongBio,
				"audience":           p.Audience,
				"welcomeMessage":     p.WelcomeMessage,
				"pricePerQuestion":   p.PricePerQuestion,
				"expertiseTags":      p.ExpertiseTags,
				"sampleQuestions":    p.SampleQuestions,
				"education":          ptrStr(p.Education),
				"income":             ptrStr(p.Income),
				"job":                ptrStr(p.Job),
				"school":             ptrStr(p.School),
				"country":            ptrStr(p.Country),
				"province":           ptrStr(p.Province),
				"city":               ptrStr(p.City),
				"county":             ptrStr(p.County),
				"regions":            p.Regions,
				"verificationStatus": coalesceVerificationStatus(p.VerificationStatus),
				"mbti":               ptrStr(p.MBTI),
				"personaArchetype":   ptrStr(p.PersonaArchetype),
				"toneStyle":          ptrStr(p.ToneStyle),
				"responseStyle":      ptrStr(p.ResponseStyle),
				"forbiddenPhrases":   p.ForbiddenPhrases,
				"exampleReplies":     p.ExampleReplies,
				"notSuitableFor":     ptrStr(p.NotSuitableFor),
				"published":          p.Published,
				"knowledgeEntries":   entries,
			},
			"stats": gin.H{
				"totalRevenue": totalRevenue,
				"soldPacks":    totalPacks,
				"sessionCount": totalSess,
			},
			"feedback": gin.H{
				"counts":  gin.H{"helpful": helpful, "notSpecific": notSpecific, "notSuitable": notSuitable},
				"recent":  fbList,
				"ratings": ratingsSummary,
			},
			"questionPacks": packResps,
			"chatSessions":  sessResps,
		})
	}
}

func LifeAgentsPurchase(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			QuestionCount int `json:"questionCount" binding:"required,min=1,max=500"`
			AmountPaid    int `json:"amountPaid" binding:"required,min=0"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		expected := p.PricePerQuestion * body.QuestionCount
		if body.AmountPaid < expected {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INSUFFICIENT_PAYMENT"})
			return
		}
		pack := models.LifeAgentQuestionPack{
			ID:            models.GenID(),
			ProfileID:     id,
			BuyerID:       user.ID,
			QuestionCount: body.QuestionCount,
			AmountPaid:    body.AmountPaid,
			Status:        "paid",
		}
		db.DB.Create(&pack)
		var remaining int
		db.DB.Raw("SELECT COALESCE(SUM(question_count - questions_used), 0) FROM life_agent_question_packs WHERE profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Scan(&remaining)
		c.JSON(http.StatusOK, gin.H{"packId": pack.ID, "remainingQuestions": remaining})
	}
}

func LifeAgentsChatSessions(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		var sessions []models.LifeAgentChatSession
		db.DB.Where("profile_id = ? AND buyer_id = ?", id, user.ID).
			Order("updated_at DESC").
			Limit(50).
			Find(&sessions)

		resp := make([]gin.H, 0, len(sessions))
		for _, s := range sessions {
			var messageCount int64
			db.DB.Model(&models.LifeAgentChatMessage{}).Where("session_id = ?", s.ID).Count(&messageCount)
			resp = append(resp, gin.H{
				"id":           s.ID,
				"title":        s.Title,
				"messageCount": messageCount,
				"createdAt":    s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"updatedAt":    s.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}

		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsBuyerChatSessions(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		var sessions []models.LifeAgentChatSession
		db.DB.Where("buyer_id = ?", user.ID).
			Order("updated_at DESC").
			Limit(100).
			Find(&sessions)

		if len(sessions) == 0 {
			c.JSON(http.StatusOK, []gin.H{})
			return
		}

		profileIDs := make([]string, 0, len(sessions))
		seenProfiles := make(map[string]bool)
		for _, session := range sessions {
			if seenProfiles[session.ProfileID] {
				continue
			}
			seenProfiles[session.ProfileID] = true
			profileIDs = append(profileIDs, session.ProfileID)
		}

		var profiles []models.LifeAgentProfile
		db.DB.Where("id IN ?", profileIDs).Find(&profiles)
		profileMap := make(map[string]models.LifeAgentProfile)
		for _, profile := range profiles {
			profileMap[profile.ID] = profile
		}

		resp := make([]gin.H, 0, len(sessions))
		for _, session := range sessions {
			profile, ok := profileMap[session.ProfileID]
			if !ok {
				continue
			}
			var messageCount int64
			db.DB.Model(&models.LifeAgentChatMessage{}).Where("session_id = ?", session.ID).Count(&messageCount)
			resp = append(resp, gin.H{
				"id":           session.ID,
				"title":        session.Title,
				"messageCount": messageCount,
				"createdAt":    session.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"updatedAt":    session.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"profile": gin.H{
					"id":                 profile.ID,
					"displayName":        profile.DisplayName,
					"headline":           profile.Headline,
					"verificationStatus": coalesceVerificationStatus(profile.VerificationStatus),
				},
			})
		}

		c.JSON(http.StatusOK, resp)
	}
}

func LifeAgentsChatSessionDetail(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		id := c.Param("id")
		sessionID := c.Param("sessionId")

		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		var session models.LifeAgentChatSession
		if err := db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ?", sessionID, id, user.ID).First(&session).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "SESSION_NOT_FOUND"})
			return
		}

		var msgs []models.LifeAgentChatMessage
		db.DB.Where("session_id = ?", sessionID).Order("created_at ASC").Find(&msgs)

		messages := make([]gin.H, 0, len(msgs))
		for _, msg := range msgs {
			item := gin.H{
				"id":        msg.ID,
				"role":      msg.Role,
				"content":   msg.Content,
				"createdAt": msg.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			}
			if msg.Role == "assistant" {
				item["references"] = buildLifeAgentChatReferences(msg.Refs)
			}
			messages = append(messages, item)
		}

		c.JSON(http.StatusOK, gin.H{
			"session": gin.H{
				"id":           session.ID,
				"title":        session.Title,
				"createdAt":    session.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"updatedAt":    session.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				"messageCount": len(messages),
			},
			"messages": messages,
		})
	}
}

func LifeAgentsChat(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			SessionID string `json:"sessionId"`
			Message   string `json:"message" binding:"required,min=2,max=2000"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		if !p.Published {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var packs []models.LifeAgentQuestionPack
		db.DB.Where("profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Order("created_at ASC").Find(&packs)
		remaining := 0
		var packToConsume *models.LifeAgentQuestionPack
		for i := range packs {
			r := packs[i].QuestionCount - packs[i].QuestionsUsed
			remaining += r
			if r > 0 && packToConsume == nil {
				packToConsume = &packs[i]
			}
		}
		if remaining <= 0 || packToConsume == nil {
			c.JSON(http.StatusPaymentRequired, gin.H{"error": "NO_QUESTIONS_LEFT"})
			return
		}
		sessionID := body.SessionID
		if sessionID != "" {
			var sess models.LifeAgentChatSession
			if db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ?", sessionID, id, user.ID).First(&sess).Error != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "SESSION_NOT_FOUND"})
				return
			}
		} else {
			title := buildLifeAgentSessionTitle(body.Message)
			sess := models.LifeAgentChatSession{
				ID:        models.GenID(),
				ProfileID: id,
				BuyerID:   user.ID,
				Title:     title,
				Status:    "active",
			}
			db.DB.Create(&sess)
			sessionID = sess.ID
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order").Find(&entries)
		var hist []lifeagent.ChatMessageForAI
		var msgs []models.LifeAgentChatMessage
		db.DB.Where("session_id = ?", sessionID).Order("created_at ASC").Limit(8).Find(&msgs)
		for _, m := range msgs {
			hist = append(hist, lifeagent.ChatMessageForAI{Role: m.Role, Content: m.Content})
		}
		entriesForAI := make([]lifeagent.KnowledgeEntryForAI, len(entries))
		for i, e := range entries {
			entriesForAI[i] = lifeagent.KnowledgeEntryForAI{
				ID: e.ID, Category: e.Category, Title: e.Title, Content: e.Content,
				Tags: []string(e.Tags),
			}
		}
		content, refs, _ := lifeagent.BuildReplyWithLLM(
			cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
			lifeagent.ProfileForAI{
				DisplayName:      p.DisplayName,
				Headline:         p.Headline,
				Audience:         p.Audience,
				WelcomeMessage:   p.WelcomeMessage,
				ExpertiseTags:    []string(p.ExpertiseTags),
				MBTI:             ptrStr(p.MBTI),
				PersonaArchetype: ptrStr(p.PersonaArchetype),
				ToneStyle:        ptrStr(p.ToneStyle),
				ResponseStyle:    ptrStr(p.ResponseStyle),
				ForbiddenPhrases: []string(p.ForbiddenPhrases),
				ExampleReplies:   []string(p.ExampleReplies),
				NotSuitableFor:   ptrStr(p.NotSuitableFor),
			},
			entriesForAI, hist, body.Message,
		)
		refsMap := make([]map[string]interface{}, len(refs))
		for i, r := range refs {
			refsMap[i] = make(map[string]interface{})
			for k, v := range r {
				refsMap[i][k] = v
			}
		}
		var refsAny models.JSONAny
		for _, m := range refsMap {
			refsAny = append(refsAny, m)
		}
		db.DB.Create(&models.LifeAgentChatMessage{ID: models.GenID(), SessionID: sessionID, Role: "user", Content: body.Message})
		assistantMsgID := models.GenID()
		db.DB.Create(&models.LifeAgentChatMessage{ID: assistantMsgID, SessionID: sessionID, Role: "assistant", Content: content, Refs: refsAny})
		db.DB.Model(packToConsume).Update("questions_used", packToConsume.QuestionsUsed+1)
		db.DB.Model(&models.LifeAgentChatSession{}).Where("id = ?", sessionID).Update("updated_at", db.DB.NowFunc())
		ratingState := buildLifeAgentRatingState(id, user.ID)
		c.JSON(http.StatusOK, gin.H{
			"sessionId":          sessionID,
			"sessionTitle":       buildLifeAgentSessionTitle(body.Message),
			"messageId":          assistantMsgID,
			"reply":              content,
			"references":         refsMap,
			"remainingQuestions": remaining - 1,
			"rating":             ratingState,
		})
	}
}

func LifeAgentsChatFeedback(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			MessageID    string  `json:"messageId" binding:"required"`
			SessionID    string  `json:"sessionId" binding:"required"`
			FeedbackType string  `json:"feedbackType" binding:"required,oneof=helpful not_specific not_suitable"`
			Comment      *string `json:"comment"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var msg models.LifeAgentChatMessage
		if err := db.DB.Where("id = ? AND session_id = ?", body.MessageID, body.SessionID).First(&msg).Error; err != nil || msg.Role != "assistant" {
			c.JSON(http.StatusNotFound, gin.H{"error": "MESSAGE_NOT_FOUND"})
			return
		}
		var sess models.LifeAgentChatSession
		if err := db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ?", body.SessionID, id, user.ID).First(&sess).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}
		var prev models.LifeAgentFeedback
		if db.DB.Where("message_id = ? AND buyer_id = ?", body.MessageID, user.ID).First(&prev).Error == nil {
			db.DB.Model(&prev).Updates(map[string]interface{}{
				"feedback_type": body.FeedbackType,
				"comment":       body.Comment,
			})
			c.JSON(http.StatusOK, gin.H{"ok": true, "updated": true})
			return
		}
		excerpt := msg.Content
		if len(excerpt) > 400 {
			excerpt = excerpt[:400] + "..."
		}
		var userQ string
		var prevMsg models.LifeAgentChatMessage
		if db.DB.Where("session_id = ? AND role = ? AND created_at < ?", body.SessionID, "user", msg.CreatedAt).Order("created_at DESC").First(&prevMsg).Error == nil {
			userQ = prevMsg.Content
		}
		fb := models.LifeAgentFeedback{
			ID:               models.GenID(),
			ProfileID:        id,
			MessageID:        body.MessageID,
			SessionID:        body.SessionID,
			BuyerID:          user.ID,
			FeedbackType:     body.FeedbackType,
			UserQuestion:     strOpt(userQ),
			AssistantExcerpt: strOpt(excerpt),
			Comment:          body.Comment,
		}
		db.DB.Create(&fb)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func LifeAgentsRate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var body struct {
			Score   int     `json:"score" binding:"required,min=1,max=5"`
			Comment *string `json:"comment"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		state := buildLifeAgentRatingState(id, user.ID)
		currentMilestone, _ := state["currentMilestone"].(int)
		eligible, _ := state["eligible"].(bool)
		if !eligible || currentMilestone < 10 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "RATING_NOT_ELIGIBLE"})
			return
		}

		var existing models.LifeAgentRating
		if db.DB.Where("profile_id = ? AND buyer_id = ?", id, user.ID).First(&existing).Error == nil {
			db.DB.Model(&existing).Updates(map[string]interface{}{
				"score":                body.Score,
				"comment":              body.Comment,
				"last_rated_milestone": currentMilestone,
			})
		} else {
			db.DB.Create(&models.LifeAgentRating{
				ID:                 models.GenID(),
				ProfileID:          id,
				BuyerID:            user.ID,
				Score:              body.Score,
				Comment:            body.Comment,
				LastRatedMilestone: currentMilestone,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"ok":     true,
			"rating": buildLifeAgentRatingState(id, user.ID),
		})
	}
}

func LifeAgentsFeedbackSummary(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var helpful, notSpecific, notSuitable int64
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "helpful").Count(&helpful)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_specific").Count(&notSpecific)
		db.DB.Model(&models.LifeAgentFeedback{}).Where("profile_id = ? AND feedback_type = ?", id, "not_suitable").Count(&notSuitable)
		var recent []models.LifeAgentFeedback
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Limit(30).Find(&recent)
		type fbResp struct {
			ID               string  `json:"id"`
			FeedbackType     string  `json:"feedbackType"`
			AssistantExcerpt *string `json:"assistantExcerpt"`
			Comment          *string `json:"comment"`
			CreatedAt        string  `json:"createdAt"`
		}
		var list []fbResp
		for _, f := range recent {
			list = append(list, fbResp{
				ID: f.ID, FeedbackType: f.FeedbackType,
				AssistantExcerpt: f.AssistantExcerpt, Comment: f.Comment,
				CreatedAt: f.CreatedAt.Format("2006-01-02 15:04"),
			})
		}
		ratingsSummary := buildLifeAgentRatingsSummary(id, 20)
		c.JSON(http.StatusOK, gin.H{
			"counts": gin.H{
				"helpful":     helpful,
				"notSpecific": notSpecific,
				"notSuitable": notSuitable,
			},
			"ratings": ratingsSummary,
			"recent":  list,
		})
	}
}
