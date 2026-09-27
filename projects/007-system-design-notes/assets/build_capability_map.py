"""Render the repo's 28 chapter map as one editable SVG overview."""

from html import escape
from pathlib import Path


OUT = Path(__file__).with_name("goal-capability-map.svg")
W, H = 1800, 1540
FONT = "'Microsoft YaHei','Noto Sans CJK SC','PingFang SC',Arial,sans-serif"
ink = "#edf6fb"
muted = "#b5cbd9"
cyan = "#83e0eb"
amber = "#ffd48a"
line = "#3b5870"
parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="map-title map-desc">',
    '<title id="map-title">系统设计笔记：28 章主题、能力、场景与按需选用</title>',
    '<desc id="map-desc">28 章分为基础方法、核心组件、产品系统、平台与数据、交易系统五类。每类列出章节、关注能力和典型目标。底部说明根据产品特性选择部分主题，小云项目的选用示例以及个人价值。</desc>',
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111f36"/><stop offset="1" stop-color="#0b1528"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#83e0eb"/><stop offset="1" stop-color="#ffd48a"/></linearGradient></defs>',
    f'<rect width="{W}" height="{H}" rx="22" fill="url(#bg)"/>',
]


def rect(x, y, width, height, fill, radius=0, stroke=None, stroke_width=1):
    border = f' stroke="{stroke}" stroke-width="{stroke_width}"' if stroke else ""
    parts.append(f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{radius}" fill="{fill}"{border}/>')


def text(x, y, value, size=20, color=ink, weight=400, anchor="start", spacing=None):
    letter = f' letter-spacing="{spacing}"' if spacing is not None else ""
    parts.append(f'<text x="{x}" y="{y}" fill="{color}" font-family="{FONT}" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}"{letter}>{escape(value)}</text>')


def lines(x, y, values, size=20, color=ink, weight=400, leading=31):
    for i, value in enumerate(values):
        text(x, y + leading * i, value, size, color, weight)


def chapter_chip(x, y, number, title, width=218):
    rect(x, y, width, 43, "#193149", 7, "#3b6580")
    text(x + 12, y + 28, f"{number:02}", 18, amber, 700)
    text(x + 47, y + 28, title, 19, ink, 600)


text(60, 66, "SYSTEM DESIGN NOTES / 28 CHAPTERS", 18, cyan, 700, spacing=2.6)
text(60, 123, "28 章关注什么能力，怎样为产品目标所用？", 46, ink, 750)
text(60, 169, "28 个是设计主题与案例入口，并非 28 项必须完成的产品目标。", 23, muted)
rect(1383, 50, 357, 130, "#182e45", 13, "#4b7289")
text(1410, 105, "28 章  /  5 类视角", 31, amber, 750)
text(1410, 148, "先定目标，再按需选主题", 20, muted)
rect(48, 206, 1704, 3, "url(#accent)")
for x, label in [(69, "设计视角"), (326, "章节入口"), (1051, "关注的能力"), (1391, "典型场景 / 目标")]:
    text(x, 244, label, 18, cyan, 700, spacing=1.4)

groups = [
    {
        "y": 260, "h": 158, "index": "01 / 05", "range": "01—03", "name": "基础方法", "count": "3 章", "hint": "把问题说清楚",
        "chips": [(326, 288, 1, "从零到百万用户"), (558, 288, 2, "粗略容量估算"), (790, 288, 3, "系统设计框架")],
        "ability": ["界定需求与约束", "估算流量、存储和增长瓶颈"],
        "scene": ["任何系统设计的起点", "原型扩展时确定容量量级"],
    },
    {
        "y": 428, "h": 182, "index": "02 / 05", "range": "04—07", "name": "核心组件", "count": "4 章", "hint": "承载与分布",
        "chips": [(326, 456, 4, "限流器"), (674, 456, 5, "一致性哈希"), (326, 512, 6, "分布式键值存储"), (674, 512, 7, "分布式唯一 ID")],
        "ability": ["控制突发请求", "分配数据、复制与唯一标识"],
        "scene": ["高访问接口与多节点存储", "多服务并行写入"],
    },
    {
        "y": 620, "h": 305, "index": "03 / 05", "range": "08—18, 22, 25", "name": "产品系统", "count": "13 章", "hint": "用户可见的体验",
        "chips": [
            (326, 648, 8, "短链接服务"), (558, 648, 9, "网络爬虫"), (790, 648, 10, "通知系统"),
            (326, 701, 11, "信息流"), (558, 701, 12, "实时聊天"), (790, 701, 13, "搜索自动补全"),
            (326, 754, 14, "视频平台"), (558, 754, 15, "网盘与文件同步"), (790, 754, 16, "附近地点服务"),
            (326, 807, 17, "附近好友"), (558, 807, 18, "地图服务"), (790, 807, 22, "酒店预订"),
            (326, 860, 25, "实时游戏排行榜"),
        ],
        "ability": ["消息与内容分发", "检索、媒体、同步与位置", "库存竞争及实时排名"],
        "scene": ["聊天送达、视频播放", "找内容/附近地点/好友", "预订不超卖、排名及时"],
    },
    {
        "y": 935, "h": 194, "index": "04 / 05", "range": "19—21, 23—24", "name": "平台与数据", "count": "5 章", "hint": "后台运行与观测",
        "chips": [
            (326, 961, 19, "分布式消息队列"), (674, 961, 20, "指标监控与告警"),
            (326, 1015, 21, "广告点击聚合"), (674, 1015, 23, "分布式邮件服务"),
            (326, 1069, 24, "对象存储"),
        ],
        "ability": ["异步处理与事件统计", "监控告警、投递和对象持久化"],
        "scene": ["后台任务与日志指标", "邮件发送、文件长期保存"],
    },
    {
        "y": 1139, "h": 160, "index": "05 / 05", "range": "26—28", "name": "交易系统", "count": "3 章", "hint": "正确性优先",
        "chips": [(326, 1167, 26, "支付系统"), (558, 1167, 27, "数字钱包"), (790, 1167, 28, "股票交易所")],
        "ability": ["资金记录可追溯", "失败恢复与低延迟撮合"],
        "scene": ["支付不重扣、余额可核对", "订单按规则快速撮合"],
    },
]

chapter_numbers = [chip[2] for group in groups for chip in group["chips"]]
assert len(chapter_numbers) == 28 and set(chapter_numbers) == set(range(1, 29))

for group in groups:
    y, h = group["y"], group["h"]
    rect(48, y, 1704, h, "#172a40" if group["index"] != "03 / 05" else "#193148", 10, line)
    rect(48, y, 5, h, cyan if group["index"] != "05 / 05" else amber, 2)
    rect(301, y + 17, 1, h - 34, line)
    rect(1031, y + 17, 1, h - 34, line)
    rect(1371, y + 17, 1, h - 34, line)
    text(68, y + 34, f'{group["index"]}  ·  {group["range"]}', 17, amber, 700)
    text(68, y + 74, group["name"], 29, ink, 750)
    text(68, y + 106, f'{group["count"]}  /  {group["hint"]}', 18, muted)
    for x, chip_y, number, title in group["chips"]:
        chapter_chip(x, chip_y, number, title, 218 if x != 674 else 312)
    lines(1051, y + 45, group["ability"], 20, ink, 550, 33)
    lines(1391, y + 45, group["scene"], 20, muted, 500, 33)

rect(48, 1313, 1704, 181, "#102f40", 11, "#438596")
text(69, 1351, "按需选用", 20, cyan, 750)
text(247, 1351, "产品特性 / 目标", 20, ink, 700)
text(451, 1351, "→", 24, amber, 700)
text(505, 1351, "选相关章节", 20, ink, 700)
text(687, 1351, "→", 24, amber, 700)
text(741, 1351, "写指标与约束", 20, ink, 700)
text(944, 1351, "→", 24, amber, 700)
text(998, 1351, "做最小方案", 20, ink, 700)
text(1176, 1351, "→", 24, amber, 700)
text(1230, 1351, "实测并调整", 20, ink, 700)
rect(68, 1370, 1664, 1, "#3c7080")
text(69, 1409, "小云示例", 20, amber, 750)
text(247, 1409, "单人原型看 03 / 12；多人接入再看 02 / 04 / 20；动作处理成瓶颈时看 19。", 21, ink)
text(69, 1461, "对你的意义", 20, cyan, 750)
text(247, 1461, "查漏补缺、说明取舍、安排实现顺序；真实指标、隐私与安全要求仍要另行确定。", 21, ink)
parts.append("</svg>")
OUT.write_text("\n".join(parts) + "\n", encoding="utf-8")
print(OUT)
