// Line-up carousel: the shoes float as rigid cut-out cards in a 3D wave. It uses CSS 3D
// transforms and no libraries. The motion follows the 3D product-carousel spec: 24 clones,
// spacing 3.5, wrap -42..42, a FOV-20 camera at z 29, a 4.5 s opening, damping 1-exp(-10 dt),
// snapping, drag with throw, wheel, keys, previous/next, dots, pause and replay.
//
// mountShoeCarousel(sectionElement, options) -> { next(), previous(), select(i), destroy(), state, debug }
//
// Each item may carry data-href (a page or route): clicking or tapping the centre shoe opens it,
// as does the optional keyboard link laid over it. A neighbour steps into the centre; with
// options.openNeighbours it glides all the way to the centre and then opens. options.onSelect(info)
// fires whenever the selected shoe changes (and once when the line-up is ready).
//
// The world is the spec's y-up, right-handed scene, with the camera on +z looking at the origin.
// Each frame it maps exactly onto CSS:
//   perspective = f = (H/2) / tan(FOV/2)  (pixels; the distance from the eye to the z=0 plane)
//   k = f / cameraZ                       (pixels per world unit at z=0)
//   translate3d(x k, -y k, z k)           (CSS y points down)
//   Three.js Euler XYZ (Rx Ry Rz)         = CSS rotateX(-pitch) rotateY(yaw) rotateZ(-roll)
// So a point projects to (x, -y) * f / (cameraZ - z) on screen, which is the camera's projection.
// The raycast for clicking a neighbour, the culling and the spotlight shading all use that
// same world model.
//
// Flat-card adaptation (see README): a can is a cylinder, so the spec's yaw `x*.5 - PI/9`
// mainly scrolls its label. Taken literally, it would turn a flat card edge-on at the first
// neighbour and show its back at the second. The card yaw is therefore the same expression
// through a soft limit, YAW_LIMIT * tanh(yaw / YAW_LIMIT). The label spin that the can's mesh
// children get (rotation.z = yaw * .6) has no flat-card equivalent and is left out. The
// opening's extra spin, PI/9 * (1-q) * influence, is applied about the shoe's own vertical axis.

const SPACING = 3.5;
const BASE_CLONES = 24;
const FOV = (20 * Math.PI) / 180;
const CAMERA_Z = 29;
const CAMERA_Z_START = 25;
const PORTRAIT_ASPECT = 0.8;
const PORTRAIT_ZOOM = 1.08;
const DAMPING = 10;
const MAX_DT = 0.05;
const ENTRANCE_S = 4.5;
const DRAG_GAIN = 0.02;
const THROW_GAIN = 0.16;
const THROW_WINDOW_MS = 100;
const GESTURE_SLOP_PX = 8;
const WHEEL_THROTTLE_MS = 280;
const SCALE = 1.2;
const PITCH = -Math.PI / 9;
const YAW = -Math.PI / 9;
const ROLL = Math.PI / 16;
const SPIN = Math.PI / 9;
const TILT_GAIN = 0.2;
const TILT_REF_PX = 1280;
const YAW_LIMIT = 0.72; // flat-card adaptation, radians (~41 degrees)
const CARD_WIDTH = 3.6; // world units before SCALE; every shoe gets the same length
const CARD_WIDTH_WIDE = 4.1; // landscape screens (aspect >= 1.2) have room for a larger hero shoe
const WIDE_ASPECT = 1.2;
const CENTRE_Y = 0.5; // the camera's optical centre, as a fraction of the viewport height
const CENTRE_Y_PORTRAIT = 0.57; // phones: the wave sits lower, clear of the info panel above it
const ENV_LIGHT = 0.74; // ambient share of the brightness, so cards outside the spotlights stay legible
const LIGHTS = Object.freeze([
  { pos: [0, 3.5, 0], target: [0, 0, 1] },
  { pos: [0, -3, 2], target: [0, 0, 1.8] },
]);
const LIGHT_DISTANCE = 8;
const LIGHT_DECAY = 0.1;
const PENUMBRA = 1;
const CULL_MARGIN_PX = 24;
const MASK_WIDTH = 128;

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (v, n) => ((v % n) + n) % n;
const smoothstep = (e0, e1, v) => {
  if (e1 === e0) return v < e0 ? 0 : 1;
  const t = clamp((v - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const normalize = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const power4Out = (p) => 1 - (1 - clamp(p, 0, 1)) ** 5;
export const wrap = (v, min, max) => mod(v - min, max - min) + min;
export const softYaw = (a) => YAW_LIMIT * Math.tanh(a / YAW_LIMIT);

/** The opening timeline at `elapsed` seconds (the spec's formulas, verbatim). */
export function entranceAt(elapsed) {
  const q = power4Out((elapsed - 2) / 2.5);
  const light = lerp(30 * power4Out(elapsed / 2.5), 50, q);
  return {
    q,
    spacing: lerp(10, 1, q),
    wave: q,
    cameraZ: lerp(CAMERA_Z_START, CAMERA_Z, power4Out((elapsed - 1) / 2.5)),
    light,
    spotIntensity: light / 2,
    spotAngle: (Math.PI / 4) * (2 - q),
  };
}

/** World pose of the clone whose wrapped offset from the centre is `x`. */
export function cardPose(x, ratio, ent, tilt = { x: 0, y: 0 }) {
  const canX = x * ent.spacing;
  const influence = clamp(1 - Math.abs(x) / SPACING, 0, 1);
  return {
    x: canX,
    y: Math.sin(canX * 0.25 * ratio * ent.wave),
    z: (-Math.abs(x) - 0.2) * ent.wave,
    pitch: PITCH * ent.wave + (tilt.y / TILT_REF_PX) * TILT_GAIN * influence,
    yaw: softYaw((canX * 0.5 + YAW) * ent.wave) + (tilt.x / TILT_REF_PX) * TILT_GAIN * influence,
    roll: ROLL * ent.wave,
    spin: SPIN * (1 - ent.q) * influence,
    influence,
  };
}

function rotX(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}
function rotY(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}
function rotZ(a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
function mul3(A, B) {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  }
  return o;
}
/** Rotation of a card (row-major 3x3): Euler XYZ, then the shoe's own spin about its vertical axis. */
export function poseMatrix(p) {
  return mul3(mul3(mul3(rotX(p.pitch), rotY(p.yaw)), rotZ(p.roll)), rotY(p.spin));
}
const column = (M, c) => [M[c], M[3 + c], M[6 + c]];

/** The two spotlights (three.js spot cone and distance attenuation) on a card's front face. */
export function spotIrradiance(pose, M, ent) {
  const n = column(M, 2);
  const centre = [pose.x, pose.y, pose.z];
  const coneCos = Math.cos(ent.spotAngle);
  const penumbraCos = Math.cos(ent.spotAngle * (1 - PENUMBRA));
  let sum = 0;
  for (const light of LIGHTS) {
    const axis = normalize(sub(light.target, light.pos));
    const v = sub(centre, light.pos);
    const d = len(v) || 1e-6;
    const toCard = [v[0] / d, v[1] / d, v[2] / d];
    const cone = smoothstep(coneCos, penumbraCos, dot(toCard, axis));
    const falloff = (1 / Math.max(d ** LIGHT_DECAY, 0.01)) * clamp(1 - (d / LIGHT_DISTANCE) ** 4, 0, 1) ** 2;
    const facing = Math.max(0, -dot(n, toCard));
    sum += ent.spotIntensity * cone * falloff * facing;
  }
  return sum;
}

const FINAL = entranceAt(ENTRANCE_S);
const CENTRE_POSE = cardPose(0, 1, FINAL);
const REFERENCE_IRRADIANCE = spotIrradiance(CENTRE_POSE, poseMatrix(CENTRE_POSE), FINAL);

export function mountShoeCarousel(root, options = {}) {
  if (!(root instanceof HTMLElement)) throw new TypeError('mountShoeCarousel: a section element is required');
  const list = root.querySelector('.nocta-lineup__items');
  const viewport = root.querySelector('.nocta-lineup__viewport');
  const stage = root.querySelector('.nocta-lineup__stage');
  const controls = root.querySelector('.nocta-lineup__controls');
  const dotsBox = root.querySelector('.nocta-lineup__dots');
  const live = root.querySelector('.nocta-lineup__live');
  const openLink = root.querySelector('.nocta-lineup__open');
  const status = root.querySelector('.nocta-lineup__status');
  const button = (action) => root.querySelector(`[data-action="${action}"]`);
  const buttons = { previous: button('previous'), next: button('next'), pause: button('pause'), replay: button('replay') };
  const sources = list ? [...list.querySelectorAll('img')] : [];
  if (!sources.length || !viewport || !stage || !controls || !dotsBox || !live) {
    throw new Error('mountShoeCarousel: items, viewport, stage, controls, dots and live region are required');
  }

  const items = sources.map((img) => ({
    img,
    src: img.getAttribute('src'),
    alt: img.alt,
    href: img.closest('[data-href]')?.dataset.href ?? null,
    aspect: 2,
    mask: null,
  }));
  const n = items.length;
  const clones = n * Math.ceil(BASE_CLONES / n); // 24 for four shoes: the pattern repeats across the wrap
  const halfSpan = (clones * SPACING) / 2; // 42
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new AbortController();
  const { signal } = listeners;
  const cards = [];
  const dots = [];
  const cam = { W: 0, H: 0, aspect: 1, zoom: 1, f: 1, z: CAMERA_Z, k: 1, kRef: 1, ratio: 1, cardW: CARD_WIDTH, cy: CENTRE_Y };
  const s = {
    mode: 'loading',
    destroyed: false,
    paused: false,
    frozen: false, // debug recording only
    reducedMotion: reducedMotionQuery.matches,
    docHidden: document.hidden,
    visibleRatio: 0,
    armed: false, // the opening starts once at least half of the section has been seen
    running: false,
    elapsed: 0,
    position: 0,
    target: 0,
    selected: 0,
    announcements: 0,
    opened: 0,
    pendingOpen: false, // a clicked neighbour opens once it has glided into the centre
    frames: 0,
    renders: 0,
    pointer: { tx: 0, ty: 0, x: 0, y: 0 },
    drag: null,
    lastWheel: -Infinity,
    missing: [],
  };
  let raf = 0;
  let lastNow = 0;
  let io = null;
  let ro = null;

  const setMode = (mode) => {
    s.mode = mode;
    root.dataset.mode = mode;
  };
  setMode('loading');

  // ------------------------------------------------------------------ geometry and rendering

  function layout() {
    if (!viewport.clientWidth || !viewport.clientHeight) return false; // hidden (another view is showing)
    cam.W = viewport.clientWidth;
    cam.H = viewport.clientHeight;
    cam.aspect = cam.H > 0 ? cam.W / cam.H : 1;
    cam.zoom = cam.aspect < PORTRAIT_ASPECT ? PORTRAIT_ZOOM : 1;
    cam.f = cam.H / 2 / Math.tan(FOV / 2);
    cam.kRef = cam.f / (CAMERA_Z_START * cam.zoom); // the largest k of the opening: cards are never upscaled
    cam.ratio = clamp(1440 / Math.max(1, root.clientWidth), 1, 2.4);
    cam.cardW = cam.aspect >= WIDE_ASPECT ? CARD_WIDTH_WIDE : CARD_WIDTH;
    cam.cy = cam.aspect < PORTRAIT_ASPECT ? CENTRE_Y_PORTRAIT : CENTRE_Y;
    // Moving the optical centre moves the stage and the perspective origin together, so the
    // projection stays the camera's (see pointAt / hitTest).
    viewport.style.perspective = `${cam.f.toFixed(3)}px`;
    viewport.style.perspectiveOrigin = `50% ${(cam.cy * 100).toFixed(3)}%`;
    stage.style.top = `${(cam.cy * 100).toFixed(3)}%`;
    for (const card of cards) {
      const half = (cam.cardW * SCALE) / 2;
      card.radius = Math.hypot(half, half / card.aspect);
      const w = cam.cardW * SCALE * cam.kRef;
      const h = w / card.aspect;
      card.el.style.width = `${w.toFixed(2)}px`;
      card.el.style.height = `${h.toFixed(2)}px`;
      card.el.style.left = `${(-w / 2).toFixed(2)}px`;
      card.el.style.top = `${(-h / 2).toFixed(2)}px`;
      card.transform = '';
    }
    return true;
  }

  function brightnessOf(pose, M, ent) {
    return clamp(ENV_LIGHT + (1 - ENV_LIGHT) * (spotIrradiance(pose, M, ent) / REFERENCE_IRRADIANCE), 0, 1.3);
  }

  function render() {
    if (s.mode !== 'ready' || !cam.W) return;
    s.renders++;
    const ent = entranceAt(s.elapsed);
    cam.z = ent.cameraZ * cam.zoom;
    cam.k = cam.f / cam.z;
    const scale = cam.k / cam.kRef;
    const tilt = { x: s.pointer.x, y: s.pointer.y };
    for (const card of cards) {
      const x = wrap(card.index * SPACING - s.position, -halfSpan, halfSpan);
      const pose = cardPose(x, cam.ratio, ent, tilt);
      card.offset = x;
      card.pose = pose;
      const proj = cam.f / (cam.z - pose.z);
      const sx = pose.x * proj;
      const sy = -pose.y * proj;
      const r = card.radius * proj;
      const visible = Math.abs(sx) - r < cam.W / 2 + CULL_MARGIN_PX &&
        sy - r < cam.H * (1 - cam.cy) + CULL_MARGIN_PX && -sy - r < cam.H * cam.cy + CULL_MARGIN_PX;
      if (visible !== card.visible) {
        card.visible = visible;
        card.el.style.visibility = visible ? '' : 'hidden';
      }
      if (!visible) continue;
      card.matrix = poseMatrix(pose);
      const k = cam.k;
      const transform =
        `translate3d(${(pose.x * k).toFixed(2)}px,${(-pose.y * k).toFixed(2)}px,${(pose.z * k).toFixed(2)}px) ` +
        `rotateX(${(-pose.pitch).toFixed(5)}rad) rotateY(${pose.yaw.toFixed(5)}rad) rotateZ(${(-pose.roll).toFixed(5)}rad) ` +
        `scale(${scale.toFixed(5)})`;
      if (transform !== card.transform) {
        card.transform = transform;
        card.el.style.transform = transform;
      }
      if (Math.abs(pose.spin - card.spin) > 1e-5) {
        card.spin = pose.spin;
        card.img.style.transform = pose.spin ? `rotateY(${pose.spin.toFixed(5)}rad)` : '';
      }
      const b = brightnessOf(pose, card.matrix, ent);
      if (Math.abs(b - card.brightness) > 0.002) {
        card.brightness = b;
        card.img.style.filter = `brightness(${b.toFixed(3)})`;
      }
    }
    placeOpenLink();
  }

  /** The focusable link that opens the selected shoe sits exactly over the centre card. */
  function placeOpenLink() {
    if (!openLink) return;
    const centre = cards[mod(Math.round(s.position / SPACING), clones)];
    const box = centre && centre.visible && project(centre.index);
    if (!box) return;
    const rect = root.getBoundingClientRect();
    const vr = viewport.getBoundingClientRect();
    openLink.style.left = `${(box.left - rect.left).toFixed(1)}px`;
    openLink.style.top = `${(box.top - rect.top).toFixed(1)}px`;
    openLink.style.width = `${(box.right - box.left).toFixed(1)}px`;
    openLink.style.height = `${(Math.min(box.bottom, vr.bottom) - box.top).toFixed(1)}px`;
  }

  function syncOpenLink() {
    if (!openLink) return;
    const item = items[s.selected];
    if (item.href) openLink.setAttribute('href', item.href);
    else openLink.removeAttribute('href');
    openLink.setAttribute('aria-label', `Open ${item.alt.replace(/, side view$/, '')}`);
    openLink.hidden = !item.href;
  }

  function selectionInfo() {
    const item = items[s.selected];
    return { index: s.selected, href: item.href, alt: item.alt, element: item.img.closest('li') ?? item.img };
  }

  /** Once a clicked neighbour is (nearly) in the centre, open it. */
  function maybeOpenPending() {
    if (s.pendingOpen && Math.abs(s.target - s.position) < 0.05) {
      s.pendingOpen = false;
      open();
    }
  }

  /** Opens the shoe in the centre (its data-href), as a click on the link would. */
  function open() {
    const item = items[mod(Math.round(s.target / SPACING), n)];
    if (!item.href) return false;
    s.opened++;
    if (options.onOpen) options.onOpen({ index: items.indexOf(item), href: item.href, alt: item.alt });
    else window.location.assign(item.href);
    return true;
  }

  /** World ray through a client point against every visible card; transparent pixels never hit. */
  function hitTest(clientX, clientY) {
    if (s.mode !== 'ready') return null;
    const rect = viewport.getBoundingClientRect();
    const px = clientX - rect.left - rect.width / 2;
    const py = clientY - rect.top - rect.height * cam.cy;
    const origin = [0, 0, cam.z];
    const dir = [px / cam.f, -py / cam.f, -1];
    let best = null;
    for (const card of cards) {
      if (!card.visible || !card.matrix) continue;
      const M = card.matrix;
      const nrm = column(M, 2);
      const denom = dot(dir, nrm);
      if (Math.abs(denom) < 1e-9) continue;
      const centre = [card.pose.x, card.pose.y, card.pose.z];
      const t = dot(sub(centre, origin), nrm) / denom;
      if (!(t > 0)) continue;
      const rel = sub([origin[0] + dir[0] * t, origin[1] + dir[1] * t, origin[2] + dir[2] * t], centre);
      const w = cam.cardW * SCALE;
      const u = dot(rel, column(M, 0)) / w + 0.5;
      const v = 0.5 - dot(rel, column(M, 1)) / (w / card.aspect);
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const mask = items[card.item].mask;
      if (mask && mask.data[Math.min(mask.h - 1, Math.floor(v * mask.h)) * mask.w + Math.min(mask.w - 1, Math.floor(u * mask.w))] < 128) continue;
      if (!best || t < best.t) best = { t, card, u, v };
    }
    return best && { index: best.card.index, item: best.card.item, offset: best.card.offset, u: best.u, v: best.v };
  }

  /** Client coordinates of the point (u, v) of a card's image (0..1, v down), from the world model. */
  function pointAt(index, u, v) {
    const card = cards[index];
    if (!card || !card.pose) return null;
    const rect = viewport.getBoundingClientRect();
    const M = card.matrix || poseMatrix(card.pose);
    const w = cam.cardW * SCALE;
    const a = (u - 0.5) * w;
    const b = (0.5 - v) * (w / card.aspect);
    const p = [card.pose.x + M[0] * a + M[1] * b, card.pose.y + M[3] * a + M[4] * b, card.pose.z + M[6] * a + M[7] * b];
    const proj = cam.f / (cam.z - p[2]);
    return { x: rect.left + rect.width / 2 + p[0] * proj, y: rect.top + rect.height * cam.cy - p[1] * proj };
  }

  /** Projected client-space bounding box of a card (used by the tests against the CSS result). */
  function project(index) {
    const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => pointAt(index, u, v));
    if (!corners[0]) return null;
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  // ------------------------------------------------------------------ motion

  const dragging = () => Boolean(s.drag && s.drag.horizontal);
  const snap = (v) => Math.round(v / SPACING) * SPACING;
  const canRun = () =>
    s.mode === 'ready' && !s.destroyed && !s.paused && !s.frozen && !s.reducedMotion && !s.docHidden && s.visibleRatio > 0 && s.armed;
  const needsFrames = () =>
    s.elapsed < ENTRANCE_S ||
    dragging() ||
    s.position !== s.target ||
    (!dragging() && s.target !== snap(s.target)) ||
    s.pointer.x !== s.pointer.tx ||
    s.pointer.y !== s.pointer.ty;

  function stepMotion(dt) {
    s.frames++;
    if (!s.reducedMotion) s.elapsed = Math.min(ENTRANCE_S, s.elapsed + dt);
    else s.elapsed = ENTRANCE_S;
    if (!dragging()) s.target = snap(s.target);
    const a = 1 - Math.exp(-DAMPING * dt);
    s.position += (s.target - s.position) * a;
    if (Math.abs(s.target - s.position) < 1e-4) s.position = s.target;
    const p = s.pointer;
    p.x += (p.tx - p.x) * a;
    p.y += (p.ty - p.y) * a;
    if (Math.abs(p.tx - p.x) < 0.05) p.x = p.tx;
    if (Math.abs(p.ty - p.y) < 0.05) p.y = p.ty;
  }

  function tick(now) {
    raf = 0;
    if (!canRun()) {
      s.running = false;
      return;
    }
    const dt = clamp((now - lastNow) / 1000, 0, MAX_DT);
    lastNow = now;
    stepMotion(dt);
    render();
    maybeOpenPending();
    if (needsFrames()) raf = requestAnimationFrame(tick);
    else s.running = false;
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    s.running = false;
  }

  /** Paused or reduced motion: selection and drag apply at once, and the clock never moves. */
  function applyInstantly() {
    if (!dragging()) s.target = snap(s.target);
    s.position = s.target;
    if (s.reducedMotion) {
      s.elapsed = ENTRANCE_S;
      s.pointer.x = s.pointer.tx = 0;
      s.pointer.y = s.pointer.ty = 0;
    }
    render();
  }

  function wake() {
    if (s.mode !== 'ready' || s.destroyed || s.frozen) return;
    if (s.paused || s.reducedMotion) {
      applyInstantly();
      maybeOpenPending();
      return;
    }
    if (!canRun() || raf || !needsFrames()) return;
    lastNow = performance.now();
    s.running = true;
    raf = requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------------ selection

  function syncSelection() {
    const sel = mod(Math.round(s.target / SPACING), n);
    dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === sel)));
    if (sel === s.selected) return;
    s.selected = sel;
    syncOpenLink();
    options.onSelect?.(selectionInfo());
    live.textContent = `${items[sel].alt}. ${sel + 1} of ${n}`;
    s.announcements++;
  }

  function move(steps, { keepPending = false } = {}) {
    if (s.mode !== 'ready' || !steps) return;
    if (!keepPending) s.pendingOpen = false;
    s.target = snap(s.target) + steps * SPACING;
    syncSelection();
    wake();
  }

  function select(i) {
    if (s.mode !== 'ready') return;
    const current = mod(Math.round(s.target / SPACING), n);
    let delta = mod(Math.trunc(i) - current, n);
    if (delta > n / 2) delta -= n; // shortest wrapped route (a tie goes forward)
    move(delta);
  }

  function setPaused(paused) {
    s.paused = paused;
    buttons.pause?.setAttribute('aria-pressed', String(paused));
    if (paused) {
      root.dataset.paused = '';
      stop();
    } else {
      delete root.dataset.paused;
      wake();
    }
  }

  function replay() {
    if (s.mode !== 'ready') return;
    stop();
    s.drag = null;
    delete root.dataset.dragging;
    s.elapsed = s.reducedMotion ? ENTRANCE_S : 0;
    s.position = 0;
    s.target = 0;
    s.pointer = { tx: 0, ty: 0, x: 0, y: 0 };
    s.armed = s.visibleRatio > 0 || s.armed;
    syncSelection();
    setPaused(false);
    render();
    wake();
  }

  // ------------------------------------------------------------------ input

  function onPointerDown(e) {
    if (s.mode !== 'ready' || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    s.pendingOpen = false;
    s.drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, lastT: e.timeStamp, lastDelta: 0, horizontal: false, cancelled: false };
  }

  function trackTilt(e) {
    if (e.pointerType === 'touch' || s.reducedMotion) return;
    const rect = root.getBoundingClientRect();
    s.pointer.tx = e.clientX - (rect.left + rect.width / 2);
    s.pointer.ty = e.clientY - (rect.top + rect.height / 2);
  }

  function onPointerMove(e) {
    if (s.mode !== 'ready') return;
    trackTilt(e);
    const d = s.drag;
    if (d && e.pointerId === d.id && !d.cancelled) {
      if (!d.horizontal) {
        const dx = e.clientX - d.x0;
        const dy = e.clientY - d.y0;
        if (Math.abs(dx) > GESTURE_SLOP_PX && Math.abs(dx) > Math.abs(dy)) {
          d.horizontal = true;
          d.lastX = d.x0;
          root.dataset.dragging = '';
          try {
            viewport.setPointerCapture(e.pointerId);
          } catch {
            /* the pointer may already be gone */
          }
        } else if (Math.abs(dy) > GESTURE_SLOP_PX) {
          d.cancelled = true; // a vertical gesture: native page panning keeps it
        }
      }
      if (d.horizontal) {
        const delta = e.clientX - d.lastX;
        d.lastX = e.clientX;
        d.lastDelta = delta;
        d.lastT = e.timeStamp;
        s.target -= delta * DRAG_GAIN;
      }
    }
    if (e.pointerType === 'mouse' && !dragging()) {
      const hit = hitTest(e.clientX, e.clientY);
      const step = Boolean(hit && Math.abs(hit.offset) >= SPACING / 2);
      const opens = Boolean(hit && items[hit.item].href && (step ? options.openNeighbours : s.position === s.target));
      if (opens) viewport.dataset.hover = 'open';
      else if (step) viewport.dataset.hover = 'step';
      else delete viewport.dataset.hover;
    }
    if (!s.paused || dragging()) wake(); // while paused the tilt stays frozen
  }

  function endDrag(e, cancelled) {
    const d = s.drag;
    if (!d || e.pointerId !== d.id) return;
    s.drag = null;
    delete root.dataset.dragging;
    if (d.horizontal) {
      if (!cancelled && e.timeStamp - d.lastT <= THROW_WINDOW_MS) s.target += -d.lastDelta * THROW_GAIN;
      s.target = snap(s.target);
      syncSelection();
      wake();
      return;
    }
    if (cancelled || d.cancelled) return;
    // A click or tap that never became a drag: a neighbouring shoe steps the line-up towards it,
    // the shoe in the centre opens its page.
    const hit = hitTest(e.clientX, e.clientY);
    if (hit && Math.abs(hit.offset) >= SPACING / 2) {
      if (options.openNeighbours && items[hit.item].href) {
        s.pendingOpen = true;
        move(Math.round(hit.offset / SPACING), { keepPending: true });
      } else {
        move(Math.sign(hit.offset));
      }
    } else if (hit && mod(Math.round(s.target / SPACING), clones) === hit.index) open();
  }

  function onPointerLeave(e) {
    if (e.pointerType === 'touch') return;
    s.pointer.tx = 0;
    s.pointer.ty = 0;
    delete viewport.dataset.hover;
    wake();
  }

  function onWheel(e) {
    if (s.mode !== 'ready' || e.ctrlKey) return; // ctrl+wheel is pinch zoom: the browser keeps it
    const amount = e.shiftKey ? e.deltaX || e.deltaY : e.deltaX;
    const horizontal = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horizontal || !amount) return; // vertical wheel scrolls the page as usual
    e.preventDefault();
    if (e.timeStamp - s.lastWheel < WHEEL_THROTTLE_MS) return;
    s.lastWheel = e.timeStamp;
    move(Math.sign(amount));
  }

  function onKeyDown(e) {
    if (s.mode !== 'ready' || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      move(e.key === 'ArrowRight' ? 1 : -1);
    }
  }

  // ------------------------------------------------------------------ setup

  function buildDots() {
    items.forEach((item, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'nocta-lineup__dot';
      dot.setAttribute('aria-label', `Show ${item.alt}`);
      dot.setAttribute('aria-pressed', String(i === s.selected));
      dot.addEventListener('click', () => select(i), { signal });
      dotsBox.append(dot);
      dots.push(dot);
    });
  }

  function buildMask(item) {
    try {
      const w = MASK_WIDTH;
      const h = Math.max(1, Math.round(w / item.aspect));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(item.img, 0, 0, w, h);
      const rgba = ctx.getImageData(0, 0, w, h).data;
      const data = new Uint8Array(w * h);
      for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4 + 3];
      item.mask = { w, h, data };
    } catch {
      item.mask = null; // unreadable pixels: the whole card rectangle counts as a hit
    }
  }

  async function init() {
    const loaded = await Promise.all(items.map((it) => it.img.decode().then(() => true, () => false)));
    await document.fonts?.ready;
    if (s.destroyed) return;
    s.missing = items.filter((_, i) => !loaded[i] || !items[i].img.naturalWidth).map((it) => it.src);
    if (s.missing.length) {
      console.warn(`[nocta-lineup] Missing line-up images: ${s.missing.join(', ')}. Nothing is substituted.`);
      if (status) {
        status.textContent = `Line-up images missing: ${s.missing.join(' · ')}`;
        status.hidden = false;
      }
      setMode('missing');
      return;
    }
    for (const item of items) {
      item.aspect = item.img.naturalWidth / item.img.naturalHeight;
      buildMask(item);
    }
    for (let i = 0; i < clones; i++) {
      const item = i % n;
      const el = document.createElement('div');
      el.className = 'nocta-lineup__card';
      const img = document.createElement('img');
      img.className = 'nocta-lineup__shoe';
      img.src = items[item].src;
      img.alt = '';
      img.draggable = false;
      img.decoding = 'async';
      el.append(img);
      stage.append(el);
      const aspect = items[item].aspect;
      const half = (cam.cardW * SCALE) / 2;
      cards.push({
        index: i,
        item,
        el,
        img,
        aspect,
        radius: Math.hypot(half, half / aspect),
        pose: null,
        matrix: null,
        offset: 0,
        visible: null,
        transform: '',
        spin: Number.NaN,
        brightness: -1,
      });
    }
    await Promise.all(cards.map((c) => c.img.decode().catch(() => {})));
    if (s.destroyed) return;
    buildDots();
    layout();
    setMode('ready');
    syncOpenLink();
    options.onSelect?.(selectionInfo());
    if (s.reducedMotion) s.elapsed = ENTRANCE_S;
    render();
    controls.hidden = false;
    wake();
  }

  viewport.addEventListener('pointerdown', onPointerDown, { passive: true, signal });
  viewport.addEventListener('pointermove', onPointerMove, { passive: true, signal });
  viewport.addEventListener('pointerup', (e) => endDrag(e, false), { passive: true, signal });
  viewport.addEventListener('pointercancel', (e) => endDrag(e, true), { passive: true, signal });
  viewport.addEventListener('pointerleave', onPointerLeave, { passive: true, signal });
  viewport.addEventListener('wheel', onWheel, { passive: false, signal }); // horizontal steps only
  root.addEventListener('keydown', onKeyDown, { signal });
  buttons.previous?.addEventListener('click', () => move(-1), { signal });
  buttons.next?.addEventListener('click', () => move(1), { signal });
  buttons.pause?.addEventListener('click', () => setPaused(!s.paused), { signal });
  buttons.replay?.addEventListener('click', replay, { signal });
  buttons.pause?.setAttribute('aria-pressed', 'false');
  reducedMotionQuery.addEventListener(
    'change',
    () => {
      s.reducedMotion = reducedMotionQuery.matches;
      if (s.reducedMotion) {
        stop();
        applyInstantly();
      } else {
        wake();
      }
    },
    { signal },
  );
  document.addEventListener(
    'visibilitychange',
    () => {
      s.docHidden = document.hidden;
      if (s.docHidden) stop();
      else wake();
    },
    { signal },
  );
  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        s.visibleRatio = entry.isIntersecting ? entry.intersectionRatio : 0;
        if (s.visibleRatio >= 0.5) s.armed = true;
      }
      if (s.visibleRatio > 0) wake();
      else stop();
    },
    { threshold: [0, 0.5] },
  );
  io.observe(root);
  ro = new ResizeObserver(() => {
    if (s.mode !== 'ready' || !layout()) return;
    render();
  });
  ro.observe(viewport);
  init();

  function destroy() {
    if (s.destroyed) return;
    s.destroyed = true;
    stop();
    listeners.abort();
    io.disconnect();
    ro.disconnect();
    stage.replaceChildren();
    dotsBox.replaceChildren();
    cards.length = 0;
    dots.length = 0;
    controls.hidden = true;
    if (openLink) {
      openLink.hidden = true;
      openLink.removeAttribute('style');
    }
    if (status) {
      status.hidden = true;
      status.textContent = '';
    }
    live.textContent = '';
    viewport.style.perspective = '';
    viewport.style.perspectiveOrigin = '';
    stage.style.top = '';
    delete viewport.dataset.hover;
    delete root.dataset.mode;
    delete root.dataset.paused;
    delete root.dataset.dragging;
  }

  const api = {
    next: () => move(1),
    previous: () => move(-1),
    select,
    open,
    replay,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    destroy,
    state: {
      get mode() {
        return s.mode;
      },
      get selected() {
        return s.selected;
      },
      get paused() {
        return s.paused;
      },
    },
  };
  if (options.debug) {
    api.debug = {
      getState: () => ({
        mode: s.mode,
        destroyed: s.destroyed,
        paused: s.paused,
        frozen: s.frozen,
        reducedMotion: s.reducedMotion,
        docHidden: s.docHidden,
        running: s.running,
        armed: s.armed,
        visibleRatio: s.visibleRatio,
        elapsed: s.elapsed,
        position: s.position,
        target: s.target,
        selected: s.selected,
        announcements: s.announcements,
        opened: s.opened,
        pendingOpen: s.pendingOpen,
        live: live.textContent,
        frames: s.frames,
        renders: s.renders,
        items: n,
        clones,
        missing: [...s.missing],
        camera: { ...cam },
        entrance: entranceAt(s.elapsed),
        pointer: { ...s.pointer },
        cards: cards.map((c) => ({
          index: c.index,
          item: c.item,
          offset: c.offset,
          visible: c.visible,
          brightness: c.brightness,
          aspect: c.aspect,
          pose: c.pose && { ...c.pose },
        })),
      }),
      project,
      pointAt,
      hitTest,
      freeze() {
        s.frozen = true;
        stop();
      },
      unfreeze() {
        s.frozen = false;
        wake();
      },
      advance(ms = 1000 / 60) {
        const steps = Math.max(1, Math.round(ms / (1000 / 60)));
        s.armed = true;
        for (let i = 0; i < steps; i++) stepMotion(1 / 60);
        render();
        maybeOpenPending();
      },
    };
  }
  return api;
}
