// Diagnóstico de rendimiento de REC-003 a 1440 px (lote 27): mismo recorrido con rueda; se desactiva una capa costosa cada vez.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import fs from 'node:fs';
const [url, out, W = 1440, H = 900, rep = 2] = process.argv.slice(2);
const SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
const V0 = { base: '', sin_filtros_ingredientes: '.ing{filter:none!important}', sin_blur_sombra: '.sombra::before,.sombra::after{filter:none!important}',
  sin_multiply: '.c-sombra{mix-blend-mode:normal!important}', sin_ingredientes: '.ing{display:none!important}', sin_fantasma: '.capa-fantasma{display:none!important}',
  todo_lo_anterior: '.ing{filter:none!important}.sombra::before,.sombra::after{filter:none!important}.c-sombra{mix-blend-mode:normal!important}' };
const V = SOLO ? Object.fromEntries(Object.entries(V0).filter(([k]) => SOLO.includes(k))) : V0;
const b = await chromium.launch(); const R = {};
for (const [k, css] of Object.entries(V)) { R[k] = [];
  for (let r = 0; r < +rep; r++) {
    const ctx = await b.newContext({ viewport: { width: +W, height: +H } }); const p = await ctx.newPage(); await p.goto(url); await p.waitForFunction(() => window.__motor); if (css) await p.addStyleTag({ content: css }); await p.waitForTimeout(500);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
    await p.evaluate(() => { window.__fr = []; let u = performance.now(); const f = t => { window.__fr.push(t - u); u = t; if (!window.__parar) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const st = await p.evaluate(() => window.__motor.st()); await p.mouse.move(+W / 2, +H / 2);
    for (let y = 0; y < st.end + 200; y += 60) { await p.mouse.wheel(0, 60); await p.waitForTimeout(16); }
    for (let y = 0; y < st.end + 200; y += 60) { await p.mouse.wheel(0, -60); await p.waitForTimeout(16); }
    await p.waitForTimeout(300);
    const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const fr = await p.evaluate(() => { window.__parar = 1; return window.__fr.slice(1); }); const s = [...fr].sort((a, c) => a - c);
    const d = k => +((m1[k] - m0[k]) * 1000).toFixed(0);
    R[k].push({ tareas: d('TaskDuration'), script: d('ScriptDuration'), estilo_layout: d('RecalcStyleDuration') + d('LayoutDuration'), p95: +s[Math.floor(.95 * s.length)].toFixed(1), mayores33: fr.filter(x => x > 33.4).length, n: fr.length });
    await ctx.close(); }
  console.log(k, JSON.stringify(R[k])); }
fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(out + '/perf_variantes.json', JSON.stringify({ url, W, H, R }, null, 1)); await b.close();
