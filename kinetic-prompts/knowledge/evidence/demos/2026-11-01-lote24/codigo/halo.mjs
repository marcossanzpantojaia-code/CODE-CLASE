import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const b = await chromium.launch();
for (const h of ['0','1']) { const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.goto('http://127.0.0.1:8790/receta_c_producto_fijo.html?halo=' + h); await p.waitForTimeout(800);
  const { ini, fin } = await p.evaluate(() => { const s = document.getElementById('acto'); return { ini: s.offsetTop, fin: s.offsetTop + s.offsetHeight - innerHeight }; });
  await p.evaluate(v => scrollTo(0, v), ini + (fin - ini) * .9); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const q = document.getElementById('tras').getBoundingClientRect(); return { x: q.left + q.width * .82, y: q.top + q.height * .38 }; });
  await p.screenshot({ path: `res/halo_${h}.png`, clip: { x: r.x, y: r.y, width: 160, height: 120 } }); await p.close(); }
await b.close();
