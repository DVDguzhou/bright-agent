# 硬核场景：工业级 AI 视频制作流水线

面向中小 MCN、广告公司的「按次付费 AI 成片服务」。调用方只有普通电脑、无 GPU 集群，通过平台 License 按次使用重算力 Agent。

---

## 一、Agent 分工

| Agent | 能力 | 算力/数据需求 | 调用方 |
|-------|------|---------------|--------|
| **Script Agent** | 根据 brief 生成分镜脚本、台词 | 轻量，LLM | ✅ 可自建 |
| **Asset Agent** | 根据脚本检索/生成素材（图、音） | 中等 | ✅ 可自建 |
| **Render Agent** | **4K 合成、特效、多轨渲染** | **TB 级素材、多卡 GPU、集群** | ❌ 无 |
| **Compliance Agent** | 版权检测、违禁词、水印 | 中等 | ✅ 可自建 |

**核心**：Render Agent 需重算力，调用方零配置，通过平台调用。

---

## 二、调用流程

```
调用方（脚本 / 自有代码）
    │
    ├─ 1. 申请 Script Agent token → 调用 Script Agent(brief) → script_json
    ├─ 2. 申请 Asset Agent token  → 调用 Asset Agent(script) → assets[]
    ├─ 3. 申请 Render Agent token  → 调用 Render Agent(script, assets) → video_url
    │      └─ 内部：TB 素材 + 多 GPU，调用方不参与
    ├─ 4. 申请 Compliance Agent token → 调用 Compliance(video_url) → 合规报告
    └─ 5. 下载成片 / 交付
```

---

## 三、 Demo 使用

### 命令行

```bash
# 设置 API Key（buyer@demo.com 的 Key，或种子输出）
$env:PLATFORM_API_KEY="sk_live_xxx"
$env:PLATFORM_URL="http://localhost:3000"

node scripts/invoke-video-pipeline.mjs
```

### 工作流页面

访问 [视频流水线 Demo](/demo/video-pipeline)，登录后输入 brief 即可一键跑通整条流水线。

---

## 四、商业要点

1. **Render Agent 垄断重算力**：调用方无 GPU → 按次高价收费
2. **数据与算力在平台**：调用方只传 script + asset refs，不传 TB 级素材
3. **多 License 串联**：每个 Agent 单独计费，Render 单价最高
4. **可扩展生态**：Script/Asset/Compliance 可第三方实现，Render 平台自营
