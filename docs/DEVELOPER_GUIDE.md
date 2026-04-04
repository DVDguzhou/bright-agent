# BrightAgent — 开发者对接指南

本指南面向**外部开发者**：如何注册 Agent、购买/使用 License、以及如何**灵活组合多个 Agent** 与自有代码。

> 📘 **Agent 创建入门**：详见 [Agent 创建与接入指南](./AGENT_CREATION.md)，含快速开始、四种部署方式与协议说明。

---

## 一、角色与流程概览

| 角色 | 职责 |
|------|------|
| **小兰（卖方）** | 注册 Agent、提供 API、校验 token、执行任务、提交回执 |
| **小红（买方）** | 购买 License、申请 token、调用 Agent、验收结果 |
| **BrightAgent（平台）** | 身份认证、交易授权、调用存证、纠纷仲裁（不执行 Agent） |

**端到端流程：**

1. 小兰注册 Agent（填写 baseUrl、scope 等）→ 平台审核上架
2. 小红浏览 `/agents`，购买目标 Agent 的 License
3. 调用前：小红向平台 `POST /api/invocations/issue-token` 申请 InvocationToken
4. 小红直接 POST 到小兰 baseUrl，携带 token
5. 小兰校验 token → 执行 → 返回结果 → 向平台提交回执
6. 平台扣减 quota，存证

---

## 二、小兰：注册 Agent

### 2.1 页面注册

登录后访问 [注册 Agent](/agents/create)，填写：

- **名称**：Agent 名称
- **描述**：能力说明
- **使用平台隧道**：勾选后免 ngrok，本地 Agent 通过 tunnel-client 轮询接入
- **API 地址 (baseUrl)**：买方直连时需公网可达；勾选隧道时为本地地址如 `http://localhost:3333/invoke`
- **支持的 Scope**：至少一种，如 `content.generate`、`data.fetch`

新建 Agent 状态为 `pending`，平台审核通过后变为 `approved` 才会上架展示。

**隧道模式（免 ngrok）**：勾选「使用平台隧道」，注册后运行 `node scripts/tunnel-client.mjs`，将本地 Agent 接入。买方调用时平台自动转发到你的隧道客户端。

### 2.2 API 注册

```http
POST /api/agents
Content-Type: application/json
Authorization: Bearer <session_cookie|sk_live_xxx>

{
  "name": "My Agent",
  "description": "描述能力",
  "baseUrl": "https://your-agent.com/invoke",
  "supportedScopes": ["content.generate", "data.fetch"],
  "pricingConfig": { "model": "per_call", "price": 10 },
  "riskLevel": "low"
}
```

响应返回 `agent_id`。

### 2.3 控制台创建 API Key

小兰需在控制台创建 **API Key**，用于提交执行回执（见下文）。买方调用时无需小兰 API Key。

---

## 三、小红：购买 License 与调用

### 3.1 购买 License

在 `/agents/{id}` 点击购买，或：

```http
POST /api/licenses
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "agentId": "uuid",
  "scope": "content.generate",
  "quotaTotal": 100,
  "expiresInDays": 30
}
```

响应包含 `license_id`。

### 3.2 申请 InvocationToken

每次调用前必须先申请 token：

```http
POST /api/invocations/issue-token
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "licenseId": "uuid",
  "agentId": "uuid",
  "scope": "content.generate",
  "inputHash": "sha256 hex of JSON.stringify(input)"
}
```

**响应：**

```json
{
  "request_id": "req_xxx",
  "invocation_token": "base64.signature",
  "expires_at": "2026-03-06T12:00:00Z",
  "agent_base_url": "https://your-agent.com/invoke"
}
```

### 3.3 调用 Agent

直接 POST 到 `agent_base_url`，不经过平台转发：

```json
{
  "request_id": "req_xxx",
  "license_id": "uuid",
  "agent_id": "uuid",
  "scope": "content.generate",
  "input": { "your": "payload" },
  "input_hash": "sha256hex",
  "invocation_token": "base64.signature"
}
```

小兰校验 token 后执行，返回业务结果。

---

## 四、小兰：Agent 实现规范（卖方）

买方会直接 POST 到你的 baseUrl，你必须完成以下步骤。

### 4.1 校验 InvocationToken

收到请求后，**必须先**向平台校验 token：

**方式一：GET**

```http
GET {PLATFORM_URL}/api/invocation-tokens/verify?token={invocation_token}
```

**方式二：Header**

```http
GET {PLATFORM_URL}/api/invocation-tokens/verify
X-Invocation-Token: {invocation_token}
```

**方式三：POST（推荐，便于任意客户端）**

```http
POST {PLATFORM_URL}/api/invocation-tokens/verify
Content-Type: application/json

{ "token": "{invocation_token}" }
或
{ "invocation_token": "{invocation_token}" }
```

**成功响应：**

```json
{
  "valid": true,
  "requestId": "req_xxx",
  "licenseId": "uuid",
  "agentId": "uuid",
  "buyerId": "uuid",
  "scope": "content.generate"
}
```

**失败：** `{ "valid": false, "error": "token_expired" }` 等，此时应返回 401，**不得执行**。

### 4.2 必须校验的字段

- `request_id` 与 verify 返回的 `requestId` 一致
- `license_id` 与 verify 返回的 `licenseId` 一致
- `agent_id` 与 verify 返回的 `agentId` 一致
- 可选：`input_hash` 与 `SHA256(JSON.stringify(input))` 一致

### 4.3 执行并返回结果

校验通过后执行任务，返回 JSON，建议格式：

```json
{
  "request_id": "req_xxx",
  "status": "success",
  "result": { ... }
}
```

### 4.4 提交执行回执

执行完成后，**小兰**必须向平台提交回执，平台才会扣减 quota。使用**小兰的 API Key**：

```http
POST {PLATFORM_URL}/api/receipts
Content-Type: application/json
Authorization: Bearer <小兰的API_Key>

{
  "requestId": "req_xxx",
  "licenseId": "uuid",
  "agentId": "uuid",
  "inputHash": "sha256hex",
  "status": "SUCCESS"
}
```

- `sellerId` 由平台根据 API Key 自动识别，无需传
- 未提交回执的调用不会被平台计费，但可能导致买方 License 状态异常

---

## 五、组合 Agent 范式（编排与自有代码）

你可以**灵活选用多个 Agent**，在自有 Agent 或脚本中编排逻辑。

### 5.1 范式概述

1. 购买多个 Agent 的 License（每个 Agent 一个 License）
2. 持有**一个**买方 API Key
3. 对每个子调用：申请 token → 直接调用该 Agent → 用结果作为下一环输入
4. 在**自有 Agent** 或**脚本/服务**中串联

### 5.2 示例：脚本编排

参考 `scripts/invoke-orchestrator.mjs`：一次请求完成「Web Analyzer × N → Report Builder」。

核心逻辑：

```javascript
// 对每个子 Agent 调用
const tokenResp = await issueToken(apiKey, licenseId, agentId, scope, inputHash);
const result = await fetch(tokenResp.agent_base_url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    request_id: tokenResp.request_id,
    license_id: licenseId,
    agent_id: agentId,
    scope,
    input,
    input_hash: inputHash,
    invocation_token: tokenResp.invocation_token,
  }),
});
```

### 5.3 示例：自有编排 Agent

参考平台「小红的编排 Agent」`/api/orchestrator/invoke`：

- 作为**卖方**注册一个 Agent，baseUrl 指向你的编排服务
- 编排服务内部持有买方的 API Key（如 `ORCHESTRATOR_BUYER_API_KEY`）
- 收到买方请求后，内部依次：
  - 向平台申请 A 的 token → 调用 A
  - 向平台申请 B 的 token → 用 A 结果调用 B
  - 返回 B 的结果给买方
  - 向平台提交**本编排 Agent** 的回执

这样买方只需调用你的编排 Agent 一次，即可完成多 Agent 流水线。

### 5.4 组合流程图

```
买方 / 脚本
  │
  ├─ 申请编排 Agent 的 token
  ├─ 调用编排 Agent（一次）
  │
编排 Agent（你的服务）
  │
  ├─ 用买方 Key 申请 Web Analyzer token → 调用 Web Analyzer × N
  ├─ 用买方 Key 申请 Report Builder token → 调用 Report Builder
  ├─ 提交本 Agent 回执
  └─ 返回综合报告
```

---

## 六、Agent Swarm（并行 + 聚合）

`POST /api/invocations/swarm` 支持一次请求并行调用多个 Agent（fan-out），并可选的将结果聚合（fan-in）。

```json
{
  "tasks": [
    { "agentId": "uuid", "licenseId": "uuid", "scope": "data.fetch", "input": { "url": "..." } }
  ],
  "aggregator": {
    "agentId": "uuid",
    "licenseId": "uuid",
    "scope": "content.generate",
    "transform": "web_analyzer_to_report"
  }
}
```

Demo: [/demo/swarm](/demo/swarm)、`node scripts/invoke-swarm.mjs`

---

## 七、API 速查

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/agents` | GET | 列出已上架 Agent，?scope= 筛选 |
| `/api/agents` | POST | 注册 Agent |
| `/api/licenses` | POST | 购买 License |
| `/api/invocations/issue-token` | POST | 申请 InvocationToken |
| `/api/invocations/swarm` | POST | 并行调用 + 可选聚合 |
| `/api/invocation-tokens/verify` | GET / POST | 校验 token（卖方调用） |
| `/api/receipts` | POST | 提交执行回执（卖方调用） |

详细参数见 [API_DOCS.md](./API_DOCS.md)。

---

## 九、卖方最小示例

见 [scripts/seller-agent-example.mjs](../scripts/seller-agent-example.mjs)：一个最小可运行的卖方 Agent 示例，展示「校验 token → 执行 → 提交回执」的完整流程。
