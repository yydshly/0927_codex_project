# FreeMoCap 研究笔记

核查日期：2026-09-26。基准版本：v2.0.0-alpha.25，发布页提交前缀 0b39db9。下文区分上游资料、自有教学实验和待验证能力。

## 意义

输入多视角视频，输出身体关键点随时间变化的三维位置序列。它为动作比较、动画素材、科研、交互提供数据。评价动作、解释原因和提出建议仍需要领域规则、标注或附加模型。

工程价值在于将采集同步、预训练模型、标定、几何重建、后处理与导出整合。

## 上游链路

1. SkellyCam 采集；外部录制可借助 SkellySync 对齐时间。
2. ChArUco 板提供已知尺寸与几何，估计镜头参数、畸变和相机间关系。
3. SkellyTracker 组织检测器；代码包含 YOLOX+RTMPose，以及 MediaPipe 身体、手、脸路径。
4. 同名二维点去畸变后，通过多视角三角测量恢复三维位置。
5. 重投影检查、异常观测处理、平滑、短时丢点补偿、骨骼长度约束。
6. 输出数组、表格以及 Blender 工作流数据。

2.0 的 React/Electron 界面通过 REST/WebSocket 与 Python 后端通信。代码包含实时和离线处理流程，旧 FAQ 的“不支持实时”不适合直接判断 2.0。

## 投影与 DLT

    s [u, v, 1]^T = K [R | t] [X, Y, Z, 1]^T

K 为内参，R、t 将世界点变换到摄像头坐标系。外参平移 t 不等同于相机世界位置；通常相机中心 C=-R^T t。

对去畸变和归一化观测，令 P=[R|t]，每台相机给出：

    (u P_3 - P_1) X_h = 0
    (v P_3 - P_2) X_h = 0

将约束叠成 A，SVD 求最小奇异值对应的右奇异向量，最后做齐次除法。带噪时这是代数误差意义的解，不应直接称为精确最小化所有射线的三维距离；上游还包含重投影误差与异常观测处理。

## 本页双目实验

两机平行、焦距相同、已去畸变，位置分别为 -B/2、B/2，主点坐标已移除：

    u_A = f (x + B/2) / Z
    u_B = f (x - B/2) / Z
    d = u_A - u_B = fB/Z
    Z = fB/d

实验加入固定像素偏移 n，以及横向移动速度 v=0.8 m/s：

    u_A' = f (x + B/2) / Z + n
    u_B' = f (x + vΔt - B/2) / Z - n

这不是对真实姿态模型误差分布的模拟。两种偏差可能抵消，良好的重投影误差或平滑轨迹并不能单独证明实际精度。

    |dZ/dd| = Z² / (fB)

同样像素误差下，远距离和短基线通常更敏感。实际扩大机位间距还受共同视野、遮挡、对应关系和标定质量限制。

## 已测结果

| 检查 | 结果 |
| --- | --- |
| f=700 px、B=1.2 m、Z=3 m | d=280 px、重建 Z=3 m |
| B=0.3 m，左右各 ±4 px | 误差约 307.7 mm |
| B=2 m，左右各 ±4 px | 误差约 50.6 mm |
| 默认几何、相差 100 ms | 重建 Z≈3.214286 m |
| 仅一台摄像头 | 不给出唯一深度 |
| 合成深蹲第 60 帧 | 左膝夹角约 95.8° |
| NPY v1/v2/v3 × f4/f8 × 大小端 | 12 种组合通过 |
| 浏览器载入合成 NPY | 33 点映射到 17 点，膝角与原合成数据一致 |
| 390×844 窄屏 | 无非预期横向溢出 |

23 项自动检查通过。浏览器验证内置二进制文件→解析→转换→回放。自动化工具的本地文件选择步骤未完成端到端验证，未声称实测真实摄像头或用户数据。

## 能力边界

- 基准 Alpha 版本发布说明仍列出约 10% 尺度偏差，并非统一精度指标。
- 多人议题 #597 仍开放，不能从二维模型的多人能力推出完整多人动捕能力。
- 模型兼容性、手脸效果、Blender 导出与帧率需按实际版本配置验证。
- 本页的三点夹角不等于采用完整解剖坐标系定义的关节角。
- NPY 导入要求明确身体布局；不能只靠数组大小推断任意追踪器的定义。
- 三维点还不足以直接提供全部角色旋转、力矩或机器人控制量。
- 上游 AGPL-3.0 需在集成中考虑，本页不分发其代码或模型。

## 来源

- [仓库](https://github.com/freemocap/freemocap)
- [发布说明](https://github.com/freemocap/freemocap/releases/tag/v2.0.0-alpha.25)
- [检测器工厂](https://github.com/freemocap/freemocap/blob/main/freemocap/core/tracking/tracker_factory.py)
- [DLT/SVD](https://github.com/freemocap/freemocap/blob/main/freemocap/core/tasks/triangulation/helpers/triangulate_simple.py)
- [三角测量与重投影](https://github.com/freemocap/freemocap/blob/main/freemocap/core/tasks/triangulation/triangulator.py)
- [实时流程](https://github.com/freemocap/freemocap/blob/main/freemocap/core/pipeline/realtime/realtime_pipeline.py)
- [标定文档](https://docs.freemocap.org/freemocap/docs/architecture/backend-calibration/)
- [骨架处理](https://docs.freemocap.org/freemocap/docs/architecture/backend-mocap/)
- [SkellySync](https://github.com/freemocap/skellysync)
- [Blender 插件](https://github.com/freemocap/freemocap_blender_addon)
- [多人议题](https://github.com/freemocap/freemocap/issues/597)
- [许可证](https://github.com/freemocap/freemocap/blob/main/LICENSE)

main 链接可能继续变化；本文对应核查日期。部分新文档声明由 AI 生成，算法和实时能力已与代码交叉核对。本机未安装或运行上游 FreeMoCap。
