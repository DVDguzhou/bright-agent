"""
Split 2x4 agent mascot sheet into separate PNGs and upscale (LANCZOS + mild unsharp).

Usage (from repo root):
  python scripts/split-agent-cover-sheet.py

Source: public/life-agent-cover-presets/_source-sheet.png
Output: public/life-agent-cover-presets/*.png (plus _source-sheet kept)
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageFilter

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "public" / "life-agent-cover-presets" / "_source-sheet.png"
OUT_DIR = REPO / "public" / "life-agent-cover-presets"

# Row-major: top row L→R, then bottom row (matches 2×4 sheet)
NAMES = [
    "01-student-panda",
    "02-robot-pro",
    "03-scholar-owl",
    "04-social-fox",
    "05-achiever-dino",
    "06-wellness-cloud",
    "07-city-bear",
    "08-service-dog",
]

SCALE = 4


def main() -> None:
    if not SRC.is_file():
        raise SystemExit(f"Missing source image: {SRC}")

    im = Image.open(SRC).convert("RGBA")
    w, h = im.size
    rows, cols = 2, 4

    row_heights = [(h + 1) // 2, h - (h + 1) // 2]
    col_widths = [w // cols] * (cols - 1)
    col_widths.append(w - sum(col_widths))

    y = 0
    idx = 0
    for r in range(rows):
        rh = row_heights[r]
        x = 0
        for c in range(cols):
            cw = col_widths[c]
            box = (x, y, x + cw, y + rh)
            crop = im.crop(box)
            up_w, up_h = crop.width * SCALE, crop.height * SCALE
            up = crop.resize((up_w, up_h), Image.Resampling.LANCZOS)
            up = up.filter(ImageFilter.UnsharpMask(radius=0.8, percent=100, threshold=2))

            out_path = OUT_DIR / f"{NAMES[idx]}.png"
            up.save(out_path, format="PNG", optimize=True)
            print(f"Wrote {out_path.relative_to(REPO)} ({up_w}x{up_h})")
            x += cw
            idx += 1
        y += rh

    print("Done.")


if __name__ == "__main__":
    main()
