# 研究记录

## 基线

- 研究日期：2026-09-27。
- 研究对象：[three.js PR #33605](https://github.com/mrdoob/three.js/pull/33605)，2026-05-21 合并，合并提交 `1a9757a`。后续示例改名为 [`webgpu_compute_rasterizer.html`](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html)。
- 上游许可证：MIT。[three.js LICENSE](https://github.com/mrdoob/three.js/blob/dev/LICENSE)。
- 本地环境：Windows、Python 3.10.11、Node.js 22.15.0、three.js 0.186.1。浏览器为 Codex 内置浏览器。
- 问题：three.js 源码库、官方示例和这个 PR 各是什么？three.js 能做出哪些效果、对业务产品有什么价值？这个 PR 相比已有视锥裁剪、LOD、实例化还有什么增量？其十亿三角形陈述代表什么？

## three.js 基础能力与示例价值

three.js 是用于浏览器三维内容的库，抽象出场景、相机、几何、材质、纹理、灯光和渲染等概念。[官方基础说明](https://threejs.org/manual/pages/fundamentals.html)。官方示例适合学习某一项能力并查看实现代码；`GLTFLoader`、`OrbitControls`、后期效果等扩展需要单独导入，并不意味着示例页面就是可直接部署的业务产品。[安装与扩展](https://threejs.org/manual/pages/installation.html) · [示例索引](https://threejs.org/examples/)。

可见的能力范围包括[加载 glTF 模型](https://threejs.org/examples/webgl_loader_gltf.html)、[点击交互](https://threejs.org/examples/webgl_interactive_cubes.html)、[骨骼动画与表情](https://threejs.org/examples/webgl_animation_skinning_morph.html)、[后期画面效果](https://threejs.org/manual/pages/post-processing.html)、[GPU 粒子计算](https://threejs.org/examples/webgpu_compute_particles.html)以及[WebXR](https://threejs.org/manual/pages/webxr-basics.html)。这些能力能组合成产品展示、设备巡检、培训、空间可视化等产品。业务数据、模型制作和物理仿真不是 three.js 核心自动提供的完整方案；物理通常要接入其他引擎。[官方物理说明](https://threejs.org/manual/pages/physics.html)。

对本项目的实际意义是：用 three.js 验证三维业务体验，用官方示例降低探索成本；对于普通场景先采用已有能力，只有实际模型和设备的测量显示瓶颈时，再考虑 PR #33605 代表的深度优化路线。这是产品层面的推断，并非 three.js 官方性能承诺。

## 源码阅读结论

1. 原 PR 的描述明确使用 TSL 计算着色器实现 GPU 驱动的实验性软件光栅化，目标是自定义三角形绘制、裁剪和延迟纹理采样；作者也说现阶段示例技术性较强。[PR 原文](https://github.com/mrdoob/three.js/pull/33605)
2. 当前示例生成 7 档茶壶，用 `rows = 400`、`cols = 400` 创建 16 万个实例；界面上的总三角形数由最高精度茶壶三角形数乘实例数得到。它不是每帧实绘数量。[源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L59-L127)
3. 每档几何被分成约 64 个三角形的小组并建立包围球。GPU 对实例和小组做视锥测试，按照投影到屏幕的误差选择精度，写入工作队列。[源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L175-L252) · [计算](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L354-L466)
4. GPU 根据队列计数生成间接计算参数。小三角形通过计算程序检查像素覆盖与深度；大三角形排队走常规硬件光栅化。[源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L475-L681)
5. 软件路径在像素缓冲区中记录深度与三角形/实例 ID，后续读取顶点和 UV、插值并取纹理；硬件路径在同一画面中做真实深度测试。[源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L708-L905)
6. 现有 three.js 已提供[距离 LOD](https://threejs.org/docs/pages/LOD.html)与[实例化绘制](https://threejs.org/docs/pages/InstancedMesh.html)。PR 增量更准确地说是 GPU 驱动的细粒度工作队列和自定义/混合光栅化，而不是所有优化手段的首次出现。

## 本项目演示设计

业务情境：远程值班员浏览 144 台风机，发现 W-087 告警，定位后查看设备。页面提供全部高精度、仅视锥筛选、视锥筛选加屏幕误差 LOD 三种模式。使用程序化风机而非真实 CAD/BIM 资产，告警也是模拟值。代码在 [`web/app.js`](../web/app.js) 和 [`web/planner.mjs`](../web/planner.mjs)。

演示采用 Three.js WebGL 渲染器。`planner.mjs` 在 CPU 上执行视锥筛选后的 LOD 选择，目的是让差别可解释、可测试；**没有复刻原 PR 的 WebGPU 计算着色器、可见性缓冲或混合光栅化**。页面提供上游真实示例入口。几何数量按绘制实例数乘各精度模型的实际三角形数计算，称为“几何提交估算”，不等于 GPU 已完成工作或帧时间。

## 本地实验与观察

- `npm run check`：脚本检查与 3 个计算测试通过。测试覆盖远近投影误差、近/远精度选择及三种模式的几何量计算。
- `npm run build`：静态产物生成成功，包含 three.js 模块、OrbitControls、几何合并工具及 MIT 许可证。
- 浏览器全场视角：按需模式显示 144 台风机，几何提交估算 26,608，较本项目全部高精度基线少 93%。
- 通过“定位 W-087”进入近景：页面可见被选中的风机和告警环；在按需模式下，视野内约 31 台，几何提交估算会随阈值与镜头视角变化。以上数值来自本项目模拟几何，**不可作为上游 PR 的性能数据**。
- 已检查窄屏页面布局和近景三维画面。尚未完成多浏览器、多 GPU、移动设备的帧时间和内存对照。

## 局限与下一步

- 建立真实 GLB/CAD 资产预处理：模型分块、多档精度、误差估计、材质 ID 与按需加载。
- 用目标设备对比三种方案：常规 three.js、已有 LOD/实例化优化、GPU 驱动原型。记录帧时间、内存、加载时间和画质，而不只看三角形总量。
- 补全多对象、多材质、阴影、透明、动画、拾取、剖切与告警数据接入，然后评估是否适合生产业务。
