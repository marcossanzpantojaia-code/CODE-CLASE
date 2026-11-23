"""Campaign image for the scroll-headline cover, composed from the black cut-out.

Usage:
    pip install numpy scipy pillow
    python compose_campaign.py <nocta-hot-step-2-black.png> <out.jpg> [camo|studio]

camo (default): the dark studio set (cool graphite key light, silhouette halo, faint floor
reflection) with a few subtle orange camouflage touches toward the edges and corners.
studio: the same set without the camouflage.
The shoe is placed with one uniform scale; nothing is warped.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

src, out = sys.argv[1:3]
style = sys.argv[3] if len(sys.argv) > 3 else 'camo'
W, H = 2560, 1440
PRODUCT_W = 0.66 * W
rng = np.random.default_rng(7)

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

layer = np.zeros((H, W, 4))
sh = np.asarray(shoe).astype(np.float64) / 255
sy0, sx0 = max(0, top), max(0, left)
sy1, sx1 = min(H, top + shoe.height), min(W, left + shoe.width)
layer[sy0:sy1, sx0:sx1] = sh[sy0 - top:sy1 - top, sx0 - left:sx1 - left]
alpha = layer[..., 3]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)


def field(sigma):
    """Smooth zero-mean, unit-variance noise at roughly `sigma` px feature size."""
    q = 4
    n = rng.standard_normal((H // q + 8, W // q + 8))
    f = ndi.gaussian_filter(n, sigma / q)
    f = ndi.zoom(f, q, order=3)[:H, :W]
    return (f - f.mean()) / f.std()


def rgb(hexstr):
    return np.array([int(hexstr[i:i + 2], 16) for i in (1, 3, 5)], float) / 255


def touches(sigma, coverage, min_area):
    """Few, large camouflage blotches: hard mask, tiny islands removed, then a soft edge."""
    f = field(sigma) + 0.3 * field(sigma * 0.25)
    hard = f > np.quantile(f, 1 - coverage)
    labels, n = ndi.label(hard)
    if n:
        sizes = ndi.sum(hard, labels, range(1, n + 1))
        hard = np.isin(labels, 1 + np.nonzero(sizes >= min_area)[0])
    return ndi.gaussian_filter(hard.astype(float), 1.4)


# Dark studio set: graphite key light falling to #050505.
d = np.hypot((xx - W * 0.5) / (W * 0.46), (yy - H * 0.47) / (H * 0.62))
base, light = rgb('#050505'), np.array([30, 33, 38], float) / 255
img = base + (light - base) * np.exp(-d ** 2 * 1.9)[..., None]

if style == 'camo':
    # Subtle orange camouflage touches: sparse, low opacity, weighted toward the edges and
    # corners so the shoe and the headline keep a clean, dark field around them.
    r = np.hypot((xx - W * 0.5) / (W * 0.5), (yy - H * 0.5) / (H * 0.5))
    edge = np.clip((r - 0.45) / 0.5, 0, 1) ** 1.2
    big = W * H * 0.0012
    for color, sigma, coverage, opacity in (('#4a1c06', 120, 0.26, 0.55), ('#8e3610', 95, 0.13, 0.5), ('#d2581a', 70, 0.045, 0.42)):
        m = (touches(sigma, coverage, big) * edge * opacity)[..., None]
        img = img * (1 - m) + rgb(color) * m

fg = np.exp(-(((xx - W / 2) / (pw * 0.5)) ** 2) - (((yy - sole) / (ph * 0.07)) ** 2))
img += np.array([0.10, 0.105, 0.115]) * 0.35 * fg[..., None]
halo = ndi.gaussian_filter(alpha, pw * 0.012) * (1 - alpha)
img += np.array([0.55, 0.58, 0.64]) * 0.16 * halo[..., None]
# Faint floor reflection: rigid vertical flip of the cut-out directly below the sole, fading fast.
refl = np.zeros_like(layer)
mir = layer[::-1]
shift = 2 * sole - H
for r in range(sole, min(H, sole + int(ph * 0.35))):
    if 0 <= r - shift < H:
        refl[r] = mir[r - shift]
fade = np.clip(1 - (yy - sole) / (ph * 0.30), 0, 1) ** 2 * (yy >= sole)
ra = refl[..., 3] * fade * 0.10
img = img * (1 - ra[..., None]) + refl[..., :3] * ra[..., None]

img = img * (1 - alpha[..., None]) + layer[..., :3] * alpha[..., None]
img += (rng.random((H, W, 1)) - 0.5) / 255 * 1.5  # grain: no banding after JPEG
Image.fromarray(np.clip(np.round(img * 255), 0, 255).astype(np.uint8)).save(
    out, quality=92, optimize=True, progressive=True, subsampling=0)
print(f'{out}: {W}x{H} {style}, product {pw}x{ph} at ({left + x0},{top + y0}), sole y={sole}')
