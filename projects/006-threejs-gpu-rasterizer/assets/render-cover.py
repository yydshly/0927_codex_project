"""Render the project's original guide image with Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parent
W, H = 1600, 900
im = Image.new("RGB", (W, H), "#071925")
draw = ImageDraw.Draw(im)
font_path = "C:/Windows/Fonts/msyh.ttc"
bold_path = "C:/Windows/Fonts/msyhbd.ttc"
font = lambda size, bold=False: ImageFont.truetype(bold_path if bold else font_path, size)

for y in range(H):
    t = y / H
    r = int(8 + 6 * t)
    g = int(29 + 30 * t)
    b = int(41 + 34 * t)
    draw.line((0, y, W, y), fill=(r, g, b))

draw.rounded_rectangle((52, 47, 1548, 853), radius=28, outline="#3b6470", width=2, fill="#0b2632")
draw.text((95, 88), "006  /  THREE.JS GPU RASTERIZER", font=font(26, True), fill="#81f0d8")
draw.text((95, 149), "看见该看的", font=font(78, True), fill="#ecf8f0")
draw.text((98, 261), "海上风电场巡检 · 高密度三维渲染研究", font=font(31), fill="#c0d7d3")

left = (94, 341, 1052, 778)
draw.rounded_rectangle(left, radius=18, fill="#123a4b", outline="#487382", width=2)
for y in range(343, 777):
    t = (y - 343) / 434
    draw.line((96, y, 1050, y), fill=(int(16 + 13*t), int(57 + 34*t), int(73 + 38*t)))
for row in range(5):
    depth = row / 4
    yy = int(415 + depth * 330)
    span = 190 + depth * 380
    for col in range(8):
        x = int(575 + (col - 3.5) * span / 4)
        size = 12 + depth * 30
        if not (120 < x < 1030):
            continue
        base = (x, yy)
        top = (x, int(yy - size * 2.1))
        color = "#d9efea" if row >= 2 else "#9fbec5"
        draw.line((base, top), fill=color, width=max(2, int(size / 7)))
        draw.ellipse((x-size*.31, top[1]-size*.31, x+size*.31, top[1]+size*.31), fill="#dff1e8")
        for angle in (-math.pi/2, math.pi/6, math.pi*5/6):
            end = (int(x + math.cos(angle)*size*.82), int(top[1] + math.sin(angle)*size*.82))
            draw.line((x, top[1], end[0], end[1]), fill=color, width=max(2, int(size/10)))
        draw.ellipse((x-size*.17, yy-size*.11, x+size*.17, yy+size*.11), fill="#2c6d7d")
draw.ellipse((543, 644, 611, 671), outline="#d8f08b", width=5)
draw.rounded_rectangle((118, 361, 458, 405), radius=13, fill="#0b2e3c", outline="#5caeaa", width=1)
draw.text((140, 369), "144 台模拟风机 · 交互巡检", font=font(21, True), fill="#d8f8eb")

draw.rounded_rectangle((1080, 341, 1506, 778), radius=18, fill="#102f3b", outline="#487382", width=2)
draw.text((1114, 377), "原理", font=font(28, True), fill="#80eed5")
steps = [
    ("01", "GPU 筛选", "镜头内的小组 + 合适精度"),
    ("02", "混合绘制", "小三角形 / 大三角形分流"),
    ("03", "按需上色", "只处理最终可见的像素"),
]
for i, (number, title, description) in enumerate(steps):
    top = 436 + i * 100
    draw.line((1114, top-15, 1472, top-15), fill="#3c6571", width=2)
    draw.text((1114, top), number, font=font(23, True), fill="#d8f08b")
    draw.text((1170, top-3), title, font=font(25, True), fill="#eef7f0")
    draw.text((1170, top+36), description, font=font(18), fill="#aec8c8")

draw.text((103, 810), "业务场景：数字孪生 · 工业巡检 · BIM 审阅", font=font(24), fill="#b6d0d1")
draw.text((1288, 810), "RESEARCH NOTE", font=font(20, True), fill="#83c9bf")
im.save(ROOT / "guide.png", optimize=True)
print(ROOT / "guide.png")
