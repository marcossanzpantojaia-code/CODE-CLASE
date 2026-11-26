// Lote 32 · Atmósfera: partículas con profundidad y bokeh, foco que "respira", grano y viñeta centrada en la luz.
// Fuentes: SonduckFilm JHeMJ_l2iNA (contraste de luz motivada, profundidad por Z, partículas que la cámara atraviesa,
// glow, ruido 12 % mono, viñeta centrada en la fuente de luz, desenfoque de lente con mapa de profundidad → bokeh) y
// Ben Marriott rdi0bPWqYyI (grano 4 %, viñeta, desenfoque de lente que respira 0 → 4 px → 0 al aterrizar).
// Todo el desenfoque está PRERENDERIZADO: discos de bokeh dibujados una vez a 5 radios; el plato, a 2 niveles.
export function crearAtmosfera({ doc = document, n = 110, semilla = 7, luz = { x: .18, y: .12 } }) {
  const tras = doc.getElementById('part-tras'), del = doc.getElementById('part-delante'), grano = doc.getElementById('grano');
  // partículas desenfocadas a MEDIA resolución (el bokeh no tiene detalle que perder; optimización medida en el lote 32)
  const esc = doc.getElementById('escena'), VW = esc.clientWidth, VH = esc.clientHeight, DPR = .5;
  for (const c of [tras, del]) { c.width = VW * DPR; c.height = VH * DPR; c.style.width = VW + 'px'; c.style.height = VH + 'px'; }
  let s = semilla; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  // discos de bokeh hexagonales (Marriott 24:52: camera lens blur → "hexagonal shapes") con borde suave
  const RADIOS = [1.2, 3, 6, 11, 18];
  const discos = RADIOS.map(r => { const k = Math.ceil(r * 2 + 6), c = doc.createElement('canvas'); c.width = c.height = k * 2; const x = c.getContext('2d');
    x.translate(k, k); x.filter = `blur(${Math.max(.6, r * .12)}px)`; x.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath(); x.fillStyle = 'rgba(255,226,190,1)'; x.fill(); return { c, k }; });
  // partículas: z = profundidad relativa (1 = plano del plato). z < .8 delante (grandes, desenfocadas), z > 1.25 detrás.
  const P = Array.from({ length: n }, () => { const z = .35 + rnd() * 2.6; return { x: rnd(), y: rnd(), z, b: .35 + rnd() * .65, fase: rnd() * 6.28, delante: z < .8 }; });
  const tilesGrano = Array.from({ length: 4 }, () => { const c = doc.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), im = x.createImageData(128, 128);
    for (let i = 0; i < im.data.length; i += 4) { const v = rnd() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); return c; });
  grano.width = VW; grano.height = VH;
  let ultimoGrano = -1;
  const est = {};
  // t = tiempo de la transición (s); cam = escala de cámara; foco = desenfoque extra (px) del "respiro" de foco
  function render(t, cam, foco) {
    const cx = VW * .5, cy = VH * .55;
    for (const c of [tras, del]) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    let tamDel = [], tamTras = [];
    for (const p of P) {
      // paralaje: el push-in de la cámara afecta más a lo cercano (escala^(1/z)); deriva lenta hacia arriba (vapor/harina)
      const k = Math.pow(cam, 1 / p.z), dx = (p.x * VW - cx) * k, dy = (((p.y - t * .018 / p.z) % 1 + 1) % 1 * VH - cy) * k;
      const x = cx + dx + Math.sin(t * .9 + p.fase) * 6 / p.z, y = cy + dy;
      const desenfoque = Math.abs(1 / p.z - 1) * 9 + foco * (p.delante ? 1.5 : .6);            // círculo de confusión ∝ |1/z − 1/zf|
      // radio dibujado = tamaño propio (∝ 1/z) + círculo de confusión; el disco prerenderizado más cercano, reescalado
      const radio = 2.2 / p.z + desenfoque; let i = 0; while (i < RADIOS.length - 1 && RADIOS[i] < radio) i++;
      const d = discos[i], tam = radio / RADIOS[i];
      const dl = Math.hypot(x / VW - luz.x, y / VH - luz.y), brillo = p.b * Math.max(.15, 1 - dl * 1.1) / Math.sqrt(1 + i);  // luz motivada
      const c = (p.delante ? del : tras).getContext('2d'); c.globalAlpha = Math.min(1, brillo);
      c.drawImage(d.c, (x - d.k * tam) * DPR, (y - d.k * tam) * DPR, d.k * 2 * tam * DPR, d.k * 2 * tam * DPR);
      (p.delante ? tamDel : tamTras).push(+radio.toFixed(1));
    }
    // grano monocromo animado a 24 fps (cambio de tesela), ~4 % (opacidad del lienzo en CSS)
    const gi = Math.floor(t * 24) % 4; if (gi !== ultimoGrano) { const g = grano.getContext('2d'); g.fillStyle = g.createPattern(tilesGrano[gi], 'repeat'); g.fillRect(0, 0, VW, VH); ultimoGrano = gi; }
    Object.assign(est, { foco: +foco.toFixed(2), bokehDelanteMedio: tamDel.length ? +(tamDel.reduce((a, b) => a + b) / tamDel.length).toFixed(1) : 0, bokehTrasMedio: tamTras.length ? +(tamTras.reduce((a, b) => a + b) / tamTras.length).toFixed(1) : 0, nDel: tamDel.length, nTras: tamTras.length });
    return est;
  }
  return { render, est, P };
}
