package handler

import (
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type slidingWindowLimiter struct {
	mu      sync.Mutex
	windows map[string][]time.Time
}

func newSlidingWindowLimiter() *slidingWindowLimiter {
	return &slidingWindowLimiter{windows: make(map[string][]time.Time)}
}

func (l *slidingWindowLimiter) allow(key string, limit int, window time.Duration) bool {
	if key == "" || limit < 1 {
		return true
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	cutoff := now.Add(-window)
	hits := l.windows[key]
	kept := hits[:0]
	for _, t := range hits {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= limit {
		l.windows[key] = kept
		return false
	}
	kept = append(kept, now)
	l.windows[key] = kept
	return true
}

var authRateLimiter = newSlidingWindowLimiter()

func authClientIP(c *gin.Context) string {
	if xff := strings.TrimSpace(c.GetHeader("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		if ip := strings.TrimSpace(parts[0]); ip != "" {
			return ip
		}
	}
	if xrip := strings.TrimSpace(c.GetHeader("X-Real-IP")); xrip != "" {
		return xrip
	}
	return c.ClientIP()
}

func authRateLimit(c *gin.Context, scope, subject string, limit int, window time.Duration) bool {
	key := scope + ":" + subject
	return authRateLimiter.allow(key, limit, window)
}
