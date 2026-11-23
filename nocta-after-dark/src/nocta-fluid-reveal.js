// NOCTA Hot Step 2 · black-to-white fluid reveal. Unofficial design concept.
//
// mountNoctaFluidReveal(frameElement, options) -> { toggle(next?), destroy(), state, debug }
//
// The black photograph is visible at rest. Pointer / touch motion drives a BFECC stable-fluids
// simulation whose velocity energy cuts temporary holes through which the white photograph is
// visible; when motion stops the fluid dissipates back to black. Activating the full-frame
// button (click, tap, Enter, Space) runs a curved bottom-to-top wipe to white; activating it
// again reverses it.

import { FLUID, FluidSimulation } from './fluid-simulation.js';
import { COMPOSITE_FRAG, QUAD_VERT } from './shaders.js';
import {
  GLResources,
  bindQuad,
  createAlphaTexture,
  createImageTexture,
  createProgram,
  createQuad,
  getFloatFormat,
} from './gl-utils.js';
import { fitPlanes, rectToGL, toGL } from './layout.js';

const STEP_MS = 1000 / FLUID.stepHz;
const MAX_STEPS_PER_FRAME = 4;
const SLEEP_AFTER_STEPS = 240; // .96^240 < 1e-4: nothing left above the reveal threshold
const REVEAL_OMEGA = 4.5; // critically damped full-reveal spring (~1.2 s, reversible, no jumps)

// Idle sweep: cosine-eased figure-eight, 2.5 s forward, 1.5 s hold, 2.5 s return, 3 s hold.
const IDLE = Object.freeze({ delay: 2000, forward: 2500, holdAfterForward: 1500, back: 2500, holdAfterBack: 3000 });
const IDLE_CYCLE = IDLE.forward + IDLE.holdAfterForward + IDLE.back + IDLE.holdAfterBack;

const DEFAULTS = Object.freeze({
  blackSrc: 'assets/nocta-hot-step-2-black.png',
  whiteSrc: 'assets/nocta-hot-step-2-white.png',
  blackAlt: 'Nike NOCTA Hot Step 2 in black, side view',
  whiteAlt: 'Nike NOCTA Hot Step 2 in white, side view',
  toggleLabel: 'Reveal white Nike NOCTA Hot Step 2',
  maxPixelRatio: 1.5,
  idle: true,
  debug: false,
});

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const easeCos = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));

function parseAdjust(value) {
  if (!value) return {};
  const [dx = 0, dy = 0, scale = 1] = String(value).trim().split(/[\s,]+/).map(Number);
  return { dx: dx || 0, dy: dy || 0, scale: scale > 0 ? scale : 1 };
}

function ensureMarkup(root, options) {
  const created = [];
  const find = (cls, make) => {
    let el = root.querySelector(`.${cls}`);
    if (!el) {
      el = make();
      el.classList.add(cls);
      root.append(el);
      created.push(el);
    }
    return el;
  };
  const canvas = find('nocta-reveal__canvas', () => document.createElement('canvas'));
  const black = find('nocta-reveal__photo--black', () => {
    const img = document.createElement('img');
    img.className = 'nocta-reveal__photo';
    img.src = options.blackSrc ?? DEFAULTS.blackSrc;
    img.alt = options.blackAlt ?? DEFAULTS.blackAlt;
    return img;
  });
  const white = find('nocta-reveal__photo--white', () => {
    const img = document.createElement('img');
    img.className = 'nocta-reveal__photo';
    img.src = options.whiteSrc ?? DEFAULTS.whiteSrc;
    img.alt = options.whiteAlt ?? DEFAULTS.whiteAlt;
    img.hidden = true;
    return img;
  });
  const toggle = find('nocta-reveal__toggle', () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.hidden = true;
    return button;
  });
  const status = find('nocta-reveal__status', () => {
    const p = document.createElement('p');
    p.hidden = true;
    return p;
  });
  canvas.setAttribute('role', 'img');
  if (!toggle.getAttribute('aria-label')) toggle.setAttribute('aria-label', options.toggleLabel ?? DEFAULTS.toggleLabel);
  return { els: { canvas, black, white, toggle, status }, created };
}

function resolveOptions(root, els, options) {
  const d = root.dataset;
  return {
    ...DEFAULTS,
    blackSrc: options.blackSrc ?? d.blackSrc ?? els.black.getAttribute('src') ?? DEFAULTS.blackSrc,
    whiteSrc: options.whiteSrc ?? d.whiteSrc ?? els.white.getAttribute('src') ?? DEFAULTS.whiteSrc,
    blackAlt: options.blackAlt ?? (els.black.getAttribute('alt') || DEFAULTS.blackAlt),
    whiteAlt: options.whiteAlt ?? (els.white.getAttribute('alt') || DEFAULTS.whiteAlt),
    maxPixelRatio: options.maxPixelRatio ?? DEFAULTS.maxPixelRatio,
    idle: options.idle ?? d.idle !== 'false',
    debug: Boolean(options.debug),
    lockstep: Boolean(options.debug && options.lockstep),
    adjust: {
      black: options.adjust?.black ?? parseAdjust(d.alignBlack),
      white: options.adjust?.white ?? parseAdjust(d.alignWhite),
    },
  };
}

/**
 * Product bounding box from the alpha channel (normalised, y-down), refined to sub-pixel
 * precision from the coverage of the outermost row/column, plus whether the photo has real
 * transparency and a pre-blurred alpha map for the rim light.
 */
function analyseAlpha(img) {
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const s = Math.min(1, 2048 / Math.max(nw, nh));
  const w = Math.max(1, Math.round(nw * s));
  const h = Math.max(1, Math.round(nh * s));
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    let x0 = w;
    let y0 = h;
    let x1 = -1;
    let y1 = -1;
    let translucent = 0;
    const alpha = new Uint8Array(w * h);
    const rowMax = new Uint8Array(h);
    const colMax = new Uint8Array(w);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const a = data[(y * w + x) * 4 + 3];
        alpha[y * w + x] = a;
        if (a < 250) translucent++;
        if (a > rowMax[y]) rowMax[y] = a;
        if (a > colMax[x]) colMax[x] = a;
        if (a > 12) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return { bbox: null, hasAlpha: true, halo: null };
    const bbox = {
      x0: (x0 + 1 - colMax[x0] / 255) / w,
      y0: (y0 + 1 - rowMax[y0] / 255) / h,
      x1: (x1 + colMax[x1] / 255) / w,
      y1: (y1 + rowMax[y1] / 255) / h,
    };
    return { bbox, hasAlpha: translucent > w * h * 0.01, halo: buildHaloMap(alpha, w, h, bbox) };
  } catch {
    return { bbox: null, hasAlpha: true, halo: null };
  }
}

function boxBlur(src, w, h, r, horizontal) {
  const dst = new Float32Array(w * h);
  const norm = 1 / (2 * r + 1);
  const lines = horizontal ? h : w;
  const len = horizontal ? w : h;
  const at = horizontal ? (line, i) => line * w + i : (line, i) => i * w + line;
  for (let line = 0; line < lines; line++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += src[at(line, clamp(k, 0, len - 1))];
    for (let i = 0; i < len; i++) {
      dst[at(line, i)] = acc * norm;
      acc += src[at(line, Math.min(i + r + 1, len - 1))] - src[at(line, Math.max(i - r, 0))];
    }
  }
  return dst;
}

/** Gaussian-ish blur (3 box passes) of the silhouette alpha, sigma ~1.2% of the product width. */
function buildHaloMap(alpha, w, h, bbox) {
  const s = Math.min(1, 512 / Math.max(w, h));
  const hw = Math.max(1, Math.round(w * s));
  const hh = Math.max(1, Math.round(h * s));
  let a = new Float32Array(hw * hh);
  for (let y = 0; y < hh; y++) {
    const sy = Math.min(h - 1, Math.floor((y + 0.5) / s));
    for (let x = 0; x < hw; x++) {
      a[y * hw + x] = alpha[sy * w + Math.min(w - 1, Math.floor((x + 0.5) / s))] / 255;
    }
  }
  const r = Math.max(1, Math.round((bbox.x1 - bbox.x0) * hw * 0.012));
  for (let pass = 0; pass < 3; pass++) {
    a = boxBlur(a, hw, hh, r, true);
    a = boxBlur(a, hw, hh, r, false);
  }
  const data = new Uint8Array(hw * hh);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(clamp(a[i], 0, 1) * 255);
  return { data, width: hw, height: hh };
}

function loadPhoto(src, adjust) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = async () => {
      try {
        await img.decode();
      } catch {
        /* already decoded or not decodable off-DOM; onload is enough */
      }
      const { bbox, hasAlpha, halo } = analyseAlpha(img);
      resolve({ ok: true, src, img, width: img.naturalWidth, height: img.naturalHeight, bbox, hasAlpha, halo, adjust });
    };
    img.onerror = () => resolve({ ok: false, src });
    img.src = src;
  });
}

export function mountNoctaFluidReveal(root, options = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('mountNoctaFluidReveal: a frame element is required');

  const { els, created } = ensureMarkup(root, options);
  const opts = resolveOptions(root, els, options);
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const on = (target, type, fn, extra = {}) =>
    target.addEventListener(type, fn, { passive: true, signal: listeners.signal, ...extra });

  const state = {
    mode: 'loading',
    destroyed: false,
    initStarted: false,
    visible: false,
    docHidden: document.hidden,
    reducedMotion: reducedMotionQuery.matches,
    contextLost: false,
    running: false,
    frozen: false, // debug recording only
    virtualNow: 0,
    target: 0,
    reveal: 0,
    revealVel: 0,
    pointer: { x: 0, y: 0, active: false, hasOld: false, oldX: 0, oldY: 0, source: 'none' },
    parallax: { x: 0.5, y: 0.5 },
    lastInput: performance.now(),
    idleActive: false,
    idleStart: 0,
    stepsSinceForce: Infinity,
    asleep: true,
    needsRender: false,
    acc: 0,
    lastTime: 0,
    rafId: 0,
    frameW: 1,
    frameH: 1,
    dpr: 1,
    planes: null,
    stats: { ticks: 0, steps: 0, forces: 0, renders: 0 },
  };

  let gl = null;
  let isWebGL2 = false;
  let floatFormat = null;
  let res = null;
  let quad = null;
  let composite = null;
  let sim = null;
  let textures = null;
  let photos = null;
  let nearObserver = null;

  // ---------------------------------------------------------------- modes & DOM state

  function setMode(mode) {
    state.mode = mode;
    root.dataset.mode = mode;
    els.toggle.hidden = !(mode === 'webgl' || mode === 'static' || mode === 'fallback');
    syncPhotos();
    updateRunning();
  }

  function syncPhotos() {
    const dom = state.mode === 'fallback' || state.mode === 'missing' || state.mode === 'loading';
    const pressed = state.target === 1;
    const whiteOk = Boolean(photos?.white?.ok);
    els.black.hidden = !(dom && !(pressed && whiteOk)) || (photos !== null && !photos.black.ok);
    els.white.hidden = !(dom && pressed && whiteOk);
  }

  function syncLabels() {
    const pressed = state.target === 1;
    els.toggle.setAttribute('aria-pressed', String(pressed));
    els.canvas.setAttribute('aria-label', pressed ? opts.whiteAlt : opts.blackAlt);
  }

  function layoutDom() {
    if (!state.planes) return;
    const place = (img, p) => {
      img.style.left = `${p.left}px`;
      img.style.top = `${p.top}px`;
      img.style.width = `${p.width}px`;
      img.style.height = `${p.height}px`;
      img.style.maxWidth = 'none';
      img.style.transform = 'none';
    };
    place(els.black, state.planes.black);
    place(els.white, state.planes.white);
  }

  // ---------------------------------------------------------------- sizing

  function applySize() {
    if (state.destroyed) return;
    const rect = root.getBoundingClientRect();
    state.frameW = Math.max(1, rect.width);
    state.frameH = Math.max(1, rect.height);
    state.dpr = Math.min(window.devicePixelRatio || 1, opts.maxPixelRatio);
    if (photos?.black?.ok) {
      const white = photos.white.ok ? photos.white : photos.black;
      state.planes = fitPlanes(state.frameW, state.frameH, white, photos.black);
    }
    layoutDom();
    if (gl && res && !state.contextLost) {
      const cw = Math.max(1, Math.round(state.frameW * state.dpr));
      const ch = Math.max(1, Math.round(state.frameH * state.dpr));
      if (els.canvas.width !== cw || els.canvas.height !== ch) {
        els.canvas.width = cw;
        els.canvas.height = ch;
      }
      if (sim.resize(state.frameW * FLUID.resolution, state.frameH * FLUID.resolution)) state.asleep = true;
      render();
    }
  }

  // ---------------------------------------------------------------- WebGL

  function createContext() {
    const attributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: opts.debug,
    };
    for (const type of ['webgl2', 'webgl']) {
      let ctx;
      try {
        ctx = els.canvas.getContext(type, attributes);
      } catch {
        ctx = null;
      }
      if (!ctx) continue;
      const fmt = getFloatFormat(ctx, type === 'webgl2');
      if (fmt) {
        gl = ctx;
        isWebGL2 = type === 'webgl2';
        floatFormat = fmt;
        return true;
      }
      // No renderable float buffers on this context: release it and retry on a fresh canvas.
      ctx.getExtension('WEBGL_lose_context')?.loseContext();
      const fresh = els.canvas.cloneNode(false);
      els.canvas.replaceWith(fresh);
      const i = created.indexOf(els.canvas);
      if (i >= 0) created[i] = fresh;
      els.canvas = fresh;
    }
    return false;
  }

  function createResources() {
    floatFormat = getFloatFormat(gl, isWebGL2);
    if (!floatFormat) throw new Error('Renderable float buffers unavailable');
    res = new GLResources(gl);
    quad = createQuad(res);
    composite = createProgram(res, QUAD_VERT, COMPOSITE_FRAG);
    textures = {
      black: createImageTexture(res, photos.black.img, isWebGL2),
      white: createImageTexture(res, photos.white.img, isWebGL2),
      halo: createAlphaTexture(res, photos.black.halo),
    };
    sim = new FluidSimulation(res, floatFormat, quad);
    sim.resize(state.frameW * FLUID.resolution, state.frameH * FLUID.resolution);
    state.asleep = true;
  }

  function disposeGL({ loseContext }) {
    if (!gl) return;
    if (!state.contextLost) {
      sim?.dispose();
      res?.releaseAll();
    } else {
      res?.forgetAll();
    }
    sim = null;
    composite = null;
    textures = null;
    quad = null;
    if (loseContext) gl.getExtension('WEBGL_lose_context')?.loseContext();
    gl = null;
  }

  function startGL() {
    try {
      if (!createContext()) return false;
      createResources();
      const canvas = els.canvas;
      on(
        canvas,
        'webglcontextlost',
        (event) => {
          event.preventDefault();
          state.contextLost = true;
          res?.forgetAll();
          sim = null;
          composite = null;
          textures = null;
          quad = null;
          setMode('fallback');
        },
        { passive: false },
      );
      on(canvas, 'webglcontextrestored', () => {
        state.contextLost = false;
        try {
          createResources();
          applySize();
          setMode(state.reducedMotion ? 'static' : 'webgl');
        } catch (err) {
          console.error('[nocta-reveal] WebGL restore failed, keeping the static photograph.', err);
          setMode('fallback');
        }
      });
      return true;
    } catch (err) {
      console.error('[nocta-reveal] WebGL unavailable, showing the static photograph.', err);
      disposeGL({ loseContext: true });
      return false;
    }
  }

  /** Restores the main canvas framebuffer, program, vertex buffer and texture units. */
  function bindMainState() {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, els.canvas.width, els.canvas.height);
    gl.disable(gl.BLEND);
    gl.useProgram(composite.program);
    bindQuad(gl, quad);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sim.velocityTexture);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.black);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textures.white);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, textures.halo);
    gl.activeTexture(gl.TEXTURE0);
  }

  function render() {
    if (!gl || state.contextLost || !composite || !state.planes) return;
    const H = state.frameH;
    const p = state.planes;
    const black = toGL(p.black, H);
    const white = toGL(p.white, H);
    const product = rectToGL(p.product, H);
    const motion = state.mode === 'webgl';
    const loc = (n) => composite.loc(n);
    bindMainState();
    gl.uniform1i(loc('uVelocity'), 0);
    gl.uniform1i(loc('uBlack'), 1);
    gl.uniform1i(loc('uWhite'), 2);
    gl.uniform1i(loc('uHalo'), 3);
    gl.uniform2f(loc('uFrame'), state.frameW, state.frameH);
    gl.uniform2f(loc('uBlackCenter'), black.center[0], black.center[1]);
    gl.uniform2f(loc('uBlackSize'), black.size[0], black.size[1]);
    gl.uniform2f(loc('uWhiteCenter'), white.center[0], white.center[1]);
    gl.uniform2f(loc('uWhiteSize'), white.size[0], white.size[1]);
    gl.uniform2f(loc('uProductCenter'), product.center[0], product.center[1]);
    gl.uniform2f(loc('uProductSize'), product.size[0], product.size[1]);
    gl.uniform2f(loc('uPointer'), state.parallax.x, state.parallax.y);
    gl.uniform1f(loc('uFullReveal'), clamp(state.reveal, 0, 1));
    gl.uniform1f(loc('uFluid'), motion ? 1 : 0);
    gl.uniform1f(loc('uParallax'), motion ? 1 : 0);
    gl.uniform1f(loc('uHaloRadius'), clamp(p.productWidth * 0.009, 2.5, 12));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    state.stats.renders++;
  }

  // ---------------------------------------------------------------- input

  function setPointer(nx, ny, source) {
    const p = state.pointer;
    if (!p.active || p.source !== source) p.hasOld = false; // never inject force on a first sample
    p.x = nx * 2 - 1;
    p.y = -(ny * 2 - 1); // DOM y-down -> clip y-up
    p.active = true;
    p.source = source;
  }

  function releasePointer(source) {
    const p = state.pointer;
    if (p.source !== source) return;
    p.active = false;
    p.hasOld = false;
  }

  function realInput(clientX, clientY, source) {
    state.lastInput = performance.now();
    if (state.idleActive) stopIdle();
    if (state.mode !== 'webgl') return;
    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setPointer((clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height, source);
  }

  /** force = (current - old clip coords) / 2 * mouse_force; null on the first frame or no motion. */
  function consumeForce() {
    const p = state.pointer;
    if (!p.active) {
      p.hasOld = false;
      return null;
    }
    if (!p.hasOld) {
      p.oldX = p.x;
      p.oldY = p.y;
      p.hasOld = true;
      return null;
    }
    const dx = p.x - p.oldX;
    const dy = p.y - p.oldY;
    p.oldX = p.x;
    p.oldY = p.y;
    if (dx === 0 && dy === 0) return null;
    return { x: p.x, y: p.y, fx: (dx / 2) * FLUID.mouseForce, fy: (dy / 2) * FLUID.mouseForce };
  }

  function toggle(next) {
    if (state.destroyed) return;
    state.target = typeof next === 'boolean' ? Number(next) : state.target === 1 ? 0 : 1;
    state.lastInput = performance.now();
    if (state.idleActive) stopIdle();
    syncLabels();
    if (state.mode === 'webgl') {
      state.needsRender = true;
    } else {
      state.reveal = state.target;
      state.revealVel = 0;
      syncPhotos();
      render();
    }
  }

  // ---------------------------------------------------------------- idle sweep

  function stopIdle() {
    state.idleActive = false;
    releasePointer('idle');
  }

  function updateIdle(now) {
    const allowed = opts.idle && state.mode === 'webgl' && state.target === 0 && state.planes;
    if (!allowed) {
      if (state.idleActive) stopIdle();
      return;
    }
    if (!state.idleActive) {
      if (now - state.lastInput < IDLE.delay) return;
      state.idleActive = true;
      state.idleStart = now;
    }
    const t = (now - state.idleStart) % IDLE_CYCLE;
    let phase;
    if (t < IDLE.forward) phase = easeCos(t / IDLE.forward);
    else if (t < IDLE.forward + IDLE.holdAfterForward) phase = 1;
    else if (t < IDLE.forward + IDLE.holdAfterForward + IDLE.back)
      phase = 1 - easeCos((t - IDLE.forward - IDLE.holdAfterForward) / IDLE.back);
    else phase = 0;
    const theta = phase * Math.PI * 2;
    const prod = state.planes.product;
    const x = prod.left + prod.width * (0.5 + 0.34 * Math.cos(theta));
    const y = prod.top + prod.height * (0.5 + 0.3 * Math.sin(2 * theta));
    setPointer(x / state.frameW, y / state.frameH, 'idle');
  }

  // ---------------------------------------------------------------- loop

  function updateReveal(dt) {
    const x0 = state.reveal - state.target;
    const v0 = state.revealVel;
    if (x0 === 0 && v0 === 0) return false;
    const w = REVEAL_OMEGA;
    const e = Math.exp(-w * dt);
    const c2 = v0 + w * x0;
    const x = (x0 + c2 * dt) * e;
    const v = (c2 - w * (x0 + c2 * dt)) * e;
    state.reveal = state.target + x;
    state.revealVel = v;
    if (Math.abs(x) < 1e-4 && Math.abs(v) < 1e-3) {
      state.reveal = state.target;
      state.revealVel = 0;
    }
    return true;
  }

  function updateParallax(dt) {
    const p = state.pointer;
    const tx = p.active ? (p.x + 1) / 2 : 0.5;
    const ty = p.active ? (1 - p.y) / 2 : 0.5;
    const cur = state.parallax;
    if (Math.abs(tx - cur.x) < 5e-4 && Math.abs(ty - cur.y) < 5e-4) {
      const moved = cur.x !== tx || cur.y !== ty;
      cur.x = tx;
      cur.y = ty;
      return moved;
    }
    const k = 1 - Math.exp(-dt * 8);
    cur.x += (tx - cur.x) * k;
    cur.y += (ty - cur.y) * k;
    return true;
  }

  function simulateStep() {
    const force = consumeForce();
    if (force) {
      state.stepsSinceForce = 0;
      state.asleep = false;
      state.stats.forces++;
    }
    if (state.asleep) return false;
    sim.step(force);
    bindMainState();
    state.stats.steps++;
    state.stepsSinceForce++;
    return true;
  }

  function tick(now) {
    state.rafId = requestAnimationFrame(tick);
    // `lockstep` (tests only) advances exactly one 60 Hz step per animation frame so slow
    // software renderers measure simulation time instead of wall-clock time.
    const dtMs = opts.lockstep ? STEP_MS : clamp(now - state.lastTime, 0, 100);
    state.lastTime = now;
    frame(now, dtMs, true);
  }

  /** One loop iteration; `allowRender` false lets debug recording skip frames it won't capture. */
  function frame(now, dtMs, allowRender) {
    state.stats.ticks++;
    updateIdle(now);
    state.acc += dtMs;
    let steps = 0;
    let stepped = false;
    while (state.acc >= STEP_MS - 1e-6) {
      state.acc -= STEP_MS;
      if (steps++ < MAX_STEPS_PER_FRAME) stepped = simulateStep() || stepped;
    }
    if (state.acc < 0) state.acc = 0;
    const revealMoving = updateReveal(dtMs / 1000);
    const parallaxMoving = updateParallax(dtMs / 1000);
    if (!state.asleep && !state.idleActive && state.stepsSinceForce >= SLEEP_AFTER_STEPS) {
      sim.clear();
      state.asleep = true;
      state.needsRender = true;
    }
    if (stepped || revealMoving || parallaxMoving || state.needsRender) {
      state.needsRender = !allowRender;
      if (allowRender) render();
    }
  }

  function updateRunning() {
    const run =
      !state.frozen &&
      state.mode === 'webgl' &&
      state.visible &&
      !state.docHidden &&
      !state.destroyed &&
      !state.contextLost;
    if (run && !state.rafId) {
      state.lastTime = performance.now();
      state.acc = 0;
      state.rafId = requestAnimationFrame(tick);
    } else if (!run && state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
      if (state.idleActive) stopIdle();
    }
    state.running = run;
  }

  function applyMotionPreference() {
    state.reducedMotion = reducedMotionQuery.matches;
    if (state.mode !== 'webgl' && state.mode !== 'static') return;
    stopIdle();
    releasePointer('mouse');
    releasePointer('touch');
    sim?.clear();
    state.asleep = true;
    state.reveal = state.target;
    state.revealVel = 0;
    state.parallax.x = 0.5;
    state.parallax.y = 0.5;
    setMode(state.reducedMotion ? 'static' : 'webgl');
    render();
  }

  // ---------------------------------------------------------------- init

  async function init() {
    if (state.initStarted || state.destroyed) return;
    state.initStarted = true;
    const [black, white] = await Promise.all([
      loadPhoto(opts.blackSrc, opts.adjust.black),
      loadPhoto(opts.whiteSrc, opts.adjust.white),
    ]);
    if (state.destroyed) return;
    photos = { black, white };

    const missing = [black, white].filter((p) => !p.ok).map((p) => p.src);
    if (missing.length) {
      console.error(
        `[nocta-reveal] Missing product photography: ${missing.join(', ')}. ` +
          'Add the matched Nike NOCTA Hot Step 2 PNGs described in assets/README.md.',
      );
      els.status.textContent = `Product photography missing: ${missing.join(' · ')}`;
      els.status.hidden = false;
      applySize();
      setMode('missing');
      return;
    }
    for (const p of [black, white]) {
      if (!p.hasAlpha) {
        console.warn(`[nocta-reveal] ${p.src} is fully opaque; a transparent PNG or a silhouette matte is expected.`);
      }
    }
    applySize();
    if (!startGL()) {
      setMode('fallback');
      return;
    }
    applySize();
    setMode(state.reducedMotion ? 'static' : 'webgl');
  }

  // ---------------------------------------------------------------- wiring

  const resizeObserver = new ResizeObserver(() => applySize());
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      const wasVisible = state.visible;
      state.visible = entries[entries.length - 1].isIntersecting;
      // The idle sweep waits two seconds from the moment the section comes into view.
      if (state.visible && !wasVisible) state.lastInput = performance.now();
      updateRunning();
    },
    { threshold: 0 },
  );
  nearObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      nearObserver.disconnect();
      nearObserver = null;
      init().catch((err) => {
        console.error('[nocta-reveal] Initialisation failed, showing the static photograph.', err);
        setMode(photos?.black?.ok ? 'fallback' : 'missing');
      });
    },
    { rootMargin: '200px 0px' },
  );

  const t = els.toggle;
  on(t, 'pointermove', (e) => e.pointerType !== 'touch' && realInput(e.clientX, e.clientY, 'mouse'));
  on(t, 'pointerdown', (e) => e.pointerType !== 'touch' && realInput(e.clientX, e.clientY, 'mouse'));
  on(t, 'pointerleave', (e) => e.pointerType !== 'touch' && releasePointer('mouse'));
  on(t, 'touchstart', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    state.pointer.hasOld = false;
    realInput(touch.clientX, touch.clientY, 'touch');
  });
  on(t, 'touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) realInput(touch.clientX, touch.clientY, 'touch');
  });
  on(t, 'touchend', (e) => e.touches.length === 0 && releasePointer('touch'));
  on(t, 'touchcancel', () => releasePointer('touch'));
  on(t, 'click', () => toggle());
  on(document, 'visibilitychange', () => {
    state.docHidden = document.hidden;
    updateRunning();
  });
  on(reducedMotionQuery, 'change', applyMotionPreference);

  syncLabels();
  setMode('loading');
  resizeObserver.observe(root);
  visibilityObserver.observe(root);
  nearObserver.observe(root);

  function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
    state.running = false;
    listeners.abort();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    nearObserver?.disconnect();
    nearObserver = null;
    const oldCanvas = els.canvas;
    disposeGL({ loseContext: true });
    // Hand back a fresh canvas so the element can be mounted again.
    if (!created.includes(oldCanvas)) {
      const fresh = oldCanvas.cloneNode(false);
      oldCanvas.replaceWith(fresh);
      els.canvas = fresh;
    }
    for (const el of created) el.remove();
    for (const img of [els.black, els.white]) {
      img.removeAttribute('style');
    }
    els.black.hidden = false;
    els.white.hidden = true;
    els.toggle.hidden = true;
    els.toggle.setAttribute('aria-pressed', 'false');
    els.status.hidden = true;
    delete root.dataset.mode;
  }

  const debug = opts.debug
    ? {
        getState() {
          return {
            mode: state.mode,
            glVersion: gl ? (isWebGL2 ? 2 : 1) : 0,
            floatFormat: floatFormat?.label ?? null,
            frame: [state.frameW, state.frameH],
            dpr: state.dpr,
            canvas: [els.canvas.width, els.canvas.height],
            sim: sim ? [sim.width, sim.height] : null,
            px: sim ? [...sim.px] : null,
            planes: state.planes,
            photos: photos && {
              black: photos.black.ok
                ? { width: photos.black.width, height: photos.black.height, bbox: photos.black.bbox }
                : null,
              white: photos.white.ok
                ? { width: photos.white.width, height: photos.white.height, bbox: photos.white.bbox }
                : null,
            },
            reveal: state.reveal,
            target: state.target,
            idleActive: state.idleActive,
            running: state.running,
            asleep: state.asleep,
            visible: state.visible,
            docHidden: state.docHidden,
            reducedMotion: state.reducedMotion,
            pointer: { ...state.pointer },
            parallax: { ...state.parallax },
            stats: { ...state.stats },
            liveGLObjects: res?.count ?? 0,
            destroyed: state.destroyed,
          };
        },
        readVelocity: () => (sim && !state.contextLost ? sim.readVelocity() : null),
        readCanvas() {
          if (!gl || state.contextLost) return null;
          render();
          const { width, height } = els.canvas;
          const data = new Uint8Array(width * height * 4);
          gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
          return { width, height, data };
        },
        loseContext: () => gl?.getExtension('WEBGL_lose_context'),
        /** Recording only: stop the rAF loop so frames advance exclusively through advance(). */
        freeze() {
          state.frozen = true;
          state.virtualNow = performance.now();
          updateRunning();
        },
        /** Recording only: run exactly one loop iteration of `ms` (default one 60 Hz step). */
        advance(ms = STEP_MS, { render: doRender = true } = {}) {
          if (!state.frozen || state.mode !== 'webgl') return;
          state.virtualNow += ms;
          frame(state.virtualNow, ms, doRender);
          if (doRender) render();
        },
      }
    : null;

  return {
    toggle,
    destroy,
    get state() {
      return { mode: state.mode, revealed: state.target === 1 };
    },
    debug,
  };
}
