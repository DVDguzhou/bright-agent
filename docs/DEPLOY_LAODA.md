# 在生产环境部署「活泼牢大」人生 Agent

仓库里的人生 Agent **「活泼牢大」** 是自律/篮球梗向的虚构人设（知识库与文案均为原创玩梗，不涉及真实人物）。部署后会在人生 Agent 列表出现，用户可付费聊天。

## 前提

- 服务器已能访问 MySQL（Docker Compose 起的库，或自建）。
- 项目根目录已有 `.env`，且 **`DATABASE_PRISMA_URL`** 与线上一致，例如：

```env
DATABASE_PRISMA_URL="mysql://root:你的MySQL密码@127.0.0.1:3306/agent_marketplace"
```

（若 MySQL 只跑在 Docker 内且映射了 `3306:3306`，在**宿主机**上执行脚本时用 `127.0.0.1:3306` 即可。）

## 一键写入数据

在**服务器**上进入项目目录：

```bash
cd ~/regr
git pull   # 可选，确保代码最新

# 若尚未安装依赖
npm install

npx prisma generate
npm run create:laoda
```

成功后会打印聊天页地址，Agent 固定 ID 为 `10000000-0000-0000-0000-000000000002`。

线上访问示例（域名按实际修改）：

```text
https://brightagent.cn/life-agents/10000000-0000-0000-0000-000000000002/chat
```

## 预充提问次数（脚本里已配置）

脚本会为买家 **`buyer@demo.com`** 预充 **50 次** 对该 Agent 的提问。`create:laoda` 与 **`db:seed`** 里买家密码均为演示用 **`password123`**（若你改过账号密码，以库中实际为准）。

牢大归属卖家默认 **`tmxiand@gmail.com`**（与 `create-laoda.ts` / `db:seed` 一致）。若要改成其它邮箱，可在执行 `create:laoda` 前设置环境变量 **`LAODA_OWNER_EMAIL`** / **`LAODA_OWNER_PASSWORD`**（仅新建该用户时写入密码）。

也可用 **`npm run db:seed`** 做完整种子（含「阿青学长」等演示数据），其中同样包含活泼牢大；若只要牢大、避免多余数据，优先 **`npm run create:laoda`**。

## 语音（牢大素材音色，非默认 Ethan）

种子 / `create:laoda` 默认是系统音色 **Ethan**。要改成 `voice_samples/laoda_reference/laoda_voice.mp3` 复刻音色：

**方式 A — 网页：** 使用 **该 Agent 的创建者（卖家）账号** 登录 → **控制台** → **我的人生 Agent** → 点「活泼牢大」→ 在编辑页 **录制/上传音色样本** → 保存（或仅上传音色）。

- **`npm run create:laoda` / `db:seed` 写入的牢大** 归属卖家 **`tmxiand@gmail.com`**（控制台上传音色请用该账号登录，演示密码常为 **`password123`**）。  
- 若你曾用 **`LAODA_OWNER_EMAIL`** 指向其它邮箱，或在线上手动把 Agent 转给别的用户，请用**实际卖家账号**登录；以库里 `life_agent_profiles.user_id` 为准。

**方式 B — 脚本（服务器，推荐）：** 与网页上传**不是两条路**：脚本用卖家账号登录后调用 `PATCH /api/life-agents/:id` 上传 `voiceSampleBase64`，**Go 后端再调百炼 DashScope** 写入 `voiceCloneId`，和你在控制台上传时后端逻辑一致。

**服务器上请先准备：**

1. **参考音频**  
   路径：`voice_samples/laoda_reference/laoda_voice.mp3`。  
   **可直接把该文件提交进仓库**，服务器 `git pull` 后即存在，无需再 `scp`。若未提交，再单独上传到同一路径亦可。

2. **后端环境变量（`docker-compose` / 宿主 `.env` 里给 backend 的那份）**  
   与 `.env.production.example` 一致即可，核心是：  
   - `TTS_PROVIDER=dashscope`  
   - `OPENAI_API_KEY`（通义 / DashScope 可用的 Key）  
   - `DASHSCOPE_VC_MODEL`、`DASHSCOPE_VOICE_ENROLL_URL`（百炼声音复刻端点）  
   改完后 **重建并重启 backend 容器**，否则 enroll 会失败或仍用旧配置。

3. **能访问到后端 HTTP**  
   `TEST_BASE_URL` 填公网 **`https://brightagent.cn`**（经网关到 8080）即可；若脚本只在**同一台机器**上跑且后端映射在宿主机，也可用 **`http://127.0.0.1:8080`**。

4. **Node 或 Docker**  
   宿主机没有 `npm` 时，见下文「用 Docker 跑 enroll 脚本」。

```bash
cd ~/regr
export TEST_BASE_URL="https://brightagent.cn"
export LAODA_OWNER_EMAIL="tmxiand@gmail.com"
export LAODA_OWNER_PASSWORD="你的卖家密码"
npm install   # 若尚未安装依赖
node scripts/enroll-laoda-voice.mjs
# 或：npm run enroll:laoda-voice
```

若线上已修改 `tmxiand@gmail.com` 的登录密码，请把 **`LAODA_OWNER_PASSWORD`** 改成当前密码。

成功后会写入 `voiceCloneId`；若未返回，检查后端 `TTS_PROVIDER`、通义 Key、`DASHSCOPE_VC_MODEL` 等（见 `.env.example`）。

## 用 Docker 跑脚本（无本机 Node 时）

若拉取 `node` 镜像失败，可换国内镜像前缀，例如：`docker.m.daocloud.io/library/node:20-bookworm`。

**不要用 `bookworm-slim` 直接跑 Prisma**（易缺 libssl），请改用 **`node:20-bookworm`**（非 slim），或在 slim 里先执行 `apt-get update && apt-get install -y openssl`。

`DATABASE_PRISMA_URL` 里必须是**真实 root 密码**，不要带「你的」等占位符。

```bash
cd ~/regr
docker run --rm -it \
  -v "$PWD:/app" -w /app \
  --network host \
  -e DATABASE_PRISMA_URL="mysql://root:你的真实密码@127.0.0.1:3306/agent_marketplace" \
  node:20-bookworm \
  bash -lc "npm install && npx prisma generate && npm run create:laoda"
```

仓库已在 `schema.prisma` 中配置 `binaryTargets` 含 `debian-openssl-3.0.x`，与 Debian 12 / OpenSSL 3 一致；若仍报错，请先 `git pull` 再执行上述命令。

**用 Docker 跑「牢大音色」脚本（不写库，只调 API）：** 需已存在 `voice_samples/laoda_reference/laoda_voice.mp3`，且容器能访问后端（公网域名或宿主机端口）。

```bash
cd ~/regr
docker run --rm -it \
  -v "$PWD:/app" -w /app \
  --network host \
  -e TEST_BASE_URL="http://127.0.0.1:8080" \
  -e LAODA_OWNER_EMAIL="tmxiand@gmail.com" \
  -e LAODA_OWNER_PASSWORD="你的卖家密码" \
  node:20-bookworm \
  bash -lc "npm install && node scripts/enroll-laoda-voice.mjs"
```

若后端只暴露在公网、未监听宿主机 8080，把 **`TEST_BASE_URL`** 改成 **`https://brightagent.cn`**，并去掉 `--network host`（容器走默认桥接访问外网即可）。

## 常见问题

**Q：`libssl.so.1.1` / `Prisma cannot find libssl`？**  
A：换用 `node:20-bookworm`（非 slim），或 `git pull` 后重新 `npx prisma generate`（已包含 `debian-openssl-3.0.x` 引擎）。

**Q：`Prisma` 连不上库？**  
A：确认 MySQL 已启动、`DATABASE_PRISMA_URL` 密码与 `docker-compose` 里 `MYSQL_ROOT_PASSWORD` 一致，且端口未被防火墙拦截。

**Q：列表里看不到？**  
A：该 Agent `published: true`，若仍不显示，检查前端是否请求了正确后端、以及是否走了缓存/多实例数据不一致。
