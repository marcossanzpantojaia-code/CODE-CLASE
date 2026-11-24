"""Mattes + rigid registration for a black/white pair shot (or rendered) on plain uniform backgrounds.

Usage (Python 3.10+, in a virtualenv):
    pip install numpy scipy pillow pymatting
    python prepare_mattes_uniform_bg.py <black image> <white image> <out_dir> <diagnostics_dir> [<name prefix>]

Writes <prefix>-black.png and <prefix>-white.png (default prefix: nocta-hot-step-2).

For each image the background colour is the median of the border; background = pixels within
12/255 of it that are connected to the border; a 2-px band around the silhouette is solved with
closed-form matting and the edge colours are decontaminated (no grey fringe on the dark page).
The black photo gets transparent padding for the rim-light halo; nothing is resampled.

The two silhouettes are then registered with ONE uniform scale + translation (least squares on
soft masks), and the script prints the `data-align-black="dx dy scale"` value that makes the
page's own plane fitting (nocta-after-dark/src/layout.js, ported below) reproduce exactly that
rigid registration at every frame size.
"""
import json
import sys

import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from scipy import ndimage as ndi
from scipy import optimize

black_path, white_path, out_dir, diag_dir = sys.argv[1:5]
prefix = sys.argv[5] if len(sys.argv) > 5 else 'nocta-hot-step-2'


def border_connected(mask):
    labels, _ = ndi.label(mask)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    return np.isin(labels, edge[edge > 0])


def largest_component(mask):
    labels, n = ndi.label(mask)
    sizes = ndi.sum(mask, labels, range(1, n + 1))
    return labels == (1 + int(np.argmax(sizes)))


def matte(path, pad_frac):
    img = np.asarray(Image.open(path).convert('RGB')).astype(np.float64) / 255.0
    border = np.concatenate([img[0], img[-1], img[:, 0], img[:, -1]])
    bg = np.median(border, axis=0)
    d = np.abs(img - bg).max(axis=2)
    bgm = border_connected(d <= 12 / 255)
    fg = largest_component(~bgm)
    ys, xs = np.nonzero(fg)
    pw = xs.max() - xs.min() + 1
    # Uniform padding with the background colour so the halo is never clipped by the plane edge.
    need = int(round(pw * pad_frac))
    margin = min(xs.min(), ys.min(), img.shape[1] - 1 - xs.max(), img.shape[0] - 1 - ys.max())
    pad = max(0, need - margin)
    if pad:
        img = np.pad(img, ((pad, pad), (pad, pad), (0, 0)), mode='constant')
        img[:pad], img[-pad:], img[:, :pad], img[:, -pad:] = bg, bg, bg, bg
        fg = np.pad(fg, pad, constant_values=False)
        bgm = np.pad(bgm, pad, constant_values=True)
    tri = np.full(fg.shape, 0.5)
    tri[ndi.binary_erosion(fg, iterations=2)] = 1
    tri[ndi.binary_erosion(bgm, iterations=2) & ~fg] = 0
    alpha = np.clip(estimate_alpha_cf(img, tri), 0, 1)
    alpha[tri == 0] = 0
    alpha[tri == 1] = 1
    col = np.clip(estimate_foreground_ml(img, alpha), 0, 1)
    return img, alpha, col, pad, bg


def save(path, col, alpha):
    Image.fromarray(np.round(np.dstack([col, alpha]) * 255).astype(np.uint8), 'RGBA').save(path, optimize=True)
    return np.asarray(Image.open(path))[..., 3]  # 8-bit alpha exactly as the browser will see it


def diag(name, col, alpha):
    for label, c in (('on-050505', (5, 5, 5)), ('on-grey', (128, 128, 128))):
        bgc = np.ones_like(col) * np.array(c) / 255.0
        comp = col * alpha[..., None] + bgc * (1 - alpha[..., None])
        Image.fromarray(np.round(comp * 255).astype(np.uint8)).save(f'{diag_dir}/{name}-{label}.png')


imgB, alphaB, colB, padB, bgB = matte(black_path, 0.06)
imgW, alphaW, colW, padW, bgW = matte(white_path, 0.0)
a8B = save(f'{out_dir}/{prefix}-black.png', colB, alphaB)
a8W = save(f'{out_dir}/{prefix}-white.png', colW, alphaW)
diag('black', colB, alphaB)
diag('white', colW, alphaW)

# ---------------------------------------------------------------- rigid registration (PNG space)
sw = ndi.gaussian_filter(a8W / 255.0, 2)
sb = ndi.gaussian_filter(a8B / 255.0, 2)


def warp(img, s, tx, ty, shape):
    return ndi.affine_transform(img, [1 / s, 1 / s], offset=[-ty / s, -tx / s], output_shape=shape, order=1)


def bbox8(a8):
    """Sub-pixel product bbox exactly like analyseAlpha() in the component (pixels)."""
    ys = np.nonzero((a8 > 12).any(axis=1))[0]
    xs = np.nonzero((a8 > 12).any(axis=0))[0]
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    return (x0 + 1 - a8[:, x0].max() / 255, y0 + 1 - a8[y0].max() / 255,
            x1 + a8[:, x1].max() / 255, y1 + a8[y1].max() / 255)


bBx, wBx = bbox8(a8B), bbox8(a8W)
s0 = (wBx[2] - wBx[0]) / (bBx[2] - bBx[0])
p0 = [s0, wBx[0] - s0 * bBx[0], wBx[3] - s0 * bBx[3]]
res = optimize.minimize(lambda p: np.mean((warp(sb, *p, sw.shape) - sw) ** 2), p0, method='Nelder-Mead',
                        options={'xatol': 1e-4, 'fatol': 1e-8, 'maxiter': 600,
                                 'initial_simplex': [p0, [p0[0] * 1.01, p0[1], p0[2]], [p0[0], p0[1] + 4, p0[2]],
                                                     [p0[0], p0[1], p0[2] + 4]]})
s, tx, ty = res.x
reg = warp(a8B / 255.0, s, tx, ty, a8W.shape) > 0.5
own = a8W > 127
iou = float((reg & own).sum() / (reg | own).sum())
dt = ndi.distance_transform_edt(~(own ^ ndi.binary_erosion(own)))
ed = dt[reg ^ ndi.binary_erosion(reg)]

# ---------------------------------------------------------------- port of layout.js fitPlanes()
LAYOUT = dict(centerX=0.5, centerY=0.54, maxWidth=0.86, maxHeight=0.62)


def pbox(shape, bx):
    H, W = shape
    return dict(w=bx[2] - bx[0], h=bx[3] - bx[1], cx=(bx[0] + bx[2]) / 2 / W, cy=(bx[1] + bx[3]) / 2 / H, W=W, H=H)


def fit(fw, fh, adj):
    wb, bb = pbox(a8W.shape, wBx), pbox(a8B.shape, bBx)
    pw = max(1, min(fw * LAYOUT['maxWidth'], fh * LAYOUT['maxHeight'] * min(wb['w'] / wb['h'], bb['w'] / bb['h'])))
    cx, cy = fw * LAYOUT['centerX'], fh * LAYOUT['centerY']
    sW = pw / wb['w']
    wWid, wHei = wb['W'] * sW, wb['H'] * sW
    wLeft, wTop = cx - wb['cx'] * wWid, cy - wb['cy'] * wHei
    sole = cy + wb['h'] * sW / 2
    sB = pw / bb['w'] * adj[2]
    bWid, bHei = bb['W'] * sB, bb['H'] * sB
    pcx = cx + adj[0] * pw
    pcy = sole - bb['h'] * sB / 2 + adj[1] * pw
    return dict(pw=pw, sW=sW, wLeft=wLeft, wTop=wTop, sB=sB, bLeft=pcx - bb['cx'] * bWid, bTop=pcy - bb['cy'] * bHei)


scale_adj = s * (bBx[2] - bBx[0]) / (wBx[2] - wBx[0])
f0 = fit(1440, 914, [0, 0, scale_adj])
want_left = f0['wLeft'] + f0['sW'] * tx
want_top = f0['wTop'] + f0['sW'] * ty
dx = (want_left - f0['bLeft']) / f0['pw']
dy = (want_top - f0['bTop']) / f0['pw']
# Self-check at other frame sizes: the page must reproduce the registration everywhere.
worst = 0.0
for fw, fh in ((1440, 914), (390, 780), (820, 1100), (1920, 520)):
    f = fit(fw, fh, [dx, dy, scale_adj])
    worst = max(worst, abs(f['bLeft'] - (f['wLeft'] + f['sW'] * tx)), abs(f['bTop'] - (f['wTop'] + f['sW'] * ty)),
                abs(f['sB'] - f['sW'] * s) * a8B.shape[1])

print(json.dumps({
    'black': {'size': [a8B.shape[1], a8B.shape[0]], 'padding_px': padB, 'background_rgb': [round(v * 255) for v in bgB]},
    'white': {'size': [a8W.shape[1], a8W.shape[0]], 'padding_px': padW, 'background_rgb': [round(v * 255) for v in bgW]},
    'registration_black_to_white_px': {'scale': s, 'tx': tx, 'ty': ty, 'iou': iou,
                                       'edge_distance_px_median_p90_p99': [float(v) for v in np.percentile(ed, [50, 90, 99])]},
    'data_align_black': f'{dx:.5f} {dy:.5f} {scale_adj:.5f}',
    'page_reproduction_max_error_px': worst,
}, indent=1, default=float))
