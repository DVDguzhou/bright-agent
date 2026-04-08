# 研途榜样 / 飞跃手册系列人生 Agent — 独立账号分配表

本文档对应仓库内 **`internal/yantuseed`** 通过 `Profiles()` 内置的档案顺序（与 `go run ./scripts/seed_yantu_text.go` 写入顺序一致）。

档案 **展示名** 已改为虚构、风格混杂的微信式昵称（与源码中 `DisplayName`、`ArticleTitle`、知识库 `KnowledgeBody` 等处的自称/署名一致），**不代表真实姓名**。

## 原统一导入账号（当前数据归属）

| 字段 | 值 |
|------|-----|
| 邮箱 | `yantu-import@demo.com` |
| 密码 | `password123` |
| 显示名 | 研途榜样导入 |

以下每一行人生 Agent 建议**迁移到右侧「新登录邮箱」对应用户**。仓库内脚本 `backend/scripts/split_yantu_profiles_to_accounts.go` 会按 `yantuseed.Profiles()` 与本表顺序，把仍挂在 `yantu-import@demo.com` 下的档案 `user_id` 改到对应 `@163.com` 用户（详见下文「数据迁移」）。**仅重复运行 `seed_yantu_text.go` 不会完成拆分**，档案仍归属导入账号。

## 新账号约定

- **登录邮箱**：下表为**随机生成的本地部分** + 固定后缀 **`@163.com`**（仅作平台登录账号占位；**并非网易真实开通邮箱**，除非你方已在 163 注册同名地址）。
- **初始密码**（全员相同，便于批量创建后分发）：`YantuLa2026!`
- **说明**：若与真实 163 邮箱冲突，请改本地部分或后缀后同步更新本表。

## 档案与账号对照表

| 序号 | 人生 Agent 显示名 | 原归属账号 | 新登录邮箱 | 初始密码 |
|-----|------------------|------------|------------|----------|
| 1 | 凌晨四点半 | yantu-import@demo.com | nightowl_7zq@163.com | YantuLa2026! |
| 2 | Leo_真的不熬夜 | yantu-import@demo.com | caffe4012@163.com | YantuLa2026! |
| 3 | 🍊橙子味的周二 | yantu-import@demo.com | citrus_moon@163.com | YantuLa2026! |
| 4 | mmm红豆泥 | yantu-import@demo.com | adzuki_mm@163.com | YantuLa2026! |
| 5 | id随便啦_ | yantu-import@demo.com | rnd_id_9k@163.com | YantuLa2026! |
| 6 | 西柚气泡水oO | yantu-import@demo.com | fizz_bubble8@163.com | YantuLa2026! |
| 7 | hw_817 | yantu-import@demo.com | hwire_817x@163.com | YantuLa2026! |
| 8 | 油茶麻花脆 | yantu-import@demo.com | twist_snack@163.com | YantuLa2026! |
| 9 | 雨由由呀 | yantu-import@demo.com | drizzle_yy@163.com | YantuLa2026! |
| 10 | 辰辰今天摸鱼 | yantu-import@demo.com | fish_slip@163.com | YantuLa2026! |
| 11 | 林林七点半 | yantu-import@demo.com | clock_730@163.com | YantuLa2026! |
| 12 | 浩仔不跑路 | yantu-import@demo.com | run_free0@163.com | YantuLa2026! |
| 13 | 路平_Ping | yantu-import@demo.com | road_ping@163.com | YantuLa2026! |
| 14 | 铭洋MYang | yantu-import@demo.com | mark_yang9@163.com | YantuLa2026! |
| 15 | 乐乐今天开心 | yantu-import@demo.com | happy_dd@163.com | YantuLa2026! |
| 16 | 云朵☁️轻一点 | yantu-import@demo.com | puff_cloud@163.com | YantuLa2026! |
| 17 | HJ·碎碎念 | yantu-import@demo.com | bits_hj@163.com | YantuLa2026! |
| 18 | 强超强待机 | yantu-import@demo.com | power_on99@163.com | YantuLa2026! |
| 19 | 欣欣一个人 | yantu-import@demo.com | solo_xinxin@163.com | YantuLa2026! |
| 20 | fly飞飞不飞 | yantu-import@demo.com | wing_fly0@163.com | YantuLa2026! |
| 21 | 丰丰OvO | yantu-import@demo.com | chub_ovoe@163.com | YantuLa2026! |
| 22 | 溯溯回溯中 | yantu-import@demo.com | trace_back9@163.com | YantuLa2026! |
| 23 | 阿亮别闹 | yantu-import@demo.com | noise_light@163.com | YantuLa2026! |
| 24 | 澄澄子呀 | yantu-import@demo.com | clear_cc@163.com | YantuLa2026! |
| 25 | mio茗一下 | yantu-import@demo.com | tea_mio@163.com | YantuLa2026! |
| 26 | 应一声就好 | yantu-import@demo.com | echo_ying@163.com | YantuLa2026! |
| 27 | 毅然拒绝内卷 | yantu-import@demo.com | quiet_no@163.com | YantuLa2026! |
| 28 | ning_关关 | yantu-import@demo.com | gate_nn@163.com | YantuLa2026! |
| 29 | KY梁同学 | yantu-import@demo.com | beam_ky@163.com | YantuLa2026! |
| 30 | 不是鲫鱼是骥宇 | yantu-import@demo.com | river_fish0@163.com | YantuLa2026! |
| 31 | 昊昊不下饭 | yantu-import@demo.com | sky_hao8@163.com | YantuLa2026! |
| 32 | 铭泽MZday | yantu-import@demo.com | mz_daylog@163.com | YantuLa2026! |
| 33 | 泓毅hyi | yantu-import@demo.com | hyi_log@163.com | YantuLa2026! |
| 34 | zzz睿哲 | yantu-import@demo.com | sleep_zrz@163.com | YantuLa2026! |
| 35 | 楠楠南下中 | yantu-import@demo.com | south_nn@163.com | YantuLa2026! |
| 36 | 瑞瑞想当咸鱼 | yantu-import@demo.com | salt_fish88@163.com | YantuLa2026! |
| 37 | 君君不敢菌 | yantu-import@demo.com | germ_safe@163.com | YantuLa2026! |
| 38 | 马马马卷云 | yantu-import@demo.com | horse_wind3@163.com | YantuLa2026! |
| 39 | 忞忞很少上线 | yantu-import@demo.com | rare_min@163.com | YantuLa2026! |
| 40 | 下雨了楹楹 | yantu-import@demo.com | rain_yy@163.com | YantuLa2026! |
| 41 | 毛毛雨别再下 | yantu-import@demo.com | drop_hair@163.com | YantuLa2026! |
| 42 | Kevin在改版 | yantu-import@demo.com | kv_rev@163.com | YantuLa2026! |
| 43 | 天天想赖床 | yantu-import@demo.com | bed_lazy@163.com | YantuLa2026! |
| 44 | 璟_小灯泡 | yantu-import@demo.com | bulb_small@163.com | YantuLa2026! |
| 45 | 龙腾四海小号 | yantu-import@demo.com | side_dragon@163.com | YantuLa2026! |
| 46 | 夏夏_rz | yantu-import@demo.com | sum_rz@163.com | YantuLa2026! |
| 47 | 亦平没披萨 | yantu-import@demo.com | pie_miss@163.com | YantuLa2026! |
| 48 | 法条啃不动 | yantu-import@demo.com | law_chew@163.com | YantuLa2026! |
| 49 | 翕跃十点半 | yantu-import@demo.com | jump_half10@163.com | YantuLa2026! |
| 50 | KJ杰哥慢走 | yantu-import@demo.com | kj_slow@163.com | YantuLa2026! |
| 51 | 万腾一根葱 | yantu-import@demo.com | onion_one@163.com | YantuLa2026! |
| 52 | wzh昊啊昊 | yantu-import@demo.com | hz_double@163.com | YantuLa2026! |
| 53 | 暄暄别催啦 | yantu-import@demo.com | hurry_no@163.com | YantuLa2026! |
| 54 | 泽_ChillZ | yantu-import@demo.com | chill_ze@163.com | YantuLa2026! |
| 55 | Peak唐不糖 | yantu-import@demo.com | peak_no@163.com | YantuLa2026! |
| 56 | 田田今天吃饱 | yantu-import@demo.com | rice_full@163.com | YantuLa2026! |
| 57 | 奚奚哈哈哈哈 | yantu-import@demo.com | laugh_xx@163.com | YantuLa2026! |
| 58 | nk能开张吗 | yantu-import@demo.com | open_nk@163.com | YantuLa2026! |
| 59 | 昀祥今天晴 | yantu-import@demo.com | sun_yun@163.com | YantuLa2026! |
| 60 | sleep华泽先 | yantu-import@demo.com | nap_sleep@163.com | YantuLa2026! |
| 61 | 虎贲不干杯 | yantu-import@demo.com | cup_no@163.com | YantuLa2026! |
| 62 | shine昕玥 | yantu-import@demo.com | glow_xy@163.com | YantuLa2026! |
| 63 | 煦华慢半拍__ | yantu-import@demo.com | slow_xh@163.com | YantuLa2026! |

## 封面图（Unsplash）

- 每位人生 Agent 的 `cover_image_url` 可为 **Unsplash** 外链（免版税，[许可说明](https://unsplash.com/license)）；图池与按 `Profiles()` 顺序一一对应（`YantuSeedCoverURL`）见 `backend/internal/yantuseed/yantu_cover_photos.go`。
- **新建/全量重灌种子**：`go run ./scripts/seed_yantu_text.go` 在 `cover` 为空时会自动写入上述封面并清空 `cover_preset_key`。
- **仅给已有库补封面**（按 `display_name` 匹配 `Profiles()`）：在 `backend` 下执行 `go run ./scripts/set_yantu_unsplash_covers.go`；先预览：`YANTU_COVERS_DRY_RUN=1 go run ./scripts/set_yantu_unsplash_covers.go`（PowerShell：`$env:YANTU_COVERS_DRY_RUN="1"; go run ./scripts/set_yantu_unsplash_covers.go`）。
- 后端校验允许 `https://images.unsplash.com/photo-...` 作为合法封面 URL（与站内上传路径并列）。

## 补充说明

1. **与 HTML 单独导入的关系**：若你还运行过 `import_yantu_life_agents.go` 从微信 HTML 导入额外档案，其 `display_name` 可能不在上表；需按库中实际 `display_name` 增行补表。
2. **安全**：请勿将含真实生产密码的表格提交到公开仓库；上线后应要求各账号修改密码或使用独立强口令。
3. **数据迁移**：在 `backend` 目录设置 `DATABASE_URL`（及 `.env` 若沿用其它脚本）。先预览，再正式执行。
   - **Bash**：`YANTU_SPLIT_DRY_RUN=1 go run ./scripts/split_yantu_profiles_to_accounts.go`，然后 `go run ./scripts/split_yantu_profiles_to_accounts.go`。
   - **Windows PowerShell**（在 `backend` 下）：`$env:YANTU_SPLIT_DRY_RUN = "1"; go run ./scripts/split_yantu_profiles_to_accounts.go`；确认日志后：`Remove-Item Env:YANTU_SPLIT_DRY_RUN -ErrorAction SilentlyContinue; go run ./scripts/split_yantu_profiles_to_accounts.go`。可选：`$env:YANTU_SPLIT_PASSWORD = "你的口令"`。
   环境变量 `YANTU_SPLIT_PASSWORD` 默认 `YantuLa2026!`，用于**新建**缺失用户；**已存在的邮箱账号不会被脚本改密码**，若需统一初始口令请自行在库中或登录流程中处理。也可手工在 `users` 建账号后更新 `life_agent_profiles.user_id`。**执行前请保证 MySQL 已启动且 `DATABASE_URL` 可达**，否则会在 `db init` 阶段报错。
