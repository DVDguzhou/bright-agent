// 删除人生 Agent 数据（级联知识库、会话、反馈等）。三种模式互斥，按以下优先级：
//
// 1) 清空原研途导入号（推荐）：YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1
//    删除 yantu-import@demo.com 名下**全部**人生 Agent（不限昵称）。文档里的 @163.com 拆分账号及其名下 Agent **不会**被碰。
//
// 2) 全量清「非 @163」下的种子昵称副本：YANTU_DELETE_SEED_EVERYWHERE=1
//    display_name ∈ yantuseed.Profiles() 且归属用户邮箱**不以** @163.com 结尾。用于清导入号以外误挂的种子昵称档。
//
// 3) 默认：仅删除导入号下、且 display_name 在种子列表内的档案（昵称不在 Profiles() 的 HTML 导入档会保留）。
//
// 在 backend 目录执行（需 DATABASE_URL）：
//
//	go run ./scripts/delete_yantu_imported_data.go
//
// 仅打印将删除的档案，不写入：
//
//	YANTU_DELETE_DRY_RUN=1 go run ./scripts/delete_yantu_imported_data.go
//
// 预览清空导入号下全部 Agent：
//
//	YANTU_DELETE_DRY_RUN=1 YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1 go run ./scripts/delete_yantu_imported_data.go
//
// 预览「非 @163」种子昵称：
//
//	YANTU_DELETE_DRY_RUN=1 YANTU_DELETE_SEED_EVERYWHERE=1 go run ./scripts/delete_yantu_imported_data.go
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
	purgeImportAll := os.Getenv("YANTU_DELETE_IMPORT_USER_ALL_PROFILES") == "1" || os.Getenv("YANTU_DELETE_IMPORT_USER_ALL_PROFILES") == "true"
	everywhere := os.Getenv("YANTU_DELETE_SEED_EVERYWHERE") == "1" || os.Getenv("YANTU_DELETE_SEED_EVERYWHERE") == "true"
	if purgeImportAll && everywhere {
		log.Fatal("不要同时设置 YANTU_DELETE_IMPORT_USER_ALL_PROFILES 与 YANTU_DELETE_SEED_EVERYWHERE")
	}

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
	if purgeImportAll {
		var importUser models.User
		if err := db.DB.Where("email = ?", yantuseed.ImportUserEmail).First(&importUser).Error; err != nil {
			fmt.Printf("未找到原研途导入账号 %s，无需删除。@163.com 拆分账号未改动。\n", yantuseed.ImportUserEmail)
			return
		}
		if err := db.DB.Where("user_id = ?", importUser.ID).Find(&profiles).Error; err != nil {
			log.Fatal("query profiles:", err)
		}
		if len(profiles) == 0 {
			fmt.Printf("%s 名下已无任何人生 Agent（@163.com 用户数据未检查、未删除）。\n", yantuseed.ImportUserEmail)
			return
		}
		fmt.Printf("将处理 %d 条人生 Agent（清空账号 %s 名下全部；文档中的 @163.com 拆分号不受影响）\n", len(profiles), yantuseed.ImportUserEmail)
	} else if everywhere {
		var excludeUserIDs []string
		if err := db.DB.Model(&models.User{}).Where("LOWER(email) LIKE ?", "%@163.com").Pluck("id", &excludeUserIDs).Error; err != nil {
			log.Fatal("query @163.com user ids:", err)
		}
		q := db.DB.Where("display_name IN ?", names)
		if len(excludeUserIDs) > 0 {
			q = q.Where("user_id NOT IN ?", excludeUserIDs)
		}
		if err := q.Find(&profiles).Error; err != nil {
			log.Fatal("query profiles:", err)
		}
		var n163 int64
		if len(excludeUserIDs) > 0 {
			db.DB.Model(&models.LifeAgentProfile{}).Where("display_name IN ? AND user_id IN ?", names, excludeUserIDs).Count(&n163)
		}
		if len(profiles) == 0 {
			if n163 > 0 {
				fmt.Printf("未找到可删档案：种子昵称匹配的 %d 条均在 @163.com 用户下，已按约定保留。\n", n163)
			} else {
				fmt.Println("未找到任何 display_name 属于种子列表的人生 Agent（可能已清空）。")
			}
			return
		}
		fmt.Printf("将处理 %d 条人生 Agent 档案（全量模式：排除 @163.com 用户；种子昵称去重 %d 个", len(profiles), len(names))
		if n163 > 0 {
			fmt.Printf("；另 %d 条在 @163.com 下保留", n163)
		}
		fmt.Println("）")
	} else {
		var importUser models.User
		if err := db.DB.Where("email = ?", yantuseed.ImportUserEmail).First(&importUser).Error; err != nil {
			fmt.Printf("未找到原研途导入账号 %s。若档案已在文档中的 @163.com 下，无需本脚本。\n", yantuseed.ImportUserEmail)
			return
		}
		if err := db.DB.Where("display_name IN ? AND user_id = ?", names, importUser.ID).Find(&profiles).Error; err != nil {
			log.Fatal("query profiles:", err)
		}
		if len(profiles) == 0 {
			fmt.Printf("在 %s 下未找到「种子昵称」档案（可能已迁到 @163.com）。若要删掉该导入号下**所有** Agent，请使用 YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1。\n", yantuseed.ImportUserEmail)
			return
		}
		fmt.Printf("将处理 %d 条人生 Agent（仅 %s 下、且昵称为种子列表内，去重 %d 个）\n", len(profiles), yantuseed.ImportUserEmail, len(names))
	}
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
