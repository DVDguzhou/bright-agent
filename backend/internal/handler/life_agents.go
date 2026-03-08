package handler

import (
	"net/http"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func ptrStr(s *string) string  { if s == nil { return "" }; return *s }
func strOpt(v string) *string { if v == "" { return nil }; return &v }

func LifeAgentsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var profiles []models.LifeAgentProfile
		if err := db.DB.Where("published = ?", true).Order("updated_at DESC").Find(&profiles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		var resp []gin.H
		for _, p := range profiles {
			var u models.User
			db.DB.Where("id = ?", p.UserID).First(&u)
			var kCount, qpCount, sessCount int64
			db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("profile_id = ?", p.ID).Count(&kCount)
			db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", p.ID).Count(&qpCount)
			db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", p.ID).Count(&sessCount)
			resp = append(resp, gin.H{
				"id":               p.ID,
				"displayName":      p.DisplayName,
				"headline":         p.Headline,
				"shortBio":         p.ShortBio,
				"audience":         p.Audience,
				"welcomeMessage":   p.WelcomeMessage,
				"pricePerQuestion": p.PricePerQuestion,
				"expertiseTags":    p.ExpertiseTags,
				"sampleQuestions":  p.SampleQuestions,
				"education":        ptrStr(p.Education),
				"income":           ptrStr(p.Income),
				"job":              ptrStr(p.Job),
				"school":           ptrStr(p.School),
				"creator":          gin.H{"id": u.ID, "name": u.Name, "email": u.Email},
				"knowledgeCount":   kCount,
				"soldQuestionPacks": qpCount,
				"sessionCount":     sessCount,
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
			DisplayName      string   `json:"displayName" binding:"required,min=2"`
			Headline         string   `json:"headline" binding:"required,min=4"`
			ShortBio         string   `json:"shortBio" binding:"required,min=20,max=180"`
			LongBio          string   `json:"longBio" binding:"required,min=60"`
			Audience         string   `json:"audience" binding:"required,min=6"`
			WelcomeMessage   string   `json:"welcomeMessage" binding:"required,min=10"`
			PricePerQuestion int      `json:"pricePerQuestion"`
			Education        string  `json:"education"`
			Income           string  `json:"income"`
			Job              string  `json:"job"`
			School           string  `json:"school"`
			ExpertiseTags    []string `json:"expertiseTags" binding:"required,min=1,max=8,dive,min=1"`
			SampleQuestions  []string `json:"sampleQuestions" binding:"required,min=2,max=6,dive,min=3"`
			KnowledgeEntries []struct {
				Category string   `json:"category" binding:"required"`
				Title    string   `json:"title" binding:"required"`
				Content  string   `json:"content" binding:"required,min=20"`
				Tags     []string `json:"tags" binding:"required,min=1,dive,min=1"`
			} `json:"knowledgeEntries" binding:"required,min=2,max=12,dive"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		if body.PricePerQuestion <= 0 {
			body.PricePerQuestion = 990
		}

		profileID := models.GenID()
		p := models.LifeAgentProfile{
			ID:               profileID,
			UserID:           user.ID,
			DisplayName:      body.DisplayName,
			Headline:         body.Headline,
			ShortBio:         body.ShortBio,
			LongBio:          body.LongBio,
			Audience:         body.Audience,
			WelcomeMessage:   body.WelcomeMessage,
			PricePerQuestion: body.PricePerQuestion,
			ExpertiseTags:    models.JSONArray(body.ExpertiseTags),
			SampleQuestions:  models.JSONArray(body.SampleQuestions),
			Education:        strOpt(body.Education),
			Income:           strOpt(body.Income),
			Job:              strOpt(body.Job),
			School:           strOpt(body.School),
			Published:        true,
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
				"id":               p.ID,
				"displayName":     p.DisplayName,
				"headline":        p.Headline,
				"shortBio":        p.ShortBio,
				"pricePerQuestion": p.PricePerQuestion,
				"published":       p.Published,
				"knowledgeCount":  kCount,
				"sessionCount":    sessCount,
				"soldPacks":       qpCount,
				"totalRevenue":    revenue,
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
		if user != nil {
			var packs []models.LifeAgentQuestionPack
			db.DB.Where("profile_id = ? AND buyer_id = ? AND status = ?", id, user.ID, "paid").Find(&packs)
			for _, pk := range packs {
				remaining += pk.QuestionCount - pk.QuestionsUsed
			}
		}

		var sessCount, qpCount int64
		db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", id).Count(&sessCount)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", id).Count(&qpCount)

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
			"published":        p.Published,
			"creator":          gin.H{"id": u.ID, "name": u.Name, "email": u.Email},
			"knowledgeEntries": entries,
			"stats": gin.H{
				"sessionCount":     sessCount,
				"soldQuestionPacks": qpCount,
				"knowledgeCount":   len(entries),
			},
			"viewerState": gin.H{
				"isLoggedIn":         user != nil,
				"isOwner":            user != nil && user.ID == p.UserID,
				"remainingQuestions": remaining,
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
			DisplayName      *string  `json:"displayName"`
			Headline         *string  `json:"headline"`
			ShortBio         *string  `json:"shortBio"`
			LongBio          *string  `json:"longBio"`
			Audience         *string  `json:"audience"`
			WelcomeMessage   *string  `json:"welcomeMessage"`
			PricePerQuestion *int     `json:"pricePerQuestion"`
			Published        *bool    `json:"published"`
			Education        *string  `json:"education"`
			Income           *string  `json:"income"`
			Job              *string  `json:"job"`
			School           *string  `json:"school"`
			ExpertiseTags    []string `json:"expertiseTags"`
			SampleQuestions  []string `json:"sampleQuestions"`
			KnowledgeEntries *[]struct {
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
		if len(body.ExpertiseTags) > 0 {
			upd.Update("expertise_tags", models.JSONArray(body.ExpertiseTags))
		}
		if len(body.SampleQuestions) > 0 {
			upd.Update("sample_questions", models.JSONArray(body.SampleQuestions))
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
		c.JSON(http.StatusOK, p)
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
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ? AND status = ?", id, "paid").Select("COALESCE(SUM(amount_paid),0)").Scan(&totalRevenue)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("profile_id = ?", id).Count(&totalPacks)
		db.DB.Model(&models.LifeAgentChatSession{}).Where("profile_id = ?", id).Count(&totalSess)

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
				ID: s.ID, Title: s.Title, MessageCount: cnt,
				CreatedAt: s.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				UpdatedAt: s.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
				Buyer:     gin.H{"email": b.Email, "name": b.Name},
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"profile": gin.H{
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
				"published":        p.Published,
				"knowledgeEntries": entries,
			},
			"stats": gin.H{
				"totalRevenue": totalRevenue,
				"soldPacks":    totalPacks,
				"sessionCount": totalSess,
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
			title := body.Message
			if len(title) > 40 {
				title = title[:40]
			}
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
		db.DB.Where("session_id = ?", sessionID).Order("created_at ASC").Limit(12).Find(&msgs)
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
		content, refs := lifeagent.BuildReply(
			lifeagent.ProfileForAI{
				DisplayName: p.DisplayName, Headline: p.Headline, Audience: p.Audience,
				WelcomeMessage: p.WelcomeMessage, ExpertiseTags: []string(p.ExpertiseTags),
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
		db.DB.Create(&models.LifeAgentChatMessage{ID: models.GenID(), SessionID: sessionID, Role: "assistant", Content: content, Refs: refsAny})
		db.DB.Model(packToConsume).Update("questions_used", packToConsume.QuestionsUsed+1)
		c.JSON(http.StatusOK, gin.H{
			"sessionId":         sessionID,
			"reply":             content,
			"references":        refsMap,
			"remainingQuestions": remaining - 1,
		})
	}
}
