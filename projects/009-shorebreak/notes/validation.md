# 本地交付验证

日期：2026-09-27。验证对象为本项目研究页与仓库汇总构建。

## 构建与内容检查

| 检查 | 结果 |
| --- | --- |
| `python scripts/projects.py check` | 通过，9 个项目元数据与总索引一致 |
| `python scripts/build_site.py --output dist/coast-preview` | 通过，9 个项目均进入汇总站点 |
| `node --check projects/009-shorebreak/web/app.js` | 通过 |
| 仓库构建脚本测试 | 10 项通过 |
| 静态页面检查 | 无重复 ID；本地链接、锚点、样式与图片存在；JPEG 文件头与扩展名一致；SVG 可解析 |
| 来源固定 | 源码链接固定至研究记录中的完整 40 位提交号 |

## 浏览器检查

- 桌面页面正常呈现，已保存[桌面截图](../assets/research-desktop.jpg)。
- 390 × 844 视口下检查了图片与说明、步骤切换和页面宽度；无页面横向溢出，宽表格在自身容器内滚动。已保存[手机布局截图](../assets/research-mobile.jpg)。
- 切换近岸截图后，图片与说明同步更新；选择翻卷步骤后，显示对应浪唇示意及源码说明。
- 固定导航已修正；两个研究页可以相互跳转；独立原理总图可打开。
- 两页共用相同的交互脚本；在 coastal-simulation 页检查了原站 iframe 插入与停止移除、用途推荐和总图展开。

## 验证边界

本次没有本地安装或构建上游，也未完整操作游泳、潜水和所有破浪阶段。原站默认视角与 `?clip` 固定视角已成功显示并保存截图；其余能力按文档与源码确认标注。未做统一硬件性能或数值精度基准。

研究页 JavaScript 使用 Node.js 22.15.0 做语法检查；这不代表上游支持该版本，上游要求 Node.js 24.x。

交付为本地静态页面，已接入现有 GitHub Pages 构建配置；未推送或发布，项目元数据 `demo` 留空。

## 正式部署验证（2026-09-27）

已发布到 [正式网页](https://yydshly.github.io/0927_codex_project/009-shorebreak/#overview)，页面与资源可访问。[成功工作流](https://github.com/yydshly/0927_codex_project/actions/runs/36315076602)；完整验证与范围见 [统一发布记录](../../010-algorithm-scene-lab/notes/deployment.md)。此前“未发布”说明记录的是本地研究阶段。
