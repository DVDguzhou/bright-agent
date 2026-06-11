// set-agent-cover：把本地图片文件设为指定 Agent 的封面。
//
// 在 backend 目录下运行：
//
//	go run ./cmd/set-agent-cover -name "凌晨四点半" -file /path/to/weixin.jpg
//	go run ./cmd/set-agent-cover -name "凌晨四点半" -file /path/to/weixin.jpg -apply
//
// 生产（~/regr）：
//
//	sh scripts/life-agent/set-agent-cover-production.sh "凌晨四点半" ./weixin.jpg
//	sh scripts/life-agent/set-agent-cover-production.sh "凌晨四点半" ./weixin.jpg --apply
package main

import (
	"flag"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	name := flag.String("name", "", "Agent 显示名（精确匹配）")
	file := flag.String("file", "", "本地图片文件路径（jpg/png/webp）")
	apply := flag.Bool("apply", false, "写入数据库；不加此 flag 为 dry-run")
	flag.Parse()

	if *name == "" || *file == "" {
		flag.Usage()
		os.Exit(1)
	}

	coverDir := strings.TrimSpace(os.Getenv("LIFE_AGENT_COVER_DIR"))
	if coverDir == "" {
		coverDir = filepath.Join(".", "uploads", "life-agent-covers")
	}

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	var agent models.LifeAgentProfile
	if err := db.DB.Where("display_name = ?", *name).First(&agent).Error; err != nil {
		log.Fatalf("agent %q not found: %v", *name, err)
	}

	ext := strings.ToLower(filepath.Ext(*file))
	if ext == "" {
		ext = ".jpg"
	}
	// deterministic filename: custom-{id24}.{ext}
	rawID := strings.ReplaceAll(agent.ID, "-", "")
	if len(rawID) > 24 {
		rawID = rawID[:24]
	}
	filename := "custom-" + rawID + ext
	destPath := filepath.Join(coverDir, filename)
	apiPath := "/api/upload/life-agent-cover/" + filename

	fmt.Printf("agent:   %s (%s)\n", agent.DisplayName, agent.ID)
	fmt.Printf("source:  %s\n", *file)
	fmt.Printf("dest:    %s\n", destPath)
	fmt.Printf("url:     %s\n", apiPath)
	fmt.Printf("mode:    %s\n", modeLabel(*apply))

	if !*apply {
		fmt.Println("\nDry-run. Pass -apply to write.")
		return
	}

	if err := os.MkdirAll(coverDir, 0o755); err != nil {
		log.Fatal("mkdir:", err)
	}
	if err := copyFile(*file, destPath); err != nil {
		log.Fatal("copy:", err)
	}

	updates := map[string]any{
		"cover_image_url":  apiPath,
		"cover_preset_key": nil,
	}
	if err := db.DB.Model(&agent).Updates(updates).Error; err != nil {
		log.Fatal("db update:", err)
	}

	fmt.Printf("OK  %s -> %s\n", agent.DisplayName, apiPath)
}

func copyFile(src, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()
	_, err = io.Copy(out, in)
	return err
}

func modeLabel(apply bool) string {
	if apply {
		return "APPLY"
	}
	return "dry-run"
}
