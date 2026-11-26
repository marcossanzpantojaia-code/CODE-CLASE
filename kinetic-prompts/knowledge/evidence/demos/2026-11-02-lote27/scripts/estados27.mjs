import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const [url, W, H, out] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +W, height: +H } });
const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
await p.goto(url); await p.waitForFunction(() => window.__motor || window.__error); await p.waitForTimeout(600); const R = [];
for (const q of [0, .25, .5, .75, .8, .86, .9, 1]) { await p.evaluate(q => { const s = __motor.st(); scrollTo(0, s.start + (s.end - s.start) * q); }, q); await p.waitForTimeout(350);
  await p.screenshot({ path: `${out}_${q}.png` }); const e = await p.evaluate(() => { const x = { ...__estado }; delete x.dt; delete x.trabajo; return x; }); R.push({ q, ...e }); }
console.log(JSON.stringify({ errs, R })); await b.close();
