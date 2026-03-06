可以。下面我直接给你一版**不用链、由平台小黑做中间授权与仲裁**的清晰流程，按产品/系统设计来写，方便你直接喂给 Cursor 改代码。

---

# 方案定位

小黑平台不是 Agent 托管执行平台，也不是工具执行平台。
小黑平台的职责只有四个：

1. **身份认证**
2. **交易授权**
3. **调用存证**
4. **纠纷仲裁**

也就是说：

* **小兰**继续在自己侧运行 AgentB，保留数据/资源/私有能力
* **小红**通过平台购买 AgentB 的使用权
* **小黑**不运行 AgentB，不执行 CRM/私信/外部动作，只负责给调用“盖章”和“留证据”

---

# 一、三方职责

## 小红（买方）

负责：

* 购买 license
* 发起调用请求
* 提供任务输入
* 验收结果
* 发起争议

---

## 小兰（卖方）

负责：

* 提供 AgentB 服务
* 校验平台授权
* 执行合法请求
* 返回结果与执行回执
* 配合争议举证

---

## 小黑（平台）

负责：

* 注册 Agent
* 管理订单/license
* 签发短期调用凭证
* 存储请求摘要与执行回执
* 做配额控制、风控、仲裁

---

# 二、核心对象

你代码里至少要有这 6 个核心对象。

## 1. Agent

表示小兰上架的 AgentB。

字段建议：

* `agent_id`
* `seller_id`
* `name`
* `description`
* `base_url`
* `public_key` 或 `service_secret_id`
* `supported_scopes`
* `pricing_config`
* `status`
* `risk_level`

---

## 2. License

表示小红买到的使用许可，不是 Agent 所有权。

字段建议：

* `license_id`
* `agent_id`
* `buyer_id`
* `seller_id`
* `scope`
* `quota_total`
* `quota_used`
* `expires_at`
* `status`

  * `active`
  * `expired`
  * `suspended`
  * `revoked`

---

## 3. InvocationToken

表示平台每次签发的短期调用凭证。

字段建议：

* `token_id`
* `license_id`
* `agent_id`
* `buyer_id`
* `seller_id`
* `request_id`
* `scope`
* `issued_at`
* `expires_at`
* `nonce`
* `signature`
* `status`

  * `issued`
  * `used`
  * `expired`
  * `cancelled`

---

## 4. InvocationRequest

表示小红本次实际提交的任务请求。

字段建议：

* `request_id`
* `license_id`
* `agent_id`
* `buyer_id`
* `input_hash`
* `input_preview`（可选，脱敏）
* `scope`
* `created_at`
* `buyer_signature`（可选）
* `platform_token_id`

---

## 5. ExecutionReceipt

表示小兰执行完成后回传的平台回执。

字段建议：

* `receipt_id`
* `request_id`
* `license_id`
* `agent_id`
* `seller_id`
* `input_hash`
* `output_hash`
* `output_preview`（可选）
* `started_at`
* `finished_at`
* `agent_version`
* `tool_usage_summary`
* `seller_signature`
* `status`

  * `success`
  * `failed`
  * `rejected`

---

## 6. Dispute

表示买卖双方纠纷记录。

字段建议：

* `dispute_id`
* `license_id`
* `request_id`
* `buyer_id`
* `seller_id`
* `reason`
* `evidence_refs`
* `status`
* `resolution`
* `created_at`
* `resolved_at`

---

# 三、完整业务流程

下面是最重要的主流程。

---

## Step 1：小兰注册 AgentB

### 流程

1. 小兰在小黑平台创建 Agent
2. 填写：

   * Agent 名称
   * 描述
   * 可提供的 scope
   * API 地址 `base_url`
   * 服务身份信息（公钥/签名方式）
   * 定价与配额规则
3. 平台审核通过后上架

### 结果

平台生成：

* `agent_id`

---

## Step 2：小红购买 License

### 流程

1. 小红选择 AgentB
2. 选择购买方案：

   * 次数包
   * 时长包
   * scope 范围
3. 平台创建订单并支付
4. 支付成功后生成 License

### 结果

平台生成：

* `license_id`
* 初始 quota
* 过期时间

### 关键规则

小红买到的是**调用许可**，不是 API 所有权，不是源码，不是永久 key。

---

## Step 3：小红发起调用前，先向平台申请 InvocationToken

### 流程

1. 小红提交调用申请：

   * `license_id`
   * `agent_id`
   * `scope`
   * `input_hash`
2. 平台检查：

   * license 是否有效
   * quota 是否足够
   * scope 是否允许
   * 是否超频/风控命中
3. 校验通过后，平台签发短期 `InvocationToken`

### 结果

平台返回：

* `token_id`
* `request_id`
* `expires_at`
* `signature`

### 关键点

这个 token 必须是：

* 短时有效
* 单次或短会话有效
* 和 `request_id` 强绑定
* 可验证平台签名

---

## Step 4：小红调用小兰 AgentB

### 调用方式

小红直接请求小兰 API，不经过平台转发执行。

请求体至少包含：

* `request_id`
* `license_id`
* `agent_id`
* `scope`
* `input`
* `input_hash`
* `invocation_token`

---

## Step 5：小兰侧校验 InvocationToken

### 小兰 AgentB 服务端必须做的事

收到请求后先验证：

1. token 是否为平台签发
2. token 是否过期
3. `request_id` 是否一致
4. `license_id` / `agent_id` / `buyer_id` 是否匹配
5. `scope` 是否合法
6. token 是否已被重复使用

### 校验失败

直接拒绝执行，返回：

* `unauthorized`
* `token_invalid`
* `token_expired`
* `scope_mismatch`

### 校验通过

才允许执行 AgentB。

---

## Step 6：小兰执行 AgentB，并返回结果

### 小兰执行完成后要做两件事

#### A. 返回业务结果给小红

例如：

* 文案
* 分析结果
* 推荐列表
* 数据输出

#### B. 生成 ExecutionReceipt 回传平台

回执至少包含：

* `request_id`
* `license_id`
* `agent_id`
* `seller_id`
* `input_hash`
* `output_hash`
* `started_at`
* `finished_at`
* `agent_version`
* `tool_usage_summary`
* `seller_signature`

### 关键点

平台存的是**执行证据**，不是完整执行逻辑。

---

## Step 7：平台核对请求与回执

平台收到回执后，自动做一致性检查：

1. 是否存在对应 `InvocationRequest`
2. `request_id` 是否一致
3. `license_id` 是否一致
4. `agent_id` 是否一致
5. `input_hash` 是否一致
6. 是否在 token 有效期内
7. quota 是否应扣减

### 检查成功

* 标记本次调用成功
* 扣减 quota
* 存档证据链

### 检查失败

* 标记异常调用
* 不计入合法调用
* 可触发风控/人工审核

---

## Step 8：小红验收结果

### 两种情况

#### 情况 A：满意

调用完成，交易结束。

#### 情况 B：不满意 / 怀疑异常

小红可以发起 dispute，理由例如：

* 返回内容与预期不符
* scope 外执行
* 回执与请求不一致
* 怀疑卖方伪造或偷换任务

---

## Step 9：平台仲裁

平台仲裁时只看证据，不看口头说法。

### 平台重点核验

1. 是否有合法 License
2. 是否有平台签发 InvocationToken
3. 小红请求摘要是什么
4. 小兰回执是否和请求匹配
5. quota 是否异常
6. 历史调用模式是否异常

### 仲裁输出

可选结果：

* 判定为合法调用，卖方无责
* 判定为卖方未按请求执行
* 判定为调用无效，不计费
* 判定退款/补偿
* 判定冻结 License
* 判定下架 Agent / 扣卖方信用分

---

# 四、最关键的防伪造规则

这部分你必须写死在代码逻辑和协议里。

## 规则 1

**平台不承认卖方单边日志。**

也就是：
小兰自己本地写的日志，不能单独作为“小红发起过请求”的证据。

---

## 规则 2

**只有“平台签发 token + 平台登记 request + 卖方 execution receipt”三者一致，才算合法调用。**

缺任意一个，都不能认定是小红的有效调用。

---

## 规则 3

**任何未绑定 request_id 的执行，不得归责于小红。**

---

## 规则 4

**任何 input_hash 不匹配的回执，直接视为异常执行。**

---

## 规则 5

**卖方不得重复使用同一个 token 对多个请求执行。**

---

# 五、代码层模块建议

你让 Cursor 改代码时，可以按模块切。

## 1. `agent_registry`

负责：

* Agent 注册
* Agent 更新
* 卖方身份管理
* 公钥/服务签名配置

---

## 2. `license_service`

负责：

* 创建 License
* 检查有效期
* 检查 quota
* 吊销/暂停 license

---

## 3. `invocation_service`

负责：

* 生成 `request_id`
* 生成 `InvocationToken`
* 签名
* token 校验
* 防重放

---

## 4. `receipt_service`

负责：

* 接收小兰回执
* 验签
* 对账
* 记录 output hash
* 标记合法/异常调用

---

## 5. `dispute_service`

负责：

* 创建 dispute
* 拉取 request / token / receipt
* 生成仲裁视图
* 输出判定结果

---

## 6. `risk_control`

负责：

* 异常频率检测
* token 重复使用
* quota 异常消耗
* scope 越权调用
* seller 异常回执率监控

---

# 六、最小 API 设计

下面这组接口够你先改 MVP。

## 平台侧 API

### 1. 注册 Agent

`POST /agents`

### 2. 购买/创建 License

`POST /licenses`

### 3. 申请调用凭证

`POST /invocations/issue-token`

请求示例字段：

```json
{
  "license_id": "lic_123",
  "agent_id": "agent_b",
  "scope": "content.generate",
  "input_hash": "sha256:xxxx"
}
```

返回：

```json
{
  "request_id": "req_123",
  "token_id": "tok_123",
  "expires_at": "2026-03-06T12:00:00Z",
  "signature": "platform_signed_token"
}
```

### 4. 卖方提交执行回执

`POST /receipts`

### 5. 发起争议

`POST /disputes`

---

## 卖方 AgentB API

### 1. 执行调用

`POST /invoke`

请求示例：

```json
{
  "request_id": "req_123",
  "license_id": "lic_123",
  "agent_id": "agent_b",
  "scope": "content.generate",
  "input": {
    "product": "xxx",
    "goal": "xxx"
  },
  "input_hash": "sha256:xxxx",
  "invocation_token": "platform_signed_token"
}
```

返回示例：

```json
{
  "request_id": "req_123",
  "status": "success",
  "result": {
    "content": "..."
  },
  "output_hash": "sha256:yyyy",
  "agent_version": "v1.2.3",
  "seller_signature": "signed_receipt_payload"
}
```

---

# 七、时序图版

你可以直接给 Cursor 或画图工具。

```text
小兰 -> 小黑平台: 注册 AgentB
小黑平台 -> 小兰: agent_id

小红 -> 小黑平台: 购买 License
小黑平台 -> 小红: license_id

小红 -> 小黑平台: 申请调用 token(input_hash, scope, license_id)
小黑平台 -> 小红: request_id + invocation_token

小红 -> 小兰 AgentB: 发起 invoke(request_id, input, input_hash, token)
小兰 AgentB -> 小黑平台: 验证/回传 ExecutionReceipt
小兰 AgentB -> 小红: 返回结果

小黑平台 -> 小黑平台: 核对 request/token/receipt
小黑平台 -> 小红: 可查询调用记录

小红 -> 小黑平台: 不满意则发起 dispute
小黑平台 -> 小红/小兰: 仲裁结果
```

---

# 八、你可以直接塞给 Cursor 的开发要求

下面这段你几乎可以原样贴。

```md
Goal:
Refactor the platform into a trusted authorization-and-arbitration layer for third-party agent usage.

Constraints:
- The platform does NOT host or execute seller agents.
- The platform does NOT perform downstream actions like CRM writes or message sending.
- Seller agents remain on seller infrastructure.
- Platform is responsible for identity, license issuance, invocation authorization, evidence storage, and dispute arbitration.

Core flow:
1. Seller registers an agent with service identity metadata.
2. Buyer purchases a license for a specific agent and scope.
3. Before each invocation, buyer requests a short-lived invocation token from platform.
4. Platform validates license/quota/scope and issues request_id + signed token.
5. Buyer sends request directly to seller agent with request_id, input_hash, token.
6. Seller validates token before execution.
7. After execution, seller returns result to buyer and submits signed execution receipt to platform.
8. Platform reconciles invocation request, token, and execution receipt.
9. Only matched triples (request + token + receipt) count as valid buyer usage.
10. Disputes are resolved based on stored request/receipt evidence, not seller-side raw logs.

Must-have rules:
- Seller unilateral logs are never sufficient evidence.
- Any execution without a platform-issued request_id/token is not attributable to buyer.
- Any receipt with mismatched input_hash must be marked invalid.
- Tokens must be short-lived and replay-protected.
- Licenses must enforce quota, scope, and expiration.

Core models:
- Agent
- License
- InvocationToken
- InvocationRequest
- ExecutionReceipt
- Dispute

Suggested modules:
- agent_registry
- license_service
- invocation_service
- receipt_service
- dispute_service
- risk_control
```

---

# 九、最后给你一句最准确的产品定义

**小黑平台卖的不是 Agent 执行能力，而是 Agent 使用权的可信授权、调用存证和纠纷仲裁。**

这句别写错。
写错了，后面系统边界会一直乱。

下一步最有价值的是：我可以直接继续帮你写成一份 **给 Cursor 用的完整 PRD/技术设计 Markdown**。
