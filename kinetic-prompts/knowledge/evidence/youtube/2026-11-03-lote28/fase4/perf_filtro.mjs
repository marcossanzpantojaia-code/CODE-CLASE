import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import fs from 'node:fs'; const out = process.argv[2]; fs.mkdirSync(out, { recursive: true }); const b = await chromium.launch(); const R = {};
for (const v of ['filtro=0&tam=pantalla', 'filtro=1&tam=pantalla', 'filtro=0&tam=tarjeta', 'filtro=1&tam=tarjeta']) { R[v] = [];
  for (let r = 0; r < 2; r++) { const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage(); await p.goto('http://127.0.0.1:8793/filtro_turbulencia.html?' + v); await p.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
    await p.evaluate(() => { window.__fr = []; let u = performance.now(); const f = t => { window.__fr.push(t - u); u = t; if (!window.__parar) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value])); const st = await p.evaluate(() => __motor.st()); await p.mouse.move(700, 450);
    for (let y = 0; y < st.end + 200; y += 60) { await p.mouse.wheel(0, 60); await p.waitForTimeout(16); }
    if (r === 0) { await p.evaluate(s => scrollTo(0, s.start + (s.end - s.start) * .5), st); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/filtro_${v.replace(/[=&]/g, '_')}_p05.png` }); }
    const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value])); const fr = await p.evaluate(() => { window.__parar = 1; return window.__fr.slice(1); }); const s = [...fr].sort((a, c) => a - c);
    R[v].push({ tareas_ms: Math.round((m1.TaskDuration - m0.TaskDuration) * 1000), script_ms: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000), p95: +s[Math.floor(.95 * s.length)].toFixed(1), mayores33: fr.filter(x => x > 33.4).length, n: fr.length });
    await ctx.close(); } console.log(v, JSON.stringify(R[v])); }
fs.writeFileSync(`${out}/perf_filtro.json`, JSON.stringify(R, null, 1)); await b.close();
