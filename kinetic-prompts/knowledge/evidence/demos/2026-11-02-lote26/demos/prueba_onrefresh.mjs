// Demuestra el defecto del onRefresh (lote 26): A en p = 0,7 (chorro visible), resize, captura SIN hacer scroll.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const out = process.argv[2]; const b = await chromium.launch(); const R = {};
for (const v of ['sinOnRefresh=1', 'sinOnRefresh=0']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto('http://127.0.0.1:8791/receta_a.html?motor=gsap&' + v); await p.waitForTimeout(800);
  await p.evaluate(() => { const s = window.__motor.st(); scrollTo(0, s.start + (s.end - s.start) * .7); }); await p.waitForTimeout(400);
  const antes = await p.evaluate(() => ({ p: __estado.p, chorro: __estado.chorro, d: document.getElementById('trazo').getAttribute('d') }));
  await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(900);
  const despues = await p.evaluate(() => ({ p: __estado.p, tl: __motor.tl().progress(), chorro: __estado.chorro, d: document.getElementById('trazo').getAttribute('d'),
    pico: (() => { const a = document.getElementById('pico').getBoundingClientRect(); return [Math.round(a.left), Math.round(a.top)]; })() }));
  await p.screenshot({ path: `${out}/onrefresh_${v}.png` }); R[v] = { antes, despues }; await p.close(); }
console.log(JSON.stringify(R, null, 1)); require('node:fs').writeFileSync(`${out}/prueba_onrefresh.json`, JSON.stringify(R, null, 1)); await b.close();
