---
target: Agent 详情页
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-06-07T14-55-14Z
slug: src-app-life-agents-id-page-tsx
---
# Critique: Agent 详情页 (src/app/life-agents/[id]/page.tsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 价格 + 剩余次数已在底栏可见；加载骨架 + 404 齐全 |
| 2 | Match System / Real World | 3 | 中文自然；元信息标签已改纯文字（学校/学历/职业） |
| 3 | User Control and Freedom | 3 | 边缘滑回、收藏、登录跳转保留目的地 redirect |
| 4 | Consistency and Standards | 3 | 基本回归编辑风；头图区与底栏残留 3 处 backdrop-blur |
| 5 | Error Prevention | 3 | 价格在点击前已透明展示（旧版 P0 已修） |
| 6 | Recognition Rather Than Recall | 3 | 信息密度高且价格可见 |
| 7 | Flexibility and Efficiency | 3 | 滑动返回、收藏、直达聊天 |
| 8 | Aesthetic and Minimalist Design | 3 | divide-y 编辑节奏干净，h1 serif 有力；但各 section 标题字级全平 |
| 9 | Error Recovery | 3 | 404 用 serif 文案 + 返回入口；owner 音色提醒 |
| 10 | Help and Documentation | 2 | 有示例问题；仍无"付费咨询怎么运作"的说明 |
| **Total** | | **29/40** | **Good（22 → 29，结构问题已基本解决）** |

## Anti-Patterns Verdict

**会不会一眼像 AI 做的？** 不会。这页相比上次（2026-06-01，22 分）已被大幅重做，旧的结构性问题基本清零。

**LLM 评估：** 旧版的 P0/P1 几乎全部修好——价格已进底部 CTA 栏、CTA 按三种用户态给出不同文案、头图 `alt` 已填、八个 section 的玻璃卡片已换成干净的 `divide-y` 分隔、头图圆角收到 `rounded-sm`、emoji 元信息标签改成纯文字。现在它读起来确实像"翻一份人物档案"，符合品牌。

**确定性扫描：** CLI detector 返回 0 命中（干净）。

**浏览器可视化：** 失败——预览环境后端未启（代理 :8080 ECONNREFUSED），详情页拿不到数据，无法注入 overlay。如实报告，无 [Human] overlay。

## Overall Impression

一次成功的重构样板：从 22 升到 ~29。剩下的都是打磨级问题，没有 P0/P1。最大的单点机会是高临门一脚的**信任沟通**——付费咨询的运作方式仍未在页面解释，第一次来的用户在按下"开始咨询"前会犹豫。

## What's Working

1. **价格透明化做对了** —— 底栏区分"剩余 N 次"与"¥X / 次提问"，把旧版最严重的 P0（价格藏在聊天流里）彻底解决。
2. **CTA 三态文案** —— 登录后开始咨询 / 继续聊天（剩余 N 次）/ 开始咨询，且登录跳转用 `redirect` 保留了目的地，回流顺滑。
3. **编辑风落地** —— `divide-y divide-hairline` 的分隔节奏 + serif h1 + serif italic 副标题，干净、克制、有档案感。

## Priority Issues

### [P2] 头图区与底栏残留玻璃拟态（设计系统禁用项）
- **位置**：collect 按钮 page.tsx:246 `bg-ink/40 backdrop-blur-sm`；认证徽章 page.tsx:265 `bg-paper/90 backdrop-blur-sm`；底部 CTA 栏 page.tsx:462 `bg-paper/95 backdrop-blur-md`
- **Why it matters**：DESIGN.md 把玻璃拟态列为默认禁用。图上图标的半透明尚可辩护（保证照片上图标可读），但底部 CTA 栏的模糊是最显眼的一处，没有必要。
- **Fix**：底栏改实心 `bg-paper`（已有 border-t）；图上图标若要保留对比，用实心 `bg-ink/70` 之类的不透明色而非 blur。
- **Suggested command**：/impeccable polish

### [P2] 缺少"付费咨询如何运作"的说明，临门信任有缺口
- **位置**：底部 CTA 区域，价格旁
- **Why it matters**：第一次来的用户（Jordan）不知道一"次"提问能得到什么、能否追问、是否可退。高决策成本时刻缺解释会拉低转化。
- **Fix**：在价格行旁加一句极简说明，如"每次提问可连续追问到满意 · 满意后再继续"，或一个轻量"怎么咨询"展开。
- **Suggested command**：/impeccable clarify

### [P3] 各 section 标题字级完全一致，层级偏平
- **位置**：所有 `<h2 className="text-sm font-semibold text-ink">`（适合人群 / 话题 / 动态 / 你可以问 / 欢迎语 / 评价）
- **Why it matters**：靠分隔线区分已经能用，但 6 个同字级标题让长页缺少扫读锚点。
- **Fix**：给 section 标题一个统一的、略小的 label 风格（如 ink-400 + 字距），或细微字级差，让标题与正文拉开而彼此一致。
- **Suggested command**：/impeccable typeset

## Persona Red Flags

**Jordan（第一次来）**：能看到价格是好事，但看不到"一次提问 = 什么"。按钮写"开始咨询"，点下去会发生什么、扣不扣费、能不能反悔，页面没说。

**Sam（无障碍）**：收藏按钮有 aria-label ✅；认证徽章、评分星组件需确认有文本替代（RatingStars 未在本页核对）。头图 scrim 渐变纯装饰、`pointer-events-none`，无障碍无影响。

**Casey（移动）**：底部固定 CTA 在拇指区 ✅，价格也在附近 ✅，体验良好；唯一是底栏 backdrop-blur 在低端机滚动时是额外合成负担。

## Minor Observations

- 头图 scrim `bg-gradient-to-b from-black/10 ... to-black/15`（page.tsx:239）是为图标可读性服务的功能性叠层，可保留；但若图标改实心底色，这层 scrim 也可一并去掉。
- 评价区 `font-serif text-4xl` 的平均分是个不错的视觉锚点，与编辑风一致。
- "最近动态"的 category 映射表内联在 JSX 里（page.tsx:392），可读性一般，可抽常量；非视觉问题。

## Questions to Consider

- 这页已经把"价格"讲清楚了，下一步要不要把"价值"也讲清楚——一次咨询到底交付什么？
- 6 个同字级 section 标题，是有意的极简，还是可以给一个统一 label 风格来增加扫读锚点？
- 底栏是否真的需要 blur？纯纸面 + 一条发丝线是不是更符合"纸"的隐喻？
