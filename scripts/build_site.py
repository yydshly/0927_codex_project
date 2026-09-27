"""Build the published projects and their shared GitHub Pages index."""
import argparse
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys

from projects import validate, directory_name, summary_html

ROOT = Path(__file__).resolve().parents[1]


def project_links(folder, entrypoints):
    route = (entrypoints or {}).get(folder, {})
    entry, guide = route.get('entry', ''), route.get('guide', '')
    for fragment in (entry, guide):
        if not isinstance(fragment, str) or (fragment and not re.fullmatch(r'#[a-z][a-z0-9_-]*', fragment)):
            raise ValueError(f'Entrypoint must be an internal hash route: {folder}')
    return f'./{folder}/{entry}', f'./{folder}/{guide}' if guide else None, route.get('label', '打开 Web 演示')


def render_home(projects, repository, entrypoints=None):
    cards = []
    escape = html.escape
    for project in projects:
        folder = directory_name(project)
        entry, guide, label = project_links(folder, entrypoints)
        guide_link = f'<a href="{guide}">理解与使用引导</a>' if guide else ''
        cover_suffix = Path(project.get('cover', 'cover.png')).suffix.lower()
        cover_url = f'./covers/{folder}{cover_suffix}'
        cards.append(f'''<article>
          <div class="project-heading"><span>{project['id']:03d} / RESEARCH & EXPERIENCE</span><h2>{escape(project['name'])}</h2></div>
          <div class="summary">{summary_html(project['summary'])}</div>
          <nav aria-label="{escape(project['name'], quote=True)} 相关入口">
            <a class="primary" href="{entry}">{escape(label)} →</a>
            {guide_link}
            <a href="{escape(project['source'], quote=True)}">参考来源：{escape(project.get('source_name') or project['source'].rstrip('/').split('/')[-1])} ↗</a>
            <a href="https://github.com/{repository}/tree/main/projects/{folder}">研究记录 ↗</a>
          </nav>
          <details class="guide" open><summary>完整引导图 · 点击折叠或展开</summary>
            <a class="preview" href="{cover_url}"><img src="{cover_url}" alt="{escape(project['cover_alt'], quote=True)}" loading="lazy"></a>
          </details>
          <small>{escape(project['cover_alt'])}</small>
        </article>''')
    return '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>项目研究 · 能力与在线体验</title><meta name="description" content="理解开源项目与网页产品的能力、呈现效果、使用场景、可扩展方向和个人价值，查看完整引导图并打开在线演示。"><style>
    *{box-sizing:border-box}body{margin:0;background:#111d23;color:#e5e7dc;font:15px/1.8 system-ui,'Microsoft YaHei',sans-serif}main{max-width:1200px;margin:auto;padding:60px 40px}header{margin-bottom:36px}header>span,.project-heading>span{font-size:11px;letter-spacing:2px;color:#c6d1b4}h1{font-size:32px;font-weight:550;margin:12px 0}header p{color:#abbcb3;max-width:820px}article{border:1px solid #ffffff21;border-radius:16px;padding:28px;background:#1a282e;margin-bottom:30px}h2{font-size:26px;font-weight:550;margin:6px 0 20px}.preview{display:block}.preview img{display:block;width:100%;height:auto;border-radius:10px}.summary{margin:22px 0}.summary p{color:#d0d9cb;margin:10px 0;line-height:1.95}.summary strong{color:#e2f8d5;font-weight:750}nav{display:flex;gap:14px;flex-wrap:wrap;align-items:center}a{color:#d5dfbf;text-underline-offset:4px}nav a{padding:9px 13px}.primary{color:#172629;background:#d1d7b5;border-radius:22px;text-decoration:none}.guide{margin:25px 0 0;border-top:1px solid #ffffff21;padding-top:10px}.guide summary{cursor:pointer;color:#c6d1b4;padding:9px 0 18px}small{display:block;color:#98ada3;font-size:12px;margin-top:18px}footer{color:#a6b8ac;font-size:12px;margin-top:35px}:focus-visible{outline:2px solid #caf2b2;outline-offset:5px}@media(max-width:600px){main{padding:30px 16px}article{padding:20px}h1{font-size:26px}h2{font-size:23px}nav{gap:8px}nav a{padding:7px}}
    </style></head><body><main><header><span>RESEARCH INTO EXPERIENCE</span><h1>看清一个项目能做什么，再亲手验证。</h1><p>用分项摘要和完整引导图整理能力、效果、场景、扩展方向与个人价值。每个研究项目提供独立入口，说明上游能力、当前演示和待开发部分的区别。</p></header>''' + ''.join(cards) + f'''<footer>当前发布 {len(projects)} 个演示 · <a href="https://github.com/{repository}">查看完整研究索引</a></footer></main></body></html>'''


def build_project(root, directory):
    web = directory / 'web'
    if (web / 'build.py').is_file():
        subprocess.run([sys.executable, str(web / 'build.py')], check=True, cwd=root)
        return root / 'dist' / directory.name
    if (web / 'build.mjs').is_file():
        subprocess.run(['node', str(web / 'build.mjs')], check=True, cwd=root)
        return web / 'dist'
    raise ValueError(f'Missing supported static builder: {directory.name}')


def build(root=ROOT, output=None):
    config = json.loads((root / 'docs/site-projects.json').read_text(encoding='utf-8'))
    output = output or root / 'dist/pages'
    if output.exists() and any(output.iterdir()):
        raise ValueError(f'Output must be empty to prevent stale published files: {output}')
    if len(config['projects']) != len(set(config['projects'])):
        raise ValueError('Published project list contains duplicates')
    projects = []
    for folder in config['projects']:
        directory = root / 'projects' / folder
        if not directory.resolve().is_relative_to((root / 'projects').resolve()):
            raise ValueError('Project directory escapes projects/')
        project = json.loads((directory / 'project.json').read_text(encoding='utf-8'))
        validate(project, directory)
        if directory_name(project) != folder:
            raise ValueError('Project folder mismatch')
        project_links(folder, config.get('entrypoints'))
        source = build_project(root, directory)
        if not (source / 'index.html').is_file():
            raise ValueError(f'Missing built index: {source}')
        shutil.copytree(source, output / folder)
        (output / 'covers').mkdir(exist_ok=True)
        cover_suffix = Path(project['cover']).suffix.lower()
        shutil.copy2(directory / project['cover'], output / 'covers' / f'{folder}{cover_suffix}')
        projects.append(project)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'index.html').write_text(render_home(projects, config['repository'], config.get('entrypoints')), encoding='utf-8')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    print(f'Built Pages site: {output} ({len(projects)} project(s))')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Empty destination directory; defaults to dist/pages')
    args = parser.parse_args()
    build(output=args.output)
