# 项目部署指南

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                       Docker Compose                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐ │
│  │  Frontend   │   │   Backend   │   │       MySQL         │ │
│  │  Next.js    │──►│   Go/Gin    │──►│  agent_marketplace   │ │
│  │  :3000      │   │   :8080     │   │       :3306         │ │
│  └─────────────┘   └─────────────┘   └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 方式一：Docker Compose 一键部署（推荐）

### 前置条件

- 已安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)
- 服务器端口 3000、8080、3306 未被占用

### 步骤

1. **克隆项目并进入目录**

```bash
git clone <your-repo-url> regr
cd regr
```

2. **创建环境变量文件**

生产环境请复制生产模板并修改：

```bash
cp .env.production.example .env
```

详见 [docs/PRODUCTION_ENV.md](docs/PRODUCTION_ENV.md)。开发环境可参考 `.env.example`。

3. **启动服务**

```bash
docker compose up -d --build
```

4. **初始化种子数据**（可选，创建 buyer@demo.com、seller@demo.com 和示例人生 Agent）

本地需已安装 Go，且 MySQL 端口已映射到本地 3306：

```bash
# 替换密码为你在 .env 中设置的 MYSQL_ROOT_PASSWORD
export DATABASE_URL="root:your_secure_password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"
cd backend && go run ./scripts/seed.go
```

默认演示账号：`buyer@demo.com` / `seller@demo.com`，密码：`password123`。

5. **访问应用**

- 前端: http://localhost:3000
- 后端 API: http://localhost:8080/api

### 常用命令

```bash
# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止
docker compose down

# 停止并删除数据卷
docker compose down -v
```

---

## 方式二：云平台部署

### Vercel（前端）+ Railway/Render（后端 + MySQL）

#### 1. 部署 Go 后端到 Railway

1. 在 [Railway](https://railway.app) 创建新项目
2. 添加 MySQL 服务，记录连接信息
3. 添加 Go 服务，连接 GitHub 仓库，设置根目录为 `backend`
4. 配置环境变量：
   - `DATABASE_URL`: Railway MySQL 提供的 `MYSQL_URL` 格式需转换为 `user:pass@tcp(host:port)/db?charset=utf8mb4&parseTime=True`
   - `SESSION_SECRET`: 随机生成
   - `PORT`: Railway 会自动注入

#### 2. 部署 Next.js 到 Vercel

1. 在 [Vercel](https://vercel.com) 导入 GitHub 仓库
2. 构建配置：
   - Framework: Next.js
   - Root Directory: `.`（项目根目录）
3. 环境变量：
   - `API_BACKEND_URL`: 你的 Railway 后端 URL（如 `https://xxx.railway.app`）
   - `NEXTAUTH_URL`: Vercel 部署后的域名（如 `https://xxx.vercel.app`）

---

## 方式三：阿里云 ECS 部署

### 1. 准备工作

- 已购买阿里云 ECS（推荐 Ubuntu 22.04 或 CentOS 7+）
- 安全组放行：**22**（SSH）、**80**（HTTP）、**443**（HTTPS）、**3000**（如直连前端）

### 2. 登录服务器并安装 Docker

```bash
ssh root@你的公网IP
```

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker
```

### 3. 上传项目

```bash
# 本地执行（将项目打包上传）
scp -r ./regr root@你的公网IP:/root/
```

或用 Git 在服务器上克隆：

```bash
cd /root
git clone <你的仓库地址> regr
cd regr
```

### 4. 配置并启动

```bash
# 创建 .env（按需修改）
cp .env.production.example .env
nano .env   # 设置 MYSQL_ROOT_PASSWORD、SESSION_SECRET、NEXTAUTH_URL 等

# 启动
docker compose up -d --build
```

### 5. 配置 Nginx 反向代理（推荐）

安装 Nginx 并配置域名：

```bash
apt install nginx -y   # Ubuntu
# 或 yum install nginx -y  # CentOS

# 创建站点配置
nano /etc/nginx/conf.d/regr.conf
```

内容示例：

```nginx
server {
    listen 80;
    server_name 你的域名.com;
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

```bash
nginx -t && systemctl reload nginx
```

### 6. 配置 HTTPS（推荐）

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d 你的域名.com
```

### 7. 阿里云控制台检查

- **安全组**：确认 80、443 已放行
- **公网 IP**：绑定到 ECS 实例
- **域名**：在阿里云 DNS 添加 A 记录指向服务器 IP

---

## 方式四：自建服务器（Ubuntu/CentOS 通用）

### 1. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 注销后重新登录
```

### 2. 使用 Docker Compose

与「方式一」相同，在服务器上执行 `docker compose up -d --build`。

### 3. 配置 Nginx 反向代理（可选）

如需使用域名和 HTTPS：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

使用 [Certbot](https://certbot.eff.org/) 为 `your-domain.com` 配置 SSL。

---

## 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MYSQL_ROOT_PASSWORD` | MySQL root 密码 | `your_root_password` |
| `DATABASE_URL` | Go 后端数据库连接串 | 由 `MYSQL_ROOT_PASSWORD` 与 `mysql` 服务名组成 |
| `SESSION_SECRET` | 会话签名密钥 | `change-me-in-production` |
| `SESSION_COOKIE` | Cookie 名称 | `agent_fiverr_session` |
| `API_BACKEND_URL` | 前端代理的后端地址（Docker 内为 `http://backend:8080`） | - |
| `NEXTAUTH_URL` | 站点公网 URL | `http://localhost:3000` |
| `OPENAI_API_KEY` | 人生 Agent LLM（可选） | 空 |
| `OPENAI_MODEL` | LLM 模型 | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | 兼容 OpenAI 的 API 地址（如 Groq、Ollama） | 空 |

---

## 故障排查

### 前端无法连接后端

- 检查 `API_BACKEND_URL` 是否正确
- Docker 部署时，前端容器内应使用 `http://backend:8080`（服务名）

### 数据库连接失败

- 确认 MySQL 容器已就绪：`docker compose ps`
- 检查 `DATABASE_URL` 中的主机名在 Docker 网络内是否为 `mysql`

### 构建失败

- Next.js：确保 `output: "standalone"` 已在 `next.config.js` 中
- Go：在项目根目录执行 `cd backend && go build .` 验证可编译
