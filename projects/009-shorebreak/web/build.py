"""Build this self-contained research page with Python's standard library."""
import html
import json
import shutil
from pathlib import Path

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
ROOT = PROJECT.parents[1]
DATA = json.loads((WEB / 'content.json').read_text(encoding='utf-8'))
OUT = ROOT / 'dist' / PROJECT.name
H = html.escape


def source(file):
    return f"{DATA['repo']}/blob/{DATA['sha']}/{file}"


def link(text, url, cls=''):
    return f'<a class="{cls}" href="{H(url, quote=True)}" target="_blank" rel="noopener noreferrer">{H(text)} <span aria-hidden="true">↗</span></a>'


def svg_text(text, x, y, size=20, width=29, fill='#355461', weight=400):
    lines = [text[i:i+width] for i in range(0, len(text), width)]
    return ''.join(f'<text x="{x}" y="{y+i*(size*1.65)}" fill="{fill}" font-size="{size}" font-weight="{weight}">{H(line)}</text>' for i, line in enumerate(lines))


def guide():
    d = DATA
    parts = ['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1180" viewBox="0 0 1440 1180" role="img" aria-labelledby="title desc">', f'<title id="title">{H(d["name"])} 能力与原理总图</title><desc id="desc">实现流程、视觉能力、使用场景与模型边界。教学整理，非仿真输出。</desc>', '<rect width="1440" height="1180" fill="#f0f6f8"/><g font-family="Microsoft YaHei,system-ui,sans-serif"><rect width="1440" height="176" fill="#102f40"/>']
    parts += [svg_text(f'{d["id"]}  /  COASTAL RESEARCH', 48, 44, 18, 90, '#83dbde'), svg_text(d['name']+' · '+d['subtitle'], 48, 102, 34, 80, '#ffffff', 650), svg_text('能力 → 实现原理 → 可见效果 → 使用边界    /    '+d['date'], 48, 148, 18, 80, '#d2e5ed')]
    for i, (value, label) in enumerate(d['metrics']):
        x = 48+i*450
        parts += [svg_text(value, x, 232, 28, 40, '#102f40', 650), svg_text(label, x, 268, 18, 40)]
    parts += [svg_text('实现流程  /  点击研究页中的步骤可逐项阅读源码与效果', 48, 324, 20, 75, '#102f40', 600)]
    for i, s in enumerate(d['stages']):
        x = 48+i*340
        parts += [f'<rect x="{x}" y="350" width="324" height="318" rx="12" fill="white" stroke="#c6dce5"/>', svg_text(f'0{i+1}  {s["tag"]}', x+22, 387, 17, 30, '#08787d', 600), svg_text(s['title'], x+22, 432, 24, 20, '#102f40', 650), svg_text(s['short'], x+22, 470, 19, 20), svg_text(s['effect'], x+22, 511, 17, 16)]
        if i < 3:
            parts.append(f'<path d="M{x+327} 425h10m-5-5 5 5-5 5" fill="none" stroke="#08787d" stroke-width="2"/>')
    parts += [svg_text('能做什么', 48, 724, 26, 50, '#102f40', 650), svg_text('怎样使用 / 不能据此推断什么', 748, 724, 26, 50, '#102f40', 650)]
    for i, f in enumerate(d['features'][:4]):
        parts += [svg_text(f[0], 48, 773+i*64, 20, 35, '#102f40', 600), svg_text(f[1], 48, 802+i*64, 16, 38)]
    parts += [svg_text(d['uses'][0][1], 748, 774, 19, 31), svg_text(d['limits'][0], 748, 856, 19, 31), svg_text('截图验证与源码确认分开记录；未做统一硬件性能或工程精度测试。', 748, 956, 18, 33, '#855221')]
    parts += ['<path d="M48 1080H1392" stroke="#b5d0dc"/>', svg_text('来源：'+d['repo'], 48, 1119, 17, 100), svg_text('研究提交：'+d['sha'][:12]+'  ·  原站截图归属上游作者  ·  本图为教学整理', 48, 1152, 16, 100), '</g></svg>']
    return ''.join(parts)


def diagram(kind):
    base = '<svg class="section-diagram" viewBox="0 0 720 250" role="img" aria-label="教学示意：波浪、地形与状态的关系，不是仿真输出"><path d="M30 219H690" stroke="#aac7d4"/><text x="30" y="242">海侧</text><text x="636" y="242">岸侧</text><path d="M30 216 330 211 505 179 690 135" fill="none" stroke="#c0a974" stroke-width="5"/>'
    if kind == 'curl':
        shape = '<path d="M30 155C150 177 199 178 300 121S416 31 480 54C550 74 571 132 526 137C501 141 504 117 526 109C498 57 463 80 448 119C473 155 549 176 690 138"/><text x="300" y="33">独立浪唇网格</text><path class="pointer" d="M393 38 461 61"/><text x="418" y="170">浪腔</text>'
    elif kind == 'grid':
        shape = '<path d="M30 120Q145 80 245 120T440 118Q535 120 592 156"/>' + ''.join(f'<path class="gridline" d="M{x} 123V{215-int(max(0,x-330)*.17)}"/>' for x in range(40,590,24)) + '<text x="62" y="60">水面高度差 → 水平流量 → 新水深</text><path class="pointer" d="M220 161h60m-10-6 10 6-10 6"/><text x="356" y="192">湿 / 干边界</text>'
    elif kind == 'foam':
        shape = '<path d="M30 120Q145 80 245 120T440 118Q535 120 592 156"/>' + ''.join(f'<circle cx="{100+i*37}" cy="{112+(i%3)*10}" r="{4+i%4}"/>' for i in range(13)) + '<text x="62" y="60">泡沫随速度场移动，湿度随时间衰减</text><path class="pointer" d="M470 90h85m-10-6 10 6-10 6"/>'
    elif kind == 'underwater':
        shape = '<path d="M30 120Q145 80 245 120T440 118Q535 120 592 156"/>' + ''.join(f'<circle cx="{285+i*15}" cy="{150+(i%4)*12}" r="{5+i%5}"/>' for i in range(12)) + '<text x="58" y="48">网格海面</text><text x="441" y="56">局部气泡云</text><path class="pointer" d="M485 70 400 153"/><path class="ray" d="M180 30 235 111 310 188"/>'
    else:
        shape = '<path d="M30 120Q110 65 190 120T350 120T510 120Q554 126 592 156"/><text x="60" y="51">'+('四组解析波 / 多尺度频谱' if kind=='wave' else '反射 ＋ 折射 ＋ 深度吸收')+'</text><path class="ray" d="M350 25 425 112 490 155M425 112 493 30"/>'
    return base+'<g class="water-shape">'+shape+'</g></svg>'


def render():
    d = DATA
    nav = [('overview','总览与实拍'),('capabilities','能力展示'),('principle','实现原理'),('effects','效果与边界'),('compare','两库对照'),('use','运行与复用'),('sources','版本与来源')]
    headings = {key:label for key,label in nav}
    n = ''.join(f'<a href="#{key}"><span>0{i+1}</span>{label}</a>' for i,(key,label) in enumerate(nav))
    header = lambda key,kicker: f'<header class="section-head"><div><span class="eyebrow">{kicker}</span><h2>{headings[key]}</h2></div></header>'
    digest = ''.join(f'<div><strong>{H(label)}：</strong><p>{H(body)}</p></div>' for label,body in d['digest'])
    gallery = d['gallery'][0]
    metrics = ''.join(f'<div><strong>{H(v)}</strong><span>{H(t)}</span></div>' for v,t in d['metrics'])
    gallery_buttons = ''.join(f'<button type="button" class="gallery-select" aria-pressed="{str(i==0).lower()}" data-image="{i}">{H(g["label"])}</button>' for i,g in enumerate(d['gallery']))
    features = ''.join(f'<article class="feature"><span class="feature-no">0{i+1}</span><h3>{H(f[0])}</h3><p>{H(f[1])}</p><div class="feature-foot"><small>{H(f[2])}</small><span class="evidence">{H(f[3])}</span></div></article>' for i,f in enumerate(d['features']))
    steps = ''.join(f'<button class="stage-select" type="button" aria-pressed="{str(i==0).lower()}" aria-controls="stage-{i}" data-stage="{i}"><span>0{i+1}</span><strong>{H(s["title"])}</strong><small>{H(s["tag"])}</small></button>' for i,s in enumerate(d['stages']))
    panels = ''.join(f'<article class="stage-panel" id="stage-{i}" {"hidden" if i else ""}><div class="diagram-wrap">{diagram(s["kind"])}<small>教学示意 / 非模拟输出</small></div><div class="stage-description"><span class="eyebrow">0{i+1} / {H(s["tag"])}</span><h3>{H(s["short"])}</h3><p>{H(s["body"])}</p><p class="effect-callout"><strong>画面会怎样？</strong>{H(s["effect"])}</p>{link("阅读实现 · "+s["code"],source(s["file"]))}</div></article>' for i,s in enumerate(d['stages']))
    effects = ''.join(f'<tr><th scope="row">{H(a)}</th><td><span class="evidence">{H(b)}</span></td><td>{H(c)}</td></tr>' for a,b,c in d['effects'])
    limits = ''.join(f'<li>{H(t)}</li>' for t in d['limits'])
    comparisons = [('渲染技术','Three.js r185 / TSL / WebGPU 或 WebGL 2','Three.js r186 / GLSL / WebGL 2'),('主要取舍','固定范围的浅水、岩石与湿沙','FFT、翻卷水幕、局部冲滩与水下'),('外海与破浪','四组解析波＋高度场浪涌','三层 FFT＋预定破浪事件＋浪唇网格'),('浅水计算','CPU Worker，Wasm 内核，JS 回退','GPU 有限体积求解'),('网格与覆盖','约 30 cm；固定约 72 × 120 m','约 3 cm；沿岸约 22 m 的移动窗口'),('视觉边界','主体每处只有一个水面高度','附加网格描述翻卷；仍非三维流体体积'),('交互重点','环境参数、预设视角、海岸行走','行走、游泳、水下视角、慢放'),('接入难度','围绕集中状态场，便于追踪与抽取','子系统更多，拆分时需维护共同时间与地形'),('工程精度','未进行工程验证','未进行工程验证')]
    compare = ''.join(f'<tr><th scope="row">{H(a)}</th><td class="{"current" if d["id"]=="008" else ""}">{H(b)}</td><td class="{"current" if d["id"]=="009" else ""}">{H(c)}</td></tr>' for a,b,c in comparisons)
    uses = ''.join(f'<article><h3>{H(a)}</h3><p>{H(b)}</p></article>' for a,b in d['uses'])
    requirements = ''.join(f'<li>{H(v)}</li>' for v in d['requirements'])
    controls = ''.join(f'<tr><th scope="row">{H(a)}</th><td>{H(b)}</td></tr>' for a,b in d['controls'])
    sources = ''.join(f'<li>{link(a,source(b))}<span>{H(c)}</span><code>{H(b)}</code></li>' for a,b,c in d['sources'])
    serialized = json.dumps({'gallery':d['gallery'],'demo':d['demo'],'name':d['name']},ensure_ascii=False).replace('<','\\u003c')
    return f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="{H(d['description'])}"><meta name="color-scheme" content="light"><title>{H(d['name'])} · 能力、原理与效果研究</title><link rel="icon" href="./favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./styles.css"><script src="./app.js" defer></script></head>
<body data-accent="{d['accent']}"><a class="skip" href="#overview">跳到正文</a>
<aside class="sidebar"><a class="brand" href="../"><svg viewBox="0 0 36 36" aria-hidden="true"><path d="M3 12q7-9 15 0t15 0M3 22q7-9 15 0t15 0"/></svg><span>海岸研究室<small>COASTAL FIELD NOTES</small></span></a><div class="side-project"><span>RESEARCH / {d['id']}</span><strong>{H(d['name'])}</strong><p>{H(d['subtitle'])}</p></div><nav aria-label="本页章节">{n}</nav><div class="peer-link"><span>另一条技术路线</span><a href="../{d['peer']}/">{H(d['peerName'])} <span aria-hidden="true">↗</span></a></div><div class="peer-link"><span>动手拆解算法</span><a href="../010-algorithm-scene-lab/">算法与场景实验室 ↗</a></div><div class="peer-link"><span>连接整体理解</span><a href="../010-algorithm-scene-lab/summary.html">网页汇总与算法总图 ↗</a></div><div class="side-bottom">源码研究 · 实际截图<br>{d['date']} / MIT</div></aside>
<main><div class="topbar"><a href="../">项目研究索引</a><span>海岸模拟 / {d['id']}</span>{link('上游仓库',d['repo'])}</div>
<section id="overview" class="overview"><div class="intro"><div><span class="eyebrow">{d['id']} / {H(d['name'])}</span><h1>{H(d['title'])}</h1><p>{H(d['intro'])}</p></div><a class="button primary" href="#experience">打开交互演示 <span aria-hidden="true">↗</span></a></div>
<figure class="hero-shot"><a id="gallery-link" href="./assets/{gallery['file']}" target="_blank" rel="noopener"><img id="gallery-image" aria-describedby="gallery-caption" src="./assets/{gallery['file']}" alt="{H(gallery['alt'])}" width="1280" height="720" fetchpriority="high"></a><div class="shot-topline"><span>上游真实画面</span><span>图形演示 / 非工程预测</span></div><div class="gallery-controls" role="group" aria-label="实拍视角">{gallery_buttons}</div></figure><p class="gallery-caption" id="gallery-caption" aria-live="polite">{H(gallery['caption'])}</p><div class="metrics">{metrics}</div><p class="overview-note">{H(d['description'])}</p><div class="research-digest">{digest}</div></section>
<section id="capabilities">{header('capabilities','02 / CAPABILITIES')}<div class="feature-grid">{features}</div>
<div class="experience"><div><span class="eyebrow">LAB / 算法实验室</span><h3>调整参数，验证算法怎样改变画面</h3><p>用七组独立教学模型做 A/B 对照：波浪、浅水、输运、湿度、光学、翻卷和材质。模型边界与数值检查同步说明。</p></div><div class="actions"><a class="button primary" href="../010-algorithm-scene-lab/">进入统一实验室 →</a><a class="button secondary" href="../010-algorithm-scene-lab/summary.html">网页与理解汇总 ↗</a></div></div>
<div id="experience" class="experience"><div><span class="eyebrow">LIVE / 原站实时演示</span><h3>亲自观察一次浪来与浪退</h3><p>在此加载上游网页，或在新窗口打开。停止后会释放嵌入页面。网络、浏览器限制或加载预热可能影响显示。</p></div><div class="actions"><button type="button" class="button primary" id="demo-toggle">加载原站演示</button>{link('独立窗口打开',d['demo'],'button secondary')}</div><div id="demo-container" hidden></div><p class="demo-status" id="demo-status" aria-live="polite">尚未加载。静态截图和说明可直接阅读。</p></div></section>
<section id="principle">{header('principle','03 / HOW IT WORKS')}<p class="section-intro">选择一个步骤，查看它计算什么，以及它怎样改变画面。</p><div class="stage-controls" role="group" aria-label="原理步骤">{steps}</div><div class="stage-content">{panels}</div><p class="fineprint">{H(d['principleNote'])}</p><details class="guide"><summary>展开完整能力与原理总图 <span>可单独打开、放大或保存</span></summary><a href="./assets/understanding-map.svg" target="_blank" rel="noopener"><img src="./assets/understanding-map.svg" alt="{H(d['name'])} 能力、实现流程与边界总图" loading="lazy" width="1440" height="1180"></a></details></section>
<section id="effects">{header('effects','04 / OBSERVATION & LIMITS')}<div class="table-wrap"><table><caption>验证范围：把可见画面与代码能力分开</caption><thead><tr><th>观察项</th><th>证据状态</th><th>本次记录</th></tr></thead><tbody>{effects}</tbody></table></div><div class="boundary"><span class="eyebrow">模型边界</span><h3>画面成立，不代表所有物理都被求解</h3><ul>{limits}</ul></div></section>
<section id="compare">{header('compare','05 / TWO APPROACHES')}<p class="section-intro">两者都连接海浪、浅水、泡沫与材质。主要差异是几何表达和计算资源怎样分配。</p><div class="table-wrap"><table><caption>同类目标，不同实现重点</caption><thead><tr><th>维度</th><th>coastal-simulation</th><th>ShoreBreak</th></tr></thead><tbody>{compare}</tbody></table></div><div class="decision"><label for="goal">按用途看选择</label><select id="goal"><option value="learn">学习浅水与材质连接</option><option value="curl">近距离翻卷浪头</option><option value="swim">游泳与水下体验</option><option value="engineering">工程预测与防灾</option></select><p id="recommendation" aria-live="polite">优先阅读 coastal-simulation：状态场较集中，输入、流动、泡沫、材质之间的关系更容易追踪。</p><a href="../{d['peer']}/">继续阅读 {H(d['peerName'])} →</a></div><p class="fineprint">选择建议是本项目的分析。尚未完成相同设备、视角与分辨率下的画质和性能对照。</p></section>
<section id="use">{header('use','06 / RUN & REUSE')}<div class="use-grid">{uses}</div><div class="value"><h3>对已有项目的意义</h3><p>{H(d['value'])}</p><h3>可以继续扩展什么</h3><p>{H(d['extensions'])}</p></div><div class="run-grid"><div><h3>运行条件</h3><ul>{requirements}</ul></div><div><h3>上游操作速查</h3><div class="table-wrap"><table><caption class="sr-only">上游控制说明</caption><tbody>{controls}</tbody></table></div></div></div><div class="code-head"><h3>运行所研究的上游版本</h3><button type="button" class="button secondary" id="copy-commands">复制命令</button></div><pre><code id="commands">{H(d['commands'])}</code></pre><p class="fineprint" id="copy-status" aria-live="polite">上述为上游运行方法；本次没有安装或构建上游项目。</p></section>
<section id="sources">{header('sources','07 / PROVENANCE')}<div class="provenance"><div><span>源码快照</span>{link(d['sha'][:12],d['repo']+'/tree/'+d['sha'])}<small>来源链接固定到该提交</small></div><div><span>研究日期</span><strong>{d['date']}</strong><small>原站演示可能继续更新</small></div><div><span>上游作者</span><strong>{H(d['author'])}</strong><small>截图与上游内容保留署名</small></div></div><p>{H(d['license'])}</p><ol class="sources">{sources}</ol><p class="fineprint">源码快照与在线演示不是同一份发布证明：本次未确认原站部署与该提交逐字一致。研究页本身不打包上游执行代码。</p></section>
<footer><span>{d['id']} / {H(d['name'])} · 独立研究与展示</span><a href="#overview">返回顶部 ↑</a></footer></main><script type="application/json" id="page-data">{serialized}</script><noscript><p class="noscript">当前 JavaScript 已关闭。正文、来源与默认截图仍可阅读；交互演示请使用“独立窗口打开”。</p></noscript></body></html>'''


def build():
    assets = PROJECT / 'assets'
    for shot in DATA['gallery']:
        if not (assets / shot['file']).is_file():
            raise FileNotFoundError(f"Missing real screenshot: {shot['file']}")
    assets.mkdir(exist_ok=True)
    (assets / 'understanding-map.svg').write_text(guide(),encoding='utf-8')
    (WEB / 'index.html').write_text(render(),encoding='utf-8')
    OUT.mkdir(parents=True,exist_ok=True)
    for name in ['index.html','styles.css','app.js','favicon.svg']:
        shutil.copy2(WEB/name,OUT/name)
    (OUT/'assets').mkdir(exist_ok=True)
    for name in ['understanding-map.svg']+[g['file'] for g in DATA['gallery']]:
        shutil.copy2(assets/name,OUT/'assets'/name)
    print(f'Built {PROJECT.name}: static page, {len(DATA["gallery"])} actual screenshots, guide, source links')


if __name__ == '__main__':
    build()
