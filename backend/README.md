# Go 后端

前后端分离架构下的 Go API 服务，使用 MySQL 作为数据库。

## 环境要求

- Go 1.22+
- MySQL 8.0+

## 配置

创建 `.env` 或在环境变量中设置：

```
DATABASE_URL=root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True
SESSION_SECRET=your-secret-key
SESSION_COOKIE=agent_fiverr_session
PORT=8080
```

## 数据库

首次运行会自动执行 GORM 迁移创建表。请先创建数据库：

```sql
CREATE DATABASE agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 运行

```bash
cd backend
go mod tidy
go run .
```

默认监听 `:8080`。

## 启动顺序（前后端分离）

1. 启动 MySQL
2. 创建数据库 `agent_marketplace`
3. 启动 Go 后端：`cd backend && go run .`
4. 启动前端：`npm run dev`（会代理 /api 到后端）

## API 与前端

前端通过 Next.js `rewrites` 将 `/api/*` 代理到 `http://localhost:8080/api/*`。  
如需修改后端地址，设置环境变量 `API_BACKEND_URL`。
