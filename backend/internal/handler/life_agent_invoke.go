package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"log"
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func effectiveLifeAgentAPIPriceCents(p *models.LifeAgentProfile) int {
	if p.ApiPricePerCallCents != nil {
		return *p.ApiPricePerCallCents
	}
	return p.PricePerQuestion
}

// LifeAgentsMineAPIOverview 当前用户各人生 Agent 的开放 API 配置、Key 列表与统计（单页聚合）
func LifeAgentsMineAPIOverview(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var profiles []models.LifeAgentProfile
		db.DB.Where("user_id = ?", user.ID).Order("updated_at DESC").Find(&profiles)
		out := make([]gin.H, 0, len(profiles))
		for _, p := range profiles {
			var keys []models.LifeAgentInvokeKey
			db.DB.Where("profile_id = ?", p.ID).Order("created_at DESC").Find(&keys)
			keyList := make([]gin.H, 0, len(keys))
			for _, k := range keys {
				keyList = append(keyList, gin.H{
					"id":        k.ID,
					"keyPrefix": k.KeyPrefix + "...",
					"name":      k.Name,
					"callCount": k.CallCount,
					"createdAt": k.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
				})
			}
			var apiSessCount int64
			db.DB.Model(&models.LifeAgentChatSession{}).
				Where("profile_id = ? AND is_api = ?", p.ID, true).
				Count(&apiSessCount)
			out = append(out, gin.H{
				"profileId":                     p.ID,
				"displayName":                   p.DisplayName,
				"published":                     p.Published,
				"pricePerQuestion":              p.PricePerQuestion,
				"apiInvokeEnabled":              p.ApiInvokeEnabled,
				"apiPriceFollowsConsultation":   p.ApiPricePerCallCents == nil,
				"apiPricePerCallCents":          p.ApiPricePerCallCents,
				"effectiveApiPricePerCallCents": effectiveLifeAgentAPIPriceCents(&p),
				"apiTotalCalls":                 p.ApiTotalCalls,
				"apiSessionCount":               apiSessCount,
				"keys":                          keyList,
			})
		}
		c.JSON(http.StatusOK, gin.H{"agents": out})
	}
}

func LifeAgentsInvokeKeysList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		var keys []models.LifeAgentInvokeKey
		db.DB.Where("profile_id = ?", id).Order("created_at DESC").Find(&keys)
		list := make([]gin.H, 0, len(keys))
		for _, k := range keys {
			list = append(list, gin.H{
				"id":        k.ID,
				"keyPrefix": k.KeyPrefix + "...",
				"name":      k.Name,
				"callCount": k.CallCount,
				"createdAt": k.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			})
		}
		c.JSON(http.StatusOK, gin.H{"keys": list})
	}
}

func LifeAgentsInvokeKeysCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if !p.ApiInvokeEnabled {
			c.JSON(http.StatusBadRequest, gin.H{"error": "API_NOT_ENABLED"})
			return
		}
		var body struct {
			Name string `json:"name"`
		}
		_ = c.ShouldBindJSON(&body)
		name := strings.TrimSpace(body.Name)
		if name == "" {
			name = "Invoke Key"
		}
		raw := make([]byte, 24)
		_, _ = rand.Read(raw)
		keyStr := cfg.LifeAgentInvokeKeyPrefix + hex.EncodeToString(raw)
		hash := sha256.Sum256([]byte(keyStr))
		hexHash := hex.EncodeToString(hash[:])
		prefix := keyStr
		if len(prefix) > 16 {
			prefix = prefix[:16]
		}
		k := models.LifeAgentInvokeKey{
			ID:        models.GenID(),
			ProfileID: id,
			KeyHash:   hexHash,
			KeyPrefix: prefix,
			Name:      &name,
		}
		db.DB.Create(&k)
		c.JSON(http.StatusOK, gin.H{
			"id":      k.ID,
			"key":     keyStr,
			"name":    name,
			"warning": "请妥善保存，此 key 仅显示一次",
		})
	}
}

func LifeAgentsInvokeKeysDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		keyID := c.Param("keyId")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		var k models.LifeAgentInvokeKey
		if err := db.DB.Where("id = ? AND profile_id = ?", keyID, id).First(&k).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		db.DB.Delete(&k)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// LifeAgentsChatAPI 使用人生 Agent 专用 Key 的 JSON 对话（不消耗提问包；需已开启开放 API）
func LifeAgentsChatAPI(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		auth := strings.TrimSpace(c.GetHeader("Authorization"))
		if len(auth) < 8 || !strings.EqualFold(auth[:7], "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		bearer := strings.TrimSpace(auth[7:])
		if bearer == "" || !strings.HasPrefix(bearer, cfg.LifeAgentInvokeKeyPrefix) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_API_KEY"})
			return
		}
		hash := sha256.Sum256([]byte(bearer))
		hexHash := hex.EncodeToString(hash[:])
		var inv models.LifeAgentInvokeKey
		if err := db.DB.Where("key_hash = ?", hexHash).First(&inv).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_API_KEY"})
			return
		}
		if inv.ProfileID != id {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_API_KEY"})
			return
		}

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
		if !p.ApiInvokeEnabled {
			c.JSON(http.StatusForbidden, gin.H{"error": "API_NOT_ENABLED"})
			return
		}

		sessionID := body.SessionID
		if sessionID != "" {
			var sess models.LifeAgentChatSession
			if db.DB.Where("id = ? AND profile_id = ? AND buyer_id = ? AND is_api = ?", sessionID, id, models.LifeAgentAPICallerUserID, true).First(&sess).Error != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "SESSION_NOT_FOUND"})
				return
			}
		} else {
			title := buildLifeAgentSessionTitle(body.Message)
			kid := inv.ID
			sess := models.LifeAgentChatSession{
				ID:          models.GenID(),
				ProfileID:   id,
				BuyerID:     models.LifeAgentAPICallerUserID,
				Title:       title,
				Status:      "active",
				IsAPI:       true,
				InvokeKeyID: &kid,
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
		profileForAI := lifeagent.ProfileForAI{
			DisplayName:      p.DisplayName,
			Headline:         p.Headline,
			ShortBio:         p.ShortBio,
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
		}

		var content string
		var refs []map[string]string
		if lifeagent.ClassifyQuestionIntent(cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL, body.Message) {
			content = lifeagent.BuildIdentityReply(profileForAI)
		} else {
			var err error
			content, refs, err = lifeagent.BuildReplyWithLLM(
				cfg.OpenAIApiKey, cfg.OpenAIModel, cfg.OpenAIBaseURL,
				cfg.LLMEnableWebSearch,
				profileForAI,
				entriesForAI, hist, body.Message,
			)
			if err != nil {
				log.Printf("life-agents api chat: LLM error: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "LLM_ERROR"})
				return
			}
		}

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
		db.DB.Create(&models.LifeAgentChatMessage{
			ID:        assistantMsgID,
			SessionID: sessionID,
			Role:      "assistant",
			Content:   content,
			Refs:      refsAny,
		})
		db.DB.Model(&models.LifeAgentChatSession{}).Where("id = ?", sessionID).Update("updated_at", db.DB.NowFunc())

		db.DB.Model(&inv).UpdateColumn("call_count", inv.CallCount+1)
		db.DB.Model(&p).UpdateColumn("api_total_calls", p.ApiTotalCalls+1)

		price := effectiveLifeAgentAPIPriceCents(&p)
		c.JSON(http.StatusOK, gin.H{
			"sessionId":                 sessionID,
			"messageId":               assistantMsgID,
			"reply":                   content,
			"references":              refsMap,
			"apiPricePerCallCents":    price,
			"apiPriceFollowsConsult":  p.ApiPricePerCallCents == nil,
			"profileTotalApiCalls":    p.ApiTotalCalls + 1,
			"disclaimer":              "当前为开放调用记账与公示单价（分/次），线上扣费与结算以平台后续规则为准。",
		})
	}
}
