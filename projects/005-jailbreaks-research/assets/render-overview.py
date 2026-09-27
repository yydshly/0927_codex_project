"""Render the original research infographic to PNG and editable SVG."""
from pathlib import Path
from xml.sax.saxutils import escape
from PIL import Image, ImageDraw, ImageFont
import json

ROOT = Path(__file__).resolve().parent
W, H = 1800, 2780
BG, INK, MUTED = '#F3F5FA', '#17223B', '#596780'
BLUE, LIGHT, TEAL, AMBER = '#404ED6', '#EDF0FF', '#16766B', '#956020'
img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)
svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">', '<title id="title">Jailbreaks 越狱提示词库总览</title>', '<desc id="desc">模型清单、越狱目标、原理、可能效果与个人价值；效果未实测。</desc>']
fonts = {}
def font(size, bold=False):
    key=(size,bold)
    if key not in fonts:
        fonts[key]=ImageFont.truetype('C:/Windows/Fonts/msyhbd.ttc' if bold else 'C:/Windows/Fonts/msyh.ttc', size)
    return fonts[key]
def rect(x,y,w,h,fill,r=0,stroke=None):
    d.rounded_rectangle((x,y,x+w,y+h),radius=r,fill=fill,outline=stroke,width=1)
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"'+(f' stroke="{stroke}"' if stroke else '')+'/>')
def line(x1,y1,x2,y2,color='#DDE3EF',width=2):
    d.line((x1,y1,x2,y2),fill=color,width=width)
    svg.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"/>')
def text(x,y,value,size=28,color=INK,bold=False):
    f=font(size,bold)
    d.text((x,y),value,font=f,fill=color,anchor='lt')
    weight='700' if bold else '400'
    svg.append(f'<text x="{x}" y="{y}" dominant-baseline="text-before-edge" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{weight}" fill="{color}">{escape(value)}</text>')
def wrap(x,y,value,maxw,size=26,color=MUTED,bold=False,lh=None):
    lh=lh or round(size*1.55)
    lines=[]
    for para in value.split('\n'):
        buf=''
        for c in para:
            if buf and d.textlength(buf+c,font=font(size,bold))>maxw:
                lines.append(buf);buf=c
            else:buf+=c
        lines.append(buf)
    for i,s in enumerate(lines):text(x,y+i*lh,s,size,color,bold)
    return y+len(lines)*lh
def section(y,h,num,title,tag=None):
    rect(64,y,1672,h,'#FFFFFF',26)
    rect(98,y+28,56,47,LIGHT,12)
    text(108,y+35,num,26,BLUE,True)
    text(174,y+31,title,36,INK,True)
    if tag:
        tw=d.textlength(tag,font=font(22))
        text(1692-tw,y+40,tag,22,MUTED)
def arrow(x,y):
    line(x,y,x+25,y,BLUE,3)
    line(x+16,y-9,x+25,y,BLUE,3)
    line(x+16,y+9,x+25,y,BLUE,3)

rect(0,0,W,H,BG)
rect(0,0,W,350,INK)
text(80,38,'开源项目研究 / 005',24,'#98B8FF',True)
text(80,92,'Jailbreaks 越狱提示词库',67,'#FFFFFF',True)
text(82,185,'模型覆盖 · 越狱目标 · 本质原理 · 可能效果 · 对你的价值',28,'#CDD7EE')
text(82,232,'核心目标：让模型输出原本受规则限制的内容',32,'#FFFFFF',True)
for x,w,label in [(82,270,'25 个源文件'),(370,420,'23 份提示词或配置'),(808,295,'0 次模型实测')]:
    rect(x,288,w,42,'#2B3855',10)
    text(x+20,295,label,24,'#FFFFFF')
text(1180,299,'意图明确 · 效果待验证',25,'#ADC8FF',True)

section(384,746,'01','包含哪些模型？','按文件标称名称归为 10 组')
text(99,477,'文件名称和版本标签来自作者，不代表已验证兼容或越狱成功。',27,MUTED)
models=[
('DeepSeek',3,'updated / v4 / 4-1'),('GLM / ZCode',6,'glm / ZCode / 5-3 / AGENTS / opencode'),
('Claude Opus / Sonnet',4,'Opus v1、v2 / Sonnet v1、v2'),('Kimi',2,'kimi / k3-agents'),
('Grok',2,'build / config'),('Muse',2,'spark 1.3 / ai-AGENTS'),
('Qwen',1,'另有 1 个空白 preferences 文件'),('GPT-oss',1,'GPT oss'),
('Gemma',1,'gemma4'),('MiMo',1,'mimo-2.6-agents')]
assert sum(m[1] for m in models)==23
manifest=json.loads((ROOT.parent/'data/source-index.json').read_text(encoding='utf-8'))
assert manifest['substantive_prompt_or_config_files']==23
for i,(name,count,desc) in enumerate(models):
    x=100+(i%2)*830;y=538+(i//2)*94
    text(x,y,name,33,INK,True)
    rect(x+683,y-2,90,41,LIGHT,10)
    text(x+702,y+5,f'{count} 份',24,BLUE,True)
    text(x,y+46,desc,25,MUTED)
    if i<8:line(x,y+83,x+773,y+83)
rect(99,1034,1602,66,'#FFF6E6',12)
text(119,1049,'注意：deepseek v4 正文自述为 V3；GPT-oss 条目不等于已适配 ChatGPT。',24,AMBER)
text(100,1103,'23 份材料之外，另有 1 份 README 和 1 个空白文件。',21,MUTED)

section(1160,230,'02','它想实现什么能力？','作者目标 · 尚未验证')
goals=[('绕过拒绝','尝试获得原本受限的回答'),('扩大输出范围','涉及代码、创作等内容限制'),('持续影响会话','尝试让后续回答沿用作者规则')]
for i,(a,b) in enumerate(goals):
    x=100+i*544
    rect(x,1250,514,104,LIGHT,16)
    text(x+22,1265,a,31,BLUE,True)
    text(x+22,1311,b,24,MUTED)

section(1420,440,'03','本质原理：影响规则遵循')
steps=[('文本包装','角色／创作背景／工作区约定'),('主张新规则','重定义允许范围与拒绝条件'),('诱导优先服从','尝试覆盖原有约束'),('可能改变输出','是否成功取决于实际响应')]
for i,(a,b) in enumerate(steps):
    x=100+i*406
    rect(x,1520,370,136,LIGHT,16)
    text(x+20,1539,a,30,BLUE,True)
    wrap(x+20,1585,b,328,23,MUTED,lh=32)
    if i<3:arrow(x+377,1579)
rect(100,1684,1598,131,'#F1F7F8',16)
text(122,1702,'改变回答行为 ≠ 获得真实权限',34,TEAL,True)
text(122,1757,'不会凭空增加工具、账号权限或模型知识；通常没有修改后台系统指令。',27,INK)
text(101,1829,'合法修改自有模型配置属于配置变更，需与低权限输入越狱区分。',22,MUTED)

section(1890,370,'04','可能得到什么效果？','结果类型 · 非本库实测成绩')
effects=[('实质越界','违反原有边界的实质输出，才算该次成功。',BLUE),('表面顺从','口头答应、语气改变，不等于越狱成功。',MUTED),('继续拒绝','模型保持原有限制，该次尝试未突破。',MUTED),('不稳定或未知','版本、上下文和入口变化可能影响结果。',AMBER)]
for i,(a,b,c) in enumerate(effects):
    x=100+(i%2)*822;y=1984+(i//2)*96
    rect(x,y,776,83,'#F6F8FC',13)
    rect(x,y+14,5,53,c,2)
    text(x+21,y+12,a,27,c,True)
    text(x+21,y+50,b,24,MUTED)
text(101,2202,'成功率未知；回答更多，也不代表更正确。',27,AMBER,True)

section(2290,302,'05','对你的价值是什么？')
values=[('理解拒绝','区分知识不足、规则限制\n与误拒绝。'),('判断投入','与你研究受限回答的关注点相关，\n但能否奏效仍未知。'),('研究与评估','比较越狱机制，\n测试自有系统的防护。')]
for i,(a,b) in enumerate(values):
    x=100+i*543
    text(x,2380,f'{i+1:02}  {a}',30,TEAL,True)
    wrap(x,2433,b,510,25,MUTED,lh=39)
text(100,2544,'本库没有直接提供无人机识别、控制等工程实现。',25,MUTED)

text(80,2630,'普通提示词优化看任务质量；越狱看是否突破原有边界。',31,INK,True)
text(80,2695,'来源：github.com/togg53192-cmd/jailbreaks',24,MUTED)
text(80,2738,'固定提交 e5130bbcc1e1 · 原创整理 2026-09-27 · 本研究未实测越狱效果',22,MUTED)
svg.append('</svg>')
(ROOT/'jailbreaks-overview.svg').write_text('\n'.join(svg),encoding='utf-8')
img.save(ROOT/'jailbreaks-overview.png',optimize=True)
print(f'Created PNG {W} x {H} and editable SVG; 10 groups / 23 substantive files.')
