---
target: app UI 为什么显得假(发现页为代表)
total_score: 25
p0_count: 2
p1_count: 1
timestamp: 2026-06-10T18-28-51Z
slug: src-app-life-agents-page-tsx
---
# Critique: 为什么 App UI 显得"假"(发现页为代表,覆盖详情页/聊天页)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 加载/刷新反馈齐全,但骨架屏与真实内容形态不一致 |
| 2 | Match System / Real World | 2 | 面向用户的报错出现"Go 后端 / 端口 8080 / 页面结构"等开发者术语 |
| 3 | User Control and Freedom | 3 | 下拉刷新、边缘返回、重试按钮都有 |
| 4 | Consistency and Standards | 1 | 同页混用两套视觉语言(平面杂志风 vs 旧玻璃拟物风);圆角体系 0/2/4px 与 20/22/24px 并存 |
| 5 | Error Prevention | 3 | 抽样所见尚可(评分确认弹窗等);未深查表单 |
| 6 | Recognition Rather Than Recall | 3 | 标签齐全,板块命名清晰 |
| 7 | Flexibility and Efficiency | 3 | 移动端主路径短,搜索/收藏齐全 |
| 8 | Aesthetic and Minimalist Design | 2 | 杂志卡片本身克制,但玻璃残留、心智分徽章、ping 动画引入噪音 |
| 9 | Error Recovery | 2 | "加载失败,请刷新页面重试"+整页 reload,且带开发术语 |
| 10 | Help and Documentation | 3 | OnboardingSheet、聊天页"怎么聊更好"面板 |
| **Total** | | **25/40** | **Acceptable** |

## "假"的四个来源(按权重排序)

### [P0] 内容层:平台许诺"真人",内容却暴露模板/生成痕迹
- 全站只有一张默认封面 `public/life-agent-cover-presets/default-cover.png`:冷蓝灰卡通白猫。没传自定义封面的 Agent 全部共用同一只卡通动物,在以"真人经验"为卖点的 feed 里成排出现 = 直接的样机感;且冷色与暖纸调色板冲突。
- 卡片上的示例问题是模板生成的(近期 commit 还在删"关于{school/major}有什么建议"类生成残次品);headline 需要 `cleanLifeAgentIntroText` 在渲染前洗掉括号注释和重复称呼——数据本身带模板味。
- 「心智 N」(MindScoreBadge) 是平台发明的指标,压在封面上当首要信任信号;设计原则本身写的是"具体事实即信任"(学校/职业/已答次数),却没在卡片上兑现。
- 冷启动空态外露:大量"暂无评分""0 场聊天"成排出现,像演示数据。
- 面向用户的报错文案:"请确认 Go 后端已启动(默认端口 8080)" (life-agents/page.tsx:834,877)、"正在准备页面结构与首屏内容"——真 App 永远不会这么说。

### [P0] 风格层:一次未完成的视觉迁移,同屏两套语言
- 发现页 grid 卡片是平面杂志风(无圆角/发丝线/serif);同一页的编辑精选 banner、已购卡片、收藏介绍条、页级骨架屏全是旧玻璃风(rounded-[20~24px]、渐变底、backdrop-blur、大软阴影)。
- 一次加载经历三种形态:页级骨架(圆角玻璃、正方形图)→ grid 骨架(平面、4:5)→ 真实卡片(平面、4:5)。骨架与内容对不上,每次进入都"换了一个 App"。
- globals.css 是给 `.glass-card` 等旧类换皮实现的迁移,scripted 残留(`chat-glass.ts` 名为 glass 实为纸面)说明迁移只做到一半。

### [P1] 排版层:杂志 serif 概念在目标设备上根本渲染不出来
- 安卓系统没有中文衬线字体(只有 Noto Sans CJK),不自托管字体的话,`font-serif` 在主要目标设备上整体降级为黑体——品牌排版蒸发;Windows 降级 SimSun,小字号发虚。
- 中文大量使用 `italic`(卡片 headline、空态、"继续阅读"哨兵):中文没有真斜体,浏览器合成倾斜,字形被机械拉斜,字面意义上的"假字"。
- 中文正文出现 10px/11px/12.5px:汉字在 12px 以下笔画糊成一团,廉价感直接来源。

### [P2] 质感层:网页壳的痕迹
- 触屏端到处是 hover 态(hover:opacity、hover:border)却几乎没有 :active 按压反馈。
- 首卡 animate-ping"点击开始"红点是营销 demo 的引导样式,不是产品样式。
- 横滑 pager 用 80ms/280ms 双重 setTimeout 补对齐,提示存在可感知的吸附抖动。
- 编辑精选 banner 的 10px 加宽字距 eyebrow + 渐变玻璃卡,是 AI 脚手架样式。
- 认证标识是裸文本"✓"字符(橄榄色 10px),像占位符。

## What's Working
- 发现页杂志卡片本身(LifeAgentDiscoverCard):4:5 构图、发丝线分隔、价格 tabular-nums,方向成立且执行干净。
- 详情页信息架构:具体事实(学校/学历/职业/收入/地区)+ 分割线节奏,符合"克制信任"原则。
- 检测器扫描基本干净(仅 LifeAgentsMapView.tsx:33 一处 img 占位告警),没有渐变文字/侧条纹等典型 AI 反模式。

## Persona Red Flags
- **Casey(分心的移动用户)**:骨架→内容三连跳 + pager 吸附抖动,每次进入都有视觉跳变;hover 依赖在触屏上无反馈,点按像没响应。
- **Jordan(新手)**:报错让 ta"确认 Go 后端已启动",直接流失;「心智 1,234」没有任何解释入口在卡片层。
- **Riley(找茬型)**:同一只卡通猫出现在 8 张"真人"卡片上;两套卡片样式相邻出现(发现 vs 已购),一眼判定"半成品/套壳"。

## Minor Observations
- LifeAgentsMapView.tsx:33 空 src img。
- 圆角 token 与实际使用脱节(token 最大 4px,代码里 22/24px 大量存在)。
- 默认封面 PNG 1MB,首屏成本高。

## Questions to Consider
- 如果禁止使用任何"平台发明的指标",卡片靠什么让人信?(答案应是事实行)
- 没有真实评分时,卡片的最后一行应该展示什么才不像演示数据?
- serif 概念如果在安卓上无法成立,品牌排版的替代承载是什么?(字重对比?引号体例?)
