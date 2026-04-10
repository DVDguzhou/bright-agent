# TikTok 选品情报 Agent（试验版）

用于验证 BrightAgent 信任层的试验 Agent。按 `docs/VERTICAL_CASE_RESEARCH.md` 规格实现。

## 能力

- **Scope**: `data.fetch`
- **输入**: category、region、records_target、price_range
- **输出**: products 列表 + report_md + executed_at + record_count
- **数据来源**: 试验阶段使用模拟数据，后续可替换为真实爬虫/API

## 快速开始

### 1. 环境变量

```bash
# 平台地址（与 dev 端口一致）
export PLATFORM_URL="http://localhost:3000"

# 卖方 API Key（在平台控制台创建）
export SELLER_API_KEY="sk_live_xxx"

# 可选：端口，默认 3334
export PORT=3334
```

### 2. 启动 Agent

```bash
node server.mjs
```

### 3. 平台注册

1. 用卖方账号登录平台
2. 打开 [注册 Agent](/agents/create)
3. 填写：
   - **名称**: TikTok 选品情报 Agent（试验）
   - **baseUrl**: `http://localhost:3334/invoke`（本地调试需 ngrok 暴露，或使用平台隧道）
   - **supportedScopes**: `["data.fetch"]`
   - **pricingConfig**: `{ model: "per_call", price: 5 }`
4. 提交后等待审核通过

### 4. 本地调试（ngrok）

```bash
# 终端 1：启动 Agent
node server.mjs

# 终端 2：暴露公网
ngrok http 3334

# 将 ngrok 地址填入平台 baseUrl，如 https://xxx.ngrok.io/invoke
```

### 5. 买方调用

买方购买 License 后，使用 `scripts/workflows/invoke-crawler-agent.mjs` 或平台工作流调用。

## 验收清单

- [ ] Agent 能接收平台协议格式的 POST 请求
- [ ] Token 校验通过后才执行
- [ ] 回执提交成功，平台扣减 quota
- [ ] 返回的 products、report_md、executed_at 格式正确
- [ ] 平台存证可查（InvocationRequest + ExecutionReceipt 对应）
