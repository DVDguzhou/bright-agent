package cookieutil

import (
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// SessionSecure 是否应为会话 Cookie 设置 Secure 标志（HTTPS 站点必填，否则部分浏览器会丢弃 Cookie）
func SessionSecure(c *gin.Context, cfg *config.Config) bool {
	if cfg != nil && cfg.SecureSessionCookie {
		return true
	}
	if strings.EqualFold(c.GetHeader("X-Forwarded-Proto"), "https") {
		return true
	}
	if c.Request != nil && c.Request.TLS != nil {
		return true
	}
	return false
}
