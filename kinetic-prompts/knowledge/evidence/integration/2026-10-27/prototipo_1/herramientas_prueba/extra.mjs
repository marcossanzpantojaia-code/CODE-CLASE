import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
import fs from 'node:fs';
const [url, out] = process.argv.slice(2); const b = await chromium.launch(); const R = {};
for (const w of [320, 375]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 700 }, isMobile: true, hasTouch: true })).newPage();
  await p.goto(url); R[`cabecera_${w}`] = await p.evaluate(() => { const h = document.querySelector('.site-header'); const r = h.getBoundingClientRect(); const hijos = [...h.querySelectorAll('a.brand, .nav-toggle, .site-header .btn')].map(e => { const q = e.getBoundingClientRect(); return { el: e.className, top: Math.round(q.top), left: Math.round(q.left), w: Math.round(q.width) }; }); return { alto_cabecera: Math.round(r.height), elementos: hijos, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth }; });
  if (w === 375) {
    const t = p.locator('.nav-toggle'); await t.click(); await p.waitForTimeout(300);
    R.menu_abierto = await p.evaluate(() => ({ expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), visible: !!document.getElementById('menu').offsetParent && getComputedStyle(document.getElementById('menu')).visibility !== 'hidden' }));
    await p.screenshot({ path: `${out}/movil_menu_abierto.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    R.menu_tras_escape = await p.evaluate(() => ({ expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), foco: document.activeElement.className }));
  }
}
const p2 = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage(); await p2.goto(url); await p2.keyboard.press('Tab'); await p2.screenshot({ path: `${out}/foco_skip_link.png`, clip: { x: 0, y: 0, width: 800, height: 160 } });
fs.writeFileSync(`${out}/resultados_extra.json`, JSON.stringify(R, null, 1)); console.log(JSON.stringify(R)); await b.close();
