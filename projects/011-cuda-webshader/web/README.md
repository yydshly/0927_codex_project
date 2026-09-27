# CUDA WebShader 能力与效果展厅

静态中文研究页面。顶部沿用一张高清引导图，按算法、效果、现实用途和个人价值归纳上游 50 项样例。紧接着的研究摘要分别说明可见效果、上游内部模块、算法家族、使用条件、产品方向和个人实验路线。随后用海岸展示、照片处理、扫描数据和互动粒子四个任务说明输入、库的计算与可用结果，再进入作者的三维 GPU 海岸作品。本站港湾模型和十二个 Canvas 样机均非原库运行结果。三维海岸是相同作者的独立应用，需要联网和 WebGPU。

在仓库根目录运行：

    python projects/011-cuda-webshader/web/build.py
    python -m http.server 4328 --bind 127.0.0.1 --directory dist

打开 http://127.0.0.1:4328/011-cuda-webshader/ 。

页面文件和目录离线可用；真实 GPU 样例需要网络及支持 WebGPU 的浏览器。iframe 可能被浏览器或上游站点策略阻止，此时使用独立窗口链接。页面不能跨站判断 GPU 管线是否实际成功运行。

文件：

- catalog.json：2026-09-27 上游目录快照、中文摘要、规模与直达链接。
- applications.json：对应 50 个样例的现实用途推演、采用时机和输入结果；与上游目录快照分开存放。
- app.mjs：搜索、筛选、样例切换与按需预览。
- prototypes.mjs、prototypes-extra.mjs 和 prototypes.css：十二个算法视觉样机、筛选控制及展示样式。
- coastal-scene.mjs 和 coastal-scene.css：简化二维浅水波港湾模型、泡沫示踪、三种视图、控件及样式。
- coastal-reference.jpg：来自项目 008 原版 coastal-simulation 的浏览器截图，作为三维海岸入口预览；不是 CUDA 移植版截图，来源见项目 008 的 provenance.json。
- capability-map.png：前一轮生成的 CUDA WebShader 算法、效果、现实用途与个人价值引导图；根目录 assets 中有同一图的首页封面副本。
- basics.css：顶部的能力职责链、海浪例子、实际任务卡片和支持边界样式。
- understanding.css：六个问题的研究摘要布局。
- use-guide.css：样例用途卡片与“什么时候用”指南样式。
- index.html 和 styles.css：页面结构与响应式样式。
- build.py：验证目录数量、唯一 ID 与链接格式后复制为静态产物。

项目研究依据见 [上一级研究笔记](../notes/research.md)。
