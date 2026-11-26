import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const [,, base, out] = process.argv; const b = await chromium.launch(); const R = {};
const casos = [['31',''],['32',''],['32','part'],['32','grano,vineta'],['32','foco'],['32','comp'],['32','fondo']];
for (const [v, sin] of casos) { const res = [];
  for (let rep = 0; rep < 1; rep++) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(`${base}/rosso32.html?v=${v}&sin=${sin}`); await p.waitForFunction('window.LISTO', null, { timeout: 30000 });
  res.push(await p.evaluate(async () => {
    const js = []; const orig = T.tl.eventCallback('onUpdate');
    T.tl.eventCallback('onUpdate', () => { const a = performance.now(); orig(); js.push(performance.now() - a); });
    const dts = []; let last = performance.now(), on = true; const loop = now => { dts.push(now - last); last = now; if (on) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    T.reset(); T.tl.restart(); await new Promise(r => T.tl.eventCallback('onComplete', r)); on = false;
    const q = (a, k) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(s.length * k)].toFixed(1); };
    return { fotogramas: dts.length, intervalo_p50: q(dts, .5), mas_de_33ms: dts.filter(d => d > 33.4).length, js_p50: q(js, .5), js_p95: q(js, .95) };
  })); await ctx.close(); }
  R[`v${v}_sin_${sin || 'nada'}`] = res; console.log(v, sin || '-', JSON.stringify(res));
}
fs.writeFileSync(out, JSON.stringify(R, null, 1)); await b.close();
