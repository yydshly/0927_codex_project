# 011 · CUDA WebShader 能力与效果展厅

> **一句话：**这是一套把受支持的 CUDA C 计算核函数带进浏览器 WebGPU 的工具。它提供计算能力，画面由样例或应用根据计算结果绘制。

[返回总索引](../../README.md) · [在线一图看懂](https://yydshly.github.io/0927_codex_project/011-cuda-webshader/#capability-map) · [模块与用途](web/index.html#understanding) · [上游样例目录](https://samg-coder.github.io/cuda-webshader/) · [研究笔记](notes/research.md)

![CUDA WebShader：算法、效果、现实用途与个人价值总览](assets/capability-map.png)

## 研究摘要

| 问题 | 结论 |
| --- | --- |
| **这个库的效果怎样？** | 上游 50 项公开样例可以呈现海浪、流体和粒子、图像滤波与运动、三维体数据、几何、路径追踪及数值结果。本站另做 12 个 Canvas 视觉样机和港湾教学模型，供理解目标画面；它们不是 CUDA WebShader 的输出。 |
| **内部包含什么模块？** | `src/compiler` 负责 CUDA 前端、WGSL 生成、Worker 和 CPU 对照；`src/runtime` 管理 WebGPU、缓冲区、调度计划和 Three.js 共享缓冲区；`src/sandbox` 提供编辑器、多步流程与预览；`src/demo` 是粒子实验；`kernels`、`showcases`、`tests`、`reports` 提供样例和验证。另有实验性 CPU/Wasm 后端。 |
| **内部算法有哪些？** | 按本站目录分为动态模拟 8、图像纹理 21、三维体数据 7、数值信号 10、几何渲染 4 项，包括 SPH、FFT 海洋、Sobel、光流、Marching Cubes、体渲染、排序、路径追踪等。它们是上游样例中的具体算法；库的核心仍是编译和运行。 |
| **什么时候用？** | 已有可被支持的 CUDA 计算，网页需要反复处理大量数据，并且能在目标 WebGPU 设备上验证正确性和性能时，适合做实时交互展示、图像/三维数据处理、算法教学或原生 CUDA 对照。 |
| **可扩展成什么产品？** | GPU 算法工作台、互动海岸与粒子视觉组件、网页图像分析工具、三维扫描数据浏览器。每个方向都需要接入真实数据、用户操作、结果导出和设备适配。 |
| **对我的意义是什么？** | 把 [Three.js 呈现](../006-threejs-gpu-rasterizer/README.md)、[海岸模型](../008-coastal-simulation/README.md)与[算法实验](../010-algorithm-scene-lab/README.md)连接为可验证的 GPU 数据流。先用一个粒子输运或高度场核函数做精度、画面和速度对照，再决定是否在产品中采用。 |

**边界：**CUDA WebShader 不会自动设计物理公式或生成写实场景，也不保证任意 CUDA 工程可以直接移植。工程预测还需要实测数据、模型校准和独立验证。上游 [README](https://github.com/SamG-Coder/cuda-webshader) 是内部结构与支持范围的依据；现实用途和产品方向是本站推演。

## 一句话看懂

开发者提供 CUDA C 核函数和输入数据；`cuda-webshader` 将**受支持的**核函数编译为 WGSL，并安排 WebGPU 在浏览器 GPU 上运行。结果可以是数组、图像像素、粒子位置或水位场。Three.js 等绘制程序读取结果后，才形成可见场景。物理公式、地形、材质、光照和交互仍由应用实现。展示页顶部的[能力说明](web/index.html#capability-basics)用海浪场景逐步区分这几层职责。

## 项目概览

| 项目 | 内容 |
| --- | --- |
| 研究目标 | 从算法出发观看适合的目标画面，并把上游公开效果尽可能集中、可查、可实际打开 |
| 上游 | [SamG-Coder/cuda-webshader](https://github.com/SamG-Coder/cuda-webshader) |
| 目录快照 | 2026-09-27 观察上游公开目录：50 个样例入口，分为 5 个效果家族 |
| 技术栈 | 上游：CUDA C 子集编译器、WGSL、WebGPU、JavaScript 运行时、Three.js；本项目：无依赖静态展示页 |
| 许可证 | 上游原创代码 MIT；NVIDIA 样例按上游标注为 BSD-3-Clause，路径追踪样例标为 public domain；详见上游 [许可说明](https://github.com/SamG-Coder/cuda-webshader/blob/main/THIRD_PARTY_NOTICES.md) |
| 本地状态 | 已提供三维 GPU 海岸作品入口、一个本地港湾风浪模型、十二个 Canvas 算法样机、50 项样例目录；作者作品在当前浏览器独立窗口运行成功，性能未在本项目复测 |

## 先看三维海岸，再看港湾模型

用户反馈俯视水位图缺少现实场景的空间感后，展示页新增了[三维海岸入口](web/index.html#real-coast)，直接打开作者的 [coastal-simulation CUDA WebShader 移植版](https://samg-coder.github.io/coastal-simulation-cuda-webshader/)。独立窗口已在当前浏览器观察到天空、岸线、岩石、水面、白沫和实时动画；可以切换 Rocky Surf、Shoreline 和 Along the Breaker，并调节海况、风向与潮位。该项目实际使用 CUDA WebShader/WebGPU 计算并由 Three.js 绘制，是相同作者的**独立应用**，不是 `cuda-webshader` 仓库的一个普通样例。

研究页使用来自 [008 原版研究](../008-coastal-simulation/assets/provenance.json) 的场景截图作为入口预览，明确标注它不是 CUDA 移植版的运行截图。跨站嵌入在当前浏览器中只显示空白，因此入口直接打开作者原页。

展示页的[港湾风浪场景](web/index.html#coastal-scene)把外海入射波、随水深变化的传播、防波堤边界、泡沫示踪与两个测点合在**同一个二维数值状态**中。可调入射浪强与潮位，在海面、流速和水位视图间切换；点击水面会添加局部波纹，测点曲线随同一模拟更新。外海到港内的波形差异可以直接观察。

本地实现是简化线性浅水波有限差分和 Canvas 绘制，泡沫用于显示输运方向。港湾地形和参数均为示意，不是实测、工程预报或完整流体求解；它也不是将上游 CUDA 核函数接在一起运行。上游的 [FFT 海洋](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=ocean)、[交互流体](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=fluids)及[粒子碰撞](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=particle-collision)仍由各自的 CUDA→WGSL→WebGPU 演示呈现。

## 为什么研究它

你的 [Three.js 能力研究](../006-threejs-gpu-rasterizer/README.md)关注三维呈现，[算法与场景实验室](../010-algorithm-scene-lab/README.md)关注水体等模型的因果。此库展示两者的连接方法：把 GPU 计算结果留在缓冲区中，直接供浏览器三维渲染使用。

该库更适合有现成 CUDA 核函数、希望获得浏览器交互展示或原生/网页结果对照的场景。已有算法若只在 JavaScript/Wasm 中实现，直接编写 WGSL 也应作为对照方案。

## 从算法原型看到目标画面

| 算法原型 | 推荐的目标视觉样式 | 本地可看的效果 | 对应上游样例 |
| --- | --- | --- | --- |
| 多频波叠加 | 电影式海岸和湖面 | 浪线、海岸线和反光持续变化 | [FFT 海洋](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=ocean) |
| 示踪粒子平流 | 可触碰的墨水和风场 | 拖动后粒子轨迹改变 | [交互流体](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=fluids) |
| 软化 N 体引力 | 星系轨道和粒子装置 | 物体按两两引力运动并留下轨迹 | [N 体引力](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=nbody) |
| Sobel 3×3 卷积 | 机器视觉扫描 | 原图与边缘图实时并排 | [Sobel 边缘](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=sobel) |
| 二维等值线提取 | 地形地图和体数据切片 | 动态高度场上的多级等高线 | [Marching Cubes 网格](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=marching) |
| Mandelbrot 复数迭代 | 生成艺术和数学探索 | 逐像素分形，可点击放大 | [Mandelbrot](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=mandelbrot) |
| 三维密度射线步进 | 科学扫描和体数据可视化 | 沿视线累积颜色与透明度 | [体渲染](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=volume) |
| 光线相交与反射 | 材质摄影棚 | 球体、地面、阴影和一次反射 | [路径追踪](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=pathtracer) |
| Halton 低差异采样 | 数据星云和采样教学 | 可旋转的三维点云 | [准随机点云](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=quasirandom) |
| Haar 小波变换 | 脉冲和传感器分析 | 时域波形及不同尺度系数 | [Haar 小波](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=haar) |
| 双调排序网络 | 数据编排墙 | 逐阶段比较、交换和排序 | [双调排序](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=bitonic-sort) |
| 双三次插值 | 纹理放大镜 | 最近邻与平滑插值并排对照 | [双三次采样](https://samg-coder.github.io/cuda-webshader/sandbox.html?example=bicubic) |

这些本地画面由本站的 JavaScript Canvas 代码计算和绘制，目的是以算法原型比较目标视觉样式，**不是 CUDA WebShader 的运行结果**。多频波叠加是 FFT 海洋的简化视觉原型；本地流场只做示踪粒子平流，没有上游 FFT 投影求解；等值线是 Marching Cubes 的二维截面类比；本地光线反射不是上游完整路径追踪；Halton 与上游的准随机序列实现不相同。真正的 CUDA→WGSL→WebGPU 版本请点击各卡片的上游入口。其余 38 个上游样例仍在目录中。

## 五类已有效果

| 家族 | 条目 | 代表效果 |
| --- | ---: | --- |
| 动态物理 | 8 | FFT 海洋、交互流体、体积烟雾、粒子碰撞、N 体引力、轨道粒子场 |
| 三维与体数据 | 7 | Marching Cubes、Bucky 体渲染、三维纹理切片、FDTD 场 |
| 图像与纹理 | 21 | Sobel、光流、双目视差、DCT、DXT、降噪、卷积、纹理采样 |
| 数值与信号 | 10 | FFT、Walsh、Haar、排序网络、Sobol、高维序列 |
| 几何与渲染 | 4 | 贝塞尔曲线、递归四叉树、Mandelbrot、路径追踪 |

页面上方十二张画面是本地可运行算法样机；下方 50 项目录中的卡片图形是分类示意。点击「在预览区打开」后，按「尝试页内预览」会按需嵌入对应的**上游真实运行页**；「上游原页」始终可独立打开。本站不把本地样机、示意图或嵌入返回事件当作上游 GPU 正确性验证。

上方引导图沿用展示页的高清版本；实际画面请进入上游样例。

## 本地查看

在仓库根目录运行：

    python projects/011-cuda-webshader/web/build.py
    python -m http.server 4328 --bind 127.0.0.1 --directory dist

打开 http://127.0.0.1:4328/011-cuda-webshader/ 。静态目录、搜索和原理说明由本地文件提供；50 个实时效果由上游 HTTPS 站点加载，需联网和支持 WebGPU 的浏览器。若浏览器或上游限制 iframe，使用卡片的独立窗口入口。

## 技术原理与验证

编译器选择 CUDA 核函数，产生 WGSL 和缓冲区绑定元数据；JavaScript 侧决定缓冲区、线程块、网格及多步调度。指针、标量、共享内存、线程索引等按 WebGPU 规则降低；复杂工作流还需明确的执行计划。[上游 README 的编译与运行说明](https://github.com/SamG-Coder/cuda-webshader#compile-a-kernel)

上游 2026-09-12 的报告记录 79 项浏览器 GPU 测试通过、20/20 对照工况完成数值验证；性能报告是在 RTX 5080 上测得的 GPU 片段时间，排除了编译、首次上传和读回。本项目在浏览器中打开并观察到上游 FFT 海洋的 GPU 海面；没有复跑 CUDA/WebGPU 性能或逐一验证这 50 个远端样例。[上游验证记录](https://github.com/SamG-Coder/cuda-webshader/blob/main/VALIDATION.md) · [性能报告](https://github.com/SamG-Coder/cuda-webshader/blob/main/reports/performance-comparison.md)

## 研究结论

- **可复用的方式**：同一 GPU 缓冲区在计算与渲染之间传递状态；原生 CUDA 和浏览器 WGSL 可以用相同输入与独立参考公式做对照。
- **适用边界**：只支持定义好的 CUDA C 子集；浏览器需要 WebGPU；Three.js 共享缓冲区桥接依赖固定的 r186 内部接口。Chrono SPH 水体样例是实验性端口，当前慢于实时。
- **下一步实验**：选一个粒子输运或高度场更新内核，用相同输入比较现有算法、手写 WGSL 和 CUDA→WGSL 版本的数值、画面与目标设备耗时。

详细来源、构建与核对过程见 [研究笔记](notes/research.md)。[正式演示](https://yydshly.github.io/0927_codex_project/011-cuda-webshader/#capability-map) 已在 GitHub Pages 发布；部署与公网核对结果见 [发布记录](notes/deployment.md)。
