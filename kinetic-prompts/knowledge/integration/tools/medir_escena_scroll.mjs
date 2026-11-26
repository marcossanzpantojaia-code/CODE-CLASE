// Mide una escena por scroll (lote 24; copia de evidence/demos/2026-11-01-lote24/codigo/medir_demo.mjs). Uso: node medir_escena_scroll.mjs <url> <salida_dir> [ancho] [pasos]
// Requisitos de la página: sección #acto (tramo fijado), .escenario, y window.__estado = { p, ...valores numéricos, dt: [] }.
// - Barrido de bajada y de subida por las mismas posiciones → reversibilidad (diferencia máxima del estado)
// - Capturas en el 0/25/50/75/100 % del tramo fijado; tiempos de fotograma con rueda real; reduced motion; vídeo
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
import fs from 'node:fs'; import path from 'node:path';
const [url, out, anchoS = '1440', pasosS = '40'] = process.argv.slice(2);
const W = +anchoS, PASOS = +pasosS, H = W < 500 ? 812 : 900; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const R = { url, ancho: W, fecha: new Date().toISOString(), navegador: b.version() };
const espera = (p, ms) => p.waitForTimeout(ms);
const leer = p => p.evaluate(() => JSON.parse(JSON.stringify({ ...window.__estado, dt: undefined })));
{
  const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 500, hasTouch: W < 500 });
  const p = await ctx.newPage(); const errores = []; p.on('pageerror', e => errores.push(String(e))); p.on('console', m => m.type() === 'error' && errores.push(m.text()));
  await p.goto(url, { waitUntil: 'load' }); await espera(p, 800);
  const { ini, fin } = await p.evaluate(() => { const st = window.__motor?.st?.(); if (st) return { ini: st.start, fin: st.end }; /* GSAP: rango real de ScrollTrigger (pin con pin-spacer) */ const s = document.getElementById('acto'); return { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
  const pos = Array.from({ length: PASOS + 1 }, (_, i) => Math.round(ini + (fin - ini) * i / PASOS));
  const baja = [], sube = [];
  for (const y of pos) { await p.evaluate(v => scrollTo(0, v), y); await espera(p, 70); baja.push(await leer(p)); }
  for (const y of [...pos].reverse()) { await p.evaluate(v => scrollTo(0, v), y); await espera(p, 70); sube.unshift(await leer(p)); }
  const plano = (o, pre = '') => Object.entries(o).flatMap(([k, v]) => typeof v === 'number' ? [[pre + k, v]] : Array.isArray(v) ? v.map((x, i) => [`${pre}${k}[${i}]`, x]) : []);
  let maxDif = 0, campo = '';
  baja.forEach((e, i) => { const s = Object.fromEntries(plano(sube[i])); for (const [k, v] of plano(e)) { const d = Math.abs(v - (s[k] ?? v)); if (d > maxDif) { maxDif = d; campo = `${k} @p=${e.p}`; } } });
  R.reversibilidad = { pasos: PASOS + 1, diferencia_maxima: +maxDif.toFixed(4), campo, nota: 'mismas posiciones de scroll, bajando y subiendo' };
  R.barrido = baja;
  for (const q of [0, .25, .5, .75, 1]) { await p.evaluate(v => scrollTo(0, v), Math.round(ini + (fin - ini) * q)); await espera(p, 150);
    await p.screenshot({ path: path.join(out, `estado_${String(q * 100).padStart(3, '0')}.png`) }); }
  // tiempos de fotograma con rueda real (eventos de ratón), desde el inicio del tramo
  await p.evaluate(v => scrollTo(0, v), ini); await espera(p, 300); await p.evaluate(() => { window.__estado.dt = []; });
  await p.mouse.move(W / 2, H / 2);
  for (let i = 0; i < 40; i++) { await p.mouse.wheel(0, (fin - ini) / 40); await espera(p, 50); }
  const dt = (await p.evaluate(() => window.__estado.dt)).slice(2).sort((a, b) => a - b);
  const pct = q => +dt[Math.min(dt.length - 1, Math.floor(dt.length * q))].toFixed(1);
  R.fotogramas = { n: dt.length, p50_ms: pct(.5), p95_ms: pct(.95), max_ms: +dt.at(-1).toFixed(1), sobre_33ms: dt.filter(x => x > 33.4).length, nota: 'contenedor sin GPU, 2 núcleos, Chromium headless: orientativo' };
  R.errores = errores; await ctx.close();
}
{ // reduced motion
  const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: 'reduce' }); const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await espera(p, 600);
  R.reduced_motion = await p.evaluate(() => ({ marcado: !!window.__estado?.reducedMotion, claseRm: document.documentElement.classList.contains('rm'),
    sticky: getComputedStyle(document.querySelector('.escenario')).position, alto_pagina: document.documentElement.scrollHeight }));
  await p.screenshot({ path: path.join(out, 'reduced_motion.png'), fullPage: true }); await ctx.close();
}
{ // vídeo del recorrido con rueda
  const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out, size: { width: W, height: H } } }); const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'load' }); await espera(p, 800);
  const { ini, fin } = await p.evaluate(() => { const st = window.__motor?.st?.(); if (st) return { ini: st.start, fin: st.end }; /* GSAP: rango real de ScrollTrigger (pin con pin-spacer) */ const s = document.getElementById('acto'); return { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
  await p.evaluate(v => scrollTo(0, v), ini); await espera(p, 400); await p.mouse.move(W / 2, H / 2);
  for (let i = 0; i < 60; i++) { await p.mouse.wheel(0, (fin - ini) / 60); await espera(p, 70); }
  await espera(p, 500); for (let i = 0; i < 30; i++) { await p.mouse.wheel(0, -(fin - ini) / 30); await espera(p, 60); } await espera(p, 400);
  const v = p.video(); await ctx.close(); fs.renameSync(await v.path(), path.join(out, 'recorrido.webm'));
}
fs.writeFileSync(path.join(out, 'medicion.json'), JSON.stringify(R, null, 1));
console.log(JSON.stringify({ rev: R.reversibilidad, fps: R.fotogramas, rm: R.reduced_motion, err: R.errores }));
await b.close();
