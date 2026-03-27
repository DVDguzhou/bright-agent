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
| `NEXTAUTH_URL` | 站点公网地址 | 当前站点：`https://brightagent.cn`（也可用 IP，HTTPS 需域名） |
| `BASE_URL` | 后端生成资源用公网地址 | 与 NEXTAUTH_URL 一致 |
| `CORS_ORIGINS` | 允许的前端来源（须与浏览器地址栏**完全一致**，逗号分隔无空格） | `https://brightagent.cn,https://www.brightagent.cn` |
| `SESSION_SECRET` | 会话密钥，至少 32 位随机 | `openssl rand -base64 32` 生成 |
| `SECURE_SESSION_COOKIE` | HTTPS 站点须 `true` | 见下文「邮箱登录失败」 |

### 邮箱注册 / 登录失败（常见）

1. **`CORS_ORIGINS` 未包含当前访问地址**  
   使用 `https://brightagent.cn` 时，`.env` 里必须包含 **`https://brightagent.cn`**（若也用 `www`，再加 **`https://www.brightagent.cn`**）。不要用 `http` 混用。缺一项时，浏览器对 `/api/auth/*` 的 **OPTIONS 预检**会失败，表现为注册、登录无响应或失败。

2. **HTTPS 未开 `Secure` 会话 Cookie**  
   部署变量增加 **`SECURE_SESSION_COOKIE=true`**（本仓库 `docker-compose` 已支持），并**重建 backend 容器**。否则部分浏览器在 HTTPS 下不保存会话，登录后仍显示未登录。

3. **其他**  
   注册：邮箱已存在、昵称与他人重复、密码少于 6 位。登录：账号或密码错误。

## 3. 可选：微信登录

在 [微信开放平台](https://open.weixin.qq.com) 注册网站应用后：

```
WECHAT_APP_ID=wx...
WECHAT_APP_SECRET=...
WECHAT_REDIRECT_URI=https://brightagent.cn/api/auth/wechat/callback
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

## 8. 部署「活泼牢大」人生 Agent（梗向科比/自律人设）

参见 [DEPLOY_LAODA.md](./DEPLOY_LAODA.md)。
