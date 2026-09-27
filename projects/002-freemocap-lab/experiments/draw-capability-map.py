"""Draw the original, text-accurate FreeMoCap reference diagram as PNG and SVG."""
from pathlib import Path
from html import escape
import math
import re
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets'
W, H, SCALE = 1800, 4760, 1.5
BG = '#f5f4ee'
INK = '#172c34'
MUTED = '#52656a'
TEAL = '#087f7d'
TEAL_BG = '#e8f4ef'
PURPLE = '#6956a1'
PURPLE_BG = '#f0edf8'
ORANGE = '#b45c27'
ORANGE_BG = '#fff0e2'
LINE = '#d7dfda'
WHITE = '#ffffff'
REG = 'C:/Windows/Fonts/msyh.ttc'
BOLD = 'C:/Windows/Fonts/msyhbd.ttc'
im = Image.new('RGB', (int(W*SCALE), int(H*SCALE)), BG)
d = ImageDraw.Draw(im)
svg = []
fonts = {}
checks = []

def font(size, bold=False):
    key = (size, bold)
    if key not in fonts:
        fonts[key] = ImageFont.truetype(BOLD if bold else REG, round(size*SCALE))
    return fonts[key]

def width(s, size, bold=False):
    return d.textlength(s, font=font(size, bold))/SCALE

def rect(x, y, w, h, fill, stroke=None, r=0, sw=1):
    coords = tuple(round(v*SCALE) for v in (x,y,x+w,y+h))
    if r:
        d.rounded_rectangle(coords, round(r*SCALE), fill, stroke, round(sw*SCALE))
    else:
        d.rectangle(coords, fill, stroke, round(sw*SCALE))
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{sw}"/>')

def line(points, fill=LINE, sw=2):
    d.line([(round(x*SCALE),round(y*SCALE)) for x,y in points], fill=fill, width=round(sw*SCALE), joint='curve')
    svg.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in points)}" fill="none" stroke="{fill}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"/>')

def circle(x,y,r,fill,stroke=None,sw=1):
    d.ellipse(tuple(round(v*SCALE) for v in (x-r,y-r,x+r,y+r)), fill, stroke, round(sw*SCALE))
    svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{sw}"/>')

def poly(points, fill):
    d.polygon([(round(x*SCALE),round(y*SCALE)) for x,y in points], fill=fill)
    svg.append(f'<polygon points="{" ".join(f"{x},{y}" for x,y in points)}" fill="{fill}"/>')

def arrow(x1,y1,x2,y2,color=TEAL,sw=3):
    line([(x1,y1),(x2,y2)],color,sw)
    a=math.atan2(y2-y1,x2-x1)
    end=(x2,y2)
    b=(x2-12*math.cos(a)+6*math.sin(a),y2-12*math.sin(a)-6*math.cos(a))
    c=(x2-12*math.cos(a)-6*math.sin(a),y2-12*math.sin(a)+6*math.cos(a))
    poly([end,b,c],color)

def text(x,y,s,size=26,color=INK,bold=False):
    tw=width(s,size,bold)
    checks.append((s,x,y,tw,size))
    d.text((round(x*SCALE),round(y*SCALE)),s,font=font(size,bold),fill=color,anchor='lt')
    svg.append(f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}" dominant-baseline="text-before-edge">{escape(s)}</text>')

def wrap(s,w,size=26,bold=False):
    result=[]
    for para in s.split('\n'):
        current=''
        for ch in re.findall(r'[A-Za-z0-9_./%+−-]+|.', para):
            if current and width(current+ch,size,bold)>w:
                if ch in '，。；：、！？）”：' and width(current+ch,size,bold)<=w+size*.8:
                    current+=ch
                    continue
                result.append(current.rstrip())
                current=ch.lstrip()
            else:
                current+=ch
        result.append(current)
    return result

def para(x,y,s,w,size=26,color=MUTED,bold=False,lh=None):
    lh=lh or size*1.55
    for row in wrap(s,w,size,bold):
        text(x,y,row,size,color,bold)
        y+=lh
    return y

def block(x,y,w,h,title,body,color=TEAL,fill=WHITE,title_size=29,body_size=25):
    rect(x,y,w,h,fill,LINE,14)
    rect(x,y,5,h,color,r=2)
    text(x+24,y+22,title,title_size,color,True)
    end=para(x+24,y+69,body,w-48,body_size)
    assert end<=y+h-8,(title,end,y+h)

def section(n,y,title,subtitle=None,color=TEAL):
    rect(64,y,55,47,color,r=10)
    text(75,y+9,f'{n:02}',27,WHITE,True)
    text(136,y+2,title,35,INK,True)
    if subtitle:
        text(136,y+50,subtitle,24,MUTED)
    return y+(96 if subtitle else 72)

def camera(x,y,label,flip=False,color=TEAL):
    rect(x-37,y-25,65,46,color,r=7)
    if flip:
        poly([(x-37,y-14),(x-62,y-27),(x-62,y+23),(x-37,y+13)],color)
    else:
        poly([(x+28,y-14),(x+54,y-27),(x+54,y+23),(x+28,y+13)],color)
    line([(x-2,y+22),(x-2,y+55),(x-27,y+75)],color,3)
    line([(x-2,y+55),(x+22,y+75)],color,3)
    text(x-65,y+91,label,25,color,True)

def skeleton(cx,cy,scale=1,color=TEAL):
    pts={'head':(0,-79),'neck':(0,-44),'ls':(-38,-38),'rs':(38,-38),
         'le':(-66,-4),'re':(63,-80),'lw':(-90,23),'rw':(30,-126),
         'hip':(0,39),'lh':(-22,42),'rh':(22,42),'lk':(-31,98),'rk':(34,100),
         'la':(-40,155),'ra':(50,153)}
    pts={k:(cx+x*scale,cy+y*scale) for k,(x,y) in pts.items()}
    edges=[('head','neck'),('neck','ls'),('neck','rs'),('ls','le'),('le','lw'),('rs','re'),('re','rw'),('neck','hip'),('hip','lh'),('hip','rh'),('lh','lk'),('lk','la'),('rh','rk'),('rk','ra')]
    for a,b in edges: line([pts[a],pts[b]],color,4)
    for k,p in pts.items(): circle(*p,5 if k!='head' else 15,WHITE,color,3)
    return pts

# Header: the one-sentence mental model is visible before any technical detail.
rect(0,0,W,267,INK)
rect(64,46,8,110,'#65d1be',r=3)
text(93,43,'FreeMoCap',74,WHITE,True)
text(571,63,'能力全景图',52,WHITE,True)
text(94,139,'把真人运动变成三维数据，再用于分析或驱动角色',34,'#bce6dc')
text(94,204,'开源无标记动捕  /  多视角几何重建  /  可复用的动作数据',24,'#d9e1df')
text(1433,55,'研究图谱  002',22,'#bce6dc')
text(1433,92,'2026.09.27',24,WHITE)

# 01 Inputs.
y=section(1,302,'输入与启动条件','关键是多个视角的数据，处理时不必一直连接摄像头。')
block(64,y,824,159,'现场采集','连接 2 台或更多摄像头，从不同角度同时拍摄同一个人的动作。')
block(912,y,824,159,'已有录像','同一次动作的多视角同步视频 + 对应标定数据；导入后离线处理。')
y+=178
rect(64,y,1672,77,TEAL_BG,r=12)
text(89,y+24,'已知尺寸的标定板  ·  时间对齐  ·  身体处于共同视野  ·  摄像头移动后重新标定',27,TEAL,True)
y+=96
para(66,y,'至少两个有效视角才能做多视角三维重建。单摄像头可用于采集或二维识别；样例录像也可用于学习。',1670,25)

# 02 Native processing plus an actual ray diagram.
y=section(2,765,'技术原理：AI 找点，几何定位','AI 认出身体部位，几何算法计算空间位置，时序处理改善连续性。')
steps=[('采集与同步','对齐同一时刻\nSkellyCam /\nSkellySync'),('相机标定','ChArUco 板\n内参、畸变\n位置与朝向'),('二维识别','RTMPose /\nMediaPipe\n各视角关键点'),('三维重建','去畸变\nDLT + SVD\n求 XYZ 坐标'),('质量处理','重投影检查\n异常点与平滑\n缺失及骨长约束'),('动作序列','逐帧组织数据\n保存、回放\n导出与复用')]
for i,(name,desc) in enumerate(steps):
    x=64+i*282
    rect(x,y,262,186,WHITE,LINE,12)
    text(x+17,y+19,str(i+1),23,TEAL,True)
    text(x+49,y+16,name,28,INK,True)
    para(x+18,y+66,desc,226,24)
    if i<5: arrow(x+266,y+89,x+278,y+89,TEAL,2)
y+=212
rect(64,y,1000,353,WHITE,LINE,14)
text(88,y+20,'同一只手腕：两个视角共同约束它的位置',27,TEAL,True)
points=skeleton(572,y+174,.78)
target=points['rw']
line([(241,y+205),target],TEAL,3)
line([(900,y+205),target],PURPLE,3)
circle(*target,11,ORANGE_BG,ORANGE,3)
text(623,y+62,'估计的三维手腕位置',23,ORANGE,True)
line([(618,y+86),(target[0]+12,target[1]+4)],ORANGE,2)
camera(184,y+205,'视角 A',color=TEAL)
camera(960,y+205,'视角 B',flip=True,color=PURPLE)
text(265,y+168,'观测射线',22,TEAL)
text(737,y+165,'观测射线',22,PURPLE)
text(455,y+315,'几何示意',21,MUTED)
rect(1084,y,652,353,TEAL_BG,r=14)
text(1110,y+23,'从二维到三维',30,TEAL,True)
para(1110,y+73,'单个视角给出空间方向；多个视角共同约束深度。真实观测有误差，算法求一致性较好的三维位置。',594,26)
text(1110,y+212,'理想平行双目：Z = fB / d',32,INK,True)
text(1110,y+265,'f 焦距  ·  B 相机间距  ·  d 视差',24,MUTED)
text(1110,y+310,'实际使用一般多相机模型；并非视频拼接。',23,MUTED)
y+=370
text(67,y,'质量处理的具体模块与生效设置依版本、实时 / 离线路径而异。',23,MUTED)

# 03 Results, separated from downstream metrics.
y=section(3,1500,'输出与可见效果',color=PURPLE)
for x,title,body in [(64,'三维骨架与轨迹','换角度观察、逐帧回放，查看身体关键点随时间的运动。'),(630,'结构化动作数据','NPY / CSV / Parquet\n核心：帧 × 关键点 × XYZ\n另含追踪器与标定信息。'),(1196,'检查与动画工作流','二维关键点标注视频；按版本与配置导出 Blender 场景。')]:
    block(x,y,540,215,title,body,PURPLE,WHITE,29,25)
y+=232
rect(64,y,1672,102,PURPLE_BG,r=12)
text(88,y+18,'数据之上可以开发：角度、速度、节奏、对称性与动作比较',28,PURPLE,True)
text(88,y+62,'动作评分、原因解释与训练建议仍需领域规则和验证；骨架回放本身不等于自动评价。',25,MUTED)

# 04 The actual integration boundary.
y=section(4,1932,'怎样驱动你的 3D 人物？','橙色表示需要额外完成的角色适配与运行控制。',ORANGE)
rect(64,y,1672,83,ORANGE_BG,r=12)
text(88,y+24,'角色前提：人物网格 + 骨骼 + 蒙皮；只有静态外观文件时，需要先完成绑定。',28,ORANGE,True)
y+=110
drive=[('三维关键点','FreeMoCap 的\n位置序列'),('求骨架姿态','骨架拟合 / IK\n求姿态与旋转'),('动作重定向','骨骼对应、参考姿态\n坐标、单位、比例'),('烘焙动画片段','根位移、脚滑、穿插\n修正后导出兼容动画'),('播放器驱动人物','Three.js / Unity /\nUnreal 等运行环境')]
for i,(title,body) in enumerate(drive):
    x=64+i*339
    block(x,y,316,172,title,body,TEAL if i==0 else ORANGE,WHITE,28,24)
    if i<4: arrow(x+320,y+87,x+334,y+87,ORANGE,2)
y+=193
block(64,y,824,160,'适配：让动作适合这具身体','位置点不唯一决定全部骨骼扭转；需要骨架约束。三维点文件不是通用旋转动画。',ORANGE,WHITE,28,25)
block(912,y,824,160,'运行：让动作在合适时机发生','循环、混合、过渡、优先级与打断由角色系统控制；表情、口型、视线单独设计。',ORANGE,WHITE,28,25)
y+=177
text(67,y,'动作数据 ≠ 任意模型即插即用。以上是集成路线，不代表本项目已经完成这些角色适配。',25,ORANGE,True)

# 05 Honest scenario/value/dependency mapping.
y=section(5,2568,'使用场景：数据如何变成业务价值')
xs=[64,377,1080,1736]
rect(64,y,1672,51,INK,r=7)
for x,label in zip(xs[:-1],['场景','得到的价值','还需要补齐']): text(x+21,y+13,label,25,WHITE,True)
rows=[('动画与游戏','把真人表演变成动作素材','角色适配与动画清理'),('运动教学','回放动作，比较关节轨迹与节奏','指标定义与专业解释'),('科研实验','获取可分析的三维运动序列','精度验证与实验设计'),('互动装置','用身体动作触发内容或反馈','动作识别与延迟优化'),('动作数据集','积累真人动作样本','标注、质量检查、骨架统一')]
for i,row in enumerate(rows):
    ry=y+51+i*59
    rect(64,ry,1672,59,WHITE if i%2==0 else '#eeefea')
    for col,(x,s) in enumerate(zip(xs[:-1],row)): text(x+21,ry+17,s,25,INK if col==0 else MUTED,col==0)

# 06 The user's context, not abstract benefits.
y=section(6,3010,'对你的价值：为“小云”增加真人动作来源','保留你的动作习惯，积累可复用、具有个人特点的动作素材。',ORANGE)
block(64,y,660,131,'FreeMoCap：表演 → 还原动作','你录制专属挥手、伸懒腰或问候。',TEAL,TEAL_BG,29,25)
block(64,y+148,660,131,'Kimodo：描述 → 生成动作','输入动作描述，制作不同版本的动作。',PURPLE,PURPLE_BG,29,25)
line([(725,y+65),(790,y+65),(790,y+212),(725,y+212)],MUTED,3)
arrow(790,y+139,847,y+139,ORANGE,3)
block(856,y+48,426,188,'适配小云 → 统一动作库','统一骨架、坐标与质量；\n检查修正后加入动作库。',ORANGE,WHITE,28,25)
arrow(1289,y+139,1330,y+139,ORANGE,3)
block(1340,y+48,396,188,'对话 / 事件触发播放','角色运行时选择动作，\n协调声音与表情。',ORANGE,WHITE,28,25)
y+=300
rect(64,y,1672,67,INK,r=10)
text(91,y+21,'外观资产：长什么样',26,WHITE,True)
text(647,y+21,'动作资产：怎么动',26,'#bce6dc',True)
text(1181,y+21,'角色系统：何时做什么',26,'#ffd8b8',True)

# 07 Software anatomy and useful directions.
y=section(7,3512,'工程组成与可扩展方向')
rect(64,y,1672,78,TEAL_BG,r=12)
text(90,y+25,'React / Electron 界面',28,TEAL,True)
text(647,y+27,'REST / WebSocket',26,MUTED)
text(1207,y+25,'Python / FastAPI 后端',28,TEAL,True)
arrow(449,y+39,610,y+39,TEAL,2)
arrow(995,y+39,1160,y+39,TEAL,2)
y+=101
para(67,y,'组件：SkellyCam / SkellySync 采集同步 · SkellyTracker 检测 · 标定与三角测量 · 后处理与导出',1667,26)
y+=56
para(67,y,'可扩展：替换姿态模型、增加质量评估、批量处理、统一动作库、固定角色重定向、开发业务指标。',1667,26)
y+=56
text(67,y,'v2 包含实时与离线流程；实际速度取决于模型、硬件、分辨率与摄像头数量。',25,MUTED)

# 08 Constraints and a realistic sequence to adoption.
y=section(8,3884,'能力边界与落地顺序',color=ORANGE)
block(64,y,824,174,'数据质量','同步、标定、遮挡、光照与识别误差都会影响结果。平滑不等于准确；实际精度需要验证。',ORANGE,WHITE,28,25)
block(912,y,824,174,'适用范围','手部、面部、多人及导出兼容性需按版本核查；三维点不直接等于力、力矩或机器人控制命令。',ORANGE,WHITE,28,25)
y+=194
rect(64,y,1672,93,ORANGE_BG,r=12)
text(89,y+18,'版本提醒：v2.0.0-alpha.25 发布说明列出约 10% 的尺度偏差问题。',27,ORANGE,True)
text(89,y+59,'这是该版本的已知问题，不是通用精度指标。上游代码采用 AGPL-3.0，集成和分发需考虑许可证要求。',23,MUTED)
y+=115
stages=['样例录像跑通','验证真实采集','适配一个角色','扩充动作与产品功能']
for i,s in enumerate(stages):
    x=64+i*425
    rect(x,y,397,67,INK,r=9)
    text(x+21,y+21,f'{i+1}  {s}',26,WHITE,True)
    if i<3: arrow(x+402,y+33,x+419,y+33,ORANGE,3)

# Footer: date, provenance, and evidence boundary.
line([(64,4450),(1736,4450)],LINE,2)
text(64,4480,'研究整理：2026-09-27  ·  基准版本：v2.0.0-alpha.25',24,INK,True)
text(64,4523,'来源：github.com/freemocap/freemocap  ·  docs.freemocap.org  ·  官方发布说明',24,MUTED)
text(64,4566,'本图为原理与能力示意，并非官方海报或实拍结果。当前本地实验网页使用合成数据，尚未实测摄像头采集。',24,MUTED)
text(64,4620,'FreeMoCap 动作实验室  /  002',24,TEAL,True)
text(1295,4620,'真人表演 → 可复用的动作数据',24,TEAL,True)

for s,x,y,tw,sz in checks:
    assert x>=0 and x+tw<=W-30 and y>=0 and y+sz*1.4<H,(s,x,y,tw)
OUT.mkdir(parents=True,exist_ok=True)
im.save(OUT/'freemocap-capability-map.png',optimize=True)
body='\n'.join(svg)
svg_doc=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">
<title id="title">FreeMoCap 能力全景图</title>
<desc id="desc">从输入与多视角三维重建，到角色驱动、使用场景、个人价值、工程组成和能力边界的中文研究图。</desc>
<style>text{{font-family:"Microsoft YaHei","Noto Sans CJK SC",sans-serif;}}</style>
<rect width="100%" height="100%" fill="{BG}"/>
{body}
</svg>'''
(OUT/'freemocap-capability-map.svg').write_text(svg_doc,encoding='utf-8')
print(f'Created PNG {im.width} x {im.height}; SVG {W} x {H}; checked {len(checks)} text lines.')
