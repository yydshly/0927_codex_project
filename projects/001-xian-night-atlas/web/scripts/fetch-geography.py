"""Download a bounded OpenStreetMap context snapshot; never used at runtime."""
import json
from pathlib import Path
import urllib.request
import urllib.parse

QUERY = '''[out:json][timeout:60];(
way[highway~"^(motorway|trunk|primary|secondary)$"](34.14,108.72,34.40,109.12);
way[waterway=river](34.14,108.72,34.40,109.12);
way[leisure=park](34.18,108.85,34.34,109.03);
way[historic=citywalls](34.20,108.88,34.31,109.02);
node[railway=station](34.04,108.60,34.49,109.20);
);out geom;'''
raw_path=Path(__file__).with_name('osm-raw.json')
if raw_path.exists():
    raw=json.loads(raw_path.read_text(encoding='utf-8-sig'))
else:
    request=urllib.request.Request('https://maps.mail.ru/osm/tools/overpass/api/interpreter?' + urllib.parse.urlencode({'data':QUERY}), headers={'User-Agent':'XianNightAtlasPrototype/0.2'})
    with urllib.request.urlopen(request,timeout=110) as response:
        raw=json.load(response)
roads=[]; stations=[]; parks=[]; water=[]; walls=[]
for item in raw['elements']:
    tags=item.get('tags',{})
    if item['type']=='node':
        stations.append({'name':tags.get('name',''),'en':tags.get('name:en',''),'lon':item['lon'],'lat':item['lat'],'id':item['id']})
        continue
    points=[[round(p['lon'],6),round(p['lat'],6)] for p in item.get('geometry',[])]
    if len(points)<2:continue
    feature={'points':points,'name':tags.get('name',''),'kind':tags.get('highway','')}
    if 'highway' in tags:roads.append(feature)
    elif 'waterway' in tags:water.append(feature)
    elif 'historic' in tags:walls.append(feature)
    else:parks.append(feature)
result={'source':'© OpenStreetMap contributors','license':'ODbL 1.0','url':'https://www.openstreetmap.org/copyright','snapshot':'2026-09-27','roads':roads,'water':water,'parks':parks,'walls':walls,'stations':stations}
target=Path(__file__).resolve().parents[1]/'src'/'geography.json'
target.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({k:len(result[k]) for k in ['roads','water','parks','walls','stations']},ensure_ascii=False))
