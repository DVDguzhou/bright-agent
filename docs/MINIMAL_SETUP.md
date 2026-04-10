# 最小本地启动指南

这份文档只覆盖「把项目在本机跑起来」所需的最小步骤。

## 适用范围

按本文配置后，你可以完成：

- 启动 Next.js 前端
- 启动 Go API 后端
- 初始化 Prisma / MySQL 数据
- 登录 Demo 账号
- 浏览、购买、聊天、跑基础测试脚本

以下能力默认都不是必需项：

- `OPENAI_*` / `DASHSCOPE_*`：不配时，聊天可退回模板回复
- `SMTP_*`：不配时，开发环境可看后端日志中的验证码或重置链接
- `SMS_*`：不配时，开发环境使用 mock 验证码
- `WECHAT_*`：不配时，仍可使用邮箱密码登录

## 环境要求

- Node.js 18+
- Go 1.22+
- MySQL 8.0+

## 1. 创建数据库

```sql
CREATE DATABASE agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. 复制环境变量

在项目根目录创建 `.env`：

```bash
cp .env.example .env
```

`.env` 至少保留这些值：

```env
DATABASE_URL="root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
DATABASE_PRISMA_URL="mysql://root:password@localhost:3306/agent_marketplace"
NEXTAUTH_URL="http://localhost:3000"
DEMO_AGENT_BASE_URL="http://localhost:3000/api/demo-agent/invoke"
PLATFORM_SIGNING_SECRET="change-in-production"
PLATFORM_DEMO_SECRET="run-seed-to-get-this"
```

## 3. 初始化 Prisma

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

`npm run db:seed` 完成后，把终端输出中的最新 `PLATFORM_DEMO_SECRET` 回填到 `.env`。

## 4. 启动前后端

推荐直接使用统一入口：

```bash
npm run dev:all
```

这条命令会同时启动：

- 前端：`http://localhost:3000`
- Go 后端：`http://localhost:8080`

如果只想单独启动某一端，也可以用：

```bash
npm run dev:web
npm run dev:api
```

## 5. Demo 账号

- 买方：`buyer@demo.com` / `password123`
- 卖方：`seller@demo.com` / `password123`

## 6. 基础自检

完成后至少确认：

- 可以打开 `http://localhost:3000`
- 可以登录 `buyer@demo.com`
- 可以在发现页看到 Demo Agent
- 可以运行 `node scripts/platform/local-invoke-example.mjs`

更完整的流程验证见 `docs/TEST_GUIDE.md`。
