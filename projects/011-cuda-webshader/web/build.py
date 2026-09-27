"""Build the self-contained CUDA WebShader research gallery."""
import json
from pathlib import Path
import shutil
import re

WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
ROOT = PROJECT.parents[1]
OUT = ROOT / "dist" / PROJECT.name


def main():
    data = json.loads((WEB / "catalog.json").read_text(encoding="utf-8"))
    items = data["items"]
    assert len(items) == 50, "Expected the documented 50 upstream showcase entries"
    assert len({item["id"] for item in items}) == len(items), "Duplicate showcase id"
    applications = json.loads((WEB / "applications.json").read_text(encoding="utf-8"))["items"]
    assert len(applications) == 50 and {entry["id"] for entry in applications} == {item["id"] for item in items}, "Application guide must cover every showcase"
    assert all(all(entry.get(field) for field in ("scene", "when", "result")) for entry in applications), "Incomplete application guide entry"
    for item in items:
        expected = "https://samg-coder.github.io/cuda-webshader/sandbox.html?example=" + item["id"]
        assert item["url"] == expected, f"Unexpected upstream link: {item['id']}"
    markup = (WEB / "index.html").read_text(encoding="utf-8")
    gallery = markup.split('<section class="scenario-section"', 1)[1].split("</section>", 1)[0]
    prototypes = re.findall(r'data-prototype="([^"]+)"', gallery)
    links = re.findall(r'https://samg-coder.github.io/cuda-webshader/sandbox.html\?example=([^"]+)', gallery)
    assert len(prototypes) == len(set(prototypes)) == 12, "Expected 12 unique algorithm visuals"
    assert len(links) == 12 and set(links).issubset({item["id"] for item in items}), "A visual links to an unknown upstream example"
    OUT.mkdir(parents=True, exist_ok=True)
    assert 'id="coastal-scene"' in markup and 'id="coastal-canvas"' in markup, "Missing coastal model"
    assert 'id="real-coast"' in markup and 'https://samg-coder.github.io/coastal-simulation-cuda-webshader/' in markup, "Missing live 3D coast"
    assert 'id="capability-basics"' in markup, "Missing plain-language capability explanation"
    assert 'id="capability-map"' in markup and 'capability-map.png' in markup, "Missing one-page capability map"
    assert 'id="understanding"' in markup and 'understanding.css' in markup, "Missing research summary"
    applications = markup.split('<section class="application-section"', 1)[1].split("</section>", 1)[0]
    assert applications.count('class="scenario-card"') == 4, "Expected four real-world application examples"
    assert all(label in applications for label in ("输入什么", "库算什么", "得到什么、怎么用")), "Incomplete application mapping"
    for filename in ("index.html", "styles.css", "basics.css", "understanding.css", "use-guide.css", "prototypes.css", "coastal-scene.css", "coastal-reference.jpg", "capability-map.png", "app.mjs", "prototypes.mjs", "prototypes-extra.mjs", "coastal-scene.mjs", "catalog.json", "applications.json", "favicon.svg"):
        shutil.copy2(WEB / filename, OUT / filename)
    print(f"Built {OUT.relative_to(ROOT).as_posix()} with {len(items)} upstream entries")


if __name__ == "__main__":
    main()
