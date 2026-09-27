# 海岸模拟库能力总览 · 制图说明

使用内置 image_gen 工具生成一张中文能力总览信息图。依据本地固定版本 `e5a80fe42b4eeba6c01de1467035bafd69592d3e` 的源码和项目研究说明整理；海岸配图是示意，不是运行截图。图内“可扩展”和“待开发”不能作为已实现能力。

## 最终绘图提示词

Use case: infographic-diagram / scientific-educational.
Create ONE polished high-resolution Chinese landscape infographic, approximately 3:2 aspect ratio, suitable for opening at full resolution and sharing. A carefully typeset editorial technical explainer with a restrained ocean-teal, deep navy, warm ivory and muted amber palette. Use large clean simplified-Chinese sans-serif typography, very clear hierarchy and crisp readable text. Off-white background with generous gutters; no clutter. Main title at top; a small beautiful isometric coastal cutaway illustration and the core definition directly under it; then a logically connected modular layout covering algorithms, visible effects, use cases and personal value. The bottom includes an execution flow and a narrow boundaries/progress strip. Distinguish existing source capabilities in teal from future extensions in amber. Use concise arrows and simple icons rather than decorative charts. No logos, no invented performance numbers. Sea illustration shows shallow waves around fixed rocks, foam, wet sand and sunlight, without an overturning barrel wave, boats or a waterfall. Label it “海岸示意 · 非运行截图”.

The following Chinese copy must appear verbatim, accurately rendered, legible and without omissions or duplicated sections. Layout the grouped blocks naturally; do not print these English instructions. Repository name is a small subtitle, not the main headline.

TITLE:
“一张图看懂：GPU 海岸模拟库”
Subtitle: “coastal-simulation-cuda-webshader”
Core definition: “让浅水在海岸、海床与固定礁石之间流动，并实时呈现三维效果。”
Three prominent tags: “模型：二维浅水高度场” / “画面：三维海岸” / “执行：GPU”

BLOCK 01 — “核心能力”
“水 × 地形：水深、绕流、冲滩、退水”
“水 × 岩石：阻挡、分流、泡沫、喷溅”
“水 × 表面：湿沙、水膜、湿岩石”
“海况与观看：浪强、风向、潮位、光照、视角、画质”

BLOCK 02 — “内部有哪些算法”
“浅水求解：有限体积、交错网格、保正通量、湿干边界”
“状态输运：动量与泡沫平流、破浪湍流近似、生成与衰减”
“水面重建：高度与法线、8组定向短波、时间插值”
“接触效果：湿润与水膜、撞击触发喷溅、粒子运动”
“视觉着色：GGX高光、反射与折射、阴影与材质”

BLOCK 03 — “能看见什么效果”
“绕石浪涌与白沫”
“冲滩、回流与水际线变化”
“退水后的湿沙反光”
“近景波纹与太阳高光”
“岩石撞击喷雾”

BLOCK 04 — “适合用在哪里”
Label “可直接研究与展示”
“海岸主题网页与互动展陈原型”
“实时图形、浅水算法教学”
“GPU计算与绘制流程研究”
Label “需要继续开发”
“海岸编辑器、礁石与堤岸布局工具、场景保存与分享”

BLOCK 05 — “对我的意义”
“看懂：算法怎样连续驱动画面”
“复用：已有海岸视觉与GPU数据流程”
“扩展：制作自己的海岸场景”
Small clarifier: “新增价值来自可编辑、可保存、可复用，而不只是多放一块石头。”

FLOW — “从代码到画面”
“CUDA源码” → “WGSL” → “WebGPU计算” → “GPU状态与纹理” → “Three.js绘制”
“GPU负责执行，模型决定能模拟什么；浏览器需要支持WebGPU。”

BOTTOM BOUNDARIES STRIP:
“能力边界：固定海岸与障碍为主；未提供船只浮力、地形侵蚀、管道与倒水模拟、完整三维翻卷水体。”
“012当前：已接入源库三维效果与单处新增礁石；自由地形编辑接入三维场景仍待开发。”

FOOTER:
“来源：SamG-Coder / coastal-simulation-cuda-webshader · 原场景：iamtechartist”
“依据源码版本 e5a80fe · 2026-09-27”

Constraints: Render every provided Chinese line accurately. Keep body copy large and readable, ample line spacing, clean grid, no text over busy water areas. This is an explainer about the existing source library with clearly labelled possible extensions. Do not imply universal water simulation, moving solid-body coupling, engineering prediction accuracy or native NVIDIA CUDA running in the browser. Produce one complete infographic, not a collage of separate posters.
