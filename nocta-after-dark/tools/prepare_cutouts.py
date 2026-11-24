"""Transparent cut-outs for the line-up carousel from single images on a plain uniform background.

Usage (Python 3.10+, in a virtualenv):
    pip install numpy scipy pillow pymatting
    python prepare_cutouts.py <out_dir> <diagnostics_dir> <image>=<name> [<image>=<name> ...]

Inputs that already have a transparent background (such as the fluid reveal's PNGs) keep their
matte and are only cropped, scaled and encoded. For any other image the background colour is the median of the border; background = pixels within
12/255 of it that are connected to the border (no colour key inside the shoe, so shaded white
leather or a black upper is never punched through). A 2-px band around the silhouette is solved
with closed-form matting and the edge colours are decontaminated, so no grey fringe shows on the
dark stage. The result is cropped to the silhouette with a small transparent margin, downscaled
to at most MAX_WIDTH px wide (Lanczos, premultiplied) and written as <name>.webp (lossy colour,
lossless-quality alpha). Diagnostics composite each cut-out on the stage colour and on magenta.
"""
import json
import sys

import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from scipy import ndimage as ndi

MAX_WIDTH = 1400
MARGIN = 0.012  # transparent margin around the silhouette, fraction of its width
THRESHOLD = 12 / 255


def border_connected(mask):
    labels, _ = ndi.label(mask)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    return np.isin(labels, edge[edge > 0])


def largest_component(mask):
    labels, n = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, n + 1))
    return labels == (1 + int(np.argmax(sizes)))


def cutout(path):
    src = Image.open(path)
    if src.mode in ('RGBA', 'LA') or 'transparency' in src.info:
        rgba = np.asarray(src.convert('RGBA')).astype(np.float64) / 255.0
        if (rgba[..., 3] < 0.01).mean() > 0.05:  # already a cut-out (e.g. the reveal's PNGs): keep its matte
            return rgba[..., :3], rgba[..., 3], None
    img = np.asarray(src.convert('RGB')).astype(np.float64) / 255.0
    border = np.concatenate([img[0], img[-1], img[:, 0], img[:, -1]])
    bg = np.median(border, axis=0)
    d = np.abs(img - bg).max(axis=2)
    bgm = border_connected(d <= THRESHOLD)
    fg = ndi.binary_fill_holes(largest_component(~bgm))
    tri = np.full(fg.shape, 0.5)
    tri[ndi.binary_erosion(fg, iterations=2)] = 1
    tri[ndi.binary_erosion(~fg, iterations=2)] = 0
    alpha = np.clip(estimate_alpha_cf(img, tri), 0, 1)
    alpha[tri == 0] = 0
    alpha[tri == 1] = 1
    col = np.clip(estimate_foreground_ml(img, alpha), 0, 1)
    return col, alpha, bg


def crop_and_scale(col, alpha):
    ys, xs = np.nonzero(alpha > 0.02)
    w = xs.max() - xs.min() + 1
    m = int(np.ceil(w * MARGIN))
    x0, x1 = max(0, xs.min() - m), min(alpha.shape[1], xs.max() + 1 + m)
    y0, y1 = max(0, ys.min() - m), min(alpha.shape[0], ys.max() + 1 + m)
    col, alpha = col[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    scale = min(1.0, MAX_WIDTH / col.shape[1])
    if scale < 1:
        size = (round(col.shape[1] * scale), round(col.shape[0] * scale))
        # Resample premultiplied colour so transparent pixels never bleed into the edge.
        pre = [Image.fromarray((col[..., c] * alpha).astype(np.float32), 'F').resize(size, Image.LANCZOS) for c in range(3)]
        a = np.clip(np.asarray(Image.fromarray(alpha.astype(np.float32), 'F').resize(size, Image.LANCZOS)), 0, 1)
        col = np.dstack([np.asarray(p) for p in pre]) / np.maximum(a, 1e-4)[..., None]
        col = np.clip(np.where(a[..., None] > 1e-4, col, 0), 0, 1)
        alpha = a
    return col, alpha, (int(x0), int(y0), int(x1), int(y1)), scale


def main():
    out_dir, diag_dir = sys.argv[1:3]
    report = {}
    for spec in sys.argv[3:]:
        src, name = spec.rsplit('=', 1)
        col, alpha, bg = cutout(src)
        col, alpha, crop, scale = crop_and_scale(col, alpha)
        rgba = np.round(np.dstack([col, alpha]) * 255).astype(np.uint8)
        Image.fromarray(rgba, 'RGBA').save(f'{out_dir}/{name}.webp', quality=92, alpha_quality=100, method=6)
        for label, c in (('stage', (24, 25, 27)), ('magenta', (255, 0, 255))):
            a = alpha[..., None]
            comp = col * a + np.array(c) / 255.0 * (1 - a)
            Image.fromarray(np.round(comp * 255).astype(np.uint8)).save(f'{diag_dir}/{name}-on-{label}.png')
        report[name] = {
            'source': src,
            'background_rgb': None if bg is None else [round(float(v) * 255, 1) for v in bg],
            'crop_xyxy': crop,
            'scale': round(scale, 4),
            'size': [int(alpha.shape[1]), int(alpha.shape[0])],
            'aspect': round(alpha.shape[1] / alpha.shape[0], 4),
        }
    print(json.dumps(report, indent=2, default=float))


if __name__ == '__main__':
    main()
