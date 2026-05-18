package cookieutil

import (
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// SessionSecure 是否应为会话 Cookie 设置 Secure 标志。
//
// 关键约束：浏览器对带 Secure 但来自 HTTP 响应的 cookie 会**静默丢弃**。
// 因此必须优先按真实请求协议判断，而不是无条件依赖 SECURE_SESSION_COOKIE env。
// 否则用户用 http://IP:3000 直连时登录虽然返回 200，但 cookie 没存下来，
// 后续 /api/auth/me 401，登录态丢失。
func SessionSecure(c *gin.Context, cfg *config.Config) bool {
	// 1. 直接 TLS 终结：肯定 HTTPS。
	if c != nil && c.Request != nil && c.Request.TLS != nil {
		return true
	}
	// 2. 反向代理（Next.js rewrite / Nginx）转发的协议头：明确识别 http/https。
	if c != nil {
		proto := strings.ToLower(strings.TrimSpace(c.GetHeader("X-Forwarded-Proto")))
		if proto == "https" {
			return true
		}
		if proto == "http" {
			// 明确是 HTTP，必须返回 false，无视 SECURE_SESSION_COOKIE，
			// 否则浏览器会丢弃 cookie 导致登录态保不住。
			return false
		}
	}
	// 3. 完全识别不到协议（没有 X-Forwarded-Proto、没有 TLS）：一律不打 Secure。
	//    不再用 SECURE_SESSION_COOKIE env 作为无条件兜底——若反代忘记设 X-Forwarded-Proto，
	//    强行打 Secure 会让 HTTP 客户端登录态全丢。生产环境请在 Nginx 里加：
	//      proxy_set_header X-Forwarded-Proto $scheme;
	_ = cfg
	return false
}
