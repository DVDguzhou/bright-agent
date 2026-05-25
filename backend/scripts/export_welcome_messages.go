// 在终端打印 yantuseed 档案的有效 welcome_message（与 UpsertProfile 逻辑一致）。
//
// 在 backend 目录执行（直接打印到终端，不写文件）：
//
//	go run ./scripts/export_welcome_messages.go
//	go run ./scripts/export_welcome_messages.go --podcast-only
//	LIMIT=10 go run ./scripts/export_welcome_messages.go --podcast-only
package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/agent-marketplace/backend/internal/yantuseed"
)

func effectiveWelcome(p yantuseed.Profile) string {
	if strings.TrimSpace(p.WelcomeMessage) != "" {
		return strings.TrimSpace(p.WelcomeMessage)
	}
	return fmt.Sprintf("你好，我是%s，欢迎问我关于考研备考、择校和心态调整的问题。", p.DisplayName)
}

func main() {
	podcastOnly := os.Getenv("PODCAST_ONLY") == "1"
	limit := 0
	if v := strings.TrimSpace(os.Getenv("LIMIT")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	for _, arg := range os.Args[1:] {
		if arg == "--podcast-only" {
			podcastOnly = true
		}
	}

	profiles := yantuseed.Profiles()
	base := 0
	if podcastOnly {
		profiles = yantuseed.PodcastProfiles()
		base = yantuseed.PodcastProfileStartIndex()
	}
	if limit > 0 && limit < len(profiles) {
		profiles = profiles[:limit]
	}

	scope := fmt.Sprintf("全部 %d 条", len(yantuseed.Profiles()))
	if podcastOnly {
		scope = fmt.Sprintf("播客 %d 条", len(yantuseed.PodcastProfiles()))
	}
	if limit > 0 {
		scope += fmt.Sprintf("（仅前 %d 条）", limit)
	}
	fmt.Printf("欢迎语导出 · %s\n", scope)
	fmt.Println(strings.Repeat("=", 72))

	for i, p := range profiles {
		seq := base + i + 1
		src := strings.TrimSpace(p.Source)
		if src == "" {
			src = "—"
		}
		custom := "默认模板"
		if strings.TrimSpace(p.WelcomeMessage) != "" {
			custom = "自定义"
		}
		fmt.Printf("\n[%d] %s · %s · %s\n", seq, p.DisplayName, src, custom)
		fmt.Println(effectiveWelcome(p))
	}
	fmt.Println()
	fmt.Printf("共 %d 条\n", len(profiles))
}
