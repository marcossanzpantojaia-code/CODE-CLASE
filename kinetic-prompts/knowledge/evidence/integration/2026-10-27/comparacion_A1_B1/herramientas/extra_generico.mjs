// Pruebas complementarias genéricas (lote 19). Uso: node extra_generico.mjs <url> <carpeta_salida>
// Sin selectores del proyecto: cabecera = primer <header>; T3 a 320 px; T4 cabecera en una fila; T7 sin JS; vídeo del recorrido.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import fs from 'node:fs';
import path from 'node:path';

const [url, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const R = { url, fecha: new Date().toISOString(), resultados: {} };
const browser = await chromium.launch();

// T3 + T4: anchos 320 y 375 (y 768/1440 para la cabecera)
for (const w of [320, 375, 768, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 500, hasTouch: w < 500 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(400);
  R.resultados[`ancho_${w}`] = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const h = document.querySelector('header');
    let cab = null;
    if (h) {
      const hr = h.getBoundingClientRect();
      // elementos interactivos visibles de la cabecera (enlaces, botones) y la marca
      const items = [...h.querySelectorAll('a, button')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; });
      const tops = items.map(e => Math.round(e.getBoundingClientRect().top));
      const centros = items.map(e => { const r = e.getBoundingClientRect(); return Math.round(r.top + r.height / 2); });
      const filas = [];
      for (const c of centros) if (!filas.some(f => Math.abs(f - c) < 12)) filas.push(c);
      cab = { alto: Math.round(hr.height), elementos_visibles: items.length, filas_distintas: filas.length,
        detalle: items.map(e => { const r = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}${e.className ? '.' + String(e.className).split(' ')[0] : ''} "${(e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 20)}" x${Math.round(r.left)}-${Math.round(r.right)} y${Math.round(r.top)}-${Math.round(r.bottom)}`; }) };
    }
    return { scrollWidth: document.documentElement.scrollWidth, clientWidth: W, desborda: document.documentElement.scrollWidth > W, cabecera: cab };
  });
  await page.screenshot({ path: path.join(out, `cabecera_${w}.png`), clip: { x: 0, y: 0, width: w, height: 200 } });
  await ctx.close();
}

// T7: sin JavaScript
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
  R.resultados.sin_js = await page.evaluate(() => { const cont = e => !e.closest('[aria-hidden="true"]') && (e.textContent.trim() !== '' || /^(IMG|SVG|VIDEO|CANVAS|PICTURE)$/i.test(e.tagName) || e.getAttribute('role') === 'img' || !!e.querySelector('img,svg,video,canvas,[role=img]')); const els = [...document.querySelectorAll('main *')].filter(e => e.offsetParent); const oc = els.filter(e => parseFloat(getComputedStyle(e).opacity) < 0.99); return { elementos: els.length, ocultos: oc.length, ocultos_con_contenido: oc.filter(cont).length, muestra: oc.slice(0, 6).map(e => e.tagName.toLowerCase() + '.' + [...e.classList].join('.')) }; });
  await page.screenshot({ path: path.join(out, 'sin_js_completa.png'), fullPage: true });
  await ctx.close();
}

// Vídeo: recorrido lento a 1440 y 375 (movimiento normal) para revisar ritmo de animaciones
for (const [n, vp] of [['escritorio', { width: 1440, height: 900 }], ['movil', { width: 375, height: 812 }]]) {
  const ctx = await browser.newContext({ viewport: vp, recordVideo: { dir: out, size: vp }, reducedMotion: 'no-preference' });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  const alto = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= alto; y += 120) { await page.evaluate(v => window.scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(110); }
  await page.waitForTimeout(800);
  const v = page.video(); await ctx.close();
  fs.renameSync(await v.path(), path.join(out, `recorrido_${n}.webm`));
}

fs.writeFileSync(path.join(out, 'resultados_extra.json'), JSON.stringify(R, null, 1));
await browser.close();
console.log('ok', out);
