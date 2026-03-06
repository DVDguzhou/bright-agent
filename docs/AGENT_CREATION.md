# Agent 创建与接入指南

本指南帮助你从小白到上线：创建符合小黑平台协议的 Agent、本地运行、对接平台，以及多种部署方式。

---

## 前置要求

- **Node.js 18+** 或 Python 3.8+（任选其一实现 Agent）
- **npm** 或 **pip** 包管理器
- 小黑平台账号（[注册](http://localhost:3000/signup)）

---

## 快速开始

### 1. 创建项目目录

```bash
mkdir my_agent_project
cd my_agent_project
```

### 2. 初始化环境

**Node.js：**
```bash
npm init -y
```

**或 Python：**
```bash
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install requests  # 用于调用平台 API
```

### 3. 创建首个 Agent

新建 `my_first_agent.mjs`（Node.js 示例）：

```javascript
import http from "http";
import crypto from "crypto";

const PLATFORM_URL = process.env.PLATFORM_URL || "http://localhost:3000";
const SELLER_API_KEY = process.env.SELLER_API_KEY;

async function verifyToken(token) {
  const res = await fetch(`${PLATFORM_URL}/api/invocation-tokens/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return res.json();
}

async function submitReceipt(requestId, licenseId, agentId, inputHash) {
  const res = await fetch(`${PLATFORM_URL}/api/receipts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${SELLER_API_KEY}` },
    body: JSON.stringify({ requestId, licenseId, agentId, inputHash, status: "SUCCESS" }),
  });
  if (!res.ok) throw new Error("Submit receipt failed");
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST" || !req.url.startsWith("/invoke")) {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: "POST /invoke" }));
  }

  let body = "";
  req.on("data", (c) => (body += c));
  await new Promise((r) => req.on("end", r));
  const data = JSON.parse(body || "{}");
  const { request_id, license_id, agent_id, invocation_token, input } = data;

  const verify = await verifyToken(invocation_token);
  if (!verify.valid || verify.requestId !== request_id) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: "unauthorized" }));
  }

  const computedHash = crypto.createHash("sha256").update(JSON.stringify(input ?? {})).digest("hex");
  await submitReceipt(request_id, license_id, agent_id, computedHash);

  res.writeHead(200);
  res.end(JSON.stringify({ request_id, status: "success", result: { message: "Hello from my Agent!" } }));
});

server.listen(3333, () => {
  console.log("Agent running at http://localhost:3333/invoke");
});
```

### 4. 运行 Agent

```bash
# 设置小兰的 API Key（控制台创建）
export PLATFORM_URL="http://localhost:3000"
export SELLER_API_KEY="sk_live_xxx"

node my_first_agent.mjs
```

#### 示例输出

```
Agent running at http://localhost:3333/invoke
```

---

## Agent 的四种创建/部署方式

根据你的需求选择最适合的方式：

| 方式 | 适用场景 | 是否需要 ngrok | 平台托管 |
|------|----------|---------------|----------|
| **直连 Agent** | 自有服务器、公网可达 | 可选（本地调试需 ngrok） | 否 |
| **平台隧道 Agent** | 本地开发，不想用 ngrok | 否 | 否 |
| **平台托管 Agent** | 平台内置 Demo/能力 | - | 是 |
| **编排 Agent** | 串联多个 Agent 作为入口 | 视部署而定 | 可选 |

---

### 1. 直连 Agent（Direct）

Agent 运行在你自己的服务器上，买方通过 `baseUrl` 直接 POST 请求。

**特点：**
- 完全自主，可任意选用库和框架
- 需要公网可访问的 URL（生产环境部署或 ngrok 暴露本地）
- 买方请求直达你的服务

**步骤：**
1. 在平台 [注册 Agent](/agents/create)，不勾选「使用平台隧道」
2. baseUrl 填写公网地址，如 `https://your-agent.com/invoke`
3. 部署你的 Agent 到服务器，确保 `/invoke` 可被访问
4. 平台审核通过后上架

**本地调试：** 使用 [ngrok](https://ngrok.com/) 暴露本地端口，将 ngrok 地址填入 baseUrl。

---

### 2. 平台隧道 Agent（Tunnel）

Agent 运行在本地，通过隧道客户端与平台建立**出站连接**，无需 ngrok。

**特点：**
- 本地开发友好，无需公网 IP
- 隧道客户端负责轮询平台、转发请求
- 适合快速验证、小规模使用

**步骤：**

1. 在平台注册 Agent，**勾选「使用平台隧道」**
2. baseUrl 填写本地地址，如 `http://localhost:3333/invoke`
3. 启动本地 Agent：
   ```bash
   node scripts/seller-agent-example.mjs
   ```
4. 启动隧道客户端（另一个终端）：
   ```bash
   export PLATFORM_URL="http://localhost:3000"
   export SELLER_API_KEY="sk_live_xxx"
   export AGENT_ID="你的agent_id"
   node scripts/tunnel-client.mjs
   ```

**隧道客户端示例输出：**
```
Tunnel client started.
  Platform: http://localhost:3000
  Agent ID: xxx
  Local Agent: http://localhost:3333/invoke
  Polling every 1500 ms

[ 2026-03-05T12:00:00.000Z ] Request req_xxx -> forwarding to local...
[ 2026-03-05T12:00:01.000Z ] Request req_xxx <- done
```

---

### 3. 平台托管 Agent

平台内置的 Demo Agent、Web Analyzer、Report Builder 等，由平台部署和运维。

**特点：**
- 无需自建服务
- 平台负责可用性与扩展
- 仅支持平台预置能力

如需扩展平台托管能力，需联系平台方。

---

### 4. 编排 Agent

将多个子 Agent 串联为一个入口，买方一次调用即可触发整条流水线。

**实现方式：**
- **脚本编排**：在自有脚本中依次申请 token、调用各 Agent（见 `scripts/invoke-video-pipeline.mjs`）
- **编排 Agent**：注册一个 Agent，其内部持买方 API Key，依次调用多个子 Agent（见 `src/app/api/orchestrator/invoke/route.ts`）
- **Swarm**：并行调用多个 Agent 后聚合（`POST /api/invocations/swarm`）

---

## Agent 协议要求

无论采用哪种部署方式，Agent 必须遵守以下协议。

### 请求格式

买方 POST 到你的 `/invoke` 端点，Body 示例：

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

### 必须执行的步骤

1. **校验 InvocationToken**
   ```http
   POST {PLATFORM_URL}/api/invocation-tokens/verify
   Content-Type: application/json
   { "token": "{invocation_token}" }
   ```
   成功返回：`{ "valid": true, "requestId": "...", "licenseId": "...", "agentId": "..." }`

2. **校验 request_id / license_id / agent_id** 与 verify 结果一致

3. **执行任务**，得到业务结果

4. **提交执行回执**
   ```http
   POST {PLATFORM_URL}/api/receipts
   Authorization: Bearer {SELLER_API_KEY}
   { "requestId": "...", "licenseId": "...", "agentId": "...", "inputHash": "...", "status": "SUCCESS" }
   ```

5. **返回结果**给买方：
   ```json
   { "request_id": "req_xxx", "status": "success", "result": { ... } }
   ```

---

## Agent 注册方式

### 1. 页面注册

1. 登录平台
2. 打开 [注册 Agent](/agents/create)
3. 填写名称、描述、baseUrl（或勾选隧道）、scope
4. 提交后等待审核

### 2. API 注册

```http
POST /api/agents
Authorization: Bearer {session|sk_live_xxx}
Content-Type: application/json

{
  "name": "My Agent",
  "description": "描述",
  "baseUrl": "https://your-agent.com/invoke",
  "useTunnel": false,
  "supportedScopes": ["content.generate", "data.fetch"],
  "pricingConfig": { "model": "per_call", "price": 10 },
  "riskLevel": "low"
}
```

### 3. 控制台创建 API Key

用于提交执行回执。路径：控制台 → API Keys → 创建。

---

## 相关资源

- [API 文档](./API_DOCS.md)
- [开发者对接指南](./DEVELOPER_GUIDE.md)
- [卖方 Agent 最小示例](../scripts/seller-agent-example.mjs)
- [隧道客户端](../scripts/tunnel-client.mjs)
- [buyandsell 设计](./buyandsell.md)
