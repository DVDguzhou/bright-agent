# 脚本索引

这份文档说明 `scripts/` 目录下各类脚本的用途，方便快速检索。

## 当前结构

```text
scripts/
  dev/
  life-agent/
  platform/
  workflows/
  experiments/
  assets/
  README.md
```

## 推荐先看

- 启动本地前后端：`npm run dev:all`
- 只起前端：`npm run dev:web`
- 只起 Go 后端：`npm run dev:api`
- 最小启动流程：`docs/MINIMAL_SETUP.md`

## 开发启动

| 脚本 | 用途 |
|------|------|
| `dev/dev-all.mjs` | 同时启动 Next 前端与 Go 后端 |
| `dev/dev-api.mjs` | 启动 Go 后端 |
| `dev/dev.sh` | 旧的 macOS/Terminal 启动脚本 |
| `dev/restart.sh` | 本地重启辅助脚本 |

## 平台主流程 / Demo

| 脚本 | 用途 |
|------|------|
| `platform/local-invoke-example.mjs` | 跑通 License -> Token -> 调用 -> 回执 的完整示例 |
| `platform/create-api-key-and-test.mjs` | 创建 API Key 并做基础调用测试 |
| `platform/chat.mjs` | 简单聊天调用 |
| `platform/seller-agent-example.mjs` | 卖家 Agent 侧示例 |
| `platform/tunnel-client.mjs` | 隧道客户端轮询 / 响应 |

## 人生 Agent 创建与测试

| 脚本 | 用途 |
|------|------|
| `life-agent/create-laoda.ts` | 创建老大 Agent |
| `life-agent/create-laoda-2-with-voice.mjs` | 创建带语音配置的老大 Agent |
| `life-agent/enroll-laoda-voice.mjs` | 为老大样本注册音色 |
| `life-agent/create-gossip-agent.mjs` | 创建八卦 Agent |
| `life-agent/test-create-life-agent.mjs` | 测试创建人生 Agent |
| `life-agent/test-gossip-agent.mjs` | 创建、购买并对话测试八卦 Agent |
| `life-agent/test-profile-memory.mjs` | 测试记忆 / 画像相关行为 |
| `life-agent/test-voice.mjs` | 测试语音回复链路 |

## Agent / 工作流调用

| 脚本 | 用途 |
|------|------|
| `workflows/invoke-crawler-agent.mjs` | 调用爬虫 Agent |
| `workflows/invoke-web-analyzer.mjs` | 调用 Web Analyzer |
| `workflows/invoke-orchestrator.mjs` | 调用编排 Agent |
| `workflows/invoke-swarm.mjs` | 调用 swarm 流程 |
| `workflows/invoke-video-pipeline.mjs` | 调用视频流水线 |
| `workflows/workflow-competitor-research.mjs` | 跑竞品调研工作流 |

## 模型 / 集成冒烟测试

| 脚本 | 用途 |
|------|------|
| `experiments/test-deepseek-chat.mjs` | DeepSeek 聊天直连测试 |
| `experiments/test-ollama-direct.mjs` | Ollama 直连测试 |
| `experiments/test-qwen-direct.mjs` | Qwen 直连测试 |
| `experiments/sustech-export-department.mjs` | 特定业务导出脚本 |

## 资源与内容生成

| 脚本 | 用途 |
|------|------|
| `assets/assign-life-agent-cover-presets.sql` | 批量分配封面预设 |
| `assets/split-agent-cover-sheet.py` | 切分封面大图为多个 PNG |
| `assets/gen_business_plan_pdf.py` | 生成商业计划书 PDF |
| `assets/gen_business_plan_docx.py` | 生成商业计划书 DOCX |
| `assets/download-papers.ps1` | 重新下载论文资料 |

## 补充说明

- `scripts/` 现在按用途拆成子目录；`backend/scripts/` 是 Go 后端专用脚本
- 默认本地前端地址统一按 `http://localhost:3000`
- 默认 Go 后端地址统一按 `http://localhost:8080`
