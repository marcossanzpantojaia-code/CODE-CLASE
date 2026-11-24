"""Small WebP thumbnails of the line-up cut-outs for the previous/next shoe cards.

Usage:
    pip install pillow
    python make_thumbs.py <assets_dir> <name> [<name> ...]

Writes <name>-thumb.webp, 480 px wide (premultiplied Lanczos, lossless-quality alpha), next to
<name>.webp.
"""
import os
import sys

from PIL import Image

WIDTH = 480

assets, *names = sys.argv[1:]
for name in names:
    src = Image.open(os.path.join(assets, f'{name}.webp')).convert('RGBA')
    h = round(src.height * WIDTH / src.width)
    thumb = src.convert('RGBa').resize((WIDTH, h), Image.LANCZOS).convert('RGBA')
    out = os.path.join(assets, f'{name}-thumb.webp')
    thumb.save(out, quality=90, alpha_quality=100, method=6)
    print(out, thumb.size, os.path.getsize(out) // 1024, 'KB')
