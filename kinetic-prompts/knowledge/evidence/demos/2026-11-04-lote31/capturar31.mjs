// node capturar31.mjs <url completa> <carpeta> [fps=30] [dur]
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const [,, url, out, fpsA, durA] = process.argv; const fps = +(fpsA || 30); fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto(url); await p.waitForFunction('window.LISTO', null, { timeout: 15000 }); await p.waitForTimeout(300);
const dur = +(durA || await p.evaluate('DUR')); const n = Math.round(dur * fps) + 1; const serie = [];
for (let i = 0; i < n; i++) { serie.push(await p.evaluate(t => ir(t), i / fps)); await p.screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` }); }
fs.writeFileSync(`${out}/serie.json`, JSON.stringify({ url, fps, dur, n, errs, serie })); await b.close();
console.log(JSON.stringify({ url, n, errs }));
