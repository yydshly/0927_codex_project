"""Build the summary page, accessible text companion and editable SVG poster.

Uses only the standard library. The optional PNG export is a checked-in artifact,
regenerated with render_poster.py when the poster content changes.
"""
import html
import json
import math
import unicodedata
from pathlib import Path

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
H = html.escape
DATA = json.loads((WEB / 'summary-data.json').read_text(encoding='utf-8'))
INK, MUTED, GREEN, BLUE, OCHRE = '#173c3b', '#536b6c', '#257d70', '#3e708c', '#94622b'
PAPER, LINE = '#f6f5ef', '#d9e2dc'


def experiment(lab, scene):
    return f'./?scene={scene}&amp;lab={lab}&amp;seed=42#workspace'


def poster():
    width = 2400
    items = []

    def rect(x, y, w, h, fill, radius=0, stroke=None):
        items.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}"' + (f' stroke="{stroke}"' if stroke else '') + '/>')

    def text(value, x, y, size=24, fill=INK, weight=400):
        # y denotes the top of the line; explicit baseline simplifies export.
        items.append(f'<text x="{x}" y="{y + size}" font-size="{size}" font-weight="{weight}" fill="{fill}">{H(value)}</text>')

    def lines(value, x, y, w, size=24, fill=MUTED, weight=400, leading=None):
        leading = leading or round(size * 1.45)
        rows, row, used = [], '', 0
        for c in value:
            cw = size * (1 if unicodedata.east_asian_width(c) in 'WF' else .58)
            if c == '\n' or used + cw > w:
                rows.append(row)
                row, used = '', 0
            if c != '\n':
                row += c
                used += cw
        if row:
            rows.append(row)
        for i, value in enumerate(rows):
            text(value, x, y + i * leading, size, fill, weight)
        return y + len(rows) * leading

    def line(x1, y1, x2, y2, color=LINE, sw=2):
        items.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{sw}"/>')

    def arrow(x1, y1, x2, y2, color=GREEN):
        line(x1, y1, x2, y2, color, 3)
        angle = math.atan2(y2-y1, x2-x1)
        for d in [-.55, .55]:
            line(x2, y2, x2-13*math.cos(angle+d), y2-13*math.sin(angle+d), color, 3)

    def section(y, num, title, note):
        text(num, 72, y, 25, GREEN, 700)
        text(title, 133, y-8, 37, INK, 700)
        text(note, 2328-len(note)*20, y+5, 20, MUTED)
        line(72, y+58, 2328, y+58)

    rect(0, 0, width, 260, INK)
    text('COASTAL FIELD GUIDE    /    008 · 009 · 010', 72, 37, 23, '#a9d5c4')
    text(DATA['title'], 72, 91, 67, '#ffffff', 700)
    text('算法 × 可见效果 × 使用场景 × 扩展路径', 74, 190, 30, '#dae9df')
    text('理解总图', 2050, 66, 40, '#cce2b7', 700)
    text('研究快照 2026.09.27', 2050, 126, 22, '#cce2b7')
    text('C = coastal   S = ShoreBreak', 2050, 168, 19, '#cce2b7')

    section(297, '01', '先建立因果链：水怎么动，决定它怎样被看见', '原理示意 · 不是仿真输出')
    cards = [
        ('输入与约束', '风浪 / 地形 / 边界 / 光源 / 相机', '定义海况、岸线、材质和观察位置。'),
        ('运动与几何', '波形 / 浅水 / 独立浪唇 / 粒子', '生成高度、斜率、流速与水幕位置。'),
        ('外观与记忆', '泡沫 / 水膜 / 湿度 / 表面材质', '把冲击、流动和退水历史变成细节。'),
        ('光线与成像', '反射 / 折射 / 吸收 / 体积效果', '结合角度与光程，形成最终可见画面。')
    ]
    for i, (title, sub, body) in enumerate(cards):
        x = 72+i*571
        rect(x, 380, 543, 183, '#ffffff', 14)
        text(f'0{i+1}  {title}', x+24, 398, 30, INK, 700)
        lines(sub, x+24, 451, 490, 23, GREEN)
        lines(body, x+24, 499, 490, 22)
        if i < 3:
            arrow(x+546, 472, x+565, 472)
    rect(72, 582, 2256, 62, '#e1ece4', 10)
    text('连接条件：同一坐标与地形 · 同一时刻 · 一致单位 · 高度 / 流速 / 法线共享 · 明确水量与动量交换', 98, 598, 26, INK, 600)
    text('C 路线', 72, 675, 24, GREEN, 700)
    text('解析波 → 固定浅水区域 → 泡沫 / 湿沙 → 水面光学', 212, 675, 25)
    text('S 路线', 1225, 675, 24, BLUE, 700)
    text('FFT 风浪 + 事件破浪 / 浪唇 → 局部浅水 + 水下效果', 1365, 675, 25)

    section(744, '02', '把完整画面拆成 10 个模块', '①—⑦ 对应实验室的七组独立教学实验')
    xs = [72, 462, 1037, 1647]
    ws = [390, 575, 610, 681]
    for x, w, label in zip(xs, ws, ['模块 / 技术算法', '计算与关键输入', '看见什么 / 可以复用到哪里', '原库与教学模型 / 重要边界']):
        rect(x, 821, w, 59, INK)
        text(label, x+20, 836, 24, '#ffffff', 600)
    y = 880
    colors = {'运动':GREEN, '细节':OCHRE, '成像':BLUE, '系统':MUTED}
    for i, a in enumerate(DATA['algorithms']):
        row_height = 222
        rect(72, y, 2256, row_height, '#ffffff' if i % 2 == 0 else '#edf2ed')
        rect(72, y+20, 5, row_height-40, colors[a['group']])
        text(f'{i+1:02d} / {a["group"]}', xs[0]+20, y+17, 20, colors[a['group']], 700)
        end = lines(a['name'], xs[0]+20, y+53, ws[0]-40, 28, INK, 700)
        lines(a['technical'], xs[0]+20, end+14, ws[0]-46, 22)
        end = lines(a['compute'], xs[1]+20, y+21, ws[1]-44, 24)
        end = lines('调整：'+a['parameters'], xs[1]+20, end+12, ws[1]-44, 22, GREEN)
        if end > y+row_height-10:
            raise ValueError(f'Poster input overflow: {a["id"]}')
        end = lines(a['effect'], xs[2]+20, y+21, ws[2]-44, 24, INK)
        end = lines('复用：'+a['reuse'], xs[2]+20, end+12, ws[2]-44, 22)
        if end > y+row_height-10:
            raise ValueError(f'Poster effect overflow: {a["id"]}')
        end = lines(a['upstream'], xs[3]+20, y+17, ws[3]-44, 22)
        end = lines(a['teaching'], xs[3]+20, end+9, ws[3]-44, 22, GREEN, 600)
        end = lines(a['limit'], xs[3]+20, end+9, ws[3]-44, 21, OCHRE)
        if end > y+row_height-10:
            raise ValueError(f'Poster scope overflow: {a["id"]}')
        line(72, y+row_height, 2328, y+row_height)
        y += row_height

    y += 45
    section(y, '03', '从场景倒推组合：八种复用配方', '场景目标与组合建议 · 不代表八套已完成的写实场景')
    y += 82
    for i, s in enumerate(DATA['scenes']):
        x, sy = 72+(i%4)*571, y+(i//4)*212
        rect(x, sy, 543, 192, '#ffffff', 12)
        text(s['name'], x+22, sy+16, 28, INK, 700)
        lines(s['recipe'], x+22, sy+61, 495, 22, GREEN, 600)
        lines('接入：'+s['need'], x+22, sy+100, 495, 21)
        lines('边界：'+s['boundary'], x+22, sy+143, 495, 21, OCHRE)
    y += 461
    section(y, '04', '可扩展方向：先判断需要改哪一层', '以下为迁移与开发建议，不是原库已实现清单')
    y += 82
    for i, e in enumerate(DATA['extensions']):
        x=72+i*571
        rect(x, y, 543, 280, '#e3ece4' if i<3 else '#eee5d6', 12)
        text(e['level'], x+22, y+16, 24, GREEN, 700)
        text(e['title'], x+79, y+12, 31, INK, 700)
        text(e['scope'], x+22, y+66, 22, GREEN)
        end=lines(e['examples'], x+22, y+105, 495, 23, INK)
        lines(e['work'], x+22, end+17, 495, 22)
    y += 323
    section(y, '05', '怎样验证：先控制变量，再核对规律，最后看整体', '数学正确、画面可信、性能可用，是三件需要分别核对的事')
    y += 86
    checks=[('局部数学', 'FFT 往返 / 实值性；水量收支 / 非负水深；半衰期；吸收解析解；弹道；投影权重。'), ('整体一致', '固定时间、种子、相机；看岸线、白沫、水花、湿痕是否对齐；换地形后再验证。'), ('性能与范围', '测加载、帧时间、内存、移动端和长时间运行。24 项教学检查不证明原库工程精度。')]
    for i,(title,body) in enumerate(checks):
        x=72+i*762
        text(title, x, y, 27, INK, 700)
        lines(body, x, y+47, 710, 23)
    y += 192
    rect(0, y, width, 150, INK)
    text('网页路径：008 看浅水与湿沙 → 009 看破浪与水下 → 010 逐层调参验证 → summary.html 回顾全局', 72, y+24, 23, '#e0ece2')
    text('来源快照：iamtechartist/coastal-simulation @ 2e95e1a3e757  ·  cryptomanavan/ShoreBreak @ 11c8c057db67', 72, y+67, 21, '#a9c8bc')
    text('本图为源码研究与独立教学模型的综合整理；不是实拍、性能排名或完整三维流体的能力证明。详细来源与文字版见汇总页。', 72, y+108, 20, '#a9c8bc')
    height=y+150
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">水面算法、效果、场景与扩展总图</title><desc id="desc">五部分：因果链、十个模块、八个场景配方、四级扩展路径与验证。完整文字说明见同目录汇总网页。</desc><rect width="{width}" height="{height}" fill="{PAPER}"/><g font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif">'+''.join(items)+'</g></svg>'


def page():
    d=DATA
    brief=''.join(f'<div><dt>{H(label)}</dt><dd>{H(body)}</dd></div>' for label,body in d['brief'])
    products=''.join(f'<article><h3>{H(p["name"])}</h3><strong>{H(p["audience"])}</strong><p><b>已有基础：</b>{H(p["foundation"])}</p><p><b>需要补齐：</b>{H(p["next"])}</p><small>{H(p["result"])}</small></article>' for p in d['product_directions'])
    pages=[
        ('008','coastal-simulation','看清浅水与湿沙的连接','../008-coastal-simulation/','../008-coastal-simulation/assets/coastal-wet-sand.jpg','原站实拍','浅水怎样绕石、冲滩；泡沫怎样随流；退水后为什么还有湿痕。'),
        ('009','ShoreBreak','看清翻卷与水下的分工','../009-shorebreak/','../009-shorebreak/assets/shorebreak-overview.jpg','原站实拍','FFT 管风浪，独立浪唇管翻卷，浅水管冲滩，水下另有光学与体积效果。'),
        ('010','算法与场景实验室','自己改变一个原因','./#workspace','./assets/lab-overview.jpg','独立教学模型','七组 A/B 实验、八个场景目标、24 个局部检查；用参数、图像与数值一起理解。')
    ]
    pagecards=''.join(f'<a class="page-card" href="{url}"><div class="page-image"><img src="{shot}" alt="{H(title)}：{H(kind)}" width="1280" height="720"><span>{H(kind)}</span></div><div class="page-body"><small>{num} / {H(title)}</small><h3>{H(sub)} <span>↗</span></h3><p>{H(body)}</p></div></a>' for num,title,sub,url,shot,kind,body in pages)
    principles=''.join(f'<article><span>0{i+1}</span><h3>{H(title)}</h3><p>{H(body)}</p></article>' for i,(title,body) in enumerate(d['principles']))
    algos=[]
    for i,a in enumerate(d['algorithms']):
        action=f'<a class="text-link" href="{experiment(a["lab"],a["scene"])}">进入对应实验 →</a>' if a['lab'] else '<a class="text-link" href="#compare">对照两库分工 →</a>'
        algos.append(f'''<article class="algorithm" id="algorithm-{a['id']}"><div class="algorithm-top"><span>{i+1:02d} / {a['group']}</span><h3>{H(a['name'])}</h3><small>{H(a['technical'])}</small></div><p>{H(a['compute'])}</p><dl><dt>关键参数</dt><dd>{H(a['parameters'])}</dd><dt>可见效果</dt><dd>{H(a['effect'])}</dd><dt>可复用到</dt><dd>{H(a['reuse'])}</dd></dl><details><summary>查看原库分工、教学边界与观察方法</summary><p><b>原库：</b>{H(a['upstream'])}</p><p><b>教学：</b>{H(a['teaching'])}</p><p><b>边界：</b>{H(a['limit'])}</p><p><b>观察：</b>{H(a['experiment'])}</p></details>{action}</article>''')
    scenes=''.join(f'<a class="scene-card" href="{experiment(s["lab"],s["id"])}"><h3>{H(s["name"])} <span>↗</span></h3><strong>{H(s["recipe"])}</strong><p>接入：{H(s["need"])}</p><small>边界：{H(s["boundary"])}</small></a>' for s in d['scenes'])
    compare=''.join('<tr><th scope="row">'+H(row[0])+'</th>'+''.join('<td>'+H(v)+'</td>' for v in row[1:])+'</tr>' for row in d['comparison'])
    extensions=''.join(f'<article><span>{e["level"]}</span><h3>{e["title"]}</h3><strong>{e["scope"]}</strong><p>{e["examples"]}</p><small>{e["work"]}</small></article>' for e in d['extensions'])
    sources=''.join(f'<a href="{url}" target="_blank" rel="noopener">{H(label)} ↗</a>' for label,url in d['sources'])
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>水面算法与场景 · 理解汇总</title><meta name="description" content="汇总 coastal-simulation、ShoreBreak 与独立算法实验室：十个模块、八种场景配方、四级复用路径和一张完整总图。"><link rel="icon" href="./favicon.svg"><link rel="stylesheet" href="./summary.css"><script src="./summary.js" defer></script></head><body>
<a class="skip" href="#main">跳到正文</a><header class="site-header"><a class="wordmark" href="./summary.html">∿ <span>海岸研究室<small>THE COMPLETE FIELD GUIDE</small></span></a><nav aria-label="主要入口"><a href="../">全部项目</a><a href="#map">一张总图</a><a href="./#workspace" class="button dark">动手实验 ↗</a></nav></header>
<main id="main"><section class="hero"><div class="eyebrow">008 + 009 + 010 / 理解汇总</div><h1>从算法，<br>到一片水的样子<span>。</span></h1><p>{d['thesis']}</p><div class="hero-actions"><a class="button dark" href="#pages">从三个网页开始 ↓</a><a class="button" href="#map">查看完整总图</a></div><div class="hero-note"><span>10 个模块</span><span>08 种场景配方</span><span>04 级扩展路径</span></div><div class="hero-water" aria-hidden="true"><svg viewBox="0 0 600 410"><defs><linearGradient id="water" x2="0" y2="1"><stop stop-color="#559a93"/><stop offset="1" stop-color="#1c5354"/></linearGradient></defs><path d="M0 252Q85 197 167 246T330 228Q385 135 434 151Q493 160 473 211Q454 232 443 212Q449 196 463 193Q429 150 405 203Q427 252 600 228V410H0Z" fill="url(#water)"/><path d="M0 340L205 330L393 310L600 262V410H0Z" fill="#c9bb92"/><path d="M0 252Q85 197 167 246T330 228Q385 135 434 151Q493 160 473 211" fill="none" stroke="#dcebd7" stroke-width="4"/><path d="M67 75L208 234L304 299M208 234L321 95" fill="none" stroke="#bb8e48" stroke-width="3"/><path d="M370 286Q456 265 544 269" fill="none" stroke="#f9f8e9" stroke-width="3" stroke-dasharray="5 9"/><circle cx="493" cy="233" r="4" fill="#fff"/><circle cx="515" cy="248" r="3" fill="#fff"/></svg><span>形状 → 状态 → 光线 → 画面</span><small>分层关系示意</small></div></section>
<nav class="section-nav" aria-label="本页目录"><a href="#brief">五项摘要</a><a href="#pages">网页汇总</a><a href="#understanding">理解汇总</a><a href="#map">完整总图</a><a href="#algorithms">算法详解</a><a href="#scenes">场景配方</a><a href="#compare">两库区别</a><a href="#products">产品方向</a><a href="#extend">扩展与验证</a></nav>
<section id="brief"><div class="section-title"><div><span class="eyebrow">THE RESEARCH IN FIVE QUESTIONS</span><h2>效果、模块、用途，以及对你的价值。</h2></div></div><dl class="research-brief">{brief}</dl></section>
<section id="pages"><div class="section-title"><div><span class="eyebrow">01 / THREE WAYS TO LEARN</span><h2>三个网页，各解决一个问题。</h2></div><p>先看真实项目，再拆开算法，最后回到这里连接整体。</p></div><div class="page-grid">{pagecards}</div><p class="note">本页汇总这次海岸算法研究的三个相关网页；其他项目保留在<a href="../">全部项目索引</a>。原站截图与实验室教学画面分别标注。</p></section>
<section id="understanding"><div class="section-title"><div><span class="eyebrow">02 / THE MENTAL MODEL</span><h2>核心理解：组合，还要连接。</h2></div></div><div class="principles">{principles}</div><div class="insight"><strong>以“浪打到石头”为例</strong><p>地形改变浅水流动 → 冲击处生成白沫和水花 → 白沫跟随流速 → 水退后保留湿度 → 同一水面法线、相机与光源决定反光。</p><small>深度既参与运动模型，也影响水中光程；相机角度改变看到的反射比例；光源、曝光与素材也影响画面。最终效果并不只由几个滑块决定。</small></div></section>
<section id="map"><div class="section-title"><div><span class="eyebrow">03 / THE COMPLETE MAP</span><h2>一张图，连接能力与下一步。</h2></div><p>图内涵盖算法、参数、效果、场景、边界、扩展与验证。</p></div><div class="map-tools" role="group" aria-label="总图缩放与保存"><div><button type="button" data-zoom="fit" aria-pressed="true">适合宽度</button><button type="button" data-zoom="1" aria-pressed="false">100%</button><button type="button" data-zoom="1.5" aria-pressed="false">150%</button></div><div><a href="./assets/water-algorithm-map.svg" target="_blank" rel="noopener">打开矢量原图 ↗</a><a href="./assets/water-algorithm-map.png" download>保存高清 PNG ↓</a></div></div><div class="map-viewport" tabindex="0" role="region" aria-label="可滚动的算法总图，使用方向键或滚轮查看" aria-describedby="map-help"><img id="overview-map" src="./assets/water-algorithm-map.svg" alt="水面算法总图：输入约束、运动几何、外观记忆和光线成像；十个模块对应八种场景、四级扩展与验证。完整文字详见下方。"></div><p class="note" id="map-help">纵向滚动阅读；放大后可横向滚动。手机可直接打开矢量原图缩放。<a href="#algorithms">继续阅读完整文字版 ↓</a></p></section>
<section id="algorithms"><div class="section-title"><div><span class="eyebrow">04 / ALGORITHM ATLAS</span><h2>十个模块，七组动手实验。</h2></div><p>C 表示 coastal-simulation，S 表示 ShoreBreak。按计算职责拆分，因此光学和粒子会映射到同一组教学实验。</p></div><div class="algorithm-grid">{''.join(algos)}</div></section>
<section id="scenes"><div class="section-title"><div><span class="eyebrow">05 / SCENE RECIPES</span><h2>下一次，从目标倒推算法。</h2></div><p>这些是复用目标与组合建议。点击进入对应的独立教学实验，不代表已完成八套耦合的写实场景。</p></div><div class="scene-grid">{scenes}</div></section>
<section id="compare"><div class="section-title"><div><span class="eyebrow">06 / WHAT DIFFERS</span><h2>共同目标，不同表达重点。</h2></div><p>两个原库都是完整演示项目；学习与移植仍需梳理模块接口、资源和依赖。</p></div><div class="table-scroll" tabindex="0" role="region" aria-label="两库与实验室对照表，可横向滚动"><table><caption>研究快照对比；未在同一硬件下做画质与性能排名</caption><thead><tr><th scope="col">维度</th><th scope="col">008 · coastal-simulation</th><th scope="col">009 · ShoreBreak</th><th scope="col">010 · 我们的实验室</th></tr></thead><tbody>{compare}</tbody></table></div></section>
<section id="products"><div class="section-title"><div><span class="eyebrow">07 / PRODUCT DIRECTIONS</span><h2>从研究资产，到可以开发的产品。</h2></div><p>以下是产品化建议。每个方向说明现有基础与待补能力，不把规划当成已实现功能。</p></div><div class="product-grid">{products}</div></section>
<section id="extend"><div class="section-title"><div><span class="eyebrow">08 / REUSE & VALIDATE</span><h2>要复用，先判断改到哪一层。</h2></div><p>这是开发方向与工作量的判断方法，不是原库已实现功能清单。</p></div><div class="extension-grid">{extensions}</div><div class="verification"><h3>一条可复现的验证路径</h3><ol><li><b>固定条件：</b>同一时间、随机种子、相机、单位和颜色尺度，一次改变一个原因。</li><li><b>核对局部：</b>检查水量收支、非负水深、解析吸收、半衰期、弹道与权重，结合图像观察。</li><li><b>连接后再查：</b>核对水花、白沫、湿痕与地形是否对齐，特别检查边界、落水时刻和切换视角。</li><li><b>测整体成本：</b>另做加载、帧时间、内存、手机和长时间运行验证；工程用途还需实测校准。</li></ol><p>已有教学验证：24 个检查，默认 / 最小 / 最大参数共 72 个局部断言，加上浅水长时间运行，合计八个测试组。它们验证本教学实现，不证明原库物理精度或最终视觉真实性。</p><a class="text-link" href="./?lab=flow&amp;scene=channel#validation">到实验室运行一次检查 →</a></div></section>
<section id="sources" class="sources"><span class="eyebrow">08 / EVIDENCE & SCOPE</span><h2>回到来源，保留边界。</h2><div>{sources}</div><p>研究快照：coastal 2e95e1a3e757 · ShoreBreak 11c8c057db67。原库代码许可为 MIT，摄影素材与第三方资源遵循各自许可。本总图与教学代码为独立整理；未打包上游运行代码。</p><p>本页的“复用、扩展、选择建议”属于基于研究的分析，不是上游承诺。没有测绘级地理复现、统一设备性能排名或工程校准结论。</p></section><footer><span>ALGORITHM → SCENE → EXPERIMENT → UNDERSTANDING</span><a href="#main">回到顶部 ↑</a></footer></main></body></html>'''


def notes():
    d=DATA
    out=['# 网页与理解汇总', '', d['thesis'], '', '## 网页导览', '',
         '- [008 coastal-simulation](../../008-coastal-simulation/README.md)：浅水、泡沫与湿沙。',
         '- [009 ShoreBreak](../../009-shorebreak/README.md)：破浪、浪唇与水下。',
         '- [010 算法实验室](../README.md)：七组独立教学模型，八个场景目标。',
         '- 构建后打开 `010-algorithm-scene-lab/summary.html` 阅读网页汇总。',
         '- [完整总图 SVG](../assets/water-algorithm-map.svg) / [高清 PNG](../assets/water-algorithm-map.png)。', '', '## 核心理解', '']
    out[-2:] = ['## 五项摘要', '']
    out += [f'**{label}：**{body}\n' for label,body in d['brief']]
    out += ['## 可扩展产品方向', '']
    out += [f'### {p["name"]}\n\n{p["audience"]}\n\n- 已有基础：{p["foundation"]}\n- 需要补齐：{p["next"]}\n- 产品价值：{p["result"]}\n' for p in d['product_directions']]
    out += ['## 核心理解', '']
    out += [f'### {title}\n\n{body}\n' for title,body in d['principles']]
    out += ['深度同时影响流动与光程；观察角度是光学输入，光源、环境与素材共同影响画面。七组实验没有耦合为完整海岸。', '', '## 十个模块', '']
    for a in d['algorithms']:
        out += [f'### {a["name"]} · {a["technical"]}', '', a['compute'], '', f'- 参数：{a["parameters"]}', f'- 效果：{a["effect"]}', f'- 复用：{a["reuse"]}', f'- 原库：{a["upstream"]}', f'- 教学：{a["teaching"]}', f'- 边界：{a["limit"]}', f'- 观察：{a["experiment"]}', '']
    out += ['## 八个场景配方', '', '以下是复用目标与组合建议，不是八套已完成的写实场景。', '']
    out += [f'- **{s["name"]}**：{s["recipe"]}。接入：{s["need"]}。边界：{s["boundary"]}。' for s in d['scenes']]
    out += ['', '## 四级扩展', '']
    out += [f'- **{e["title"]} / {e["scope"]}**：{e["examples"]} {e["work"]}' for e in d['extensions']]
    out += ['', '## 原库与实验室对照', '', '| 维度 | coastal-simulation | ShoreBreak | 实验室 |', '| --- | --- | --- | --- |']
    out += ['| '+' | '.join(row)+' |' for row in d['comparison']]
    out += ['', '## 验证', '', '固定时间、种子、相机、单位和显示尺度，一次改变一个输入；分别验证局部数学、模块一致性与整体成本。教学检查并不验证原库工程精度。详见 [验证记录](validation.md)。', '', '## 来源', '']
    out += [f'- [{title}]({url})' for title,url in d['sources']]
    out += ['', '研究快照固定于 2026-09-27 本次记录；复用与扩展是本项目的分析建议。']
    return '\n'.join(out)+'\n'


def build_summary():
    (PROJECT/'assets').mkdir(exist_ok=True)
    (PROJECT/'assets'/'water-algorithm-map.svg').write_text(poster(), encoding='utf-8')
    (WEB/'summary.html').write_text(page(), encoding='utf-8')
    (PROJECT/'notes'/'synthesis.md').write_text(notes(), encoding='utf-8')


if __name__ == '__main__':
    build_summary()
    print('Built summary: 3 pages, 10 modules, 8 scene recipes, 4 extension levels')
