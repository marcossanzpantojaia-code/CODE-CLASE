// Browser verification for the NOCTA / After Dark fluid reveal.
//
//   node nocta-after-dark/tests/verify.mjs [--out <dir>]
//
// Mechanics are measured with TEST-ONLY synthetic silhouettes (tests/fixtures.mjs) served by
// route interception, because their colours and geometry are known. The real product photos are
// checked separately (load, transparency, aspect, alignment) and screenshotted for human review;
// a missing pair is reported, never substituted.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { APP_ROOT, startServer } from './serve.mjs';
import { SILHOUETTE_ASPECT, makeFixturePair } from './fixtures.mjs';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  process.stderr.write('Playwright is required: npm i -D playwright (or run where it is preinstalled).\n');
  process.exit(2);
}
const { chromium, devices } = playwright;

const argOut = process.argv.indexOf('--out');
const OUT = path.resolve(argOut > 0 ? process.argv[argOut + 1] : path.join(os.tmpdir(), 'nocta-verify'));
await mkdir(OUT, { recursive: true });

const REAL = {
  black: path.join(APP_ROOT, 'assets/nocta-hot-step-2-black.png'),
  white: path.join(APP_ROOT, 'assets/nocta-hot-step-2-white.png'),
};
const realAssetsPresent = existsSync(REAL.black) && existsSync(REAL.white);
const FIXTURES = makeFixturePair();

const results = [];
let scenario = '';
function check(name, ok, detail = '') {
  results.push({ scenario, name, ok: Boolean(ok), detail });
  process.stdout.write(`${ok ? '  PASS' : '  FAIL'}  ${name}${detail ? `  (${detail})` : ''}\n`);
}
function section(name) {
  scenario = name;
  process.stdout.write(`\n${name}\n`);
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;
const fmt = (n, d = 3) => Number(n).toFixed(d);

const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const PASSIVE_PROBE = () => {
  window.__listenerLog = [];
  const original = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (/^(touch|pointer|wheel|mouse)/.test(type) && this instanceof Element) {
      window.__listenerLog.push({ type, passive: typeof opts === 'object' && opts !== null && opts.passive === true });
    }
    return original.call(this, type, fn, opts);
  };
};

async function open(contextOptions = {}, { fixtures = true, query = '?debug&noidle&lockstep', init = [] } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...contextOptions });
  const log = { pageErrors: [], consoleErrors: [], external: [], failed: [] };
  if (fixtures) {
    await context.route('**/assets/nocta-hot-step-2-*.png', (route) => {
      const fx = route.request().url().includes('-black') ? FIXTURES.black : FIXTURES.white;
      return route.fulfill({ status: 200, contentType: 'image/png', body: fx.png });
    });
  }
  for (const script of init) await context.addInitScript(script);
  const page = await context.newPage();
  page.on('pageerror', (e) => log.pageErrors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && log.consoleErrors.push(m.text()));
  page.on('request', (r) => {
    const url = r.url();
    if (!url.startsWith(origin) && !url.startsWith('data:')) log.external.push(url);
  });
  page.on('response', (r) => r.status() >= 400 && log.failed.push(`${r.status()} ${r.url()}`));
  page.on('requestfailed', (r) => log.failed.push(`failed ${r.url()}`));
  await page.goto(`${origin}/${query}`);
  await page.waitForFunction(() => window.__noctaReveal?.debug.getState().mode !== 'loading', null, {
    timeout: 30000,
  });
  return { context, page, log };
}

const getState = (page) => page.evaluate(() => window.__noctaReveal.debug.getState());

async function waitSteps(page, n) {
  const s0 = (await getState(page)).stats.steps;
  await page.waitForFunction(
    ([s, k]) => window.__noctaReveal.debug.getState().stats.steps >= s + k,
    [s0, n],
    { timeout: 120000, polling: 'raf' },
  );
}

/** Waits for n component ticks (in lockstep: one 60 Hz simulation step each while awake). */
async function waitTicks(page, n) {
  const t0 = (await getState(page)).stats.ticks;
  await page.waitForFunction(
    ([t, k]) => window.__noctaReveal.debug.getState().stats.ticks >= t + k,
    [t0, n],
    { timeout: 60000, polling: 'raf' },
  );
}

async function waitFrames(page, n) {
  await page.evaluate(
    (k) => new Promise((resolve) => {
      let i = 0;
      const f = () => (++i >= k ? resolve() : requestAnimationFrame(f));
      requestAnimationFrame(f);
    }),
    n,
  );
}

async function waitReveal(page, predicate, timeout = 120000) {
  await page.waitForFunction(`(${predicate})(window.__noctaReveal.debug.getState())`, null, {
    timeout,
    polling: 'raf',
  });
}

/** Canvas pixel classes: backdrop (<80), black stand-in (80..189), white stand-in (>=190). */
async function canvasStats(page, grid = 48) {
  return page.evaluate((grid) => {
    const api = window.__noctaReveal.debug;
    const st = api.getState();
    const shot = api.readCanvas();
    if (!shot) return null;
    const { width: w, height: h, data } = shot;
    const sx = st.frame[0] / w;
    const sy = st.frame[1] / h;
    const p = st.planes.product;
    const box = () => ({ x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity });
    const wb = box();
    const bb = box();
    let white = 0;
    let black = 0;
    let topWhite = 0;
    let topShoe = 0;
    let botWhite = 0;
    let botShoe = 0;
    let bgMax = 0;
    const gx = grid;
    const gy = Math.round((grid * h) / w);
    const cells = new Float32Array(gx * gy);
    for (let y = 0; y < h; y++) {
      const yd = (h - 1 - y) * sy; // DOM y in CSS px
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const xd = x * sx;
        const cls = l >= 190 ? 2 : l >= 80 ? 1 : 0;
        if (cls === 0) {
          const m = p.width * 0.04;
          const away = xd < p.left - m || xd > p.left + p.width + m || yd < p.top - m || yd > p.top + p.height + m;
          if (away && l > bgMax) bgMax = l;
          continue;
        }
        const b = cls === 2 ? wb : bb;
        if (xd < b.x0) b.x0 = xd;
        if (xd > b.x1) b.x1 = xd;
        if (yd < b.y0) b.y0 = yd;
        if (yd > b.y1) b.y1 = yd;
        if (cls === 2) {
          white++;
          cells[Math.min(gy - 1, Math.floor((yd / st.frame[1]) * gy)) * gx + Math.min(gx - 1, Math.floor((xd / st.frame[0]) * gx))]++;
        } else black++;
        const top = yd < p.top + p.height / 2;
        if (top) {
          topShoe++;
          if (cls === 2) topWhite++;
        } else {
          botShoe++;
          if (cls === 2) botWhite++;
        }
      }
    }
    const fin = (b) => (Number.isFinite(b.x0) ? { x0: b.x0, y0: b.y0, x1: b.x1 + sx, y1: b.y1 + sy } : null);
    return {
      white,
      black,
      whiteFraction: white / Math.max(1, white + black),
      topWhiteFraction: topWhite / Math.max(1, topShoe),
      bottomWhiteFraction: botWhite / Math.max(1, botShoe),
      whiteBox: fin(wb),
      blackBox: fin(bb),
      bgMax,
      cells: Array.from(cells, (c) => (c > 0 ? 1 : 0)),
      reveal: st.reveal,
    };
  }, grid);
}

async function velocityStats(page) {
  return page.evaluate(() => {
    const v = window.__noctaReveal.debug.readVelocity();
    if (!v) return null;
    const { width: w, height: h, data } = v;
    const vx = (x, y) => data[(y * w + x) * 4];
    const vy = (x, y) => data[(y * w + x) * 4 + 1];
    let maxLen = 0;
    let curlPos = 0;
    let curlNeg = 0;
    let divAbs = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const len = Math.hypot(vx(x, y), vy(x, y));
        if (len > maxLen) maxLen = len;
        const curl = (vy(x + 1, y) - vy(x - 1, y)) / 2 - (vx(x, y + 1) - vx(x, y - 1)) / 2;
        if (curl > 0) curlPos += curl;
        else curlNeg -= curl;
        divAbs += Math.abs((vx(x + 1, y) - vx(x - 1, y)) / 2 + (vy(x, y + 1) - vy(x, y - 1)) / 2);
      }
    }
    return { maxLen, curlPos, curlNeg, divAbs, w, h };
  });
}

const iou = (a, b) => {
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] && b[i]) inter++;
    if (a[i] || b[i]) union++;
  }
  return union ? inter / union : 1;
};

async function frameBox(page) {
  return page.locator('.nocta-reveal__frame').boundingBox();
}

/** One pointer sample per simulation step (60 Hz-equivalent motion). */
async function mousePath(page, points) {
  for (const [x, y] of points) {
    await page.mouse.move(x, y);
    await waitTicks(page, 1);
  }
}

function sweepPoints(box, product, n, from, to, wobble = 0) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = from + (to - from) * t;
    pts.push([
      box.x + product.left + product.width * u,
      box.y + product.top + product.height * (0.55 + wobble * Math.sin(t * Math.PI * 3)),
    ]);
  }
  return pts;
}

function hygiene(log, { allowMissing = false } = {}) {
  check('no uncaught page errors', log.pageErrors.length === 0, log.pageErrors.join(' | '));
  const consoleErrors = allowMissing
    ? log.consoleErrors.filter((m) => !/Missing product photography|404/.test(m))
    : log.consoleErrors;
  check('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));
  check('no external runtime requests', log.external.length === 0, log.external.join(' | '));
  const failed = allowMissing ? log.failed.filter((f) => !/nocta-hot-step-2-(black|white)\.png/.test(f)) : log.failed;
  check('no missing files / failed requests', failed.length === 0, failed.join(' | '));
}

async function noOverflow(page) {
  const o = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    sh: document.documentElement.scrollHeight,
    ih: window.innerHeight,
  }));
  check('no horizontal overflow', o.sw <= o.iw, `scrollWidth ${o.sw} / innerWidth ${o.iw}`);
  check('no vertical overflow beyond the 100svh hero', o.sh <= o.ih + 1, `scrollHeight ${o.sh} / innerHeight ${o.ih}`);
}

async function geometryChecks(page, label) {
  const st = await getState(page);
  const [W, H] = st.frame;
  const { black, white, product } = st.planes;
  const pb = st.photos.black;
  const pw = st.photos.white;
  check(`${label}: black plane keeps natural aspect`, near(black.width / black.height, pb.width / pb.height, 1e-9),
    `${fmt(black.width / black.height, 6)} vs ${fmt(pb.width / pb.height, 6)}`);
  check(`${label}: white plane keeps natural aspect`, near(white.width / white.height, pw.width / pw.height, 1e-9),
    `${fmt(white.width / white.height, 6)} vs ${fmt(pw.width / pw.height, 6)}`);
  check(`${label}: product width <= .86 W`, product.width <= 0.86 * W + 1e-6, `${fmt(product.width, 1)} / ${fmt(W, 1)}`);
  check(`${label}: product fully inside frame`,
    product.left >= 0 && product.top >= 0 && product.left + product.width <= W + 1e-6 && product.top + product.height <= H + 1e-6);
  check(`${label}: product centred at (.5 W, .54 H)`,
    near(product.left + product.width / 2, 0.5 * W, 0.01) && near(product.top + product.height / 2, 0.54 * H, 0.01));
  const bp = black.product;
  check(`${label}: black and white product boxes coincide (uniform scale + translation only)`,
    near(bp.left, product.left, 1.5) && near(bp.top, product.top, 1.5) && near(bp.width, product.width, 0.01) && near(bp.height, product.height, 1.5),
    `black ${fmt(bp.left, 1)},${fmt(bp.top, 1)} ${fmt(bp.width, 1)}x${fmt(bp.height, 1)} / white ${fmt(product.left, 1)},${fmt(product.top, 1)} ${fmt(product.width, 1)}x${fmt(product.height, 1)}`);
  const expectCanvas = [Math.round(W * Math.min(st.dpr, 1.5)), Math.round(H * Math.min(st.dpr, 1.5))];
  check(`${label}: canvas = CSS size x min(DPR, 1.5)`, st.canvas[0] === expectCanvas[0] && st.canvas[1] === expectCanvas[1],
    `${st.canvas.join('x')} (dpr cap ${st.dpr})`);
  const expectSim = [Math.round(W * 0.1), Math.round(H * 0.1)];
  check(`${label}: simulation = round(frame CSS size x .1)`, st.sim[0] === expectSim[0] && st.sim[1] === expectSim[1], st.sim.join('x'));
  check(`${label}: cell scale px = (1/110, simW/simH/110)`,
    near(st.px[0], 1 / 110, 1e-12) && near(st.px[1], st.sim[0] / st.sim[1] / 110, 1e-12));
  return st;
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
}

// =========================================================================== desktop

section('Desktop 1440x1000: rest, alignment, fluid, wipe, keyboard');
{
  const { context, page, log } = await open();
  const st = await getState(page);
  check('WebGL path active', st.mode === 'webgl', `mode=${st.mode} WebGL${st.glVersion} ${st.floatFormat}`);
  check('renderable float buffers', /16F|half|float/i.test(st.floatFormat ?? ''), st.floatFormat);
  await geometryChecks(page, 'desktop');

  const rest = await canvasStats(page);
  check('black stand-in visible at rest', rest.black > 50000, `${rest.black} px`);
  check('no white at rest', rest.white === 0, `${rest.white} px`);
  check('backdrop stays near-black (#050505 base, restrained glow)', rest.bgMax < 40, `max backdrop luminance ${fmt(rest.bgMax, 1)}`);
  const p = st.planes.product;
  const bAspect = (rest.blackBox.x1 - rest.blackBox.x0) / (rest.blackBox.y1 - rest.blackBox.y0);
  check('rendered black silhouette keeps fixture aspect', near(bAspect, SILHOUETTE_ASPECT, SILHOUETTE_ASPECT * 0.01),
    `${fmt(bAspect)} vs ${SILHOUETTE_ASPECT}`);
  check('rendered black silhouette sits on the planned product box (+/-2 px)',
    near(rest.blackBox.x0, p.left, 2) && near(rest.blackBox.x1, p.left + p.width, 2) &&
      near(rest.blackBox.y0, p.top, 2) && near(rest.blackBox.y1, p.top + p.height, 2),
    `${fmt(rest.blackBox.x0, 1)},${fmt(rest.blackBox.y0, 1)} -> ${fmt(rest.blackBox.x1, 1)},${fmt(rest.blackBox.y1, 1)}`);
  await shot(page, 'desktop-rest');

  // --- fluid: pointer reveals white, field keeps evolving after the pointer stops, then decays.
  const box = await frameBox(page);
  await page.mouse.move(box.x + p.left + p.width * 0.92, box.y + p.top + p.height * 0.55);
  await waitTicks(page, 1);
  await mousePath(page, sweepPoints(box, p, 40, 0.92, 0.12, 0.18));
  const f1 = await canvasStats(page);
  const v1 = await velocityStats(page);
  check('pointer motion reveals the white stand-in', f1.white > 3000, `${f1.white} white px, ${fmt(f1.whiteFraction * 100, 1)}% of silhouette`);
  check('reveal is partial (temporary cut-outs, not a full swap)', f1.whiteFraction > 0.01 && f1.whiteFraction < 0.8, fmt(f1.whiteFraction));
  check('velocity field carries both rotation senses (vortex pair = real curl)',
    v1.curlPos > 0.15 * (v1.curlPos + v1.curlNeg) && v1.curlNeg > 0.15 * (v1.curlPos + v1.curlNeg),
    `curl+ ${fmt(v1.curlPos, 2)} / curl- ${fmt(v1.curlNeg, 2)}`);
  await shot(page, 'desktop-fluid-1');
  await waitSteps(page, 12);
  const f2 = await canvasStats(page);
  const v2 = await velocityStats(page);
  const overlap = iou(f1.cells, f2.cells);
  check('revealed shape keeps advecting after the pointer stops (not a cursor spotlight)',
    f2.white > 0 && overlap < 0.95, `IoU 12 steps later = ${fmt(overlap)}`);
  check('velocity decays without input', v2.maxLen < v1.maxLen, `max |v| ${fmt(v1.maxLen)} -> ${fmt(v2.maxLen)}`);
  await shot(page, 'desktop-fluid-2');
  await waitSteps(page, 30);
  const v3 = await velocityStats(page);
  check('decay continues monotonically', v3.maxLen < v2.maxLen, `max |v| ${fmt(v2.maxLen)} -> ${fmt(v3.maxLen)}`);
  await page.mouse.move(box.x + 12, box.y - 24); // park the pointer outside the frame (over the title)
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().asleep, null, { timeout: 180000, polling: 'raf' });
  const f4 = await canvasStats(page);
  check('fluid fully dissipates back to black', f4.white === 0, `${f4.white} white px after sleep`);

  // --- full wipe, bottom to top, reversible without jumps.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  check('click toggles aria-pressed=true', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'true');
  await waitReveal(page, '(s) => s.reveal > 0.35 && s.reveal < 0.7');
  const mid = await canvasStats(page);
  check('wipe travels bottom-to-top', mid.bottomWhiteFraction > mid.topWhiteFraction + 0.2,
    `reveal ${fmt(mid.reveal)}: bottom ${fmt(mid.bottomWhiteFraction)} vs top ${fmt(mid.topWhiteFraction)} white`);
  await shot(page, 'desktop-wipe-mid');
  await waitReveal(page, '(s) => s.reveal === 1');
  const full = await canvasStats(page);
  check('full reveal shows only the white stand-in (>=99%; remainder = anti-aliased edges)', full.whiteFraction >= 0.99 && full.white > 50000,
    `white ${fmt(full.whiteFraction * 100, 2)}% of silhouette pixels`);
  const wbx = full.whiteBox;
  check('white silhouette aligns with black silhouette (toe, heel, sole, collar +/-2 px)',
    near(wbx.x0, rest.blackBox.x0, 2) && near(wbx.x1, rest.blackBox.x1, 2) && near(wbx.y0, rest.blackBox.y0, 2) && near(wbx.y1, rest.blackBox.y1, 2),
    `white ${fmt(wbx.x0, 1)},${fmt(wbx.y0, 1)}->${fmt(wbx.x1, 1)},${fmt(wbx.y1, 1)}`);
  check('canvas label follows the state', (await page.getAttribute('.nocta-reveal__canvas', 'aria-label')).includes('white'));
  await shot(page, 'desktop-white');

  // Reverse mid-flight and record every frame.
  await page.click('.nocta-reveal__toggle');
  await waitReveal(page, '(s) => s.reveal < 0.6');
  const samples = await page.evaluate(
    () => new Promise((resolve) => {
      const out = [];
      const api = window.__noctaReveal;
      let n = 0;
      const f = () => {
        out.push(api.debug.getState().reveal);
        if (n === 4) api.toggle();
        if (++n < 90) requestAnimationFrame(f);
        else resolve(out);
      };
      requestAnimationFrame(f);
    }),
  );
  const maxJump = Math.max(...samples.slice(1).map((v, i) => Math.abs(v - samples[i])));
  const minAfter = Math.min(...samples.slice(0, 20));
  check('reversal mid-wipe is continuous (no jumps)', maxJump < 0.08, `max per-frame change ${fmt(maxJump)}`);
  check('reversal changes direction', samples[samples.length - 1] > minAfter + 0.05,
    `min ${fmt(minAfter)} -> end ${fmt(samples[samples.length - 1])}`);
  await page.click('.nocta-reveal__toggle');
  await waitReveal(page, '(s) => s.reveal === 0');
  const back = await canvasStats(page);
  check('second activation restores black', back.white === 0 && back.black > 50000);

  // --- keyboard
  // Clicking the (non-focusable) title resets the sequential focus start point before the button.
  await page.mouse.click(box.x + 12, box.y - 24);
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { cls: el.className, visible: el.matches(':focus-visible'), style: cs.outlineStyle, width: cs.outlineWidth };
  });
  check('Tab reaches the reveal button', focus.cls.includes('nocta-reveal__toggle'), focus.cls);
  check('visible focus indicator', focus.visible && focus.style === 'solid' && parseFloat(focus.width) >= 2, `${focus.style} ${focus.width}`);
  await shot(page, 'desktop-focus');
  await page.keyboard.press('Enter');
  check('Enter toggles on', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'true');
  await page.keyboard.press('Space');
  check('Space toggles off', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'false');
  await page.keyboard.press('Space');
  check('Space toggles on again', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'true');
  await page.keyboard.press('Enter');
  await waitReveal(page, '(s) => s.reveal === 0');
  const access = await page.evaluate(() => {
    const b = document.querySelector('.nocta-reveal__toggle');
    return { tag: b.tagName, type: b.type, label: b.getAttribute('aria-label'), nested: b.querySelectorAll('a,button,input,select,textarea,[tabindex]').length };
  });
  check('native button with accessible name, no nested controls',
    access.tag === 'BUTTON' && access.type === 'button' && access.label === 'Reveal white Nike NOCTA Hot Step 2' && access.nested === 0);
  const titleOutside = await page.evaluate(() => {
    const t = document.querySelector('.nocta-reveal__title').getBoundingClientRect();
    const f = document.querySelector('.nocta-reveal__frame').getBoundingClientRect();
    return t.bottom <= f.top + 0.5;
  });
  check('editorial title sits outside the canvas frame', titleOutside);
  await noOverflow(page);

  // --- context loss and restore
  await page.evaluate(() => {
    window.__testLoseContext = window.__noctaReveal.debug.loseContext();
    window.__testLoseContext.loseContext();
  });
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().mode === 'fallback');
  const lost = await page.evaluate(() => {
    const img = document.querySelector('.nocta-reveal__photo--black');
    return { hidden: img.hidden, display: getComputedStyle(img).display };
  });
  check('context loss falls back to the static black photo', !lost.hidden && lost.display !== 'none');
  await page.evaluate(() => window.__testLoseContext.restoreContext());
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().mode === 'webgl', null, { timeout: 30000 });
  const restored = await canvasStats(page);
  check('context restore resumes WebGL rendering', restored.black > 50000);
  hygiene(log);
  await context.close();
}

// =========================================================================== idle + pause

section('Idle sweep, offscreen and hidden-tab pause');
{
  const { context, page, log } = await open({}, { query: '?debug' });
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().idleActive, null, { timeout: 30000, polling: 'raf' });
  const t1 = await page.evaluate(() => performance.now());
  check('idle sweep starts after ~2 s without pointer input', t1 >= 2000 && t1 < 6000, `${fmt(t1 / 1000, 2)} s after navigation start`);
  let idleWhite = 0;
  for (let i = 0; i < 12 && idleWhite === 0; i++) {
    await page.waitForTimeout(250);
    idleWhite = (await canvasStats(page)).white;
  }
  check('idle sweep reveals white through the fluid', idleWhite > 0, `${idleWhite} white px`);
  await shot(page, 'idle-sweep');
  const box = await frameBox(page);
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.5);
  const after = await getState(page);
  check('idle stops as soon as the visitor moves the pointer', !after.idleActive && after.pointer.source === 'mouse');

  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.id = 'test-spacer';
    spacer.style.height = '3000px';
    document.body.append(spacer);
    window.scrollTo(0, 2500);
  });
  await page.waitForFunction(() => !window.__noctaReveal.debug.getState().running, null, { timeout: 10000 });
  const s0 = (await getState(page)).stats.steps;
  await page.waitForTimeout(800);
  const off = await getState(page);
  check('offscreen: loop paused, no simulation steps, no idle', !off.running && off.stats.steps === s0 && !off.idleActive);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().running, null, { timeout: 10000 });
  check('back in view: loop resumes', (await getState(page)).running);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const hidden = await getState(page);
  check('document hidden: loop paused', !hidden.running && hidden.docHidden);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  check('document visible again: loop resumes', (await getState(page)).running);
  hygiene(log);
  await context.close();
}

// =========================================================================== reduced motion

section('Reduced motion');
{
  const { context, page, log } = await open({ reducedMotion: 'reduce' }, { query: '?debug' });
  const st = await getState(page);
  check('reduced motion uses the static mode', st.mode === 'static', st.mode);
  const box = await frameBox(page);
  const p = st.planes.product;
  for (const [x, y] of sweepPoints(box, p, 20, 0.9, 0.1, 0.2)) await page.mouse.move(x, y);
  await page.waitForTimeout(2600);
  const rm = await getState(page);
  const px = await canvasStats(page);
  check('no fluid, no idle, no parallax', rm.stats.steps === 0 && !rm.idleActive && px.white === 0 && rm.parallax.x === 0.5,
    `steps ${rm.stats.steps}, idle ${rm.idleActive}, white ${px.white}`);
  check('static black photo shown', px.black > 50000);
  await page.click('.nocta-reveal__toggle');
  const on = await canvasStats(page);
  check('toggle still works, switching instantly (no wipe animation)', on.reveal === 1 && on.white > 50000 && on.whiteFraction >= 0.99);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().mode === 'webgl');
  check('preference change at runtime switches back to WebGL motion', true);
  hygiene(log);
  await context.close();
}

// =========================================================================== fallbacks

for (const [label, script] of [
  ['No WebGL', () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...rest);
    };
  }],
  ['No renderable float buffers', () => {
    for (const C of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      const original = C.prototype.getExtension;
      C.prototype.getExtension = function (name) {
        return /color_buffer|texture_half_float|texture_float/i.test(name) ? null : original.call(this, name);
      };
    }
  }],
]) {
  section(`Fallback: ${label}`);
  const { context, page, log } = await open({}, { init: [script], query: '?debug' });
  const st = await getState(page);
  check('static fallback mode', st.mode === 'fallback', st.mode);
  const fb = await page.evaluate(() => {
    const img = document.querySelector('.nocta-reveal__photo--black');
    const r = img.getBoundingClientRect();
    return {
      shown: !img.hidden && getComputedStyle(img).display !== 'none' && getComputedStyle(img).opacity === '1',
      alt: img.alt,
      ratio: r.width / r.height,
      natural: img.naturalWidth / img.naturalHeight,
      canvases: document.querySelectorAll('canvas').length,
      canvasVisible: getComputedStyle(document.querySelector('.nocta-reveal__canvas')).visibility,
    };
  });
  check('real black photo element shown with accessible alt', fb.shown && fb.alt === 'Nike NOCTA Hot Step 2 in black, side view');
  check('fallback photo keeps natural aspect', near(fb.ratio, fb.natural, fb.natural * 0.002), `${fmt(fb.ratio, 4)} vs ${fmt(fb.natural, 4)}`);
  check('exactly one canvas, hidden', fb.canvases === 1 && fb.canvasVisible === 'hidden');
  await page.click('.nocta-reveal__toggle');
  const swapped = await page.evaluate(() => ({
    white: !document.querySelector('.nocta-reveal__photo--white').hidden,
    black: !document.querySelector('.nocta-reveal__photo--black').hidden,
    pressed: document.querySelector('.nocta-reveal__toggle').getAttribute('aria-pressed'),
  }));
  check('interaction not broken: toggle swaps to the white photo', swapped.white && !swapped.black && swapped.pressed === 'true');
  await shot(page, `fallback-${label.toLowerCase().replace(/\W+/g, '-')}`);
  hygiene(log);
  await context.close();
}

// =========================================================================== phone

section('Phone 390x844 (iPhone UA, touch, DPR 3)');
{
  const { userAgent } = devices['iPhone 13'];
  const { context, page, log } = await open(
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent },
    { init: [PASSIVE_PROBE] },
  );
  const st = await geometryChecks(page, 'phone');
  check('pixel ratio capped at 1.5', st.dpr === 1.5, `dpr ${st.dpr}`);
  const listeners = await page.evaluate(() => window.__listenerLog);
  const active = listeners.filter((l) => !l.passive);
  check('all touch/pointer listeners are passive', listeners.length >= 6 && active.length === 0,
    `${listeners.length} listeners, non-passive: ${active.map((l) => l.type).join(',') || 'none'}`);
  await noOverflow(page);

  const cdp = await context.newCDPSession(page);
  const box = await frameBox(page);
  const p = st.planes.product;
  const pts = sweepPoints(box, p, 30, 0.9, 0.1, 0.25);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
  await waitTicks(page, 1);
  for (const [x, y] of pts.slice(1)) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await waitTicks(page, 1);
  }
  const touchStats = await canvasStats(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  check('touch drag reveals white through the fluid', touchStats.white > 200, `${touchStats.white} white px`);
  await shot(page, 'phone-touch-fluid');
  check('touch drag did not toggle', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'false');
  await page.tap('.nocta-reveal__toggle');
  check('tap toggles the full reveal', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'true');
  await waitReveal(page, '(s) => s.reveal === 1');
  await shot(page, 'phone-white');
  await page.tap('.nocta-reveal__toggle');
  check('second tap restores black', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'false');

  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '1600px';
    document.body.append(spacer);
  });
  await waitFrames(page, 2);
  // A real touch drag (synthesizeScrollGesture does not scroll in headless Chromium, even off the component).
  const sx = Math.round(box.x + box.width / 2);
  const sy = Math.round(box.y + box.height * 0.7);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy }] });
  for (let i = 1; i <= 20; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx, y: sy - i * 20 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(400);
  const scrollY = await page.evaluate(() => window.scrollY);
  check('vertical touch drag over the artwork scrolls the page', scrollY > 150, `scrollY ${scrollY}`);
  check('scrolling drag did not toggle', (await page.getAttribute('.nocta-reveal__toggle', 'aria-pressed')) === 'false');
  hygiene(log);
  await context.close();
}

// =========================================================================== tablet

section('Tablet 820x1180 (iPad UA, touch, DPR 2)');
{
  const { userAgent } = devices['iPad Pro 11'];
  const { context, page, log } = await open({
    viewport: { width: 820, height: 1180 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent,
  });
  await geometryChecks(page, 'tablet');
  await noOverflow(page);
  const rest = await canvasStats(page);
  check('black at rest on tablet', rest.white === 0 && rest.black > 20000);
  await page.tap('.nocta-reveal__toggle');
  await waitReveal(page, '(s) => s.reveal === 1');
  const full = await canvasStats(page);
  check('tap reveals white on tablet, silhouettes aligned (+/-2 px)',
    full.whiteFraction >= 0.99 && near(full.whiteBox.x0, rest.blackBox.x0, 2) && near(full.whiteBox.x1, rest.blackBox.x1, 2) &&
      near(full.whiteBox.y0, rest.blackBox.y0, 2) && near(full.whiteBox.y1, rest.blackBox.y1, 2));
  await shot(page, 'tablet-white');
  hygiene(log);
  await context.close();
}

// =========================================================================== resize + unmount

section('Resize and unmount');
{
  const { context, page, log } = await open();
  for (const [w, h] of [[1024, 700], [600, 900], [1920, 600], [1440, 1000]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForFunction(([ww]) => Math.abs(window.__noctaReveal.debug.getState().frame[0] - ww) < 1, [w]);
    await waitFrames(page, 2);
    await geometryChecks(page, `${w}x${h}`);
    const s = await canvasStats(page);
    const a = (s.blackBox.x1 - s.blackBox.x0) / (s.blackBox.y1 - s.blackBox.y0);
    check(`${w}x${h}: rendered silhouette aspect unchanged`, near(a, SILHOUETTE_ASPECT, SILHOUETTE_ASPECT * 0.015), fmt(a));
  }
  const before = await getState(page);
  check('GL objects are tracked while mounted', before.liveGLObjects > 10, `${before.liveGLObjects} objects`);
  const after = await page.evaluate(() => {
    const api = window.__noctaReveal;
    api.destroy();
    const s = api.debug.getState();
    const img = document.querySelector('.nocta-reveal__photo--black');
    return { s, imgShown: !img.hidden, canvases: document.querySelectorAll('canvas').length, mode: document.querySelector('[data-nocta-reveal]').dataset.mode };
  });
  check('destroy releases every texture/program/buffer/framebuffer', after.s.liveGLObjects === 0, `${after.s.liveGLObjects} left`);
  check('destroy stops the loop and observers', !after.s.running && after.s.destroyed);
  check('destroy restores the static markup', after.imgShown && after.canvases === 1 && after.mode === undefined);
  const remount = await page.evaluate(async () => {
    const { mountNoctaFluidReveal } = await import(new URL('src/nocta-fluid-reveal.js', document.baseURI).href);
    const api = mountNoctaFluidReveal(document.querySelector('[data-nocta-reveal]'), { debug: true });
    await new Promise((r) => {
      const t = () => (api.debug.getState().mode === 'loading' ? requestAnimationFrame(t) : r());
      t();
    });
    const mode = api.debug.getState().mode;
    api.destroy();
    return mode;
  });
  check('component can be mounted again after destroy', remount === 'webgl', remount);
  hygiene(log);
  await context.close();
}

// =========================================================================== real assets

section(realAssetsPresent ? 'Real product photography' : 'Real product photography (missing)');
{
  const { context, page, log } = await open({}, { fixtures: false, query: '?debug&noidle' });
  const st = await getState(page);
  if (!realAssetsPresent) {
    const status = await page.textContent('.nocta-reveal__status');
    check('missing pair is reported, not substituted', st.mode === 'missing' &&
      status.includes('nocta-hot-step-2-black.png') && status.includes('nocta-hot-step-2-white.png'), status);
    check('no reveal control without the photos', await page.locator('.nocta-reveal__toggle').isHidden());
    await shot(page, 'real-assets-missing');
    hygiene(log, { allowMissing: true });
  } else {
    check('real photos load into the WebGL path', st.mode === 'webgl', st.mode);
    await geometryChecks(page, 'real photos');
    const transparency = await page.evaluate(async () => {
      const probe = async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let transparent = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] < 250) transparent++;
        return transparent / (d.length / 4);
      };
      return {
        black: await probe('assets/nocta-hot-step-2-black.png'),
        white: await probe('assets/nocta-hot-step-2-white.png'),
      };
    });
    check('black photo has a real transparent background', transparency.black > 0.05, fmt(transparency.black));
    check('white photo has a real transparent background', transparency.white > 0.05, fmt(transparency.white));
    await shot(page, 'real-rest');
    await page.click('.nocta-reveal__toggle');
    await waitReveal(page, '(s) => s.reveal === 1');
    await shot(page, 'real-white');
    check('visual alignment of the real pair', true, 'requires human review of real-rest.png vs real-white.png');
    hygiene(log);
  }
  await context.close();
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
await writeFile(path.join(OUT, 'report.json'), JSON.stringify({ origin, realAssetsPresent, results }, null, 2));
process.stdout.write(`\n${results.length - failed.length}/${results.length} checks passed. Report and screenshots: ${OUT}\n`);
process.exit(failed.length ? 1 : 0);
