import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); const b = await chromium.launch(); const p = await b.newPage();
console.log(await p.evaluate(() => { const out = {};
  for (const K of [1, 4, 9, 16, 24]) { const c = document.createElement('canvas'); c.width = c.height = 4; const x = c.getContext('2d');
    const s = document.createElement('canvas'); s.width = s.height = 4; const sx = s.getContext('2d'); sx.fillStyle = 'rgb(120,120,120)'; sx.fillRect(0, 0, 4, 4);
    x.globalCompositeOperation = 'lighter'; for (let i = 0; i < K; i++) { x.globalAlpha = 1 / K; x.drawImage(s, 0, 0); }
    out[K] = [...x.getImageData(1, 1, 1, 1).data]; }
  return out; })); await b.close();
