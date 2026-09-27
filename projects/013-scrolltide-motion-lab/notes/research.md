# 研究与实现记录

## 来源

- 参考网页：[Scrolltide](https://www.scrolltide.co/)，2026-09-27 查看。
- [Eagle](https://www.scrolltide.co/templates/eagle) 描述为播放一次并停在终帧的视频首屏。
- [Ora](https://www.scrolltide.co/templates/ora) 描述为 240 张 WebP 的 Canvas 滚动逐帧动画。
- [Scowlby](https://www.scrolltide.co/templates/scowlby) 描述为 97 帧序列随鼠标移动。
- [Vesper](https://www.scrolltide.co/templates/vesper) 标注 WebGL、Three.js、GSAP 和滚动控制的三维模型。
- [AeroForce](https://www.scrolltide.co/templates/aeroforce) 描述了背景逐帧画面与前景 Three.js 飞机的组合。
- [Apogee](https://www.scrolltide.co/templates/apogee) 描述连续地球镜头，滚动改变相机和光照。
- [Depth Carousel](https://www.scrolltide.co/components) 的公开说明提到封面向纵深后退并逐渐侧转，使用 CSS 3D，不用 Canvas。
- [Tide Swirl](https://www.scrolltide.co/shaders) 的公开说明是缓慢旋转的冷蓝色丝带；Shader 目录提供 MP4、静帧和 React 组件三种使用方式。

这些是站方对其作品的公开说明与预览画面。本站没有获取其付费提示词、模板源码或素材，因此以原创画面重新演绎其镜头构图和交互方法，不能据此验证站方各模板的完整运行方式。五张页面实拍截图仅用于引导图，详见 `assets/README.md`。尤其注意：截图只能证明当时预览画面的可见效果；实现方式依据站方公开文字，不能单凭截图推断。

## 六条实现路线

1. **Eagle / 视频**：金雕透明切图在航拍背景上从远到近合成并编码为单个 MP4；网页只播放一次，结束保留终帧。布局和文字仍是 DOM。
2. **Ora / 预渲染序列**：72 张腕表 WebP 由脚本预制。Canvas 根据滚动、拖动和时间轴进度绘制指定帧，可精确倒放。
3. **Vesper / 实时三维**：Three.js 构造酒瓶几何、玻璃与酒液材质、标签和光源；拖动改变模型角度，滚动使瓶身倾斜。
4. **AeroForce / 混合合成**：原创雪山航拍 MP4 与透明 WebGL 画布分层；战机根据鼠标位置倾斜，并可独立改变深度。此演示用 MP4 作为背景，站方原作公开说明使用 240 张逐帧画面。
5. **Depth Carousel / CSS 3D**：五张原创摄影卡片通过 CSS 透视、侧转、后退和模糊呈现纵深；卡片文字仍可选择。
6. **Tide Swirl / Shader**：WebGL 画一个全屏矩形，片元着色器按时间、位置和颜色参数计算蓝白色流动丝带。

## 素材与许可

- `web/media/*-source.png` 和 `eagle-cutout.png` 是使用内置 ImageGen 生成的原创画面；`web/make_cinematic_media.py` 使用 Pillow 与 ffmpeg 从这些画面制作 MP4 和 72 张腕表 WebP。
- `web/vendor/three.module.js` 和 `three.core.js` 来自本仓库 006 子项目安装的 Three.js 0.186.1，保留 `THREE-LICENSE.txt`。
- 仅在效果引导中展示标注来源的 Scrolltide 公开样例截图；互动演示不引用其预览视频、模板源码或付费素材。

### 原创图片生成提示词

以下素材使用内置 ImageGen 制作，最终文件保存在 `web/media/`：

- `eagle-source.png`：真实金雕正面展翼，飞过冷色阿尔卑斯山谷，电影感自然摄影，无文字与标志。
- `eagle-cutout.png`：以 `eagle-source.png` 为编辑目标，保留金雕完整羽翼、头部与爪，移除山景，输出透明背景。
- `watch-source.png`：无品牌不锈钢腕表，深色表盘，三分之四正面视角，精密表盘细节与高端摄影灯光。
- `alps-source.png`：高空俯瞰层叠雪山和云雾，中央留有战机叠加空间，无飞机与文字。
- `gallery-source.png`：五幅并排建筑与自然摄影，主题分别为红色沙漠建筑、雾海悬崖、石质楼梯、银色未来建筑、温室花园。

## 验证记录

2026-09-27 在本地静态服务器和 Codex 浏览器中核对：

- MP4 可加载播放并暂停，Eagle 播放结束保留终帧；速度控制修改 `playbackRate`。
- 图片序列包含 72 张本地 WebP；页面滚动改变腕表特写帧。
- Three.js 酒瓶和战机由 WebGL 实时绘制，背景透明。
- CSS 3D 摄影轮播与蓝色流体 Shader 已在本地浏览器可视检查。
- 窄屏 375px 下六幕均以单列显示，未出现水平溢出；腕表、酒瓶、战机、轮播和 Shader 均完成可视检查。
- 腕表时间轴可跳至第 72 帧；战机深度控制从 50% 更新到 51%；轮播键盘操作使当前卡片从 03 切换为 04。
- `node --check`、项目静态构建、13 个项目的元数据检查与统一站点完整构建通过。统一站点构建使用新的空 QA 输出目录；默认 `dist/pages` 已有内容，按构建脚本规定不覆盖。

本次补充 2026-09-27 的五张源站实拍截图和项目理解。线上发布后，以 GitHub Pages 构建结果与实际图片加载作为最终验证依据。
