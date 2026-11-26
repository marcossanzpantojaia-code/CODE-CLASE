// Referencia de motion blur: supermuestreo temporal (16 subfotogramas, obturador 180° centrado) con blur=0,
// frente al render con acumulación analítica (blur=1) y frente a sin blur. Solo la región del héroe.
import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const [,, base, out] = process.argv; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch(); const res = [];
async function pagina(q) { const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await p.goto(`${base}/rosso31.html?${q}`); await p.waitForFunction('window.LISTO'); return p; }
const pB = await pagina('modo=l31&blur=1'), p0 = await pagina('modo=l31&blur=0');
for (const f of [14, 18, 21, 24, 28]) {
  const t = f / 30;
  await pB.evaluate(t => { T.reset(); ir(t - 1 / 30); return ir(t); }, t);
  await pB.screenshot({ path: `${out}/blur_f${f}.png` });
  await p0.evaluate(t => ir(t), t); await p0.screenshot({ path: `${out}/sin_f${f}.png` });
  for (let k = 0; k < 16; k++) { const tk = t + (-0.25 + 0.5 * (k + .5) / 16) / 30; await p0.evaluate(t => ir(t), tk); await p0.screenshot({ path: `${out}/sub_f${f}_${k}.png` }); }
  res.push({ f, st: await pB.evaluate(() => window.__st) });
}
fs.writeFileSync(`${out}/estados.json`, JSON.stringify(res)); await b.close();
