# 越狱提示词库总览图制作说明

最终交付：[高清 PNG](jailbreaks-overview.png) · [可编辑 SVG](jailbreaks-overview.svg)，尺寸 1800 × 2780 像素。

最初尝试内置 image_gen 两次，均因网络错误未返回图片。最终使用直接文字与矢量排版完成，并逐项核对中文、模型名称和数量。未使用需要 API 密钥的 CLI 生成通道。下方保留原始设计提示词，供后续复用。

图中模型名称按固定提交的文件名称归类，不构成官方版本适配或越狱有效性声明。

依据：[来源清单](../data/source-index.json)、[完整文件目录](../notes/inventory.md)、[仓库固定提交](https://github.com/togg53192-cmd/jailbreaks/tree/e5130bbcc1e183a207126bdfe2fa41d1ba46df81)。本项目未调用模型进行越狱评测。

## 信息图设计提示词

```text
Use case: infographic-diagram.
Create ONE finished Chinese editorial infographic, a high-resolution portrait information poster approximately 1800 × 2600 pixels, large enough to read the supplied Chinese text clearly when opened. This is a factual research summary of an existing GitHub repository, not an advertisement and not a jailbreak instruction sheet. Show NO executable jailbreak payload, no weapons, no hacking terminal, no scary hooded person, no fabricated success numbers or verified badges. All text must be accurate, typeset, clean and readable; Chinese sans serif with bold headings. No gibberish, no decorative English filler.

Visual style: refined modern research report, light ivory/off-white background, deep navy text, saturated indigo headings and emphasis, subtle teal for research value, restrained amber for unknown evidence. Crisp simple vector-like icons and arrows. Flat front-facing full-bleed poster; no device, no desk, no mockup. Clear generous spacing, aligned modular grid. Number the five sections 01–05. Use the precise supplied text below, with intentional line breaks and hierarchy. Do not add new claims. Keep footnotes legible.

TOP: small eyebrow "开源项目研究 / 005"
Large title: "Jailbreaks 越狱提示词库"
Subtitle: "模型覆盖 · 越狱目标 · 本质原理 · 可能效果 · 对你的价值"
Prominent indigo thesis strip: "核心目标：让模型输出原本受规则限制的内容"
Under it a small comparison line: "普通提示词优化看任务质量；越狱看是否突破原有边界。"
Three compact metrics: "25 个文件"  "23 份实际提示词或配置"  "0 次模型实测"

SECTION 01: title "包含哪些模型？"
Small note "按文件标称名称归类，共 10 组；名称不代表适配验证。"
An elegant 2-column by 5-row roster, all ten groups must appear exactly once with the correct counts. Do NOT repeat, omit, or relabel groups. Model names should stand out bold and counts sit right-aligned. Supporting text below names can be smaller.
Row1:
"DeepSeek · 3 份" / "updated / v4 / 4-1"
"GLM / ZCode · 6 份" / "glm / ZCode / 5-3 / AGENTS / opencode"
Row2:
"Claude Opus / Sonnet · 4 份" / "Opus v1、v2 / Sonnet v1、v2"
"Kimi · 2 份" / "kimi / k3-agents"
Row3:
"Grok · 2 份" / "build / config"
"Muse · 2 份" / "spark 1.3 / ai-AGENTS"
Row4:
"Qwen · 1 份" / "另有 1 个空白 preferences 文件"
"GPT-oss · 1 份" / "GPT oss"
Row5:
"Gemma · 1 份" / "gemma4"
"MiMo · 1 份" / "mimo-2.6-agents"
Below roster note: "注意：deepseek v4 正文自述为 V3；GPT-oss 条目不等于已适配 ChatGPT。"
Count footnote: "23 份材料之外，另有 1 份 README 和 1 个空白文件。"

SECTION 02: title "它想实现什么能力？"
Three concise horizontal items with distinct simple icons:
"绕过拒绝" / "尝试获得原本受限的回答"
"扩大输出范围" / "涉及代码、创作等内容限制"
"持续影响会话" / "尝试让后续回答继续采用作者规则"
Small evidence note: "以上是作者目标，尚不是已验证能力。"

SECTION 03: title "本质原理：影响规则遵循"
A clear four-step flow with arrows:
"文本包装" → "主张新规则" → "诱导模型优先服从" → "可能改变输出"
Under the first node: "角色／创作背景／工作区约定"
Under the second node: "重定义允许范围与拒绝条件"
Under the third node: "尝试覆盖原有约束"
Under the fourth node: "是否成功取决于实际响应"
Important distinction box below the flow:
"改变回答行为 ≠ 获得真实权限"
"不会凭空增加工具、账号权限或模型知识；通常没有修改后台系统指令。"
Small note: "合法修改自有模型配置，属于配置变更，需与低权限输入越狱区分。"

SECTION 04: title "可能得到什么效果？"
Subtitle: "以下是结果类型，非本库实测成绩。"
Four cards in a 2×2 grid, not bar charts:
"实质越界" / "有证据证明违反原有边界，才算该次成功。"
"表面顺从" / "口头答应或语气改变，不等于越狱成功。"
"继续拒绝" / "模型保持原有限制，该次尝试未突破。"
"不稳定或未知" / "版本、上下文、入口变化可能使效果不同。"
A short amber line: "成功率未知；回答更多，也不代表更正确。"

SECTION 05: title "对你的价值是什么？"
Three numbered compact points:
"理解拒绝" / "区分知识不足、规则限制与误拒绝。"
"判断投入" / "与你想研究受限回答的关注点相关，但能否奏效仍未知。"
"研究与评估" / "用于比较越狱机制，以及测试自有系统的防护。"
Small project-relevance note: "本库没有直接提供无人机识别、控制等工程实现。"

BOTTOM evidence footer, visible and neat:
"结论：这是越狱尝试样本库，目的明确，实际效果待验证。"
"来源：github.com/togg53192-cmd/jailbreaks"
"固定提交 e5130bbcc1e1 · 原创整理 2026-09-27"
Design the entire information hierarchy so the title, 10-group roster, principle flow, and results comparison are easy to scan. Preserve the meaning and all names/counts exactly.
```
