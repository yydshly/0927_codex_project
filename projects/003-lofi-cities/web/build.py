"""Build this static showcase into the repository's shared dist directory."""
from pathlib import Path
import shutil
import json
import sys
from zipfile import ZipFile, ZIP_DEFLATED

SOURCE = Path(__file__).resolve().parent
PROJECT = SOURCE.parent.name
DESTINATION = SOURCE.parents[2] / "dist" / PROJECT
FILES = ("index.html", "research.html", "styles.css", "app.js", "content.js", "preset.js",
         "lab.css", "lab.js", "lab-model.js", "lab-scene.js", "lab-audio.js")

def build():
    for name in FILES:
        if not (SOURCE / name).is_file():
            raise SystemExit(f"Missing source file: {name}")
    if not (SOURCE / "assets" / "istanbul-scene.png").is_file():
        raise SystemExit("Missing screenshot assets")
    for scene in ("study", "forest", "coast", "train", "neon", "snow"):
        if not (SOURCE / "assets" / "scenes" / f"{scene}-v3.png").is_file():
            raise SystemExit(f"Missing scene artwork: {scene}")
    for layer in ("train-frame", "train-landscape"):
        if not (SOURCE / "assets" / "scenes" / f"{layer}-v4.png").is_file():
            raise SystemExit(f"Missing animated scene layer: {layer}")
    DESTINATION.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        shutil.copy2(SOURCE / name, DESTINATION / name)
    shutil.copytree(SOURCE / "assets", DESTINATION / "assets", dirs_exist_ok=True)
    shutil.copytree(SOURCE / "studio", DESTINATION / "studio", dirs_exist_ok=True)
    print(f"Built static showcase: {DESTINATION}")

def package_product():
    version = json.loads((SOURCE / "package.json").read_text(encoding="utf-8"))["version"]
    target = DESTINATION.parent / f"quiet-spaces-{version}.zip"
    files = [SOURCE / "index.html", SOURCE / "assets" / "product-guide.png"]
    files += sorted((SOURCE / "studio").glob("*.js"))
    files += sorted((SOURCE / "studio").glob("*.css"))
    files += sorted((SOURCE / "assets" / "scenes").glob("*.png"))
    with ZipFile(target, "w", ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(SOURCE).as_posix())
        archive.writestr("README.txt", (
            f"栖间 Quiet Spaces {version}\n\n"
            "桌面网页成品：六个动态场景、六套氛围组合、音乐库、环境混音、专注与收藏。\n"
            "将 index.html、studio 和 assets 保持原目录结构上传至任意静态网站托管即可。\n"
            "也可以在解压目录运行 python -m http.server 4313，再访问 http://127.0.0.1:4313/ 。\n"
            "请通过 HTTP(S) 打开，直接双击 HTML 的 file:// 模式不支持本产品的模块加载。\n"
            "点击‘开启这一刻’或任一氛围组合启动声音。首次打开不会自动播放。\n"
            "所有内置媒体均在包内，不需要 API 密钥、依赖安装或后端。\n"
            "设置与收藏保存在当前浏览器。本地音频不上传，刷新后需重新选择。\n"
            "快捷键：空格播放/暂停，N 下一首，F 沉浸，Esc 收起面板或退出沉浸。\n"
        ))
    print(f"Packaged desktop product: {target} ({target.stat().st_size:,} bytes)")

if __name__ == "__main__":
    build()
    if "--package" in sys.argv:
        package_product()
