# NOCTA / After Dark: WebGL fluid reveal (unofficial concept)

> **Unofficial design concept.** This isn't affiliated with, authorised by or endorsed by Nike, Inc. or NOCTA. Product names belong to their owners.

This is a single 100svh hero section for the Nike NOCTA Hot Step 2. At rest it shows the **black** colourway. Moving the pointer or a finger drives a BFECC stable-fluids simulation, which cuts temporary, flowing holes through which the **white** colourway shows. When you stop, the fluid dissipates back to black.

A click, tap, <kbd>Enter</kbd> or <kbd>Space</kbd> runs a curved, bottom-to-top wipe to white. Activating it again reverses the wipe.

It's plain HTML/CSS/JS with raw WebGL, has no dependencies and no build step, and makes no external runtime requests. It is fully separate from the WhatsApp receptionist service in this repository: nothing in `src/`, `test/`, the Dockerfile or CI depends on it.

## Status

| Item | State |
| --- | --- |
| Component, shaders, fallbacks, accessibility | Done. Verified in headless Chromium (see [Verification](#verification)) |
| Product photography | Real pair supplied by the project owner and matted locally (see [Image provenance](#image-provenance-and-licence)). **Not committed:** this repository is public and the photos are copyrighted, so `assets/*.png` is git-ignored. A fresh clone shows the missing-asset state. |
| Visual result with the real shoes | Reviewed on desktop and phone screenshots. Works, with the limitations listed under [Image provenance](#image-provenance-and-licence) |

## Run

ES modules need `http://`, not `file://`:

```bash
node nocta-after-dark/tests/serve.mjs 8080
```

Then open <http://127.0.0.1:8080/>. Any static server rooted at `nocta-after-dark/` also works.

## Files

```
nocta-after-dark/
  index.html                 minimal page: editorial title + the section
  styles.css                 section styles, all scoped under .nocta-reveal
  src/main.js                mounts the component on [data-nocta-reveal]
  src/nocta-fluid-reveal.js  component: lifecycle, input, idle sweep, wipe, modes, fallback, dispose
  src/fluid-simulation.js    multipass solver (advection, force, divergence, Poisson, projection)
  src/shaders.js             GLSL ES 1.00 for every pass + compositor (WebGL2, WebGL1 fallback)
  src/gl-utils.js            programs, float-format detection, render targets, textures, GL object tracking
  src/layout.js              pure rigid plane-fitting math
  assets/                    the two product PNGs go here (see assets/README.md; git-ignored)
  tools/prepare_mattes.py    reproducible silhouette mattes for opaque white-background photos
  tests/serve.mjs            dependency-free static server
  tests/verify.mjs           Playwright verification suite (179 checks; 207 with the real photos present)
  tests/fixtures.mjs         TEST-ONLY abstract silhouettes for measuring the mechanics
```

## Reuse

```html
<div class="nocta-reveal__frame" data-nocta-reveal data-mode="loading">
  <canvas class="nocta-reveal__canvas" role="img" aria-label="Nike NOCTA Hot Step 2 in black, side view"></canvas>
  <img class="nocta-reveal__photo nocta-reveal__photo--black" src="assets/nocta-hot-step-2-black.png" alt="Nike NOCTA Hot Step 2 in black, side view">
  <img class="nocta-reveal__photo nocta-reveal__photo--white" src="assets/nocta-hot-step-2-white.png" alt="Nike NOCTA Hot Step 2 in white, side view" hidden>
  <button type="button" class="nocta-reveal__toggle" aria-pressed="false" aria-label="Reveal white Nike NOCTA Hot Step 2" hidden></button>
  <p class="nocta-reveal__status" hidden></p>
</div>
```

```js
import { mountNoctaFluidReveal } from './src/nocta-fluid-reveal.js';
const reveal = mountNoctaFluidReveal(frameElement, { idle: true });
reveal.toggle();      // or reveal.toggle(true / false)
reveal.destroy();     // releases every GL object, observer and listener; the element can be mounted again
```

Missing child elements are created automatically. Options: `blackSrc`, `whiteSrc`, `blackAlt`, `whiteAlt`, `toggleLabel`, `maxPixelRatio` (default 1.5), `idle`, and `adjust: { black|white: { dx, dy, scale } }`. Equivalent `data-*` attributes also work.

## How the specification maps to the code

**Fluid**, in `fluid-simulation.js` and `shaders.js`:

- The simulation is `round(frame CSS size × .1)`, stepped at a fixed 60 Hz with `dt = .014`.
- Cell scale is `px = (1/110, simW/simH/110)`.
- Parameters: BFECC on, dissipation `.96`, `mouse_force 50`, `cursor_size 18`, straightness `1`, not viscous, 4 Poisson iterations.
- Buffers are RGBA16F, half float because it's filterable and blendable wherever it's renderable. They're zero-initialised, use `CLAMP_TO_EDGE`, and pressure is ping-ponged with a warm start.
- Each pass reads only from the source framebuffer, never from the one being written.
- After every simulation step, the main canvas framebuffer, program, vertex buffer and texture units are restored.

**Force:**

- `(current − old clip coords) / 2 × 50`, with shape `(1 − min(|(uv−.5)·2|, 1))²`.
- Additive `ONE, ONE` blending. The splat's half-size is `18 × px`, clamped inside the bounds.
- No force on the first sample of any pointer, touch or idle stream.

**Reveal:**

- Energy is `1 − color.r` of the source output shader, `mix(1, (v·.5+.5, 1), |v|)`, clamped as an 8-bit target would store it.
- The mask is `smoothstep(.085, .115, energy)`, and the same mask drives the subtle backdrop tint.
- Full wipe: `wave = uv.y + sin(uv.x·π)·sin(fullReveal·π)·.2`, mask `smoothstep(1−fR−.018, 1−fR+.018, wave)`, combined with `max`.
  - The wave is evaluated top-down so the wipe rises from the bottom.
  - One endpoint guard: the raw formula's soft edge lands on the frame border at `fR = 0` and `fR = 1`. It's faded out over the first and last 2% so the frame is exactly black at rest and exactly white when full.
- `fullReveal` follows a critically damped spring (about 1.2 s), so reversing it is continuous.

**Photos:**

- Each photo is an independent rigid plane: `naturalWidth × naturalHeight` times one uniform scale.
- Plane UVs are `((subjectPx − planeCenterPx) / planeSizePx) + .5`, and the whole image is sampled.
- `subjectPos = uv + (P − .5)·.008·(1 − fullReveal)`, a uniform translation.
- Both shoes are fitted by their opaque bounding box (sub-pixel refined from the alpha) to the same width, `≤ .86 W`, with a height cap for short frames.
  - The white box is centred at `(.5 W, .54 H)` in DOM coordinates. The black box shares that centre x and the white sole line.
  - Fine alignment is translation and uniform scale only. Nothing warps, bends or displaces photo pixels.

**Art direction:**

- Near-black `#050505` backdrop, a graphite falloff behind the shoe, and a faint near-white floor highlight under the sole.
- A restrained cool rim light separates the black colourway: a soft halo from a pre-blurred alpha map plus a thin top-edge highlight. It's additive light only.
- The only yellow is a tiny mark beside the title, outside the artwork. There's no text inside the artwork.

**Idle:**

- Starts after 2 s with no pointer input.
- Path: a cosine-eased figure-eight over the shoe. 2.5 s forward, 1.5 s hold, 2.5 s return, 3 s hold.
- Stops on the first real pointer or touch movement.
- Never runs offscreen, in a hidden tab, while white is toggled on, or with reduced motion.

**Input and accessibility:**

- One native, transparent, full-frame `<button>` with `aria-pressed`, a fixed accessible name, a visible `:focus-visible` outline and no nested controls.
- Pointer and touch listeners are all passive. `touch-action: manipulation` keeps vertical scrolling and pinch-zoom working.
- The canvas exposes `role="img"` with a label that follows the state.

**Lifecycle:**

- WebGL initialises when the section comes within 200 px of the viewport.
- The loop pauses offscreen or when the document is hidden, keeping textures and the context alive. The solver sleeps 240 steps after the last force.
- Context loss shows the static photo; on restore, the component rebuilds its resources.
- `destroy()` releases everything, and the tests confirm 0 GL objects remain.

**Fallbacks:**

- Without WebGL or renderable float buffers, the real black photo is shown as a static, accessible `<img>` with the same rigid geometry. The toggle still swaps to the white photo.
- Reduced motion uses the static mode: no fluid, idle or parallax, and the toggle switches instantly.

## Verification

```bash
node nocta-after-dark/tests/verify.mjs --out /tmp/nocta-verify
```

This needs Playwright with Chromium. It uses SwiftShader, so it runs without a GPU. It writes `report.json` and screenshots to `--out`.

The mechanics are measured with **test-only abstract silhouettes** (`tests/fixtures.mjs`). They aren't shoes; they have known colours and geometry, and they deliberately use different canvas sizes and padding for black and white. They're served only through Playwright route interception and never shipped.

Rendering under SwiftShader is slow, so a debug-only `lockstep` query parameter steps exactly one 60 Hz tick per frame. That way the tests measure simulation time rather than wall-clock time. Production timing is unchanged.

Last run: **207 / 207 checks passed** with the real photos present (**179 / 179** on a fresh clone, where the real-photo section checks the missing-asset state instead), in headless Chromium 1440×1000, 390×844 (iPhone UA, touch, DPR 3), 820×1180 (iPad UA, touch, DPR 2), and resizes to 1024×700, 600×900 and 1920×600. Covered:

- Natural aspect ratio of both planes and of the rendered silhouette at every size. The black and white stand-in silhouettes coincide within 2 px.
- Real photos: both load into the WebGL path with real transparency; heel, toe and sole line coincide exactly (desktop and phone); the silhouette height difference (tongue/laces) is 0.75 %.
- Canvas size is `CSS × min(DPR, 1.5)`. Simulation size and cell scale match the spec.
- Black at rest. The pointer reveals white partially.
- The velocity field holds a balanced vortex pair (curl of both signs). The revealed shape keeps advecting after the pointer stops (IoU 0.26 after 12 steps), which a cursor spotlight wouldn't do. Velocity decays monotonically and the frame dissipates fully back to black.
- The wipe runs bottom-to-top and reverses mid-flight with no per-frame jump (max change 0.025).
- Keyboard (<kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>) and the visible focus ring. Touch drag reveals without toggling; a tap toggles. A vertical touch drag over the artwork scrolls the page, and every listener is passive.
- Idle starts at about 2 s and stops on pointer input. The loop pauses offscreen and in a hidden tab.
- Reduced motion, including a preference change at runtime.
- No-WebGL and no-float-buffer fallbacks. Context loss and restore.
- `destroy()` leaves 0 GL objects, and the component remounts afterwards.
- No overflow, page errors, console errors, failed requests or external requests.
- The missing-asset state names both files and shows no reveal control.

**Not verified (assumptions):**

- Real GPUs and Safari/WebKit. Only Chromium with SwiftShader was run.
- Real-device frame rate.
- The look of the real pair was judged by eye from screenshots (desktop 1440×1000 and phone), not measured.

## Image provenance and licence

Both photos were **supplied by the project owner** in this session. Neither file carries source or licence metadata, and nothing was downloaded, generated or substituted.

| File | Supplied as | Content |
| --- | --- | --- |
| `nocta-hot-step-2-black.png` | `DZ7293-001.jxl`, JPEG XL, 1200×1200, opaque white background | Black colourway (style code DZ7293-001), lateral side view, toe right |
| `nocta-hot-step-2-white.png` | pasted image, WebP, 600×316, opaque white background, heavily compressed (9.7 KB) | White colourway, lateral side view, toe right |

These are Nike product photographs and are presumably copyrighted. They're used here only for an unofficial design concept, and the owner is responsible for having the right to use them. Because this repository is **public**, the PNGs are git-ignored and haven't been committed.

**How the transparent PNGs were made** (`tools/prepare_mattes.py`, reproducible byte for byte):

- **Black:** the background is the near-white region connected to the image border. The soft grey contact shadow under the sole is removed per column below the lowest dark rubber pixel, and the bright details enclosed by dark material (air-unit highlights, mesh window) are kept. A 2 px edge band is solved with closed-form matting, and the edge colours are decontaminated so no white fringe glows on the dark page. Padding is added to the canvas for the rim-light halo; nothing is resampled.
- **White:** white on white has no reliable edge signal, and this source is low resolution with visible WebP blocks. The matte is solved on a uniform 2× Lanczos upscale, which keeps proportions and adds no detail. The black silhouette is registered onto it with one uniform scale and a translation, using the heel, toe and collar top. That registered silhouette decides the edge band; the white's own alpha is kept only where it clearly extends past it with contrast (tongue/laces). The cast shadow under the sole and the background rows below the white outsole's crease line are removed. The silhouette agreement before the sole trim is IoU 0.969.

**Limitations of this pair:**

1. The white photo has half the resolution of the black one. At 1440 px it's shown at roughly 0.9× of its 2× upscale, so it looks softer than the black.
2. The two photos weren't shot with exactly the same camera setup. With heel, toe and sole aligned as specified, interior details of the white sit about 8 px further toward the toe at 1440 px; the mesh window is the measured reference. Uniform scale and translation can't remove a perspective difference.
3. A white-on-white edge can't be recovered from the photo, so parts of the white outline follow the black photo's silhouette of the same shoe.

A **matched pair from the same source** would fix all three: for example the same retailer's white DZ7293-100 listing at 1200×1200 or larger, shot with the same setup as `DZ7293-001`, ideally already transparent.

## Outstanding issues

1. **Decide on publishing the photos.** They're local and git-ignored. Committing them would republish copyrighted product photos in a public repository.
2. **Replace the white photo with a matched, higher-resolution one** (see the limitations above), then run `tools/prepare_mattes.py` and `tests/verify.mjs` again.
3. Test on physical iOS Safari and Android Chrome. `EXT_color_buffer_float` or `EXT_color_buffer_half_float` is required; otherwise the static fallback is used.
