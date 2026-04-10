# LLM 幻觉与 Grounded 生成相关论文

本目录收录与「最小幻觉 + 允许联想」相关的学术论文，用于人生 Agent 回答质量优化参考。

| 文件名 | arXiv | 简要说明 |
|--------|-------|----------|
| HalluGuard-Data-Reasoning-Driven-Hallucinations.pdf | 2601.18753 | 区分知识型与推理型幻觉，分别给出缓解策略 |
| Generation-Time-vs-Post-hoc-Citation.pdf | 2509.21557 | 生成时引用 vs 事后引用，高价值场景推荐 G-Cite |
| Ground-Every-Sentence-ReClaim.pdf | 2407.01796 | 交替生成「引用 + 论断」，长文 citation 准确率 ~90% |
| CiteGuard-Faithful-Citation-Attribution.pdf | 2510.17853 | Retrieval-Augmented Validation 保证引用忠实 |
| FRONT-Fine-grained-Grounded-Citations.pdf | 2408.04568 | 先选支持性引用再生成，citation 质量 +14% |
| Survey-Hallucination-in-LLMs.pdf | 2510.06265 | 幻觉成因、检测与缓解的综述 |
| Learning-to-Route-Rule-Driven-Hybrid-Source-RAG.pdf | 2510.02388 | 规则驱动路由 + 多源 RAG，混合流水线核心论文 |
| Chain-of-Thought-Prompting.pdf | 2201.11903 | 思维链 prompting，提升多步推理与逻辑任务 |
| ReAct-Reasoning-Acting.pdf | 2210.03629 | 推理与行动交替，Agent 结合工具减少无据编造 |

## 相关资源

- **FACTS Grounding**：Google DeepMind 基准，区分事实型与推理型任务
- **SAFE**：Search-Augmented Factuality Evaluator，逐条事实验证

## 下载脚本

运行 `scripts/assets/download-papers.ps1` 可重新下载所有论文。
