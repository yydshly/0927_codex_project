"""Build the explicitly published projects and their shared GitHub Pages index."""
import argparse
import html
import json
from pathlib import Path
import shutil
import subprocess
import sys

from projects import validate, directory_name

ROOT = Path(__file__).resolve().parents[1]


def render_home(projects, repository):
    cards = []
    escape = html.escape
    for project in projects:
        folder = directory_name(project)
        cards.append(f'''<article>
          <div class="project-heading"><span>{project['id']:03d} / WEB EXPERIENCE</span><h2>{escape(project['name'])}</h2></div>
          <a class="preview" href="./{folder}/#space"><img src="./covers/{folder}.png" alt="{escape(project['cover_alt'], quote=True)}" width="1280" height="720"></a>
          <p>{escape(project['summary'])}</p>
          <nav aria-label="{escape(project['name'], quote=True)} 相关入口">
            <a class="primary" href="./{folder}/#space">进入体验 · 栖间 →</a>
            <a href="./{folder}/#understanding">产品理解与使用引导</a>
            <a href="{escape(project['source'], quote=True)}">{escape(project.get('source_name', project['name']))} ↗</a>
            <a href="https://github.com/{repository}/tree/main/projects/{folder}">研究记录 ↗</a>
          </nav><small>引导图来自独立演示产品的实际网页。源网页与独立实现的能力边界详见产品理解。</small>
        </article>''')
    return '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>网页产品研究 · 实际体验索引</title><meta name="description" content="从源网页出发，理解能力、呈现效果、使用场景、扩展方向和个人价值，直接体验独立实现的产品。"><style>
    *{box-sizing:border-box}body{margin:0;background:#111d23;color:#e5e7dc;font:15px/1.8 system-ui,'Microsoft YaHei',sans-serif}main{max-width:1200px;margin:auto;padding:60px 40px}header{margin-bottom:36px}header>span,.project-heading>span{font-size:11px;letter-spacing:2px;color:#c6d1b4}h1{font-size:32px;font-weight:500;margin:12px 0}header p{color:#abbcb3;max-width:740px}article{border:1px solid #ffffff21;border-radius:16px;padding:28px;background:#1a282e;margin-bottom:25px}h2{font-size:26px;font-weight:500;margin:6px 0 20px}.preview{display:block}.preview img{display:block;width:100%;height:auto;border-radius:10px}article p{color:#d0d9cb;margin:22px 0;line-height:2}nav{display:flex;gap:14px;flex-wrap:wrap;align-items:center}a{color:#d5dfbf;text-underline-offset:4px}nav a{padding:9px 13px}.primary{color:#172629;background:#d1d7b5;border-radius:22px;text-decoration:none}small{display:block;color:#98ada3;font-size:12px;margin-top:18px}footer{color:#a6b8ac;font-size:12px;margin-top:35px}
    </style></head><body><main><header><span>RESEARCH INTO EXPERIENCE</span><h1>从看懂一个网页，到亲手体验一个产品。</h1><p>保留源网页关联，用真实运行界面引导体验，说明能力、效果、使用场景、扩展方向，以及这项研究能帮我们验证什么。</p></header>''' + ''.join(cards) + f'''<footer>当前发布 {len(projects)} 个演示 · <a href="https://github.com/{repository}">查看完整研究索引</a> · 面向桌面网页</footer></main></body></html>'''


def build(root=ROOT, output=None):
    config = json.loads((root / 'docs/site-projects.json').read_text(encoding='utf-8'))
    output = output or root / 'dist/pages'
    if output.exists() and any(output.iterdir()):
        raise ValueError(f'Output must be empty to prevent stale published files: {output}')
    projects = []
    for folder in config['projects']:
        directory = root / 'projects' / folder
        if not directory.resolve().is_relative_to((root / 'projects').resolve()):
            raise ValueError('Project directory escapes projects/')
        project = json.loads((directory / 'project.json').read_text(encoding='utf-8'))
        validate(project, directory)
        if directory_name(project) != folder:
            raise ValueError('Project folder mismatch')
        subprocess.run([sys.executable, str(directory / 'web/build.py')], check=True, cwd=root)
        source = root / 'dist' / folder
        if not (source / 'index.html').is_file():
            raise ValueError(f'Missing built index: {source}')
        shutil.copytree(source, output / folder)
        (output / 'covers').mkdir(exist_ok=True)
        shutil.copy2(directory / project['cover'], output / 'covers' / f'{folder}.png')
        projects.append(project)
    output.mkdir(parents=True, exist_ok=True)
    (output / 'index.html').write_text(render_home(projects, config['repository']), encoding='utf-8')
    (output / '.nojekyll').write_text('', encoding='utf-8')
    print(f'Built Pages site: {output} ({len(projects)} project(s))')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, help='Empty destination directory; defaults to dist/pages')
    args = parser.parse_args()
    build(output=args.output)
