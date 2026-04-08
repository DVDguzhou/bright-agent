package handler

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/mail"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

func isPlaceholderAuthEmail(email string) bool {
	return strings.HasSuffix(strings.ToLower(strings.TrimSpace(email)), "@placeholder.local")
}

// ForgotPassword 发送重置密码邮件（未配置 SMTP 或邮箱未注册时仍返回成功，避免枚举）
func ForgotPassword(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email string `json:"email" binding:"required,email"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		email := normalizeAuthEmail(body.Email)
		if isPlaceholderAuthEmail(email) {
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
		var u models.User
		if err := db.DB.Where("email = ?", email).First(&u).Error; err != nil {
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
		if !cfg.SMTPEnabled() {
			log.Printf("auth: forgot-password for %s skipped: SMTP not configured", email)
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
		var buf [32]byte
		if _, err := rand.Read(buf[:]); err != nil {
			log.Printf("auth: forgot-password token: %v", err)
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
		token := hex.EncodeToString(buf[:])
		exp := time.Now().UTC().Add(cfg.PasswordResetTTL)
		if err := db.DB.Model(&models.User{}).Where("id = ?", u.ID).Updates(map[string]interface{}{
			"password_reset_token":      token,
			"password_reset_expires_at": exp,
		}).Error; err != nil {
			log.Printf("auth: forgot-password save token: %v", err)
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}
		base := strings.TrimSuffix(frontendBase(c, cfg), "/")
		link := base + "/reset-password?token=" + url.QueryEscape(token)
		subject := "重置您的密码"
		text := "您好，\n\n请点击以下链接重置密码（如非本人操作请忽略）：\n\n" + link +
			"\n\n链接将在一段时间后失效。\n"
		if err := mail.SendPlain(cfg, u.Email, subject, text); err != nil {
			log.Printf("auth: forgot-password send mail to %s: %v", u.Email, err)
			_ = db.DB.Model(&models.User{}).Where("id = ?", u.ID).Updates(map[string]interface{}{
				"password_reset_token":      nil,
				"password_reset_expires_at": nil,
			}).Error
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// ResetPassword 通过邮件令牌设置新密码
func ResetPassword(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Token    string `json:"token" binding:"required"`
			Password string `json:"password" binding:"required,min=6"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		token := strings.TrimSpace(body.Token)
		if len(token) < 32 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_TOKEN"})
			return
		}
		var u models.User
		if err := db.DB.Where("password_reset_token = ?", token).First(&u).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_TOKEN"})
			return
		}
		if u.PasswordResetExpiresAt == nil || time.Now().UTC().After(*u.PasswordResetExpiresAt) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "TOKEN_EXPIRED"})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 12)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		if err := db.DB.Model(&models.User{}).Where("id = ?", u.ID).Updates(map[string]interface{}{
			"password":                  string(hash),
			"password_reset_token":      nil,
			"password_reset_expires_at": nil,
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		setSessionCookie(c, cfg, u.ID)
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":        u.ID,
				"email":     u.Email,
				"name":      u.Name,
				"avatarUrl": u.AvatarURL,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}

// ChangePassword 登录后修改密码
func ChangePassword(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		su := middleware.MustGetUser(c)
		if su == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		var body struct {
			OldPassword string `json:"oldPassword" binding:"required"`
			NewPassword string `json:"newPassword" binding:"required,min=6"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		var u models.User
		if err := db.DB.Where("id = ?", su.ID).First(&u).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(body.OldPassword)); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "WRONG_PASSWORD"})
			return
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(body.NewPassword), 12)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		if err := db.DB.Model(&models.User{}).Where("id = ?", u.ID).Update("password", string(hash)).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
