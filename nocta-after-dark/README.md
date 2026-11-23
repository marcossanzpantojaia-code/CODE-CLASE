# Nike NOCTA · After Dark: scroll cover + WebGL fluid reveal (unofficial concept)

> **Unofficial design concept.** This isn't affiliated with, authorised by or endorsed by Nike, Inc. or NOCTA. Product names belong to their owners.

A two-section campaign page for the Nike NOCTA Hot Step 2:

1. **Cover:** a pinned, full-bleed dark campaign image. As you scroll down, one enormous single-line headline, **NIKE NOCTA**, sweeps from fully offscreen right to fully offscreen left; scrolling up reverses it. It's scroll-scrubbed: no autoplay, no scroll hijacking. After the sweep the pin releases into the next section.
2. **After Dark:** a 100svh hero that cycles three colourways: **black → white → orange → black**. At rest it shows the current one (black on arrival). Moving the pointer or a finger drives a BFECC stable-fluids simulation, which cuts temporary, flowing holes through which the **next** colourway shows. When you stop, the fluid dissipates back to the current one.

A click, tap, <kbd>Enter</kbd> or <kbd>Space</kbd> runs a curved, bottom-to-top wipe to the next colourway. Activations during a wipe are queued, so a quick double click lands two colourways on.

It's plain HTML/CSS/JS with raw WebGL, has no dependencies and no build step, and makes no external runtime requests. It is fully separate from the WhatsApp receptionist service in this repository: nothing in `src/`, `test/`, the Dockerfile or CI depends on it.

## Status

| Item | State |
| --- | --- |
| Cover, fluid reveal, fallbacks, accessibility | Done. Verified in headless Chromium (see [Verification](#verification)) |
| Product images | **AI-generated renders** made by the project owner from the real product photos, matted locally (see [Image provenance](#image-provenance-and-licence)). **Not committed:** this repository is public and the images depict a copyrighted, trademarked product, so `assets/*.png` is git-ignored. A fresh clone shows the missing-asset state. |
| Visual result | Reviewed on desktop and phone screenshots. Works, with the limitations listed under [Image provenance](#image-provenance-and-licence) |

## Run

ES modules need `http://`, not `file://`:

```bash
node nocta-after-dark/tests/serve.mjs 8080
```

Then open <http://127.0.0.1:8080/>. Any static server rooted at `nocta-after-dark/` also works.

## Files

```
nocta-after-dark/
  index.html                 the page: scroll cover, then the fluid reveal section (#after-dark)
  styles.css                 scoped styles (.nocta-sweep, .nocta-reveal) + @font-face Anton
  src/main.js                mounts the cover on [data-nocta-sweep] and the reveal on [data-nocta-reveal]
  src/nocta-scroll-headline.js  cover component: measured scroll-scrubbed headline sweep
  src/nocta-fluid-reveal.js  component: lifecycle, input, idle sweep, wipe, modes, fallback, dispose
  src/fluid-simulation.js    multipass solver (advection, force, divergence, Poisson, projection)
  src/shaders.js             GLSL ES 1.00 for every pass + compositor (WebGL2, WebGL1 fallback)
  src/gl-utils.js            programs, float-format detection, render targets, textures, GL object tracking
  src/layout.js              pure rigid plane-fitting math
  assets/                    product PNGs + nocta-campaign.jpg (see assets/README.md; git-ignored)
  assets/fonts/anton.ttf     Anton, self-hosted, with assets/fonts/Anton-OFL.txt (SIL OFL 1.1)
  tools/compose_campaign.py  builds the cover image from the black cut-out (dark set + subtle orange camouflage touches)
  tools/recolor_colourway.py derives the orange colourway from the white cut-out, keeping the silver side plate
  tools/prepare_mattes.py    mattes for opaque white-background photos (the first, photographic pair)
  tools/prepare_mattes_uniform_bg.py  mattes + rigid registration for a pair on plain uniform backgrounds; prints data-align-black
  tests/serve.mjs            dependency-free static server
  tests/verify.mjs           Playwright verification suite (290 checks; 318 with the images present)
  tests/fixtures.mjs         TEST-ONLY abstract silhouettes for measuring the mechanics
```

## Reuse

```html
<div class="nocta-reveal__frame" data-nocta-reveal data-mode="loading">
  <canvas class="nocta-reveal__canvas" role="img" aria-label="Nike NOCTA Hot Step 2 in black, side view"></canvas>
  <img class="nocta-reveal__photo nocta-reveal__photo--black" src="assets/nocta-hot-step-2-black.png" alt="Nike NOCTA Hot Step 2 in black, side view">
  <img class="nocta-reveal__photo nocta-reveal__photo--white" src="assets/nocta-hot-step-2-white.png" alt="Nike NOCTA Hot Step 2 in white, side view" hidden>
  <img class="nocta-reveal__photo nocta-reveal__photo--orange" src="assets/nocta-hot-step-2-orange.png" alt="Nike NOCTA Hot Step 2 in orange with a silver side plate, side view" hidden>
  <button type="button" class="nocta-reveal__toggle" aria-label="Reveal white Nike NOCTA Hot Step 2" hidden></button>
  <p class="nocta-reveal__status" hidden></p>
</div>
```

```js
import { mountNoctaFluidReveal } from './src/nocta-fluid-reveal.js';
const reveal = mountNoctaFluidReveal(frameElement, { idle: true });
reveal.advance();     // next colourway (toggle() is an alias); queued while a wipe runs
reveal.state;         // { mode, colourway, destination }
reveal.destroy();     // releases every GL object, observer and listener; the element can be mounted again
```

Missing child elements are created automatically. Options: `blackSrc`, `whiteSrc`, `orangeSrc`, `blackAlt`, `whiteAlt`, `orangeAlt`, `maxPixelRatio` (default 1.5), `idle`, and `adjust: { black|white|orange: { dx, dy, scale } }`. Equivalent `data-*` attributes also work. The orange is optional: if its file is missing, a console warning names it and the cycle runs black ↔ white.

### Cover (scroll headline)

```html
<section class="nocta-sweep" aria-labelledby="sweep-title" data-nocta-sweep>
  <a class="nocta-sweep__skip" href="#next-section">Skip animation</a>
  <div class="nocta-sweep__runway">
    <div class="nocta-sweep__frame">
      <img class="nocta-sweep__image" src="assets/nocta-campaign.jpg" alt="…">
      <h1 class="nocta-sweep__headline" id="sweep-title">Nike NOCTA</h1>
    </div>
  </div>
</section>
```

```js
import { mountScrollHeadline } from './src/nocta-scroll-headline.js';
const cover = mountScrollHeadline(sectionElement, {
  headline: 'Nike NOCTA', image: 'assets/nocta-campaign.jpg', alt: '…',
  textColor: '#f2efe8', background: '#050505', scrollLength: '400svh',
});
cover.destroy(); // cancels the pending frame, removes the scroll listener and observers
```

Every option is optional: the markup wins when one is omitted. CSS custom properties `--sweep-text`, `--sweep-bg` and `--sweep-runway` do the same from a stylesheet. Several instances can live on one page.

## How the specification maps to the code

**Cover**, in `nocta-scroll-headline.js` and `styles.css`:

- The outer section keeps `overflow: visible`. The 400svh runway holds a `position: sticky; top: 0; height: 100svh` frame with `overflow: hidden`.
- The image is `absolute; inset: 0; object-fit: cover`. The headline is `absolute; left: 0; top: 50%; width: max-content`, Anton, uppercase, `line-height: 1`, `white-space: nowrap`, `font-size: clamp(115px, 30vw, 500px)`, cream `#f2efe8` on `#050505`. Only the headline moves.
- Geometry, with no easing: `V = frame.clientWidth`, `T = headline.offsetWidth`, `D = runway.offsetHeight − frame.clientHeight`, `p = clamp(−runway.getBoundingClientRect().top / D, 0, 1)`, `x = V − p·(V + T)`, applied as `translate3d(x px, −50%, 0)`.
- It measures again after `document.fonts.ready`, after the image loads, and on `ResizeObserver` changes to the frame, headline and runway.
- A passive `scroll` listener schedules at most one `requestAnimationFrame`. That listener only exists while the runway is near the viewport (an `IntersectionObserver` adds and removes it), so there's no permanent global listener. Native scrolling throughout: no wheel or touch interception.
- Reduced motion (and no JS): the runway collapses to one viewport, nothing is pinned or moves, and the entire headline is centred at `clamp(26px, 10vw, 140px)`.
- A keyboard-focusable **Skip animation** link appears on focus and jumps (and moves focus) to `#after-dark`. If the campaign image fails, it's hidden instead of showing a broken icon; the headline still works.
- When the fluid section comes into view after the cover, its idle sweep waits 2 s from that moment, not from page load.

**Fluid reveal**, in `fluid-simulation.js` and `shaders.js`:

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
- `fullReveal` follows a critically damped spring (about 1.2 s). At its end, the next colourway becomes the base with no visible change: the frame already shows only that colourway, the backdrop lift follows a per-colourway level (black 0, white 1, orange 0.85), the parallax factor eases back in instead of jumping, and the fluid (hidden under a full mask) is cleared.
- The base/next pair is generic in the compositor (`uBase`/`uNext`); the halo always comes from the black photo's silhouette.

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
- Only runs on the black colourway at rest. Never runs offscreen, in a hidden tab, during a wipe, or with reduced motion.

**Input and accessibility:**

- One native, transparent, full-frame `<button>` with a visible `:focus-visible` outline and no nested controls. A three-state cycle isn't an on/off toggle, so it has no `aria-pressed`: its accessible name says what comes next ("Reveal orange Nike NOCTA Hot Step 2"), and the canvas's `role="img"` label names the colourway shown.
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

Last run: **318 / 318 checks passed** with the images present (**290 / 290** on a fresh clone, where the real-image section checks the missing-asset state instead), in headless Chromium 1440×1000, 390×844 (iPhone UA, touch, DPR 3), 820×1180 (iPad UA, touch, DPR 2), and resizes to 1024×700, 600×900 and 1920×600. Covered:

- **Cover:** Anton is self-hosted and loaded. The runway is 400svh with a sticky 100svh frame. The image is cover-fitted with alt text, and the headline is a real `h1`.
- **Cover progress:** at 0/25/50/75/100 %, x = V − p(V + T) within 1.5 px, decreasing monotonically and reversing exactly on scroll-up. The first glyph starts just beyond the right edge and the last ends just beyond the left. The headline is vertically centred, stays on a single line, and its font-size equals `clamp(115px, 30vw, 500px)`. The frame stays pinned mid-sweep and releases into the next section, with no horizontal overflow.
- **Cover input and modes:** real touch scrolling on phone and tablet and mouse-wheel scrolling on desktop drive the sweep. Reduced motion collapses it to one viewport with the whole headline centred and no motion. The first Tab reaches **Skip animation**, which jumps to and focuses `#after-dark`. Two instances keep independent progress, and `destroy()` stops further updates.

- Natural aspect ratio of both planes and of the rendered silhouette at every size. The black and white stand-in silhouettes coincide within 2 px.
- Real images: both load into the WebGL path with real transparency; with the rigid `data-align-black` registration, heel, toe and sole line stay within 4.3 px of each other at 1440 px (limit 1.5 % of the product width) and the height difference is 0.18 %, on desktop and phone.
- Canvas size is `CSS × min(DPR, 1.5)`. Simulation size and cell scale match the spec.
- Black at rest. The pointer reveals white partially.
- The velocity field holds a balanced vortex pair (curl of both signs). The revealed shape keeps advecting after the pointer stops (IoU 0.26 after 12 steps), which a cursor spotlight wouldn't do. Velocity decays monotonically and the frame dissipates fully back to black.
- The cycle: black → white → orange → black, with the button label always naming the next one. Each wipe runs bottom-to-top. On white, the fluid reveals the orange, and the orange silhouette coincides with the white within 1 px. Activations during a wipe are queued with no per-frame jump. Reduced motion and the fallbacks switch instantly, and a missing orange file falls back to a black ↔ white cycle with a warning.
- Keyboard (<kbd>Tab</kbd>, <kbd>Enter</kbd>, <kbd>Space</kbd>) and the visible focus ring. Touch drag reveals without advancing; each tap advances. A vertical touch drag over the artwork scrolls the page, and every listener is passive.
- Idle starts at about 2 s and stops on pointer input. The loop pauses offscreen and in a hidden tab.
- Reduced motion, including a preference change at runtime.
- No-WebGL and no-float-buffer fallbacks. Context loss and restore.
- `destroy()` leaves 0 GL objects, and the component remounts afterwards.
- No overflow, page errors, console errors, failed requests or external requests.
- The missing-asset state names both files and shows no reveal control.

**Not verified (assumptions):**

- Real GPUs and Safari/WebKit. Only Chromium with SwiftShader was run.
- Real-device frame rate.
- The look of the image pair was judged by eye from screenshots (desktop 1440×1000 and phone), not measured.

## Image provenance and licence

**Font:** Anton Regular, © 2020 The Anton Project Authors, SIL Open Font License 1.1. It was downloaded from the URLs supplied with the cover prompt (`thepromptsfactory.com/.../anton.ttf` and `Anton-OFL.txt`), checked (TrueType signature, family "Anton Regular") and self-hosted in `assets/fonts/` together with its licence. It's committed: the OFL allows redistribution with the licence.

**Cover image:** `assets/nocta-campaign.jpg` (2560×1440) is composed by `tools/compose_campaign.py` from the black product render below: a dark set, a cool key light, a silhouette halo and a faint mirrored floor reflection, plus a few **subtle orange camouflage touches**. These are procedural, few and large, low opacity, and weighted toward the edges and corners so the shoe and headline keep a clean field. It uses a uniform scale and a flip only.

**Orange colourway:** `assets/nocta-hot-step-2-orange.png` is **derived** by `tools/recolor_colourway.py` from the white render with a luminance gradient map (deep shadow → total orange → warm specular). Pixels and alpha don't move, so it has exactly the white's geometry. The side plate (mesh window and chrome swoosh) is detected as the largest compact dark region and kept **silver**, as on the real colourway. It's a derived render, not a photograph, and it's git-ignored. The prompt's example artwork `zest-citrus.png` wasn't used or downloaded, because the project's own brand imagery takes precedence. It's git-ignored like the product images.

**Product images:** the images in use are **AI-generated renders, not photographs.** The project owner made them with an image-generation tool, starting from aligned reference images built from the real product photos below, and supplied them in this session as WebP: black 1728×910 on plain grey #a8a8a8, white 1672×941 on plain grey #777777. They aren't authentic product photography (the original brief asked for that), and details such as the embossed ribs, laces and outsole accents are the model's rendering, not Nike's product. Treat them as a design concept only.

**Pipeline** (`tools/prepare_mattes_uniform_bg.py`):

- Each background is the median border colour. A 2 px edge band is solved with closed-form matting, and the grey is removed from the edge colours.
- The black gets transparent padding for the rim-light halo. Nothing is resampled.
- The two silhouettes are registered with one uniform scale and a translation, using least squares on the masks: IoU 0.977, median edge distance 3.6 px.
- That registration is reproduced exactly by `data-align-black="-0.00104 -0.00351 1.00586"` on the frame element. **The value belongs to this pair:** recompute it with the tool whenever the images change.
- Interior details overlap closely (mesh window, air unit, midsole panels). Some embossed ribs and laces are drawn slightly differently in the two renders.

**Earlier photographic pair** (superseded, kept for the record): `DZ7293-001.jxl`, the black, 1200×1200, and a pasted 600×316 WebP of the white, both opaque white-background Nike product photos supplied by the owner without source or licence metadata. They were matted with `tools/prepare_mattes.py`. The white was too low-resolution, and the two weren't shot with the same setup.

Nike and NOCTA product designs and marks belong to their owners. This is an unofficial concept, and the owner is responsible for the right to use the source images. Because this repository is **public**, the images are git-ignored and haven't been committed.

## Outstanding issues

1. **Decide on publishing the images.** They're local and git-ignored; committing them would publish renders of a trademarked product in a public repository.
2. For authentic photography instead of AI renders, use a matched high-resolution pair from one source, then run the matching tool and `tests/verify.mjs` again.
3. Test on physical iOS Safari and Android Chrome. `EXT_color_buffer_float` or `EXT_color_buffer_half_float` is required; otherwise the static fallback is used.
