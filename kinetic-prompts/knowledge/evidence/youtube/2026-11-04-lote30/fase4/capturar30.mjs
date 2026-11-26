import { createRequire } from 'module'; const require = createRequire(import.meta.url);
const { chromium } = require('playwright'); import fs from 'fs';
const [,, base, out] = process.argv; fs.mkdirSync(out,{recursive:true});
const b = await chromium.launch(); const res={};
for (const v of ['base','cine']) {
  const p = await b.newPage({ viewport:{width:1280,height:720} });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e))); p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
  await p.goto(`${base}/rosso_aterrizaje.html?v=${v}`); await p.waitForFunction('window.LISTO'); await p.waitForTimeout(500);
  const dur = await p.evaluate('DUR'); const n = Math.round(dur*30)+1; const serie=[];
  fs.mkdirSync(`${out}/${v}`,{recursive:true});
  for (let i=0;i<n;i++){ const t=i/30; serie.push(await p.evaluate(t=>ir(t),t)); await p.screenshot({path:`${out}/${v}/f${String(i).padStart(4,'0')}.png`}); }
  res[v]={dur, n, errs, serie}; await p.close();
}
fs.writeFileSync(`${out}/serie.json`, JSON.stringify(res)); await b.close(); console.log('ok', Object.fromEntries(Object.entries(res).map(([k,v])=>[k,{n:v.n,dur:v.dur,errs:v.errs}])));
