# 011 · CUDA WebShader 展厅发布记录

- 正式入口：[一图总览](https://yydshly.github.io/0927_codex_project/011-cuda-webshader/#capability-map)
- 模块与用途：[研究摘要](https://yydshly.github.io/0927_codex_project/011-cuda-webshader/#understanding)
- 上游样例与应用推演：[50 项目录](https://yydshly.github.io/0927_codex_project/011-cuda-webshader/#catalog)
- 首次部署提交：`cd3df9128e0a514b361add5beb7452a4f0bef2d7`
- GitHub Actions：[Deploy research demos · 36322207782](https://github.com/yydshly/0927_codex_project/actions/runs/36322207782)，2026-09-27 成功。

发布前通过 11 个元数据与站点构建单元检查、011 的 JavaScript 语法检查、项目单独构建及完整 11 项站点构建。发布后核对：首页索引、011 页面、引导图 PNG 和摘要样式均返回 HTTP 200；首页包含项目入口，011 页面包含 `#understanding` 摘要。浏览器本地预览确认引导图和六项摘要卡片排版。

本站演示包括原创的 Canvas 画面与教学港湾模型；50 个 CUDA→WGSL→WebGPU 样例通过上游链接打开。发布验证不等于逐个复跑上游 GPU 样例、校验数值或测定目标设备性能。
