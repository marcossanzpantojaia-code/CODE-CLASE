// Coste por fotograma (JS + pintado) reproduciendo la transición en tiempo real, sin y con throttling de CPU ×4.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const [,, base, out] = process.argv; const b = await chromium.launch(); const R = {};
for (const [vw, vh] of [[1280, 720], [375, 812]]) for (const thr of [1, 4]) for (const v of ['31', '32']) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: vw < 500 ? 2 : 1 }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  await p.goto(`${base}/rosso32.html?v=${v}`); await p.waitForFunction('window.LISTO', null, { timeout: 30000 });
  const r = await p.evaluate(async () => {
    const js = []; const orig = T.tl.eventCallback('onUpdate');
    T.tl.eventCallback('onUpdate', () => { const a = performance.now(); orig(); js.push(performance.now() - a); });
    const dts = []; let last = performance.now(), on = true; const loop = now => { dts.push(now - last); last = now; if (on) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    T.reset(); T.tl.restart(); await new Promise(r => T.tl.eventCallback('onComplete', r)); on = false;
    const q = (a, k) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length * k)].toFixed(2); };
    return { fotogramas: dts.length, intervalo_p50: q(dts, .5), intervalo_p95: q(dts, .95), mas_de_33ms: dts.filter(d => d > 33.4).length, js_p50: q(js, .5), js_p95: q(js, .95) };
  });
  R[`${vw}x${vh}_cpu${thr}_v${v}`] = r; console.log(vw, thr, v, JSON.stringify(r)); await ctx.close();
}
fs.writeFileSync(out, JSON.stringify(R, null, 1)); await b.close();
