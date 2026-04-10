# 启动数据库

本项目本地开发使用 MySQL。任选一种方式：

## 方式 1：Docker（推荐）

启动 Docker Desktop 后运行：

```
docker run -d --name agent_marketplace_mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=agent_marketplace mysql:8
```

## 方式 2：本机 MySQL

若已安装 MySQL，请确保：
- 服务已启动
- 已创建数据库 `agent_marketplace`
- 用户名 `root`，密码 `password`（或修改 `.env` 中的 `DATABASE_URL` / `DATABASE_PRISMA_URL`）

创建数据库示例：

```sql
CREATE DATABASE agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
