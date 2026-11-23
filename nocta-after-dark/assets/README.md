# Required product photography

The two PNGs are **git-ignored** (see `../.gitignore`): the repository is public and the photos are copyrighted Nike product shots. A fresh clone therefore has no photos, and the page shows the missing-asset state listing both paths. No artwork is ever substituted.

To recreate them from opaque white-background originals, use `../tools/prepare_mattes.py`. Provenance and limitations of the current pair are recorded in the main README.

| File | Content |
| --- | --- |
| `nocta-hot-step-2-black.png` | Nike NOCTA Hot Step 2, **black** colourway, side view |
| `nocta-hot-step-2-white.png` | Nike NOCTA Hot Step 2, **white** colourway, side view, the same camera angle, orientation and lens as the black photo |

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
