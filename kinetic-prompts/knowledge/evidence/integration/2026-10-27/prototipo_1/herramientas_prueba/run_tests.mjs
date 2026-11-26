// Pruebas del prototipo n.º 1 con Playwright (ya instalado). Uso: node run_tests.mjs <url> <carpeta_salida>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import fs from 'node:fs';
import path from 'node:path';

const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const R = { url, fecha: new Date().toISOString(), resultados: {} };
const browser = await chromium.launch();
R.navegador = browser.version();

async function nueva(opts = {}) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const log = { consola: [], errores: [], fallidas: [], peticiones: [] };
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.consola.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', e => log.errores.push(String(e)));
  page.on('requestfailed', r => log.fallidas.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('request', r => log.peticiones.push(`${r.method()} ${r.url().slice(0, 120)}`));
  return { ctx, page, log };
}

// 1. Carga, consola, recursos y capturas en 3 anchos
for (const [nombre, vp, extra] of [['escritorio', { width: 1440, height: 900 }, {}], ['tablet', { width: 768, height: 1024 }, {}], ['movil', { width: 375, height: 812 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const { ctx, page, log } = await nueva({ viewport: vp, ...extra });
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'load' });
  const carga_ms = Date.now() - t0;
  await page.screenshot({ path: path.join(out, `${nombre}_inicio.png`) });
  // recorrer para disparar revelados
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= alto; y += Math.round(vp.height * 0.6)) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(250); }
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, `${nombre}_completa.png`), fullPage: true });
  const overflow = await page.evaluate(() => {
    const w = document.documentElement.clientWidth; const culp = [];
    for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > w + 1 || r.left < -1) { const cs = getComputedStyle(el); if (cs.position !== 'fixed' && cs.visibility !== 'hidden' && r.width > 0) culp.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)},${Math.round(r.right)}]`); } }
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: w, hay: document.documentElement.scrollWidth > w, culpables: culp.slice(0, 12) };
  });
  const revelados = await page.evaluate(() => { const r = [...document.querySelectorAll('.reveal')]; return { total: r.length, visibles_tras_scroll: r.filter(e => e.classList.contains('is-in') || getComputedStyle(e).opacity === '1').length }; });
  R.resultados[nombre] = { estado_http: resp.status(), carga_ms, overflow, revelados, consola: log.consola, errores_js: log.errores, peticiones_fallidas: log.fallidas, peticiones: log.peticiones };
  await ctx.close();
}

// 2. Rendimiento de laboratorio (sin Lighthouse): LCP, CLS, tamaños transferidos
{
  const { ctx, page } = await nueva({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.addInitScript(() => {
    window.__m = { lcp: 0, cls: 0, lcpEl: '' };
    new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = e.element ? e.element.tagName + '.' + e.element.className : ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(1500);
  for (let y = 0; y < 6000; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  const m = await page.evaluate(() => ({ ...window.__m, fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime, recursos: performance.getEntriesByType('resource').map(r => ({ n: r.name.split('/').pop(), kb: +(r.transferSize / 1024).toFixed(1) })), doc_kb: +((performance.getEntriesByType('navigation')[0]?.transferSize || 0) / 1024).toFixed(1), nodos_dom: document.getElementsByTagName('*').length }));
  R.resultados.rendimiento_laboratorio = { ...m, nota: 'Chromium sin limitación de red/CPU, servidor local: no comparable con Lighthouse ni con datos de campo' };
  await ctx.close();
}

// 3. Teclado: orden de foco y foco visible
{
  const { ctx, page } = await nueva({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  const pasos = [];
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    pasos.push(await page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
      const hdr = document.querySelector('header'); const hr = hdr ? hdr.getBoundingClientRect() : null; const tapado = hdr && !hdr.contains(a) && getComputedStyle(hdr).position.match(/fixed|sticky/) && r.top < hr.bottom && r.bottom > 0 && r.top >= 0;
      return { el: a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (a.className ? '.' + String(a.className).split(' ')[0] : ''), texto: (a.innerText || a.getAttribute('aria-label') || a.value || '').trim().slice(0, 40), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? `${cs.outlineWidth} ${cs.outlineStyle}` : (cs.boxShadow !== 'none' ? 'box-shadow' : 'NINGUNO'), visible_en_vista: r.bottom > 0 && r.top < innerHeight, posible_tapado_por_cabecera: !!tapado }; }));
  }
  await page.keyboard.press('Enter'); // activar el elemento enfocado en el último paso (registro)
  R.resultados.teclado = { pasos };
  await ctx.close();
}

// 4. Reduced motion: nada oculto, sin animaciones activas
for (const modo of ['reduce', 'no-preference']) {
  const { ctx, page } = await nueva({ viewport: { width: 1440, height: 900 }, reducedMotion: modo });
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(500);
  const est = await page.evaluate(() => {
    const ocultos = [...document.querySelectorAll('.reveal')].filter(e => parseFloat(getComputedStyle(e).opacity) < 0.99).length;
    const anim = document.getAnimations().map(a => ({ nombre: a.animationName || a.constructor.name, objetivo: a.effect?.target ? a.effect.target.tagName.toLowerCase() + '.' + [...a.effect.target.classList].join('.') : '', estado: a.playState }));
    return { reveal_ocultos_en_carga: ocultos, total_reveal: document.querySelectorAll('.reveal').length, animaciones_activas: anim };
  });
  await page.screenshot({ path: path.join(out, `reduced_${modo}.png`) });
  R.resultados[`reduced_motion_${modo}`] = est;
  await ctx.close();
}

// 5. Comportamiento de un revelado (muestras de opacidad/transform en el tiempo)
{
  const { ctx, page } = await nueva({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  const muestra = await page.evaluate(async () => {
    const el = document.querySelector('.reveal:not(.is-in)'); if (!el) return { nota: 'no hay .reveal pendiente' };
    const ini = el.getBoundingClientRect().top + scrollY - innerHeight * 0.5; window.scrollTo(0, ini);
    const s = []; const t0 = performance.now();
    await new Promise(res => { const f = () => { const cs = getComputedStyle(el); s.push({ t: Math.round(performance.now() - t0), op: +(+cs.opacity).toFixed(2), tr: cs.transform }); if (performance.now() - t0 < 1200) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    return { objetivo: el.className, muestras: s.filter((_, i) => i % 6 === 0) };
  });
  R.resultados.revelado_muestras = muestra;
  await ctx.close();
}

// 6. Formulario: envío vacío (errores + foco) y envío válido (sin red)
{
  const { ctx, page, log } = await nueva({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: 'load' });
  const antes = log.peticiones.length;
  const form = page.locator('form').first();
  await form.scrollIntoViewIfNeeded();
  await form.locator('button[type=submit], input[type=submit]').first().click();
  await page.waitForTimeout(300);
  const vacio = await page.evaluate(() => ({ foco: document.activeElement?.name || document.activeElement?.id, errores_visibles: [...document.querySelectorAll('[class*=error], [role=alert]')].filter(e => e.textContent.trim() && e.offsetParent).map(e => e.textContent.trim().slice(0, 60)).slice(0, 6), url: location.href }));
  R.resultados.formulario = { envio_vacio: vacio, peticiones_nuevas_tras_envio_vacio: log.peticiones.slice(antes) };
  await page.screenshot({ path: path.join(out, 'formulario_errores.png') });
  await ctx.close();
}

// 7. Contraste aproximado de textos (fondo opaco más cercano; ignora imágenes y degradados)
{
  const { ctx, page } = await nueva({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(url, { waitUntil: 'load' });
  R.resultados.contraste = await page.evaluate(() => {
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
    const lum = ({ r, g, b }) => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const fondo = el => { while (el) { const cs = getComputedStyle(el); const c = parse(cs.backgroundColor); if (cs.backgroundImage !== 'none' && !(c && c.a > 0.95)) return { incierto: true }; if (c && c.a > 0.95) return c; el = el.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const res = []; const vistos = new Set();
    for (const el of document.querySelectorAll('h1,h2,h3,p,li,a,button,label,span,small,td,th,figcaption,dd,dt')) {
      if (!el.textContent.trim() || !el.offsetParent) continue; const cs = getComputedStyle(el); const fg = parse(cs.color); const bg = fondo(el);
      const clave = cs.color + '|' + JSON.stringify(bg) + '|' + cs.fontSize; if (vistos.has(clave)) continue; vistos.add(clave);
      if (bg.incierto) { res.push({ el: el.tagName, texto: el.textContent.trim().slice(0, 30), ratio: null, nota: 'fondo con imagen/degradado: no medido' }); continue; }
      const a = fg.a; const mix = { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a) };
      const L1 = lum(mix), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700; const grande = px >= 24 || (bold && px >= 18.66);
      res.push({ el: el.tagName, texto: el.textContent.trim().slice(0, 30), px, ratio: +ratio.toFixed(2), minimo: grande ? 3 : 4.5, cumple: ratio >= (grande ? 3 : 4.5) });
    }
    return { medidos: res.filter(r => r.ratio !== null).length, no_medidos: res.filter(r => r.ratio === null).length, fallos: res.filter(r => r.cumple === false), muestra_no_medidos: res.filter(r => r.ratio === null).slice(0, 8) };
  });
  await ctx.close();
}

R.version_playwright = require('playwright/package.json').version;
fs.writeFileSync(path.join(out, 'resultados_pruebas.json'), JSON.stringify(R, null, 1));
await browser.close();
console.log('ok', out);
