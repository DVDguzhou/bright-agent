package handler

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestServeAudioDataSupportsByteRanges(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.GET("/api/audio/:filename", func(c *gin.Context) {
		serveAudioData(c, c.Param("filename"), "audio/wav", []byte("0123456789"))
	})

	req := httptest.NewRequest(http.MethodGet, "/api/audio/message.wav", nil)
	req.Header.Set("Range", "bytes=2-5")
	res := httptest.NewRecorder()
	router.ServeHTTP(res, req)

	if res.Code != http.StatusPartialContent {
		t.Fatalf("status = %d, want %d", res.Code, http.StatusPartialContent)
	}
	if got := res.Body.String(); got != "2345" {
		t.Fatalf("body = %q, want %q", got, "2345")
	}
	if got := res.Header().Get("Accept-Ranges"); got != "bytes" {
		t.Fatalf("Accept-Ranges = %q, want %q", got, "bytes")
	}
	if got := res.Header().Get("Content-Range"); got != "bytes 2-5/10" {
		t.Fatalf("Content-Range = %q, want %q", got, "bytes 2-5/10")
	}
	if got := res.Header().Get("Content-Length"); got != "4" {
		t.Fatalf("Content-Length = %q, want %q", got, "4")
	}
	if got := res.Header().Get("Content-Type"); got != "audio/wav" {
		t.Fatalf("Content-Type = %q, want %q", got, "audio/wav")
	}
}
