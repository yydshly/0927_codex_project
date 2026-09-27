# coastal-simulation 中文研究展示页

这是研究展示与原理说明页。真实运行效果来自上游截图及按需加载的官方演示，本页不重写或打包上游流体模拟。

## 本地构建与浏览

在仓库根目录运行（Python 3.10+，无需第三方依赖）：

```sh
python projects/008-coastal-simulation/web/build.py
python -m http.server 4328 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:4328/008-coastal-simulation/`。两库互相跳转需要分别构建两个项目；研究总索引由 `scripts/build_site.py` 汇总生成。

## 内容与交互

- `content.json`：独立维护中文研究内容和固定提交来源。
- `build.py`：生成完整静态 HTML 与 SVG 原理图，将文件复制到仓库 `dist/008-coastal-simulation/`。不需要联网。
- `app.js`：截图切换、原理步骤、用途建议、原站 iframe 加载/释放及复制命令。
- `styles.css`：桌面、手机、键盘焦点、减少动画和打印布局。
- `index.html`：由构建生成并纳入源码的完整正文，关闭 JavaScript 仍可阅读。

## 集成与发布

已接入 `docs/site-projects.json` 和现有 GitHub Pages 工作流。采用相对资源链接与锚点，支持项目子路径。此轮只构建和本地验证，不填写未经上线验证的 URL。

本页可离线阅读静态内容；原站演示和 GitHub 源码链接需要网络。原站允许嵌入时可在页内运行，否则使用独立窗口链接。加载事件只表示 iframe 返回，不能证明跨域三维场景已完成预热。
