package handler

import (
	"net/http"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

func LicensesList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var licenses []models.License
		if err := db.DB.Where("buyer_id = ?", user.ID).Order("created_at DESC").Find(&licenses).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		var resp []gin.H
		for _, l := range licenses {
			var agent models.Agent
			db.DB.Where("id = ?", l.AgentID).First(&agent)
			var buyer, seller models.User
			db.DB.Where("id = ?", l.BuyerID).First(&buyer)
			db.DB.Where("id = ?", l.SellerID).First(&seller)
			resp = append(resp, gin.H{
				"id":         l.ID,
				"agentId":    l.AgentID,
				"buyerId":    l.BuyerID,
				"sellerId":   l.SellerID,
				"scope":      l.Scope,
				"quotaTotal": l.QuotaTotal,
				"quotaUsed":  l.QuotaUsed,
				"expiresAt":  l.ExpiresAt,
				"status":     l.Status,
				"agent":      gin.H{"id": agent.ID, "name": agent.Name, "baseUrl": agent.BaseURL},
				"buyer":      gin.H{"name": buyer.Name},
				"seller":     gin.H{"name": seller.Name},
			})
		}
		c.JSON(http.StatusOK, resp)
	}
}

func LicensesCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			AgentID       string `json:"agentId" binding:"required"`
			Scope         string `json:"scope"`
			QuotaTotal    int    `json:"quotaTotal" binding:"required,min=1"`
			ExpiresInDays int    `json:"expiresInDays"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		if body.ExpiresInDays <= 0 {
			body.ExpiresInDays = 30
		}

		var agent models.Agent
		if err := db.DB.Where("id = ?", body.AgentID).First(&agent).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "AGENT_NOT_FOUND"})
			return
		}
		if agent.Status != "approved" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "AGENT_NOT_APPROVED"})
			return
		}

		expiresAt := time.Now().AddDate(0, 0, body.ExpiresInDays)
		scope := body.Scope
		if scope == "" {
			scope = ""
		}
		var scopePtr *string
		if scope != "" {
			scopePtr = &scope
		}

		lic := models.License{
			ID:         models.GenID(),
			AgentID:    body.AgentID,
			BuyerID:    user.ID,
			SellerID:   agent.SellerID,
			Scope:      scopePtr,
			QuotaTotal: body.QuotaTotal,
			QuotaUsed:  0,
			ExpiresAt:  expiresAt,
			Status:     "ACTIVE",
		}
		if err := db.DB.Create(&lic).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":         lic.ID,
			"agentId":    lic.AgentID,
			"buyerId":    lic.BuyerID,
			"sellerId":   lic.SellerID,
			"scope":      lic.Scope,
			"quotaTotal": lic.QuotaTotal,
			"quotaUsed":  lic.QuotaUsed,
			"expiresAt":  lic.ExpiresAt,
			"status":     lic.Status,
			"agent":      gin.H{"id": agent.ID, "name": agent.Name, "baseUrl": agent.BaseURL},
		})
	}
}
