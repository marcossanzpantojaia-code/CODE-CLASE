// Curvas valor/progreso controladas por scroll (lote 21; criterio C2 de EVAL-001).
// Uso: node curvas_scroll.mjs <url> <salida.json> '<json de selectores>' [ancho=1440] [pasos=60] [desdePx=0] [hastaPx=auto]
//   selectores: {"titular":"h1","objeto":".objeto"}  · se mide opacity, translateX/Y, escala y rotación
//   (de la matriz computada) y el rectángulo en pantalla.
//   Si la página expone window.__secuencia = { frame: n } (SEQ-001), se registra el fotograma dibujado.
// Informa: entrada (primer paso con opacidad > 0,01 y visible) y salida; no monotonía; saltos de fotograma > 2.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import fs from 'node:fs';
const [url, out, selJson, anchoS = '1440', pasosS = '60', desdeS = '0', hastaS = ''] = process.argv.slice(2);
const SEL = JSON.parse(selJson); const W = +anchoS, PASOS = +pasosS;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: W < 500 ? 812 : 900 }, isMobile: W < 500, reducedMotion: 'no-preference' });
const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const desde = +desdeS, hasta = hastaS ? +hastaS : total;
const filas = [];
for (let i = 0; i <= PASOS; i++) {
  const y = Math.round(desde + (hasta - desde) * i / PASOS);
  await p.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y);
  await p.waitForTimeout(140); // dejar que scrub/lerp alcancen el valor
  const m = await p.evaluate(sel => {
    const r = {};
    for (const [k, s] of Object.entries(sel)) {
      const e = document.querySelector(s); if (!e) { r[k] = null; continue; }
      const cs = getComputedStyle(e); const M = new DOMMatrixReadOnly(cs.transform === 'none' ? undefined : cs.transform);
      const q = e.getBoundingClientRect();
      r[k] = { op: +(+cs.opacity).toFixed(3), tx: +M.m41.toFixed(1), ty: +M.m42.toFixed(1), esc: +Math.hypot(M.m11, M.m12).toFixed(3), rot: +(Math.atan2(M.m12, M.m11) * 180 / Math.PI).toFixed(1),
               top: Math.round(q.top), left: Math.round(q.left), w: Math.round(q.width), h: Math.round(q.height), visible: q.bottom > 0 && q.top < innerHeight && q.width > 0 };
    }
    r.__frame = window.__secuencia ? window.__secuencia.frame : null;
    return r;
  }, SEL);
  filas.push({ paso: i, progreso: +(i / PASOS).toFixed(3), scrollY: y, ...m });
}
const resumen = {};
for (const k of Object.keys(SEL)) {
  const v = filas.map(f => f[k]).filter(Boolean);
  const vis = filas.filter(f => f[k] && f[k].visible && f[k].op > 0.01);
  const dirs = []; for (let i = 1; i < v.length; i++) { const d = Math.sign(v[i].op - v[i - 1].op); if (d) dirs.push(d); }
  const cambiosSentidoOpacidad = dirs.filter((d, i) => i && d !== dirs[i - 1]).length;
  resumen[k] = { entrada_progreso: vis[0]?.progreso ?? null, salida_progreso: vis.at(-1)?.progreso ?? null, cambios_sentido_opacidad: cambiosSentidoOpacidad };
}
const fr = filas.map(f => f.__frame).filter(x => x != null);
const saltos = fr.slice(1).map((x, i) => Math.abs(x - fr[i])).filter(d => d > 2).length;
resumen.__secuencia = fr.length ? { fotogramas_muestreados: fr.length, saltos_mayores_de_2: saltos, monotona: fr.every((x, i) => !i || x >= fr[i - 1]) } : 'no expuesta (window.__secuencia)';
fs.writeFileSync(out, JSON.stringify({ url, ancho: W, pasos: PASOS, desde, hasta, fecha: new Date().toISOString(), resumen, filas }, null, 1));
console.log(JSON.stringify(resumen));
await b.close();
