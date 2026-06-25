package handler

import (
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func buildMindSettingsResponse(p *models.LifeAgentProfile, ownerView bool) gin.H {
	out := gin.H{
		"allowGeneralKnowledge": true,
		"citationsEnabled":      p.CitationsEnabled,
	}
	if !p.AllowGeneralKnowledge {
		out["allowGeneralKnowledge"] = false
	}
	if !p.CitationsEnabled {
		out["citationsEnabled"] = false
	}
	if ownerView {
		out["knowledgeFallbackMessage"] = p.KnowledgeFallbackMessage
	}
	return out
}

func LifeAgentsMindSettingsGet(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", id).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		user := middleware.MustGetUser(c)
		ownerView := user != nil && user.ID == p.UserID
		c.JSON(http.StatusOK, buildMindSettingsResponse(&p, ownerView))
	}
}

func LifeAgentsMindSettingsPatch(cfg *config.Config) gin.HandlerFunc {
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
		var body struct {
			AllowGeneralKnowledge    *bool   `json:"allowGeneralKnowledge"`
			KnowledgeFallbackMessage *string `json:"knowledgeFallbackMessage"`
			CitationsEnabled         *bool   `json:"citationsEnabled"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		upd := db.DB.Model(&p)
		if body.AllowGeneralKnowledge != nil {
			upd = upd.Update("allow_general_knowledge", *body.AllowGeneralKnowledge)
			p.AllowGeneralKnowledge = *body.AllowGeneralKnowledge
		}
		if body.KnowledgeFallbackMessage != nil {
			upd = upd.Update("knowledge_fallback_message", strings.TrimSpace(*body.KnowledgeFallbackMessage))
			p.KnowledgeFallbackMessage = strings.TrimSpace(*body.KnowledgeFallbackMessage)
		}
		if body.CitationsEnabled != nil {
			upd = upd.Update("citations_enabled", *body.CitationsEnabled)
			p.CitationsEnabled = *body.CitationsEnabled
		}
		if err := upd.Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "UPDATE_FAILED"})
			return
		}
		c.JSON(http.StatusOK, buildMindSettingsResponse(&p, true))
	}
}

func LifeAgentsCitationDetail(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		profileID := c.Param("id")
		sourceType := c.Param("sourceType")
		sourceID := c.Param("sourceId")

		var p models.LifeAgentProfile
		if err := db.DB.Where("id = ?", profileID).First(&p).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}

		detail, ok := fetchCitationSourceDetail(profileID, sourceType, sourceID)
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "SOURCE_NOT_FOUND"})
			return
		}
		c.JSON(http.StatusOK, detail)
	}
}

func fetchCitationSourceDetail(profileID, sourceType, sourceID string) (gin.H, bool) {
	switch sourceType {
	case "fact":
		var row models.LifeAgentStructuredFact
		if db.DB.Where("id = ? AND profile_id = ?", sourceID, profileID).First(&row).Error != nil {
			return nil, false
		}
		return gin.H{
			"id":              row.ID,
			"sourceType":      "fact",
			"sourceTypeLabel": lifeagent.SourceTypeLabel("fact"),
			"title":           lifeagentFactLabel(row.FactKey),
			"content":         row.FactValue,
			"fullContent":     row.FactValue,
			"excerpt":         row.FactValue,
			"confidence":      row.Confidence,
			"factKey":         row.FactKey,
		}, true
	case "topic":
		var row models.LifeAgentTopicSummary
		if db.DB.Where("id = ? AND profile_id = ?", sourceID, profileID).First(&row).Error != nil {
			return nil, false
		}
		return gin.H{
			"id":              row.ID,
			"sourceType":      "topic",
			"sourceTypeLabel": lifeagent.SourceTypeLabel("topic"),
			"title":           row.TopicLabel,
			"content":         row.Summary,
			"fullContent":     row.Summary,
			"excerpt":         row.Summary,
			"topicGroup":      row.TopicGroup,
			"topicKey":        row.TopicKey,
			"confidence":      row.Confidence,
		}, true
	case "knowledge":
		var row models.LifeAgentKnowledgeEntry
		if db.DB.Where("id = ? AND profile_id = ?", sourceID, profileID).First(&row).Error != nil {
			return nil, false
		}
		return gin.H{
			"id":              row.ID,
			"sourceType":      "knowledge",
			"sourceTypeLabel": lifeagent.SourceTypeLabel("knowledge"),
			"title":           row.Title,
			"content":         row.Content,
			"fullContent":     row.Content,
			"excerpt":         row.Content,
			"category":        row.Category,
			"sourceTypeMeta":  row.SourceType,
			"updatedAt":       row.UpdatedAt,
		}, true
	case "liveUpdate":
		var row models.LifeAgentLiveUpdate
		if db.DB.Where("id = ? AND profile_id = ?", sourceID, profileID).First(&row).Error != nil {
			return nil, false
		}
		return gin.H{
			"id":              row.ID,
			"sourceType":      "liveUpdate",
			"sourceTypeLabel": lifeagent.SourceTypeLabel("liveUpdate"),
			"title":           "最近动态",
			"content":         row.Content,
			"fullContent":     row.Content,
			"excerpt":         row.Content,
			"category":        row.Category,
			"createdAt":       row.CreatedAt,
		}, true
	default:
		return nil, false
	}
}

func lifeagentFactLabel(key string) string {
	labels := map[string]string{
		"display_name": "称呼",
		"school":       "学校",
		"education":    "学历",
		"job":          "工作",
		"income":       "收入",
		"city":         "城市",
	}
	if l, ok := labels[key]; ok {
		return l
	}
	return key
}
