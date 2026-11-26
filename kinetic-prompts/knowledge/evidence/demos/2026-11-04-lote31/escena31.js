// Lote 31 · Núcleo de la transición ROSSO "aterrizaje en el plato".
// Dos modos de movimiento sobre los MISMOS recursos (fixtures del lote 27):
//   'l30'  — la versión B del lote 30, tween a tween (relevo de 1 fotograma en el pico de velocidad).
//   'l31'  — lote 31: trayectoria Hermite C1 (sin quiebros de dirección), aterrizaje suave ("se posa"),
//            relevo por FUNDIDO ALINEADO con los nidos bloqueados (separación 0) y motion blur por
//            ACUMULACIÓN analítica (el estado se puede evaluar en cualquier instante).
// GSAP solo gobierna el TIEMPO (timeline de 2,5 s). La posición del modo l31 sale de stateAt(t).
export const DUR = 2.5;

// --- Hermite cúbica por tramos: claves [t, valor, velocidad] → continuidad C1 garantizada ---
function hermite(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  const u = keys.at(-1); if (t >= u[0]) return u[1];
  let i = 0; while (t > keys[i + 1][0]) i++;
  const [t0, p0, v0] = keys[i], [t1, p1, v1] = keys[i + 1], h = t1 - t0, s = (t - t0) / h;
  const s2 = s * s, s3 = s2 * s;
  return (2*s3 - 3*s2 + 1) * p0 + (s3 - 2*s2 + s) * h * v0 + (-2*s3 + 3*s2) * p1 + (s3 - s2) * h * v1;
}
const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

export function crear({ doc = document, modo = 'l31', blur = true, shutter = 0.5, maxMuestras = 24, blurMax = 0.12, fase = -0.5, gsap }) {
  const $ = s => doc.querySelector(s);
  const esc = $('#escena'), plato = $('#plato'), delante = $('#plato-delante'), cv = $('#lienzo'), ctx = cv.getContext('2d');
  const imgH = $('#src-heroe'), imgS = $('#src-sombra-nido');
  const VW = esc.clientWidth || innerWidth, VH = esc.clientHeight || innerHeight, DPR = Math.min(devicePixelRatio || 1, 2);
  cv.width = VW * DPR; cv.height = VH * DPR; cv.style.width = VW + 'px'; cv.style.height = VH + 'px';
  // geometría base (sin transformaciones): caja del héroe = 84vh de alto, centrada en (68 %, 40 %)
  const hH = VH * .84, hW = hH * imgH.naturalWidth / imgH.naturalHeight, hL = VW * .68 - hW / 2, hT = VH * .40 - hH / 2;
  const AY = modo === 'l31' ? .779 : .76;           // l31: ancla en el CENTRO de la elipse del nido del fixture
  const nH = { x: hL + hW * .5, y: hT + hH * AY, w: hW * .62 };
  // geometría RELATIVA al contenedor #escena (el lienzo vive dentro): en una página con scroll el escenario no está en (0,0)
  const rE = esc.getBoundingClientRect(), r0 = plato.getBoundingClientRect();
  const rP = { left: r0.left - rE.left, top: r0.top - rE.top, width: r0.width, height: r0.height };
  const nP0 = { x: rP.left + rP.width * .5, y: rP.top + rP.height * .47, w: rP.width * .36 };
  const S = nP0.w / nH.w, DX = nP0.x - nH.x, DY0 = nP0.y - nH.y;

  // sprite del héroe. l31: SOLO el nido (máscara elíptica suave sobre el MISMO recurso I1; con recursos
  // reales se pide un recorte del nido: I1-nido). l30: el recurso completo, como en el lote 30.
  const sprite = doc.createElement('canvas'); sprite.width = imgH.naturalWidth; sprite.height = imgH.naturalHeight;
  const sc = sprite.getContext('2d'); sc.drawImage(imgH, 0, 0);
  if (modo === 'l31') {
    const cx = sprite.width * .5, cy = sprite.height * .779, rx = sprite.width * .31, ry = sprite.height * .112;
    const m = doc.createElement('canvas'); m.width = sprite.width; m.height = sprite.height; const mc = m.getContext('2d');
    mc.translate(cx, cy); mc.scale(1, ry / rx); const g = mc.createRadialGradient(0, 0, rx * .82, 0, 0, rx);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); mc.fillStyle = g; mc.beginPath(); mc.arc(0, 0, rx, 0, Math.PI * 2); mc.fill();
    sc.globalCompositeOperation = 'destination-in'; sc.drawImage(m, 0, 0);
  }
  // acumulación en ÁRBOL 4×4: en un lienzo 2D de 8 bits, sumar K copias con alpha 1/K sesga el color (medido:
  // gris 120 → 128 con K = 16, → 144 con K = 24). Con grupos de 4 el error cae a ≤ 3 niveles en opacos (dbg4).
  const lienzo = () => { const c = doc.createElement('canvas'); c.width = cv.width; c.height = cv.height; return c; };
  const acum = lienzo(), ac = acum.getContext('2d'), grupos = [0, 1, 2, 3].map(lienzo);

  // ---------- estado en función del tiempo ----------
  const tc = 1.25;                              // contacto (l31)
  const PL = [[0, .75 * VH, 0], [.45, .75 * VH, -700], [1.12, -.004 * VH, 0], [tc, 0, 60], [1.45, .012 * VH, 0], [2.05, 0, 0]];
  const platoY = t => hermite(PL, t);
  // trayectoria del nido del héroe (coordenadas absolutas). La llegada apunta al nido del plato en tc.
  const A0 = { x: nH.x, y: nH.y }, A1 = { x: nH.x + .004 * VW, y: nH.y - .016 * VH }, END = { x: nP0.x, y: nP0.y };
  const MID = { x: A0.x + (END.x - A0.x) * .72, y: A0.y + (END.y - A0.y) * .38 };
  const HX = [[0, A0.x, 0], [.38, A1.x, -25], [.86, MID.x, (END.x - A1.x) * 1.15 / (tc - .38)], [tc, END.x, 0]];
  const HY = [[0, A0.y, 0], [.38, A1.y, 0], [.86, MID.y, (END.y - A1.y) * 1.35 / (tc - .38)], [tc, END.y, 60]];
  const HS = [[0, 1, 0], [.38, 1.01, 0], [tc, S, 0]];
  const HR = [[0, 0, 0], [.38, -1.5, 0], [tc, 0, 0]];
  // falso 3D (Marriott, UVDpgP7sRbw 3:20): el nido se "inclina" hacia la elevación del plato escalando UN eje.
  // Fixture: elipse del nido del héroe 0,78 de proporción; anillo del nido del plato ~0,40 → 0,52.
  const HSY = [[0, 1, 0], [.5, 1, 0], [tc, .52, 0]];
  function estado31(t) {
    const py = platoY(t);
    let x, y;
    if (t <= tc) { x = hermite(HX, t); y = hermite(HY, t); } else { x = nP0.x; y = nP0.y + py; }   // bloqueado al plato
    const op = 1 - smooth(tc, tc + .32, t);                                                         // fundido ALINEADO
    const cam = t <= tc ? 1 + .02 * smooth(0, tc, t) : 1.02 - .02 * smooth(tc, tc + 1.1, t);
    return { t, x, y, s: hermite(HS, Math.min(t, tc)), sy: hermite(HSY, Math.min(t, tc)), rot: hermite(HR, Math.min(t, tc)), op, py, cam };
  }
  // l30: los tweens del lote 30 sobre un proxy (mismos valores y eases; relevo de 1 fotograma)
  const P = { x: 0, y: 0, s: 1, rot: 0, op: 1, py: .75 * VH, cam: 1 };
  const tl = gsap.timeline({ paused: true });
  if (modo === 'l30') {
    const t30 = 1.10, DY = DY0;
    tl.to(P, { y: -.03 * VH, rot: -2, duration: .45, ease: 'power2.out' }, 0).to(P, { y: -.036 * VH, duration: .15, ease: 'none' }, .45)
      .to(P, { x: DX, duration: t30 - .6, ease: 'power2.in' }, .6).to(P, { y: DY, rot: 0, duration: t30 - .6, ease: 'power3.in' }, .6)
      .to(P, { s: S, duration: t30 - .6, ease: `expoScale(1,${S.toFixed(4)},power2.in)` }, .6)
      .to(P, { py: 0, duration: .55, ease: 'power3.out' }, t30 - .55).set(P, { op: 0 }, t30)
      .to(P, { py: .022 * VH, duration: .12, ease: 'power2.out' }, t30).to(P, { py: 0, duration: .5, ease: 'power2.inOut' }, t30 + .12)
      .fromTo(P, { cam: 1 }, { cam: 1.03, duration: t30, ease: 'power2.in' }, 0).to(P, { cam: 1, duration: 1, ease: 'power2.out' }, t30);
  }
  tl.to({}, { duration: DUR }, 0);              // misma duración en los dos modos
  const estado30 = () => ({ t: tl.time(), x: nH.x + P.x, y: nH.y + P.y, s: P.s, rot: P.rot, op: P.op, py: P.py, cam: P.cam });
  const estado = t => modo === 'l31' ? estado31(t) : estado30();

  // ---------- render ----------
  let tPrev = null; const est = { muestras: 0, blur_px: 0 };
  function dibujaSprite(c, st, alpha) {
    c.save(); c.globalAlpha = alpha; c.translate(st.x * DPR, st.y * DPR); c.rotate(st.rot * Math.PI / 180); c.scale(st.s * hW / sprite.width * DPR, st.s * (st.sy ?? 1) * hH / sprite.height * DPR);
    c.drawImage(sprite, -sprite.width * .5, -sprite.height * AY); c.restore();
  }
  function sombra(c, st) {                     // sombra de contacto del nido sobre el plato (solo l31)
    if (modo !== 'l31') return;
    const sup = nP0.y + st.py, alt = Math.max(0, sup - st.y), k = Math.max(0, 1 - alt / (.35 * VH));
    if (k <= 0) return;
    const w = nP0.w * (1.25 - .25 * k) * DPR, h = w * .28;
    c.save(); c.globalAlpha = .42 * k * st.op + .0; c.translate(st.x * DPR, (sup + nP0.w * .06) * DPR); c.scale(1, h / w);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w / 2); g.addColorStop(0, 'rgba(40,20,10,.9)'); g.addColorStop(1, 'rgba(40,20,10,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, w / 2, 0, Math.PI * 2); c.fill(); c.restore();
  }
  function render(t = tl.time()) {
    const st = estado(t);
    gsap.set(esc, { scale: st.cam }); gsap.set([plato, delante], { y: st.py });
    ctx.clearRect(0, 0, cv.width, cv.height);
    sombra(ctx, st);
    // motion blur por acumulación: K muestras del estado entre t − shutter·Δt y t (Δt = avance real desde el último render)
    const dt = tPrev === null ? 0 : t - tPrev; tPrev = t;
    let K = 1;
    if (blur && modo === 'l31' && dt !== 0 && st.op > 0) {
      // obturación de 180° (shutter 0,5) sobre el avance REAL desde el último render. Con scroll muy rápido o saltos, el
      // avance puede abarcar media trayectoria: se LIMITA la estela a blurMax × ancho del nido (no destruir la forma).
      // fase −0,5 (centrada, como el valor por defecto de After Effects desde CS3): muestras antes Y después del instante
      const lo = t + (fase) * shutter * dt, hi = t + (fase + 1) * shutter * dt, cl = v => Math.min(DUR, Math.max(0, v));
      const a = estado(cl(lo)), b2 = estado(cl(hi)), d0 = Math.hypot((b2.x - a.x), (b2.y - a.y)) + Math.abs(b2.s - a.s) * nH.w + Math.abs((b2.sy ?? 1) - (a.sy ?? 1)) * nH.w * .8;
      const lim = blurMax * nH.w * st.s, k0 = d0 > lim ? lim / d0 : 1, dist = Math.min(d0, lim);
      K = dist < 1 ? 1 : dist <= 6 ? 4 : 16; est.blur_px = +dist.toFixed(1);   // separación entre muestras ≤ 1,5 px
      if (K > 1) {
        const tm = i => cl(t + (lo - t) * k0 + (hi - lo) * k0 * (i / (K - 1)));
        const suma = (c, n, f) => { const x = c.getContext('2d'); x.clearRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) f(x, i); x.globalCompositeOperation = 'source-over'; };
        if (K === 4) suma(acum, 4, (x, i) => dibujaSprite(x, estado(tm(i)), .25));
        else { grupos.forEach((g, j) => suma(g, 4, (x, i) => dibujaSprite(x, estado(tm(j * 4 + i)), .25)));
               suma(acum, 4, (x, j) => { x.globalAlpha = .25; x.drawImage(grupos[j], 0, 0); x.globalAlpha = 1; }); }
        ctx.save(); ctx.globalAlpha = st.op; ctx.drawImage(acum, 0, 0); ctx.restore();
      }
    } else est.blur_px = 0;
    if (K === 1 && st.op > 0) dibujaSprite(ctx, st, st.op);
    est.muestras = K;
    window.__st = { ...st, nidoPlato: { x: nP0.x, y: nP0.y + st.py }, anchoNido: st.s * nH.w, anchoPlato: nP0.w, ...est };
    return window.__st;
  }
  tl.eventCallback('onUpdate', () => render());
  function destruir() { tl.kill(); gsap.set([esc, plato, delante], { clearProps: 'transform' }); ctx.clearRect(0, 0, cv.width, cv.height); }
  return { tl, render, estado, destruir, reset() { tPrev = null; }, geo: { nH, nP0, S, tc: modo === 'l31' ? tc : 1.10 } };
}
