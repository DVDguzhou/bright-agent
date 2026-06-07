---
target: 发现/探索页
total_score: 29
p0_count: 0
p1_count: 2
timestamp: 2026-06-07T15-00-24Z
slug: src-app-life-agents-page-tsx
---
# Critique: 发现/探索页 (src/app/life-agents/page.tsx)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | 骨架屏 + 下拉刷新 toast + 计数齐全 |
| 2 | Match System / Real World | 3 | 中文自然 |
| 3 | User Control and Freedom | 3 | 发现/收藏/已购 tab、搜索、刷新、手势 |
| 4 | Consistency and Standards | 2 | 同一种"Agent 卡片"存在两套视觉；紫色 hover glow；页面 chrome 玻璃化 |
| 5 | Error Prevention | 3 | 加载失败横幅 + 刷新入口 |
| 6 | Recognition Rather Than Recall | 3 | tab 标签、卡片示例问题、价格可见 |
| 7 | Flexibility and Efficiency | 3 | 搜索排序、窗口化无限滚动、滑动手势、收藏 |
| 8 | Aesthetic and Minimalist Design | 3 | 主信息流卡片漂亮；外围 chrome 玻璃+阴影偏噪 |
| 9 | Error Recovery | 3 | 错误横幅 + 空状态带 CTA |
| 10 | Help and Documentation | 3 | 收藏/已购说明 + 卡片示例问题 |
| **Total** | | **29/40** | **Good** |

## Anti-Patterns Verdict

**会不会一眼像 AI 做的？** 主信息流不会——但页面外围会。

**LLM 评估：** 核心矛盾是**一致性割裂**。主发现流用的 `LifeAgentDiscoverCard`（`components/LifeAgentDiscoverCardGrid.tsx`）是编辑风做对了的样板：方角图、发丝线分隔、serif 标题、serif italic 副标题、oxblood 价格、无玻璃无阴影。但同一个页面里，"已购"tab 的 `PurchasedAgentsWindowedGrid` 卡片却是 `rounded-[22px] bg-paper/[0.98] shadow-[...] backdrop-blur-sm` 的玻璃大圆角卡——**同一种对象，两套视觉语言，随 tab 切换品牌身份就翻脸**。再加上页面 chrome（搜索头、说明条、空状态、骨架屏、下拉 toast）整体玻璃化。

**确定性扫描：** CLI detector 对 page.tsx 返回 0 命中（任意值写法绕过了规则）；人工复审定位到 12 处玻璃/渐变/大圆角/阴影 + 1 处紫色 glow。

**浏览器可视化：** 失败——后端未启（:8080 ECONNREFUSED），发现页空白，无法注入 overlay。如实报告。

## Overall Impression

最好的部分已经很好：主信息流卡片就是这个产品该有的样子。问题全在它周围——外围 chrome 和"已购"卡变体停留在旧的玻璃范式，使得发现页在"发现"tab 和"已购"tab 之间观感不一致。把外围对齐到主卡片的编辑风，这页就能上到 33+。

## What's Working

1. **主发现卡片是签名组件的正确实现** —— 方角封面 + 发丝线 + serif 标题 + serif italic headline + oxblood 价格，完全符合 DESIGN.md 的 Agent Profile Card 规范。
2. **信息流性能用心** —— `useWindowedSlice` 分批挂载 + `contain-intrinsic-size` + 首屏 priority/lazy 分级，长列表不卡。
3. **状态与空态完整** —— 加载失败横幅带刷新、未登录/空已购都有带 CTA 的空状态、下拉刷新有可见反馈。

## Priority Issues

### [P1] 同一种 Agent 卡片存在两套视觉（一致性割裂）
- **位置**：主流 `components/LifeAgentDiscoverCardGrid.tsx`（编辑风、方角无玻璃）vs `page.tsx:893` 已购卡（`rounded-[22px] bg-paper/[0.98] shadow-[...] backdrop-blur-sm`，玻璃大圆角）
- **Why it matters**：用户在发现/收藏/已购之间切 tab 时，卡片观感整体翻脸，破坏品牌一致性（DESIGN.md 一致性是核心虚荣）。
- **Fix**：让已购卡复用 `LifeAgentDiscoverCard` 或对齐它的样式——方角、发丝线、无玻璃无阴影。
- **Suggested command**：/impeccable polish

### [P1] 已购卡的紫色 hover glow，脱离品牌
- **位置**：page.tsx:893 `group-hover:shadow-[0_10px_36px_-10px_rgba(168,139,235,0.14)]`（淡紫）
- **Why it matters**：系统的 hover glow 是 oxblood（`rgb(122 31 31)`，见 tailwind `glow-sm`）。淡紫是与酒红/纸面无关的颜色，和聊天页那处糖果渐变是同一类 slop。
- **Fix**：换成 `shadow-glow-sm`（已在 tailwind 定义的 oxblood glow），或直接去掉。
- **Suggested command**：/impeccable colorize

### [P2] 页面 chrome 整体玻璃化（禁用三件套：玻璃 + 大圆角 + 静止阴影）
- **位置**：搜索/加载头 page.tsx:167；收藏/已购说明条 :680 / :691；空状态 :733 / :741；骨架屏 :180 / :721；下拉刷新 toast :770
- **Why it matters**：`rounded-[20–24px]` + `backdrop-blur` + `shadow-[...]` + `bg-gradient` 全中 DESIGN.md 禁令，且与主卡片的扁平编辑风冲突。
- **Fix**：统一改成实心纸面 + 发丝线 + 锐利小圆角，阴影只在 hover 出现。
- **Suggested command**：/impeccable quieter

### [P2] 骨架屏形状与真实卡片不符
- **位置**：骨架卡 page.tsx:180 / :721 是 `rounded-[22px]` 玻璃盒；真实 `LifeAgentDiscoverCard` 是方角无边图 + 发丝线分隔文字
- **Why it matters**：骨架应预示最终形态。形状不符会在内容加载时产生明显"形变跳动"，也暴露了两套卡片的不一致。
- **Fix**：骨架对齐真实卡片：方角图块 + 顶部发丝线 + 文本占位，去掉玻璃与大圆角。
- **Suggested command**：/impeccable polish

## Persona Red Flags

**Casey（移动）**：信息流性能做得好，滚动顺；但满屏 `backdrop-blur` 卡片（已购 tab）+ 下拉 toast 的 blur 在低端安卓是额外合成负担。

**Riley（压测）**：空状态、未登录、加载失败都有处理，较稳；切 tab 看到两套卡片样式会立刻察觉不一致。

**Jordan（第一次）**：发现卡片信息充分（名字 + headline + 示例问题 + 价格），自助理解成本低，表现好。

## Minor Observations

- 主卡片标签 chip 仍有一处 `backdrop-blur-sm`（`LifeAgentDiscoverCardGrid.tsx:97` 的"点击开始"提示）和 MindScoreBadge 的 `shadow-sm`（:123）——属轻微残留，可顺手清。
- 下拉刷新 toast 用 `rounded-full + shadow-lg + backdrop-blur-md`：浮层 toast 的轻微抬升尚可辩护，但严格编辑风应改实心 + 发丝线。

## Questions to Consider

- "已购"卡为什么不直接复用主发现卡片组件？一套组件、一种身份，是不是更省心也更一致？
- 骨架屏的形状要不要就用真实卡片的"空壳"？预期一致能消掉加载时的形变。
- 那处淡紫 glow 是从哪来的？是否还有别的页面用了同一个紫色，值得全局搜一遍统一掉。
