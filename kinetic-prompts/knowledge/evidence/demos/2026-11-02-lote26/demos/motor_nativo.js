// Motor NATIVO de referencia (lote 24, corregido en el lote 26). Sin GSAP.
// Opciones UNIFICADAS con motor_gsap.js: { scrub: true | número de segundos, pin: (ignorado: siempre sticky) }.
// scrub numérico: aproximación exponencial (≈ 95 % en `scrub` s); NO es la curva de GSAP → comparar solo estados asentados.
import { clamp, aplicaPistas } from './escena.js';
export function progresoDe(seccion) {
  const r = seccion.getBoundingClientRect(); const recorrido = seccion.offsetHeight - innerHeight;
  return clamp(-r.top / (recorrido || 1));
}
export function montar(seccion, receta, { scrub = true } = {}) {
  const estado = window.__estado = { motor: 'nativo', dt: [], trabajo: [] };
  const mmR = matchMedia('(prefers-reduced-motion: reduce)'), movil = () => innerWidth <= 700;
  let pistas = receta.pistas({ movil: movil() }), eraMovil = movil();
  if (mmR.matches) { document.documentElement.classList.add('rm'); receta.final?.(estado); estado.reducedMotion = true;
    window.__motor = { nombre: 'nativo', destruir() {} }; return window.__motor; }
  let pv = progresoDe(seccion), ultimo = performance.now(), vivo = true;
  function tick(t) {
    if (!vivo) return;
    if (movil() !== eraMovil) { eraMovil = movil(); pistas = receta.pistas({ movil: eraMovil }); }
    const objetivo = progresoDe(seccion);
    if (scrub === true || !scrub) pv = objetivo;
    else { const k = 1 - Math.exp(-3 * (t - ultimo) / 1000 / scrub); pv += (objetivo - pv) * k; if (Math.abs(pv - objetivo) < 1e-4) pv = objetivo; }
    estado.dt.push(t - ultimo); if (estado.dt.length > 600) estado.dt.shift(); ultimo = t;
    const t0 = performance.now(); aplicaPistas(pistas, pv); receta.actualizar?.(pv, estado);
    estado.trabajo.push(performance.now() - t0); if (estado.trabajo.length > 600) estado.trabajo.shift();
    estado.p = +pv.toFixed(4); estado.objetivo = +objetivo.toFixed(4);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  window.__motor = { nombre: 'nativo', destruir() { vivo = false; } };
  return window.__motor;
}
