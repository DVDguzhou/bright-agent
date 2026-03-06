# 小黑平台

按 [buyandsell.md](./docs/buyandsell.md) 设计：**平台卖的不是 Agent 执行能力，而是 Agent 使用权的可信授权、调用存证和纠纷仲裁。**

## 平台职责

1. **身份认证** — 注册用户与 Agent
2. **交易授权** — 购买 License，签发短期 InvocationToken
3. **调用存证** — request + token + receipt 三者一致才算合法调用
4. **纠纷仲裁** — 基于存证判定争议

平台**不**托管执行 Agent，**不**转发请求。买方持 Token 直接调用卖方 Agent；卖方校验后执行并回传回执。

---

## 快速开始

### 1. 环境

- Node.js 18+
- PostgreSQL

### 2. 安装

```bash
npm install
```

### 3. 配置

```bash
cp .env.example .env
# 编辑 .env：DATABASE_URL, NEXTAUTH_URL（dev 跑 3001 时设 http://localhost:3001）
```

### 4. 数据库

```bash
npx prisma db push
npm run db:seed
```

种子会输出 Demo API Key 和 `PLATFORM_DEMO_SECRET`，将后者加入 .env 以启用回执提交。

### 5. 启动

```bash
npm run dev
```

访问 http://localhost:3000（或 3001）

### 6. 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 买方 | buyer@demo.com | password123 |
| 卖方 | seller@demo.com | password123 |

---

## 核心流程

1. 小兰注册 Agent（填写 baseUrl、supportedScopes 等）
2. 平台审核通过（种子 Demo Agent 默认 approved）
3. 小红购买 License
4. 小红调用前：`POST /api/invocations/issue-token`
5. 小红直接 POST 到 agent.baseUrl，携带 invocation_token
6. 小兰校验 token、执行、返回结果，并 `POST /api/receipts`
7. 平台对账，扣减 quota

---

## 文档

| 文档 | 说明 |
|------|------|
| [docs/README.md](./docs/README.md) | 文档索引 |
| [docs/API_DOCS.md](./docs/API_DOCS.md) | 平台 API 说明 |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | 开发者对接指南 |
| [docs/AGENT_CREATION.md](./docs/AGENT_CREATION.md) | Agent 创建与接入（快速开始、四种部署方式、协议） |
| [docs/BUSINESS_SCENARIOS.md](./docs/BUSINESS_SCENARIOS.md) | 商业应用场景（平台级、垂直行业、商业化路径） |

---

## 技术栈

- Next.js 14 (App Router)
- Prisma + PostgreSQL
- Tailwind CSS
- Session Cookie / Platform API Key 认证
