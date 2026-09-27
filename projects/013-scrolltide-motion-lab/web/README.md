# Motion Atlas 网页演示

无需安装网页依赖。先在仓库根目录运行 `python projects/013-scrolltide-motion-lab/web/build.py`，再用 `python -m http.server 4328 --bind 127.0.0.1 --directory dist` 提供静态服务，访问 `http://127.0.0.1:4328/013-scrolltide-motion-lab/`。

| 文件 | 用途 |
| --- | --- |
| `index.html`、`styles.css` | 项目理解、五张源站样例截图、六段原创演示、技术说明与响应式布局 |
| `app.mjs` | 视频控件、Canvas 帧序列、两套 Three.js 场景、CSS 3D 轮播和 WebGL Shader |
| `media/eagle-flight.mp4`、`media/eagle-poster.jpg` | 原创金雕飞近镜头的单次视频首屏 |
| `media/alpine-flight.mp4` | 战机合成场景的航拍视频底层 |
| `media/watch-frames/` | 72 张原创腕表微距 WebP 帧 |
| `media/gallery-source.png` | 五张建筑与自然摄影卡片的原创画面 |
| `media/*-source.png`、`media/eagle-cutout.png` | 可重新生成视频与帧序列的原始画面 |
| `make_cinematic_media.py` | 从上述原始画面重新生成本地 MP4 和 WebP |
| `vendor/` | Three.js 0.186.1 的本地模块及 MIT 许可证 |
| `../assets/source-*.png` | 从 Scrolltide 公开样例页实拍的视觉引导图；构建时复制到网站 `assets/` |
| `build.py` | 检查所需素材并复制到 `dist/013-scrolltide-motion-lab/` |

页面不依赖 CDN 或远端 API。WebGL 不可用时，对应场景提供文字提示；视频、逐帧 Canvas 和 CSS 3D 仍可运行。部署方式见 [仓库说明](../../../docs/DEPLOYMENT.md)。
