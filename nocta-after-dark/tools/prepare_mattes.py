"""Silhouette mattes for the two opaque, white-background NOCTA Hot Step 2 photos.

Usage (Python 3.10+, in a virtualenv):
    pip install numpy scipy pillow pymatting
    python prepare_mattes.py <black.png> <white.webp|png> <out_dir> <diagnostics_dir>

The black source was supplied as JPEG XL; decode it first, e.g.
    ffmpeg -i DZ7293-001.jxl -frames:v 1 -pix_fmt rgba black.png

Black photo (high contrast): background = near-white pixels connected to the image border;
trimap = eroded foreground / eroded background / 2-px unknown band; closed-form matting
resolves the band; ML foreground estimation removes the white-background colour from edge
pixels (otherwise a light fringe would glow on the dark page).

White photo (white on white, contact shadow under the sole): the black silhouette is
registered onto it with ONE uniform scale + translation (left heel, right toe and collar top,
which are shadow-free) and used only to place the trimap band; the alpha itself is solved from
the white photo's own pixels. Everything below the registered sole line is forced to
background so the cast shadow is dropped.

Both outputs are straight-alpha RGBA PNGs, cropped (never resampled) to the product with a
margin; geometry is untouched.
"""
import json
import sys

import numpy as np
from PIL import Image
from pymatting import estimate_alpha_cf, estimate_foreground_ml
from scipy import ndimage as ndi

black_path, white_path, out_dir, diag_dir = sys.argv[1:5]


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64) / 255.0


def border_connected(mask):
    labels, _ = ndi.label(mask)
    edge = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    edge = edge[edge > 0]
    return np.isin(labels, edge)


def largest_component(mask):
    labels, n = ndi.label(mask)
    if n == 0:
        return mask
    sizes = ndi.sum(mask, labels, range(1, n + 1))
    return labels == (1 + int(np.argmax(sizes)))


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def matte(img, trimap):
    alpha = np.clip(estimate_alpha_cf(img, trimap), 0, 1)
    alpha[trimap == 0] = 0
    alpha[trimap == 1] = 1
    fg = np.clip(estimate_foreground_ml(img, alpha), 0, 1)
    return alpha, fg


def save_rgba(path, fg, alpha):
    rgba = np.dstack([fg, alpha])
    Image.fromarray(np.round(rgba * 255).astype(np.uint8), 'RGBA').save(path, optimize=True)


def composite(fg, alpha, color):
    bg = np.ones_like(fg) * np.array(color) / 255.0
    return fg * alpha[..., None] + bg * (1 - alpha[..., None])


def save_diag(name, fg, alpha):
    for label, color in (('on-050505', (5, 5, 5)), ('on-grey', (128, 128, 128))):
        Image.fromarray(np.round(composite(fg, alpha, color) * 255).astype(np.uint8)).save(
            f'{diag_dir}/{name}-{label}.png')
    Image.fromarray(np.round(alpha * 255).astype(np.uint8)).save(f'{diag_dir}/{name}-alpha.png')


report = {}

# ------------------------------------------------------------------ black
B = load(black_path)
dB = (1 - B).max(axis=2)
# The studio floor carries a soft grey contact shadow (lum 136-225) under the sole; the black
# rubber outsole is far darker (< 100). Per column, everything below the lowest dark pixel is
# floor/shadow (leaves at most ~2 px of contact penumbra under the heel). Background = near-white (<= 16/255 from white) or below-sole pixels connected to
# the border, so see-through gaps reached through the shadow are background too, while bright
# details enclosed by dark material (air-unit highlights, mesh window) stay shoe.
lumB = B.mean(axis=2)
darkB = lumB < 100 / 255  # < 75 would also cut the slightly lighter toe rubber
rowsB = np.arange(B.shape[0])[:, None]
hasDarkB = darkB.any(axis=0)
soleB = np.where(hasDarkB, B.shape[0] - 1 - np.argmax(darkB[::-1], axis=0), -1)
belowB = (rowsB > soleB[None, :] + 1) | ~hasDarkB[None, :]
bgB = border_connected((dB <= 16 / 255) | belowB)
fgB = largest_component(~bgB)
x0, y0, x1, y1 = bbox(fgB)
pw = x1 - x0 + 1
m = int(round(pw * 0.06))  # margin for the rim-light halo
# Pad with white (it is background) so every side gets the margin; padding is not resampling.
pad = max(0, m - x0, m - y0, x1 + m + 1 - B.shape[1], y1 + m + 1 - B.shape[0])
B = np.pad(B, ((pad, pad), (pad, pad), (0, 0)), constant_values=1.0)
fgB = np.pad(fgB, pad, constant_values=False)
bgB = np.pad(bgB, pad, constant_values=True)
x0, y0, x1, y1 = x0 + pad, y0 + pad, x1 + pad, y1 + pad
cx0, cy0 = x0 - m, y0 - m
cx1, cy1 = x1 + m + 1, y1 + m + 1
Bc, fgBc, bgBc = B[cy0:cy1, cx0:cx1], fgB[cy0:cy1, cx0:cx1], bgB[cy0:cy1, cx0:cx1]
triB = np.full(fgBc.shape, 0.5)
triB[ndi.binary_erosion(fgBc, iterations=2)] = 1
triB[ndi.binary_erosion(bgBc, iterations=2) & ~fgBc] = 0
belowBc = np.pad(belowB, pad, constant_values=True)[cy0:cy1, cx0:cx1]
triB[belowBc] = 0  # contact shadow under the sole is floor, never a soft shoe edge
alphaB, fgColB = matte(Bc, triB)
alphaB[belowBc] = 0
save_rgba(f'{out_dir}/nocta-hot-step-2-black.png', fgColB, alphaB)
save_diag('black', fgColB, alphaB)
report['black'] = {
    'source_size': [B.shape[1] - 2 * pad, B.shape[0] - 2 * pad],
    'padding_px': pad,
    'crop_in_padded': [cx0, cy0, cx1, cy1],
    'output_size': [cx1 - cx0, cy1 - cy0],
    'product_bbox_in_output': [x0 - cx0, y0 - cy0, x1 - cx0, y1 - cy0],
    'unknown_px': int((triB == 0.5).sum()),
}

# ------------------------------------------------------------------ white
# The white photo is only 600 px wide and is displayed at ~1.8x: solve the matte on a uniform
# 2x Lanczos upscale (same factor on both axes, so proportions are untouched) to avoid
# staircase edges. This adds no detail; it only gives the alpha a finer grid.
UPSCALE = 2
_wsrc = Image.open(white_path).convert('RGB')
Wimg = np.asarray(_wsrc.resize((_wsrc.width * UPSCALE, _wsrc.height * UPSCALE), Image.LANCZOS)).astype(np.float64) / 255.0
Wimg = np.clip(Wimg, 0, 1)
dW = (1 - Wimg).max(axis=2)
bgW = border_connected(dW <= 3 / 255)
ownW = largest_component(dW > 16 / 255)  # robust own silhouette (includes the cast shadow at the bottom)
wx0, wy0, wx1, _ = bbox(ownW)
# Black silhouette, shadow-free extents in the crop's coordinates.
bx0, by0, bx1, by1 = bbox(alphaB > 0.5)
s = (wx1 - wx0) / (bx1 - bx0)  # one uniform scale
tx = wx0 - s * bx0
ty = wy0 - s * by0
# Inverse map white pixel -> black-crop pixel: b = (w - t) / s  (same scale on both axes).
prior = ndi.affine_transform(alphaB, [1 / s, 1 / s], offset=[-ty / s, -tx / s],
                             output_shape=dW.shape, order=1, mode='constant', cval=0.0)
priorFg = prior > 0.5
k = 4 * UPSCALE  # band wide enough for small real shape differences (tongue, laces)
triW = np.full(dW.shape, 0.5)
triW[ndi.binary_erosion(priorFg, iterations=k)] = 1
outside = ~ndi.binary_dilation(priorFg, iterations=k)
triW[outside] = 0
# Drop the cast shadow: everything below the registered sole line of its column is background.
rows = np.arange(dW.shape[0])[:, None]
has = priorFg.any(axis=0)
sole = np.where(has, dW.shape[0] - 1 - np.argmax(priorFg[::-1], axis=0), -1)
below = (rows > sole[None, :] + 1) | ~has[None, :]
triW[below] = 0
alphaW, fgColW = matte(Wimg, triW)
# White-on-white edges carry no reliable edge signal: inside the band the closed-form alpha
# follows the source WebP's 8x8 compression blocks. The registered silhouette of the same
# product at the same angle (smooth, from the high-contrast black photo) decides the band
# instead; the photo's own alpha is kept only where the white shoe clearly extends past it with
# real contrast (tongue/laces sitting slightly higher).
band = triW == 0.5
alphaCF = alphaW.copy()
alphaW[band] = prior[band]
extends = band & (alphaCF > prior + 0.3) & (dW > 20 / 255)
alphaW[extends] = alphaCF[extends]
# Sole bottom: the registered silhouette ends a few rows below the white outsole (the black
# photo's contact penumbra plus a 0.4 % aspect difference between the two shots), so those rows
# are white background. The white outsole's visible bottom is its darker crease line; per column,
# cut just below the lowest visible (non-near-white) pixel within 16 rows of the registered sole,
# median-filtered across columns so the edge stays clean.
creaseWin = 8 * UPSCALE
edge = sole.copy()
for x in np.nonzero(has)[0]:
    y_top = max(0, sole[x] - creaseWin)
    seg = dW[y_top:sole[x] + 1, x] > 24 / 255
    if seg.any():
        edge[x] = y_top + int(np.nonzero(seg)[0].max())
edge = np.where(has, ndi.median_filter(edge, size=12 * UPSCALE + 1, mode='nearest'), edge)
edge = np.minimum(edge, sole)
trimmed = (rows > edge[None, :] + 1) & has[None, :]
aa_row = (rows == edge[None, :] + 1) & has[None, :]
alphaW_untrimmed = alphaW.copy()
alphaW[trimmed] = 0
alphaW[aa_row] *= 0.5
alphaW[below] = 0
fgColW = np.clip(estimate_foreground_ml(Wimg, alphaW), 0, 1)
save_rgba(f'{out_dir}/nocta-hot-step-2-white.png', fgColW, alphaW)
save_diag('white', fgColW, alphaW)

# Registration quality on the shadow-free upper 80 % of the shoe.
upper = rows < (wy0 + 0.8 * (sole.max() - wy0))
ownSil = ndi.binary_fill_holes(~bgW) & upper
iou = float((ownSil & priorFg & upper).sum() / max(1, ((ownSil | priorFg) & upper).sum()))
def browser_bbox_y1(alpha):
    """Bottom of the bbox exactly as the component's analyseAlpha computes it (alpha > 12/255,
    refined by the coverage of the outermost row), in pixels."""
    a8 = np.round(alpha * 255)
    rows_any = np.nonzero((a8 > 12).any(axis=1))[0]
    y1 = int(rows_any.max())
    return y1 + a8[y1].max() / 255.0


def browser_bbox_w(alpha):
    a8 = np.round(alpha * 255)
    cols = np.nonzero((a8 > 12).any(axis=0))[0]
    x0, x1 = int(cols.min()), int(cols.max())
    return (x1 + a8[:, x1].max() / 255.0) - (x0 + 1 - a8[:, x0].max() / 255.0)


y1_before = browser_bbox_y1(alphaW_untrimmed)
y1_after = browser_bbox_y1(alphaW)
report['white_sole_trim'] = {
    'bbox_bottom_before_px': y1_before,
    'bbox_bottom_after_px': y1_after,
    'delta_px': y1_before - y1_after,
    'max_rows_trimmed_in_a_column': int((sole - edge)[has].max()),
    # Deliberately not compensated: with the page's sole-to-sole alignment this trim also moves
    # the interior features of the white photo onto the black ones vertically (see README).
    'delta_fraction_of_product_width': (y1_before - y1_after) / browser_bbox_w(alphaW),
}
report['white'] = {
    'source_size': [Wimg.shape[1], Wimg.shape[0]],
    'registration': {'scale_white_per_black_px': s, 'tx': tx, 'ty': ty},
    'implied_black_bottom_in_white_px': s * by1 + ty,
    'upper_silhouette_iou_vs_black': iou,
    'alpha_bbox': list(bbox(alphaW > 0.5)),
    'unknown_px': int((triW == 0.5).sum()),
}
print(json.dumps(report, indent=1))
