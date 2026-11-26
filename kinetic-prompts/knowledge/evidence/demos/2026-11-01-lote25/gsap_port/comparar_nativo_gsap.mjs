// Compara VISUALMENTE el motor nativo y el puerto GSAP en los mismos estados (lote 25). PREPARADO, NO EJECUTADO.
// Uso: node comparar_nativo_gsap.mjs <url_nativa> <url_gsap> <salida_dir> [ancho] [espera_ms]
// Para cada p ∈ {0, .25, .5, .75, 1}: lleva ambas páginas a la misma posición del tramo, espera (scrub numérico),
// captura y calcula el % de píxeles distintos (> 24 niveles sumando RGB). Además, en la versión GSAP:
//  - reversibilidad visual (bajar y subir), - número de ScrollTriggers tras 5 resize (no debe crecer),
//  - reduced motion (debe marcar .rm y no crear triggers).
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import fs from 'node:fs'; import path from 'node:path';
const [uN, uG, out, anchoS = '1440', esperaS = '400'] = process.argv.slice(2); const W = +anchoS, H = W < 500 ? 812 : 900, E = +esperaS;
fs.mkdirSync(out, { recursive: true }); const b = await chromium.launch();
async function capturas(url) { const p = await b.newPage({ viewport: { width: W, height: H } }); await p.goto(url); await p.waitForTimeout(900);
  const { ini, fin } = await p.evaluate(() => { const s = document.getElementById('acto'); const st = window.ScrollTrigger?.getAll()[0];
    return st ? { ini: st.start, fin: st.end } : { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
  const r = []; for (const q of [0, .25, .5, .75, 1]) { await p.evaluate(v => scrollTo(0, v), Math.round(ini + (fin - ini) * q)); await p.waitForTimeout(E); r.push(await p.screenshot()); }
  return { p, r, ini, fin }; }
const dif = (p, a, c) => p.evaluate(async ([a, c]) => { const ld = s => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + s; });
  const [x, y] = await Promise.all([ld(a), ld(c)]); const cv = new OffscreenCanvas(x.width, x.height), g = cv.getContext('2d'); g.drawImage(x, 0, 0); const A = g.getImageData(0, 0, cv.width, cv.height).data;
  g.clearRect(0, 0, cv.width, cv.height); g.drawImage(y, 0, 0); const C = g.getImageData(0, 0, cv.width, cv.height).data; let n = 0;
  for (let k = 0; k < A.length; k += 4) if (Math.abs(A[k] - C[k]) + Math.abs(A[k + 1] - C[k + 1]) + Math.abs(A[k + 2] - C[k + 2]) > 24) n++; return +(100 * n / (A.length / 4)).toFixed(3); }, [a.toString('base64'), c.toString('base64')]);
const N = await capturas(uN), G = await capturas(uG); const R = { nativo: uN, gsap: uG, ancho: W, espera_ms: E, diferencia_pct: [] };
for (let i = 0; i < 5; i++) { R.diferencia_pct.push(await dif(N.p, N.r[i], G.r[i])); fs.writeFileSync(path.join(out, `nativo_${i}.png`), N.r[i]); fs.writeFileSync(path.join(out, `gsap_${i}.png`), G.r[i]); }
R.gsap_info = await G.p.evaluate(() => window.__gsapInfo ? { version: window.__gsapInfo.version, triggers: window.__gsapInfo.triggers() } : null);
for (let k = 0; k < 5; k++) { await G.p.setViewportSize({ width: W - 40 * (k % 2), height: H }); await G.p.waitForTimeout(300); }
R.gsap_triggers_tras_resize = await G.p.evaluate(() => window.__gsapInfo?.triggers());
const rm = await b.newPage({ viewport: { width: W, height: H }, reducedMotion: 'reduce' }); await rm.goto(uG); await rm.waitForTimeout(800);
R.gsap_reduced_motion = await rm.evaluate(() => ({ rm: document.documentElement.classList.contains('rm'), triggers: window.ScrollTrigger?.getAll().length }));
fs.writeFileSync(path.join(out, 'comparacion.json'), JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close();
