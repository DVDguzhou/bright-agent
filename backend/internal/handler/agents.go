package handler

import (
	"net/http"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func AgentsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		scope := c.Query("scope")
		ownerMe := c.Query("owner") == "me"

		user := middleware.MustGetUser(c)
		q := db.DB.Model(&models.Agent{})

		if ownerMe {
			if user == nil {
				c.JSON(http.StatusOK, []any{})
				return
			}
			q = q.Where("seller_id = ?", user.ID)
		} else {
			q = q.Where("status = ?", "approved")
		}

		if scope != "" {
			q = q.Where("JSON_CONTAINS(supported_scopes, ?)", `"`+scope+`"`)
		}

		var agents []models.Agent
		if err := q.Order("created_at DESC").Find(&agents).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		var resp []gin.H
		for _, a := range agents {
			var u models.User
			db.DB.Where("id = ?", a.SellerID).First(&u)
			resp = append(resp, gin.H{
				"id":               a.ID,
				"name":             a.Name,
				"description":      a.Description,
				"baseUrl":          a.BaseURL,
				"useTunnel":        a.UseTunnel,
				"supportedScopes":  a.SupportedScopes,
				"pricingConfig":    a.PricingConfig,
				"status":           a.Status,
				"riskLevel":        a.RiskLevel,
				"seller":           gin.H{"id": u.ID, "name": u.Name, "email": u.Email},
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

func AgentsGet(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var a models.Agent
		if err := db.DB.Where("id = ?", id).First(&a).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		var seller models.User
		db.DB.Where("id = ?", a.SellerID).First(&seller)
		c.JSON(http.StatusOK, gin.H{
			"id":               a.ID,
			"name":             a.Name,
			"description":      a.Description,
			"baseUrl":          a.BaseURL,
			"useTunnel":        a.UseTunnel,
			"supportedScopes":  a.SupportedScopes,
			"pricingConfig":    a.PricingConfig,
			"status":           a.Status,
			"riskLevel":        a.RiskLevel,
			"seller":           gin.H{"id": seller.ID, "name": seller.Name, "email": seller.Email},
		})
	}
}

func AgentsCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			Name            string         `json:"name"`
			Description     *string        `json:"description"`
			BaseURL         string         `json:"baseUrl"`
			UseTunnel       *bool          `json:"useTunnel"`
			PublicKey       *string        `json:"publicKey"`
			SupportedScopes []string       `json:"supportedScopes"`
			PricingConfig   map[string]any `json:"pricingConfig"`
			RiskLevel       *string        `json:"riskLevel"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		if len(body.SupportedScopes) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "supportedScopes required"})
			return
		}

		useTunnel := false
		if body.UseTunnel != nil {
			useTunnel = *body.UseTunnel
		}
		riskLevel := "low"
		if body.RiskLevel != nil {
			riskLevel = *body.RiskLevel
		}

		a := models.Agent{
			ID:              models.GenID(),
			SellerID:        user.ID,
			Name:            body.Name,
			Description:     body.Description,
			BaseURL:         body.BaseURL,
			UseTunnel:       useTunnel,
			PublicKey:       body.PublicKey,
			SupportedScopes: models.JSONArray(body.SupportedScopes),
			PricingConfig:   body.PricingConfig,
			RiskLevel:       &riskLevel,
			Status:          "pending",
		}
		if err := db.DB.Create(&a).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, a)
	}
}

func AgentsUpdate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
	}
}

func AgentsDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		id := c.Param("id")
		var agent models.Agent
		if err := db.DB.Where("id = ? AND seller_id = ?", id, user.ID).First(&agent).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}

		if err := db.DB.Delete(&agent).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
