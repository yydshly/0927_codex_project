# 能力地图

[返回概览](../README.md) · [公司索引](company-index.md) · [使用指南](usage-guide.md)

## 如何理解能力

资料本身提供公司、主题和学习链接索引。读者可以借助问题训练模型原理、组件实现、系统设计、排障、成本性能取舍及项目表达；是否掌握需要练习和反馈验证。

以下只统计通用题区；附答案指条目有外部答案链接。练习目标为本项目建议。

| 主题 / 原文 | 题目 | 附答案 | 建议练习目标 |
| --- | ---: | ---: | --- |
| [大模型原理与架构](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#llm-internals-and-architecture) | 16 | 15 | 用公式、张量形状或示意图解释模型计算 |
| [推理服务与 GPU 性能](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#inference-serving-and-gpu-performance) | 15 | 12 | 估算显存和吞吐，解释优化假设与测量方法 |
| [RAG 与检索](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#rag-and-retrieval) | 12 | 7 | 拆分检索与生成评估，说明权限和索引更新 |
| [Agent 与工具调用](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#agents-and-tool-use) | 12 | 9 | 设计有状态、错误处理、预算和终止条件的流程 |
| [微调、后训练与对齐](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#fine-tuning-post-training-and-alignment) | 12 | 11 | 根据任务、数据和预算说明训练方案取舍 |
| [评估与可观测性](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#evaluation-and-observability) | 10 | 4 | 把效果判断变成可重复的评估和上线标准 |
| [安全与责任](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#safety-security-and-responsible-ai) | 10 | 5 | 识别权限边界、攻击入口和失效路径 |
| [多模态与语音](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#multimodal-speech-and-voice-ai) | 10 | 5 | 拆分实时交互的质量指标和延迟预算 |
| [AI 系统设计](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#ai-system-design) | 10 | 4 | 从业务约束推导架构、数据流和验证方案 |
| [编程与数据结构](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#coding-and-data-structures) | 12 | 9 | 完成小规模实现，验证正常和异常输入 |
| **合计** | **119** | **81** | — |

具体知识点见 [概览](../README.md)，机器可读统计见 [统计记录](../data/source-summary.json)。

## 公司专项题的补充价值

公司章节把通用知识放入具体产品、客户、规模和研究方向下。除十个通用主题，还出现以下方向，并非每家公司都有：

| 补充方向 | 主要价值 | 建议形成的材料 |
| --- | --- | --- |
| 机器学习与深度学习基础 | 检查统计、损失函数、泛化和建模基础 | 解释公式含义与适用条件的笔记 |
| 客户场景与交付 | 把模糊需求转成范围、方案和验证步骤 | 包含约束与验收标准的方案简报 |
| 行为与文化 | 讨论项目责任、合作、判断和复盘 | 能说明个人贡献与决策依据的真实案例 |

公司条目数量不包含通用题区对该公司的关联。阅读公司章节时还要查看 Also prepare 指向的通用主题。

## 从阅读到能力验证

- 想知道“学什么”：读题干，标记陌生概念和薄弱环节。
- 想知道“能否说清”：先独立回答，再补证据和反例。
- 想知道“能否实现”：选小题编码或计算，记录结果与边界。
- 想知道“能否取舍”：列出假设、约束、替代方案和验证方法。

题量和答案链接比例不能直接代表主题重要程度，也不能作为读者能力评分。
