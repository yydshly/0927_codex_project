"""Build the self-contained coastal GPU research guide."""

from pathlib import Path
import shutil


WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
ROOT = PROJECT.parents[1]
OUT = ROOT / "dist" / PROJECT.name


def main():
    page = (WEB / "index.html").read_text(encoding="utf-8")
    expected = ("id=\"overview\"", "id=\"flow\"", "id=\"capabilities\"",
                "id=\"experience\"", "id=\"evidence\"", "id=\"application\"",
                "id=\"meaning\"")
    missing = [section for section in expected if section not in page]
    if missing:
        raise ValueError(f"Missing page sections: {', '.join(missing)}")
    if page.count('class="cap-card"') != 18:
        raise ValueError("Expected all 18 documented capability cards")
    OUT.mkdir(parents=True, exist_ok=True)
    extension = (WEB / "extensions.html").read_text(encoding="utf-8")
    for control in ('id="terrain"', 'id="preset"', 'id="quality"', 'id="coast"',
                    'id="source-reef"', 'id="upstream-frame"'):
        if control not in extension:
            raise ValueError(f"Missing extension control: {control}")
    for name in ("index.html", "styles.css", "app.mjs", "favicon.svg",
                 "extensions.html", "extensions.css", "extensions.mjs",
                 "extensions-core.mjs", "extensions-sim.wgsl", "extensions-render.wgsl",
                 "source-view.mjs"):
        shutil.copy2(WEB / name, OUT / name)
    upstream = WEB / "upstream"
    for required in ("index.html", "LICENSE", "CREDITS.md", "initial-state.bin.gz",
                     "src/main.js", "src/resident-coast.js", "src/local-extension.js",
                     "vendor/three.webgpu.js"):
        if not (upstream / required).is_file():
            raise ValueError(f"Missing bundled upstream file: {required}")
    shutil.copytree(upstream, OUT / "upstream", dirs_exist_ok=True)
    assets = OUT / "assets"
    assets.mkdir(exist_ok=True)
    for name in ("capability-map.svg", "coastal-capabilities-overview.png",
                 "online-reef-verification.png", "source-ocean-to-shore.jpg",
                 "source-wash-wet-sand.jpg", "README.md"):
        shutil.copy2(PROJECT / "assets" / name, assets / name)
    print(f"Built {OUT.relative_to(ROOT).as_posix()} with 18 capability cards and extension lab")


if __name__ == "__main__":
    main()
