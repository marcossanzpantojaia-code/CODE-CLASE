// Motor mínimo de escenas por progreso de scroll (lote 23-24). SIN dependencias.
// Reproduce los conceptos de un timeline de GSAP con ScrollTrigger { pin, scrub } para poder PROBAR la mecánica
// en este entorno (GSAP no está instalado). Cada propiedad es una FUNCIÓN PURA del progreso p ∈ [0,1]
// → reversible por construcción (el mismo p da el mismo fotograma al bajar y al subir).
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  none: t => t,
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,   // ≈ power2.inOut
  out: t => 1 - Math.pow(1 - t, 3),                                         // ≈ power3.out
  in: t => t * t * t
};
// pista: [[p0, v0], [p1, v1], ...] con mesetas (dos claves con el mismo valor = pausa visual)
export function muestra(keys, p, e = ease.inOut) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i], [p0, v0] = keys[i - 1];
    if (p <= p1) { const t = e(clamp((p - p0) / (p1 - p0 || 1))); return Array.isArray(v0) ? v0.map((x, k) => lerp(x, v1[k], t)) : lerp(v0, v1, t); }
  }
  return keys.at(-1)[1];
}
// progreso de una sección "pinned": la sección mide N alturas de ventana; su hijo .escenario es sticky.
export function progresoDe(seccion) {
  const r = seccion.getBoundingClientRect(); const recorrido = seccion.offsetHeight - innerHeight;
  return clamp(-r.top / (recorrido || 1));
}
// bucle: aplica(p) en cada rAF; suavizado opcional (equivalente a scrub: número) con factor por fotograma
export function montar(seccion, aplica, { suavizado = 0 } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pv = progresoDe(seccion), ultimo = performance.now();
  const estado = window.__estado = window.__estado || {};
  estado.dt = []; // duraciones de fotograma (ms) para medir rendimiento
  function tick(t) {
    const objetivo = progresoDe(seccion);
    pv = suavizado ? lerp(pv, objetivo, 1 - Math.pow(1 - suavizado, (t - ultimo) / 16.67)) : objetivo;
    if (Math.abs(pv - objetivo) < 1e-4) pv = objetivo;
    estado.dt.push(t - ultimo); if (estado.dt.length > 600) estado.dt.shift(); ultimo = t;
    estado.p = +pv.toFixed(4); estado.objetivo = +objetivo.toFixed(4);
    if (!reduce) { const t0 = performance.now(); aplica(pv, estado); (estado.trabajo = estado.trabajo || []).push(performance.now() - t0); if (estado.trabajo.length > 600) estado.trabajo.shift(); }
    requestAnimationFrame(tick);
  }
  if (reduce) { document.documentElement.classList.add('rm'); aplica(1, estado); estado.reducedMotion = true; }
  requestAnimationFrame(tick);
}
