package handler

import (
	"net/http"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func Login(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var u models.User
		if err := db.DB.Where("email = ?", body.Email).First(&u).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(body.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS"})
			return
		}
		setSessionCookie(c, cfg, u.ID)
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":        u.ID,
				"email":     u.Email,
				"name":      u.Name,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}

func Signup(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email    string  `json:"email" binding:"required,email"`
			Password string  `json:"password" binding:"required,min=6"`
			Name     string  `json:"name"`
			IsBuyer  *bool   `json:"isBuyer"`
			IsSeller *bool   `json:"isSeller"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var exists models.User
		if db.DB.Where("email = ?", body.Email).First(&exists).Error == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "EMAIL_EXISTS"})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 12)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		isBuyer, isSeller := true, false
		if body.IsBuyer != nil {
			isBuyer = *body.IsBuyer
		}
		if body.IsSeller != nil {
			isSeller = *body.IsSeller
		}
		u := models.User{
			ID:        models.GenID(),
			Email:     body.Email,
			Password:  string(hash),
			Name:      ptr(body.Name),
			RoleFlags: models.JSONMap{"is_buyer": isBuyer, "is_seller": isSeller},
		}
		if u.Name != nil && *u.Name == "" {
			u.Name = nil
		}
		if err := db.DB.Create(&u).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		setSessionCookie(c, cfg, u.ID)
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":        u.ID,
				"email":     u.Email,
				"name":      u.Name,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}

func Me(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"name":      user.Name,
			"roleFlags": user.RoleFlags,
		})
	}
}

func Logout(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.SetCookie(cfg.SessionCookie, "", -1, "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func setSessionCookie(c *gin.Context, cfg *config.Config, userID string) {
	maxAge := 60 * 60 * 24 * 7 // 7 days
	c.SetCookie(cfg.SessionCookie, userID, maxAge, "/", "", false, true)
}

func ptr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
