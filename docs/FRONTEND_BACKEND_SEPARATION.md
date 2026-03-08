# 前后端分离架构说明

项目已支持前后端分离：前端继续使用 Next.js，后端使用 Go + MySQL。

## 架构

```
┌─────────────────┐         ┌─────────────────┐
│  Next.js 前端   │  proxy   │   Go 后端       │
│  (端口 3000)    │ ──────► │   (端口 8080)   │
│  静态/SSR       │  /api/* │   REST API      │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │    MySQL         │
                            │  agent_marketplace│
                            └─────────────────┘
```

## 启动步骤

### 1. 准备 MySQL

```sql
CREATE DATABASE agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 启动 Go 后端

```bash
cd backend
# 可选：设置 DATABASE_URL、SESSION_SECRET 等
go mod tidy
go run .
```

后端默认监听 `http://localhost:8080`。

### 3. 初始化数据（可选）

```bash
cd backend
# 设置 DATABASE_URL 后执行
go run ./scripts/seed.go
```

会创建 `buyer@demo.com`、`seller@demo.com`（密码 `password123`）以及示例人生 Agent。

### 4. 启动前端

```bash
npm run dev
```

前端在 `http://localhost:3000`，`/api/*` 请求会自动代理到 Go 后端。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | MySQL 连接串 | `root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True` |
| `SESSION_SECRET` | 会话签名密钥 | `change-me-in-production` |
| `SESSION_COOKIE` | Cookie 名 | `agent_fiverr_session` |
| `PORT` | 后端端口 | `8080` |
| `API_BACKEND_URL` | 前端代理目标（Next.js 用） | `http://localhost:8080` |

## Go 后端已实现 API

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET/POST /api/agents`
- `GET /api/agents/:id`
- `GET/POST /api/licenses`
- `GET/POST /api/life-agents`
- `GET /api/life-agents/mine`
- `GET/PATCH /api/life-agents/:id`
- `GET /api/life-agents/:id/manage`
- `POST /api/life-agents/:id/purchase`
- `POST /api/life-agents/:id/chat`
- `GET/POST/DELETE /api/user-api-keys`
- `POST /api/invocations/issue-token`

## 暂未迁移到 Go 的 API

以下能力仍依赖 Next.js API 路由（若需调用，需在 Go 中实现或保留 Next.js 做代理）：

- `POST /api/demo-agent/invoke`
- `POST /api/demo-agent/submit-receipt`
- `POST /api/web-analyzer/invoke`
- `POST /api/report-builder/invoke`
- `POST /api/orchestrator/invoke`
- 视频流水线相关 invoke
- `POST /api/receipts`
- `POST /api/disputes`
- `GET /api/invocation-tokens/verify`
- `POST /api/invocations/swarm`
- Tunnel 相关

如需完整迁移，可在 Go 中实现上述接口。
