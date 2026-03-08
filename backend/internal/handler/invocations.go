package handler

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

const tokenTTL = 15 * 60 // seconds

func InvocationsIssueToken(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			LicenseID string `json:"licenseId" binding:"required"`
			AgentID   string `json:"agentId" binding:"required"`
			Scope     string `json:"scope"`
			InputHash string `json:"inputHash" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var lic models.License
		if err := db.DB.Where("id = ?", body.LicenseID).First(&lic).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "LICENSE_NOT_FOUND"})
			return
		}
		if lic.BuyerID != user.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "license_not_yours"})
			return
		}
		if lic.AgentID != body.AgentID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "agent_mismatch"})
			return
		}
		if lic.Status != "ACTIVE" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "license_inactive"})
			return
		}
		if lic.ExpiresAt.Before(time.Now()) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "license_expired"})
			return
		}
		if lic.QuotaUsed >= lic.QuotaTotal {
			c.JSON(http.StatusBadRequest, gin.H{"error": "quota_exhausted"})
			return
		}

		var agent models.Agent
		db.DB.Where("id = ?", lic.AgentID).First(&agent)

		requestID := "req_" + randHex(12)
		nonce := randHex(16)
		expiresAt := time.Now().Add(time.Duration(tokenTTL) * time.Second)
		scope := body.Scope
		if scope == "" && lic.Scope != nil {
			scope = *lic.Scope
		}

		tok := models.InvocationToken{
			ID:        models.GenID(),
			LicenseID: body.LicenseID,
			AgentID:   body.AgentID,
			BuyerID:   user.ID,
			SellerID:  lic.SellerID,
			RequestID: requestID,
			Scope:     strPtr(scope),
			IssuedAt:  time.Now(),
			ExpiresAt: expiresAt,
			Nonce:     nonce,
			Signature: strPtr("computed"),
			Status:    "ISSUED",
		}
		db.DB.Create(&tok)

		payload := map[string]interface{}{
			"requestId": requestID,
			"licenseId": body.LicenseID,
			"agentId":   body.AgentID,
			"buyerId":   user.ID,
			"nonce":     nonce,
			"expiresAt": expiresAt.Unix(),
		}
		signed := signToken(payload, cfg.SessionSecret)

		baseURL := agent.BaseURL
		if agent.UseTunnel {
			baseURL = "http://localhost:8080/api/tunnel/invoke/" + agent.ID
		}

		db.DB.Create(&models.InvocationRequest{
			ID:        models.GenID(),
			RequestID: requestID,
			LicenseID: body.LicenseID,
			AgentID:   body.AgentID,
			BuyerID:   user.ID,
			TokenID:   tok.ID,
			InputHash: body.InputHash,
			Scope:     strPtr(scope),
		})

		c.JSON(http.StatusOK, gin.H{
			"request_id":        requestID,
			"token_id":          tok.ID,
			"invocation_token":  signed,
			"expires_at":        expiresAt.Format(time.RFC3339),
			"agent_base_url":    baseURL,
		})
	}
}

func randHex(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func signToken(payload map[string]interface{}, secret string) string {
	data, _ := json.Marshal(payload)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(data)
	sig := hex.EncodeToString(h.Sum(nil))
	b64 := base64.RawURLEncoding.EncodeToString(data)
	return b64 + "." + sig
}

var _ = http.StatusOK
