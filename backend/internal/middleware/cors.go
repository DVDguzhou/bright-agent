package middleware

import (
	"github.com/agent-marketplace/backend/internal/config"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS(cfg *config.Config) gin.HandlerFunc {
	origins := cfg.CORSOrigins
	if len(origins) == 0 {
		origins = []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	}
	originSet := make(map[string]bool, len(origins))
	for _, o := range origins {
		originSet[o] = true
	}
	return cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if originSet[origin] {
				return true
			}
			// Go 后端位于 Next.js 反向代理之后，浏览器的 Origin（如公网 IP）
			// 会被 Next.js rewrite 原样转发，必须放行，否则 POST 请求 403。
			// 会话 Cookie SameSite=Lax（浏览器默认）仍可防御 CSRF。
			return true
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	})
}
