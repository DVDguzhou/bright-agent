// 简易种子脚本，创建演示用户和人生 Agent
// 运行: go run ./scripts/seed.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), 12)
	seller := models.User{
		ID:        models.GenID(),
		Email:     "seller@demo.com",
		Password:  string(hash),
		Name:      strPtr("小兰（卖方）"),
		RoleFlags: models.JSONMap{"is_buyer": false, "is_seller": true},
	}
	if db.DB.Where("email = ?", seller.Email).First(&models.User{}).Error != nil {
		db.DB.Create(&seller)
		fmt.Println("created seller@demo.com")
	}
	buyer := models.User{
		ID:        models.GenID(),
		Email:     "buyer@demo.com",
		Password:  string(hash),
		Name:      strPtr("小红（买方）"),
		RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": true},
	}
	if db.DB.Where("email = ?", buyer.Email).First(&models.User{}).Error != nil {
		db.DB.Create(&buyer)
		fmt.Println("created buyer@demo.com")
	}
	var s models.User
	db.DB.Where("email = ?", "seller@demo.com").First(&s)
	profile := models.LifeAgentProfile{
		ID:               models.GenID(),
		UserID:           s.ID,
		DisplayName:      "阿青学长",
		Headline:         "陪大学生和职场新人做方向选择的过来人",
		ShortBio:         "经历过普通学校求职、转岗和低谷复盘，擅长把抽象焦虑拆成具体行动。",
		LongBio:          "我不是天赋型选手，走过弯路，也做过很多不成熟决定。后来我通过持续复盘，把找方向、找工作、转变节奏这几件事慢慢做顺了。",
		Audience:         "适合大学生、职场1-3年新人、转行前焦虑的人。",
		WelcomeMessage:   "你好，你可以把我当作一个走过弯路但持续复盘的人，直接告诉我你的困惑。",
		PricePerQuestion: 990,
		ExpertiseTags:    models.JSONArray{"大学生", "求职", "职业选择", "转行", "复盘"},
		SampleQuestions:  models.JSONArray{"我现在不知道该考研还是工作", "连续面试失败后我该先调整什么", "想转行但没有底气第一步应该做什么"},
		Published:        true,
	}
	var exist models.LifeAgentProfile
	if db.DB.Where("user_id = ?", s.ID).First(&exist).Error != nil {
		db.DB.Create(&profile)
		db.DB.Create(&models.LifeAgentKnowledgeEntry{
			ID:        models.GenID(),
			ProfileID: profile.ID,
			Category:  "职业成长",
			Title:     "我怎样从迷茫走到稳定成长",
			Content:   "我以前总想一次把未来想清楚，结果越想越焦虑。真正让我走出来的方法不是突然想通，而是先做最小验证。",
			Tags:      models.JSONArray{"迷茫", "职业规划", "行动"},
			SortOrder: 0,
		})
		db.DB.Create(&models.LifeAgentKnowledgeEntry{
			ID:        models.GenID(),
			ProfileID: profile.ID,
			Category:  "求职",
			Title:     "连续面试失败之后我怎么复盘",
			Content:   "我会把失败拆成三层：表达问题、经历包装问题、岗位匹配问题。",
			Tags:      models.JSONArray{"面试", "失败", "复盘"},
			SortOrder: 1,
		})
		fmt.Println("created life agent 阿青学长")
	} else {
		fmt.Println("life agent already exists for seller")
	}
	fmt.Println("seed done. users: buyer@demo.com, seller@demo.com, password: password123")
}

func strPtr(s string) *string { return &s }
