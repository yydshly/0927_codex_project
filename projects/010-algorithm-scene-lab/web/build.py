"""Build the offline algorithm laboratory without package installation."""
from pathlib import Path
import shutil
from build_summary import build_summary

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
ROOT = PROJECT.parents[1]
OUT = ROOT / 'dist' / PROJECT.name

def build():
    build_summary()
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ['index.html', 'styles.css', 'app.mjs', 'models.mjs', 'catalog.mjs', 'checks.mjs', 'render.mjs', 'favicon.svg', 'summary.html', 'summary.css', 'summary.js']:
        shutil.copy2(WEB / name, OUT / name)
    (OUT / 'assets').mkdir(exist_ok=True)
    for name in ['water-algorithm-map.svg', 'water-algorithm-map.png', 'lab-overview.jpg']:
        shutil.copy2(PROJECT / 'assets' / name, OUT / 'assets' / name)
    print(f'Built {PROJECT.name}: A/B laboratory + research summary + SVG/PNG map')

if __name__ == '__main__':
    build()
