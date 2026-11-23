"""Dark campaign image for the scroll-headline cover, composed from the black cut-out.

Usage:
    pip install numpy scipy pillow
    python compose_campaign.py <nocta-hot-step-2-black.png> <out.jpg>

Near-black set (#050505 edges) with a cool graphite key light, a soft silhouette halo and a
faint floor reflection (the cut-out mirrored vertically, i.e. a rigid flip, fading out fast).
The shoe is placed with one uniform scale; nothing is warped.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1:3]
W, H = 2560, 1440
PRODUCT_W = 0.66 * W

shoe = Image.open(src).convert('RGBA')
a = np.asarray(shoe)[..., 3]
ys, xs = np.nonzero(a > 12)
x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
s = PRODUCT_W / (x1 - x0)
shoe = shoe.resize((round(shoe.width * s), round(shoe.height * s)), Image.LANCZOS)
x0, x1, y0, y1 = (round(v * s) for v in (x0, x1, y0, y1))
pw, ph = x1 - x0, y1 - y0
left = round(W / 2 - (x0 + x1) / 2)
top = round(H * 0.53 - (y0 + y1) / 2)
sole = top + y1

yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
# Background: cool graphite key light behind the shoe, falling to #050505.
d = np.hypot((xx - W * 0.5) / (W * 0.46), (yy - H * 0.47) / (H * 0.62))
key = np.exp(-d ** 2 * 1.9)
base = np.array([5, 5, 5], float) / 255
light = np.array([30, 33, 38], float) / 255
img = base + (light - base) * key[..., None]
# Soft floor glow under the sole.
fg = np.exp(-(((xx - W / 2) / (pw * 0.5)) ** 2) - (((yy - sole) / (ph * 0.07)) ** 2))
img += np.array([0.10, 0.105, 0.115]) * 0.35 * fg[..., None]

layer = np.zeros((H, W, 4))
sh = np.asarray(shoe).astype(np.float64) / 255
sy0, sx0 = max(0, top), max(0, left)
sy1, sx1 = min(H, top + shoe.height), min(W, left + shoe.width)
layer[sy0:sy1, sx0:sx1] = sh[sy0 - top:sy1 - top, sx0 - left:sx1 - left]
alpha = layer[..., 3]

# Halo: blurred silhouette, cool light outside the shoe only.
halo = ndi.gaussian_filter(alpha, pw * 0.012) * (1 - alpha)
img += np.array([0.55, 0.58, 0.64]) * 0.16 * halo[..., None]

# Floor reflection: vertical mirror of the shoe directly below the sole, fading quickly.
refl = np.zeros_like(layer)
mir = layer[::-1]
shift = 2 * sole - H  # row r of `mir` corresponds to row H-1-r; place its sole at `sole`
for r in range(sole, min(H, sole + int(ph * 0.35))):
    src_r = r - shift
    if 0 <= src_r < H:
        refl[r] = mir[src_r]
fade = np.clip(1 - (yy - sole) / (ph * 0.30), 0, 1) ** 2 * (yy >= sole)
ra = refl[..., 3] * fade * 0.10
img = img * (1 - ra[..., None]) + refl[..., :3] * ra[..., None]

# Shoe on top (straight alpha).
img = img * (1 - alpha[..., None]) + layer[..., :3] * alpha[..., None]
# Fine grain so the dark gradient never bands after JPEG compression.
rng = np.random.default_rng(7)
img += (rng.random((H, W, 1)) - 0.5) / 255 * 1.5
Image.fromarray(np.clip(np.round(img * 255), 0, 255).astype(np.uint8)).save(
    out, quality=92, optimize=True, progressive=True, subsampling=0)
print(f'{out}: {W}x{H}, product {pw}x{ph} at ({left + x0},{top + y0}), sole y={sole}')
