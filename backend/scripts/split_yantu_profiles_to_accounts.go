// 将仍挂在 yantu-import@demo.com 下的研途/飞跃手册人生 Agent，按 display_name 逐条迁到独立登录账号。
// 邮箱列表与 docs/YANTU_ROLE_MODEL_AGENT_ACCOUNTS.md 中「新登录邮箱」一致，顺序与 yantuseed.Profiles() 一致。
//
// 在 backend 目录执行：
//
//	export DATABASE_URL='...'
//	export YANTU_SPLIT_PASSWORD='YantuLa2026!'   # 可选，默认即此
//	go run ./scripts/split_yantu_profiles_to_accounts.go
//
// 仅打印不写入：
//
//	YANTU_SPLIT_DRY_RUN=1 go run ./scripts/split_yantu_profiles_to_accounts.go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

// 与 docs/YANTU_ROLE_MODEL_AGENT_ACCOUNTS.md 同步；勿改顺序。
var splitEmails = []string{
	"nightowl_7zq@163.com",
	"caffe4012@163.com",
	"citrus_moon@163.com",
	"adzuki_mm@163.com",
	"rnd_id_9k@163.com",
	"fizz_bubble8@163.com",
	"hwire_817x@163.com",
	"twist_snack@163.com",
	"drizzle_yy@163.com",
	"fish_slip@163.com",
	"clock_730@163.com",
	"run_free0@163.com",
	"road_ping@163.com",
	"mark_yang9@163.com",
	"happy_dd@163.com",
	"puff_cloud@163.com",
	"bits_hj@163.com",
	"power_on99@163.com",
	"solo_xinxin@163.com",
	"wing_fly0@163.com",
	"chub_ovoe@163.com",
	"trace_back9@163.com",
	"noise_light@163.com",
	"clear_cc@163.com",
	"tea_mio@163.com",
	"echo_ying@163.com",
	"quiet_no@163.com",
	"gate_nn@163.com",
	"beam_ky@163.com",
	"river_fish0@163.com",
	"sky_hao8@163.com",
	"mz_daylog@163.com",
	"hyi_log@163.com",
	"sleep_zrz@163.com",
	"south_nn@163.com",
	"salt_fish88@163.com",
	"germ_safe@163.com",
	"horse_wind3@163.com",
	"rare_min@163.com",
	"rain_yy@163.com",
	"drop_hair@163.com",
	"kv_rev@163.com",
	"bed_lazy@163.com",
	"bulb_small@163.com",
	"side_dragon@163.com",
	"sum_rz@163.com",
	"pie_miss@163.com",
	"law_chew@163.com",
	"jump_half10@163.com",
	"kj_slow@163.com",
	"onion_one@163.com",
	"hz_double@163.com",
	"hurry_no@163.com",
	"chill_ze@163.com",
	"peak_no@163.com",
	"rice_full@163.com",
	"laugh_xx@163.com",
	"open_nk@163.com",
	"sun_yun@163.com",
	"nap_sleep@163.com",
	"cup_no@163.com",
	"glow_xy@163.com",
	"slow_xh@163.com",
}

func strPtr(s string) *string { return &s }

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")
	dry := os.Getenv("YANTU_SPLIT_DRY_RUN") == "1" || os.Getenv("YANTU_SPLIT_DRY_RUN") == "true"
	pw := os.Getenv("YANTU_SPLIT_PASSWORD")
	if pw == "" {
		pw = "YantuLa2026!"
	}

	profiles := yantuseed.Profiles()
	if len(splitEmails) != len(profiles) {
		log.Fatalf("splitEmails 数量 %d 与 Profiles() %d 不一致，请同步文档与脚本", len(splitEmails), len(profiles))
	}

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	var importUser models.User
	if err := db.DB.Where("email = ?", yantuseed.ImportUserEmail).First(&importUser).Error; err != nil {
		log.Fatalf("未找到导入账号 %s：%v", yantuseed.ImportUserEmail, err)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pw), 12)
	if err != nil {
		log.Fatal("bcrypt:", err)
	}
	hashStr := string(hash)

	for i, p := range profiles {
		email := splitEmails[i]
		var prof models.LifeAgentProfile
		q := db.DB.Where("user_id = ? AND display_name = ?", importUser.ID, p.DisplayName)
		if err := q.First(&prof).Error; err != nil {
			log.Printf("[跳过] 未找到档案 import_user + display_name=%q（可能已迁走或名称不一致）", p.DisplayName)
			continue
		}

		var u models.User
		err := db.DB.Where("email = ?", email).First(&u).Error
		if err != nil {
			u = models.User{
				ID:        models.GenID(),
				Email:     email,
				Password:  hashStr,
				Name:      strPtr(p.DisplayName),
				RoleFlags: models.JSONMap{"is_buyer": true, "is_seller": false},
			}
			if dry {
				log.Printf("[dry-run] 将创建用户 %s 并把 profile %s (%s) 的 user_id 指向该用户", email, prof.ID, p.DisplayName)
				continue
			}
			if err := db.DB.Create(&u).Error; err != nil {
				log.Printf("[失败] 创建用户 %s: %v", email, err)
				continue
			}
			log.Printf("已创建用户 %s", email)
		} else {
			if u.ID == importUser.ID {
				log.Printf("[跳过] 邮箱 %s 仍指向导入账号，请换邮箱", email)
				continue
			}
			if dry {
				log.Printf("[dry-run] 用户已存在 %s，将把 profile %s 迁到其下", email, prof.ID)
			}
		}

		if dry {
			continue
		}
		if prof.UserID == u.ID {
			log.Printf("[已是] %s 已在用户 %s 下", p.DisplayName, email)
			continue
		}
		if err := db.DB.Model(&prof).Update("user_id", u.ID).Error; err != nil {
			log.Printf("[失败] 更新 profile %s user_id: %v", prof.ID, err)
			continue
		}
		log.Printf("已迁移 %q -> %s", p.DisplayName, email)
	}

	if dry {
		fmt.Println("split_yantu_profiles_to_accounts dry-run 结束（未写入数据库）")
	} else {
		fmt.Println("split_yantu_profiles_to_accounts 完成")
	}
}
