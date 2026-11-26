import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const [url, W = 1440, H = 900, shot] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H } });
const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(String(e)));
await p.goto(url); await p.waitForFunction(() => window.__motor || window.__error, null, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(800);
const r = await p.evaluate(() => ({ error: window.__error, motor: window.__motor?.nombre, v: window.__motor?.version, recursos: window.__recursos, aviso: [...document.querySelectorAll('.aviso')].map(a => a.textContent) }));
if (shot) { for (const q of [0, .5, 1]) { await p.evaluate(q => { const s = window.__motor?.st?.(); if (s) scrollTo(0, s.start + (s.end - s.start) * q); }, q); await p.waitForTimeout(400); await p.screenshot({ path: `${shot}_${q}.png` }); } }
console.log(JSON.stringify({ ...r, errores: errs })); await b.close();
