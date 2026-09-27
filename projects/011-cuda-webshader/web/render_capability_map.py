"""Render a single-page, Chinese capability map for the research gallery."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


HERE = Path(__file__).resolve().parent
OUT = HERE / "capability-map.png"
W, H = 2200, 1770

FONT_PATHS = [
    Path("C:/Windows/Fonts/msyh.ttc"),
    Path("C:/Windows/Fonts/simhei.ttf"),
    Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
]
FONT_PATH = next((path for path in FONT_PATHS if path.exists()), None)
if FONT_PATH is None:
    raise RuntimeError("A CJK font is required to render the map")


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size)


image = Image.new("RGB", (W, H), "#08151e")
d = ImageDraw.Draw(image)

INK = "#f2fbf8"
MUTED = "#a9c1c7"
TEAL = "#9df1dc"
TEAL_DARK = "#173f45"
AMBER = "#f2c48b"
AMBER_DARK = "#493c30"
BORDER = "#31515c"


def box(x0, y0, x1, y1, fill, outline=None, radius=22, width=2):
    d.rounded_rectangle((x0, y0, x1, y1), radius=radius, fill=fill,
                        outline=outline, width=width)


def label(x, y, value, size, fill=INK, *, anchor=None):
    d.text((x, y), value, font=font(size), fill=fill, anchor=anchor,
           stroke_width=0)


def line(x0, y0, x1, y1, fill=BORDER, width=2):
    d.line((x0, y0, x1, y1), fill=fill, width=width)


# Quiet background structure: the content stays legible at reduced size.
for x in range(55, W, 82):
    line(x, 0, x, H, "#0e2530", 1)
for y in range(43, H, 82):
    line(0, y, W, y, "#0e2530", 1)
d.ellipse((1640, -430, 2530, 460), fill="#102f37")
d.ellipse((-370, 1060, 430, 1860), fill="#0e3034")

# Heading.
label(76, 42, "CUDA WebShader", 40, TEAL)
label(76, 100, "一张图看懂：算法 → 效果 → 现实用途", 62)
label(80, 188, "定位：让受支持的 CUDA C 计算核函数，在浏览器 WebGPU 上并行运行。", 31, MUTED)
box(1780, 44, 2124, 96, "#193d40", "#3c7878", radius=26)
label(1952, 70, "50 项上游样例  ·  5 类能力", 24, TEAL, anchor="mm")

# Responsibility chain.
chain_y0, chain_y1 = 264, 450
steps = [
    (80, 561, "01  开发者提供", "CUDA C 核函数 + 输入数据", "算法 / 数据"),
    (600, 1080, "02  库做转换", "把受支持代码转成 WGSL", "CUDA → WGSL"),
    (1120, 1600, "03  浏览器计算", "WebGPU 并行更新大量数值", "GPU 计算"),
    (1640, 2120, "04  应用把结果画出来", "像素 / 粒子 / 网格 / 曲线", "可见效果"),
]
for i, (x0, x1, heading, description, tag) in enumerate(steps):
    box(x0, chain_y0, x1, chain_y1, "#112b36" if i != 1 else "#174049", "#3c6370")
    label(x0 + 28, chain_y0 + 20, heading, 27, TEAL if i == 1 else "#a8d4d5")
    label(x0 + 28, chain_y0 + 70, tag, 42, INK)
    label(x0 + 28, chain_y0 + 134, description, 25, MUTED)
for x in (580, 1100, 1620):
    d.polygon(((x-9, 346), (x+8, 357), (x-9, 368)), fill=TEAL)

# Matrix header and explicit provenance distinction.
label(80, 483, "源库已经展示的计算", 29, TEAL)
label(810, 483, "能看到的效果", 29, TEAL)
label(1420, 483, "可延伸的现实场景  ·  应用推演", 29, AMBER)
line(80, 530, 2120, 530, "#4f7680", 3)
line(772, 530, 772, 1435, "#294a55", 2)
line(1382, 530, 1382, 1435, "#294a55", 2)

rows = [
    {
        "name": "动态模拟", "count": "8 项", "color": "#87ead5",
        "alg1": "SPH 溃坝 / 交互流体 / FFT 海洋",
        "alg2": "烟雾粒子 / 碰撞 / N 体 / 波动",
        "effect1": "浪面起伏、液体流动",
        "effect2": "烟雾扩散、粒子轨迹",
        "scene1": "海岸科普、互动展屏",
        "scene2": "游戏水面或特效背景",
    },
    {
        "name": "图像与纹理", "count": "21 项", "color": "#9bd1f1",
        "alg1": "Sobel / 光流 / 双目视差",
        "alg2": "降噪 / 卷积 / 模糊 / DCT / 贴图",
        "effect1": "边缘、运动方向、深度",
        "effect2": "照片滤波前后对比",
        "scene1": "网页修图、视频运动分析",
        "scene2": "双摄深度结果预览",
    },
    {
        "name": "三维与体数据", "count": "7 项", "color": "#c8b4ef",
        "alg1": "Marching Cubes / 体渲染",
        "alg2": "三维纹理 / 体滤波 / FDTD",
        "effect1": "可旋转表面、内部切片",
        "effect2": "体数据变化与波场",
        "scene1": "扫描、材料、地形数据浏览",
        "scene2": "传播过程教学演示",
    },
    {
        "name": "数值与信号", "count": "10 项", "color": "#d1e6a0",
        "alg1": "FFT / Walsh / Haar 变换",
        "alg2": "GPU 排序 / Sobol 准随机采样",
        "effect1": "频谱、滤波结果",
        "effect2": "排序与采样分布",
        "scene1": "大图处理、传感器信号分析",
        "scene2": "网页端大量数据计算",
    },
    {
        "name": "几何与渲染", "count": "4 项", "color": "#efb99c",
        "alg1": "四叉树 / 贝塞尔曲线",
        "alg2": "路径追踪 / Mandelbrot 分形",
        "effect1": "空间划分、平滑曲线",
        "effect2": "反射材质、分形细节",
        "scene1": "地图与路径编辑、材质预览",
        "scene2": "数学可视化展项",
    },
]

row_top, row_h = 548, 177
for i, row in enumerate(rows):
    y0 = row_top + i * row_h
    y1 = y0 + row_h - 11
    bg = "#112a35" if i % 2 == 0 else "#102630"
    box(80, y0, 2120, y1, bg, "#294c58", radius=17, width=2)
    box(98, y0 + 19, 110, y1 - 19, row["color"], radius=6)
    label(135, y0 + 19, row["name"], 38, INK)
    box(403, y0 + 21, 501, y0 + 66, "#1b4148", "#416a6e", radius=20)
    label(452, y0 + 43, row["count"], 23, row["color"], anchor="mm")
    label(135, y0 + 83, row["alg1"], 27, "#cadbe0")
    label(135, y0 + 122, row["alg2"], 27, "#cadbe0")
    label(810, y0 + 45, row["effect1"], 31, INK)
    label(810, y0 + 100, row["effect2"], 31, INK)
    label(1420, y0 + 45, row["scene1"], 31, AMBER)
    label(1420, y0 + 100, row["scene2"], 31, AMBER)

# Fit check and value to this particular research workspace.
box(80, 1445, 2120, 1685, "#173039", "#5a8184", radius=23, width=2)
label(112, 1472, "什么时候用？", 34, TEAL)
label(112, 1529, "有可复用的 CUDA 算法  +  网页需反复处理大量数据  +  目标设备支持 WebGPU", 29, INK)
line(112, 1582, 2088, 1582, "#43656d", 2)
label(112, 1603, "对你的价值", 34, AMBER)
label(342, 1611, "让海岸 / Three.js / 算法展厅的计算结果驱动画面，并验证精度与速度。", 28, INK)

label(80, 1711, "边界：50 项是计算样例；现实用途需接入真实数据与界面。写实场景还要建模、材质和光照；工程预测还需校验。", 23, MUTED)
label(80, 1744, "依据：SamG-Coder/cuda-webshader README 与 50 项 Showcase；场景与价值由本站归纳。", 21, "#819da6")

image.save(OUT, optimize=True)
print(OUT)
