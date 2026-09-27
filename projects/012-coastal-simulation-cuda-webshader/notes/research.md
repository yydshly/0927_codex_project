# 012 · 研究与证据记录

研究日期：2026-09-27。最初依据当日公开 `main` 页面及官方在线演示整理说明；后续本地集成固定在提交 `e5a80fe42b4eeba6c01de1467035bafd69592d3e`。若上游更新，需重新核对数字和行为。

[理解与应用结论](understanding.md)说明能力、算法、场景和边界；本文件记录事实来源与验证程度。[提交准备](submission.md)记录交付范围与本轮检查。

## 来源与归属

- [移植版 README](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader) 是能力、架构、测试和性能数字的主要来源。
- [原版 coastal-simulation](https://github.com/iamtechartist/coastal-simulation) 提供场景、浅水方程、材质、资产及原有体验。移植版 [CREDITS.md](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/CREDITS.md) 指明原版起点 `2e95e1a3e757ca1268247417dee01606e5e3d55c`、随仓库提供的编译器版本与许可证。
- 项目说明与能力分组由本站整理；`assets/capability-map.svg` 是架构示意，`assets/coastal-capabilities-overview.png` 是依据源码说明生成的中文总览，两者都不是官方运行截图。为本地运行真实效果，`web/upstream/` 打包了 SamG-Coder 移植版固定提交的静态发布文件（约 6.4 MB），含原作归属、MIT 许可和 CUDA WebShader/Three.js 组件许可。本地仅对启动与状态初始化增加了单处礁石扩展，补丁清单见 [INTEGRATION.md](../web/upstream/INTEGRATION.md)；CUDA 求解内核未修改，二维诊断使用另一套独立模型。

## 浏览器实看

2026-09-27 在 Codex 内置浏览器打开 `https://samg-coder.github.io/coastal-simulation-cuda-webshader/`，初始化后画面可见；页面状态返回 `ready: true`、`backend: WebGPU`、`solver: CUDA WebShader / WebGPU`、`errors: []`。依次查看 Rocky Surf、Shoreline 和 Along the Breaker 视角：看到水体、岩石、移动白沫、近景波纹、撞击喷雾及浅水岸线。只是定性观察；没有保存帧视频或对每一种海况做完整视觉核对。

页面当时提供海况、风向、潮位、云量、光照、画质与预设视角控制。浏览器尺寸和设备没有固定到可复现实验条件，所以不记录或比较瞬时 FPS。

## 架构核对

上游 README 指向：

| 文件 | 作用 |
| --- | --- |
| [`src/coastal-kernels.cu`](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/src/coastal-kernels.cu) | 水流、泡沫、湍流、湿润等 CUDA 核函数 |
| [`src/coastal-render.cu`](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/src/coastal-render.cu) | 水面重建、场打包、喷溅和诊断 |
| [`src/cuda-solver.js`](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/src/cuda-solver.js) | 计算状态、缓冲区和执行 |
| [`src/resident-coast.js`](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/src/resident-coast.js) | 固定步长调度与渲染设备的协作 |
| [`src/gpu-interop.js`](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/src/gpu-interop.js) | 与 Three.js r185 的共享缓冲区/纹理适配 |

README 声明 21 个 CUDA 入口、60 Hz 流体和 30 Hz 平流调度；普通帧无完整状态读回，启动时读取小型诊断，`?profile` 追加摘要读取。后续在固定版本上执行了上游 `npm test`：50 个部署 JavaScript 模块导入审计和 21 个 CUDA 入口编译检查通过。该检查验证可编译性，不等于重新执行硬件 GPU 数值套件、性能基准或真实水体精度验证。

## 上游测试数字如何引用

- 旧数据路径与 GPU 常驻路径：6.874 / 3.179 ms，为受控、等待 GPU 完成的模拟到渲染纹理更新对照，约 2.16 倍，不能推广为整页 FPS。
- 增强模型与参考 GPU 模型：3.322 / 3.253 ms，在作者机器上的交替测量；差异小，不作确定的性能优势结论。
- 60 步同数组对照：最大水深误差约 2.9e-6 m；这是实现一致性证据，不是对真实海岸的工程精度证明。
- 上游报告路径：[pipeline-performance.json](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/reports/pipeline-performance.json)、[realism-performance.json](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/reports/realism-performance.json)、[gpu-validation.json](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader/blob/main/reports/gpu-validation.json)。本次以 README 公开摘要为准，未本地复跑硬件 GPU 测试。

## 待验证与迁移问题

1. 在目标桌面和手机设备统一视角、像素数、画质、海况和运行时长，记录加载时间、帧时间分布、显存和功耗。
2. 做具体地形替换时，先确认可见岩石几何、求解器障碍场、湿润与遮挡必须一起更新。
3. 若要比较原版，需要同机、同视角、同海况和公平画质，并分开报告计算流水线与整页 FPS。
4. 若需要翻卷浪唇、侵蚀、船体作用或预测精度，需要明确新的模型和校验数据，不能从现有高度场直接推断。

## 本地展示页验证

- 初版导览完成元数据、脚本、单项目构建、SVG 与统一站点构建检查；后续扩展已验证含 13 项的统一站点构建。本轮提交准备的命令和结果集中记录在[提交准备](submission.md)，不把历史项目数量当成最新检查结果。
- 在本地浏览器验证 18 项能力显示、分类筛选、卡片详情、首页的 012 入口和返回索引。最初跨站 iframe 在本地预览里保持空白；改为打包固定源码并同源加载后，导览页和实验台均实际显示上游 WebGPU 场景，并通过其诊断状态确认 `ready`。iframe 的 `load` 事件本身仍不等于 GPU 就绪。
- 尚未推送或部署本项目到公开 GitHub Pages；`project.json.demo` 保持空值。

## 扩展实验台验证

`web/extensions.html` 现有两个模式：默认的源库真实三维场景与本站独立的二维地形实验。源库场景从 `web/upstream/` 同源加载，使用原项目的 CUDA WebShader、Three.js 和固定海岸；父页面通过其公开的 `window.saltreach` API 调整视角、海况、潮位与画质。二维实验使用一份海床缓冲保存高度与固体障碍，WGSL 更新水深、水平流速、泡沫和湿润状态；绘制着色器读取同一地形与最新水状态。二维实验未复现上游完整数值方法。

- 在内置浏览器本地预览中，WebGPU 管线正常建立，画面与三档网格出现；切换风暴海况与画质、在水面添加岩石、导入测试灰度高度图后，页面状态和画面相应变化。
- 自定义海况保存到 localStorage，重新加载后仍列在菜单中。三档 P50/P95 在相同地形与海况下逐项保留，修改输入则清空。当前环境三档约 4.2 ms，接近浏览器刷新周期，**不能据此说高画质与低画质性能相同**。
- 首版发现风暴时深海白沫持续累积，已降低泡沫增益并限制在浅水/岩石附近。随后根据用户反馈，取消入口波的高频横向相位、加入数值扩散抑制网格条纹、平滑地形着色与不规则岩石边缘，并为初始海面加入长波。当前俯视图仍是数据流诊断，不应当作三维视觉参考。
- `node --check`、`extensions-core.test.mjs` 4 项单元测试和单项目构建通过。上游 `npm test` 的 50 个部署 JS 模块导入检查及 21 个 CUDA 入口编译检查通过。浏览器日志没有错误。下载按钮在内置浏览器没有产生可检测的下载事件，因此同时保留可手动点击的 JSON 链接；下载文件本身未验证。
- 这些帧时间来自浏览器帧间隔，没有 GPU 时间戳查询、CPU 对照、热身和重复设备样本，不应与上游的 3.179 ms 流水线数字比较。
- 本地打包的源库在浏览器同源 iframe 中报告 `WebGPU / CUDA WebShader 已运行`，可见真实海岸和 FPS，控制台无错误。切换到二维模式时源库帧被卸载，避免两套 GPU 场景同时消耗资源。

## 源库同模型扩展：新增礁石

- 用户指出源库画面与本站二维实验差距明显。原因是二维实验另写了一套低分辨率浅水求解和俯视着色，原来并没有把源库的三维渲染、短波、湿润与喷雾接给可编辑地形。页面现明确说明二者不是画质档位关系。
- 本地静态包新增 `src/local-extension.js`，在源库初始化前向共用的 `ROCKS` 定义添加一块前景礁石。源库现有的 GPU 障碍初始化、Three.js 岩石几何、湿润着色和喷雾均读取该定义。扩展模式跳过原地形对应的烘焙初始状态，重新推进求解器建立初始海况；原版模式仍用原烘焙状态。
- 浏览器切换到 `?reef=1` 后报告 `WebGPU 已运行 · 新礁石参与求解`，视角自动切到外海，新增礁石在近景可见，浪和泡沫继续运行。Node 检查确认原版 14 块、扩展版 15 块岩石，扩展几何元数据均为有限值。源库任意高度图导入和二维实验状态联动尚未实现。

## 提交可复现性

仓库根规则忽略名为 `upstream/` 的本地克隆目录，也曾使 012 的发布运行包被忽略。012 的 `.gitignore` 现对 `web/upstream/` 明确放行，使固定源码、厂商依赖、烘焙初始状态、许可证和本地补丁能够随项目提交；`.cache/` 与构建输出仍属于本地文件。运行时无需访问本机缓存克隆。
