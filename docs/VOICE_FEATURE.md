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

- `life_agent_profiles.voice_clone_id`：TTS 音色克隆 ID（预留，阿里云接入时使用）
- `life_agent_chat_messages.audio_url`：语音回复的音频 URL
- `life_agent_chat_messages.audio_duration_sec`：语音时长（秒）

### 2. 环境变量

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | 配置后启用语音回复（使用 OpenAI TTS，默认 nova 音色） |
| `BASE_URL` | 应用公网地址（可选，用于生成音频 URL） |

### 3. 创建 Agent

- 接收 `voiceSampleBase64`，保存到 `backend/data/voice_samples/{profile_id}.webm`
- 音色克隆（阿里云 CosyVoice）可后续接入

### 4. 语音回复

- 当 `useVoiceReply` 为 true 且 `OPENAI_API_KEY` 已配置时，调用 OpenAI TTS 合成
- 音频保存到 `backend/data/audio/{message_id}.mp3`
- 通过 `GET /api/audio/:filename` 提供访问

### 5. 已实现 API

- `GET /api/life-agents/:id`：返回 `hasVoiceClone`（有 OpenAI Key 或 voiceCloneId 时为 true）
- `POST /api/life-agents/:id/chat`：支持 `useVoiceReply`，返回 `audioUrl`、`audioDurationSec`
- `GET /api/life-agents/:id/chat/sessions/:sessionId`：消息含 `audioUrl`、`audioDurationSec`

## 浏览器兼容性

- **语音识别**：Chrome、Edge 支持；Safari、Firefox 需检查
- **录音**：主流现代浏览器支持

## 第三方 TTS 音色克隆参考

- 阿里云 CosyVoice：约 10–20 秒样本即可克隆
- 千问声音复刻：10–30 秒，WAV/MP3/M4A，≥24kHz
