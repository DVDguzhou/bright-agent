// 将仓库内置的研途榜样纯文本（internal/yantuseed）写入人生 Agent 与知识库。
// 不依赖 HTML 文件，适合直接随代码部署到服务器。
//
// 在 backend 目录执行；会自动尝试加载 .env 与 ../.env。
// 连接串优先级：环境变量 DATABASE_URL（Go DSN 或 mysql://）> DATABASE_PRISMA_URL（mysql://）> 默认本地。
//
//	go run ./scripts/seed_yantu_text.go
package main

import (
	"fmt"
	"log"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}
	user := yantuseed.EnsureImportUser()
	// 批量种子不写 preset：即便写入，lifeAgentShippedCoverPresetPNGs 为空时接口也会回退默认 SVG。
	// 若要用卡通预设，请先把对应 .png 放进 public 并把键同步进前后端的「已部署 preset」表。
	cover := ""
	for _, p := range yantuseed.Profiles() {
		if err := yantuseed.UpsertProfile(user.ID, cover, p); err != nil {
			log.Printf("fail %s: %v", p.DisplayName, err)
		}
	}
	fmt.Println("seed_yantu_text done（研途榜样3人 + 浙大飞跃手册2021 全书60篇 + 合计63个档案）")
}
