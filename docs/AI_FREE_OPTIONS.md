# 免费 AI 接入方案（人生 Agent 聊天）

用于试验 AI 功能，无需付费。支持 OpenAI 兼容 API 的任一服务。

---

## 方案 1：Ollama 本地运行（推荐试验）

**完全免费，无需账号，数据本地，支持中文模型。**

### 1. 安装 Ollama

- 下载：https://ollama.com
- 安装后 Ollama 服务自动启动，监听 `http://localhost:11434`

### 2. 拉取模型（选一个，中文建议 qwen3.5）

```bash
# 中文效果好，约 3.4GB（8GB 显存推荐）
ollama pull qwen3.5:4b

# 或更小更快（约 2.7GB）
ollama pull qwen3.5:2b

# 英文也可
ollama pull llama3.2
```

### 3. 配置 .env

在**项目根目录**或 **backend/** 下创建 `.env` 文件（可复制 `.env.example` 修改），加入：

```env
OPENAI_BASE_URL="http://localhost:11434/v1"
OPENAI_MODEL="qwen3.5:4b"
OPENAI_API_KEY="ollama"
```

Go 后端启动时会自动加载 `.env`，无需手动设置环境变量。

### 4. 启动后端

```bash
cd backend
go run .
```

---

## 方案 2：Groq 云端免费

**免费额度：约 14,400 次/天，响应快，需注册账号。**

### 1. 注册并获取 API Key

- 打开 https://console.groq.com
- 注册后创建 API Key

### 2. 配置 .env

```env
OPENAI_BASE_URL="https://api.groq.com/openai/v1"
OPENAI_MODEL="llama-3.3-70b-versatile"
OPENAI_API_KEY="gsk_你的Groq_Key"
```

### 3. 启动后端

```bash
cd backend
go run .
```

---

## 方案 3：通义千问（支持联网搜索）

**阿里云百炼，中文效果好，可开启联网搜索获取实时信息。**

### 1. 获取 API Key

- 打开 https://dashscope.console.aliyun.com
- 创建 API Key

### 2. 配置 .env

```env
OPENAI_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
OPENAI_MODEL="qwen-plus"
OPENAI_API_KEY="sk-xxx"
# 可选：启用联网搜索（需阿里云信息查询服务，有免费试用）
LLM_ENABLE_WEB_SEARCH="true"
```

### 3. 联网搜索说明

- `LLM_ENABLE_WEB_SEARCH=true` 时，Agent 可搜索互联网获取最新信息
- 仅在使用通义千问（DashScope base URL）时生效
- 阿里云信息查询服务提供 15 天免费试用（约 1000 次/天）

---

## 方案 4：OpenAI 官方

有付费账户时使用，不设置 `OPENAI_BASE_URL` 即可：

```env
OPENAI_MODEL="gpt-4o-mini"
OPENAI_API_KEY="sk-xxx"
```

---

## 环境变量汇总

| 变量 | 说明 | 示例 |
|------|------|------|
| `OPENAI_BASE_URL` | 可选，非 OpenAI 时必填 | `http://localhost:11434/v1` |
| `OPENAI_MODEL` | 模型名 | `qwen3.5:4b` |
| `OPENAI_API_KEY` | API Key（Ollama 可填 `ollama`） | `ollama` / `gsk_xxx` / `sk_xxx` |
| `LLM_ENABLE_WEB_SEARCH` | 通义千问联网搜索（`true`/`1` 启用） | `true` |

未配置任何 AI 时，聊天将使用模板回复。

---

## 加快回答速度

1. **换小模型（Ollama）**：`qwen3.5:2b` 比 `qwen3.5:4b` 快不少，质量略降
2. **用 Groq**：云端推理极快，免费额度够用
3. **后端已优化**：MaxTokens 1000、历史 8 条、检索 4 条，减少 token 量以提速
4. **本地 GPU**：Ollama 用 GPU 会比 CPU 快很多

---

## 保证回答质量（尽量按用户经验回答）

1. **提示词已强化**：系统会明确要求模型「只基于知识库」「无法回答时明确说明」「切勿编造」，并降低 Temperature 以减少发挥。

2. **模型选择建议**（若仍发现编造或超范围）：
   - Ollama：`qwen3.5:9b` 或 `qwen3.5:27b` 比 4b 更听话
   - Groq：`llama-3.3-70b-versatile` 指令遵循较好
   - 付费：`gpt-4o` 或 `gpt-4o-mini` 指令遵循能力较强

3. **创作者侧**：知识库条目写得越具体、越有「可引用」的事实，模型越容易紧扣内容回答。
