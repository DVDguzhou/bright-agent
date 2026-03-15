# 小黑平台（Bright Agent Hub）— 测试文档

基于项目全部功能设计的测试用例与测试指南。

---

## 一、测试范围与文档索引

| 章节 | 内容 |
|------|------|
| [二、环境准备](#二环境准备) | 测试环境搭建与种子数据 |
| [三、认证与用户](#三认证与用户) | 登录、注册、会话、登出 |
| [四、人生 Agent（Life Agent）](#四人生-agentlife-agent) | 创建、发布、购买、对话、反馈、评分 |
| [五、调用与存证链路](#五调用与存证链路) | Token 签发、校验、回执、对账 |
| [六、平台 API Key 与隧道](#六平台-api-key-与隧道) | API Key、轮询、隧道 invoke |
| [七、非功能测试](#七非功能测试) | 性能、兼容、安全 |
| [八、测试检查清单](#八测试检查清单) | 上线前快速核对 |

---

## 二、环境准备

### 2.1 基础设施

| 依赖 | 版本/说明 |
|------|-----------|
| Node.js | 18+ |
| Go | 1.21+（后端） |
| MySQL | 8.0+ |
| npm | 9+ |

### 2.2 数据库与后端

```bash
# 创建数据库
CREATE DATABASE agent_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 后端
cd backend
go mod tidy
go run .

# 种子数据（可选）
go run ./scripts/seed.go
```

### 2.3 前端

```bash
npm install
npx prisma generate   # 若使用 Prisma
npm run db:seed       # 种子（若使用 Prisma 版）
npm run dev
```

### 2.4 环境变量

| 变量 | 用途 |
|------|------|
| `DATABASE_URL` | MySQL 连接 |
| `SESSION_SECRET` | 会话签名 |
| `API_BACKEND_URL` | 前端代理目标（默认 `http://localhost:8080`） |
| `OPENAI_API_KEY` | 人生 Agent 聊天（可选） |
| `PLATFORM_DEMO_SECRET` | Demo Agent 回执鉴权（种子输出） |

---

## 三、认证与用户

### 3.1 注册

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-AUTH-001 | 打开 `/signup`，填写合法邮箱、密码、确认密码 | 注册成功，跳转登录或首页 | P0 |
| TC-AUTH-002 | 重复邮箱注册 | 提示邮箱已存在 | P1 |
| TC-AUTH-003 | 空邮箱 / 空密码 / 格式错误 | 表单校验失败 | P1 |
| TC-AUTH-004 | 密码与确认不一致 | 提示不一致 | P1 |

### 3.2 登录

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-AUTH-011 | 打开 `/login`，正确邮箱密码 | 登录成功，进入首页/控制台 | P0 |
| TC-AUTH-012 | 错误密码 | 提示账号或密码错误 | P0 |
| TC-AUTH-013 | 不存在的邮箱 | 同上 | P1 |
| TC-AUTH-014 | 登录后访问 `/api/auth/me` | 返回当前用户信息 | P1 |

### 3.3 登出与会话

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-AUTH-021 | 登录后点击「退出」 | 清除会话，回到未登录态 | P0 |
| TC-AUTH-022 | 登出后访问需鉴权接口 | 401 / 跳转登录 | P1 |
| TC-AUTH-023 | 刷新页面 | 保持登录态（Session/Cookie） | P1 |

---

## 四、人生 Agent（Life Agent）

### 4.1 创建与发布

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-001 | 登录后进入「人生 Agent」→「创建」 | 显示创建向导 | P0 |
| TC-LIFE-002 | 完成引导问题（next-question） | 可进入下一步 | P0 |
| TC-LIFE-003 | 生成 profile-summary | 展示 AI 摘要 | P0 |
| TC-LIFE-004 | 填写 displayName、headline、shortBio 等 | 可保存草稿/发布 | P0 |
| TC-LIFE-005 | 添加知识条目（knowledge entries） | 条目可增删改 | P1 |
| TC-LIFE-006 | 设置 pricePerQuestion | 保存成功 | P0 |
| TC-LIFE-007 | 未登录访问 `/life-agents/create` | 重定向登录 | P1 |

### 4.2 浏览与详情

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-011 | 打开 `/life-agents` | 列表展示所有已发布 Agent | P0 |
| TC-LIFE-012 | 搜索 / 筛选 | 结果正确 | P1 |
| TC-LIFE-013 | 点击某 Agent 进入 `/life-agents/[id]` | 展示详情：headline、bio、知识、价格 | P0 |
| TC-LIFE-014 | 详情页显示 sampleQuestions | 示例问题可见 | P1 |
| TC-LIFE-015 | 详情页显示 ratings（若有） | 评分与评论正确 | P1 |

### 4.3 购买额度

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-021 | 选择套餐（5/15/30 次），点击购买 | 扣费成功，剩余次数更新 | P0 |
| TC-LIFE-022 | 未登录点击购买 | 提示登录 | P0 |
| TC-LIFE-023 | 购买后查看「已购咨询额度」 | 显示正确 remainingQuestions | P1 |

### 4.4 对话（Chat）

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-031 | 购买后进入 `/life-agents/[id]/chat` | 可发起对话 | P0 |
| TC-LIFE-032 | 发送一条消息 | 收到 AI 回复（若配置 OPENAI_API_KEY） | P0 |
| TC-LIFE-033 | 额度用尽后发消息 | 提示购买或拒绝 | P0 |
| TC-LIFE-034 | 查看会话列表 | 历史会话可见 | P1 |
| TC-LIFE-035 | 提交消息反馈（feedback） | 反馈记录成功 | P2 |

### 4.5 评分与反馈

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-041 | 对话后对 Agent 评分 | 评分保存，详情页评分更新 | P1 |
| TC-LIFE-042 | 查看 feedback-summary | 正确汇总 | P2 |

### 4.6 创作者管理

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-051 | 访问 `/dashboard/life-agents` | 显示我创建的人生 Agent | P0 |
| TC-LIFE-052 | 进入 `/dashboard/life-agents/[id]` 管理页 | 可编辑、修改、查看会话统计 | P1 |
| TC-LIFE-053 | 使用 modify-via-chat 修改资料 | 修改生效 | P2 |
| TC-LIFE-054 | 删除人生 Agent | 删除成功，列表移除 | P1 |

### 4.7 消息中心

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-LIFE-061 | 访问 `/dashboard/messages` | 显示与我相关消息/会话 | P1 |
| TC-LIFE-062 | 访问 `/dashboard/chat-history` | 显示对话历史 | P1 |

---

## 五、调用与存证链路

### 5.1 申请 InvocationToken

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-INV-001 | `POST /api/invocations/issue-token` 传 licenseId、agentId、scope、inputHash | 返回 request_id、invocation_token、agent_base_url | P0 |
| TC-INV-002 | 无效 licenseId | 错误：license_not_found | P0 |
| TC-INV-003 | quota 已用完 | 错误：quota_exhausted | P0 |
| TC-INV-004 | License 已过期 | 错误 | P1 |
| TC-INV-005 | 未带 API Key 或 Session | 401 UNAUTHORIZED | P0 |

### 5.2 Token 校验（卖方 Agent 调用）

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-VERIFY-001 | `POST /api/invocation-tokens/verify` 传有效 token | 返回 valid: true、requestId、licenseId 等 | P0 |
| TC-VERIFY-002 | 传过期 token | valid: false, error: token_expired | P0 |
| TC-VERIFY-003 | 传已使用 token | valid: false | P1 |

### 5.3 执行回执与对账

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-REC-001 | 卖方 `POST /api/receipts` 提交 requestId、licenseId、agentId、inputHash、status | 回执保存，quota 扣减 | P0 |
| TC-REC-002 | 重复提交同一 requestId | 防重放，拒绝或幂等 | P1 |
| TC-REC-003 | inputHash 与签发时不一致 | 拒绝 | P1 |

### 5.4 完整调用链（Demo Agent）

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-FLOW-001 | 运行 `node scripts/local-invoke-example.mjs` | status: success | P0 |
| TC-FLOW-002 | 检查 License quota | 调用后 quota_used +1 | P1 |
| TC-FLOW-003 | 网页：购买 License → 调用 Demo Agent | 全流程成功 | P1 |

### 5.5 争议

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-DSP-001 | `POST /api/disputes` 传入 licenseId、invocationReqId、receiptId、reason | 争议创建 | P1 |
| TC-DSP-002 | 未登录/无权 | 401 | P1 |

---

## 六、平台 API Key 与隧道

### 6.1 API Key 管理

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-KEY-001 | 登录后访问 `/dashboard/api-keys` | 显示 API Key 列表 | P1 |
| TC-KEY-002 | 创建 API Key | 返回 sk_live_xxx（只显示一次） | P0 |
| TC-KEY-003 | 删除 API Key | 删除成功 | P1 |
| TC-KEY-004 | 用 API Key 调用 `POST /api/invocations/issue-token` | 替代 Session，正常签发 | P0 |

### 6.2 隧道（免 ngrok）

| 用例 | 步骤 | 预期 | 优先级 |
|------|------|------|--------|
| TC-TUN-001 | 卖方客户端 `GET /api/tunnel/poll?agentId=xxx` 轮询 | 返回待处理请求（若有） | P1 |
| TC-TUN-002 | 买方调用 `POST /api/tunnel/invoke/:agentId` | 平台转发到已连接隧道 | P1 |
| TC-TUN-003 | 卖方 `POST /api/tunnel/respond` 回传结果 | 买方收到响应 | P1 |
| TC-TUN-004 | 无隧道连接时 invoke | 合理错误或排队 | P1 |

---

## 七、非功能测试

### 7.1 兼容性

| 用例 | 范围 | 预期 |
|------|------|------|
| TC-NF-001 | Chrome、Safari、Edge 最新版 | 核心流程正常 |
| TC-NF-002 | 移动端（PWA / 响应式） | 底部导航、表单可用 |
| TC-NF-003 | 深色/浅色模式（若有） | 展示正常 |

### 7.2 性能

| 用例 | 指标 | 目标 |
|------|------|------|
| TC-NF-011 | 首页 / 列表首屏 | LCP < 2.5s |
| TC-NF-012 | 对话首字 | TTFB < 3s（含 LLM） |
| TC-NF-013 | API 响应 | P95 < 500ms（不含 LLM） |

### 7.3 安全与健壮

| 用例 | 步骤 | 预期 |
|------|------|------|
| TC-NF-021 | 未鉴权访问受保护 API | 401 |
| TC-NF-022 | SQL 注入 / XSS 尝试 | 无漏洞 |
| TC-NF-023 | Session 固定 / CSRF | 有防护 |
| TC-NF-024 | 超长输入、异常 JSON | 不崩溃，合理错误 |

---

## 八、测试检查清单

上线前可快速核对：

- [ ] 登录/注册/登出正常
- [ ] 人生 Agent：创建 → 发布 → 购买 → 对话 → 评分
- [ ] API Key 创建与使用
- [ ] 争议创建接口可用
- [ ] 移动端核心流程可用
- [ ] `.env` 敏感项未泄露

---

## 九、自动化建议

| 类型 | 工具示例 | 覆盖范围 |
|------|----------|----------|
| 单元测试 | Go `testing`、Jest/Vitest | 业务逻辑、工具函数 |
| API 测试 | httptest、Postman/Newman | 各 API 端点 |
| 端到端 | Playwright、Cypress | 登录→创建 Agent→购买→对话 |
| 集成 | `go test ./...`、`npm test` | CI 流水线 |

---

## 附录：种子账号

| 账号 | 密码 | 用途 |
|------|------|------|
| buyer@demo.com | password123 | 买方测试 |
| seller@demo.com | password123 | 卖方测试 |

种子会创建 Demo Agent、Demo License、Demo API Key。执行 `go run ./scripts/seed.go`（Go 版）或 `npm run db:seed`（Prisma 版）后，将输出的 `PLATFORM_DEMO_SECRET` 填入 `.env`。
