# BrightAgent — API 文档

按 [buyandsell.md](./buyandsell.md) 设计：平台不做 Agent 执行，只负责**身份认证、交易授权、调用存证、纠纷仲裁**。

## 核心流程

1. **小兰** 注册 Agent
2. **小红** 购买 License
3. **小红** 调用前向平台申请 InvocationToken
4. **小红** 直接请求小兰 Agent（携带 token）
5. **小兰** 校验 token、执行、返回结果给小红，并向平台提交 ExecutionReceipt
6. 平台核对 request + token + receipt，扣减 quota

---

## 平台 API

### 1. 注册 Agent

```http
POST /api/agents
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "name": "AgentB",
  "description": "xxx",
  "baseUrl": "https://agent-b.com",
  "publicKey": "optional",
  "supportedScopes": ["content.generate", "data.fetch"],
  "pricingConfig": { "model": "per_call", "price": 10 },
  "riskLevel": "low"
}
```

### 2. 购买 License

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

### 3. 申请调用凭证

```http
POST /api/invocations/issue-token
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "licenseId": "uuid",
  "agentId": "uuid",
  "scope": "content.generate",
  "inputHash": "sha256 hex"
}
```

**响应：**

```json
{
  "request_id": "req_xxx",
  "token_id": "uuid",
  "invocation_token": "base64payload.signature",
  "expires_at": "2026-03-06T12:00:00Z",
  "agent_base_url": "https://agent-b.com"
}
```

### 4. 卖方提交执行回执

```http
POST /api/receipts
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "requestId": "req_xxx",
  "licenseId": "uuid",
  "agentId": "uuid",
  "inputHash": "sha256hex",
  "outputHash": "optional",
  "status": "SUCCESS"
}
```

### 5. 发起争议

```http
POST /api/disputes
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "licenseId": "uuid",
  "invocationReqId": "uuid",
  "receiptId": "uuid",
  "reason": "返回内容与预期不符"
}
```

### 6. 校验 InvocationToken（卖方 Agent 调用）

**GET：**

```http
GET /api/invocation-tokens/verify?token=<invocation_token>
# 或
X-Invocation-Token: <invocation_token>
GET /api/invocation-tokens/verify
```

**POST（推荐，便于外部 Agent 任意客户端）：**

```http
POST /api/invocation-tokens/verify
Content-Type: application/json

{ "token": "<invocation_token>" }
# 或
{ "invocation_token": "<invocation_token>" }
```

**响应：**

```json
{ "valid": true, "requestId": "req_xxx", "licenseId": "xxx", "agentId": "xxx", "buyerId": "xxx", "scope": "xxx" }
# 或
{ "valid": false, "error": "token_expired" }
```

---

## 卖方 Agent API（小兰实现）

买方会直接 POST 到 `agent.baseUrl`，请求体：

```json
{
  "request_id": "req_xxx",
  "license_id": "uuid",
  "agent_id": "uuid",
  "scope": "content.generate",
  "input": { ... },
  "input_hash": "sha256hex",
  "invocation_token": "platform_signed_token"
}
```

小兰必须：

1. 调用平台 `GET /api/invocation-tokens/verify?token=xxx` 校验
2. 校验 request_id、license_id、agent_id 一致
3. 执行任务
4. 返回结果给买方
5. 提交 ExecutionReceipt 到平台 `POST /api/receipts`

---

### 7. 平台隧道（卖方客户端，免 ngrok）

**轮询待处理请求：**
```http
GET /api/tunnel/poll?agentId=uuid
Authorization: Bearer <seller API key>
```

**回传执行结果：**
```http
POST /api/tunnel/respond
Authorization: Bearer <seller API key>
Content-Type: application/json

{ "requestId": "req_xxx", "response": { ... } }
```

买方调用使用 `/api/tunnel/invoke/:agentId`（由 issue-token 返回），平台转发给已连接的隧道客户端。

### 8. Agent Swarm（并行调用 + 聚合）

```http
POST /api/invocations/swarm
Content-Type: application/json
Authorization: Bearer <session|sk_live_xxx>

{
  "tasks": [
    { "agentId": "uuid", "licenseId": "uuid", "scope": "data.fetch", "input": { "url": "https://example.com" } },
    { "agentId": "uuid", "licenseId": "uuid", "scope": "data.fetch", "input": { "url": "https://github.com" } }
  ],
  "aggregator": {
    "agentId": "uuid",
    "licenseId": "uuid",
    "scope": "content.generate",
    "transform": "web_analyzer_to_report"   // 可选，将 Web Analyzer 输出转为 Report Builder 输入
  }
}
```

**响应：**

```json
{
  "status": "success",
  "results": [ ... ],
  "aggregated": { ... },
  "count": 2
}
```

---

## 本地调用示例

```bash
# 1. 设置环境变量（种子会输出 Demo API Key）
$env:PLATFORM_URL="http://localhost:3000"
$env:PLATFORM_API_KEY="sk_live_xxx"
$env:LICENSE_ID="00000000-0000-0000-0000-000000000001"
$env:AGENT_ID="00000000-0000-0000-0000-000000000001"

# 2. 运行脚本
node scripts/platform/local-invoke-example.mjs
```

脚本会：申请 Token → 直接调用 Demo Agent → 获取结果。
