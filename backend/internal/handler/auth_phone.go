package handler

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/sms"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

var phoneCodeStore sms.Store

func init() {
	phoneCodeStore = sms.NewMemoryStore()
}

var phoneRegex = regexp.MustCompile(`^1[3-9]\d{9}$`)

func normalizePhone(s string) string {
	return strings.TrimSpace(strings.TrimPrefix(s, "+86"))
}

func isValidChinesePhone(phone string) bool {
	return phoneRegex.MatchString(phone)
}

// PhoneSendCode 发送验证码
func PhoneSendCode(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Phone string `json:"phone" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		phone := normalizePhone(body.Phone)
		if !isValidChinesePhone(phone) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_PHONE"})
			return
		}
		code := sms.GenCode()
		if err := phoneCodeStore.Set(phone, code, cfg.PhoneCodeTTL); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		sender := cfg.SMSSender
		if sender == nil {
			sender = sms.MockSender{}
		}
		if err := sender.Send(phone, code); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "SMS_SEND_FAILED"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// PhoneVerify 验证码登录/注册
func PhoneVerify(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Phone string `json:"phone" binding:"required"`
			Code  string `json:"code" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		phone := normalizePhone(body.Phone)
		if !isValidChinesePhone(phone) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_PHONE"})
			return
		}
		stored, ok := phoneCodeStore.Get(phone)
		if !ok || stored != strings.TrimSpace(body.Code) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CODE"})
			return
		}
		_ = phoneCodeStore.Delete(phone)

		var u models.User
		if err := db.DB.Where("phone = ?", phone).First(&u).Error; err == nil {
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
			return
		}

		placeholderEmail := "phone_" + phone + "@placeholder.local"
		hash, _ := bcrypt.GenerateFromPassword([]byte(models.GenID()), 12)
		u = models.User{
			ID:        models.GenID(),
			Email:     placeholderEmail,
			Password:  string(hash),
			Name:      ptr("手机用户"),
			Phone:     &phone,
			RoleFlags: nil,
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
				"phone":     phone,
				"name":      u.Name,
				"avatarUrl": u.AvatarURL,
				"roleFlags": u.RoleFlags,
			},
		})
	}
}
