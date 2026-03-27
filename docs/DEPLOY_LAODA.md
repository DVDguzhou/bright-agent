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

脚本会为买家 **`tmxiand@gmail.com`** 预充 **50 次** 对该 Agent 的提问（密码见 `scripts/create-laoda.ts` 内哈希对应密码，默认文档里写的是 `5425444`）。若你线上从未创建过该邮箱用户，脚本会通过 upsert 创建卖家/买家关系，请以脚本实际逻辑为准。

也可用 **`npm run db:seed`** 做完整种子（含「阿青学长」等演示数据），其中同样包含活泼牢大；若只要牢大、避免多余数据，优先 **`npm run create:laoda`**。

## 语音

默认使用百炼系统音色 **Ethan**（`voiceCloneId`）。若需自定义音色，请在卖家控制台对该 Agent 上传样本或走项目里的声音复刻脚本（见 `.env.example` 与 `docs` 中语音相关说明）。

## 常见问题

**Q：`Prisma` 连不上库？**  
A：确认 MySQL 已启动、`DATABASE_PRISMA_URL` 密码与 `docker-compose` 里 `MYSQL_ROOT_PASSWORD` 一致，且端口未被防火墙拦截。

**Q：列表里看不到？**  
A：该 Agent `published: true`，若仍不显示，检查前端是否请求了正确后端、以及是否走了缓存/多实例数据不一致。
