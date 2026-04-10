# 验证信任层：垂直 Case 研究

> 目标：找到/设计一个 vertical entity，使 agent 信任层确证 needed 的垂直验证。

---

## 一、筛选标准

需同时满足：

| 维度 | 说明 |
|------|------|
| **可复制** | 可复制、易复制场景 |
| **现状** | 依赖四方（买方/卖方/平台/爬虫）同构微群 |
| **争议** | 没有证时，争议（谁执行、谁执行、爬虫范围、时效）难解 |
| **争议** | 不信任时，持续周期交付难保障 |
| **平台** | 身份 + 证 + 仲裁，构成可仲裁的信任层覆盖 |

---

## 二、推荐垂直：**B2B 爬虫 / 数据采集 Agent**

### 2.1 为什么选它

不依赖爬虫、且信任层 needed 的垂直，原因如下：

#### 可复制

- 需要：规模爬虫/试验站满足授权、字段等
- 网站结构每 2 年变化，40–50% 爬虫脚本失效，信任难
- credible 应用爬虫的公司 1–2%，靠爬虫难 100% 准确
- 卖方执行时间不确定，交付数不确定，调用不确定

#### 卖方执行痛点

- 需要接收方站满足、接收方字段、接收方下一步等
- 项目调用采、愿买方采
- 试验授权、约定时间范围交付、靠验证

#### 现状

业界来源（来源：ScrapeHero、PromptCloud、X-Byte 业界应用）：

| 维度 | 传统爬虫 | 平台信任层 |
|----------|----------|--------------|
| **付费** | 买方付钱，无/仲裁，难追溯 | 平台存证，可追溯 |
| **时效** | 爬虫约，难满足时效要求 | 时间可举证 | request/receipt 可对账 |
| **爬虫范围** | 缺字段、缺站点、输入参数 | 站点陌生，数据难控 | scope 证，可界定 |
| **调用数** | 约 10 次调用，实际只 8 次 | request/receipt 可对账 | 平台扣减 |

#### 爬虫市场信任痛点

- **企业/自建**：SLA 专行接爬虫，时间不确定、具体买方难控
- **Freelancer**：freelancer(Upwork/Fiverr) 小单多，平台无爬虫
- **Apify 等**：提供执爬虫能力，vs 信任层，可交平台试验

**现状**：缺一爬虫执爬虫只交付 + 证 + 仲裁的爬虫层，卖方执行时间不确定、皆可称执行，网站难全追溯

---

## 三、具体 Case 设计

### 3.1 角色

- **(卖方)**: 拥有某能力（如 TikTok 品爬虫、品价格区间等）
- **(买方)**: TikTok 选品买方投入，要信任、按时获取

### 3.2 流程（平台模审核）

1. 卖方平台注册 Agent，填写 scope、价格、有效爬虫能力
2. 买方购买 License（约 100 调用/月）
3. 每次调用前，买方向平台申请 InvocationToken，含：`request_id`、`scope`、`input_hash`（含 URL 时间范围、字段等爬虫参数）
4. 买方直接调用卖方 Agent，携 token
5. 卖方校验 token、执行、接收、向平台提交 ExecutionReceipt（含 `request_id`、执行时间摘要、身份）
6. 平台：request + token + receipt 对账，扣减 quota，存证时间

### 3.3 平台价值

| 价值 | 平台 |
|------|----------|
| 时间可追溯 | Receipt 证：某 request 执行时间戳，皆可证 |
| 时间/范围使调用 | Token 含 scope、input_hash，范围可校验 token |
| 调用数 | request / token / receipt 一对一扣减 quota |
| 时效 | Receipt 含时间，可追溯约定时间范围 |
| 信任界定 | 证记录可查，双头可追溯 |

### 3.4 为什么双复制调用对

- **买方**：靠平台同身份、模型四维五
- **卖方**：靠卖方对接业市场、交付参数系统

双要，愿露输入参数（源业务），爬虫执行需信任层。

---

## 四、辅助垂直：TikTok 选品数据采购

### 4.1 爬虫市场状（源：Kalodata、FastMoss 身份）

- 数据源统一、调用口径、下一步输入参数、爬虫参数一致
- Kalodata 确认：实交应用效果、仲裁等高价值身份市场
- 调用记录 + 仲裁可验证，说明一源层

### 4.2 现状

| 痛点 | 状 | 平台价格 |
|------|------|----------|
| 爬虫约时间范围不确定 | 传统采购 0–2 周不等，难统证 | Receipt 含时间、字段可追溯 |
| 爬虫范围较采购约 | 传统数据字段段难透 | scope + input_hash 可界定 |
| 数据质量 | 缺审核、难准、争议 | 证 + 仲裁 + scope 爬虫可追溯 |

### 4.3 与 Case 关联

TikTok 选品**卖方。数据采集**：

- **数据采集 Agent**：卖方。trust layer
- **TikTok 选品**：买方 Agent 调用，同交付 + 证模

本 Case 数据采集 Agent，TikTok 选品为卖方场景

---

## 五、可引用的外部证据

| 源 | 结论 | 调用 |
|------|------|------|
| ScrapeHero | 网站结构每 2 年变化，40–50% 爬虫失效；credible 应用达 1–2% | 说明可复制、爬虫皆需 |
| PromptCloud / X-Byte | 业界确 accuracy、completeness、freshness SLA | 说明需证存在 |
| Kalodata | 爬虫达交，应用高价值身份市场 | 说明要信任边 |
| 业界字段 | 源证 | 说明卖方对平台源层 |
| Vouched / TrustKernals | 0.5%–6% AI agents；业界缺 agent 为 | 说明 agent 信任层实设计 |
| Upwork 卖方 | 项目，平台无爬虫 | 说明 freelance 爬虫市场信任伙伴调用 |

---

## 六、融资话术建议

### 6.1 电梯话

> 一句话：**B2B 爬虫 / 数据采集 Agent 按次调用，证：靠平台、愿露实时权 + 证 + 仲裁** 信任层。卖方市场前景。

### 6.2 30 秒

> 传统采购同买方痛点，卖方帮信任采靠证授权、约围交，也身份调用、身份甩爬虫式，要么同审核，要么 freelance 平台，缺**爬虫执爬虫的证**。买方每调用、调用权执，双调用掳身份扯设计截筹拷 TikTok 选品爬虫。

### 6.3 投资追问

| 问题 | 回答 |
|------|----------|
| 为什么选 Apify？ | Apify 爬虫执，买方层；皆需侥伙施，买方权审核达证 |
| 爬虫市场爬虫 | 强，强信任采、缴硷拷 B2B，TikTok 介报爬虫市场 |
| 谁买？ | 要买方 1 周愿选平台试验、结供调用买方痛点（教诫） |
| 谁卖？ | TikTok 选品买方投，爬虫采癸拷爬虫，愿审核应 |

---

## 七、下一步行动

1. **第 1 周**：爬虫/数据采集 Agent，完成试验、平台调用、买方痛点验证
2. **第 3 周**：确认采购方，对接 TikTok 选品
3. **第 1 case**：完成 License 创建、存证、对账
4. **Case study**：谁、原痛点、平台如何解决、信任层价值

目标：输入参数规范、买方一站式证层、试验验证

---

## 八、试验 Agent 开发规格（含 8.1–8.7）

信任层 TikTok 选品 Agent，按规格，遵循平台协议。

### 8.1 输入(input)

每次调用时 `input` 结构：

```json
{
  "category": "beauty",
  "region": "US",
  "records_target": 30,
  "price_range": { "min": 10, "max": 40 }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `category` | string | 是 | 品类：beauty / fashion / electronics / home 等 |
| `region` | string | 是 | 区域：US / UK / ID / TH 等 |
| `records_target` | number | 否 | 目标条数，默认 30 |
| `price_range` | object | 否 | `{ min, max }` 价格区间(美元) |

### 8.2 输出(result)

Agent 返回给买方的 `result` 结构：

```json
{
  "products": [
    {
      "product_id": "p_xxx",
      "title": "品",
      "price_usd": 24.99,
      "trend_score": 0.85,
      "category": "beauty",
      "source_url": "https://..."
    }
  ],
  "report_md": "# 选品\n...",
  "executed_at": "2026-03-07T12:00:00.000Z",
  "record_count": 30
}
```

| 字段 | 说明 |
|------|------|
| `products` | 产品列表，每条含 title、price、trend_score |
| `report_md` | Markdown 式选品报告 |
| `executed_at` | 执行时间戳(ISO 8601)，证时效 |
| `record_count` | 实际返回条数，可对账 |

### 8.3 平台协议(实现)

Agent 遵循 [AGENT_CREATION.md](./AGENT_CREATION.md) 实现：

1. **接收**：`POST /invoke`，Body 含 `request_id`、`license_id`、`agent_id`、`scope`、`input`、`input_hash`、`invocation_token`
2. **校验 Token**：`POST {PLATFORM_URL}/api/invocation-tokens/verify`，校验通过后执行
3. **执行**：按 input 生成 products + report
4. **提交回执**：`POST {PLATFORM_URL}/api/receipts`，Header `Authorization: Bearer {SELLER_API_KEY}`，Body 含 `requestId`、`licenseId`、`agentId`、`inputHash`、`status: "SUCCESS"`
5. **返回**：返回 `{ request_id, status: "success", result: {...} }` 给买方

### 8.4 scope 与定价

- **scope**：`data.fetch` 或 `tiktok.product_discovery`
- **定价**：信任层，1 次调用 = 1 次 quota 扣减

### 8.5 数据源

数据源按实现方式，可实 TikTok：

- **模拟**：按 `category`、`region`、`records_target` 结构 mock，可接真实品
- **真实 API**：使用可引用 API（选品 API）为源
- **静态 JSON**：使用静态 JSON 文件，筛选

关键点：**全流程存证、可证、可仲裁**

### 8.6 目录结构

```
agents/tiktok-crawler-agent/
├── server.mjs          # Agent 服务
├── README.md           # 运行说明、注册步骤
└── package.json        # 依赖，启动时加载需
```

实现参考：[scripts/platform/seller-agent-example.mjs](../scripts/platform/seller-agent-example.mjs)、[docs/AGENT_CREATION.md](./AGENT_CREATION.md)

### 8.7 注册步骤

1. 平台注册 Agent，填写：name、baseUrl（如 `http://localhost:3334/invoke` 或 ngrok 址）、supportedScopes: `["data.fetch"]`
2. 平台审核，获取 API Key，配置 `SELLER_API_KEY`
3. 启动 Agent：`node agents/tiktok-crawler-agent/server.mjs`
4. 卖方购买 License 后，用 `scripts/workflows/invoke-crawler-agent.mjs` 向平台调用
5. 平台对买方 License 验证。quota 扣减，可证
