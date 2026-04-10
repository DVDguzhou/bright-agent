# 手把手测试指南 — buyandsell.md 流程

## 一、流程总览

```
小兰注册 Agent → 平台审核上架
        ↓
小红购买 License（获得调用许可）
        ↓
小红调用前：向平台申请 InvocationToken
        ↓
小红直接 POST 到小兰的 Agent baseUrl（携带 token）
        ↓
小兰校验 token → 执行 → 返回结果给小红
        ↓
小兰向平台提交 ExecutionReceipt（平台对账、扣减 quota）
```

**平台职责**：身份认证、交易授权、调用存证、纠纷仲裁。**平台不执行 Agent**。

---

## 二、环境准备

### 2.1 确认数据库与 Prisma

```powershell
cd c:\Users\Caiqing\Desktop\regr

# 若之前有 EPERM，先关闭所有 Node/终端，再执行：
npx prisma generate

# 推送 schema（若未做过）
npx prisma db push
```

### 2.2 执行种子数据

```powershell
npm run db:seed
```

**输出示例：**
```
Seed completed. Demo users: buyer@demo.com, seller@demo.com (password: password123)
Demo API Key (add to .env): PLATFORM_API_KEY=sk_live_xxxxxxxx...
Add to .env for receipt submission: PLATFORM_DEMO_SECRET=xxxxxxxx...
Demo Agent ID: 00000000-0000-0000-0000-000000000001
Demo License ID: 00000000-0000-0000-0000-000000000001
```

**重要**：把 `PLATFORM_DEMO_SECRET` 抄到 `.env` 里（若没有的话）。种子每次运行会生成新的 secret，用最近一次的输出即可。

### 2.3 确认 .env 配置

`.env` 至少包含：
```
DATABASE_URL="root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
DATABASE_PRISMA_URL="mysql://root:password@localhost:3306/agent_marketplace"
NEXTAUTH_URL=http://localhost:3000
DEMO_AGENT_BASE_URL=http://localhost:3000/api/demo-agent/invoke
PLATFORM_DEMO_SECRET=xxx   # 种子输出的那个
```

### 2.4 启动开发服务器

```powershell
npm run dev:all
```

默认会同时启动：

- 前端：`http://localhost:3000`
- Go 后端：`http://localhost:8080`

---

## 三、方式一：网页测试（理解流程）

### 3.1 登录买方账号

1. 打开 http://localhost:3000
2. 点击「登录」
3. 邮箱：`buyer@demo.com`，密码：`password123`

### 3.2 查看已有的 License

1. 点击导航栏「我的 License」
2. 应能看到种子创建的 Demo License（100 次额度、30 天有效）

### 3.3 浏览 Agents

1. 点击「Agents」
2. 应能看到「Demo 自动 Agent」
3. 点击进入详情，可看到「购买 License」— 种子已买好，可略过

### 3.4 创建平台 API Key（用于脚本调用）

1. 点击「控制台」
2. 点击「平台 API Key」
3. 点击「创建」，**立即复制**生成的 `sk_live_xxx`（只显示一次）

若种子已创建 Demo Key，可复用种子输出的 Key，或新建一个。

---

## 四、方式二：脚本测试（完整调用链）

### 4.1 打开新的 PowerShell 窗口

保持 dev 服务器在另一窗口运行。

### 4.2 设置环境变量

```powershell
cd c:\Users\Caiqing\Desktop\regr

# 平台地址（默认前端地址）
$env:PLATFORM_URL="http://localhost:3000"

# 你的 API Key（控制台创建，或种子输出的 Demo Key）
$env:PLATFORM_API_KEY="sk_live_你的key"

# 可选：默认用种子 Demo 的 License 和 Agent
# $env:LICENSE_ID="00000000-0000-0000-0000-000000000001"
# $env:AGENT_ID="00000000-0000-0000-0000-000000000001"
```

### 4.3 运行调用脚本

```powershell
node scripts/platform/local-invoke-example.mjs
```

### 4.4 预期输出

```
Step 1: 向平台申请 InvocationToken...
  request_id: req_xxx
  agent_base_url: http://localhost:3000/api/demo-agent/invoke

Step 2: 直接调用小兰 Agent...

Step 3: 执行结果
  status: success
  report: # Demo Agent 执行报告...
```

若出现 `status: success` 且无 `warning`，说明流程已跑通。

---

## 五、流程说明（每一步在做什么）

### Step 1：申请 InvocationToken

脚本向 `POST /api/invocations/issue-token` 发送：
- `licenseId`：你的 License ID
- `agentId`：要调用的 Agent ID
- `scope`：如 `content.generate`
- `inputHash`：本次请求输入的 SHA256（防篡改）

平台会：
1. 校验 API Key → 确认你是买方
2. 校验 License 有效、未过期、quota 未用完
3. 签发短期 Token（约 15 分钟有效）
4. 登记 InvocationRequest
5. 返回 `request_id`、`invocation_token`、`agent_base_url`

### Step 2：直接调用小兰 Agent

脚本向 `agent_base_url` 发送 POST（即 Demo Agent 的 `/api/demo-agent/invoke`）：
- `request_id`
- `license_id`、`agent_id`
- `input`、`input_hash`
- `invocation_token`

Demo Agent 会：
1. 调用平台 `GET /api/invocation-tokens/verify?token=xxx` 校验 token
2. 执行模拟任务，生成报告
3. 通过 `POST /api/demo-agent/submit-receipt` 向平台提交回执（用 `PLATFORM_DEMO_SECRET` 鉴权）
4. 把结果返回给你

### Step 3：平台对账

平台收到回执后：
1. 核对 request_id、license_id、agent_id、input_hash
2. 标记 token 已使用（防重放）
3. 扣减 License 的 quota
4. 记录 ExecutionReceipt

只有「request + token + receipt」三者一致，才算合法调用。

---

## 六、常见问题

### 1. `INTERNAL_ERROR` 或 500

- 先确认 dev 服务器已启动
- 执行 `npx prisma generate` 确保 Prisma Client 是最新
- 检查 `.env` 中的 `PLATFORM_DEMO_SECRET` 是否与最近一次 seed 输出一致

### 2. `UNAUTHORIZED`

- 确认 `PLATFORM_API_KEY` 正确且未过期
- 若用种子 Demo Key，需确保 seed 已成功创建该 Key

### 3. `license_not_found` / `quota_exhausted`

- 使用种子 License：`00000000-0000-0000-0000-000000000001`
- 或登录 buyer@demo.com 在网页上购买新 License

### 4. 出现 `warning: Receipt submission failed`

- `.env` 中缺少或错误配置 `PLATFORM_DEMO_SECRET`
- 从最近一次 `npm run db:seed` 的输出中复制 `PLATFORM_DEMO_SECRET` 到 `.env`

### 5. 前端或后端没启动

- 确认 `npm run dev:all` 正在运行
- 若只单独启动前端，记得另开窗口运行 `npm run dev:api`

---

## 七、Agent 协作工作流

**竞品调研流水线**：Web Analyzer × N → Report Builder

- **Web Analyzer**：分析多个 URL，提取标题、描述、结构等
- **Report Builder**：将分析结果合成为选品/竞品综合报告

### 命令行

```powershell
$env:PLATFORM_URL="http://localhost:3000"
$env:PLATFORM_API_KEY="sk_live_xxx"
node scripts/workflows/workflow-competitor-research.mjs https://example.com https://github.com
```

### 网页

1. 登录 buyer@demo.com
2. 导航 → 工作流
3. 输入 URL 列表，点击「开始调研」

---

## 八、检查点清单

- [ ] `npx prisma generate` 成功
- [ ] `npm run db:seed` 成功
- [ ] `.env` 中有 `PLATFORM_DEMO_SECRET`
- [ ] `npm run dev:all` 在跑
- [ ] 能登录 buyer@demo.com
- [ ] 控制台能创建/查看 API Key
- [ ] `PLATFORM_URL=http://localhost:3000`
- [ ] `node scripts/platform/local-invoke-example.mjs` 返回 `status: success`
