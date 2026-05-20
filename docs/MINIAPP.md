# BrightAgent 微信小程序（Phase 1）

本目录为 BrightAgent 微信小程序 MVP，与现有 Next.js / Go 后端共用同一套 API。

## 功能范围（Phase 1）

| 页面 | 路径 | 说明 |
|------|------|------|
| 发现 | `pages/index` | 已发布人生 Agent 列表 |
| 登录 | `pages/login` | 邮箱验证码 / 密码登录 |
| 详情 | `pages/agent-detail` | Agent 资料、剩余提问次数 |
| 对话 | `pages/chat` | 文字对话（JSON 模式，非 SSE） |
| 我的 | `pages/mine` | 账号、已购 Agent |
| 客服 | `pages/support` | 官方邮箱与 FAQ |
| 隐私 | `pages/privacy` | 隐私政策全文 |

**Phase 1 不包含**：微信支付、微信一键登录、地图、语音。

## 本地开发

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开本目录 `miniapp/` 作为小程序项目
3. 修改 `project.config.json` 中的 `appid` 为你的小程序 AppID
4. 确认 `config.js` 中 `API_BASE` 指向生产或本地后端（需 HTTPS 且已备案域名）

### 开发者工具调试

- 详情 → 本地设置 → 勾选「不校验合法域名」可临时连本地/测试 API
- 正式发布前必须在微信公众平台配置 **request 合法域名**：`https://www.brightagent.cn`

## 会话与鉴权

小程序 `wx.request` 不会自动持久化 Cookie。`utils/request.js` 会：

1. 从响应头 `Set-Cookie` 解析 `agent_fiverr_session`
2. 存入 `wx.setStorageSync`
3. 后续请求带上 `Cookie: agent_fiverr_session=...`

登录接口与网站相同：

- `POST /api/auth/email/send-code`
- `POST /api/auth/email/verify`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## 对话 API（小程序专用 JSON）

网站对话使用 SSE 流式输出。小程序请求时带上请求头：

```
X-BrightAgent-Client: miniapp
```

后端 `POST /api/life-agents/:id/chat` 将返回完整 JSON：

```json
{
  "sessionId": "...",
  "reply": "...",
  "messageId": "...",
  "remainingQuestions": 9,
  "references": []
}
```

需先部署包含该改动的后端（见 `backend/internal/handler/life_agents.go` 中 `isMiniAppClient`）。

## 配置清单

| 项 | 位置 |
|----|------|
| API 域名 | `miniapp/config.js` → `API_BASE` |
| 小程序 AppID | `miniapp/project.config.json` |
| 官方客服邮箱 | `miniapp/config.js` → `OFFICIAL_EMAIL` |
| 微信合法域名 | 微信公众平台 → 开发 → 开发管理 → 服务器域名 |

## 发布前检查

- [ ] `project.config.json` AppID 已填写
- [ ] 微信公众平台已添加 `https://www.brightagent.cn` 为 request 合法域名
- [ ] 服务器已 `git pull` 并重建 backend（含 miniapp JSON 对话支持）
- [ ] 小程序隐私政策页面与 App Store / 网站文案一致
- [ ] 测试：发验证码登录 → 发现 Agent → 已购对话 → 退出登录

## 后续 Phase 2（规划）

- `wx.login` + 后端 code2Session 绑定微信 OpenID
- 微信小程序支付购买提问包
- 地图页、收藏、会话历史列表
