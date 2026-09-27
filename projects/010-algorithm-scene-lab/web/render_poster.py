"""Export our simple SVG poster to PNG with Pillow and an installed CJK font.

Authoring utility only; website builds use the committed PNG and need no Pillow.
Example: python render_poster.py --font C:/Windows/Fonts/msyh.ttc
"""
import argparse
import json
from pathlib import Path
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

def render(font_path, bold_path):
    assets=Path(__file__).resolve().parent.parent/'assets'
    svg=ET.parse(assets/'water-algorithm-map.svg').getroot()
    w,h=round(float(svg.attrib['width'])),round(float(svg.attrib['height']))
    picture=Image.new('RGB',(w,h),'white')
    draw=ImageDraw.Draw(picture)
    fonts={}
    for node in svg.iter():
        tag=node.tag.rsplit('}',1)[-1]
        a=node.attrib
        if tag=='rect':
            x,y=float(a.get('x',0)),float(a.get('y',0))
            box=(x,y,x+float(a['width']),y+float(a['height']))
            draw.rounded_rectangle(box,radius=float(a.get('rx',0)),fill=a.get('fill'),outline=a.get('stroke'),width=1)
        elif tag=='line':
            draw.line(tuple(float(a[k]) for k in ['x1','y1','x2','y2']),fill=a['stroke'],width=round(float(a.get('stroke-width',1))))
        elif tag=='text':
            size=int(a['font-size'])
            bold=int(a.get('font-weight',400))>=600
            key=(size,bold)
            if key not in fonts:
                fonts[key]=ImageFont.truetype(str(bold_path if bold else font_path),size)
            draw.text((float(a['x']),float(a['y'])),node.text or '',font=fonts[key],fill=a['fill'],anchor='ls')
    picture.save(assets/'water-algorithm-map.png',optimize=True)
    # A small preview helps inspect all sections without loading a huge bitmap.
    print(json.dumps({'png':str(assets/'water-algorithm-map.png'),'width':w,'height':h}))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--font',type=Path,required=True)
    parser.add_argument('--bold',type=Path)
    args=parser.parse_args()
    render(args.font,args.bold or args.font)
