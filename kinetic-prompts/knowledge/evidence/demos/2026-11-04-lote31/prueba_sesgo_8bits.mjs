import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); const b = await chromium.launch(); const p = await b.newPage();
console.log(JSON.stringify(await p.evaluate(() => {
  const mk = () => { const c = document.createElement('canvas'); c.width = c.height = 1; return c; };
  const res = [];
  for (const [r, a] of [[120, 1], [200, 1], [37, 1], [120, .5], [230, .25], [90, .8]]) {
    const s = mk(), sx = s.getContext('2d'); sx.fillStyle = `rgba(${r},${r},${r},${a})`; sx.fillRect(0, 0, 1, 1);
    const plano = K => { const c = mk(), x = c.getContext('2d'); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < K; i++) { x.globalAlpha = 1 / K; x.drawImage(s, 0, 0); } return c; };
    const arbol = () => { const g = [0, 1, 2, 3].map(() => plano(4)); const c = mk(), x = c.getContext('2d'); x.globalCompositeOperation = 'lighter'; g.forEach(gc => { x.globalAlpha = .25; x.drawImage(gc, 0, 0); }); return c; };
    const px = c => [...c.getContext('2d').getImageData(0, 0, 1, 1).data];
    res.push({ esperado: [r, Math.round(a * 255)], plano16: px(plano(16)), plano9: px(plano(9)), arbol4x4: px(arbol()) });
  } return res; }), null, 0)); await b.close();
