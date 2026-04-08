# 研途榜样 / 飞跃手册系列人生 Agent — 独立账号分配表

本文档对应仓库内 **`internal/yantuseed`** 通过 `Profiles()` 内置的档案顺序（与 `go run ./scripts/seed_yantu_text.go` 写入顺序一致）。

档案 **展示名** 已改为虚构、风格混杂的微信式昵称（与源码中 `DisplayName`、`ArticleTitle`、知识库 `KnowledgeBody` 等处的自称/署名一致），**不代表真实姓名**。

## 原统一导入账号（当前数据归属）

| 字段 | 值 |
|------|-----|
| 邮箱 | `yantu-import@demo.com` |
| 密码 | `password123` |
| 显示名 | 研途榜样导入 |

**和下面表格里 `@163.com` 的关系**：下表「新登录邮箱」是**本仓库为研途种子批量生成的拆分登录号**（占位邮箱 + 统一初始口令），迁户后每条人生 Agent 应归到对应 `@163.com` 用户。**要清空的是旧统一导入号 `yantu-import@demo.com` 上的数据**，不要误删各 `@163.com` 下的正式归属档案；删除脚本见下文「删除研途榜样种子数据」中的 **`YANTU_DELETE_IMPORT_USER_ALL_PROFILES`**。

以下每一行人生 Agent 的**归属用户**为右侧「新登录邮箱」对应账号。

- **`go run ./scripts/seed_yantu_text.go`（推荐）**：按 `yantuseed.Profiles()` 与本表顺序，为每条档案 **ensure** 对应 `@163.com` 用户（不存在则创建，默认口令 `YantuLa2026!`，可用环境变量 `YANTU_SPLIT_PASSWORD` 覆盖），再 upsert 档案与知识库。若某条仍挂在 `yantu-import@demo.com`，**同一次运行会先** 把该条 `user_id` 迁到表中邮箱，再更新内容（并同步共编 `user_id`）。
- **手工迁移**：`ensure_yantu_split_users.go` + `split_yantu_profiles_to_accounts.go` 仍可用，与上表顺序一致；适合不想重跑全文 seed、只迁归属的场景。

若库里 **@163.com 用户已被删光、但档案仍在研途导入账号下**，可先 **重跑 `seed_yantu_text.go`**（会重建缺失的 @163.com 并迁户），或执行 `ensure_yantu_split_users.go` **批量重建** 后再跑拆分脚本（见下文「仅剩研途导入账号时」）。

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

## 删除研途榜样种子数据（危险操作）

级联清理：知识库、买家会话与消息、反馈、评分、提问包、调用密钥、共编状态、收藏等。

- **推荐：清空原研途导入号上「所有」人生 Agent**（不论昵称是否在种子表；**不动**文档里各 `@163.com` 拆分号及其数据）：  
  `YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1 go run ./scripts/delete_yantu_imported_data.go`  
  先预览：`YANTU_DELETE_DRY_RUN=1 YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1 go run ./scripts/delete_yantu_imported_data.go`
- **默认（不推荐作「清空导入号」）**：只删 `yantu-import@demo.com` 下、且 `display_name` 在 `yantuseed.Profiles()` 内的档案；HTML 导入且昵称不在种子表的会保留。
- **进阶**：`YANTU_DELETE_SEED_EVERYWHERE=1` 删除「种子昵称」匹配、且归属用户邮箱**不以** `@163.com` 结尾的档案（清导入号以外的重复副本）；**勿与** `YANTU_DELETE_IMPORT_USER_ALL_PROFILES` 同时设置。

在 `backend` 目录、配置好 `DATABASE_URL` 后（PowerShell 示例把 `export` 换成 `$env:VAR="1"`）：

1. **预览清空导入号全部 Agent**：`YANTU_DELETE_DRY_RUN=1 YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1 go run ./scripts/delete_yantu_imported_data.go`
2. **正式清空导入号全部 Agent**：`YANTU_DELETE_IMPORT_USER_ALL_PROFILES=1 go run ./scripts/delete_yantu_imported_data.go`
3. **可选**：导入号名下已无人生 Agent、且无 License、无人生 Agent 提问包时，删除该用户：`YANTU_DELETE_ORPHAN_USERS=1` 与上一步同一次执行。**`@163.com` 用户永远不会被删。**

级联删除实现见 `internal/yantuseed/cascade_profile_delete.go`。

## 封面图（Unsplash）

- 每位人生 Agent 的 `cover_image_url` 可为 **Unsplash** 外链（免版税，[许可说明](https://unsplash.com/license)）；图池与按 `Profiles()` 顺序一一对应（`YantuSeedCoverURL`）见 `backend/internal/yantuseed/yantu_cover_photos.go`。
- 默认图偏 **头像用途**：方形 `720×720`，人物/宠物以 `crop=faces` 突出面部，少量渐变/风景用 `crop=entropy` 作匿名感占位；全部为 Unsplash 免版税素材，**非**真实用户本人照片。
- **新建/全量重灌种子**：`go run ./scripts/seed_yantu_text.go` 在 `cover` 为空时会自动写入上述封面并清空 `cover_preset_key`。
- **仅给已有库补封面**（按 `display_name` 匹配 `Profiles()`）：在 `backend` 下执行 `go run ./scripts/set_yantu_unsplash_covers.go`；先预览：`YANTU_COVERS_DRY_RUN=1 go run ./scripts/set_yantu_unsplash_covers.go`（PowerShell：`$env:YANTU_COVERS_DRY_RUN="1"; go run ./scripts/set_yantu_unsplash_covers.go`）。
- 后端校验允许 `https://images.unsplash.com/photo-...` 作为合法封面 URL（与站内上传路径并列）。

## 仅剩研途导入账号时：先重建 @163.com 再拆分

适用：**63 个人生 Agent 仍在 `yantu-import@demo.com` 下**，但表中对应的 `@163.com` 用户不存在（或需先统一建好再迁移）。

在 `backend` 目录、`DATABASE_URL` 可用时：

1. **（可选）预览**：`YANTU_SPLIT_DRY_RUN=1 go run ./scripts/ensure_yantu_split_users.go`
2. **创建缺失的 @163.com 用户**：`go run ./scripts/ensure_yantu_split_users.go`  
   - 默认口令与下表一致：`YantuLa2026!`，可用 `YANTU_SPLIT_PASSWORD` 覆盖。  
   - 已存在的邮箱**不会**被删；仅跳过。若需把已存在账号的密码改回默认（谨慎）：`YANTU_ENSURE_RESET_PASSWORD=1 go run ./scripts/ensure_yantu_split_users.go`
3. **把档案迁到各 @163.com**：先预览 `YANTU_SPLIT_DRY_RUN=1 go run ./scripts/split_yantu_profiles_to_accounts.go`，再正式 `go run ./scripts/split_yantu_profiles_to_accounts.go`。

若 **导入账号下已没有这 63 个档案**、但拆分用户也不全，可先 `go run ./scripts/seed_yantu_text.go`（会按表补齐用户与档案）；仅缺用户、档案已在各号下时，再执行上述 2、3 步即可。

## 补充说明

1. **与 HTML 单独导入的关系**：若你还运行过 `import_yantu_life_agents.go` 从微信 HTML 导入额外档案，其 `display_name` 可能不在上表；需按库中实际 `display_name` 增行补表。
2. **安全**：请勿将含真实生产密码的表格提交到公开仓库；上线后应要求各账号修改密码或使用独立强口令。
3. **数据迁移**：在 `backend` 目录设置 `DATABASE_URL`（及 `.env` 若沿用其它脚本）。**@163.com 用户已存在时**可直接拆分：先预览再正式执行。
   - **Bash**：`YANTU_SPLIT_DRY_RUN=1 go run ./scripts/split_yantu_profiles_to_accounts.go`，然后 `go run ./scripts/split_yantu_profiles_to_accounts.go`。
   - **Windows PowerShell**（在 `backend` 下）：`$env:YANTU_SPLIT_DRY_RUN = "1"; go run ./scripts/split_yantu_profiles_to_accounts.go`；确认日志后：`Remove-Item Env:YANTU_SPLIT_DRY_RUN -ErrorAction SilentlyContinue; go run ./scripts/split_yantu_profiles_to_accounts.go`。可选：`$env:YANTU_SPLIT_PASSWORD = "你的口令"`。
   环境变量 `YANTU_SPLIT_PASSWORD` 默认 `YantuLa2026!`，用于**新建**缺失用户；**已存在的邮箱账号默认不会改密码**（`ensure_yantu_split_users` 仅在 `YANTU_ENSURE_RESET_PASSWORD=1` 时重置）。**执行前请保证 MySQL 已启动且 `DATABASE_URL` 可达**，否则会在 `db init` 阶段报错。
