// Contraste de texto sobre degradados/imágenes por muestreo de píxeles (lote 19). Uso: node contraste_compuesto.mjs <url> <salida.json> [ancho]
// Método: para cada texto cuyo fondo no es un color opaco, se oculta SOLO el texto (color transparente, sin sombras),
// se captura su caja y se calcula el contraste del color del texto contra cada píxel del fondo real compuesto.
// Informa el peor caso (mínimo) y el percentil 10. Limitación: texto con color semitransparente se compone contra el píxel; no evalúa text-shadow.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import fs from 'node:fs';
const [url, out, ancho = '1440'] = process.argv.slice(2);
const W = +ancho;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(600);
const objetivos = await page.evaluate(() => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const incierto = el => { while (el) { const cs = getComputedStyle(el); const c = parse(cs.backgroundColor); if (c && c.a > 0.95 && cs.backgroundImage === 'none') return false; if (cs.backgroundImage !== 'none') return true; el = el.parentElement; } return false; };
  const res = []; let i = 0;
  for (const el of document.querySelectorAll('h1,h2,h3,p,li,a,button,label,span,small,td,th,figcaption,dd,dt')) {
    // solo nodos con texto propio
    const propio = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!propio || !el.offsetParent) continue;
    const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    // también se incluyen textos sobre hermanos posicionados (arte absoluto): se marca si hay solapamiento con un elemento absoluto/fixed decorativo
    const pintaArte = d => { const s = getComputedStyle(d); return /^(svg|img|canvas|video)$/i.test(d.tagName) || s.backgroundImage !== 'none'; };
    const sobre = !incierto(el) && [...document.querySelectorAll('main *, header *')].some(d => {
      if (d.contains(el) || el.contains(d) || !pintaArte(d)) return false;
      let p = d, pos = false; while (p && p !== document.body) { if (/absolute|fixed/.test(getComputedStyle(p).position)) { pos = true; break; } p = p.parentElement; }
      if (!pos) return false; const q = d.getBoundingClientRect();
      return q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top; });
    if (!incierto(el) && !sobre) continue;
    el.setAttribute('data-cc', String(i));
    const fg = parse(cs.color); const px = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700;
    res.push({ id: i++, tag: el.tagName, texto: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), color: fg, px, grande: px >= 24 || (bold && px >= 18.66), motivo: incierto(el) ? 'degradado/imagen en ancestro' : 'solapa arte posicionado' });
  }
  return res;
});
const lum = (r, g, b) => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const { PNG } = await (async () => { try { return require('pngjs'); } catch { return {}; } })();
const resultados = [];
for (const o of objetivos) {
  const loc = page.locator(`[data-cc="${o.id}"]`);
  await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(80);
  await page.addStyleTag({ content: `[data-cc="${o.id}"]{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important}[data-cc="${o.id}"] *{visibility:hidden!important}` });
  const buf = await loc.screenshot({ type: 'png' }).catch(() => null);
  await page.evaluate(() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('data-cc=') && s.textContent.includes('transparent!important')) s.remove(); }));
  if (!buf) { resultados.push({ ...o, nota: 'no capturable' }); continue; }
  // decodificar PNG con el navegador (sin dependencias)
  const pix = await page.evaluate(async b64 => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; const step = Math.max(1, Math.floor(d.length / 4 / 4000)); const out = []; for (let i = 0; i < d.length / 4; i += step) out.push([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]); return out; }, buf.toString('base64'));
  const { r, g, b, a } = o.color;
  const ratios = pix.map(([R, G, B]) => { const fr = r * a + R * (1 - a), fg = g * a + G * (1 - a), fb = b * a + B * (1 - a); const L1 = lum(fr, fg, fb), L2 = lum(R, G, B); return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); }).sort((x, y) => x - y);
  const min = ratios[0], p10 = ratios[Math.floor(ratios.length * 0.1)], med = ratios[Math.floor(ratios.length / 2)];
  const minimo = o.grande ? 3 : 4.5;
  resultados.push({ tag: o.tag, texto: o.texto, px: o.px, motivo: o.motivo, minimo, peor: +min.toFixed(2), p10: +p10.toFixed(2), mediana: +med.toFixed(2), cumple_p10: p10 >= minimo, cumple_peor: min >= minimo, muestras: ratios.length });
}
fs.writeFileSync(out, JSON.stringify({ url, ancho: W, fecha: new Date().toISOString(), metodo: 'muestreo de píxeles del fondo compuesto con el texto oculto', resultados }, null, 1));
console.log(JSON.stringify(resultados.map(x => [x.texto, x.minimo, x.peor, x.p10, x.mediana])));
await browser.close();
