// ¿Cruza el titular el panel de color (contraste insuficiente)? Mide la fracción del área de cada línea sobre el panel visible.
import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const [url] = process.argv.slice(2); const b = await chromium.launch(); const R = {};
for (const [W, H] of [[1440, 900], [1280, 800], [1024, 768], [375, 812]]) {
  const p = await b.newPage({ viewport: { width: W, height: H } }); await p.goto(url); await p.waitForFunction(() => window.__motor); await p.waitForTimeout(500);
  const serie = [];
  for (const q of [0, .1, .2, .3]) { await p.evaluate(q => { const s = __motor.st(); scrollTo(0, s.start + (s.end - s.start) * q); }, q); await p.waitForTimeout(300);
    serie.push(await p.evaluate(q => { const P = document.querySelector('.panel'), r = P.getBoundingClientRect(); let ins = (getComputedStyle(P).clipPath.match(/[\d.]+(%|px)?/g) || ['0']).map(parseFloat); ins = ins.length === 1 ? [ins[0], ins[0], ins[0], ins[0]] : ins.length === 2 ? [ins[0], ins[1], ins[0], ins[1]] : ins.length === 3 ? [ins[0], ins[1], ins[2], ins[1]] : ins;
      const vis = { left: r.left + r.width * ins[3] / 100, right: r.right - r.width * ins[1] / 100, top: r.top + r.height * ins[0] / 100, bottom: r.bottom - r.height * ins[2] / 100 };
      return { q, lineas: ['#tit', '#tit2'].map(s => { const t = document.querySelector(s).getBoundingClientRect();
        const a = Math.max(0, Math.min(t.right, vis.right) - Math.max(t.left, vis.left)) * Math.max(0, Math.min(t.bottom, vis.bottom) - Math.max(t.top, vis.top)); return +(a / (t.width * t.height)).toFixed(3); }) }; }, q)); }
  R[`${W}x${H}`] = serie; await p.close(); }
console.log(JSON.stringify(R)); await b.close();
