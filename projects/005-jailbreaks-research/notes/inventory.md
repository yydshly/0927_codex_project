# 文件清单与分类

[项目概览](../README.md) · [机器可读来源清单](../data/source-index.json)

研究版本：[`e5130bbcc1e1`](https://github.com/togg53192-cmd/jailbreaks/tree/e5130bbcc1e183a207126bdfe2fa41d1ba46df81)。
共 25 个文件、324,191 字节；其中 23 个有实际提示词或配置内容，另有 README 和一个空白文件。

分类依据是文件的主要呈现形式，各类内容可能重叠；这是本项目的整理方法，不是上游官方分类。

| 类型 | 数量 |
| --- | ---: |
| 运行规范 | 12 |
| 配置封装 | 3 |
| 仓库说明 | 1 |
| 创作语境 | 4 |
| 工作区约定 | 4 |
| 空白占位 | 1 |

## 全量清单

每个来源链接固定到同一个提交。名称保留原始大小写；“行数”按文本逻辑行统计，不额外计算结尾换行之后的空行。

| 文件与来源 | 类型 | 字节 | 行数 | 内容说明 |
| --- | --- | ---: | ---: | --- |
| [Deepseek updated.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/Deepseek%20updated.md) | 运行规范 | 12,683 | 166 | 角色、工作环境、输出质量和拒绝处理规则。 |
| [GLM ZCODE.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/GLM%20ZCODE.md) | 运行规范 | 3,580 | 52 | 以 SYSTEM 标记和 ZCode 会话约定包装指令；与另一大小写近似文件内容不同。 |
| [GPT oss](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/GPT%20oss) | 配置封装 | 7,091 | 122 | 包含 FROM、SYSTEM 和 PARAMETER 指令形式；正文声称具有平台授权，未独立证实。 |
| [Glm Zcode.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/Glm%20Zcode.md) | 运行规范 | 13,008 | 169 | 较长的 GLM / ZCode 角色及内容规则；不是大写同名文件的副本。 |
| [Grok build](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/Grok%20build) | 运行规范 | 8,018 | 96 | 包含任务分类的伪代码和输出标准；未发现可运行的 Agent 实现。 |
| [Muse spark 1.3.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/Muse%20spark%201.3.md) | 运行规范 | 15,820 | 366 | 部署规范形式；多行带有转义符或标题前缀。 |
| [README.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/README.md) | 仓库说明 | 39 | 2 | 仅说明这是作者的越狱合集，未提供使用文档或评测结果。 |
| [Sonnet v2](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/Sonnet%20v2) | 创作语境 | 8,048 | 46 | 通过作者身份、创作范围和协作偏好建立上下文。 |
| [deepseek v4](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/deepseek%20v4) | 运行规范 | 13,120 | 210 | 文件名含 v4，但正文模型自述为 DeepSeek-V3；不能据此确认适配版本。 |
| [deepseek-4-1.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/deepseek-4-1.md) | 运行规范 | 14,788 | 120 | 以十节助手规范组织角色、内容规则、推理要求和会话约定。 |
| [gemma4](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/gemma4) | 配置封装 | 13,045 | 218 | 包含 FROM / SYSTEM 包装和参数设置；未测试其运行时兼容性。 |
| [glm](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/glm) | 运行规范 | 13,737 | 224 | 通用角色、任务分类、内容边界和输出要求。 |
| [glm-5-3-flash.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/glm-5-3-flash.md) | 运行规范 | 26,328 | 207 | 在运行规范中加入工具使用、版本控制及作者编写的推理示例。 |
| [glm-zcode-AGENTS.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/glm-zcode-AGENTS.md) | 工作区约定 | 3,216 | 60 | 仿照 AGENTS.md，使用授权表格和工程标准表达工作区规则。 |
| [glm5-3opencode.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/glm5-3opencode.md) | 运行规范 | 20,563 | 158 | 在通用规范中增加 Agent 行为、文件编辑、命令验证和多步任务约定。 |
| [grok-config.txt](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/grok-config.txt) | 配置封装 | 4,000 | 41 | XML 风格标签组织上下文、优先级、任务分类和输出要求；未验证解析器。 |
| [kimi](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/kimi) | 运行规范 | 13,025 | 209 | 以 Kimi 身份组织通用任务、拒绝和回答风格规则。 |
| [kimi-k3-agents.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/kimi-k3-agents.md) | 工作区约定 | 14,724 | 158 | 以工作区运行档案包装定义、任务范围、输出和会话规则。 |
| [mimo-2.6-agents.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/mimo-2.6-agents.md) | 工作区约定 | 15,727 | 132 | 助手规范、工具行为和作者编写的推理示例。 |
| [muse-ai-AGENTS.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/muse-ai-AGENTS.md) | 工作区约定 | 15,747 | 132 | 以环境运行规范组织角色、内容、工具行为及示例。 |
| [opus v1](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/opus%20v1) | 创作语境 | 19,636 | 55 | 较长的作者背景、创作方向及合作偏好陈述。 |
| [opus v2](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/opus%20v2) | 创作语境 | 26,554 | 66 | 结合文学论述和写作风格要求建立较长上下文。 |
| [qwen](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/qwen) | 运行规范 | 36,774 | 740 | 混合自然语言规范、词汇重定义和 XML 风格配置段。 |
| [qwen-preferences.md](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/qwen-preferences.md) | 空白占位 | 1 | 1 | 仅有一个换行字节，没有实际偏好规则。 |
| [sonnet v1](https://github.com/togg53192-cmd/jailbreaks/blob/e5130bbcc1e183a207126bdfe2fa41d1ba46df81/sonnet%20v1) | 创作语境 | 4,919 | 33 | 以创作合作偏好组织的较短前置文本。 |

## 阅读时需要注意的细节

- `GLM ZCODE.md` 与 `Glm Zcode.md` 是两个不同的 Git 对象，仅路径大小写不同。在通常不区分大小写的 Windows 文件系统中直接检出可能冲突；本次按 Git blob 标识读取，分别保留元数据。
- `qwen-preferences.md` 为 1 字节换行，不能计为一份可用偏好配置。
- 文件名、自述模型身份、知识截止日期与“已授权”等表述均来自作者文本，不代表模型供应商确认。
- `GPT oss`、`gemma4` 含配置指令；`grok-config.txt` 使用标签包装。配置文本的存在不代表配置已加载或产生效果。
- `Worked reasoning traces` 一类章节是作者写入的示例，不能当作从模型内部提取的真实推理记录。
- 本次完成全量目录、内容开头与章节结构核对，并分析代表性片段；不声称对每个段落都做了语义审计。

## 核验数据

来源清单记录每个文件的 Git blob SHA、SHA-256、UTF-8 字节数和固定提交链接。读取内容重新计算的 Git blob SHA 与 GitHub 对象标识逐一匹配。
校验能确认本次读取内容与指定 Git 对象一致；不能证明提示词有效、授权声明真实或内容事实正确。
