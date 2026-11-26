import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const b = await chromium.launch(); const res = [];
for (const [w, h, dpr] of [[1440, 900, 1], [1366, 768, 1], [375, 812, 3], [390, 844, 3]]) {
  for (const v of ['crisp=0&solape=0', 'crisp=1&solape=0', 'crisp=0&solape=0.05', 'crisp=1&solape=0.05']) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    await p.goto(`http://127.0.0.1:8790/prueba_mascara_persianas.html?p=1&${v}`); await p.waitForTimeout(300);
    const buf = await p.screenshot();
    const r = await p.evaluate(async b64 => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
      const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data;
      let fuga = 0, filas = 0; for (let y = 0; y < c.height; y++) { let fy = 0; for (let x = 0; x < c.width; x += 4) { const k = (y * c.width + x) * 4; if (d[k + 2] - d[k] > 20) fy++; } if (fy > c.width / 4 * .3) filas++; fuga += fy; }
      return { filas_con_costura: filas, pixeles_azules_muestreados: fuga, alto_px: c.height }; }, buf.toString('base64'));
    res.push({ viewport: `${w}x${h}@${dpr}`, variante: v, ...r }); await p.close();
  }
}
console.log(JSON.stringify(res, null, 0)); await b.close();
