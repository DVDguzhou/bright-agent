# 启动数据库

本项目需要 PostgreSQL。任选一种方式：

## 方式 1：Docker（推荐）

启动 Docker Desktop 后运行：

```
docker run -d --name agent_fiverr_pg -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=agent_fiverr postgres:16
```

## 方式 2：本机 PostgreSQL

若已安装 PostgreSQL，请确保：
- 服务已启动
- 已创建数据库 `agent_fiverr`
- 用户名 `postgres`，密码 `password`（或修改 `.env` 中的 `DATABASE_URL`）
