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

## 后端集成说明

### 1. 数据库迁移

已添加字段：

- `life_agent_profiles.voice_clone_id`：TTS 音色克隆 ID
- `life_agent_chat_messages.audio_url`：语音回复的音频 URL
- `life_agent_chat_messages.audio_duration_sec`：语音时长（秒）

执行迁移：

```bash
npx prisma migrate dev --name add_voice_fields
```

### 2. 创建 Agent API

`POST /api/life-agents` 请求体新增可选字段：

- `voiceSampleBase64`：Base64 编码的音频（用户朗读采集的 10–30 秒）

后端需：

1. 接收 `voiceSampleBase64`，调用 TTS 音色克隆 API（如阿里云 CosyVoice、千问声音复刻）
2. 将返回的 `voiceCloneId` 存入 `life_agent_profiles.voice_clone_id`

### 3. 获取 Agent 详情 API

`GET /api/life-agents/:id` 响应需包含：

- `hasVoiceClone`：布尔值，表示该 Agent 是否已配置音色

### 4. 聊天 API

`POST /api/life-agents/:id/chat` 请求体新增：

- `useVoiceReply`：布尔值，是否使用语音回复

响应体新增：

- `audioUrl`：语音回复的音频 URL（当 `useVoiceReply` 为 true 时）
- `audioDurationSec`：语音时长（秒）

后端需：

1. 当 `useVoiceReply` 为 true 且 Agent 有 `voiceCloneId` 时，调用 TTS 合成
2. 将返回的音频 URL 或上传后的 URL 返回给前端

### 5. 历史会话消息

`GET /api/life-agents/:id/chat/sessions/:sessionId` 返回的消息中，每条 assistant 消息可包含：

- `audioUrl`
- `audioDurationSec`

## 浏览器兼容性

- **语音识别**：Chrome、Edge 支持；Safari、Firefox 需检查
- **录音**：主流现代浏览器支持

## 第三方 TTS 音色克隆参考

- 阿里云 CosyVoice：约 10–20 秒样本即可克隆
- 千问声音复刻：10–30 秒，WAV/MP3/M4A，≥24kHz
