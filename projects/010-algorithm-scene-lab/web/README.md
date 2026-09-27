# 算法与场景实验室

浏览器原生 ES modules 与 Canvas 2D，全部教学计算在本地运行，无依赖安装。

```sh
node --test projects/010-algorithm-scene-lab/web/model.test.mjs
python projects/010-algorithm-scene-lab/web/build.py
python -m http.server 4328 --bind 127.0.0.1 --directory dist
```

打开 `http://127.0.0.1:4328/010-algorithm-scene-lab/`。从仓库根目录执行；若端口已提供服务，无需重复启动。

统一汇总入口为同目录的 `summary.html`，提供三页导览、理解汇总、十个模块、八种场景配方、四级扩展和总图缩放。跨项目截图与研究页链接需要先构建 008 / 009，或使用仓库总构建。

| 文件 | 职责 |
| --- | --- |
| `catalog.mjs` | 场景目标、算法说明、参数范围、引导实验、来源 |
| `models.mjs` | 独立的波浪、流动、输运、湿度、光学、弹道与材质计算 |
| `render.mjs` | 统一 A/B 画面、固定色标、时间曲线 |
| `checks.mjs` | 页面与 Node 共用的 24 项数值检查 |
| `model.test.mjs` | 默认、最小、最大配置检查与 60 秒浅水稳定性检查 |
| `app.mjs` | 参数、场景、参考固定、时间控制、检查、分享和导出 |
| `build.py` | 将需要的静态文件复制到根目录 dist，不安装依赖 |
| `summary-data.json` | 总览图、网页和文字汇总共用的内容来源 |
| `build_summary.py` | 标准库生成 summary.html、SVG 总图和 notes/synthesis.md |
| `summary.css` / `summary.js` | 汇总页响应式布局、原图缩放与阅读交互 |
| `render_poster.py` | 制作时使用 Pillow 与本机中文字体导出高清 PNG；普通构建不依赖 Pillow |

两侧共享时间、随机种子和显示尺度。只有 IFFT 初始频谱使用随机种子，其他模型确定性运行。参数变化后从零同步重播；停止播放时可单步推进 1/30 秒；隐藏页面暂停推进。

URL 查询参数记录算法、场景、A/B 配置和种子；数值限制到参数允许范围。链接不保存手动扰动或播放位置。JSON 导出包含参数、当前时间、数值、近期曲线和检查结果。

实验均为独立教学实现。不得将页面检查通过描述为上游原库、物理精度或跨设备性能通过。`optics` 的体积积分只验证均匀介质吸收；`waves` 使用 Gaussian 教学谱，并非完整 JONSWAP。

总构建使用 `python scripts/build_site.py --output dist/<尚不存在或空的目录>`，输出包含全部项目和首页。未发布时不要在元数据填写线上演示链接。

修改总图内容时，先运行 `build_summary.py`，再运行 `render_poster.py --font C:/Windows/Fonts/msyh.ttc --bold C:/Windows/Fonts/msyhbd.ttc` 更新 PNG，最后运行正常构建。字体路径按实际系统调整；提交的 PNG 可直接用于其他系统的静态构建。两种图片具有相同内容与尺寸。
