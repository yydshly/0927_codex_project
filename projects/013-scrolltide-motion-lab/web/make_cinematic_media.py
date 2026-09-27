"""Render original moving plates and a watch image sequence from generated source art."""

from pathlib import Path
import math
import subprocess

from PIL import Image, ImageEnhance, ImageFilter


HERE = Path(__file__).resolve().parent
MEDIA = HERE / "media"
FRAMES = MEDIA / "watch-frames"
SIZE = (960, 540)


def cover(image: Image.Image, scale: float, offset_x: float = 0, offset_y: float = 0) -> Image.Image:
    width, height = SIZE
    factor = max(width / image.width, height / image.height) * scale
    resized = image.resize((round(image.width * factor), round(image.height * factor)), Image.Resampling.LANCZOS)
    x = round((resized.width - width) * (0.5 + offset_x))
    y = round((resized.height - height) * (0.5 + offset_y))
    return resized.crop((x, y, x + width, y + height))


def make_plate(source: str, target: str, duration: int, kind: str) -> None:
    image = Image.open(MEDIA / source).convert("RGB")
    eagle = Image.open(MEDIA / "eagle-cutout.png").convert("RGBA") if kind == "eagle" else None
    fps = 24
    count = duration * fps
    command = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pixel_format", "rgb24",
               "-video_size", "960x540", "-framerate", str(fps), "-i", "-", "-an", "-c:v", "libx264",
               "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(MEDIA / target)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for index in range(count):
            p = index / (count - 1)
            if kind == "eagle":
                frame = cover(image, 1.02 + p * .045, offset_x=.018 * p, offset_y=-.008 * p)
                frame = ImageEnhance.Color(frame).enhance(.72)
                frame = ImageEnhance.Brightness(frame).enhance(.88)
                approach = p * p * (3 - 2 * p)
                width = round(550 + approach * 665)
                bird = eagle.resize((width, round(width * eagle.height / eagle.width)), Image.Resampling.LANCZOS)
                x = round(960 * (.55 - .045 * approach) - bird.width / 2)
                y = round(540 * (.45 + .05 * approach) - bird.height / 2)
                frame.paste(bird, (x, y), bird)
            else:
                phase = .5 - .5 * math.cos(p * math.tau)
                frame = cover(image, 1.04 + phase * .07, offset_x=.025 * math.sin(p * math.tau), offset_y=.012 * math.sin(p * math.tau))
                frame = ImageEnhance.Color(frame).enhance(.91)
            process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError(f"Could not render {target}")
    print(f"Created {target}")


def make_watch_frames() -> None:
    FRAMES.mkdir(parents=True, exist_ok=True)
    source = Image.open(MEDIA / "watch-source.png").convert("RGB")
    for index in range(72):
        p = index / 71
        ease = p * p * (3 - 2 * p)
        # A pre-rendered editorial camera move from the whole case to the dial.
        crop_width = round(source.width * (1 - .39 * ease))
        crop_height = round(source.height * (1 - .43 * ease))
        cx = source.width * (.5 + .015 * ease)
        cy = source.height * (.5 - .055 * ease)
        crop = source.crop((round(cx - crop_width / 2), round(cy - crop_height / 2),
                            round(cx + crop_width / 2), round(cy + crop_height / 2)))
        product_height = round(625 + 390 * ease)
        product = crop.resize((round(crop.width * product_height / crop.height), product_height), Image.Resampling.LANCZOS)
        frame = Image.new("RGB", SIZE, (8, 9, 12))
        # The black studio surround blends into the dark page like the Ora campaign.
        x = round(620 - product.width * .5 - 170 * ease)
        y = round((540 - product.height) / 2 + 16 * ease)
        frame.paste(product, (x, y))
        frame.save(FRAMES / f"watch-{index:03}.webp", "WEBP", quality=86, method=5)
    print("Created 72 watch frames")


if __name__ == "__main__":
    make_plate("alps-source.png", "eagle-flight.mp4", 6, "eagle")
    make_plate("alps-source.png", "alpine-flight.mp4", 8, "alps")
    make_watch_frames()
