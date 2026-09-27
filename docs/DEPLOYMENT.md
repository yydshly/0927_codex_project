# 多个 Web 演示的远端部署

本仓库沿用 GitHub Pages 的统一站点结构，通过 `.github/workflows/deploy-pages.yml` 构建和发布。当前发布清单只包含 **003 · Lofi Cities**，其他本地子项目尚未加入本次发布。

## 站点入口

- 站点索引：`https://yydshly.github.io/0927_codex_project/`
- Lofi Cities 独立演示：`https://yydshly.github.io/0927_codex_project/003-lofi-cities/`
- 产品理解：演示地址加 `#understanding`。

003 已于 2026-09-27 完成首次发布和远端网页验证，演示地址已回填 `project.json` 的 `demo` 字段。其他项目仅在实测上线后填写该字段。

## 构建和发布

`docs/site-projects.json` 是唯一的已发布项目清单。`scripts/build_site.py` 构建其中每个项目，汇总到 `dist/pages/`，并生成带真实截图、源网页名称和来源链接的站点索引。脚本要求输出目录为空，避免旧文件误入发布物；可用 `--output` 指定另一个空目录。

```sh
python scripts/projects.py check
python -m unittest discover -s scripts -p 'test_*.py'
npm --prefix projects/003-lofi-cities/web run check
npm --prefix projects/003-lofi-cities/web test
python scripts/build_site.py
```

推送到 `main` 的相关修改，或手动运行 Deploy research demos 工作流，都会执行检查、构建、上传 Pages artifact 和部署。仓库 Settings → Pages 使用 GitHub Actions 来源。发布任务仅授予 `pages: write` 与 `id-token: write`，不在代码或浏览器中放入部署密钥。

站点使用相对资源路径与 hash 路由，适配 `/0927_codex_project/003-lofi-cities/` 子路径。只发布构建后的静态资源，不发布开发测试、依赖目录或本地数据。

## 增加其他子项目

1. 将源码和研究记录提交，确保已有构建能输出 `dist/<编号-名称>/`。
2. 将目录名加入 `docs/site-projects.json`，同时补齐工作流中的项目检查和路径触发规则。
3. 统一构建、发布全部已上线项目，避免单独部署覆盖其他演示。
4. 实测远端资源、交互和截图，确认后填写 `demo` 并同步首页索引。

需要服务端、数据库或私密 API 的项目应另行部署后端；GitHub Pages 仅托管静态网页。

配置依据：[GitHub Pages 自定义工作流官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
