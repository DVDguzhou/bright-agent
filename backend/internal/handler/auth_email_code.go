package handler

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/mail"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/sms"
	"github.com/gin-gonic/gin"
)

var emailCodeStore sms.Store

func init() {
	emailCodeStore = sms.NewMemoryStore()
}

// EmailSendCode 向已注册邮箱发送登录验证码（未注册或占位邮箱时仍返回成功，避免枚举）
func EmailSendCode(cfg *config.Config) gin.HandlerFunc {
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
		code := sms.GenCode()
		if err := emailCodeStore.Set(email, code, cfg.PhoneCodeTTL); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		mins := int(cfg.PhoneCodeTTL / time.Minute)
		if mins < 1 {
			mins = 1
		}
		subject := "登录验证码"
		text := fmt.Sprintf("您的登录验证码为：%s\n\n%d 分钟内有效，请勿泄露给他人。\n", code, mins)
		if cfg.SMTPEnabled() {
			if err := mail.SendPlain(cfg, email, subject, text); err != nil {
				log.Printf("auth: email send-code to %s: %v", email, err)
				_ = emailCodeStore.Delete(email)
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "EMAIL_SEND_FAILED"})
				return
			}
		} else {
			log.Printf("[Email Mock] email=%s code=%s（未配置 SMTP_HOST/SMTP_FROM，未真实发信）", email, code)
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// EmailVerify 校验邮箱验证码并登录（仅已注册、非占位邮箱账号）
func EmailVerify(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email string `json:"email" binding:"required,email"`
			Code  string `json:"code" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		email := normalizeAuthEmail(body.Email)
		if isPlaceholderAuthEmail(email) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CODE"})
			return
		}
		stored, ok := emailCodeStore.Get(email)
		if !ok || stored != strings.TrimSpace(body.Code) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CODE"})
			return
		}
		_ = emailCodeStore.Delete(email)

		var u models.User
		if err := db.DB.Where("email = ?", email).First(&u).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CODE"})
			return
		}
		phone := ""
		if u.Phone != nil {
			phone = *u.Phone
		}
		setSessionCookie(c, cfg, u.ID)
		c.JSON(http.StatusOK, gin.H{
			"user": gin.H{
				"id":        u.ID,
				"email":     u.Email,
				"phone":     phone,
				"name":      u.Name,
				"avatarUrl": u.AvatarURL,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}
