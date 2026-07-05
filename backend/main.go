package main

import (
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/handler"
	"github.com/agent-marketplace/backend/internal/netutil"
	"github.com/agent-marketplace/backend/internal/router"
	"github.com/agent-marketplace/backend/internal/wechatpay"
	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env：优先项目根目录，其次 backend 目录
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := config.Load()
	if p := netutil.LLMProxyConfigured(); p != "" {
		log.Printf("LLM HTTP proxy enabled: %s", p)
	}
	if err := db.Init(cfg.DatabaseURL); err != nil {
		log.Fatal("db init:", err)
	}
	if err := wechatpay.Init(cfg); err != nil {
		log.Fatal("wechat pay init:", err)
	}
	handler.ResumePendingCoEditEvents(cfg)
	handler.StartLifeAgentTTSWorker(cfg)
	r := router.Setup(cfg)
	addr := os.Getenv("PORT")
	if addr == "" {
		addr = "8080"
	}
	log.Printf("server listening on :%s", addr)
	if err := r.Run(":" + addr); err != nil {
		log.Fatal(err)
	}
}
