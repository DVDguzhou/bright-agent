package handler

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/mail"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/sms"
	"github.com/gin-gonic/gin"
)

const signupCodeKeyPrefix = "signup:"

var (
	signupCodeStore sms.Store
	signupSendMu    sync.Mutex
	signupLastSent  = make(map[string]time.Time)
)

func init() {
	signupCodeStore = sms.NewMemoryStore()
}

func signupCodeKey(email string) string {
	return signupCodeKeyPrefix + email
}

func canSendSignupCodeNow(email string) bool {
	signupSendMu.Lock()
	defer signupSendMu.Unlock()
	last, ok := signupLastSent[email]
	return !ok || time.Since(last) >= 60*time.Second
}

func markSignupCodeSent(email string) {
	signupSendMu.Lock()
	defer signupSendMu.Unlock()
	signupLastSent[email] = time.Now()
}

func verifySignupCode(email, code string) bool {
	stored, ok := signupCodeStore.Get(signupCodeKey(email))
	if !ok {
		return false
	}
	return stored == strings.TrimSpace(code)
}

func consumeSignupCode(email string) {
	_ = signupCodeStore.Delete(signupCodeKey(email))
}

// SignupSendCode 向未注册邮箱发送注册验证码（已注册邮箱仍返回成功，避免枚举）
func SignupSendCode(cfg *config.Config) gin.HandlerFunc {
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
		var existingUser models.User
		if db.DB.Where("email = ?", email).First(&existingUser).Error == nil {
			c.JSON(http.StatusOK, gin.H{"ok": true})
			return
		}

		code := sms.GenCode()
		if err := signupCodeStore.Set(signupCodeKey(email), code, cfg.PhoneCodeTTL); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}
		mins := int(cfg.PhoneCodeTTL / time.Minute)
		if mins < 1 {
			mins = 1
		}
		subject := "注册验证码"
		text := fmt.Sprintf("您的注册验证码为：%s\n\n%d 分钟内有效，请勿泄露给他人。\n", code, mins)
		if cfg.SMTPEnabled() {
			if err := mail.SendPlain(cfg, email, subject, text); err != nil {
				log.Printf("auth: signup send-code to %s: %v", email, err)
				_ = signupCodeStore.Delete(signupCodeKey(email))
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "EMAIL_SEND_FAILED"})
				return
			}
		} else {
			log.Printf("[Email Mock] signup email=%s code=%s（未配置 SMTP_HOST/SMTP_FROM，未真实发信）", email, code)
		}
		markSignupCodeSent(email)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}
