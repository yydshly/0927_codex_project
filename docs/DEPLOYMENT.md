# 多个 Web 演示的部署规划

当前仅初始化研究仓库和演示目录模板，**尚未部署任何 Web，也未启用 Pages 发布流程**。后续根据第一个实际子项目的技术栈补充构建和发布配置。

## 地址与目录

GitHub Pages 每个仓库提供一个站点，可以在该站点的不同子路径放置多个静态演示。因此本仓库计划统一汇总构建产物，再一次性发布，详见 [GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)。

默认域名下的计划地址如下；这些地址目前不是已上线的演示链接：

```text
https://yydshly.github.io/0927_codex_project/
├── 001-project-a/
└── 002-project-b/
```

每个项目的源码保存在 `projects/<编号-名称>/web/`。将来发布时，由统一流程构建到以下结构；`dist/` 为生成目录，不提交到源码仓库：

```text
dist/
├── index.html              # 所有已部署演示的导航页
├── 001-project-a/          # 第一个演示的静态构建产物
└── 002-project-b/          # 第二个演示的静态构建产物
```

## 接入第一个演示时

1. 在子项目 `web/README.md` 写明安装、开发、构建命令及运行环境。
2. 按该项目的框架配置资源基础路径，例如 `/0927_codex_project/001-project-a/`，验证图片、脚本和样式在该路径下正常加载。
3. 对需要前端路由的应用验证刷新行为，按框架选择静态导出或 hash 路由方案。
4. 增加一个统一的发布工作流，构建所有已接入的演示，将它们汇总到同一个 Pages artifact。以后增加项目时更新汇总步骤，避免各子项目独立发布导致站点内容被覆盖。
5. 在仓库 Settings → Pages 中配置 GitHub Actions 发布来源，按[官方自定义工作流指南](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)设置部署权限和环境。
6. 上线后验证演示地址，再将完整 URL 写入对应 `project.json` 的 `demo` 字段，更新首页索引。

## 需要服务端的项目

GitHub Pages 用于静态资源托管。需要常驻后端、数据库或私密 API 密钥的项目，在对应子项目中记录外部服务的部署方式；也可提供明确标注模拟数据的纯前端演示。配置字段可写入 `.env.example`，实际密钥由部署环境提供。

尚未确定框架的子项目可以暂时只有研究笔记与运行截图；准备好可演示内容后再接入发布流程。
