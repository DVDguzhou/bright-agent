// 删除仓库内置研途榜样 / 飞跃手册种子对应的人生 Agent（按 yantuseed.Profiles() 的 display_name 匹配），
// 并级联清理会话、知识库、反馈、共编状态等。不删除通过 HTML 单独导入且 display_name 不在种子列表中的档案。
//
// 在 backend 目录执行（需 DATABASE_URL）：
//
//	go run ./scripts/delete_yantu_imported_data.go
//
// 仅打印将删除的档案，不写入：
//
//	YANTU_DELETE_DRY_RUN=1 go run ./scripts/delete_yantu_imported_data.go
//
// 删除档案后，可选仅清理原导入账号 yantu-import@demo.com：若其名下已无任何人生 Agent、
// 且无任何 License、无任何人生 Agent 提问包购买记录，则删除该用户。
// 拆分用的 @163.com 登录账号永远不会被本脚本删除。
//
//	YANTU_DELETE_ORPHAN_USERS=1 go run ./scripts/delete_yantu_imported_data.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dry := os.Getenv("YANTU_DELETE_DRY_RUN") == "1" || os.Getenv("YANTU_DELETE_DRY_RUN") == "true"
	delUsers := os.Getenv("YANTU_DELETE_ORPHAN_USERS") == "1" || os.Getenv("YANTU_DELETE_ORPHAN_USERS") == "true"

	seed := yantuseed.Profiles()

	names := make([]string, 0, len(seed))
	seen := make(map[string]struct{})
	for _, p := range seed {
		if _, ok := seen[p.DisplayName]; ok {
			continue
		}
		seen[p.DisplayName] = struct{}{}
		names = append(names, p.DisplayName)
	}

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	var profiles []models.LifeAgentProfile
	if err := db.DB.Where("display_name IN ?", names).Find(&profiles).Error; err != nil {
		log.Fatal("query profiles:", err)
	}

	if len(profiles) == 0 {
		fmt.Println("未找到匹配 display_name 的人生 Agent，无需删除。")
		return
	}

	fmt.Printf("将处理 %d 条人生 Agent 档案（种子昵称去重后 %d 个）\n", len(profiles), len(names))
	for _, p := range profiles {
		if dry {
			fmt.Printf("[dry-run] 将删除 id=%s display_name=%q user_id=%s\n", p.ID, p.DisplayName, p.UserID)
			continue
		}
		if err := yantuseed.DeleteLifeAgentProfileCascade(db.DB, p.ID); err != nil {
			log.Printf("删除失败 %q (%s): %v", p.DisplayName, p.ID, err)
			continue
		}
		fmt.Println("已删除", p.DisplayName, p.ID)
	}

	if dry || !delUsers {
		if dry {
			fmt.Println("dry-run 结束，未写入数据库。")
		}
		return
	}

	for _, email := range []string{yantuseed.ImportUserEmail} {
		var u models.User
		if err := db.DB.Where("email = ?", email).First(&u).Error; err != nil {
			continue
		}
		var nProf, nLic, nPack int64
		db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", u.ID).Count(&nProf)
		db.DB.Model(&models.License{}).Where("buyer_id = ?", u.ID).Count(&nLic)
		db.DB.Model(&models.LifeAgentQuestionPack{}).Where("buyer_id = ?", u.ID).Count(&nPack)
		if nProf > 0 || nLic > 0 || nPack > 0 {
			fmt.Printf("保留用户 %s（profiles=%d licenses=%d packs=%d）\n", email, nProf, nLic, nPack)
			continue
		}
		if err := db.DB.Delete(&u).Error; err != nil {
			log.Printf("删除用户 %s 失败: %v", email, err)
			continue
		}
		fmt.Println("已删除用户", email)
	}
	fmt.Println("delete_yantu_imported_data 完成")
}
