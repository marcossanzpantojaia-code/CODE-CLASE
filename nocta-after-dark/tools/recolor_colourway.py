"""Derives a monochrome colourway from the white cut-out with a luminance gradient map.

Usage:
    pip install numpy pillow
    python recolor_colourway.py <nocta-hot-step-2-white.png> <out.png> [orange]

Every pixel keeps its alpha and its position (so the new colourway has exactly the white's
geometry and aligns perfectly with it); only colour changes: the white render's shading
(luminance) is mapped through a ramp of the target colour. This is a derived render, not a
photograph of the real colourway.
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

RAMPS = {
    # Nike "Total Orange"-style monochrome: deep shadow -> total orange -> warm specular.
    'orange': [
        (0.00, (52, 14, 2)),
        (0.30, (128, 38, 4)),
        (0.58, (214, 74, 10)),
        (0.80, (255, 104, 22)),
        (0.94, (255, 146, 72)),
        (1.00, (255, 206, 168)),
    ],
}

src, out = sys.argv[1:3]
ramp_name = sys.argv[3] if len(sys.argv) > 3 else 'orange'
stops = RAMPS[ramp_name]

rgba = np.asarray(Image.open(src).convert('RGBA')).astype(np.float64) / 255
rgb, a = rgba[..., :3], rgba[..., 3]
lum = rgb @ np.array([0.2126, 0.7152, 0.0722])
# The white render's shading lives between ~0.35 (deep creases) and 1.0 (speculars).
t = np.clip((lum - 0.35) / 0.65, 0, 1)
xs = np.array([s[0] for s in stops])
cols = np.array([s[1] for s in stops], float) / 255
mapped = np.stack([np.interp(t, xs, cols[:, c]) for c in range(3)], axis=-1)

# The real NOCTA colourways keep the side plate (mesh window + chrome swoosh) silver: find it as
# the largest COMPACT dark region of the upper (sole shadows and the air unit are long and thin,
# so they fail the compactness test), fill its holes so the swoosh is included, and keep the
# original neutral silver there with a soft 1.5 px edge.
dark = ndi.binary_closing((lum < 0.72) & (a > 0.9), iterations=3)
labels, n = ndi.label(dark)
best, best_area = None, 0
ys_all = np.nonzero(a > 0.5)[0]
shoe_top, shoe_h = ys_all.min(), ys_all.max() - ys_all.min()
for k in range(1, n + 1):
    region = labels == k
    area = int(region.sum())
    if area < 0.004 * (a > 0.5).sum():
        continue
    ry, rx = np.nonzero(region)
    fill = area / ((rx.max() - rx.min() + 1) * (ry.max() - ry.min() + 1))
    cy = (ry.mean() - shoe_top) / shoe_h
    if fill > 0.45 and 0.3 < cy < 0.75 and area > best_area:
        best, best_area = region, area
silver = np.zeros_like(a)
if best is not None:
    plate = ndi.binary_dilation(ndi.binary_fill_holes(best), iterations=2)
    silver = np.clip(ndi.gaussian_filter(plate.astype(float), 1.5) * 1.15, 0, 1)
    py, px = np.nonzero(plate)
    print(f'silver plate kept: x{px.min()}-{px.max()} y{py.min()}-{py.max()}, {int(plate.sum())} px')
neutral = np.repeat(lum[..., None], 3, axis=-1) * np.array([0.98, 1.0, 1.03])  # faintly cool silver
mapped = mapped * (1 - silver[..., None]) + np.clip(neutral, 0, 1) * silver[..., None]
result = np.dstack([mapped, a])
Image.fromarray(np.round(result * 255).astype(np.uint8), 'RGBA').save(out, optimize=True)
print(f'{out}: {rgba.shape[1]}x{rgba.shape[0]} ({ramp_name})')
