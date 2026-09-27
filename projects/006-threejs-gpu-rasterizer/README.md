# 006 · Three.js 能力与 GPU 驱动光栅化研究

> 先理解 [three.js](https://github.com/mrdoob/three.js) 源码库能构建什么网页三维体验，再研究 [PR #33605](https://github.com/mrdoob/three.js/pull/33605) 怎样分配高密度场景的绘制工作，并用海上风电场巡检做交互演示。

[返回总索引](../../README.md) · [研究记录](notes/research.md) · [本地演示说明](web/README.md) · [上游 WebGPU 示例](https://threejs.org/examples/webgpu_compute_rasterizer.html)

## 理解总图

![Three.js 与 GPU 驱动渲染实验理解总图：基础库能力、官方示例、PR 原理、适用场景和落地路径](assets/understanding-map.svg)

[打开可放大的矢量原图](assets/understanding-map.svg)。这张图区分了 three.js 提供的通用三维能力与 PR #33605 的实验性渲染流程；其中的产品路径属于本项目分析，不能视为原 PR 的开箱能力或性能承诺。

## 六个关键问题

| 问题 | 结论 |
| --- | --- |
| **这个库的能力** | three.js 是网页三维基础库，提供场景、相机、模型、材质、灯光和渲染；官方扩展与示例覆盖模型加载、交互、动画、后期效果和 WebXR/WebGPU。PR #33605 是其中一个 GPU 驱动渲染实验，并非独立效果库。 |
| **实现效果** | three.js 能构建可观看、可操作的三维网页。本项目用 144 台模拟风机展示全场浏览、点选告警与三种几何精度策略；数值是教学估算，不代表 PR 的实测帧率。 |
| **使用场景** | 轻量产品展示和教学可先用常规 three.js；工业设施、BIM、大型城市和扫描场景在几何负载确实成为瓶颈时，可评估 PR 所代表的技术路线。 |
| **技术原理** | three.js 将场景对象交给 WebGL/WebGPU 渲染。PR 预备多档几何和小组，由 GPU 做视锥筛选、屏幕误差 LOD 与工作队列，再按三角形大小选择计算着色器软件光栅化或硬件光栅化，最后为可见像素上色。 |
| **对我的意义** | 用官方示例快速验证视觉与交互，接入自己的模型和业务数据做三维产品；只有用真实模型、目标浏览器和设备测出瓶颈后，才投入深度渲染优化。 |
| **可扩展产品方向** | 大型模型上传与处理、自动分块/LOD、按需加载、设备状态与告警叠加、协同巡检、质量与性能基准，逐步形成行业应用或 SDK。以上是产品推断，原 PR 未提供这些完整能力。 |

三维页面中的风机、告警及设备状态均为模拟数据。

## 先区分三个对象

| 对象 | 作用 | 对产品开发的意义 |
| --- | --- | --- |
| [three.js 源码库](https://github.com/mrdoob/three.js) | 提供场景、相机、模型、材质、灯光和渲染等基础能力 | 是构建网页三维体验的技术底座 |
| [官方示例与扩展](https://threejs.org/examples/) | 展示模型加载、交互、动画、后期效果、WebXR、WebGPU 等具体方法 | 能验证视觉效果与实现路线，但不是完整产品模板 |
| [PR #33605](https://github.com/mrdoob/three.js/pull/33605) | 加入一个 GPU 驱动的光栅化实验示例 | 用于研究极大场景的性能路线，不是全局加速开关 |

## three.js 的能力、效果与对我的价值

three.js 的核心价值是把底层图形接口封装成可组织的三维场景。通过模型与材质可以做产品展示和建筑漫游；通过镜头控制、射线拾取和页面 UI 可以做设备点选、巡检和交互讲解；通过动画系统可以做设备动作或人物状态；通过后期处理扩展可以做辉光等画面效果；通过 WebXR 或 WebGPU 能进一步探索沉浸式体验和 GPU 计算。[基础说明](https://threejs.org/manual/pages/fundamentals.html) · [安装与扩展](https://threejs.org/manual/pages/installation.html) · [动画系统](https://threejs.org/manual/pages/animation-system.html) · [后期处理](https://threejs.org/manual/pages/post-processing.html)

本项目的[交互页面](web/README.md)已使用场景绘制、相机控制、点选和重复物体绘制，展示了从“看到风电场”到“定位告警风机”的体验。对我最直接的价值是：先用官方示例验证模型与交互是否能满足业务，再把自己的设备数据接入，形成数字孪生、产品展示或培训页面；只有场景确实变大、测出性能瓶颈后，才需要深入这条 PR 的 GPU 渲染路线。three.js 主要负责三维呈现；模型制作、后台数据、告警规则和真实物理模拟还需要其他工具或系统。[物理能力说明](https://threejs.org/manual/pages/physics.html)

## 一句话理解 PR

这是一个**实验性的绘制流程**：GPU 先决定镜头里哪些小组三角形值得处理、需要哪档精度，再把小三角形和大三角形交给不同的绘制路径，最后给可见像素上色。它研究的是高密度场景的渲染组织方式。原 PR 只新增示例，尚非可直接套用到任意模型的通用产品接口。[PR 说明](https://github.com/mrdoob/three.js/pull/33605) · [改动文件](https://github.com/mrdoob/three.js/pull/33605/files)

## 技术价值与通用方案的区别

| 问题 | 常规 three.js 能力 | PR #33605 的实验重点 |
| --- | --- | --- |
| 镜头外的几何 | 已支持物体级视锥剔除 | 在 GPU 上继续筛到实例和约 64 个三角形组成的小组 |
| 远近精度 | `LOD` 可按距离切换预制模型 | 以投影到屏幕的几何误差选择预制精度，选择工作放到 GPU |
| 大量重复物体 | `InstancedMesh` 可降低 draw call | GPU 生成可见工作队列与间接执行参数，减少 CPU 逐组安排工作 |
| 三角形绘制 | 主要使用显卡常规光栅化 | 小三角形用计算着色器自行覆盖像素，大三角形仍用硬件光栅化 |
| 像素颜色 | 绘制管线可直接为片元着色 | 软件路径先存像素对应的三角形和实例，再读取纹理上色 |

普通 three.js 的 [LOD](https://threejs.org/docs/pages/LOD.html) 和 [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) 已解决一部分性能问题。本实验的区别是**更细的筛选粒度和由 GPU 生成后续绘制任务**，不是首次发明“远处用低精度”或“相同物体一起画”。[现版示例源码](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html)

## 原理：从模型到屏幕

1. **预处理**：示例生成 7 档茶壶几何，为每档设置误差值；每约 64 个三角形建立一组和包围球。[源码：几何与分组](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L94-L252)
2. **GPU 裁剪与选精度**：比较包围球和镜头视锥；把模型误差换算为屏幕像素误差，挑满足阈值的最简精度；把可见小组写入工作队列。[源码：视锥与 LOD](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L354-L466)
3. **GPU 安排任务**：可见小组数量决定间接计算任务的规模；三角形再做背面与屏幕范围检查。[源码：间接任务与三角形筛选](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L475-L557)
4. **软硬件分流**：屏幕覆盖范围较小的三角形由计算着色器逐像素测试并写入可见性缓冲；较大的三角形进入硬件绘制队列。[源码：两条路径](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L568-L681)
5. **可见像素上色**：软件路径记录像素最终对应的三角形、实例和深度，之后重建纹理坐标并采样；硬件路径使用常规深度测试。[源码：上色](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L708-L905)

这里的“软件光栅化”是**自己编写 GPU 计算程序**，并非让 CPU 逐像素作画。示例只做视锥裁剪和最终像素的深度竞争；不能把它描述成完整的遮挡物剔除系统。

## 能力与边界

**已由上游示例体现**：WebGPU + TSL 计算程序、实例和小组级视锥筛选、屏幕误差 LOD、间接任务、大小三角形分流、可见性缓冲及纹理采样。原 PR 作者称示例场景超过十亿三角形；源码用 `400 × 400` 个重复茶壶乘单个茶壶最高精度三角形数来显示总量。这是**场景几何总量估算**，不等于每帧都实际光栅化十亿三角形，也不构成跨设备帧率结论。[PR 描述](https://github.com/mrdoob/three.js/pull/33605) · [数量计算](https://github.com/mrdoob/three.js/blob/dev/examples/webgpu_compute_rasterizer.html#L59-L127)

**当前产品边界**：示例直接生成茶壶和少量纹理/调试呈现，要求 WebGPU；通用 glTF/CAD/BIM 导入、复杂多材质、透明、阴影、动画、资产流式加载、拾取与完整巡检工具，都需要另行适配和评估。任何“更快”的判断都要在目标模型、分辨率、浏览器、GPU 上与常规渲染方案实测。后续有人在 PR 讨论中演示了 GLB 分块、更多材质与多对象支持，这些属于延伸实验，不是本 PR 提供的开箱能力。[讨论](https://github.com/mrdoob/three.js/pull/33605)

## 具体场景：海上风电场远程巡检

值班员先看 144 台风机的全场概览，再定位模拟告警 `W-087`，放大查看结构。用户真正需要的是全场位置关系、异常设备和近景细节，不需要在远景中为每片看不清的叶片保持最高精度。

[本地交互演示](web/README.md)提供三种可切换策略：

| 策略 | 演示含义 | 预期观察 |
| --- | --- | --- |
| 全部高精度 | 每台都提交高精度几何 | 几何数量成为基线 |
| 只做视野筛选 | 镜头外的风机不提交；可见风机仍用高精度 | 接近单台设备时，数量随可见设备减少 |
| 按需选精度 | 视野筛选后再按屏幕误差选三档精度 | 远景减小几何量，近景恢复结构 |

页面实时展示“本帧绘制风机”“几何提交估算”“相对基线减少比例”。**比例只反映演示几何提交数量，不是 GPU 时间、帧率、真实风场数据，也不是原 PR 与常规方案的性能对照。** 本演示通过常规 Three.js WebGL 渲染器和 CPU 计算复现可见性/LOD 决策，以便业务人员直观理解；原 PR 的 GPU 计算与混合光栅化请打开[上游 WebGPU 示例](https://threejs.org/examples/webgpu_compute_rasterizer.html)。

对这个业务的具体价值是：同一页面能保持全场态势，点选告警设备后再分配细节预算。要进入生产，还要接入实际资产、告警与设备数据，并做设备覆盖率、画质、帧时间和加载时间验收。

## 可用场景与产品方向

| 场景 | 用户动作 | 值得验证的收益 |
| --- | --- | --- |
| 工厂、风电场、港口数字孪生 | 全场监控 → 定位单台设备 | 同时保留空间概览和局部细节 |
| BIM / 大型工程审阅 | 楼层浏览 → 查看构件或管线 | 降低远景几何负载，支撑批注和剖切 |
| 城市、园区、文化遗产扫描 | 全景漫游 → 靠近建筑细部 | 高精度资产在浏览器中按视角呈现 |

可扩展的产品是“大模型上传、自动分块和生成多档精度、网页按需加载与协同巡检”的平台或 SDK。这个方向是**本项目的产品推断**，原 PR 没有提供完整资产管线。若对象少、模型轻或强依赖透明/动画，先使用 three.js 现有方案通常更合适，是否换渲染架构应由实测决定。

## 运行与验证

环境：Node.js 20+。在 `web/` 下运行 `npm ci`、`npm run dev`，打开 `http://127.0.0.1:4316/`。执行 `npm run check` 检查脚本与三种策略的计算，`npm run build` 输出不依赖在线 three.js CDN 的静态页面到 `web/dist/`。

本机验证使用 Node.js 22.15、three.js 0.186.1 与 Codex 内置浏览器：页面显示 144 台风机；全场按需模式和定位 W-087 后的几何统计会变化；三档策略与误差滑块能更新统计。渲染效果已人工检查，尚未做跨设备帧率基准。详见[研究记录](notes/research.md)。

## 来源与许可

上游 [three.js](https://github.com/mrdoob/three.js) 为 MIT 许可，原 PR 于 2026-05-21 合并到 `dev`，合并提交 `1a9757a`。本项目只在构建产物中复制 three.js 0.186.1 的模块与许可证；研究图、风机几何与模拟巡检数据由本项目独立创建。[许可证](https://github.com/mrdoob/three.js/blob/dev/LICENSE)
