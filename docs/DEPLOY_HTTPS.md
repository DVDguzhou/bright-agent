# 一步一步：给网站配上 HTTPS（才能用麦克风录音色）

全程在 **SSH 登录后的 Linux 服务器**上操作（你现在是 `root@8.136.119.234` 这类）。本地电脑只做：**买域名、改 DNS、用浏览器测试**。

---

## 开始前你需要有什么

| 项目 | 说明 |
|------|------|
| 一台公网服务器 | 已有，例如 IP `8.136.119.234` |
| 一个域名 | 没有的话在阿里云/腾讯云等买一个，几元到几十元/年 |
| 站点已能跑 | Docker 已把前端映射到本机 **3000**（与仓库 `docker-compose.yml` 一致） |

**重要：** 免费证书（Let’s Encrypt）一般只给**域名**签发，**不能**给纯 IP 申请。所以必须走「域名 → 解析到你的 IP」这条路。

下面用占位符：**把全文里的 `你的域名.com` 换成你自己的域名**（例如 `app.example.com`）。

---

## 第 0 步：买域名并做 DNS 解析（在你买域名的网站控制台操作）

1. 登录域名注册商（阿里云「域名」、腾讯云 DNSPod 等）。
2. 找到 **DNS 解析** → **添加记录**：
   - **记录类型**：`A`
   - **主机记录**：`@`（表示根域名 `你的域名.com`）  
     - 若你希望 `www.你的域名.com` 也能访问，后面证书步骤会一起加；解析里也可再加一条 `www` 的 `A` 记录，同样指向服务器 IP。
   - **记录值**：填服务器公网 IP，例如 `8.136.119.234`
   - **TTL**：默认即可
3. 保存后等待生效，通常 **几分钟～几小时**。

**怎么确认解析好了（在你自己电脑上打开终端 / PowerShell）：**

```bash
ping 你的域名.com
```

若显示的 IP 是你的服务器 IP，说明解析 OK（有的服务器禁 ping，若 ping 不通再用浏览器测第 3 步）。

---

## 第 1 步：在云厂商放行 80、443 端口（必须）

否则证书申请和 HTTPS 访问都会失败。

**阿里云 ECS：**

1. 控制台 → **云服务器 ECS** → 点你的实例。
2. **安全组** → 配置规则 → **入方向** → 添加：
   - 端口 **80/80**，源 **0.0.0.0/0**（或按需收紧）
   - 端口 **443/443**，源 **0.0.0.0/0**
3. **22** 端口要保留，否则 SSH 会断。

**本机防火墙（若开了 ufw）：**

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

## 第 2 步：SSH 登录服务器，安装 Nginx 和 Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

**成功标志：** 无报错；`nginx -v` 和 `certbot --version` 能输出版本号。

---

## 第 3 步：写 Nginx 配置，让「域名:80」转发到你本机的 3000 端口

先确认 Docker 前端仍在跑、且映射了 `3000:3000`：

```bash
ss -tlnp | grep 3000
# 或
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/
```

若 `curl` 返回 `200` 或 `307` 等，说明本机 3000 可访问。

创建站点配置（**把文件名和里面的域名都换成你的**）：

```bash
sudo nano /etc/nginx/sites-available/你的域名.com.conf
```

粘贴下面内容（**两处 `你的域名.com` 改成真实域名**）：

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并重载：

```bash
sudo ln -sf /etc/nginx/sites-available/你的域名.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**成功标志：** `nginx -t` 显示 `syntax is ok` / `test is successful`。

**浏览器测试（用电脑打开）：**

- 访问：`http://你的域名.com`  
- 应能看到你的 Next 网站（和 `http://IP:3000` 类似，但通过域名访问）。

若打不开：检查第 0 步 DNS、第 1 步安全组、以及 Nginx 是否 `active`：`systemctl status nginx`。

---

## 第 4 步：用 Certbot 自动申请 HTTPS 证书

确保第 3 步已经能用 **HTTP** 打开域名，再执行：

```bash
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com
```

- 按提示填 **邮箱**（用于到期提醒）。
- 同意协议（输入 `Y`）。
- 若问是否把 HTTP 重定向到 HTTPS，建议选 **重定向**（2）。

**成功标志：** 最后有 `Congratulations` 之类提示；再访问 `https://你的域名.com` 地址栏有**锁**。

测试自动续期（应显示成功）：

```bash
sudo certbot renew --dry-run
```

---

## 第 5 步：改项目环境变量并重启容器

站点对外地址必须是 **https**，否则登录、Cookie、跨域容易出问题。

在服务器上进入项目目录（路径按你实际放置为准），编辑 `.env` 或部署时注入的环境变量：

| 变量 | 设成什么 |
|------|----------|
| `NEXTAUTH_URL` | `https://你的域名.com` |
| `CORS_ORIGINS` | `https://你的域名.com`（多个用英文逗号，不要有空格） |

然后重启（示例）：

```bash
cd /path/to/regr
docker compose down && docker compose up -d
```

**成功标志：** 用无痕窗口打开 `https://你的域名.com` 能登录、能进创建 Agent 页面。

---

## 第 6 步：验证麦克风（录音色）

1. 用 **Chrome 或 Edge** 打开：`https://你的域名.com` → 进入「采集音色」步骤。
2. 点录音时浏览器会要**麦克风权限**，点允许。
3. 不应再出现 `mediaDevices` / `getUserMedia` 为 `undefined` 的报错。

若仍报错：确认地址栏是 **https** 而不是 http；确认不是用 IP 访问。

---

## 常见问题

**Q：我没有域名，只有 IP？**  
A：要稳定支持浏览器麦克风，需要 **HTTPS + 域名**（或本机 localhost 开发）。建议买一个最便宜的域名按本文做。

**Q：Certbot 报 `Connection refused` 或验证失败？**  
A：多半是 **80 端口**没对公网开放，或 DNS 还没指到这台机器。回到第 0、1 步检查。

**Q：只想用 `www` 不用根域名？**  
A：可以把 `server_name` 和 `certbot -d` 只配 `www.你的域名.com`，并保证 DNS 里 `www` 的 A 记录指向服务器。

**Q：3000 端口想关对外，只给 Nginx 访问？**  
A：进阶：Docker 把 `3000` 只绑定 `127.0.0.1:3000:3000`，外网只访问 80/443。需改 `docker-compose` 的 `ports`，此处不展开。

---

## 最短检查清单

- [ ] 域名 A 记录 → 服务器 IP  
- [ ] 安全组放行 80、443  
- [ ] `http://域名` 能打开站  
- [ ] `certbot --nginx` 成功  
- [ ] `https://域名` 有小锁  
- [ ] `NEXTAUTH_URL` / `CORS_ORIGINS` 已改为 https 并已重启容器  
- [ ] 在 https 下试录音成功  

完成以上步骤后，麦克风与音色采集即可在正式环境使用。

---

## 附录：暂时不用域名时，用本机 localhost 开发

本机用 **`http://localhost:3000`**（或 Next 提示的端口，如 3001）访问时，浏览器视为安全上下文，**麦克风 / 录音色可以正常使用**，不必先配 HTTPS。

1. **MySQL** 在本机或 Docker 里跑起来，`.env` 里 `DATABASE_URL` / `DATABASE_PRISMA_URL` 指向该库。
2. **`NEXTAUTH_URL`** 与前端端口一致，例如：`http://localhost:3000`。
3. **Go 后端** 在本机 `8080` 跑起来（`backend` 目录执行 `go run .`，见 `backend/README.md`）；Next 会通过 `next.config.js` 把 `/api` 代理到 `http://localhost:8080`（见环境变量 `API_BACKEND_URL`）。
4. 项目根目录：`npx prisma db push`（按需）、`npm run dev`。
5. 浏览器打开 **`http://localhost:3000`**（不要用局域网 IP，否则可能仍不算「本机安全上下文」、录音行为因浏览器而异）。

公网服务器上的 IP 访问不能替代上述「本机 localhost」开发体验；上线给真实用户用时再按上文配域名 + HTTPS。

### 本机用 Docker Compose（你本地已装 Docker 时）

仓库根目录的 `docker-compose.yml` 会起 **MySQL + backend + frontend**，前端映射 **`3000:3000`**，与本机 **`http://localhost:3000`** 一致，麦克风仍可用。

1. 在项目根复制环境变量：`cp .env.example .env`，至少填写：
   - **`NEXTAUTH_URL=http://localhost:3000`**（与 compose 里默认一致）
   - **`MYSQL_ROOT_PASSWORD`**（与 compose 里 `MYSQL_ROOT_PASSWORD` 一致）
   - 人生 Agent / 语音若需要：`OPENAI_API_KEY`、百炼相关等（见 `.env.example`）
   - **`CORS_ORIGINS=http://localhost:3000`**（避免浏览器跨域被拦）
2. 本机若已有程序占用 **3306**，先停掉或改 `docker-compose.yml` 里 mysql 的 `ports`（例如 `"3307:3306"`），并把 Prisma 用的 `DATABASE_PRISMA_URL` 改成对应端口。
3. 先只启动 MySQL，等健康后再建表（**在你电脑上**项目根目录；若尚未安装依赖先执行 `npm install`）：
   ```bash
   docker compose up -d mysql
   # 等几秒到 mysql 健康后：
   npx prisma db push
   npm run db:seed
   ```
   `DATABASE_PRISMA_URL` 需指向 `localhost` 上暴露的 MySQL 端口（默认 `mysql://root:你的密码@localhost:3306/agent_marketplace`）。
4. 再启动全部服务并构建镜像：
   ```bash
   docker compose up -d --build
   ```
   （旧版 Docker 可能是 `docker-compose`。）
5. 浏览器访问 **`http://localhost:3000`**。

说明：前端镜像构建时会把 `API_BACKEND_URL=http://backend:8080` 写进 Next（容器内通过 Docker 网络访问 Go），**无需**你在本机单独起 `go run`。若改代码要频繁调试，可继续用「附录」里非 Docker 的 `npm run dev` + `go run .` 方式，二选一即可。
