# 012 能力导览与 GPU 实验台

在仓库根目录构建并本地查看：

```sh
python projects/012-coastal-simulation-cuda-webshader/web/build.py
python -m http.server 4328 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:4328/012-coastal-simulation-cuda-webshader/`，再点“体验源库三维场景”，或直接打开 `/012-coastal-simulation-cuda-webshader/extensions.html`。实验台默认运行随本站打包的上游固定版本，可看完整三维海岸、浪、白沫和喷雾，并切换视角、海况、潮位及画质。“场景版本”还可切换原版和本站新增一处礁石的扩展版；扩展版让新增障碍进入源库原有 GPU 求解和三维绘制，切换时会重新初始化，并保持外海视角以便比较。切到“地形数据诊断”后，可切换程序化地形、导入灰度高度图、画岩石、调节并保存海况、逐档记录 P50/P95 帧时间与下载 JSON。切换模式会卸载源库场景，避免两套 WebGPU 程序同时运行。自定义海况使用当前浏览器的 localStorage。

首页的能力卡、原理、使用场景和证据说明随本站静态提供；点击“加载本地源库场景”后按需加载 `upstream/`，可以同源检查真实 WebGPU 状态。它固定在 [SamG-Coder/coastal-simulation-cuda-webshader](https://github.com/SamG-Coder/coastal-simulation-cuda-webshader) 提交 `e5a80fe42b4eeba6c01de1467035bafd69592d3e`，原场景来自 iamtechartist。版权与许可证见 [`upstream/CREDITS.md`](upstream/CREDITS.md)、[`upstream/LICENSE`](upstream/LICENSE) 和 [`upstream/INTEGRATION.md`](upstream/INTEGRATION.md)。

“地形数据诊断”是独立编写的简化二维浅水教学模型；它不会把任意高度图送入上游三维场景。岩石写入同一份海床/障碍缓冲，WebGPU 计算水深、水平速度和泡沫，WebGPU 绘制俯视诊断画面。帧时间是浏览器画面间隔，包含调度等开销；不等于 GPU 内核耗时，也不可与上游 README 的硬件数字直接比较。首页图形、架构 SVG 与新增 PNG 能力总览均为示意，非上游模拟截图。

构建同时复制总览图和完整本地运行包。项目级 `.gitignore` 对这份发布用 `web/upstream/` 放行；提交时需要包含它，不能仅提交外围页面。模型、效果和 GPU 的区别，以及适用场景和待开发能力，见[理解与应用结论](../notes/understanding.md)。
