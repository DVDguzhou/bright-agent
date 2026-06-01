package middleware

import (
	"compress/gzip"
	"strings"

	"github.com/gin-gonic/gin"
)

const gzipMinBodyBytes = 1024

// WriteGzipJSON writes pre-marshaled JSON, gzip-compressing large payloads when accepted.
func WriteGzipJSON(c *gin.Context, status int, body []byte, cacheControl string) {
	if cacheControl != "" {
		c.Header("Cache-Control", cacheControl)
	}
	c.Header("Content-Type", "application/json; charset=utf-8")

	if len(body) < gzipMinBodyBytes || !strings.Contains(c.GetHeader("Accept-Encoding"), "gzip") {
		c.Data(status, "application/json; charset=utf-8", body)
		return
	}

	c.Header("Vary", "Accept-Encoding")
	c.Header("Content-Encoding", "gzip")
	c.Status(status)
	gz := gzip.NewWriter(c.Writer)
	if _, err := gz.Write(body); err != nil {
		_ = gz.Close()
		return
	}
	_ = gz.Close()
}
