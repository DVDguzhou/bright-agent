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

## 北邮飞跃手册第十四章「申请经验谈」系列（23 条）

来源：《北邮飞跃手册》第十四章，23 位出国申请经验作者。
档案文件：`backend/internal/yantuseed/profiles_bupt_feyue.go`

| 序号 | 人生 Agent 显示名 | 原论坛ID | 原归属账号 | 新登录邮箱 | 初始密码 |
|-----|------------------|----------|------------|------------|----------|
| 64 | 幽灵不打烊 | holyghost | yantu-import@demo.com | ghost_on99@163.com | YantuLa2026! |
| 65 | 星辰大海Luo | patrickluo | yantu-import@demo.com | star_sea_l@163.com | YantuLa2026! |
| 66 | carol吃薯片 | carol | yantu-import@demo.com | chip_carol@163.com | YantuLa2026! |
| 67 | 海浪轻轻摇 | haipiaoxiao | yantu-import@demo.com | wave_rock8@163.com | YantuLa2026! |
| 68 | 小柯_Nap | xiaokeaister | yantu-import@demo.com | nap_xk@163.com | YantuLa2026! |
| 69 | 赢了别浪 | wining | yantu-import@demo.com | win_cool7@163.com | YantuLa2026! |
| 70 | 猫咪打盹中 | didocat | yantu-import@demo.com | cat_doze@163.com | YantuLa2026! |
| 71 | 旅人TripX | traveller | yantu-import@demo.com | trip_xx@163.com | YantuLa2026! |
| 72 | 泡泡不会破 | bububub | yantu-import@demo.com | bubble_pop@163.com | YantuLa2026! |
| 73 | 硬糖嘎嘣脆 | Hardcandy | yantu-import@demo.com | candy_crk@163.com | YantuLa2026! |
| 74 | lyk_星期五 | XXlyk | yantu-import@demo.com | fri_lyk@163.com | YantuLa2026! |
| 75 | 天马行空bupt | pegasusbupt | yantu-import@demo.com | pegasus_fly@163.com | YantuLa2026! |
| 76 | Func_不加班 | Func | yantu-import@demo.com | func_off@163.com | YantuLa2026! |
| 77 | 念旧的小鬼 | NostalgicImp | yantu-import@demo.com | old_imp@163.com | YantuLa2026! |
| 78 | 亚星today | asianstar | yantu-import@demo.com | asia_star@163.com | YantuLa2026! |
| 79 | 耳朵爱听歌 | iwannasay/耳朵 | yantu-import@demo.com | ear_song@163.com | YantuLa2026! |
| 80 | toto想回家 | toto86 | yantu-import@demo.com | toto_home@163.com | YantuLa2026! |
| 81 | 苹果酱w | applw9204120 | yantu-import@demo.com | apple_jam@163.com | YantuLa2026! |
| 82 | 墨墨不上线 | momolan | yantu-import@demo.com | ink_off8@163.com | YantuLa2026! |
| 83 | 雷霆闪电89 | Thunder1989 | yantu-import@demo.com | thunder_89@163.com | YantuLa2026! |
| 84 | 小猪xp_Art | xpig | yantu-import@demo.com | pig_art@163.com | YantuLa2026! |
| 85 | 教训记牢了 | canbyjiaoxun | yantu-import@demo.com | lesson_ok@163.com | YantuLa2026! |
| 86 | 光子麦克斯 | xmaximum | yantu-import@demo.com | photon_max@163.com | YantuLa2026! |

## 华科飞跃手册 2020 光学与电子信息/工程科学学院系列（27 条）

来源：《华中科技大学光学与电子信息学院 / 工程科学学院飞跃手册 2020》第三编，27 位升学经验作者。
档案文件：`backend/internal/yantuseed/profiles_hust_feyue.go`

| 序号 | 人生 Agent 显示名 | 原归属来源 | 原归属账号 | 新登录邮箱 | 初始密码 |
|-----|------------------|-----------|------------|------------|----------|
| 87 | 码农阿喵 | 华科飞跃手册2020 | yantu-import@demo.com | husk_wave3@163.com | YantuLa2026! |
| 88 | 柠檬不酸ya | 华科飞跃手册2020 | yantu-import@demo.com | flux_d7k@163.com | YantuLa2026! |
| 89 | 扶摇九万里 | 华科飞跃手册2020 | yantu-import@demo.com | neon_crab8@163.com | YantuLa2026! |
| 90 | 北极星xw | 华科飞跃手册2020 | yantu-import@demo.com | zh_orbit@163.com | YantuLa2026! |
| 91 | 追光Zzz | 华科飞跃手册2020 | yantu-import@demo.com | comet_hx@163.com | YantuLa2026! |
| 92 | 橘子汽水er | 华科飞跃手册2020 | yantu-import@demo.com | mint_leaf9@163.com | YantuLa2026! |
| 93 | 嗷呜小怪兽 | 华科飞跃手册2020 | yantu-import@demo.com | jade_kf0@163.com | YantuLa2026! |
| 94 | 暴走萝卜丁 | 华科飞跃手册2020 | yantu-import@demo.com | drift_yz@163.com | YantuLa2026! |
| 95 | 晚风予星河 | 华科飞跃手册2020 | yantu-import@demo.com | fog_lamp3@163.com | YantuLa2026! |
| 96 | 阿拉蕾biu | 华科飞跃手册2020 | yantu-import@demo.com | pixel_wq@163.com | YantuLa2026! |
| 97 | 太阳花2号 | 华科飞跃手册2020 | yantu-import@demo.com | sand_fox0@163.com | YantuLa2026! |
| 98 | 鹤鸣九皋 | 华科飞跃手册2020 | yantu-import@demo.com | quilt_nn@163.com | YantuLa2026! |
| 99 | 蓝莓冰沙Q | 华科飞跃手册2020 | yantu-import@demo.com | maple_hk8@163.com | YantuLa2026! |
| 100 | 星球漫游33 | 华科飞跃手册2020 | yantu-import@demo.com | noon_cat@163.com | YantuLa2026! |
| 101 | 微光Lab | 华科飞跃手册2020 | yantu-import@demo.com | prism_lz@163.com | YantuLa2026! |
| 102 | 枫叶加零 | 华科飞跃手册2020 | yantu-import@demo.com | volt_bee@163.com | YantuLa2026! |
| 103 | 蔷薇花开Lv | 华科飞跃手册2020 | yantu-import@demo.com | cork_dn9@163.com | YantuLa2026! |
| 104 | 甜筒翻转ss | 华科飞跃手册2020 | yantu-import@demo.com | arc_wind7@163.com | YantuLa2026! |
| 105 | 小确幸z7 | 华科飞跃手册2020 | yantu-import@demo.com | opal_fish@163.com | YantuLa2026! |
| 106 | 银河冲浪手 | 华科飞跃手册2020 | yantu-import@demo.com | twig_mk0@163.com | YantuLa2026! |
| 107 | 纳米小分队 | 华科飞跃手册2020 | yantu-import@demo.com | chalk_8y@163.com | YantuLa2026! |
| 108 | 光波dispersion | 华科飞跃手册2020 | yantu-import@demo.com | fern_blue@163.com | YantuLa2026! |
| 109 | 芯片味的茶 | 华科飞跃手册2020 | yantu-import@demo.com | haze_owl@163.com | YantuLa2026! |
| 110 | 激光小王子 | 华科飞跃手册2020 | yantu-import@demo.com | zinc_rr9@163.com | YantuLa2026! |
| 111 | 港湾小舟rv | 华科飞跃手册2020 | yantu-import@demo.com | dew_plum@163.com | YantuLa2026! |
| 112 | 元气弹bq | 华科飞跃手册2020 | yantu-import@demo.com | knot_echo@163.com | YantuLa2026! |
| 113 | 解码小能手 | 华科飞跃手册2020 | yantu-import@demo.com | reef_lx9@163.com | YantuLa2026! |
| 114 | 键盘敲敲敲 | 南科大飞跃手册 | yantu-import@demo.com | snowy_fox8@163.com | YantuLa2026! |
| 115 | 咖啡不加冰c | 南科大飞跃手册 | yantu-import@demo.com | dawn_leaf3@163.com | YantuLa2026! |
| 116 | 代码写不停xy | 南科大飞跃手册 | yantu-import@demo.com | tide_rock7@163.com | YantuLa2026! |
| 117 | 极客老方yd | 南科大飞跃手册 | yantu-import@demo.com | plum_rain9@163.com | YantuLa2026! |
| 118 | 安全研究员rx | 南科大飞跃手册 | yantu-import@demo.com | sage_bird0@163.com | YantuLa2026! |
| 119 | 鹿仔ECE冲 | 南科大飞跃手册 | yantu-import@demo.com | iron_wave5@163.com | YantuLa2026! |
| 120 | 医工交叉sr | 南科大飞跃手册 | yantu-import@demo.com | dusk_pine4@163.com | YantuLa2026! |
| 121 | 保研小白zq | 南科大飞跃手册 | yantu-import@demo.com | moss_frog2@163.com | YantuLa2026! |
| 122 | 系统狂魔wd | 南科大飞跃手册 | yantu-import@demo.com | clay_dust5@163.com | YantuLa2026! |
| 123 | 浙软上岸ysh | 南科大飞跃手册 | yantu-import@demo.com | lark_pond8@163.com | YantuLa2026! |
| 124 | NUS打工人yl | 南科大飞跃手册 | yantu-import@demo.com | ruby_mist3@163.com | YantuLa2026! |
| 125 | 中科大梦yl | 南科大飞跃手册 | yantu-import@demo.com | cold_brew9@163.com | YantuLa2026! |
| 126 | CMU多面手yc | 南科大飞跃手册 | yantu-import@demo.com | thorn_ivy6@163.com | YantuLa2026! |
| 127 | 赌博少女_yt | 南科大飞跃手册 | yantu-import@demo.com | zinc_glow2@163.com | YantuLa2026! |
| 128 | 沙特体验官w | 南科大飞跃手册 | yantu-import@demo.com | bark_leaf3@163.com | YantuLa2026! |
| 129 | 安卓小哥km | 南科大飞跃手册 | yantu-import@demo.com | haze_pool6@163.com | YantuLa2026! |
| 130 | 腾讯刷题王yh | 南科大飞跃手册 | yantu-import@demo.com | gem_spark7@163.com | YantuLa2026! |
| 131 | Purdue宁神dn | 南科大飞跃手册 | yantu-import@demo.com | flint_ash4@163.com | YantuLa2026! |
| 132 | UCI搞基侠xy | 南科大飞跃手册 | yantu-import@demo.com | pebble_lk9@163.com | YantuLa2026! |
| 133 | 暑研安利员xy2 | 南科大飞跃手册 | yantu-import@demo.com | cork_vine3@163.com | YantuLa2026! |
| 134 | NEU安全侠rg | 南科大飞跃手册 | yantu-import@demo.com | wolf_moon4@163.com | YantuLa2026! |
| 135 | NEU找工人whf | 南科大飞跃手册 | yantu-import@demo.com | gale_mist2@163.com | YantuLa2026! |
| 136 | 设计转码云zx | 南科大飞跃手册 | yantu-import@demo.com | oak_trail8@163.com | YantuLa2026! |
| 137 | 清华设计师tg | 南科大飞跃手册 | yantu-import@demo.com | storm_fin6@163.com | YantuLa2026! |
| 138 | CMU数据蕾al | 南科大飞跃手册 | yantu-import@demo.com | nest_glow9@163.com | YantuLa2026! |
| 139 | 阿尔托HCI柯 | 南科大飞跃手册 | yantu-import@demo.com | silk_pond3@163.com | YantuLa2026! |
| 140 | 求职蚂蚁st | 南科大飞跃手册 | yantu-import@demo.com | glen_moss7@163.com | YantuLa2026! |
| 141 | APS攻略xq | 南科大飞跃手册 | yantu-import@demo.com | rust_plow2@163.com | YantuLa2026! |
| 142 | 北大菁英st2 | 南科大飞跃手册 | yantu-import@demo.com | brine_fog8@163.com | YantuLa2026! |
| 143 | 港大PM菁yj | 南科大飞跃手册 | yantu-import@demo.com | elm_shade5@163.com | YantuLa2026! |
| 144 | PPT选手zx | 南科大飞跃手册 | yantu-import@demo.com | ash_creek7@163.com | YantuLa2026! |
| 145 | Utah全奖zy | 南科大飞跃手册 | yantu-import@demo.com | pine_gust4@163.com | YantuLa2026! |
| 146 | 系统菜狗sc | 南科大飞跃手册 | yantu-import@demo.com | dune_crab3@163.com | YantuLa2026! |
| 147 | 环保清研er | 南科大飞跃手册 | yantu-import@demo.com | cave_echo5@163.com | YantuLa2026! |
| 148 | 模拟芯人rw | 南科大飞跃手册 | yantu-import@demo.com | vale_mink8@163.com | YantuLa2026! |
| 149 | 脑机接口wy | 南科大飞跃手册 | yantu-import@demo.com | cove_star2@163.com | YantuLa2026! |
| 150 | 航发冲天xw | 南科大飞跃手册 | yantu-import@demo.com | teak_pod39@163.com | YantuLa2026! |
| 151 | 力学小白jq | 南科大飞跃手册 | yantu-import@demo.com | fawn_bell7@163.com | YantuLa2026! |
| 152 | 学渣逆袭yh | 南科大飞跃手册 | yantu-import@demo.com | lynx_den73@163.com | YantuLa2026! |
| 153 | 荷兰机器人rb | 南科大飞跃手册 | yantu-import@demo.com | yew_brook5@163.com | YantuLa2026! |
| 154 | 光电暑研zk | 南科大飞跃手册 | yantu-import@demo.com | peat_hill2@163.com | YantuLa2026! |
| 155 | 数字芯片yz | 南科大飞跃手册 | yantu-import@demo.com | quartz_m6@163.com | YantuLa2026! |
| 156 | 北大IC达人yj | 南科大飞跃手册 | yantu-import@demo.com | swift_ray8@163.com | YantuLa2026! |
| 157 | 东大修士xg | 南科大飞跃手册 | yantu-import@demo.com | crane_kz9@163.com | YantuLa2026! |
| 158 | UMN力学zl | 南科大飞跃手册 | yantu-import@demo.com | grove_lx7@163.com | YantuLa2026! |
| 159 | 圣母转码gc | 南科大飞跃手册 | yantu-import@demo.com | lotus_dew3@163.com | YantuLa2026! |
| 160 | 柔性电子h | 南科大飞跃手册 | yantu-import@demo.com | blaze_mk9@163.com | YantuLa2026! |
| 161 | 安堡微电mt | 南科大飞跃手册 | yantu-import@demo.com | pearl_net5@163.com | YantuLa2026! |
| 162 | 厦大环科hw | 南科大飞跃手册 | yantu-import@demo.com | cedar_fog3@163.com | YantuLa2026! |
| 163 | 哥大暑研jy | 南科大飞跃手册 | yantu-import@demo.com | amber_bay7@163.com | YantuLa2026! |
| 164 | 水文博士yi | 南科大飞跃手册 | yantu-import@demo.com | wick_glow9@163.com | YantuLa2026! |
| 165 | 代尔夫特argue姐 | 南科大飞跃手册 | yantu-import@demo.com | plume_sky2@163.com | YantuLa2026! |
| 166 | GaTech力学yz | 南科大飞跃手册 | yantu-import@demo.com | sable_fin8@163.com | YantuLa2026! |
| 167 | 中科院IC侠wz | 南科大飞跃手册 | yantu-import@demo.com | clover_h3@163.com | YantuLa2026! |
| 168 | 港科联培ry | 南科大飞跃手册 | yantu-import@demo.com | frost_gem4@163.com | YantuLa2026! |
| 169 | 市场大使hh | 南科大飞跃手册 | yantu-import@demo.com | bloom_rye2@163.com | YantuLa2026! |
| 170 | 北大力学ym | 南科大飞跃手册 | yantu-import@demo.com | coral_sun3@163.com | YantuLa2026! |
| 171 | 北航暑研hr | 南科大飞跃手册 | yantu-import@demo.com | agave_m80@163.com | YantuLa2026! |
| 172 | 哥大骑行侠wx | 南科大飞跃手册 | yantu-import@demo.com | birch_hz9@163.com | YantuLa2026! |
| 173 | ETH机器人yz2 | 南科大飞跃手册 | yantu-import@demo.com | flax_pol7@163.com | YantuLa2026! |
| 174 | 海洋博士yao | 南科大飞跃手册 | yantu-import@demo.com | stork_lm5@163.com | YantuLa2026! |
| 175 | UCI电子jd | 南科大飞跃手册 | yantu-import@demo.com | cloud_iv9@163.com | YantuLa2026! |
| 176 | UCLA机械tq | 南科大飞跃手册 | yantu-import@demo.com | marsh_fx8@163.com | YantuLa2026! |
| 177 | CMU机器学zc | 南科大飞跃手册 | yantu-import@demo.com | trail_dw5@163.com | YantuLa2026! |
| 178 | 宾大ESE侠yy | 南科大飞跃手册 | yantu-import@demo.com | spore_ok7@163.com | YantuLa2026! |
| 179 | UIC通信博wz2 | 南科大飞跃手册 | yantu-import@demo.com | ivy_nth03@163.com | YantuLa2026! |
| 180 | 光电科研hy | 南科大飞跃手册 | yantu-import@demo.com | patch_em6@163.com | YantuLa2026! |
| 181 | 感染研究喵yy | 南科大飞跃手册 | yantu-import@demo.com | tern_lk02@163.com | YantuLa2026! |
| 182 | 化学反应堆y | 南科大飞跃手册 | yantu-import@demo.com | spark_fr9@163.com | YantuLa2026! |
| 183 | 化工跨界人zz | 南科大飞跃手册 | yantu-import@demo.com | bluff_ah7@163.com | YantuLa2026! |
| 184 | 数值计算君zy | 南科大飞跃手册 | yantu-import@demo.com | grit_snd3@163.com | YantuLa2026! |
| 185 | 量子态观测xy | 南科大飞跃手册 | yantu-import@demo.com | lunar_by6@163.com | YantuLa2026! |
| 186 | 港中文化学dj | 南科大飞跃手册 | yantu-import@demo.com | zest_lme8@163.com | YantuLa2026! |
| 187 | 光华套利手yy | 南科大飞跃手册 | yantu-import@demo.com | mango_r09@163.com | YantuLa2026! |
| 188 | 公共政策人lw | 南科大飞跃手册 | yantu-import@demo.com | olive_sn3@163.com | YantuLa2026! |
| 189 | 控制论信徒nf | 南科大飞跃手册 | yantu-import@demo.com | cider_dw7@163.com | YantuLa2026! |
| 190 | 名古屋环境cl | 南科大飞跃手册 | yantu-import@demo.com | petal_fx5@163.com | YantuLa2026! |
| 191 | 延毕数学人rj | 南科大飞跃手册 | yantu-import@demo.com | daisy_lg3@163.com | YantuLa2026! |
| 192 | 深蓝潜水员ww | 南科大飞跃手册 | yantu-import@demo.com | ember_by7@163.com | YantuLa2026! |
| 193 | 布朗数学人yh | 南科大飞跃手册 | yantu-import@demo.com | aloe_mnt9@163.com | YantuLa2026! |
| 194 | 华威神经元ym | 南科大飞跃手册 | yantu-import@demo.com | palm_cve2@163.com | YantuLa2026! |
| 195 | 踩坑幸存者bz | 南科大飞跃手册 | yantu-import@demo.com | fable_sk8@163.com | YantuLa2026! |
| 196 | 怒考化学生k | 南科大飞跃手册 | yantu-import@demo.com | anvil_sp3@163.com | YantuLa2026! |
| 197 | 北大物理一jj | 南科大飞跃手册 | yantu-import@demo.com | plank_ki5@163.com | YantuLa2026! |
| 198 | 生物交叉侠l | 南科大飞跃手册 | yantu-import@demo.com | silt_ore8@163.com | YantuLa2026! |
| 199 | ETH地球人lu | 南科大飞跃手册 | yantu-import@demo.com | hemp_tid7@163.com | YantuLa2026! |
| 200 | 伯克利神经c | 南科大飞跃手册 | yantu-import@demo.com | hawk_gln9@163.com | YantuLa2026! |
| 201 | 跨考逆袭王h | 南科大飞跃手册 | yantu-import@demo.com | kelp_by02@163.com | YantuLa2026! |
| 202 | 中科大微尺度jh | 南科大飞跃手册 | yantu-import@demo.com | root_vne3@163.com | YantuLa2026! |
| 203 | 材料踩坑侠yf | 南科大飞跃手册 | yantu-import@demo.com | alder_h03@163.com | YantuLa2026! |
| 204 | 凝聚态老王yh | 南科大飞跃手册 | yantu-import@demo.com | basalt_r9@163.com | YantuLa2026! |
| 205 | 数分不放弃yf | 南科大飞跃手册 | yantu-import@demo.com | cobalt_n7@163.com | YantuLa2026! |
| 206 | 游戏规则解读yc | 南科大飞跃手册 | yantu-import@demo.com | delta_fr5@163.com | YantuLa2026! |
| 207 | BA转型选手zy | 南科大飞跃手册 | yantu-import@demo.com | flare_m92@163.com | YantuLa2026! |
| 208 | PPT达人xy2 | 南科大飞跃手册 | yantu-import@demo.com | gravel_x5@163.com | YantuLa2026! |
| 209 | 东大修士sh | 南科大飞跃手册 | yantu-import@demo.com | harbor_z8@163.com | YantuLa2026! |
| 210 | 脑科学探路yj | 南科大飞跃手册 | yantu-import@demo.com | igloo_p06@163.com | YantuLa2026! |
| 211 | 宾大生工人z | 南科大飞跃手册 | yantu-import@demo.com | jewel_fx3@163.com | YantuLa2026! |
| 212 | KAUST脑科学j | 南科大飞跃手册 | yantu-import@demo.com | karma_g03@163.com | YantuLa2026! |
| 213 | 凝聚态自救xc | 南科大飞跃手册 | yantu-import@demo.com | lemon_h09@163.com | YantuLa2026! |
| 214 | 传媒少女cd | 南科大飞跃手册 | yantu-import@demo.com | noble_ah6@163.com | YantuLa2026! |
| 215 | 法学冒险家gy | 南科大飞跃手册 | yantu-import@demo.com | orbit_b08@163.com | YantuLa2026! |
| 216 | 金融卷王xy | 南科大飞跃手册 | yantu-import@demo.com | quill_h03@163.com | YantuLa2026! |
| 217 | 金科状元hy | 南科大飞跃手册 | yantu-import@demo.com | rapid_l09@163.com | YantuLa2026! |
| 218 | 港大统计侠dy | 南科大飞跃手册 | yantu-import@demo.com | solar_f03@163.com | YantuLa2026! |
| 219 | 欧陆探索者mz | 南科大飞跃手册 | yantu-import@demo.com | torch_i05@163.com | YantuLa2026! |
| 220 | 哥大风控达人hm | 南科大飞跃手册 | yantu-import@demo.com | umbra_n03@163.com | YantuLa2026! |
| 221 | 港新混申达人bw | 南科大飞跃手册 | yantu-import@demo.com | vapor_d08@163.com | YantuLa2026! |
| 222 | NUS金工先锋fe | 南科大飞跃手册 | yantu-import@demo.com | walnt_m09@163.com | YantuLa2026! |
| 223 | CMU数据分析师zc | 南科大飞跃手册 | yantu-import@demo.com | xenon_r08@163.com | YantuLa2026! |
| 224 | PPT金工达人yl | 南科大飞跃手册 | yantu-import@demo.com | yarrow_g9@163.com | YantuLa2026! |
| 225 | 考研数分选手my | 南科大飞跃手册 | yantu-import@demo.com | aspen_dw3@163.com | YantuLa2026! |
| 226 | 精算小达人ty | 南科大飞跃手册 | yantu-import@demo.com | cliff_s09@163.com | YantuLa2026! |
| 227 | 量化瑞士通dy | 南科大飞跃手册 | yantu-import@demo.com | fjord_l03@163.com | YantuLa2026! |
| 228 | 生统跨洋人ld | 南科大飞跃手册 | yantu-import@demo.com | grain_x07@163.com | YantuLa2026! |
| 229 | 港中深会计yr | 南科大飞跃手册 | yantu-import@demo.com | holly_n09@163.com | YantuLa2026! |
| 230 | 清华经管冲刺jp | 南科大飞跃手册 | yantu-import@demo.com | ivory_p03@163.com | YantuLa2026! |
| 231 | 汇丰游泳健将yq | 南科大飞跃手册 | yantu-import@demo.com | knoll_w05@163.com | YantuLa2026! |
| 232 | 哥大交流攻略zh | 南科大飞跃手册 | yantu-import@demo.com | ledge_b03@163.com | YantuLa2026! |
| 233 | 芝大风险管理ys | 南科大飞跃手册 | yantu-import@demo.com | mirth_c07@163.com | YantuLa2026! |
| 234 | ML理论探索者ya | 南科大飞跃手册 | yantu-import@demo.com | north_d09@163.com | YantuLa2026! |
| 235 | 清华出国两手yc | 南科大飞跃手册 | yantu-import@demo.com | ocean_f03@163.com | YantuLa2026! |
| 236 | HEC自由灵魂yy | 南科大飞跃手册 | yantu-import@demo.com | prism_g08@163.com | YantuLa2026! |
| 237 | 材料探险家aq | 南科大飞跃手册 | yantu-import@demo.com | quark_h05@163.com | YantuLa2026! |
| 238 | 北大工学boy | 南科大飞跃手册 | yantu-import@demo.com | ridge_j03@163.com | YantuLa2026! |
| 239 | 联培小火锅 | 南科大飞跃手册 | yantu-import@demo.com | stone_l07@163.com | YantuLa2026! |
| 240 | 夏令营达人dy | 南科大飞跃手册 | yantu-import@demo.com | thyme_m09@163.com | YantuLa2026! |
| 241 | 波士顿力学girl | 南科大飞跃手册 | yantu-import@demo.com | vivid_p08@163.com | YantuLa2026! |
| 242 | NUS生医人gx | 南科大飞跃手册 | yantu-import@demo.com | wheat_r05@163.com | YantuLa2026! |
| 243 | 逆袭博士wq | 南科大飞跃手册 | yantu-import@demo.com | yeast_t07@163.com | YantuLa2026! |
| 244 | 深研院材料哥 | 南科大飞跃手册 | yantu-import@demo.com | zebra_u09@163.com | YantuLa2026! |
| 245 | 圣地亚哥暑校zj | 南科大飞跃手册 | yantu-import@demo.com | atlas_w03@163.com | YantuLa2026! |
| 246 | 摸鱼反杀lh | 南科大飞跃手册 | yantu-import@demo.com | bliss_y08@163.com | YantuLa2026! |
| 247 | 弓箭手转科研 | 南科大飞跃手册 | yantu-import@demo.com | crest_z05@163.com | YantuLa2026! |
| 248 | 匹大生医girl | 南科大飞跃手册 | yantu-import@demo.com | ergot_b09@163.com | YantuLa2026! |
| 249 | 考研独行侠xs | 南科大飞跃手册 | yantu-import@demo.com | flora_c07@163.com | YantuLa2026! |
| 250 | UIUC材料星gy | 南科大飞跃手册 | yantu-import@demo.com | gulch_d09@163.com | YantuLa2026! |
| 251 | 北欧探路者lz | 南科大飞跃手册 | yantu-import@demo.com | haven_f03@163.com | YantuLa2026! |
| 252 | 全能申请手sr | 南科大飞跃手册 | yantu-import@demo.com | inlet_g08@163.com | YantuLa2026! |
| 253 | NUS平凡人yz | 南科大飞跃手册 | yantu-import@demo.com | joust_h05@163.com | YantuLa2026! |
| 254 | 杜克逆袭侠cx | 南科大飞跃手册 | yantu-import@demo.com | knack_j03@163.com | YantuLa2026! |
| 255 | ETH暑研达人sc | 南科大飞跃手册 | yantu-import@demo.com | lilac_l07@163.com | YantuLa2026! |
| 256 | 耶鲁生医wh | 南科大飞跃手册 | yantu-import@demo.com | mocha_m09@163.com | YantuLa2026! |
| 257 | 港新生技yh | 南科大飞跃手册 | yantu-import@demo.com | nutmeg_p8@163.com | YantuLa2026! |
| 258 | 哥大交流生ym | 南科大飞跃手册 | yantu-import@demo.com | oxide_r03@163.com | YantuLa2026! |
| 259 | 哈佛访学者ez | 南科大飞跃手册 | yantu-import@demo.com | pouch_s07@163.com | YantuLa2026! |
| 260 | 康奈尔计算侠 | 南科大飞跃手册 | yantu-import@demo.com | quest_t09@163.com | YantuLa2026! |
| 261 | PPT材料郎k | 南科大飞跃手册 | yantu-import@demo.com | rivet_u03@163.com | YantuLa2026! |

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
