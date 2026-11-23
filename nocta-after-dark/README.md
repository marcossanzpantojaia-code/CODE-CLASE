# NOCTA / After Dark: WebGL fluid reveal (unofficial concept)

> **Unofficial design concept.** This isn't affiliated with, authorised by or endorsed by Nike, Inc. or NOCTA. Product names belong to their owners.

This is a single 100svh hero section for the Nike NOCTA Hot Step 2. At rest it shows the **black** colourway. Moving the pointer or a finger drives a BFECC stable-fluids simulation, which cuts temporary, flowing holes through which the **white** colourway shows. When you stop, the fluid dissipates back to black.

A click, tap, <kbd>Enter</kbd> or <kbd>Space</kbd> runs a curved, bottom-to-top wipe to white. Activating it again reverses the wipe.

It's plain HTML/CSS/JS with raw WebGL, has no dependencies and no build step, and makes no external runtime requests. It is fully separate from the WhatsApp receptionist service in this repository: nothing in `src/`, `test/`, the Dockerfile or CI depends on it.

## Status

| Item | State |
| --- | --- |
| Component, shaders, fallbacks, accessibility | Done. Verified in headless Chromium (see [Verification](#verification)) |
| Product photography | **Missing.** See [`assets/README.md`](assets/README.md). The page reports this; it never shows placeholders. |
| Visual result with the real shoes | **Not verified** until the matched PNG pair is added |

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
  assets/                    the two product PNGs go here (see assets/README.md)
  tests/serve.mjs            dependency-free static server
  tests/verify.mjs           Playwright verification suite (179 checks)
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

Last run: **179 / 179 checks passed** in headless Chromium 1440×1000, 390×844 (iPhone UA, touch, DPR 3), 820×1180 (iPad UA, touch, DPR 2), and resizes to 1024×700, 600×900 and 1920×600. Covered:

- Natural aspect ratio of both planes and of the rendered silhouette at every size. The black and white silhouettes coincide within 2 px.
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
- How the effect looks with the actual Hot Step 2 photos.

## Image provenance and licence

None yet. The repository contains **no product photography**: none was downloaded, generated or substituted. Official Nike/NOCTA imagery is copyrighted, and no licensed matched pair was available to this build. When you add the pair, record here where it came from and the terms that allow its use.

## Outstanding issues

1. **Add the matched black/white PNG pair** (`assets/README.md`), then rerun `verify.mjs`. The *Real product photography* section switches from the missing-asset check to transparency, geometry and screenshot checks.
2. **Review the alignment of the real pair** (toe, heel, sole, collar) in `real-rest.png` and `real-white.png`, and tune `data-align-*` if needed. Also tune the rim-light strength (`shaders.js`, `blackComp` terms) against the real black mesh.
3. Test on physical iOS Safari and Android Chrome. `EXT_color_buffer_float` or `EXT_color_buffer_half_float` is required; otherwise the static fallback is used.
