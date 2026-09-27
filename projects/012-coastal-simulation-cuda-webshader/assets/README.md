# 图片来源

`coastal-capabilities-overview.png` 是 2026-09-27 使用内置 image_gen 工具制作的中文能力总览，依据上游固定版本 `e5a80fe42b4eeba6c01de1467035bafd69592d3e` 与本地研究说明整理。覆盖核心能力、内部算法、可见效果、适用场景、个人价值和实现边界。图中的海岸配图是生成示意，不是运行截图。准确的内容依据与最终提示词见 [`coastal-capabilities-overview.prompt.md`](coastal-capabilities-overview.prompt.md)。

`capability-map.svg` 由本站基于上游 README 与 CREDITS 绘制，用于解释数据流、功能分工和模型边界；它不是原站截图，也不表示逐帧仿真结果。

引导区同时展示上述能力总图和三张已核验的真实运行截图：`online-reef-verification.png` 来自本站公开部署的 CUDA WebShader 移植版，展示新增礁石参与求解；`source-ocean-to-shore.jpg` 与 `source-wash-wet-sand.jpg` 来自原始 `iamtechartist/coastal-simulation` 在线演示的两个预设视角。后两张从 008 项目保留的实拍截图复制，分别展示整体海岸和湿沙水际线。页面会分别标明“GPU 移植版”和“原版”，不会把它们写成同一个版本的画面。

- GPU 移植版：[SamG-Coder 源库](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader) · [本站公网验证记录](../notes/deployment.md)。`online-reef-verification.png` 包含本站演示页面界面，海岸画面为源库实际渲染。
- 原始库：[iamtechartist 源库](https://github.com/iamtechartist/coastal-simulation) · [008 截图采集与来源](../../008-coastal-simulation/assets/README.md)。两张 JPEG 于 2026-09-27 在原始库在线演示中按预设视角采集，保留原站控制栏，未由生成工具重绘。
