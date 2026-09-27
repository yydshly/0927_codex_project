# 研究记录与证据

[返回概览](../README.md) · [统计记录](../data/source-summary.json)

## 基线信息

- 日期：2026-09-26。
- 上游：[pallavi-shekhar/ai-engineering-interview-questions-company-wise](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise)。
- 提交：14c0106e2794bd4d355e6a9145b375a19b912bac；提交时间 2026-09-19 10:40:41 UTC。
- 提交说明：Update README.md。
- 许可证：已读取该提交的 LICENSE，为 Apache License 2.0，保留 [副本](UPSTREAM-LICENSE.txt)。
- 方法：页面阅读、GitHub 公开 API 核对提交与文件树、解析固定 README。
- 环境：Windows、PowerShell、Python 3.10，统计仅用标准库。
- 研究问题：提供什么能力、包含什么、适合什么场景、需要补充什么。

## 文件与功能核对

[固定版本文件树](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/tree/14c0106e2794bd4d355e6a9145b375a19b912bac)包含四个文件：.gitattributes、LICENSE、README.md、assets/banner.png，以及 assets 目录。

本版本没有应用源代码、依赖清单、启动入口或测试套件。题干要求实现组件，不代表已有实现。本次没有启动上游应用，也没有逐题完成工程验证。

## 统计方法

1. 只统计通用题区和五个公司分组。
2. 使用三级标题识别通用主题或公司章节，排除 License 等非题库标题。
3. 无缩进短横线加空格开头的列表项计为一条题目；一条含多个子问题仍计一条。
4. 题目下有 Answer: 且带 HTTP(S) Markdown 链接，才标记附答案。
5. 排除目录、使用说明、社交链接、Asked at: 与答案子列表。
6. 不进行语义去重，不按问号拆题，不将一行的多个答案链接记作多条答案。

| 区域 | 章节 | 题目条目 | 附答案 | 未附答案 |
| --- | ---: | ---: | ---: | ---: |
| 通用主题 | 10 | 119 | 81 | 38 |
| 公司 / 分组 | 35 | 479 | 151 | 328 |
| 合计 | 45 | 598 | 232 | 366 |

附答案比例为 232 / 598 ≈ 38.8%，表示链接覆盖情况，不表示知识覆盖率或质量。公司章节题量不含通用题区对该公司的关联条目。

README 开头称覆盖 35 家公司；实际目录有 35 个公司或公司分组章节，一个章节合并了六家公司。本项目采用可复核的“章节”口径。

[统计文件](../data/source-summary.json)保留每节标题、行号、原文锚点、题量和附答案数量，并记录 README 的 SHA-256。

## 证据边界

| 类型 | 本次处理 |
| --- | --- |
| 文件、章节、链接标记、许可证与版本 | 已直接读取和统计 |
| 公司岗位、面试流程、公司题目归属 | 按上游整理记录，未逐条独立核验 |
| 外部答案正确性与可访问性 | 未逐条验证 |
| 学习路线、练习目标与模拟面试 | 本项目建议，不是上游功能 |
| 求职效果与通过率 | 未测试，不作推断 |

## 来源

- [固定 README](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md)：结构、内容和作者说明。
- [使用说明](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/README.md#how-to-use-this)：公开面试经历、阅读顺序与答案补充。
- [上游 LICENSE](https://github.com/pallavi-shekhar/ai-engineering-interview-questions-company-wise/blob/14c0106e2794bd4d355e6a9145b375a19b912bac/LICENSE)：仓库许可证；外链内容分别判断。
- 具体原文入口：[能力地图](capability-map.md)、[公司索引](company-index.md)。

本地 upstream/ 保存下载的 README、LICENSE 与提交元数据，按总仓库规则忽略，不纳入正式提交材料。正式文档通过固定链接和统计记录即可核对，不依赖本地快照。

## 更新步骤

1. 获取新提交、文件树与 README，记录研究日期。
2. 按上述口径重算；若文档结构变化，先调整统计方法。
3. 核对新增、删除和重命名的主题与公司章节。
4. 同步概览、能力地图、公司索引与统计文件。
5. 如验证答案，另记链接、日期、结果和依据。
6. 同步总仓库首页，检查元数据与文档链接。

“已完成”对应本次能力整理与资料汇总；答案审校和工程练习未纳入验证范围。

## 网页导览补充（2026-09-26）

根据后续需求，将研究成果实现为中文静态网页。10 个模块支持展开阅读，4 条岗位路线支持切换，35 个公司章节按五组展示。题量与公司元数据直接读取本项目统计文件；导读和岗位路线为本项目独立整理。

已进行浏览器交互、桌面与移动布局、来源链接映射和静态子路径验证，详见 [网页说明与验证记录](../web/README.md)。这只验证本地导览功能，不表示上游提供了相同应用，也不增加外部答案的已验证范围。当前仅本地预览，尚未在线发布。
