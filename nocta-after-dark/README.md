# Nike line-up: 3D carousel home + NOCTA, Air Force 1 and Air Max Plus pages (unofficial concept)

> **Unofficial design concept.** This isn't affiliated with, authorised by or endorsed by Nike, Inc. or NOCTA. Product names belong to their owners.

A small campaign site:

- **Home: the line-up.** A 100svh carousel on a dark charcoal stage. Six shoes float as rigid cut-out cards in a 3D wave: the NOCTA Hot Step 2, the Air Force 1 and the Air Max Plus (TN), each in black and white. It follows the 3D product-carousel spec: 24 clones, a 4.5 s opening, damped easing and snapping, drag with throw, horizontal wheel, arrow keys, previous/next, dots, pause and replay. It's CSS 3D, with no WebGL or library (see [Line-up carousel](#line-up-carousel-3d-wave)).
- **Line-up details:** an info panel shows the count (01 / 06), the model name, the colourway and a **Discover** button for the centre shoe. A giant outline of the model name (NOCTA, AF1, TN) sits behind the wave, and a "drag, swipe or click a shoe" hint fades once you move.
- **Opening a shoe.** Click or tap the shoe in the centre, or use **Discover**. A neighbour glides into the centre and then opens (at once under reduced motion); any other input before it arrives cancels that. The line-up zooms into the shoe and fades through black (a view transition; none under reduced motion).
- **Site chrome, on every view:**
  - A fixed **header** with the Line-up brand, the shoe navigation (NOCTA · Air Force 1 · TN, with the current page marked), a **Line-up** back button on product pages and a skip link. It hides while you scroll down and returns when you scroll up or focus it.
  - A **footer** with the same links, **Back to top** and the disclaimer.
  - Browser Back and Forward work too. Coming home keeps the selection.
- **Each product page** has the same two parts, the ones built first for NOCTA:
  1. **Cover:** a pinned, full-bleed dark campaign image. As you scroll down, one enormous single-line headline (**NIKE NOCTA**, **NIKE AIR FORCE 1** or **NIKE TN**) sweeps from fully offscreen right to fully offscreen left; scrolling up reverses it. It's scroll-scrubbed: no autoplay, no scroll hijacking. After the sweep the pin releases into the next section.
  2. **Colourway reveal:** a 100svh WebGL hero. At rest it shows the colourway that was clicked in the line-up. Moving the pointer or a finger drives a BFECC stable-fluids simulation, which cuts temporary, flowing holes through which the **next** colourway shows; when you stop, the fluid dissipates back. A click, tap, <kbd>Enter</kbd> or <kbd>Space</kbd> runs a curved, bottom-to-top wipe to the next colourway, and activations during a wipe are queued. The cycle is black → white → orange for NOCTA (*After Dark*), and black ↔ white for the Air Force 1 (*Since ’82*) and the Air Max Plus (*Tuned Air*). **Colourway swatches** in the title row jump to a colourway: they queue the wipes it takes. A quiet hint in the frame explains move/click (drag/tap on touch).
  3. **Details:** an eyebrow, a heading, a short text and a spec list (first release, designer, cushioning, the colourways here). It has two buttons, **Back to the line-up** and **Next: …**.
  4. **Shoe cards:** large *Previous shoe* / *Next shoe* cards with the cut-out. The order wraps around: NOCTA → Air Force 1 → TN → NOCTA.

  The facts in the copy are the commonly published ones: the Air Force 1 is from 1982, by Bruce Kilgore, the first basketball shoe with Nike Air; the Air Max Plus is from 1998, by Sean McDowell, with Tuned Air, hence "TN". NOCTA is Drake's line with Nike. No dates or tech claims are made for the Hot Step 2.

**Pages and URLs.** It's one HTML page with hash routes, so any static server works without server-side routing:

| URL | Page |
| --- | --- |
| `#/` (or none) | the line-up |
| `#/nocta`, `#/air-force-1`, `#/air-max-plus` | a product page, black at rest |
| `…/white`, `…/orange` | the same page with that colourway at rest (the line-up links use these) |

Each product page is cloned from its `<template>` when you arrive and destroyed when you leave, which releases every GL object. Any other hash, such as the skip link's `#after-dark`, is an ordinary in-page anchor. An unknown route shows the line-up.

It's plain HTML/CSS/JS with raw WebGL, has no dependencies and no build step, and makes no external runtime requests. It is fully separate from the WhatsApp receptionist service in this repository: nothing in `src/`, `test/`, the Dockerfile or CI depends on it.

## Status

| Item | State |
| --- | --- |
| Line-up home, three product pages, routing, fallbacks, accessibility | Done. Verified in headless Chromium (see [Verification](#verification)) |
| Product images | Supplied by the project owner (the NOCTA pair are **AI-generated renders**), matted locally (see [Image provenance](#image-provenance-and-licence)). **Not committed:** this repository is public and the images depict copyrighted, trademarked products, so `assets/*.png` and `assets/*.webp` are git-ignored. A fresh clone shows the missing-asset state. |
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
  index.html                 header, the line-up home (#line-up), footer, and one <template> per product page
                             (cover, reveal with swatches, details, shoe cards)
  styles.css                 scoped styles (.nocta-lineup, .nocta-sweep, .nocta-reveal, .site-*, .nocta-details, .nocta-pager)
  src/main.js                hash router + site chrome: header state, line-up info panel, swatches, page lifecycle
  src/nocta-scroll-headline.js  cover component: measured scroll-scrubbed headline sweep
  src/nocta-shoe-carousel.js line-up component: CSS 3D wave, opening timeline, input, raycast, a11y, dispose
  src/nocta-fluid-reveal.js  component: lifecycle, input, idle sweep, wipe, modes, fallback, dispose
  src/fluid-simulation.js    multipass solver (advection, force, divergence, Poisson, projection)
  src/shaders.js             GLSL ES 1.00 for every pass + compositor (WebGL2, WebGL1 fallback)
  src/gl-utils.js            programs, float-format detection, render targets, textures, GL object tracking
  src/layout.js              pure rigid plane-fitting math
  assets/                    reveal PNG pairs, line-up WebP cut-outs, cover JPGs (see assets/README.md; git-ignored)
  assets/fonts/anton.ttf     Anton, self-hosted, with assets/fonts/Anton-OFL.txt (SIL OFL 1.1)
  tools/compose_campaign.py  builds a cover image from a black cut-out (dark set; NOCTA adds subtle orange camouflage touches)
  tools/recolor_colourway.py derives the orange colourway from the white cut-out, keeping the silver side plate
  tools/prepare_mattes.py    mattes for opaque white-background photos (the first, photographic pair)
  tools/prepare_mattes_uniform_bg.py  mattes + rigid registration for a pair on plain uniform backgrounds; prints data-align-black
  tools/prepare_cutouts.py   WebP cut-outs for the line-up: from plain-background images, or from existing transparent PNGs
  tools/make_thumbs.py       480 px WebP thumbnails of the black cut-outs for the shoe cards
  tests/serve.mjs            dependency-free static server
  tests/verify.mjs           Playwright verification suite (510 checks; 574 with the images present)
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

### Line-up carousel (3D wave)

```html
<section class="nocta-lineup" id="line-up" tabindex="-1" aria-roledescription="carousel" aria-label="…" data-nocta-lineup data-mode="loading">
  <ul class="nocta-lineup__items">            <!-- the source of truth: one <img> per shoe, in order -->
    <li data-href="#/air-force-1/black"><img src="assets/nike-air-force-1-black.webp" alt="Nike Air Force 1 in black, side view"></li>
    …
  </ul>
  <div class="nocta-lineup__viewport" aria-hidden="true"><div class="nocta-lineup__stage"></div></div>
  <a class="nocta-lineup__open" hidden></a>  <!-- optional: keyboard link to the centre shoe's data-href -->
  <div class="nocta-lineup__controls" hidden>  <!-- previous, dots (filled by JS), next, pause, replay -->
    <button type="button" class="nocta-lineup__button" data-action="previous" aria-label="Previous shoe">…</button>
    <div class="nocta-lineup__dots" role="group" aria-label="Choose a shoe"></div>
    <button type="button" class="nocta-lineup__button" data-action="next" aria-label="Next shoe">…</button>
    <button type="button" class="nocta-lineup__button" data-action="pause" aria-label="Pause animation" aria-pressed="false">…</button>
    <button type="button" class="nocta-lineup__button" data-action="replay" aria-label="Replay intro">…</button>
  </div>
  <p class="nocta-lineup__sr nocta-lineup__live" aria-live="polite" aria-atomic="true"></p>
  <p class="nocta-lineup__status" hidden></p>
</section>
```

```js
import { mountShoeCarousel } from './src/nocta-shoe-carousel.js';
const lineup = mountShoeCarousel(sectionElement, {
  onOpen: ({ href }) => router.go(href), // default: location.assign(href)
  onSelect: ({ index, href, alt, element }) => updateInfoPanel(element.dataset), // on every selection change
  openNeighbours: true, // a clicked neighbour glides into the centre, then opens
});
lineup.next(); lineup.previous(); lineup.select(2);  // the dots use select(): shortest wrapped route
lineup.open();                                       // what a click on the centre shoe does
lineup.pause(); lineup.resume(); lineup.replay();
lineup.destroy();  // cancels the frame, removes listeners, observers, clones and dots; can be mounted again
```

Without JS the list shows as a plain grid of the four cut-outs. With JS the list stays available to assistive technology only (each image keeps its name), the 3D stage shows decorative clones, and the live region announces the selected shoe when, and only when, its index changes. If any image fails to load, the section shows the exact failing URL and no carousel: nothing is substituted.

**How the carousel spec maps to the code** (`src/nocta-shoe-carousel.js`):

- **Camera:** FOV 20°, at z 29, ×1.08 when the aspect is below 0.8. CSS `perspective` is set to the focal length f = (H/2)/tan(10°). World units become pixels with k = f / cameraZ: `translate3d(x·k, −y·k, z·k)`, and the spec's Euler XYZ maps to `rotateX(−pitch) rotateY(yaw) rotateZ(−roll)`. The tests check that every card's CSS bounding box lands on the world projection within 1 px (measured: 0 px).
- **Wave:** 24 clones (6 × 4 shoes), spacing 3.5, x = wrap(i·3.5 − position, −42, 42), ratio = clamp(1440/sectionWidth, 1, 2.4). At rest: position (x, sin(x·0.25·ratio), −|x| − 0.2), pitch −π/9, roll π/16, scale 1.2. Centre influence = clamp(1 − |x|/3.5, 0, 1). The smoothed pointer adds x/1280·0.2·influence to yaw and y/1280·0.2·influence to pitch.
- **Opening (4.5 s):** power4Out(p) = 1 − (1 − p)^5, q = power4Out((t − 2)/2.5), spacing lerp(10, 1, q), wave = q, entrance spin π/9·(1 − q)·influence, camera z lerp(25, 29, power4Out((t − 1)/2.5)). Light rises 0 → 30 with power4Out(t/2.5), then toward 50 via q; each spotlight gets half, with a cone of π/4·(2 − q). It starts when at least half the section has been in view.
- **Lighting:** the two spotlights at (0, 3.5, 0)→(0, 0, 1) and (0, −3, 2)→(0, 0, 1.8) are evaluated per card with three.js's cone (penumbra 1) and distance attenuation (distance 8, decay 0.1). They act on the card's front-face normal and become a CSS `brightness()`, on top of a 0.74 ambient level that stands in for the environment map. The centre shoe ends at 1.0; shoes outside the cones stay at 0.74.
- **Motion and input:** damping 1 − exp(−10·dt), with dt capped at 0.05 s. When not dragging, the target snaps to round(target/3.5)·3.5. A drag subtracts Δx·0.02. A release within 100 ms of the last move adds −lastΔx·0.16. A horizontal gesture is detected after 8 px, and `touch-action: pan-y pinch-zoom` keeps native vertical panning. Previous/next, ←/→, the wheel (280 ms throttle) and clicking a neighbour step by 3.5. The click is an alpha-tested ray–plane raycast against every visible card, so transparent pixels never hit.
- **Pause, replay, lifecycle:** pause has a pressed state and freezes the whole timeline and clock; while paused, navigation applies at once. Replay resets the elapsed time, selection, pointer and opening without reloading. Before starting, it awaits image decoding and `document.fonts.ready`. The loop stops offscreen, in a hidden tab, while paused and once everything has settled. Reduced motion is followed live: the opening is skipped, the selection applies at once and the pointer tilt is off. `destroy()` releases everything.

**Adaptations, and why:**

- **CSS 3D instead of Three.js and WebGL.** The spec's cans are a GLB model with an HDR environment and per-flavour textures. None of that exists for these shoes: they are photos-as-cards, so rigid planes with CSS transforms are exact and add no dependencies. This also drops the cylinder label-texture step, the spec's tone mapping and PMREM, which have no meaning for flat cut-outs.
- **Yaw is soft-limited.** On a cylinder, the spec's yaw x·0.5 − π/9 mostly scrolls the label. Taken literally on a flat card, it turns the first neighbour edge-on and shows the second one from behind. The card yaw is therefore the same expression passed through 0.72·tanh(yaw/0.72): identical near the centre, monotonic, and never past about 41°. The can's mesh-child label spin (rotation.z = yaw·0.6) has no flat-card equivalent and is left out.
- **Wheel:** only horizontal wheel or trackpad motion (or <kbd>Shift</kbd> + wheel) steps the line-up, because it sits inside a scrolling page. A vertical wheel keeps scrolling the page, and <kbd>Ctrl</kbd> + wheel (pinch zoom) is left to the browser. This listener is the only non-passive one on the page, because it must cancel the sideways scroll.
- **Clicking a neighbour:** by default it steps one shoe toward it, as the spec says. On this site (`openNeighbours: true`) the clicked shoe glides all the way into the centre and then opens its page. **Clicking the centre shoe opens its page** (its `data-href`); that is the site's navigation, so it isn't in the spec. The same alpha-tested raycast is used, so transparent pixels never open anything. Keyboard users have the **Discover** button. An optional `.nocta-lineup__open` link laid exactly over the centre shoe is still supported for pages without one.
- **Info panel and outline name:** the spec has no product headings. The site asked for web-page detail, so the page's own layer (`main.js`, through `onSelect`) adds them outside the carousel component.
- **Six items, not six flavours.** There are 24 clones of 6 shoes, which is the spec's own count. The dots, the announcements and the open link follow the selection.

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

Last run: **574 / 574 checks passed** with the images present (**510 / 510** on a fresh clone, where the real-image sections check the missing-asset states instead), in headless Chromium 1440×1000, 390×844 (iPhone UA, touch, DPR 3), 820×1180 (iPad UA, touch, DPR 2), and resizes to 1024×700, 600×900 and 1920×600. Covered:

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
- **Line-up (desktop, phone, tablet):**
  - Every visible card's CSS 3D bounding box lands on the world camera projection within 1 px (measured 0.01 px).
  - The rest wave and rotations match the spec formulas exactly, with 24 clones wrapped inside [−42, 42). The camera ×1.08 and the ratio are correct on phone (ratio 2.4) and tablet (1440/820).
  - The opening is checked frame by frame at t = 0, 2, 3 and 4.5 s: a single shoe at spacing 10, the camera dolly 25 → 29, q, spacing, wave, rotations, entrance spin, light 0 → 30 → 50 and the spot cone.
  - Damping: 1 − exp(−10/60) after one frame, then an exact settle.
- **Line-up input:**
  - Next, previous and ←/→, with modified arrows ignored. Dots take the shortest wrapped route (a tie goes forward), and Enter on a focused dot selects it. The focus ring is 2 px.
  - A horizontal wheel steps once per 280 ms and is cancelled. A vertical wheel scrolls the page, and Ctrl + wheel is left alone.
  - Mouse drag at Δx·0.02 doesn't snap mid-drag. A slow release just snaps, and a quick flick adds the throw. A vertical drag does nothing.
  - Touch: a swipe steers, a vertical swipe scrolls the page natively, and tapping a neighbour steps toward it.
  - Raycast clicks on the left and right neighbours step toward them, a click on the centre does nothing, and transparent pixels never hit. Hovering a neighbour shows a pointer cursor.
- **Line-up states:**
  - Pause has a pressed state and freezes the clock; navigation while paused applies at once, and resume continues. Replay restarts without reloading.
  - The loop suspends offscreen and in a hidden tab, and sleeps once settled.
  - Reduced motion skips the opening, applies the selection at once and turns off tilt, including when the preference changes mid-opening.
  - A missing image shows its exact URL and no carousel. `destroy()` cleans up and the carousel remounts.
  - The announcement fires only when the selected shoe changes. The images keep their names and the clones are decorative. The section is 100svh before loading, with no headings or captions.
  - With the real cut-outs: transparent corners, and each card keeps its image aspect.
- **Routing and site chrome:**
  - Home is the 100svh line-up plus the footer. The info panel shows the count, name, colourway, the outline name and a Discover link that follows the selection; the hint fades after the first move.
  - Header: the current page is marked, the back button and skip link appear only on product pages, it hides on scroll down and returns on scroll up.
  - Swatches: three on NOCTA and two on AF1 and TN, with the arrival colourway pressed. Picking one queues the wipes it takes.
  - Details: copy, specs and Back / Next buttons. Shoe cards: Previous / Next, wrapping round. The header navigation, Next and the cards all change pages, and Back to top works.
  - Neighbours: a clicked neighbour glides in and then opens its page; other input cancels it, and reduced motion opens at once.
  - Shift+Tab from the controls reaches Discover with a visible ring. Enter opens the selected shoe's page with that colourway at rest, focus on the new page and a view transition.
  - The hidden line-up stops its loop. The Line-up button returns home with the selection kept, and the left page is destroyed (0 GL objects).
  - A mouse click on the centre Air Force 1 opens its page. Its cover sweeps exactly like NOCTA's (x = V − p(V + T)), and its reveal is black ↔ white with labels that name it.
  - Browser back and forward work, an in-page anchor keeps the page, and an unknown route goes home.
  - Deep links (`#/air-max-plus/white`) work, and reduced motion uses no view transition.
  - With the real AF1 and TN pairs: WebGL path, plane aspect, alignment (heel, toe and sole within 1.5 % of the product width), fluid, wipe and cover screenshots.

**Not verified (assumptions):**

- Real GPUs and Safari/WebKit. Only Chromium with SwiftShader was run.
- Real-device frame rate.
- The look of the image pair and of the line-up cut-outs was judged by eye from screenshots (desktop 1440×1000 and phone), not measured.
- The line-up's CSS 3D depth sorting and rasterisation on Safari/WebKit.

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

**Line-up and AF1/TN images:** four WebP images supplied by the project owner in this session, all 1672×941 on plain grey backgrounds (#8d8d8d, #7d7d7d, #787878 and #929190): the Nike Air Force 1 in black and in white, toe right, and the Nike Air Max Plus in white and in black, toe left. Their source and licence weren't stated. `tools/prepare_cutouts.py` turns each one into a transparent cut-out:

- Background: pixels within 12/255 of the border median that are connected to the border. No colour key is used inside the shoe.
- Edges: a 2 px band solved with closed-form matting, with the grey removed from the edge colours.
- Output: cropped to the silhouette with a 1.2 % margin, downscaled once (premultiplied Lanczos) to 1400 px wide, and written as WebP with full-quality alpha. The results are 1400×743, 1400×735, 1400×671 and 1400×684.

None of the four had a floor shadow. They aren't mirrored, so the logos and the AIR lettering read correctly. Like the other images, they are git-ignored.

The two NOCTA cards (`nocta-hot-step-2-black.webp` and `-white.webp`) are made by the same tool from the reveal's existing transparent PNGs. It keeps their matte, then crops, scales and encodes them the same way.

**Air Force 1 and Air Max Plus pages:** the same four supplied images, processed as black/white pairs by `tools/prepare_mattes_uniform_bg.py` (prefixes `nike-air-force-1` and `nike-air-max-plus`). That's the same pipeline as the NOCTA pair: closed-form edge matting, halo padding on the black, and one uniform scale plus a translation fitted by least squares.

| Pair | IoU | Median edge distance | `data-align-black` |
| --- | --- | --- | --- |
| Air Force 1 | 0.958 | 4.1 px | `-0.00315 -0.00252 0.99718` |
| Air Max Plus | 0.975 | 3.0 px | `0.00054 0.00217 0.99883` |

The two Air Max Plus renders differ by about 2 % in heel/tongue height, so the test allows 2.5 % there and 1.5 % elsewhere. The two covers (`nike-air-force-1-campaign.jpg` and `nike-air-max-plus-campaign.jpg`, 2560×1440) are composed from each black cut-out by `tools/compose_campaign.py` in its `studio` style: the same dark set as NOCTA's without the orange camouflage, which belongs to the NOCTA orange colourway.

**Earlier photographic pair** (superseded, kept for the record): `DZ7293-001.jxl`, the black, 1200×1200, and a pasted 600×316 WebP of the white, both opaque white-background Nike product photos supplied by the owner without source or licence metadata. They were matted with `tools/prepare_mattes.py`. The white was too low-resolution, and the two weren't shot with the same setup.

Nike and NOCTA product designs and marks belong to their owners. This is an unofficial concept, and the owner is responsible for the right to use the source images. Because this repository is **public**, the images are git-ignored and haven't been committed.

## Outstanding issues

1. **Decide on publishing the images.** They're local and git-ignored; committing them would publish images of trademarked products in a public repository.
2. For authentic photography instead of AI renders, use a matched high-resolution pair from one source, then run the matching tool and `tests/verify.mjs` again.
3. Test on physical iOS Safari and Android Chrome. `EXT_color_buffer_float` or `EXT_color_buffer_half_float` is required; otherwise the static fallback is used.
