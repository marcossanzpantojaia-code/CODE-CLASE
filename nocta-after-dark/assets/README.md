# Required product photography

The product images are **git-ignored** (see `../.gitignore`): the repository is public and the photos are copyrighted Nike product shots. A fresh clone therefore has no photos, and the page shows the missing-asset state listing both paths. No artwork is ever substituted.

To recreate them, use `../tools/prepare_mattes_uniform_bg.py` (plain uniform backgrounds) or `../tools/prepare_mattes.py` (opaque white-background photos). Provenance and limitations of the current pair are recorded in the main README.

**`data-align-black` in `../index.html` belongs to the current pair.** `prepare_mattes_uniform_bg.py` prints the value for a new pair; remove the attribute or replace it whenever the images change.

| File | Content |
| --- | --- |
| `nocta-hot-step-2-black.png` | Nike NOCTA Hot Step 2, **black** colourway, side view |
| `nocta-hot-step-2-white.png` | Nike NOCTA Hot Step 2, **white** colourway, side view, the same camera angle, orientation and lens as the black photo |
| `nocta-hot-step-2-orange.png` | Optional **orange** colourway (third in the cycle). Currently derived from the white with `../tools/recolor_colourway.py` (silver side plate kept) |
| `nocta-campaign.jpg` | Cover image, composed by `../tools/compose_campaign.py` |
| `nike-air-force-1-black.webp` | Line-up: Nike Air Force 1, **black**, side view, transparent cut-out |
| `nike-air-force-1-white.webp` | Line-up: Nike Air Force 1, **white**, side view, transparent cut-out |
| `nike-air-max-plus-white.webp` | Line-up: Nike Air Max Plus, **white**, side view, transparent cut-out |
| `nike-air-max-plus-black.webp` | Line-up: Nike Air Max Plus, **black**, side view, transparent cut-out |

The line-up cut-outs are made with `../tools/prepare_cutouts.py` from single images on a plain uniform background. Each card keeps its image's aspect ratio and every shoe gets the same length. They don't need to match each other's canvas or padding. The section lists the exact URL of any file that fails to load and shows no carousel.

## Requirements

- **Authentic product photos** of the Hot Step 2. Don't use renders of a different shoe or AI images.
- **A matched pair.** Toe pointing the same way, same camera height and angle, same lens. Different canvas sizes or padding are fine: the component fits each shoe by its opaque bounding box using one uniform scale.
- **Transparent background (PNG with alpha)** is strongly preferred. If you only have opaque photos, provide precise silhouette mattes. A colour key isn't used, because it would eat the black mesh or the white outsole.
- **Resolution:** at least 2000 px wide is recommended. Anything larger than 4096 px is downscaled once for the GPU, and the geometry always comes from `naturalWidth` and `naturalHeight`.
- **Usage rights:** you need the right to use these photos. Official Nike photography is copyrighted, so record the source and licence in the main `README.md` under *Image provenance*.

## Fine alignment (optional)

The two shoes are aligned automatically: same product width, same centre x, shared sole line. If the toe or heel still don't sit exactly on top of each other, nudge one photo on the frame element with translation and uniform scale only:

```html
<div class="nocta-reveal__frame" data-nocta-reveal
     data-align-white="0.002 -0.001 1.004">  <!-- dx dy scale; dx and dy are fractions of the product width -->
```
