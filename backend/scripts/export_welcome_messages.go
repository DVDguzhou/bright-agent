// 导出 yantuseed 全部档案的有效 welcome_message（与 UpsertProfile 逻辑一致）。
//
// 在 backend 目录执行：
//
//	go run ./scripts/export_welcome_messages.go
//	go run ./scripts/export_welcome_messages.go --podcast-only
//	go run ./scripts/export_welcome_messages.go --out ../docs/WELCOME_MESSAGES_EXPORT.md
//	go run ./scripts/export_welcome_messages.go --podcast-only --out ../docs/WELCOME_MESSAGES_PODCAST.md
//	go run ./scripts/export_welcome_messages.go --csv --out ../docs/welcome_messages.csv
package main

import (
	"encoding/csv"
	"fmt"
	"os"
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
	csvMode := false
	outPath := ""
	for i := 1; i < len(os.Args); i++ {
		arg := os.Args[i]
		switch arg {
		case "--podcast-only":
			podcastOnly = true
		case "--csv":
			csvMode = true
		case "--out":
			if i+1 < len(os.Args) {
				outPath = os.Args[i+1]
				i++
			}
		default:
			if strings.HasPrefix(arg, "--out=") {
				outPath = strings.TrimPrefix(arg, "--out=")
			}
		}
	}

	profiles := yantuseed.Profiles()
	if podcastOnly {
		profiles = yantuseed.PodcastProfiles()
	}

	var out *os.File
	if outPath != "" {
		f, err := os.Create(outPath)
		if err != nil {
			fmt.Fprintln(os.Stderr, "create:", err)
			os.Exit(1)
		}
		defer f.Close()
		out = f
	} else {
		out = os.Stdout
	}

	if csvMode {
		w := csv.NewWriter(out)
		_ = w.Write([]string{"seq", "display_name", "source", "custom", "welcome_message"})
		base := 0
		if podcastOnly {
			base = yantuseed.PodcastProfileStartIndex()
		}
		for i, p := range profiles {
			custom := strings.TrimSpace(p.WelcomeMessage) != ""
			src := strings.TrimSpace(p.Source)
			_ = w.Write([]string{
				fmt.Sprintf("%d", base+i+1),
				p.DisplayName,
				src,
				fmt.Sprintf("%t", custom),
				effectiveWelcome(p),
			})
		}
		w.Flush()
		return
	}

	fmt.Fprintln(out, "# 人生 Agent 欢迎语导出")
	fmt.Fprintln(out)
	if podcastOnly {
		fmt.Fprintf(out, "范围：播客 %d 条\n\n", len(profiles))
	} else {
		fmt.Fprintf(out, "范围：全部 %d 条\n\n", len(profiles))
	}
	fmt.Fprintln(out, "| 序号 | 昵称 | 来源 | 自定义 | 欢迎语 |")
	fmt.Fprintln(out, "| --- | --- | --- | --- | --- |")

	base := 0
	if podcastOnly {
		base = yantuseed.PodcastProfileStartIndex()
	}
	for i, p := range profiles {
		custom := "否"
		if strings.TrimSpace(p.WelcomeMessage) != "" {
			custom = "是"
		}
		src := strings.TrimSpace(p.Source)
		if src == "" {
			src = "—"
		}
		welcome := effectiveWelcome(p)
		welcome = strings.ReplaceAll(welcome, "|", "\\|")
		welcome = strings.ReplaceAll(welcome, "\n", " ")
		fmt.Fprintf(out, "| %d | %s | %s | %s | %s |\n", base+i+1, p.DisplayName, src, custom, welcome)
	}
}
