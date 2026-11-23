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
import { SILHOUETTE_ASPECT, makeFixturePair, syntheticCampaign } from './fixtures.mjs';

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
const CAMPAIGN_FIXTURE = syntheticCampaign();

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

async function open(
  contextOptions = {},
  { fixtures = true, query = '?debug&noidle&lockstep', init = [], scrollToReveal = true } = {},
) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ...contextOptions });
  const log = { pageErrors: [], consoleErrors: [], external: [], failed: [] };
  if (fixtures) {
    await context.route('**/assets/nocta-hot-step-2-*.png', (route) => {
      const url = route.request().url();
      const fx = url.includes('-black') ? FIXTURES.black : url.includes('-orange') ? FIXTURES.orange : FIXTURES.white;
      return route.fulfill({ status: 200, contentType: 'image/png', body: fx.png });
    });
    await context.route('**/assets/nocta-campaign.jpg', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: CAMPAIGN_FIXTURE }),
    );
    // data-align-* registers the real photo pair; it must not be applied to the stand-ins.
    await context.route((url) => url.origin === origin && url.pathname === '/', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(/\sdata-align-(black|white)="[^"]*"/g, '');
      return route.fulfill({ response, body });
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
  await page.waitForFunction(() => window.__noctaSweep && window.__noctaReveal, null, { timeout: 30000 });
  if (scrollToReveal) {
    // The fluid reveal sits after the 400svh cover runway: bring it into view so it initialises.
    await page.evaluate(() => document.querySelector('.nocta-reveal').scrollIntoView({ block: 'start' }));
    await page.waitForFunction(() => window.__noctaReveal.debug.getState().mode !== 'loading', null, {
      timeout: 30000,
    });
  }
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

/** Waits until the cycle rests on `key` (no wipe running, nothing queued). */
async function waitColourway(page, key) {
  await waitReveal(page, `(s) => s.colourway === '${key}' && s.target === 0 && s.queued === 0`);
}

const destinationOf = (page) => page.evaluate(() => window.__noctaReveal.debug.getState().destination);
const toggleLabel = (page) => page.getAttribute('.nocta-reveal__toggle', 'aria-label');

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
    const ob = box();
    let orange = 0;
    let topOrange = 0;
    let botOrange = 0;
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
        const cls = data[i] - data[i + 2] > 90 && l >= 60 ? 3 : l >= 190 ? 2 : l >= 80 ? 1 : 0;
        if (cls === 0) {
          const m = p.width * 0.04;
          const away = xd < p.left - m || xd > p.left + p.width + m || yd < p.top - m || yd > p.top + p.height + m;
          if (away && l > bgMax) bgMax = l;
          continue;
        }
        const b = cls === 2 ? wb : cls === 3 ? ob : bb;
        if (xd < b.x0) b.x0 = xd;
        if (xd > b.x1) b.x1 = xd;
        if (yd < b.y0) b.y0 = yd;
        if (yd > b.y1) b.y1 = yd;
        if (cls === 2) {
          white++;
          cells[Math.min(gy - 1, Math.floor((yd / st.frame[1]) * gy)) * gx + Math.min(gx - 1, Math.floor((xd / st.frame[0]) * gx))]++;
        } else if (cls === 3) orange++;
        else black++;
        const top = yd < p.top + p.height / 2;
        if (top) {
          topShoe++;
          if (cls === 2) topWhite++;
          if (cls === 3) topOrange++;
        } else {
          botShoe++;
          if (cls === 2) botWhite++;
          if (cls === 3) botOrange++;
        }
      }
    }
    const fin = (b) => (Number.isFinite(b.x0) ? { x0: b.x0, y0: b.y0, x1: b.x1 + sx, y1: b.y1 + sy } : null);
    return {
      white,
      black,
      orange,
      whiteFraction: white / Math.max(1, white + black + orange),
      orangeFraction: orange / Math.max(1, white + black + orange),
      topWhiteFraction: topWhite / Math.max(1, topShoe),
      bottomWhiteFraction: botWhite / Math.max(1, botShoe),
      topOrangeFraction: topOrange / Math.max(1, topShoe),
      bottomOrangeFraction: botOrange / Math.max(1, botShoe),
      whiteBox: fin(wb),
      blackBox: fin(bb),
      orangeBox: fin(ob),
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
  const failed = allowMissing
    ? log.failed.filter((f) => !/nocta-hot-step-2-(black|white|orange)\.png|nocta-campaign\.jpg/.test(f))
    : log.failed;
  check('no missing files / failed requests', failed.length === 0, failed.join(' | '));
}

async function noOverflow(page) {
  const o = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    sh: document.documentElement.scrollHeight,
    ih: window.innerHeight,
    sections: document.querySelector('.nocta-sweep').offsetHeight + document.querySelector('.nocta-reveal').offsetHeight,
  }));
  check('no horizontal overflow', o.sw <= o.iw, `scrollWidth ${o.sw} / innerWidth ${o.iw}`);
  check('page height = 400svh cover + 100svh reveal, nothing else', o.sh <= o.sections + 1 && Math.abs(o.sections - 5 * o.ih) <= 2,
    `scrollHeight ${o.sh} / sections ${o.sections} / 5 x innerHeight ${5 * o.ih}`);
}

async function geometryChecks(page, label, { realPhotos = false } = {}) {
  const st = await getState(page);
  const [W, H] = st.frame;
  const { black, white, product } = st.planes;
  const pb = st.photos.black;
  const pw = st.photos.white;
  check(`${label}: black plane keeps natural aspect`, near(black.width / black.height, pb.width / pb.height, 1e-9),
    `${fmt(black.width / black.height, 6)} vs ${fmt(pb.width / pb.height, 6)}`);
  check(`${label}: white plane keeps natural aspect`, near(white.width / white.height, pw.width / pw.height, 1e-9),
    `${fmt(white.width / white.height, 6)} vs ${fmt(pw.width / pw.height, 6)}`);
  if (st.planes.orange && st.photos.orange) {
    const po = st.photos.orange;
    const o = st.planes.orange;
    check(`${label}: orange plane keeps natural aspect`, near(o.width / o.height, po.width / po.height, 1e-9));
    check(`${label}: orange plane coincides with white (same geometry)`,
      near(o.left, white.left, 0.01) && near(o.top, white.top, 0.01) && near(o.width, white.width, 0.01));
  }
  check(`${label}: product width <= .86 W`, product.width <= 0.86 * W + 1e-6, `${fmt(product.width, 1)} / ${fmt(W, 1)}`);
  check(`${label}: product fully inside frame`,
    product.left >= 0 && product.top >= 0 && product.left + product.width <= W + 1e-6 && product.top + product.height <= H + 1e-6);
  check(`${label}: product centred at (.5 W, .54 H)`,
    near(product.left + product.width / 2, 0.5 * W, 0.01) && near(product.top + product.height / 2, 0.54 * H, 0.01));
  const bp = black.product;
  const boxes = `black ${fmt(bp.left, 1)},${fmt(bp.top, 1)} ${fmt(bp.width, 1)}x${fmt(bp.height, 1)} / white ${fmt(product.left, 1)},${fmt(product.top, 1)} ${fmt(product.width, 1)}x${fmt(product.height, 1)}`;
  if (!realPhotos) {
    check(`${label}: black and white product boxes coincide (uniform scale + translation only)`,
      near(bp.left, product.left, 1.5) && near(bp.top, product.top, 1.5) && near(bp.width, product.width, 0.01) && near(bp.height, product.height, 1.5),
      boxes);
  } else {
    // Two real images never have identical boxes (tongue/laces sit differently, and the pair may
    // carry a rigid data-align-* registration): heel, toe and sole line must stay within 1.5 % of
    // the product width of each other, and the height difference is reported and bounded.
    const soleB = bp.top + bp.height;
    const soleW = product.top + product.height;
    const tol = 0.015 * product.width;
    const dl = Math.abs(bp.left - product.left);
    const dr = Math.abs(bp.left + bp.width - (product.left + product.width));
    const ds = Math.abs(soleB - soleW);
    check(`${label}: heel, toe and sole line within 1.5% of product width (uniform scale + translation only)`,
      dl <= tol && dr <= tol && ds <= tol, `heel ${fmt(dl, 1)} toe ${fmt(dr, 1)} sole ${fmt(ds, 1)} px (limit ${fmt(tol, 1)}); ${boxes}`);
    const dh = Math.abs(bp.height - product.height);
    check(`${label}: silhouette height difference stays small (tongue/laces)`, dh <= 0.015 * product.height,
      `${fmt(dh, 1)} px = ${fmt((dh / product.height) * 100, 2)}% of the product height`);
  }
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
  // The canvas fades in over .45 s after WebGL starts; never capture mid-fade.
  await page.waitForFunction(() => {
    const c = document.querySelector('.nocta-reveal__canvas');
    const mode = document.querySelector('[data-nocta-reveal]')?.dataset.mode;
    return !c || !(mode === 'webgl' || mode === 'static') || getComputedStyle(c).opacity === '1';
  }, null, { timeout: 10000 });
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

  // --- colourway cycle: curved bottom-to-top wipes, black -> white -> orange -> black.
  check('cycle order is black, white, orange', st.order.join() === 'black,white,orange', st.order.join());
  check('button names what comes next', (await toggleLabel(page)) === 'Reveal white Nike NOCTA Hot Step 2');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  check('click starts the wipe to white', (await destinationOf(page)) === 'white');
  check('button now offers orange', (await toggleLabel(page)) === 'Reveal orange Nike NOCTA Hot Step 2');
  await waitReveal(page, '(s) => s.reveal > 0.35 && s.reveal < 0.7');
  const mid = await canvasStats(page);
  check('wipe travels bottom-to-top', mid.bottomWhiteFraction > mid.topWhiteFraction + 0.2,
    `reveal ${fmt(mid.reveal)}: bottom ${fmt(mid.bottomWhiteFraction)} vs top ${fmt(mid.topWhiteFraction)} white`);
  await shot(page, 'desktop-wipe-mid');
  await waitColourway(page, 'white');
  const full = await canvasStats(page);
  check('full reveal shows only the white stand-in (>=99%; remainder = anti-aliased edges)', full.whiteFraction >= 0.99 && full.white > 50000,
    `white ${fmt(full.whiteFraction * 100, 2)}% of silhouette pixels`);
  const wbx = full.whiteBox;
  check('white silhouette aligns with black silhouette (toe, heel, sole, collar +/-2 px)',
    near(wbx.x0, rest.blackBox.x0, 2) && near(wbx.x1, rest.blackBox.x1, 2) && near(wbx.y0, rest.blackBox.y0, 2) && near(wbx.y1, rest.blackBox.y1, 2),
    `white ${fmt(wbx.x0, 1)},${fmt(wbx.y0, 1)}->${fmt(wbx.x1, 1)},${fmt(wbx.y1, 1)}`);
  check('canvas label follows the state', (await page.getAttribute('.nocta-reveal__canvas', 'aria-label')).includes('white'));
  await shot(page, 'desktop-white');

  // White at rest: the fluid now reveals the NEXT colourway (orange).
  await page.mouse.move(box.x + p.left + p.width * 0.92, box.y + p.top + p.height * 0.55);
  await waitTicks(page, 1);
  await mousePath(page, sweepPoints(box, p, 40, 0.92, 0.12, 0.18));
  const wf = await canvasStats(page);
  check('on white, pointer motion reveals the orange through the fluid', wf.orange > 3000 && wf.orangeFraction < 0.8,
    `${wf.orange} orange px, ${fmt(wf.orangeFraction * 100, 1)}%`);
  await shot(page, 'desktop-white-fluid-orange');
  await page.mouse.move(box.x + 12, box.y - 24);
  await page.waitForFunction(() => window.__noctaReveal.debug.getState().asleep, null, { timeout: 180000, polling: 'raf' });

  // Wipe white -> orange, bottom to top, then the orange at rest.
  await page.click('.nocta-reveal__toggle');
  await page.mouse.move(box.x + 12, box.y - 24);
  await waitReveal(page, '(s) => s.reveal > 0.35 && s.reveal < 0.7');
  const midO = await canvasStats(page);
  check('wipe to orange travels bottom-to-top', midO.bottomOrangeFraction > midO.topOrangeFraction + 0.2,
    `bottom ${fmt(midO.bottomOrangeFraction)} vs top ${fmt(midO.topOrangeFraction)} orange`);
  await waitColourway(page, 'orange');
  const fullO = await canvasStats(page);
  check('orange at rest shows only the orange stand-in (>=99%)', fullO.orangeFraction >= 0.99 && fullO.orange > 50000,
    `orange ${fmt(fullO.orangeFraction * 100, 2)}%`);
  check('orange silhouette coincides with the white one (+/-1 px)',
    near(fullO.orangeBox.x0, full.whiteBox.x0, 1) && near(fullO.orangeBox.x1, full.whiteBox.x1, 1) &&
      near(fullO.orangeBox.y0, full.whiteBox.y0, 1) && near(fullO.orangeBox.y1, full.whiteBox.y1, 1));
  check('canvas label names the orange colourway', (await page.getAttribute('.nocta-reveal__canvas', 'aria-label')).includes('orange'));
  await shot(page, 'desktop-orange');

  // Two quick activations from orange: queued (black, then white), every frame continuous.
  const samples = await page.evaluate(
    () => new Promise((resolve) => {
      const api = window.__noctaReveal;
      const out = [];
      let n = 0;
      api.advance();
      const f = () => {
        const st2 = api.debug.getState();
        out.push({ r: st2.reveal, c: st2.current, done: st2.target === 0 && st2.queued === 0 });
        if (n === 6) api.advance();
        if (++n < 600 && !(n > 10 && out[out.length - 1].done)) requestAnimationFrame(f);
        else resolve(out);
      };
      requestAnimationFrame(f);
    }),
  );
  let maxJump = 0;
  let commits = 0;
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].c !== samples[i - 1].c) commits++;
    else maxJump = Math.max(maxJump, Math.abs(samples[i].r - samples[i - 1].r));
  }
  check('activations during a wipe are queued, with no jumps', maxJump < 0.08 && commits === 2,
    `max per-frame change ${fmt(maxJump)}, ${commits} colourway changes`);
  const after = await getState(page);
  check('queue lands two steps on (orange -> black -> white)', after.colourway === 'white', after.colourway);
  await page.click('.nocta-reveal__toggle');
  await page.click('.nocta-reveal__toggle');
  await page.mouse.move(box.x + 12, box.y - 24);
  await waitColourway(page, 'black');
  const back = await canvasStats(page);
  check('cycle returns to black', back.white === 0 && back.orange === 0 && back.black > 50000);

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
  check('Enter advances to white', (await destinationOf(page)) === 'white');
  await page.keyboard.press('Space');
  check('Space advances to orange', (await destinationOf(page)) === 'orange');
  await page.keyboard.press('Enter');
  check('Enter advances back to black', (await destinationOf(page)) === 'black');
  await waitColourway(page, 'black');
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
  await page.evaluate(() => document.querySelector('.nocta-reveal').scrollIntoView({ block: 'start' }));
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
  const rmState = await getState(page);
  check('activation still works, switching instantly (no wipe animation)',
    rmState.colourway === 'white' && rmState.target === 0 && on.white > 50000 && on.whiteFraction >= 0.99);
  await page.click('.nocta-reveal__toggle');
  const onO = await canvasStats(page);
  check('next activation shows orange instantly', (await getState(page)).colourway === 'orange' && onO.orangeFraction >= 0.99);
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
  const shownPhoto = () => page.evaluate(() =>
    ['black', 'white', 'orange'].filter((k) => !document.querySelector(`.nocta-reveal__photo--${k}`).hidden).join());
  await page.click('.nocta-reveal__toggle');
  const s1 = await shownPhoto();
  await page.click('.nocta-reveal__toggle');
  const s2 = await shownPhoto();
  await page.click('.nocta-reveal__toggle');
  const s3 = await shownPhoto();
  check('interaction not broken: the cycle swaps photos (white, orange, black)', s1 === 'white' && s2 === 'orange' && s3 === 'black',
    `${s1} -> ${s2} -> ${s3}`);
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
  check('touch drag did not advance the cycle', (await destinationOf(page)) === 'black');
  await page.tap('.nocta-reveal__toggle');
  check('tap advances to white', (await destinationOf(page)) === 'white');
  await waitColourway(page, 'white');
  await shot(page, 'phone-white');
  await page.tap('.nocta-reveal__toggle');
  check('second tap advances to orange', (await destinationOf(page)) === 'orange');
  await waitColourway(page, 'orange');
  await shot(page, 'phone-orange');
  await page.tap('.nocta-reveal__toggle');
  check('third tap returns to black', (await destinationOf(page)) === 'black');
  await waitColourway(page, 'black');

  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '1600px';
    document.body.append(spacer);
  });
  await waitFrames(page, 2);
  const scrollBefore = await page.evaluate(() => window.scrollY);
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
  check('vertical touch drag over the artwork scrolls the page', scrollY - scrollBefore > 150, `scrolled ${scrollY - scrollBefore}px`);
  check('scrolling drag did not advance the cycle', (await destinationOf(page)) === 'black');
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
  await waitColourway(page, 'white');
  const full = await canvasStats(page);
  check('tap reveals white on tablet, silhouettes aligned (+/-2 px)',
    full.whiteFraction >= 0.99 && near(full.whiteBox.x0, rest.blackBox.x0, 2) && near(full.whiteBox.x1, rest.blackBox.x1, 2) &&
      near(full.whiteBox.y0, rest.blackBox.y0, 2) && near(full.whiteBox.y1, rest.blackBox.y1, 2));
  await shot(page, 'tablet-white');
  hygiene(log);
  await context.close();
}

// =========================================================================== orange optional

section('Orange colourway missing: cycle falls back to black and white');
{
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const log2 = { pageErrors: [], consoleErrors: [], external: [], failed: [], warnings: [] };
  await ctx2.route('**/assets/nocta-hot-step-2-*.png', (route) => {
    const url = route.request().url();
    if (url.includes('-orange')) return route.fulfill({ status: 404, body: 'missing' });
    return route.fulfill({ status: 200, contentType: 'image/png', body: url.includes('-black') ? FIXTURES.black.png : FIXTURES.white.png });
  });
  await ctx2.route('**/assets/nocta-campaign.jpg', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: CAMPAIGN_FIXTURE }));
  await ctx2.route((url) => url.origin === origin && url.pathname === '/', async (route) => {
    const response = await route.fetch();
    return route.fulfill({ response, body: (await response.text()).replace(/\sdata-align-(black|white)="[^"]*"/g, '') });
  });
  const page2 = await ctx2.newPage();
  page2.on('pageerror', (e) => log2.pageErrors.push(String(e)));
  page2.on('console', (m) => {
    if (m.type() === 'error') log2.consoleErrors.push(m.text());
    if (m.type() === 'warning') log2.warnings.push(m.text());
  });
  page2.on('response', (r) => r.status() >= 400 && log2.failed.push(`${r.status()} ${r.url()}`));
  await page2.goto(`${origin}/?debug&noidle&lockstep`);
  await page2.waitForFunction(() => window.__noctaReveal);
  await page2.evaluate(() => document.querySelector('.nocta-reveal').scrollIntoView({ block: 'start' }));
  await page2.waitForFunction(() => window.__noctaReveal.debug.getState().mode === 'webgl', null, { timeout: 30000 });
  const st2 = await getState(page2);
  check('cycle order falls back to black, white', st2.order.join() === 'black,white', st2.order.join());
  check('a console warning names the missing orange file', log2.warnings.some((w) => /nocta-hot-step-2-orange\.png/.test(w)));
  await page2.click('.nocta-reveal__toggle');
  await waitColourway(page2, 'white');
  check('button then offers black again', (await toggleLabel(page2)) === 'Reveal black Nike NOCTA Hot Step 2');
  await page2.click('.nocta-reveal__toggle');
  await waitColourway(page2, 'black');
  check('two-colourway cycle returns to black', (await getState(page2)).colourway === 'black');
  hygiene(log2, { allowMissing: true });
  await ctx2.close();
}

// =========================================================================== scroll headline cover

const sweepState = (page) => page.evaluate(() => window.__noctaSweep.state);

/** Scrolls so the cover's progress is p, then reads the measured geometry. */
async function sweepAt(page, p) {
  await page.evaluate((pp) => {
    const runway = document.querySelector('.nocta-sweep__runway');
    const top = runway.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.round(top + pp * window.__noctaSweep.state.D));
  }, p);
  await waitFrames(page, 2);
  return page.evaluate(() => {
    const h = document.querySelector('.nocta-sweep__headline');
    const f = document.querySelector('.nocta-sweep__frame');
    const hr = h.getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    const m = new DOMMatrixReadOnly(getComputedStyle(h).transform);
    return {
      ...window.__noctaSweep.state,
      tx: m.m41,
      hLeft: hr.left,
      hRight: hr.right,
      hMid: (hr.top + hr.bottom) / 2,
      fTop: fr.top,
      fLeft: fr.left,
      fRight: fr.right,
      fMid: (fr.top + fr.bottom) / 2,
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
      fontSize: parseFloat(getComputedStyle(h).fontSize),
      hHeight: h.offsetHeight,
    };
  });
}

async function touchScroll(context, page, vw, vh) {
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vw / 2, y: vh * 0.8 }] });
  for (let i = 1; i <= 20; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vw / 2, y: vh * 0.8 - i * 25 }] });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  await waitFrames(page, 2);
}

async function sweepScenario(label, contextOptions, { touch = false } = {}) {
  section(`Scroll headline cover · ${label}`);
  const { context, page, log } = await open(contextOptions, { scrollToReveal: false, query: '?debug&noidle' });
  const anton = await page.evaluate(() => document.fonts.ready.then(() => document.fonts.check('100px Anton')));
  check('Anton is self-hosted and loaded', anton);
  const dims = await page.evaluate(() => {
    const runway = document.querySelector('.nocta-sweep__runway');
    const f = document.querySelector('.nocta-sweep__frame');
    const img = document.querySelector('.nocta-sweep__image');
    const h = document.querySelector('.nocta-sweep__headline');
    const ir = img.getBoundingClientRect();
    return {
      runway: runway.offsetHeight,
      frame: f.clientHeight,
      frameW: f.clientWidth,
      ih: window.innerHeight,
      sticky: getComputedStyle(f).position,
      frameOverflow: getComputedStyle(f).overflow,
      sectionOverflow: getComputedStyle(document.querySelector('.nocta-sweep')).overflow,
      imgOk: img.complete && img.naturalWidth > 0,
      fit: getComputedStyle(img).objectFit,
      alt: img.alt,
      imgW: ir.width,
      imgH: ir.height,
      tag: h.tagName,
      text: h.textContent.trim(),
    };
  });
  check('runway 400svh with a sticky 100svh frame', near(dims.runway, 4 * dims.ih, 1) && near(dims.frame, dims.ih, 1) && dims.sticky === 'sticky',
    `runway ${dims.runway}, frame ${dims.frame}, viewport ${dims.ih}, ${dims.sticky}`);
  check('outer section overflow visible, inner frame overflow hidden', dims.sectionOverflow === 'visible' && dims.frameOverflow === 'hidden');
  check('campaign image loaded, cover-fitted to the frame, with alt text',
    dims.imgOk && dims.fit === 'cover' && dims.alt.length > 10 && near(dims.imgW, dims.frameW, 1) && near(dims.imgH, dims.frame, 1));
  check('headline is a real heading reading "Nike NOCTA"', dims.tag === 'H1' && dims.text === 'Nike NOCTA');
  const g = await sweepState(page);
  check('D = runway height - frame height', near(g.D, dims.runway - dims.frame, 0.5), `D ${g.D}`);
  const samples = [];
  for (const p of [0, 0.25, 0.5, 0.75, 1]) {
    const s = await sweepAt(page, p);
    samples.push(s);
    const expect = s.V - p * (s.V + s.T);
    check(`p ${p * 100}%: x = V - p(V + T)`, near(s.p, p, 0.002) && near(s.tx, expect, 1.5),
      `p ${fmt(s.p)} x ${fmt(s.tx, 1)} expected ${fmt(expect, 1)} (V ${s.V}, T ${s.T})`);
    if (p > 0 && p < 1) check(`p ${p * 100}%: frame stays pinned`, near(s.fTop, 0, 0.5), `frame top ${fmt(s.fTop, 1)}`);
    check(`p ${p * 100}%: no horizontal overflow`, s.sw <= s.iw, `scrollWidth ${s.sw} / ${s.iw}`);
    if (p === 0.25 || p === 0.5 || p === 0.75) await shot(page, `sweep-${label.split(' ')[0]}-${p * 100}`);
  }
  check('x decreases monotonically with scroll', samples.every((s, i) => i === 0 || s.tx < samples[i - 1].tx));
  check('p 0%: first glyph just beyond the right edge', samples[0].hLeft >= samples[0].fRight - 1,
    `left ${fmt(samples[0].hLeft, 1)} / right edge ${fmt(samples[0].fRight, 1)}`);
  check('p 100%: last glyph just beyond the left edge', samples[4].hRight <= samples[4].fLeft + 1, `right ${fmt(samples[4].hRight, 1)}`);
  check('headline stays vertically centred', samples.every((s) => near(s.hMid, s.fMid, 1.5)));
  check('headline never wraps (single line)', samples[2].hHeight <= samples[2].fontSize * 1.05,
    `height ${samples[2].hHeight} / font-size ${samples[2].fontSize}`);
  check('font-size = clamp(115px, 30vw, 500px)', near(samples[2].fontSize, Math.min(500, Math.max(115, 0.3 * samples[2].iw)), 0.5),
    `${samples[2].fontSize}px`);
  const back = await sweepAt(page, 0.5);
  check('scrolling back up reverses exactly', near(back.tx, samples[2].tx, 0.5), `x ${fmt(back.tx, 1)} vs ${fmt(samples[2].tx, 1)}`);
  const rel = await page.evaluate(async () => {
    const runway = document.querySelector('.nocta-sweep__runway');
    const top = runway.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.round(top + window.__noctaSweep.state.D + window.innerHeight * 0.5));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return {
      frameTop: document.querySelector('.nocta-sweep__frame').getBoundingClientRect().top,
      nextTop: document.querySelector('.nocta-reveal').getBoundingClientRect().top,
      ih: window.innerHeight,
      p: window.__noctaSweep.state.p,
    };
  });
  check('pin releases naturally into the next section', near(rel.frameTop, -rel.ih * 0.5, 1.5) && near(rel.nextTop, rel.ih * 0.5, 1.5) && rel.p === 1,
    `frame top ${fmt(rel.frameTop, 1)}, next section top ${fmt(rel.nextTop, 1)}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitFrames(page, 2);
  const before = await sweepState(page);
  if (touch) {
    await touchScroll(context, page, contextOptions.viewport.width, contextOptions.viewport.height);
  } else {
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    await waitFrames(page, 2);
  }
  const after = await sweepState(page);
  check(`real ${touch ? 'touch' : 'mouse-wheel'} scrolling drives the sweep right-to-left`, after.p > before.p && after.x < before.x,
    `p ${fmt(before.p)} -> ${fmt(after.p)}, x ${fmt(before.x, 1)} -> ${fmt(after.x, 1)}`);
  hygiene(log);
  await context.close();
}

await sweepScenario('desktop 1440x1000', { viewport: { width: 1440, height: 1000 } });
await sweepScenario('phone 390x844', {
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent,
}, { touch: true });
await sweepScenario('tablet 820x1180', {
  viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPad Pro 11'].userAgent,
}, { touch: true });

section('Scroll headline cover · reduced motion');
{
  const { context, page, log } = await open({ reducedMotion: 'reduce' }, { scrollToReveal: false, query: '?debug&noidle' });
  await page.evaluate(() => document.fonts.ready);
  const read = () => page.evaluate(() => {
    const runway = document.querySelector('.nocta-sweep__runway');
    const f = document.querySelector('.nocta-sweep__frame');
    const h = document.querySelector('.nocta-sweep__headline');
    const hr = h.getBoundingClientRect();
    const fr = f.getBoundingClientRect();
    return {
      runway: runway.offsetHeight,
      frame: f.clientHeight,
      ih: window.innerHeight,
      pos: getComputedStyle(f).position,
      inline: h.style.transform,
      fs: parseFloat(getComputedStyle(h).fontSize),
      inside: hr.left >= fr.left - 0.5 && hr.right <= fr.right + 0.5 && hr.top >= fr.top - 0.5 && hr.bottom <= fr.bottom + 0.5,
      centred: Math.abs((hr.left + hr.right) / 2 - (fr.left + fr.right) / 2) < 1.5 && Math.abs((hr.top + hr.bottom) / 2 - (fr.top + fr.bottom) / 2) < 1.5,
    };
  });
  const r = await read();
  check('runway collapses to one viewport, no pinning', near(r.runway, r.ih, 1) && near(r.frame, r.ih, 1) && r.pos === 'relative',
    `runway ${r.runway}, frame ${r.frame}, ${r.pos}`);
  check('entire headline visible and centred at a smaller size', r.inside && r.centred && r.fs <= 140, `font-size ${r.fs}px`);
  await page.mouse.move(300, 300);
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(300);
  check('no motion when scrolling', (await read()).inline === '');
  await shot(page, 'sweep-reduced-motion');
  hygiene(log);
  await context.close();
}

section('Scroll headline cover · skip link, two instances, unmount');
{
  const { context, page, log } = await open({}, { scrollToReveal: false, query: '?debug&noidle' });
  await page.keyboard.press('Tab');
  const skip = await page.evaluate(() => {
    const a = document.activeElement;
    const r = a.getBoundingClientRect();
    return { cls: a.className, text: a.textContent.trim(), visible: r.top >= 0 && r.bottom <= window.innerHeight && r.width > 0, fv: a.matches(':focus-visible') };
  });
  check('first Tab focuses a visible "Skip animation" link', skip.cls.includes('nocta-sweep__skip') && skip.text === 'Skip animation' && skip.visible && skip.fv,
    JSON.stringify(skip));
  await shot(page, 'sweep-skip-link');
  await page.keyboard.press('Enter');
  await waitFrames(page, 3);
  const jumped = await page.evaluate(() => ({
    hash: location.hash,
    top: document.querySelector('.nocta-reveal').getBoundingClientRect().top,
    focus: document.activeElement?.id,
  }));
  check('skip link jumps to the next section and moves focus there', jumped.hash === '#after-dark' && near(jumped.top, 0, 2) && jumped.focus === 'after-dark',
    JSON.stringify(jumped));
  const two = await page.evaluate(async () => {
    const { mountScrollHeadline } = await import(new URL('src/nocta-scroll-headline.js', document.baseURI).href);
    const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const clone = document.querySelector('.nocta-sweep').cloneNode(true);
    clone.querySelector('.nocta-sweep__headline').id = 'sweep-2-title';
    clone.setAttribute('aria-labelledby', 'sweep-2-title');
    clone.querySelector('.nocta-sweep__skip').remove();
    document.querySelector('main').append(clone);
    const second = mountScrollHeadline(clone, { headline: 'After Dark' });
    await raf2();
    const runway = clone.querySelector('.nocta-sweep__runway');
    window.scrollTo(0, Math.round(runway.getBoundingClientRect().top + window.scrollY + 0.5 * second.state.D));
    await raf2();
    await raf2();
    const a = window.__noctaSweep.state;
    const b = second.state;
    second.destroy();
    clone.remove();
    return { aP: a.p, bP: b.p, bX: b.x, bExpected: b.V - 0.5 * (b.V + b.T) };
  });
  check('two instances keep independent progress', two.aP === 1 && near(two.bP, 0.5, 0.003) && near(two.bX, two.bExpected, 1.5), JSON.stringify(two));
  const un = await page.evaluate(async () => {
    const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    window.scrollTo(0, 0);
    await raf2();
    const api = window.__noctaSweep;
    api.destroy();
    const before = api.state.updates;
    window.scrollTo(0, 1500);
    await raf2();
    await raf2();
    return { further: api.state.updates - before, inline: document.querySelector('.nocta-sweep__headline').style.transform };
  });
  check('destroy cancels frames and removes listeners/observers', un.further === 0 && un.inline === '', JSON.stringify(un));
  hygiene(log);
  await context.close();
}

// =========================================================================== resize + unmount

section('Resize and unmount');
{
  const { context, page, log } = await open();
  for (const [w, h] of [[1024, 700], [600, 900], [1920, 600], [1440, 1000]]) {
    await page.setViewportSize({ width: w, height: h });
    // The 400svh cover above changes height with the viewport: keep the reveal section in view.
    await page.evaluate(() => document.querySelector('.nocta-reveal').scrollIntoView({ block: 'start' }));
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
    document.querySelector('.nocta-reveal').scrollIntoView({ block: 'start' });
    const { mountNoctaFluidReveal } = await import(new URL('src/nocta-fluid-reveal.js', document.baseURI).href);
    const api = mountNoctaFluidReveal(document.querySelector('[data-nocta-reveal]'), { debug: true });
    const t0 = performance.now();
    await new Promise((r) => {
      const t = () => (api.debug.getState().mode === 'loading' && performance.now() - t0 < 20000 ? requestAnimationFrame(t) : r());
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
  const { context, page, log } = await open({}, { fixtures: false, query: '?debug&noidle&lockstep' });
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
    await geometryChecks(page, 'real photos', { realPhotos: true });
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
        orange: await probe('assets/nocta-hot-step-2-orange.png'),
      };
    });
    check('black photo has a real transparent background', transparency.black > 0.05, fmt(transparency.black));
    check('white photo has a real transparent background', transparency.white > 0.05, fmt(transparency.white));
    check('orange image has a real transparent background', transparency.orange > 0.05, fmt(transparency.orange));
    await shot(page, 'real-rest');
    const box = await frameBox(page);
    const p = st.planes.product;
    await page.mouse.move(box.x + p.left + p.width * 0.9, box.y + p.top + p.height * 0.5);
    await waitTicks(page, 1);
    await mousePath(page, sweepPoints(box, p, 44, 0.9, 0.15, 0.3));
    await shot(page, 'real-fluid');
    await page.mouse.move(box.x + 12, box.y - 24);
    await page.waitForFunction(() => window.__noctaReveal.debug.getState().asleep, null, { timeout: 180000, polling: 'raf' });
    await page.click('.nocta-reveal__toggle');
    await page.mouse.move(box.x + 12, box.y - 24);
    await waitReveal(page, '(s) => s.reveal > 0.4 && s.reveal < 0.75');
    await shot(page, 'real-wipe');
    await waitColourway(page, 'white');
    await shot(page, 'real-white');
    await page.click('.nocta-reveal__toggle');
    await page.mouse.move(box.x + 12, box.y - 24);
    await waitColourway(page, 'orange');
    await shot(page, 'real-orange');
    check('visual alignment of the real images', true, 'requires human review of real-rest/white/orange.png');
    hygiene(log);
  }
  await context.close();
}

if (realAssetsPresent) {
  section('Real product photography on a phone (390x844)');
  const { context, page, log } = await open(
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent },
    { fixtures: false, query: '?debug&noidle&lockstep' },
  );
  await geometryChecks(page, 'real photos phone', { realPhotos: true });
  const st = await getState(page);
  const cdp = await context.newCDPSession(page);
  const box = await frameBox(page);
  const pts = sweepPoints(box, st.planes.product, 30, 0.88, 0.12, 0.35);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1] }] });
  await waitTicks(page, 1);
  for (const [x, y] of pts.slice(1)) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await waitTicks(page, 1);
  }
  await shot(page, 'real-phone-fluid');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await noOverflow(page);
  hygiene(log);
  await context.close();
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
await writeFile(path.join(OUT, 'report.json'), JSON.stringify({ origin, realAssetsPresent, results }, null, 2));
process.stdout.write(`\n${results.length - failed.length}/${results.length} checks passed. Report and screenshots: ${OUT}\n`);
process.exit(failed.length ? 1 : 0);
