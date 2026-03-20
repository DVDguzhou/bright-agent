# 语音功能模块说明

## 功能概述

1. **用户语音输入**：在聊天页面，用户可按住麦克风按钮说话，松开发送（类似微信）
2. **Agent 音色采集**：创建 Agent 时，用户朗读一段文字，系统采集音色用于生成 Agent 专属语音
3. **语音回复**：用户可选择 Agent 回复方式（文字 / 语音），语音回复以微信语音条形式展示

## 模块划分

```
src/
├── lib/voice/                    # 语音核心逻辑
│   ├── useSpeechRecognition.ts   # 语音识别 Hook（Web Speech API）
│   ├── useMediaRecorder.ts       # 录音 Hook
│   └── index.ts
├── components/voice/             # 语音 UI 组件
│   ├── VoiceInputButton.tsx      # 按住说话按钮（聊天输入）
│   ├── VoiceRecordPanel.tsx      # 音色采集面板（创建 Agent）
│   ├── VoiceMessageBubble.tsx   # 微信风格语音条
│   ├── VoiceReplyToggle.tsx     # 文字/语音回复切换
│   └── index.ts
```

## 后端集成说明（已实现）

### 1. 数据库

Go 后端使用 GORM AutoMigrate，已添加字段会自动迁移：

- `life_agent_profiles.voice_clone_id`：百炼返回的 **`voice` id** 或内置 Flash 预设名（如种子里的 `Ethan`）；Prisma/MySQL 字段长度建议 ≥128（`VARCHAR(128)`）
- `life_agent_chat_messages.audio_url`：语音回复的音频 URL
- `life_agent_chat_messages.audio_duration_sec`：语音时长（秒）

### 2. 环境变量与 TTS 选型

**默认推荐（全阿里云）**：`TTS_PROVIDER=auto`（可不写），且 `OPENAI_BASE_URL` 指向百炼兼容端（含 `dashscope`）时，使用 **百炼 Qwen3-TTS-Flash**（`qwen3-tts-flash`），与 **`OPENAI_API_KEY`（通义 sk）** 共用，无需再配 OpenAI。

| 变量 | 说明 |
|------|------|
| `TTS_PROVIDER` | `auto`（默认）、`dashscope`、`openai` |
| `OPENAI_API_KEY` | 通义聊天 + 百炼 TTS（auto/dashscope 时） |
| `DASHSCOPE_API_KEY` | 可选；与 `OPENAI_API_KEY` 不一致时单独指定百炼 Key |
| `DASHSCOPE_TTS_URL` | 默认北京地域 multimodal-generation；新加坡见 `.env.example` |
| `DASHSCOPE_TTS_MODEL` | 默认 `qwen3-tts-flash` |
| `DASHSCOPE_TTS_VOICE` | 默认 `Cherry`（更多见[官方音色表](https://help.aliyun.com/zh/model-studio/qwen-tts)） |
| `DASHSCOPE_TTS_LANGUAGE` | 默认 `Chinese` |
| `DASHSCOPE_VC_MODEL` | 声音复刻合成模型，默认 `qwen3-tts-vc-2026-01-22`（须与注册音色时的 `target_model` 一致） |
| `DASHSCOPE_VOICE_ENROLL_URL` | 音色注册 API，默认北京 `.../audio/tts/customization`；国际域见百炼文档 |
| `OPENAI_TTS_API_KEY` | 仅 **`TTS_PROVIDER=openai`**（或 auto 走 OpenAI 分支）时使用 |
| `BASE_URL` | 应用公网地址（可选，用于生成音频 URL） |

文档：[Qwen-TTS API](https://help.aliyun.com/zh/model-studio/qwen-tts-api)

### 3. 创建 / 更新 Agent 与声音复刻（百炼）

- 请求体可带 `voiceSampleBase64`（常见为浏览器录制的 **WebM**）。百炼仅支持 **WAV/MP3/M4A**，服务端在检测到 WebM 时会尝试用 **ffmpeg** 转为 16bit 单声道 24kHz WAV 再提交；若本机未安装 ffmpeg 则仍送 WebM（可能被拒）。建议在服务器上安装 ffmpeg 以提升注册成功率。
- 样本仍保存到 `backend/data/voice_samples/{profile_id}.webm`（便于排障）。
- 当 `TTS_PROVIDER` 解析为 **dashscope** 时，服务端调用百炼 **音色注册**（`qwen-voice-enrollment` + `target_model` = `DASHSCOPE_VC_MODEL`），将返回的 **`voice` id** 写入 `life_agent_profiles.voice_clone_id`。
- **PATCH** 人生 Agent 同样支持 `voiceSampleBase64`，会重新注册并更新 `voiceCloneId`。
- **创建** 成功响应含 `voiceCloneId`（注册失败时可能为空，见后端日志 `life-agents create/update: voice enroll`）。
- TTS 合成时：若 `voice_clone_id` 是内置 **Flash 预设名**（如 `Cherry`、`Ethan`），仍走 `DASHSCOPE_TTS_MODEL`（如 `qwen3-tts-flash`）；否则走 **`DASHSCOPE_VC_MODEL`**，并在请求里使用该 `voice` id。

### 4. 语音回复

- `useVoiceReply` 为 true 且具备可用 TTS 时合成语音；百炼返回音频 URL 后服务端下载为 **WAV** 存盘，OpenAI 为 **MP3**
- 音频保存到 `backend/data/audio/{message_id}.(wav|mp3)`
- 通过 `GET /api/audio/:filename` 提供访问

### 5. 已实现 API

- `GET /api/life-agents/:id`：返回 `hasVoiceClone`（存在可用 TTS 或 `voiceCloneId` 时为 true）
- `POST /api/life-agents/:id/chat`：支持 `useVoiceReply`，返回 `audioUrl`、`audioDurationSec`
- `GET /api/life-agents/:id/chat/sessions/:sessionId`：消息含 `audioUrl`、`audioDurationSec`

## 浏览器兼容性

- **语音识别**：Chrome、Edge 支持；Safari、Firefox 需检查
- **录音（音色采集）**：需浏览器暴露 `navigator.mediaDevices.getUserMedia`。在 **非安全上下文**（例如通过 **纯 HTTP + 公网 IP** 打开站点）下，`mediaDevices` 往往为 `undefined`，会报错或无法录音。**生产环境请使用 HTTPS**（Let's Encrypt、阿里云证书等）；本地开发用 `http://localhost` 即可。

## 自动化集成测试

后端启动且 MySQL 可用后，在项目根目录执行：

```bash
node scripts/test-voice.mjs
# 可选：TEST_BASE_URL=http://localhost:8080
```

脚本会注册用户、创建 Agent、购买次数、发送 `useVoiceReply: true` 的聊天，并尝试下载 `audioUrl` 指向的音频。
若响应中 **没有 `audioUrl`**：检查百炼是否开通 Qwen-TTS、Key 是否有权限，或 OpenAI 分支下 `OPENAI_TTS_API_KEY` 是否有效。

## 第三方 TTS 音色克隆参考

- 阿里云 CosyVoice：约 10–20 秒样本即可克隆
- 千问声音复刻：10–30 秒，WAV/MP3/M4A，≥24kHz
