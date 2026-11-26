// Validación REAL nativo frente a GSAP 3.15.0 de una receta (lote 26).
// Uso: node validar_gsap.mjs <url_base_de_la_receta> <salida_dir> [ancho=1440]
//   url_base: p. ej. http://127.0.0.1:8791/receta_a.html  (se añaden ?motor=…&pin=…&scrub=…)
// Guarda capturas PNG y resultados.json. Las diferencias de píxeles se calculan después con diferencias.py
// (sin umbral de tolerancia oculto: se informa del % de píxeles con CUALQUIER diferencia y del máximo por píxel).
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const [base, out, anchoS = '1440', altoS] = process.argv.slice(2);
const W = +anchoS, H = altoS ? +altoS : (W < 500 ? 812 : 900), Q = [0, .25, .5, .75, 1];
fs.mkdirSync(out, { recursive: true });
const R = { url: base, ancho: W, alto: H, fecha: new Date().toISOString(), errores: {} };
const b = await chromium.launch();
const url = o => base + '?' + new URLSearchParams(o).toString();
async function abrir(nombre, o, ctxOpts = {}) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, ...ctxOpts }); const p = await ctx.newPage();
  const errs = R.errores[nombre] = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
  const red = [];
  p.on('response', async r => { if (r.url().includes('gsap')) { const body = await r.body().catch(() => null);
    red.push({ url: r.url(), estado: r.status(), bytes: body?.length, sha256: body ? crypto.createHash('sha256').update(body).digest('hex') : null }); } });
  await p.goto(url(o), { waitUntil: 'load' }); await p.waitForFunction(() => window.__motor || window.__error, null, { timeout: 8000 }); await p.waitForTimeout(500);
  return { ctx, p, red };
}
const rango = p => p.evaluate(() => { const st = window.__motor?.st?.(); const s = document.getElementById('acto');
  return st ? { ini: st.start, fin: st.end } : { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
const estado = p => p.evaluate(() => { const e = { ...window.__estado }; delete e.dt; delete e.trabajo; return e; });
async function ir(p, q, espera = 350) { const { ini, fin } = await rango(p); await p.evaluate(y => scrollTo(0, y), Math.round(ini + (fin - ini) * q)); await p.waitForTimeout(espera); }
async function capturarEstados(nombre, o) {
  const { ctx, p, red } = await abrir(nombre, o); const r = { opciones: o, estados: [] };
  for (const [i, q] of Q.entries()) { await ir(p, q); const f = path.join(out, `${nombre}_${i}.png`); await p.screenshot({ path: f }); r.estados.push({ q, archivo: path.basename(f), ...(await estado(p)) }); }
  r.motor = await p.evaluate(() => ({ nombre: window.__motor?.nombre, gsap: window.gsap ? window.gsap.version : null, scrollTrigger: window.ScrollTrigger ? window.ScrollTrigger.version : null,
    triggers: window.__motor?.triggers?.() ?? null, st: window.__motor?.st?.() ?? null, alto_documento: document.documentElement.scrollHeight }));
  r.red_gsap = red; await ctx.close(); return r;
}
// 1–2. Carga y estados (nativo, GSAP sticky, GSAP pin)
R.nativo = await capturarEstados('nativo', { motor: 'nativo' });
R.gsap = await capturarEstados('gsap', { motor: 'gsap' });
R.gsap_pin = await capturarEstados('gsap_pin', { motor: 'gsap', pin: 1 });
// 3. Pin: el escenario debe permanecer en top = 0 y position: fixed durante el tramo; recorrido igual al nativo
{ const { ctx, p } = await abrir('pin_chk', { motor: 'gsap', pin: 1 }); const muestras = [];
  for (const q of [.02, .2, .5, .8, .98]) { await ir(p, q, 250); muestras.push({ q, ...(await p.evaluate(() => { const e = document.querySelector('.escenario');
    return { top: Math.round(e.getBoundingClientRect().top), position: getComputedStyle(e).position, spacer: e.parentElement.classList.contains('pin-spacer') }; })) }); }
  R.pin = { muestras, recorrido_px: await rango(p).then(r => r.fin - r.ini), alto_doc_pin: await p.evaluate(() => document.documentElement.scrollHeight) };
  await ctx.close(); }
// 4. Scrub numérico: retraso y asentamiento (GSAP scrub: 0.8 frente a nativo con la aproximación exponencial)
for (const m of ['gsap', 'nativo']) { const { ctx, p } = await abrir('scrub_' + m, { motor: m, scrub: 0.8 }); await ir(p, 0, 300);
  const { ini, fin } = await rango(p); const t0 = Date.now(); await p.evaluate(y => scrollTo(0, y), Math.round(ini + (fin - ini) * .5)); const serie = [];
  for (const t of [50, 150, 300, 500, 800, 1200, 2000]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); serie.push({ ms: Date.now() - t0, p: (await estado(p)).p }); }
  (R.scrub ||= {})[m] = serie; await p.screenshot({ path: path.join(out, `scrub08_${m}_asentado.png`) }); await ctx.close(); }
// 5. Reversibilidad: 21 posiciones bajando y subiendo (GSAP sticky y pin); capturas en los 5 estados en ambos sentidos
for (const [nombre, o] of [['gsap', { motor: 'gsap' }], ['gsap_pin', { motor: 'gsap', pin: 1 }], ['nativo', { motor: 'nativo' }]]) {
  const { ctx, p } = await abrir('rev_' + nombre, o); const baja = [], sube = [];
  const pasos = Array.from({ length: 21 }, (_, i) => i / 20);
  for (const q of pasos) { await ir(p, q, 120); baja.push(await estado(p)); if (Q.includes(q)) await p.screenshot({ path: path.join(out, `rev_${nombre}_baja_${q}.png`) }); }
  for (const q of [...pasos].reverse()) { await ir(p, q, 120); sube.unshift(await estado(p)); if (Q.includes(q)) await p.screenshot({ path: path.join(out, `rev_${nombre}_sube_${q}.png`) }); }
  const dif = baja.map((e, i) => { const s = sube[i]; let m = 0; for (const k in e) { const a = e[k], c = s[k];
    if (typeof a === 'number' && typeof c === 'number') m = Math.max(m, Math.abs(a - c)); else if (Array.isArray(a)) a.forEach((x, j) => m = Math.max(m, Math.abs(x - c[j]))); } return +m.toFixed(4); });
  (R.reversibilidad ||= {})[nombre] = { diferencia_max_valores: Math.max(...dif), por_paso: dif }; await ctx.close(); }
// 6. Resize: 5 cambios de tamaño (incluido cruzar el punto de corte de 700 px) → triggers y reconstrucciones; después,
//    comparación con una carga limpia en el tamaño final, en p = 0 y en p = 0,5
{ const { ctx, p } = await abrir('resize', { motor: 'gsap' }); await ir(p, .7); const serie = [];
  const otro = W > 700 ? 375 : 1024; const tamanos = [[W - 40, H], [otro, H], [W, H], [W - 40, H - 60], [W, H]];
  for (const [w, h] of tamanos) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(700);
    serie.push({ w, h, ...(await p.evaluate(() => ({ triggers: window.__motor.triggers(), construcciones: window.__estado.construcciones, p: window.__estado.p }))) }); }
  // captura SIN volver a hacer scroll: el navegador puede haber movido scrollY al cambiar el alto del documento,
  // así que la referencia nativa se toma en el MISMO scrollY (mismo progreso), no en q = 0,7
  const syR = await p.evaluate(() => scrollY); R.resize = { serie, scrollY_tras_serie: syR, p_tras_serie: (await estado(p)).p };
  await p.screenshot({ path: path.join(out, 'resize_gsap_tras_0.7.png') });
  for (const q of [.5, 0]) { await ir(p, q, 500); await p.screenshot({ path: path.join(out, `resize_gsap_tras_${q}.png`) }); }
  await ctx.close();
  { const n = await abrir('resize_ref', { motor: 'nativo' }); await n.p.evaluate(y => scrollTo(0, y), syR); await n.p.waitForTimeout(500);
    R.resize.p_referencia_nativa = (await estado(n.p)).p; await n.p.screenshot({ path: path.join(out, 'resize_nativo_limpio_0.7.png') }); await n.ctx.close(); }
  for (const q of [.5, 0]) { const n = await abrir('resize_ref', { motor: 'nativo' }); await ir(n.p, q, 500); await n.p.screenshot({ path: path.join(out, `resize_nativo_limpio_${q}.png`) }); await n.ctx.close(); } }
// 7. Reduced motion: desde la carga y cambiando la preferencia en caliente (matchMedia debe revertir y reconstruir)
{ const out7 = {};
  for (const m of ['gsap', 'nativo']) { const { ctx, p } = await abrir('rm_' + m, { motor: m }, { reducedMotion: 'reduce' });
    out7[m] = await p.evaluate(() => ({ rm: document.documentElement.classList.contains('rm'), triggers: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : null, alto: document.documentElement.scrollHeight }));
    await p.screenshot({ path: path.join(out, `reduced_${m}.png`), fullPage: true }); await ctx.close(); }
  const { ctx, p } = await abrir('rm_caliente', { motor: 'gsap' }); const paso = async n => ({ fase: n, ...(await p.evaluate(() => ({ rm: document.documentElement.classList.contains('rm'), triggers: window.__motor.triggers(), construcciones: window.__estado.construcciones }))) });
  const fases = [await paso('inicio')]; await p.emulateMedia({ reducedMotion: 'reduce' }); await p.waitForTimeout(400); fases.push(await paso('reduce'));
  await p.emulateMedia({ reducedMotion: 'no-preference' }); await p.waitForTimeout(400); fases.push(await paso('no-preference'));
  out7.cambio_en_caliente = fases; R.reduced_motion = out7; await ctx.close(); }
// 8. Desmontaje: mm.revert() + ticker
{ const { ctx, p } = await abrir('destruir', { motor: 'gsap', pin: 1 }); await ir(p, .5);
  const antes = await p.evaluate(() => ({ triggers: window.__motor.triggers(), dt: window.__estado.dt.length, spacer: !!document.querySelector('.pin-spacer'), clase: document.documentElement.className }));
  await p.evaluate(() => window.__motor.destruir()); await p.waitForTimeout(100); const n1 = await p.evaluate(() => window.__estado.dt.length); await p.waitForTimeout(500);
  const despues = await p.evaluate(() => ({ triggers: window.ScrollTrigger.getAll().length, spacer: !!document.querySelector('.pin-spacer'), clase: document.documentElement.className,
    estilos_en_linea: [...document.querySelectorAll('.escenario *')].filter(e => e.style.transform || e.style.clipPath || e.style.translate).map(e => (e.id || e.getAttribute('class')) + ': ' + e.getAttribute('style')) }));
  despues.ticker_sigue = (await p.evaluate(() => window.__estado.dt.length)) !== n1; R.destruir = { antes, despues }; await ctx.close(); }
// 9. Rendimiento real del navegador durante un recorrido con rueda (sin grabación): CDP Performance + rAF
for (const [nombre, o] of [['gsap', { motor: 'gsap' }], ['nativo', { motor: 'nativo' }], ['gsap_pin', { motor: 'gsap', pin: 1 }]]) {
  const { ctx, p } = await abrir('perf_' + nombre, o); const cdp = await ctx.newCDPSession(p); await cdp.send('Performance.enable');
  await ir(p, 0, 300);
  await p.evaluate(() => { window.__fr = []; let u = performance.now(); const f = t => { window.__fr.push(t - u); u = t; if (!window.__parar) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value])); const { ini, fin } = await rango(p);
  await p.mouse.move(W / 2, H / 2); const t0 = Date.now();
  for (let y = 0; y < (fin - ini) + 200; y += 60) { await p.mouse.wheel(0, 60); await p.waitForTimeout(16); }
  for (let y = 0; y < (fin - ini) + 200; y += 60) { await p.mouse.wheel(0, -60); await p.waitForTimeout(16); }
  await p.waitForTimeout(300); const dur = (Date.now() - t0) / 1000;
  const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const fr = await p.evaluate(() => { window.__parar = 1; return window.__fr.slice(1); }); const tr = await p.evaluate(() => window.__estado.trabajo.slice());
  const pct = (a, k) => { const s = [...a].sort((x, y) => x - y); return +s[Math.min(s.length - 1, Math.floor(k * s.length))].toFixed(2); };
  const d = k => +((m1[k] - m0[k]) * 1000).toFixed(1);
  (R.rendimiento ||= {})[nombre] = { duracion_s: +dur.toFixed(2),
    script_ms: d('ScriptDuration'), estilo_ms: d('RecalcStyleDuration'), layout_ms: d('LayoutDuration'), tareas_ms: d('TaskDuration'),
    otros_ms_pintado_composicion_gc: +(d('TaskDuration') - d('ScriptDuration') - d('RecalcStyleDuration') - d('LayoutDuration')).toFixed(1),
    actualizar_receta_ms: { p50: pct(tr, .5), p95: pct(tr, .95), max: pct(tr, 1) },
    fotogramas: { n: fr.length, p50: pct(fr, .5), p95: pct(fr, .95), max: pct(fr, 1), mayores_33ms: fr.filter(x => x > 33.4).length, mayores_50ms: fr.filter(x => x > 50).length } };
  await ctx.close(); }
// 10. Grabaciones reales: bajada y subida completas con la rueda (GSAP sticky, GSAP pin y nativo)
for (const [nombre, o] of [['gsap', { motor: 'gsap' }], ['gsap_pin', { motor: 'gsap', pin: 1 }], ['nativo', { motor: 'nativo' }]]) {
  const dir = path.join(out, 'video_' + nombre); fs.rmSync(dir, { recursive: true, force: true });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir, size: { width: W, height: H } } }); const p = await ctx.newPage();
  await p.goto(url(o)); await p.waitForFunction(() => window.__motor); await p.waitForTimeout(600); await p.mouse.move(W / 2, H / 2);
  const { ini, fin } = await rango(p); const total = fin + 300;
  for (let y = 0; y < total; y += 40) { await p.mouse.wheel(0, 40); await p.waitForTimeout(30); } await p.waitForTimeout(400);
  for (let y = 0; y < total; y += 40) { await p.mouse.wheel(0, -40); await p.waitForTimeout(30); } await p.waitForTimeout(400);
  await ctx.close(); const v = fs.readdirSync(dir).find(f => f.endsWith('.webm')); fs.renameSync(path.join(dir, v), path.join(out, `recorrido_${nombre}.webm`)); fs.rmSync(dir, { recursive: true }); }
fs.writeFileSync(path.join(out, 'resultados.json'), JSON.stringify(R, null, 1));
console.log(JSON.stringify({ errores: R.errores, gsap: R.gsap.motor, red: R.gsap.red_gsap, pin: R.pin, scrub: R.scrub, rev: Object.fromEntries(Object.entries(R.reversibilidad).map(([k, v]) => [k, v.diferencia_max_valores])), resize: R.resize, rm: R.reduced_motion, destruir: R.destruir, rend: R.rendimiento }, null, 0));
await b.close();
