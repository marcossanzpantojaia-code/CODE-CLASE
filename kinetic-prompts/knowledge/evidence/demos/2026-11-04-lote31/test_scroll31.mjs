// node test_scroll31.mjs <url_base> <salida.json> [ancho] [alto]
// Escenarios por estrategia: lento, rápido, inversión inmediata (zigzag), saltos de barra, resize, reduced motion,
// recursos retrasados, desmontaje. Mide por FOTOGRAMA RENDERIZADO (registro en la página), no por escalones.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const [,, base, out, Wa, Ha] = process.argv; const W = +(Wa || 1280), H = +(Ha || 720);
const b = await chromium.launch();
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function abrir(e, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: opts.reducir ? 'reduce' : 'no-preference', hasTouch: false });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', x => errs.push(String(x))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  if (opts.retraso) await p.route('**/recursos/**', async r => { await sleep(opts.retraso); r.continue(); });
  await p.goto(`${base}/prueba_scroll.html?e=${e}`, { waitUntil: opts.noEsperar ? 'commit' : 'load' });
  if (!opts.noEsperar) await p.waitForFunction('window.__listo', null, { timeout: 20000 });
  await p.mouse.move(W / 2, H / 2);
  return { p, ctx, errs };
}
const geo = p => p.evaluate(() => { const a = document.getElementById('acto'); const top = a.offsetTop, len = a.offsetHeight - innerHeight; return { top, len }; });
const irA = (p, y) => p.evaluate(y => window.scrollTo(0, y), y);
async function grabar(p, fn) { await p.evaluate(() => { window.__frames = []; window.__grabar = true; }); await fn(); await sleep(300); return p.evaluate(() => { window.__grabar = false; return window.__frames; }); }
function analizar(fr) {
  let salto = [], dop = 0, esp = 0, velRelevo = [];
  for (let i = 1; i < fr.length; i++) {
    const a = fr[i - 1], c = fr[i];
    dop = Math.max(dop, Math.abs(c.op - a.op));
    if (a.op >= .5 && c.op < .5) { salto.push(+Math.hypot(a.x - c.nidoPlato.x, a.y - c.nidoPlato.y).toFixed(1)); velRelevo.push(+Math.hypot(c.x - a.x, c.y - a.y).toFixed(1)); }
    if (c.op > .5 && a.op > .5) esp = Math.max(esp, Math.hypot(c.x - a.x, c.y - a.y));
  }
  // separación de nidos mientras el héroe es semitransparente (doble imagen si > 2 px)
  const semi = fr.filter(f => f.op > .05 && f.op < .95), sep = semi.map(f => Math.hypot(f.x - f.nidoPlato.x, f.y - f.nidoPlato.y));
  return { fotogramas: fr.length, relevos: salto.length, salto_visible_relevo_px: salto, desplazamiento_en_relevo_px: velRelevo,
    max_cambio_opacidad_por_fotograma: +dop.toFixed(3), espaciado_max_visible_px: +esp.toFixed(1),
    doble_imagen_fotogramas: sep.filter(s => s > 2).length, max_separacion_semitransparente_px: sep.length ? +Math.max(...sep).toFixed(2) : null,
    tweens_activos_max: Math.max(0, ...fr.map(f => f.activos)), blur_px_max: Math.max(0, ...fr.map(f => f.blur_px || 0)) };
}
const R = { viewport: [W, H], estrategias: {} };
for (const e of ['A', 'B', 'C']) {
  const r = R.estrategias[e] = {};
  let { p, ctx, errs } = await abrir(e); let g = await geo(p);
  const y0 = g.top - 10, y1 = g.top + g.len + 10, yU = g.top + g.len * .5;
  // 1) lento: 4 px por fotograma (~240 px/s)
  await irA(p, y0); await sleep(200);
  r.lento = analizar(await grabar(p, async () => { for (let y = y0; y < y1; y += 4) { await p.mouse.wheel(0, 4); await sleep(16); } await sleep(1600); }));
  // 2) rápido: 120 px por fotograma
  await irA(p, y0); await sleep(300);
  r.rapido = analizar(await grabar(p, async () => { for (let y = y0; y < y1; y += 120) { await p.mouse.wheel(0, 120); await sleep(16); } await sleep(1600); }));
  // 3) inversión inmediata alrededor del umbral / centro del tramo (zigzag ±60 px cada 50 ms, 8 veces)
  await irA(p, yU - 200); await sleep(300);
  r.zigzag = analizar(await grabar(p, async () => { await p.mouse.wheel(0, 200); for (let k = 0; k < 8; k++) { await sleep(50); await p.mouse.wheel(0, k % 2 ? 60 : -60); } await sleep(1600); }));
  r.zigzag.estado_final = await p.evaluate(() => ({ tl: +T.tl.progress().toFixed(4), op: window.__st.op }));
  // 4) saltos con la barra (scrollTo instantáneo): fin, inicio, mitad
  const saltos = [];
  for (const [nombre, y] of [['fin', y1 + 200], ['inicio', y0 - 200], ['mitad', yU + 5], ['inicio2', y0 - 200]]) {
    await irA(p, y); await sleep(e === 'B' ? 1400 : 250);
    saltos.push({ nombre, ...(await p.evaluate(() => ({ tl: +T.tl.progress().toFixed(4), op: +window.__st.op.toFixed(3), sep: +Math.hypot(window.__st.x - window.__st.nidoPlato.x, window.__st.y - window.__st.nidoPlato.y).toFixed(2) })) ) });
  }
  r.saltos = saltos;
  // 5) resize a mitad del tramo: geometría reconstruida → al final, nidos alineados
  await irA(p, y1 + 50); await sleep(e === 'B' ? 1400 : 300);
  await p.setViewportSize({ width: Math.round(W * .7), height: Math.round(H * .9) }); await sleep(900);
  const gg = await geo(p); await irA(p, gg.top + gg.len + 10); await sleep(e === 'B' ? 1400 : 300);
  r.resize = await p.evaluate(() => { const s = window.__st; const c = document.getElementById('lienzo'); return { op: s.op, lienzo: [c.width, c.height], viewport: [innerWidth, innerHeight], tl: +T.tl.progress().toFixed(4) }; });
  await p.setViewportSize({ width: W, height: H }); await sleep(600);
  // 6) desmontaje: sin estilos residuales ni lienzo pintado
  r.desmontaje = await p.evaluate(() => { window.destruir(); const st = ['escena', 'plato', 'plato-delante'].map(id => document.getElementById(id).style.transform || ''); const c = document.getElementById('lienzo'); const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let pint = 0; for (let i = 3; i < px.length; i += 4) if (px[i]) { pint++; break; }
    return { transform_residual: st.filter(Boolean), lienzo_pintado: !!pint, triggers: ScrollTrigger.getAll().length, tweens_activos: gsap.globalTimeline.getChildren(true, true, true).filter(x => x.isActive()).length }; });
  r.errores_consola = errs; await ctx.close();
  // 7) reduced motion
  ({ p, ctx, errs } = await abrir(e, { reducir: true })); g = await geo(p);
  await irA(p, g.top + g.len * .2); await sleep(300); const a1 = await p.evaluate(() => ({ tl: T.tl.progress(), op: window.__st.op, blur: window.__st.blur_px }));
  await irA(p, g.top + g.len * .8); await sleep(300); const a2 = await p.evaluate(() => ({ tl: T.tl.progress(), op: window.__st.op, blur: window.__st.blur_px }));
  r.reduced_motion = { antes: a1, despues: a2, errores: errs }; await ctx.close();
  // 8) recursos retrasados 1,5 s: el usuario desplaza ANTES de que estén listos; al estar listos, el estado coincide con la posición
  ({ p, ctx, errs } = await abrir(e, { retraso: 1500, noEsperar: true }));
  await p.waitForFunction('document.getElementById("acto")'); await sleep(300);
  await p.evaluate(() => { const a = document.getElementById('acto'); window.scrollTo(0, a.offsetTop + (a.offsetHeight - innerHeight) * .85); });
  const listoAntes = await p.evaluate(() => window.__listo);
  await p.waitForFunction('window.__listo', null, { timeout: 20000 }); await sleep(e === 'B' ? 1400 : 400);
  r.recursos_retrasados = { listo_antes_de_desplazar: listoAntes, ...(await p.evaluate(() => ({ tl: +T.tl.progress().toFixed(4), op: window.__st.op }))), errores: errs }; await ctx.close();
  console.log(e, JSON.stringify({ lento: r.lento, zig: r.zigzag.estado_final, saltos: r.saltos, resize: r.resize, desm: r.desmontaje, err: r.errores_consola }));
}
fs.writeFileSync(out, JSON.stringify(R, null, 1)); await b.close();
