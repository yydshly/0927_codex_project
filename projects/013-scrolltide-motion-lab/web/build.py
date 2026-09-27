"""Validate and build the self-contained Motion Atlas static exhibit."""

from pathlib import Path
import shutil


WEB = Path(__file__).resolve().parent
PROJECT = WEB.parent
ROOT = PROJECT.parents[1]
OUT = ROOT / "dist" / PROJECT.name
SECTIONS = ("video", "sequence", "three", "hybrid", "css3d", "shader")
SOURCE_CAPTURES = ("source-vesper.png", "source-aeroforce.png", "source-apogee.png", "source-eagle.png", "source-ora.png")


def main():
    html = (WEB / "index.html").read_text(encoding="utf-8")
    script = (WEB / "app.mjs").read_text(encoding="utf-8")
    for section in SECTIONS:
        if f'id="{section}"' not in html:
            raise ValueError(f"Missing demo section: {section}")
    for marker in ("new THREE.WebGLRenderer", "getContext('webgl'", "drawImage(image", "perspective", "hybrid-film"):
        if marker not in script and marker not in html:
            raise ValueError(f"Missing implementation marker: {marker}")
    frames = sorted((WEB / "media" / "watch-frames").glob("watch-*.webp"))
    required_media = ("eagle-flight.mp4", "eagle-poster.jpg", "eagle-cutout.png", "alpine-flight.mp4", "eagle-source.png", "alps-source.png", "gallery-source.png", "watch-source.png")
    if len(frames) != 72 or any(not (WEB / "media" / name).is_file() for name in required_media):
        raise ValueError("Missing one of the original cinematic media files or 72 watch frames")
    if any(not (PROJECT / "assets" / name).is_file() for name in SOURCE_CAPTURES):
        raise ValueError("Missing a Scrolltide source example screenshot")
    if not OUT.resolve().is_relative_to((ROOT / "dist").resolve()):
        raise ValueError("Build output escaped the repository dist directory")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    for name in ("index.html", "styles.css", "app.mjs", "favicon.svg"):
        shutil.copy2(WEB / name, OUT / name)
    shutil.copytree(WEB / "media", OUT / "media")
    shutil.copytree(WEB / "vendor", OUT / "vendor")
    shutil.copytree(PROJECT / "assets", OUT / "assets")
    print(f"Built {OUT.relative_to(ROOT).as_posix()} with six local interactive demos")


if __name__ == "__main__":
    main()
