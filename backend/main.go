package main

import (
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/router"
	"github.com/joho/godotenv"
)

func main() {
	// 加载 .env：优先项目根目录，其次 backend 目录
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")

	cfg := config.Load()
	if err := db.Init(cfg.DatabaseURL); err != nil {
		log.Fatal("db init:", err)
	}
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
