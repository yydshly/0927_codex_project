# 多个 Web 演示的远端部署

本仓库沿用 GitHub Pages 的统一站点结构，通过 `.github/workflows/deploy-pages.yml` 构建和发布。发布清单包含 **001 · 西安夜行图**、**002 · FreeMoCap 动作实验室**、**003 · Lofi Cities**、**004 · AI 工程面试题库导览** 和 **005 · Jailbreaks 越狱研究指南**；统一构建发布，保留已经上线的演示。

## 站点入口

- 站点索引：`https://yydshly.github.io/0927_codex_project/`
- 西安夜行图：`https://yydshly.github.io/0927_codex_project/001-xian-night-atlas/`。页面班次与可达范围为模拟数据。
- FreeMoCap 理解与应用：`https://yydshly.github.io/0927_codex_project/002-freemocap-lab/#capabilities`
- FreeMoCap 动作回放 / 重建实验：演示地址加 `#motion` / `#geometry`。
- Lofi Cities 独立演示：`https://yydshly.github.io/0927_codex_project/003-lofi-cities/`
- 产品理解：演示地址加 `#understanding`。
- AI 工程面试题库导览：`https://yydshly.github.io/0927_codex_project/004-ai-engineering-interview-guide/#overview`；完整引导图使用 `#guide-map`。
- Jailbreaks 越狱研究指南：`https://yydshly.github.io/0927_codex_project/005-jailbreaks-research/#overview`；完整引导图使用 `#guide-map`。

001、002、003 与 005 均已于 2026-09-27 完成发布和远端网页验证，正式地址已写入各自 `project.json` 的 `demo` 字段。[西安夜行图首次成功部署](https://github.com/yydshly/0927_codex_project/actions/runs/36299771812) 后，已在公开页面核对三维地图、夜游返程面板、五项摘要、原网页名称与使用本项目截图的引导图。班次与可达范围仍为模拟数据。

FreeMoCap 的五项加粗摘要、完整引导图及 150% 缩放、演示切换和合成 NPY 解析回放已通过公网检查；脚本、样式、PNG / SVG、数据样例与既有 Lofi Cities 页面均返回 HTTP 200。[FreeMoCap 首次成功部署](https://github.com/yydshly/0927_codex_project/actions/runs/36295964557)。Jailbreaks 的五项加粗摘要、完整引导图、25 条来源记录和参考来源链接已在公开页面核对；网页未进行模型越狱效果测试。[Jailbreaks 成功部署](https://github.com/yydshly/0927_codex_project/actions/runs/36297771926)。

AI 工程题库已在 2026-09-27 接入统一站点并完成公网检查：站点首页的「能力 / 内容 / 使用场景 / 对我的意义」四项摘要、004 页面、完整引导图、题目数据文件均返回 HTTP 200。网页收录 598 道题，232 道附外部参考链接，本站另为 45 道题整理中文答题要点；外链内容未逐条核验。[004 首次成功部署](https://github.com/yydshly/0927_codex_project/actions/runs/36302271824)。

## 构建和发布

`docs/site-projects.json` 是唯一的发布清单，`entrypoints` 配置各项目自己的体验与理解入口。`scripts/build_site.py` 支持项目的 `web/build.py` 或 `web/build.mjs`，汇总到 `dist/pages/`。站点摘要按各项目的能力、内容或呈现效果、使用场景与个人意义加粗分项，完整引导图按原始比例呈现。脚本要求输出目录为空，避免旧文件误入发布物；可用 `--output` 指定另一个空目录。

```sh
python scripts/projects.py check
python -m unittest discover -s scripts -p 'test_*.py'
npm --prefix projects/002-freemocap-lab/web test
npm --prefix projects/001-xian-night-atlas/web test
npm --prefix projects/003-lofi-cities/web run check
npm --prefix projects/003-lofi-cities/web test
npm --prefix projects/004-ai-engineering-interview-guide/web run build
npm --prefix projects/005-jailbreaks-research/web run check
python scripts/build_site.py
```

推送到 `main` 的相关修改，或手动运行 Deploy research demos 工作流，都会执行检查、构建、上传 Pages artifact 和部署。仓库 Settings → Pages 使用 GitHub Actions 来源。发布任务仅授予 `pages: write` 与 `id-token: write`，不在代码或浏览器中放入部署密钥。

站点使用相对资源路径与 hash 路由，适配五个已列入发布清单的项目子路径。只发布构建后的静态资源，不发布开发测试、依赖目录或用户本地数据。

## 增加其他子项目

1. 将源码和研究记录提交，Python 构建输出到 `dist/<编号-名称>/`，Node 构建输出到项目的 `web/dist/`。
2. 将目录名加入 `docs/site-projects.json`，同时补齐工作流中的项目检查和路径触发规则。
3. 统一构建、发布全部已上线项目，避免单独部署覆盖其他演示。
4. 实测远端资源、交互和截图，确认后填写 `demo` 并同步首页索引。

需要服务端、数据库或私密 API 的项目应另行部署后端；GitHub Pages 仅托管静态网页。

配置依据：[GitHub Pages 自定义工作流官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
