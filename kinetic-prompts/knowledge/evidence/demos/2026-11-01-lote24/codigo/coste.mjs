import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const b = await chromium.launch(); const res = {};
for (const [nombre, url] of [['A','receta_a_continuidad.html'],['B_n6000','receta_b_particulas.html?n=6000'],['B_n20000','receta_b_particulas.html?n=20000'],['C','receta_c_producto_fijo.html']]) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); await p.goto('http://127.0.0.1:8790/' + url); await p.waitForTimeout(900);
  const { ini, fin } = await p.evaluate(() => { const s = document.getElementById('acto'); return { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
  await p.evaluate(v => scrollTo(0, v), ini); await p.waitForTimeout(200); await p.evaluate(() => window.__estado.trabajo = []);
  for (let i = 0; i <= 60; i++) { await p.evaluate(v => scrollTo(0, v), ini + (fin - ini) * i / 60); await p.waitForTimeout(40); }
  const t = (await p.evaluate(() => window.__estado.trabajo)).sort((a, b) => a - b); const q = x => +t[Math.floor((t.length - 1) * x)].toFixed(2);
  res[nombre] = { muestras: t.length, p50_ms: q(.5), p95_ms: q(.95), max_ms: q(1), n: await p.evaluate(() => window.__estado.n ?? null) }; await p.close();
}
console.log(JSON.stringify(res, null, 1)); await b.close();
