# 阿里云 DNS 方式申请 Let's Encrypt 证书（一步步）

适用于域名未备案、HTTP 验证失败时的替代方案。全程约 15～20 分钟。

---

## 第一步：在阿里云创建 RAM 用户

1. 登录 [阿里云控制台](https://ram.console.aliyun.com/)
2. 左侧菜单选择 **身份管理** → **用户**
3. 点击 **创建用户**
4. 填写：
   - 登录名称：如 `certbot-dns`
   - 显示名称：如 `Certbot DNS`
   - **取消勾选**「控制台访问」
   - **勾选**「OpenAPI 调用访问」
5. 点击 **确定**

---

## 第二步：为 RAM 用户授权 DNS 权限

1. 创建成功后，在用户列表中点击刚创建的用户（如 `certbot-dns`）
2. 点击 **权限管理** 标签页
3. 点击 **添加权限**
4. 选择 **系统策略**，搜索 `AliyunDNSFullAccess`
5. 勾选 **AliyunDNSFullAccess**（云解析 DNS 管理权限）
6. 点击 **确定**

---

## 第三步：创建 AccessKey

1. 仍在用户详情页，点击 **认证管理** 标签页
2. 在 **AccessKey** 区域点击 **创建 AccessKey**
3. 弹窗提示风险，勾选「我知道……」后 **确定**
4. **重要**：立刻复制并妥善保存：
   - **AccessKey ID**（类似 `LTAI5t...`）
   - **AccessKey Secret**（类似 `xxxxxxxxxxxxxxxx`）
5. Secret 只显示一次，关闭后无法再查看

---

## 第四步：确认域名在阿里云云解析

1. 登录 [云解析 DNS 控制台](https://dns.console.aliyun.com/)
2. 在「域名解析列表」中查找 `brightagent.cn`
3. 若没有，需要先在阿里云添加域名并设置解析

> 若域名在其他平台（如 Cloudflare），需使用对应的 Certbot 插件，不能用本方案。

---

## 第五步：在服务器上安装 DNS 插件

SSH 登录服务器后执行：

```bash
# 确保有 pip（Ubuntu 22.04 一般自带）
apt update
apt install python3-pip -y

# 安装阿里云 DNS 插件
pip3 install certbot-dns-aliyun-next
```

---

## 第六步：创建凭证配置文件

```bash
# 创建目录
mkdir -p /root/.secrets

# 编辑配置文件
nano /root/.secrets/certbot-aliyun.ini
```

在编辑器中填入（把下面的换成你第三步保存的内容）：

```ini
dns_aliyun_next_access_key_id = 你的AccessKeyId
dns_aliyun_next_access_key_secret = 你的AccessKeySecret
dns_aliyun_next_region_id = cn-hangzhou
```

保存：`Ctrl+O` 回车，退出：`Ctrl+X`

```bash
# 设置权限（防止他人读取）
chmod 600 /root/.secrets/certbot-aliyun.ini
```

---

## 第七步：申请证书

```bash
certbot certonly \
  --authenticator dns-aliyun-next \
  --dns-aliyun-next-credentials /root/.secrets/certbot-aliyun.ini \
  --dns-aliyun-next-propagation-seconds 60 \
  -d brightagent.cn \
  -d www.brightagent.cn
```

按提示输入邮箱，同意服务条款。等待约 1～2 分钟，成功会显示证书路径。

---

## 第八步：配置 Nginx 使用证书

证书默认在 `/etc/letsencrypt/live/brightagent.cn/`，需在 Nginx 中启用 HTTPS：

```bash
nano /etc/nginx/conf.d/regr.conf
```

修改为：

```nginx
server {
    listen 80;
    server_name brightagent.cn www.brightagent.cn;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        default_type "text/plain";
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name brightagent.cn www.brightagent.cn;

    ssl_certificate /etc/letsencrypt/live/brightagent.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brightagent.cn/privkey.pem;

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

保存后：

```bash
nginx -t
systemctl reload nginx
```

---

## 第九步：更新项目环境变量

```bash
nano /root/regr/.env
```

把 `NEXTAUTH_URL` 改为：

```
NEXTAUTH_URL=https://brightagent.cn
```

`CORS_ORIGINS` 加上：

```
https://brightagent.cn,https://www.brightagent.cn
```

保存后重启前端：

```bash
cd /root/regr
docker compose restart frontend
```

---

## 第十步：设置证书自动续期

Let's Encrypt 证书 90 天过期，可配置定时续期：

```bash
# 测试续期（不实际续期）
certbot renew --dry-run

# 添加定时任务
crontab -e
```

在打开的编辑器中添加一行（每天凌晨 3 点检查并续期）：

```
0 3 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

保存退出。

---

## 完成

访问 https://brightagent.cn 应可正常使用 HTTPS。

---

## 常见问题

**Q: 提示 "No module named 'certbot_dns_aliyun_next'"**
- 确认用 `pip3 install certbot-dns-aliyun-next` 安装成功
- 若系统 certbot 是 apt 安装的，可尝试：`pip3 install --user certbot-dns-aliyun-next` 或改用 `certbot` 的完整路径

**Q: 提示权限不足**
- 检查 RAM 用户是否已授权 AliyunDNSFullAccess
- 检查 AccessKey 是否正确、未禁用

**Q: 域名不在阿里云**
- 若在 Cloudflare：用 `certbot-dns-cloudflare` 插件
- 若在腾讯云：用 `certbot-dns-tencentcloud` 插件
