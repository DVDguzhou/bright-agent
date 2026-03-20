# 生产环境配置指南

部署到生产前，请按以下步骤配置环境变量。

## 1. 创建 .env 文件

```bash
cp .env.production.example .env
```

编辑 `.env`，将占位符替换为实际值。

## 2. 必填项

| 变量 | 说明 | 示例 |
|------|------|------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | 强随机密码 |
| `NEXTAUTH_URL` | 站点公网地址 | `https://app.example.com` 或 `http://8.136.119.234:3000`（IP 可用，但 HTTPS 需域名） |
| `BASE_URL` | 后端生成资源用公网地址 | 与 NEXTAUTH_URL 一致 |
| `CORS_ORIGINS` | 允许的前端来源 | `https://app.example.com,https://www.example.com` |
| `SESSION_SECRET` | 会话密钥，至少 32 位随机 | `openssl rand -base64 32` 生成 |

## 3. 可选：微信登录

在 [微信开放平台](https://open.weixin.qq.com) 注册网站应用后：

```
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=...
WECHAT_REDIRECT_URI=https://你的域名.com/api/auth/wechat/callback
```

回调地址须与微信控制台配置一致。

## 4. 可选：手机号登录

配置阿里云短信后：

```
SMS_ACCESS_KEY_ID=...
SMS_ACCESS_KEY_SECRET=...
SMS_SIGN_NAME=已审核的签名
SMS_TEMPLATE_CODE=SMS_xxx
```

## 5. 启动

```bash
docker compose up -d --build
```

## 6. 初始化数据（首次部署）

```bash
export DATABASE_PRISMA_URL="mysql://root:你的密码@localhost:3306/agent_marketplace"
npx prisma db push
npm run db:seed
```

## 7. HTTPS

生产环境务必使用 HTTPS，参见 [DEPLOY_HTTPS.md](./DEPLOY_HTTPS.md)。
