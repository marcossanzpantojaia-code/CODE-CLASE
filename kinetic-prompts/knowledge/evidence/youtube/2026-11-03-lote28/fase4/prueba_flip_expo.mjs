// Fase 4 (lote 28): aterrizaje del héroe en el nido del plato — cálculo manual (lote 27) frente a Flip.fit(fitChild) + expoScale.
// Mide: error de alineación de los nidos (px) en p = .86 y .90; ritmo del zoom (log del área frente a la curva power2.inOut).
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import fs from 'node:fs';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const V = { manual: 'index.html?motor=gsap', flip_expo: 'index_flip.html?motor=gsap&modo=flip', flip_lineal: 'index_flip.html?motor=gsap&modo=flip&expo=0' };
const io = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const b = await chromium.launch(); const R = {};
for (const [nombre, ruta] of Object.entries(V)) for (const [W, H, resize] of [[1440, 900, 0], [375, 812, 0], [1440, 900, 1]]) {
  const p = await b.newPage({ viewport: { width: W, height: H } }); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://127.0.0.1:8793/' + ruta); await p.waitForFunction(() => window.__motor || window.__error); await p.waitForTimeout(600);
  if (resize) { for (const [w, h] of [[375, 812], [1024, 768], [W, H]]) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(700); } }
  const ir = q => p.evaluate(q => { const s = __motor.st(); scrollTo(0, s.start + (s.end - s.start) * q); }, q);
  const serie = [];
  for (let q = .70; q <= 1.0001; q += .01) { await ir(q); await p.waitForTimeout(110); serie.push({ q: +q.toFixed(2), ...(await p.evaluate(() => window.__medirNidos())) }); }
  const en = q => serie.find(s => Math.abs(s.q - q) < .001);
  const tramo = serie.filter(s => s.q >= .72 && s.q <= .86), a0 = Math.log(tramo[0].areaH), a1 = Math.log(tramo.at(-1).areaH);
  const rms = Math.sqrt(tramo.reduce((acc, s) => { const t = (s.q - .72) / .14, f = (Math.log(s.areaH) - a0) / (a1 - a0 || 1); return acc + (f - io(t)) ** 2; }, 0) / tramo.length);
  await ir(.86); await p.waitForTimeout(150); await p.screenshot({ path: `${out}/${nombre}_${W}${resize ? '_resize' : ''}_086.png` });
  R[`${nombre} ${W}x${H}${resize ? ' tras resize' : ''}`] = { error_086_px: Math.hypot(en(.86).dx, en(.86).dy).toFixed(2), error_090_px: Math.hypot(en(.9).dx, en(.9).dy).toFixed(2),
    ancho_nido_heroe_vs_plato_086: [en(.86).anchoH, en(.86).anchoP], rms_logarea_vs_power2inOut: +rms.toFixed(4), errores: errs };
  await p.close(); }
console.log(JSON.stringify(R, null, 1)); fs.writeFileSync(`${out}/prueba_flip_expo.json`, JSON.stringify(R, null, 1)); await b.close();
