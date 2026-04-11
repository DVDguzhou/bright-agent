package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func SSETest() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Content-Type", "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection", "keep-alive")
		c.Header("X-Accel-Buffering", "no")
		c.Status(http.StatusOK)
		c.Writer.Flush()

		for i := 1; i <= 5; i++ {
			fmt.Fprintf(c.Writer, "event: content\ndata: {\"content\":\"chunk-%d \"}\n\n", i)
			c.Writer.Flush()
			time.Sleep(time.Second)
		}
		fmt.Fprintf(c.Writer, "event: done\ndata: {\"reply\":\"chunk-1 chunk-2 chunk-3 chunk-4 chunk-5 \"}\n\n")
		c.Writer.Flush()
	}
}
