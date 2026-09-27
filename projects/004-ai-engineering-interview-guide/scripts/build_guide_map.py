"""Render the repository's one-page Chinese guide map as a high-resolution PNG."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = json.loads((ROOT / "data" / "source-summary.json").read_text(encoding="utf-8"))
OUTPUT = ROOT / "assets" / "ai-engineering-guide-map.png"

W, H = 2600, 4810
BG = "#F5F7FC"
WHITE = "#FFFFFF"
NAVY = "#112244"
INK = "#202D4A"
MUTED = "#5D6C87"
LINE = "#DFE6F2"
BLUE = "#3156D4"
PURPLE = "#704DB8"
TEAL = "#137C72"
AMBER = "#A96A25"

FONT_REG = "C:/Windows/Fonts/NotoSansSC-VF.ttf"
FONT_BOLD = "C:/Windows/Fonts/simhei.ttf"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


F_HERO = font(72, True)
F_SECTION = font(43, True)
F_CARD_TITLE = font(36, True)
F_BODY = font(27)
F_BODY_BOLD = font(27, True)
F_SMALL = font(23)
F_SMALL_BOLD = font(23, True)
F_TINY = font(20)
F_STAT = font(54, True)

image = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(image)


def rect(box, fill, radius=0, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def label(x, y, content, f=F_BODY, color=INK):
    draw.text((x, y), content, font=f, fill=color)


def wrap(content: str, f: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    current = ""
    for char in content:
        if char == "\n":
            lines.append(current.rstrip())
            current = ""
            continue
        candidate = current + char
        if current and draw.textlength(candidate, font=f) > max_width:
            lines.append(current.rstrip())
            current = char.lstrip()
        else:
            current = candidate
    if current:
        lines.append(current.rstrip())
    return lines


def wrapped(x, y, content, f=F_BODY, color=INK, max_width=900, line_height=39, max_lines=None):
    lines = wrap(content, f, max_width)
    if max_lines is not None and len(lines) > max_lines:
        raise ValueError(f"Text needs {len(lines)} lines (limit {max_lines}): {content}")
    for line in lines:
        label(x, y, line, f, color)
        y += line_height
    return y


def rule(x1, y, x2, color=LINE, width=2):
    draw.line((x1, y, x2, y), fill=color, width=width)


def section_head(n, title, y, aside=""):
    rect((110, y + 4, 165, y + 59), BLUE, 12)
    label(122, y + 13, n, F_BODY_BOLD, WHITE)
    label(188, y, title, F_SECTION, INK)
    if aside:
        tw = draw.textlength(aside, font=F_SMALL)
        label(W - 110 - tw, y + 18, aside, F_SMALL, MUTED)


MODULES = [
    ("01", "大模型原理与架构", "理解模型", PURPLE, 16, 15,
     ["注意力：Q/K/V、缩放、多头与 FlashAttention", "缓存与结构：KV Cache、MQA/GQA、MLA、MoE", "输入表示：BPE、位置编码、RoPE、归一化", "训练与生成：预训练、采样、长上下文失效"],
     "代表问题：KV Cache 保存什么？显存如何随并发增长？"),
    ("02", "推理服务与 GPU 性能", "走向生产", TEAL, 15, 12,
     ["计算阶段：Prefill / Decode 的资源瓶颈", "服务策略：连续批处理、分页/前缀缓存、推测解码", "资源方案：量化、并行、GPU 显存预算", "业务指标：TTFT、TPOT、吞吐、p99、成本与排障"],
     "代表问题：模型没变，p99 延迟翻倍，如何定位？"),
    ("03", "RAG 与知识检索", "构建应用", BLUE, 12, 7,
     ["知识处理：文档切分、表格与 PDF 解析", "召回排序：BM25、向量、混合检索、重排", "可信链路：权限过滤、索引更新、证据引用", "效果评估：分别衡量检索召回与生成忠实度"],
     "代表问题：回答不准确，是检索还是生成的问题？"),
    ("04", "Agent 与工具调用", "构建应用", BLUE, 12, 9,
     ["执行模式：ReAct、函数调用、结构化输出、MCP", "工具设计：接口描述、参数校验、选择策略", "状态管理：记忆、长任务、多 Agent 协作", "可靠性：超时重试、终止预算、审计、人工审批"],
     "代表问题：工具超时后如何重试，避免重复写入？"),
    ("05", "微调、后训练与对齐", "理解模型", PURPLE, 12, 11,
     ["微调技术：LoRA、QLoRA、全量微调与显存", "偏好优化：RLHF、DPO、GRPO、可验证奖励", "训练风险：灾难性遗忘、奖励投机与蒸馏", "方案选择：提示词、RAG、微调的质量与成本"],
     "代表问题：何时选提示词、RAG 或微调？"),
    ("06", "评估与可观测性", "走向生产", TEAL, 10, 4,
     ["离线评估：样本集、无标签场景、模型裁判偏差", "质量问题：幻觉、引用错误、基准污染", "发布决策：回归门槛、A/B、提示词版本回滚", "线上观察：追踪、成本、反馈与 Agent 行为"],
     "代表问题：分数提高，用户却说变差，如何验证？"),
    ("07", "安全与责任", "走向生产", TEAL, 10, 5,
     ["攻击入口：直接/间接提示注入、越狱", "执行边界：工具权限、数据外泄、输入输出防护", "数据治理：个人信息、日志与训练数据", "审查方法：红队、群体差异与可解释性"],
     "代表问题：恶意网页怎样诱导 Agent 泄露资料？"),
    ("08", "多模态与语音", "理解模型", PURPLE, 10, 5,
     ["视觉输入：图像、视频进入语言模型的方式", "语音链路：VAD → ASR → LLM → TTS", "实时交互：流式输出、缓冲与用户打断", "质量评估：WER、语音合成、说话人区分"],
     "代表问题：实时语音助手的响应时间花在哪里？"),
    ("09", "AI 系统设计", "走向生产", TEAL, 10, 4,
     ["企业场景：权限化 RAG、代码助手、客服 Agent", "信息系统：语义搜索、文档智能、Text-to-SQL", "平台能力：LLM 网关、路由、缓存与故障切换", "规模约束：数据量、延迟、成本与验收标准"],
     "代表问题：如何设计千万级文档的企业问答？"),
    ("10", "编程与数据结构", "构建应用", BLUE, 12, 9,
     ["模型组件：Attention、GQA、KV Cache、BPE、采样", "基础结构：LRU+TTL、分布式限流", "数据管道：异步批处理、SSE、语义切分", "最小系统：相似度检索与 Agent 循环"],
     "代表问题：从零实现带因果掩码的注意力。"),
]

assert len(MODULES) == SOURCE["totals"]["common_topics"]
assert sum(row[4] for row in MODULES) == SOURCE["totals"]["common_question_entries"]

# Header
rect((0, 0, W, 445), NAVY)
label(110, 54, "AI ENGINEERING  /  REPOSITORY FIELD GUIDE", F_SMALL_BOLD, "#99ADEA")
label(110, 104, "AI 工程面试题库｜一图读懂", F_HERO, WHITE)
wrapped(110, 203, "它提供什么、具体包含哪些题、如何按目标练习，以及这份题库对你的意义。", font(32), "#DCE5FF", 2290, 46, 2)
stats = [
    ("598", "题目条目"), ("10", "通用技术模块"),
    ("35", "公司/分组章节"), ("232", "道题附参考链接"),
]
for i, (value, title) in enumerate(stats):
    x = 110 + i * 610
    rect((x, 296, x + 570, 408), "#1E345F", 18)
    label(x + 25, 310, value, F_STAT, WHITE)
    label(x + 184, 337, title, F_SMALL, "#C9D7F6")

# Identity and abilities
rect((110, 480, 847, 770), WHITE, 22, LINE, 2)
label(144, 504, "这个库的本质", F_SMALL_BOLD, BLUE)
label(144, 548, "面试题库 + 学习索引", F_CARD_TITLE, INK)
wrapped(144, 610, "以 README 汇总公开面试经历中的问题，按主题和公司组织，并为部分题目链接外部参考。", F_BODY, MUTED, 670, 41, 3)
label(144, 724, "边界：不提供模型服务、自动评分或完整标准答案。", F_SMALL, MUTED)

ability_tiles = [
    ("定位范围", "用 10 个主题发现应学内容"),
    ("聚焦公司", "用 35 个章节贴近岗位语境"),
    ("驱动练习", "用概念/编程/设计题检验能力"),
    ("延伸阅读", "为部分问题连接外部资料"),
]
for i, (title, detail) in enumerate(ability_tiles):
    col, row = i % 2, i // 2
    x, y = 879 + col * 808, 480 + row * 151
    rect((x, y, x + 775, y + 139), WHITE, 20, LINE, 2)
    rect((x + 24, y + 29, x + 33, y + 110), BLUE, 4)
    label(x + 53, y + 20, title, F_CARD_TITLE, INK)
    label(x + 53, y + 77, detail, F_SMALL, MUTED)

section_head("01", "10 个通用内容模块", 810, "119 道通用题 · 81 道附参考链接")
label(110, 878, "色条标识学习层次：紫色理解模型 · 蓝色构建应用 · 青色走向生产。", F_SMALL, MUTED)

MODULE_TOP = 930
CARD_W, CARD_H, GAP_X, GAP_Y = 1155, 354, 30, 21
for index, item in enumerate(MODULES):
    number, title, category, accent, count, linked, bullets, example = item
    col, row = index % 2, index // 2
    x = 110 + col * (CARD_W + GAP_X)
    y = MODULE_TOP + row * (CARD_H + GAP_Y)
    rect((x, y, x + CARD_W, y + CARD_H), WHITE, 20, LINE, 2)
    rect((x, y, x + 12, y + CARD_H), accent, 6)
    label(x + 34, y + 19, number, F_SMALL_BOLD, accent)
    label(x + 88, y + 15, title, F_CARD_TITLE, INK)
    count_text = f"{count} 题 · {linked} 题附链接"
    tw = draw.textlength(count_text, font=F_SMALL)
    label(x + CARD_W - 29 - tw, y + 26, count_text, F_SMALL, MUTED)
    label(x + 36, y + 77, category, F_SMALL_BOLD, accent)
    for bi, bullet in enumerate(bullets):
        label(x + 38, y + 116 + bi * 34, "•", F_BODY_BOLD, accent)
        label(x + 68, y + 116 + bi * 34, bullet, F_BODY, INK)
    rule(x + 36, y + 269, x + CARD_W - 32)
    wrapped(x + 36, y + 286, example, F_SMALL_BOLD, accent, CARD_W - 75, 30, 2)

COMPANY_TOP = MODULE_TOP + 5 * CARD_H + 4 * GAP_Y + 45
section_head("02", "公司专项内容", COMPANY_TOP, "479 道专项题 · 35 个章节")
label(110, COMPANY_TOP + 66, "公司章节还列出覆盖岗位、公开报道的面试流程与按主题归类的专项题。", F_SMALL, MUTED)

COMPANIES = [
    ("前沿 AI 实验室", "12 章 · 197 题", PURPLE,
     "Anthropic · OpenAI · Google DeepMind/Google AI · Meta · xAI · Mistral AI · Cohere · DeepSeek\nMoonshot AI (Kimi) · Zhipu AI (GLM) · Alibaba (Qwen) · Sarvam AI",
     "题向示例：模型结构、训练与对齐、推理、评估、安全、研究判断。"),
    ("AI 原生产品", "10 章 · 114 题", BLUE,
     "Cursor · Cognition (Devin/Windsurf) · Sierra · Harvey · Glean · Character.AI · ElevenLabs · Abridge · Figure AI · Waymo",
     "题向示例：代码 Agent、企业知识、语音交互、产品可靠性。"),
    ("大型科技与互联网公司", "6 章 · 82 题", TEAL,
     "Microsoft · Amazon (AWS) · Apple · NVIDIA · Tesla · 消费互联网合并章：Uber、Netflix、LinkedIn\nAirbnb、Pinterest、Spotify",
     "题向示例：云与平台、规模化 ML、GPU 性能、系统设计。"),
    ("AI 基础设施与平台", "6 章 · 66 题", TEAL,
     "Databricks · Groq · Together AI · Hugging Face · Scale AI · Perplexity",
     "题向示例：模型部署、推理效率、数据管道、检索与评估。"),
    ("企业交付与应用", "1 章 · 20 题", AMBER,
     "Palantir：代码与数据处理、RAG、Agent、系统设计、客户场景与行为题。",
     "题向示例：把技术方案落到客户数据和业务约束。"),
    ("公司题补充的方向", "跨公司出现", AMBER,
     "机器学习/深度学习基础；客户场景与交付；行为与文化。",
     "阅读提醒：题目是公开经历整理，不是官方试题清单。"),
]

COMPANY_Y = COMPANY_TOP + 121
COMPANY_H = 258
for index, (title, count, accent, names, topics) in enumerate(COMPANIES):
    col, row = index % 2, index // 2
    x = 110 + col * (CARD_W + GAP_X)
    y = COMPANY_Y + row * (COMPANY_H + 21)
    rect((x, y, x + CARD_W, y + COMPANY_H), WHITE, 18, LINE, 2)
    rect((x + 26, y + 25, x + 35, y + 65), accent, 4)
    label(x + 54, y + 16, title, F_CARD_TITLE, INK)
    tw = draw.textlength(count, font=F_SMALL)
    label(x + CARD_W - 30 - tw, y + 29, count, F_SMALL, accent)
    wrapped(x + 29, y + 81, names, F_SMALL, MUTED, CARD_W - 60, 32, 3)
    rule(x + 29, y + 185, x + CARD_W - 30)
    wrapped(x + 29, y + 199, topics, F_SMALL_BOLD, accent, CARD_W - 60, 31, 2)

USES_TOP = COMPANY_Y + 3 * COMPANY_H + 2 * 21 + 44
section_head("03", "什么时候用 / 对你有什么意义", USES_TOP)

PANEL_Y, PANEL_H = USES_TOP + 83, 475
for x in (110, 1295):
    rect((x, PANEL_Y, x + CARD_W, PANEL_Y + PANEL_H), WHITE, 20, LINE, 2)
label(143, PANEL_Y + 21, "适用场景", F_CARD_TITLE, INK)
label(1328, PANEL_Y + 21, "你最终获得的能力证据", F_CARD_TITLE, INK)

USE_ROWS = [
    ("目标公司求职", "通用题 → 目标公司章节 → 项目复盘"),
    ("转向 AI 工程", "按主题找薄弱项，从原理走向小实现"),
    ("现有项目查漏", "用故障、权限、性能与评估题检验方案"),
    ("团队讨论/模拟面试", "用题干追问取舍，另定评价标准"),
]
MEANING_ROWS = [
    ("知道学什么", "把岗位能力拆成可选择的知识清单"),
    ("知道能否讲清", "独立解释原理、边界与替代方案"),
    ("知道能否做出", "留下代码、架构草图和评测记录"),
    ("知道下一步", "把答不上来的题变成具体补课任务"),
]
for rows, x in ((USE_ROWS, 143), (MEANING_ROWS, 1328)):
    for i, (title, detail) in enumerate(rows):
        y = PANEL_Y + 87 + i * 95
        rect((x, y + 5, x + 44, y + 49), "#EAF0FF", 12)
        label(x + 11, y + 10, str(i + 1), F_SMALL_BOLD, BLUE)
        label(x + 63, y - 3, title, F_BODY_BOLD, INK)
        label(x + 63, y + 37, detail, F_SMALL, MUTED)

FLOW_Y = PANEL_Y + PANEL_H + 31
rect((110, FLOW_Y, 2490, FLOW_Y + 145), "#EAF0FF", 20)
label(140, FLOW_Y + 13, "建议使用顺序", F_SMALL_BOLD, BLUE)
steps = ["① 选岗位/目标公司", "② 先做通用题", "③ 再做专项题", "④ 自答、实现、验证、复盘"]
step_x = [140, 670, 1180, 1655]
for i, (x, step) in enumerate(zip(step_x, steps)):
    label(x, FLOW_Y + 62, step, F_BODY_BOLD, INK)
    if i < 3:
        label(step_x[i + 1] - 49, FLOW_Y + 62, "→", F_BODY_BOLD, BLUE)

FOOT_Y = FLOW_Y + 168
rule(110, FOOT_Y, 2490)
wrapped(110, FOOT_Y + 22,
        "口径与边界：统计基于上游固定提交 14c0106（2026-09-26 研究快照）；每个问题列表项算一题，可能含多个子问。232 道题附外部参考链接，不表示答案完整或经过核验。图中题向和示例问题经归纳。公司面试流程可能随团队、级别、地区变化。",
        F_TINY, MUTED, 2360, 31, 3)
label(110, H - 53, "来源：github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise", F_TINY, MUTED)
label(2280, H - 53, "RESEARCH NOTE 004", F_TINY, BLUE)

if FOOT_Y + 116 > H - 60:
    raise ValueError("Footer overlaps canvas edge")

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
image.save(OUTPUT, optimize=True)
print(f"Created {OUTPUT} ({W}×{H})")
