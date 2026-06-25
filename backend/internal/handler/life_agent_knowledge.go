package handler

import (
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func knowledgeSourceTypeLabel(sourceType string) string {
	switch sourceType {
	case "manual_create", "manual_update":
		return "手动录入"
	case "chat_training", "co_edit_chat":
		return "对话调教"
	case "chat_import":
		return "对话导入"
	case "initial_create":
		return "创建时录入"
	default:
		if sourceType == "" {
			return "经历"
		}
		return sourceType
	}
}

func LifeAgentsKnowledgeCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var body struct {
			Category string `json:"category" binding:"required"`
			Title    string `json:"title" binding:"required"`
			Content  string `json:"content" binding:"required"`
			Tags     []string `json:"tags"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var maxOrder int
		db.DB.Model(&models.LifeAgentKnowledgeEntry{}).Where("profile_id = ?", id).Select("COALESCE(MAX(sort_order), 0)").Scan(&maxOrder)
		k := models.LifeAgentKnowledgeEntry{
			ID:        models.GenID(),
			ProfileID: id,
			Category:  strings.TrimSpace(body.Category),
			Title:     strings.TrimSpace(body.Title),
			Content:   strings.TrimSpace(body.Content),
			Tags:      models.JSONArray(body.Tags),
			SourceType: "manual_update",
			SortOrder: maxOrder + 1,
		}
		analysis := prepareLifeAgentKnowledgeEntry(&k, "manual_update", nil, nil, nil, "knowledge_hub_create")
		if err := db.DB.Create(&k).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "CREATE_FAILED"})
			return
		}
		if err := createTimelineEventForKnowledge(db.DB, k, analysis); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "TIMELINE_FAILED"})
			return
		}
		c.JSON(http.StatusCreated, buildKnowledgeEntryResponse(k))
	}
}

func LifeAgentsKnowledgeUpdate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		entryID := c.Param("entryId")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var k models.LifeAgentKnowledgeEntry
		if err := db.DB.Where("id = ? AND profile_id = ?", entryID, id).First(&k).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ENTRY_NOT_FOUND"})
			return
		}
		var body struct {
			Category *string  `json:"category"`
			Title    *string  `json:"title"`
			Content  *string  `json:"content"`
			Tags     []string `json:"tags"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		upd := db.DB.Model(&k)
		if body.Category != nil {
			upd = upd.Update("category", strings.TrimSpace(*body.Category))
			k.Category = strings.TrimSpace(*body.Category)
		}
		if body.Title != nil {
			upd = upd.Update("title", strings.TrimSpace(*body.Title))
			k.Title = strings.TrimSpace(*body.Title)
		}
		if body.Content != nil {
			upd = upd.Update("content", strings.TrimSpace(*body.Content))
			k.Content = strings.TrimSpace(*body.Content)
		}
		if body.Tags != nil {
			upd = upd.Update("tags", models.JSONArray(body.Tags))
			k.Tags = models.JSONArray(body.Tags)
		}
		upd.Update("revision", k.Revision+1)
		if err := upd.Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "UPDATE_FAILED"})
			return
		}
		db.DB.Where("id = ?", entryID).First(&k)
		c.JSON(http.StatusOK, buildKnowledgeEntryResponse(k))
	}
}

func LifeAgentsKnowledgeDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		entryID := c.Param("entryId")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		res := db.DB.Where("id = ? AND profile_id = ?", entryID, id).Delete(&models.LifeAgentKnowledgeEntry{})
		if res.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DELETE_FAILED"})
			return
		}
		if res.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "ENTRY_NOT_FOUND"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func LifeAgentsKnowledgeList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		id := c.Param("id")
		var profile models.LifeAgentProfile
		if err := db.DB.Where("id = ? AND user_id = ?", id, user.ID).First(&profile).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "PROFILE_NOT_FOUND"})
			return
		}
		var entries []models.LifeAgentKnowledgeEntry
		db.DB.Where("profile_id = ?", id).Order("sort_order ASC, created_at ASC").Find(&entries)
		list := make([]gin.H, 0, len(entries))
		totalWords := 0
		for _, e := range entries {
			list = append(list, buildKnowledgeEntryResponse(e))
			totalWords += utf8.RuneCountInString(e.Content)
		}
		c.JSON(http.StatusOK, gin.H{
			"entries":    list,
			"totalCount": len(entries),
			"totalWords": totalWords,
		})
	}
}

func buildKnowledgeEntryResponse(e models.LifeAgentKnowledgeEntry) gin.H {
	wordCount := utf8.RuneCountInString(e.Content)
	hasEmbedding := len(e.Embedding) > 0
	return gin.H{
		"id":             e.ID,
		"category":       e.Category,
		"title":          e.Title,
		"content":        e.Content,
		"tags":           e.Tags,
		"facetTags":      e.FacetTags,
		"sourceType":     e.SourceType,
		"sourceTypeLabel": knowledgeSourceTypeLabel(e.SourceType),
		"timelineStatus": e.TimelineStatus,
		"wordCount":      wordCount,
		"hasEmbedding":   hasEmbedding,
		"revision":       e.Revision,
		"createdAt":      e.CreatedAt,
		"updatedAt":      e.UpdatedAt,
	}
}
