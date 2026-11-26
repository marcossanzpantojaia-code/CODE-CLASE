// Auditoría VISUAL de una escena por scroll (lote 25). Complementa medir_escena_scroll.mjs (mecánica).
// Uso: node auditoria_visual_escena.mjs <url> <salida_dir> '<json>' [ancho] [pasos]
//   json = { "protagonista": "#jarra", "textos": [".t1 .linea > span", ".t2 .linea > span"], "lienzo": "canvas" (opcional) }
// Mide en N pasos del tramo fijado:
//   - tamaño del protagonista (ancho visible / ancho de ventana) y si está dentro del encuadre
//   - legibilidad: fracción visible de cada línea de texto dentro de su máscara (padre con overflow hidden)
//   - "momentos sin protagonista": pasos en los que el protagonista mide < umbral o está fuera
//   - opcional (lienzo): cobertura y contraste de lo dibujado en el canvas (p. ej., partículas)
//   - reversibilidad VISUAL: capturas bajando y subiendo en las mismas posiciones y % de píxeles distintos
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import fs from 'node:fs'; import path from 'node:path';
const [url, out, cfgS, anchoS = '1440', pasosS = '20'] = process.argv.slice(2);
const CFG = JSON.parse(cfgS), W = +anchoS, H = W < 500 ? 812 : 900, N = +pasosS;
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: W, height: H } }); const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800);
const { ini, fin } = await p.evaluate(() => { const s = document.getElementById('acto'); return { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
const pos = Array.from({ length: N + 1 }, (_, i) => Math.round(ini + (fin - ini) * i / N));
const medir = () => p.evaluate(cfg => {
  const vw = innerWidth, vh = innerHeight, r = {};
  const pr = document.querySelector(cfg.protagonista)?.getBoundingClientRect();
  if (pr) { const vis = Math.max(0, Math.min(pr.right, vw) - Math.max(pr.left, 0)) * Math.max(0, Math.min(pr.bottom, vh) - Math.max(pr.top, 0));
    r.protagonista_ancho = +(pr.width / vw).toFixed(3); r.protagonista_visible = +(vis / (pr.width * pr.height || 1)).toFixed(3); }
  r.textos = (cfg.textos || []).flatMap(sel => [...document.querySelectorAll(sel)].map(el => {
    const m = el.parentElement.getBoundingClientRect(), t = el.getBoundingClientRect();
    const v = Math.max(0, Math.min(m.bottom, t.bottom) - Math.max(m.top, t.top)) / (t.height || 1);
    const op = +getComputedStyle(el.closest('[class]')).opacity;
    return +(v * op).toFixed(2); }));
  if (cfg.lienzo) { const c = document.querySelector(cfg.lienzo), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0, lum = 0; for (let i = 0; i < d.length; i += 16) { const a = d[i + 3]; if (a > 10) { n++; lum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) * a / 255; } }
    r.lienzo_cobertura = +(n / (d.length / 16)).toFixed(4); r.lienzo_luminancia_media = n ? +(lum / n).toFixed(1) : 0; }
  r.p = window.__estado?.p; return r; }, CFG);
const baja = [];
for (const [i, y] of pos.entries()) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(90); baja.push(await medir()); await p.screenshot({ path: path.join(out, `b_${i}.png`) }); }
for (const [i, y] of [...pos.entries()].reverse()) { await p.evaluate(v => scrollTo(0, v), y); await p.waitForTimeout(90); await p.screenshot({ path: path.join(out, `s_${i}.png`) }); }
// diferencia visual bajando/subiendo, calculada en el propio navegador
const difs = [];
for (let i = 0; i <= N; i++) {
  const a = fs.readFileSync(path.join(out, `b_${i}.png`)).toString('base64'), c = fs.readFileSync(path.join(out, `s_${i}.png`)).toString('base64');
  difs.push(await p.evaluate(async ([a, c]) => { const ld = s => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.src = 'data:image/png;base64,' + s; });
    const [ia, ic] = await Promise.all([ld(a), ld(c)]); const cv = new OffscreenCanvas(ia.width, ia.height), g = cv.getContext('2d');
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data; g.clearRect(0, 0, cv.width, cv.height); g.drawImage(ic, 0, 0); const dc = g.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0; for (let k = 0; k < da.length; k += 4) if (Math.abs(da[k] - dc[k]) + Math.abs(da[k + 1] - dc[k + 1]) + Math.abs(da[k + 2] - dc[k + 2]) > 24) n++;
    return +(n / (da.length / 4)).toFixed(5); }, [a, c]));
}
for (let i = 0; i <= N; i++) { fs.unlinkSync(path.join(out, `b_${i}.png`)); fs.unlinkSync(path.join(out, `s_${i}.png`)); }
const sinProt = baja.filter(r => r.protagonista_ancho !== undefined && (r.protagonista_ancho < (CFG.umbral_protagonista ?? 0.2) || r.protagonista_visible < 0.6)).map(r => r.p);
const sinTexto = baja.filter(r => r.textos.length && Math.max(...r.textos) < 0.95).map(r => r.p);
const R = { url, ancho: W, pasos: N + 1, cfg: CFG, resumen: {
  protagonista_ancho_min: Math.min(...baja.map(r => r.protagonista_ancho ?? 1)), protagonista_ancho_max: Math.max(...baja.map(r => r.protagonista_ancho ?? 0)),
  pasos_sin_protagonista_claro: sinProt, pasos_sin_ninguna_linea_legible: sinTexto,
  lienzo_cobertura_min: CFG.lienzo ? Math.min(...baja.map(r => r.lienzo_cobertura)) : null,
  reversibilidad_visual_max_pct: +(Math.max(...difs) * 100).toFixed(3) }, baja, difs };
fs.writeFileSync(path.join(out, 'auditoria.json'), JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.resumen)); await b.close();
