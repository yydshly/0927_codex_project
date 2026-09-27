# 012 · 正式发布记录

发布与验证日期：2026-09-27。沿用本仓库的 GitHub Pages，包含此前已经上线的 001—011。

## 入口与版本

- [能力与理解汇总](https://yydshly.github.io/0927_codex_project/012-coastal-simulation-cuda-webshader/#summary)
- [完整引导图](https://yydshly.github.io/0927_codex_project/012-coastal-simulation-cuda-webshader/#guide-map)
- [源库三维场景与礁石对照](https://yydshly.github.io/0927_codex_project/012-coastal-simulation-cuda-webshader/extensions.html)
- [首次发布提交 c88d88c](https://github.com/yydshly/0927_codex_project/commit/c88d88c27409b75ed8aeeef43e5d29a915fb6bc5)
- [Pages 部署成功](https://github.com/yydshly/0927_codex_project/actions/runs/36323444432) · [仓库检查成功](https://github.com/yydshly/0927_codex_project/actions/runs/36323444380)
- 固定源库：`SamG-Coder/coastal-simulation-cuda-webshader@e5a80fe42b4eeba6c01de1467035bafd69592d3e`。

## 公网核验

| 对象 | 实际结果 |
| --- | --- |
| 统一首页与 012 页面 | HTTP 200；七项摘要完整显示：能力、呈现效果、内部模块、内部算法、使用场景、可扩展产品方向、对我的意义 |
| 引导图 | 采用本次讨论生成的 PNG；导览原图与首页封面内容一致，原图可单独打开 |
| 源库运行资源 | 演示页、父页控制、两个 CUDA 源文件、编译器、运行时、初始快照、许可及 Three.js 资源地址均响应成功 |
| 原版三维场景 | 公网显示 `WebGPU / CUDA WebShader 已运行`，可见水面、岩石、泡沫与岸线 |
| 新增礁石 | 公网显示 `WebGPU 已运行 · 新礁石参与求解`，前景出现新增岩石，水面与泡沫持续更新；切回原版后同视角不再有该岩石 |
| 二维诊断 | 从三维切换后显示 `运行中` 与 `160 × 90 单元已就绪`；返回源库模式可重新加载 |
| 浏览器错误 | 上述运行过程未观察到 error / warn 日志 |

引导图 SHA-256：`377b65f80150a60716a492c72615c0e37cb8410aeb7ac8c579309d3b247056c0`。

首次访问曾较长时间停留在初始化；资源随后响应成功，切换并重新进入后原版和礁石场景均运行。此记录不提供启动时长或跨设备性能承诺。截图中的 FPS 是当时页面显示值，不作为基准结果。

![公网新增礁石实际画面，状态显示 WebGPU 已运行；此图是运行记录，不替代引导图](../assets/online-reef-verification.png)

## 理解与产品边界

主要能力是海岸浅水与固定环境的接触、阻挡、绕流、冲滩和退水。浅水算法更新状态，视觉算法表现浪、泡沫、湿润、短波和喷溅，GPU 执行并行计算及绘制。岩石不会随水运动，也未实现移动刚体双向作用、侵蚀或任意三维水体。

012 已集成源库视觉效果、七项中文摘要、能力总图和单处礁石验证；二维数据诊断独立运行。可配置的海岸编辑器、场景保存与分享、互动背景和教学工具是下一步产品方向。自由地形尚未接入源库三维场景。

[提交范围与本地检查](submission.md) · [完整理解](understanding.md) · [来源与研究证据](research.md)
