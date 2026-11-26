// Experimento lote 26: ¿se pierde la posición de scroll al cruzar un punto de corte de gsap.matchMedia()?
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const out = process.argv[2]; const b = await chromium.launch(); const R = {};
for (const q of ['motor=nativo', 'motor=gsap&sinMovil=1', 'motor=gsap&sinRestaurarScroll=1', 'motor=gsap', 'motor=gsap&pin=1']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://127.0.0.1:8791/receta_a.html?' + q); await p.waitForFunction(() => window.__motor); await p.waitForTimeout(500);
  await p.evaluate(() => scrollTo(0, 2430)); await p.waitForTimeout(400);
  const s = () => p.evaluate(() => ({ scrollY, p: window.__estado.p, construcciones: window.__estado.construcciones }));
  const serie = [{ w: 1440, ...(await s()) }];
  for (const w of [1400, 375, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(700); serie.push({ w, ...(await s()) }); }
  R[q] = serie; await p.close(); }
console.log(JSON.stringify(R, null, 0)); require('node:fs').writeFileSync(out + '/prueba_breakpoint.json', JSON.stringify(R, null, 1)); await b.close();
