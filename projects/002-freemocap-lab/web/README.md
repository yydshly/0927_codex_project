# FreeMoCap 动作实验室 Web 演示

纯静态中文教学演示，包含动作回放、双目三角测量实验与“理解与应用”研究汇总。无需摄像头或 GPU。内置动作与 NPY 样例均为合成数据。

## 理解与应用

访问 `#capabilities`，按七个章节阅读：摄像头与输入、技术原理、输出与效果、驱动 3D 人物、与 Kimodo 比较、场景与个人价值、边界与来源。页面汇总了讨论形成的理解，并以小云的角色动作库为具体应用例子。

- 章节导航滚动到对应问题，同时移动键盘焦点；保留 `#capabilities` 路由。
- 说明区可直接进入已有骨架回放和几何实验。
- 全景图支持 100%–250% 阅读缩放、适应宽度、滚动、Escape 关闭，以及 PNG / SVG 下载。
- 图片使用本地 `assets/` 资源，构建时一起复制，无外部图片依赖。
- 上游动捕、当前教学页面、需要另外开发的角色适配与运行控制明确区分。

## 启动与构建

在本目录运行，Node.js 18+，不需要 npm install：

    npm run dev
    npm test
    npm run build

开发地址：http://127.0.0.1:4178/。修改端口的 PowerShell 示例：

    $env:PORT = '4179'
    npm run dev

构建输出在 dist/。所有资源采用相对路径，支持 /0927_codex_project/002-freemocap-lab/；hash 导航无需服务端路由。无 CDN 或外部请求依赖。

已于 2026-09-27 发布到 [GitHub Pages](https://yydshly.github.io/0927_codex_project/002-freemocap-lab/#capabilities)。仓库的 `scripts/build_site.py` 将本项目与 Lofi Cities 合并为统一发布产物，配置和维护方法见 [部署说明](../../../docs/DEPLOYMENT.md)。公网已验证五项加粗摘要、完整长图及 150% 缩放、页面切换、合成 NPY 样例解析回放；PNG / SVG、样例、样式与脚本均返回 HTTP 200，未观察到浏览器脚本错误。

## NPY 格式

- NPY v1 / v2 / v3，C-order，float32 / float64，支持大小端。
- 不支持对象、整数、Fortran order 或 NPZ。
- 形状为 [frames, keypoints, 3]，不接受带摄像头维度的二维检测结果。
- MediaPipe 模式：身体独立 33 点数组，常见命名 body_3d_xyz.npy。
- RTMPose/COCO 模式：17 或 WholeBody 133 点，需采用 COCO 身体顺序。
- 最大 64 MB、30,000 帧。需确认帧率、米/毫米及 Y/Z 向上。
- NaN 点在显示时跳过；无任何有效双侧髋部的文件会被拒绝。

显示统一为米 / Y 向上；在第一帧有效髋部位置水平居中，以约 600 个采样帧中身体点的最低高度作为显示地面。地面未校准，不适合据此直接测量实际离地高度。

CSV 包含 source、frame、time_s、joint、x_m、y_m、z_m，导出上述显示坐标。原文件不修改。

导入使用浏览器 File API，不发起上传。样例按钮只读取本项目静态资源 samples/synthetic-mediapipe-body.npy。

## 样例复现

    node ../experiments/generate-sample.mjs

同时更新 experiments/ 和 web/samples/ 中的样例。它为 180 帧 / 30 FPS / 33 点 / 毫米 / Z 向上，未使用的点填 NaN，不能标记为实拍数据。

## 可访问性与检查

导航支持方向键与 Home/End。按钮、滑块和表单支持键盘；三维旋转提供按钮替代拖动。启用系统“减少动态效果”时默认暂停。

已观察桌面与 390×844 窄屏布局。Canvas 附有描述标签，关键读数同步显示为文本。2026-09-27 新增的理解页面已验证章节跳转、进入几何实验、全景图原始尺寸加载、150% 放大与横向滚动、适应宽度、Escape 关闭；窄屏页面无横向溢出，未观察到浏览器脚本错误。

23 项检查覆盖双目结果与误差趋势、时间差偏差、单机退化、夹角、投影、骨长、12 种 NPY 版本/端序/精度组合、异常文件、映射转换、CSV 来源。

浏览器检查覆盖暂停/拖帧、几何参数变化、单机深度不确定性、内置 NPY 文件解析回放及手机布局。本地文件选择自动化受浏览器工具行为限制，未完成该步骤的端到端验证；其解析和转换与内置样例共用相同代码。真实摄像头和用户录制尚未实测。
