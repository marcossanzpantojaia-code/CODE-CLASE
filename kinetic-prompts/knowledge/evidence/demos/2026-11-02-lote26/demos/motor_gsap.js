// Motor GSAP REAL (lote 26). Requiere gsap.min.js y ScrollTrigger.min.js 3.15.0 cargados antes (window.gsap).
// Las PISTAS de la receta se convierten en tweens reales (fromTo por tramo) en un timeline con ScrollTrigger:
//   scrub: true | número (s de alcance) · pin: false → sticky de CSS | true → pin de ScrollTrigger con pin-spacer.
// Lo que GSAP no puede interpolar (trazos medidos en el DOM, canvas, cambio de texto) va en receta.actualizar(p),
// llamado desde el onUpdate del timeline (después de que los tweens hijos se han renderizado).
// Ciclo de vida: gsap.matchMedia() con condiciones { normal, reducir, movil }; al cruzar un punto de corte o cambiar
// la preferencia, GSAP revierte el contexto (mata el ScrollTrigger, restaura estilos) y se reconstruye.
// destruir(): mm.revert() + retira el listener del ticker.
import { NOMBRE_GSAP, ease } from './escena.js';
export function montar(seccion, receta, { scrub = true, pin = false } = {}) {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) throw new Error('GSAP o ScrollTrigger no cargados');
  gsap.registerPlugin(ScrollTrigger);
  const estado = window.__estado = { motor: 'gsap', dt: [], trabajo: [], construcciones: 0 };
  const raiz = document.documentElement, escenario = seccion.querySelector('.escenario');
  let tlActual = null, progresoGuardado = null;
  const mm = gsap.matchMedia();
  // Parámetros SOLO para reproducir los hallazgos del lote 26 (no usar en producción):
  //   ?sinMovil=1 (sin condición de punto de corte) · ?sinOnRefresh=1 · ?sinRestaurarScroll=1
  const exp = new URLSearchParams(location.search), sinMovil = exp.get('sinMovil') === '1';
  mm.add(sinMovil ? { normal: '(prefers-reduced-motion: no-preference)', reducir: '(prefers-reduced-motion: reduce)' } : { normal: '(prefers-reduced-motion: no-preference)', reducir: '(prefers-reduced-motion: reduce)', movil: '(max-width: 700px)' }, ctx => {
    estado.construcciones++;
    if (ctx.conditions.reducir) {
      raiz.classList.add('rm'); receta.final?.(estado); estado.reducedMotion = true; tlActual = null;
      return () => { raiz.classList.remove('rm'); estado.reducedMotion = false; };
    }
    if (pin) raiz.classList.add('modo-pin');           // quita el sticky y la altura de 400vh: el espacio lo pone el pin-spacer
    const tl = gsap.timeline({ scrollTrigger: {
      trigger: seccion, start: 'top top',
      end: pin ? () => '+=' + Math.round(receta.recorrido * innerHeight) : 'bottom bottom',
      pin: pin ? escenario : false, pinSpacing: true, anticipatePin: pin ? 1 : 0,
      scrub, invalidateOnRefresh: true,
      // Hallazgo lote 26: durante refresh() ScrollTrigger lleva la animación a 0 para medir (onUpdate recibe p = 0) y la
      // devuelve a su progreso SIN un onUpdate final → lo dibujado en actualizar() (chorro, lienzo) quedaba con p = 0.
      onRefresh: exp.get('sinOnRefresh') === '1' ? undefined : self => { receta.actualizar?.(self.animation.progress(), estado); estado.p = +self.animation.progress().toFixed(4); } } });
    for (const t of receta.pistas({ movil: ctx.conditions.movil })) {
      const nombre = NOMBRE_GSAP.get(t.ease || ease.inOut), { prop, conv = v => v } = t.gsap, d = t.desfase || 0;
      gsap.set(t.el, { [prop]: conv(t.keys[0][1]) });              // estado inicial inmediato (revertido por matchMedia)
      let tramos = 0;
      for (let i = 1; i < t.keys.length; i++) {
        const [p0, v0] = t.keys[i - 1], [p1, v1] = t.keys[i];
        if (v0 === v1 || p1 <= p0) continue;                         // meseta: no hay tween
        tl.fromTo(t.el, { [prop]: conv(v0) }, { [prop]: conv(v1), duration: p1 - p0, ease: nombre, immediateRender: false }, p0 + d);
        tramos++;
      }
      // pista constante pero dependiente del viewport (p. ej. x en vw): un tween de 0 a 1 con el mismo valor para que
      // invalidateOnRefresh la recalcule tras un resize
      if (!tramos && typeof conv(t.keys[0][1]) === 'function')
        tl.fromTo(t.el, { [prop]: conv(t.keys[0][1]) }, { [prop]: conv(t.keys[0][1]), duration: 1, ease: 'none', immediateRender: false }, 0);
    }
    tl.set({}, {}, 1);                                                // duración total = 1 → progreso del timeline = p
    // Hallazgo lote 26: NO usar tl.set(el, …, 0) para el estado inicial en un timeline con scrub: al volver al progreso 0
    // GSAP revierte los set de duración 0 al valor previo (sin transformar). Los fromTo con immediateRender:false sí
    // restauran su valor de partida al retroceder; el estado inicial se fija con gsap.set fuera del timeline.
    tl.eventCallback('onUpdate', () => {
      const t0 = performance.now(); const p = tl.progress(); receta.actualizar?.(p, estado);
      estado.trabajo.push(performance.now() - t0); if (estado.trabajo.length > 600) estado.trabajo.shift();
      // Hallazgo lote 26: mm.revert() renderiza el timeline de vuelta a 0 y dispara onUpdate con el ScrollTrigger ya
      // eliminado (tl.scrollTrigger === null) → error "reading 'progress'" si no se protege.
      estado.p = +p.toFixed(4); estado.objetivo = tl.scrollTrigger ? +tl.scrollTrigger.progress.toFixed(4) : null;
    });
    receta.actualizar?.(tl.progress(), estado); estado.p = +tl.progress().toFixed(4);
    tlActual = tl;
    // Hallazgo lote 26 (GSAP 3.15.0, Chromium): al cruzar un punto de corte de matchMedia con un resize, el refresh de
    // ScrollTrigger deja el documento en scrollY = 0 (scrollTo(0, 0) interno; reproducido en prueba_breakpoint.json).
    // Se guarda el PROGRESO al revertir y se restaura en el siguiente evento "refresh" (mantiene el punto de la historia).
    if (progresoGuardado !== null && exp.get('sinRestaurarScroll') !== '1') {
      // GSAP encadena dos ciclos revert → refresh en el mismo cambio: se restaura en CADA "refresh" durante 1 s
      const objetivo = progresoGuardado, hasta = performance.now() + 1000; progresoGuardado = null;
      const restaurar = () => { const st = tl.scrollTrigger;
        if (performance.now() > hasta || !st) return ScrollTrigger.removeEventListener('refresh', restaurar);
        scrollTo(0, Math.round(st.start + (st.end - st.start) * objetivo)); estado.scrollRestaurado = +objetivo.toFixed(4); };
      ScrollTrigger.addEventListener('refresh', restaurar);
      requestAnimationFrame(restaurar);
    }
    // en la limpieza el ScrollTrigger ya está eliminado: se usa el último progreso conocido (estado.objetivo)
    // en la limpieza el ScrollTrigger ya se ha revertido (y onUpdate ha recibido p = 0): se usa el progreso capturado en el
    // evento resize, que el navegador despacha ANTES del cambio de media query (orden de "update the rendering")
    return () => { progresoGuardado = progresoResize; raiz.classList.remove('modo-pin'); tlActual = null; receta.limpiar?.(); };   // limpiar: estilos que puso actualizar()
  });
  let progresoResize = null;
  const alRedimensionar = () => { const st = tlActual?.scrollTrigger; if (st && !ScrollTrigger.isRefreshing) progresoResize = st.progress; };
  addEventListener('resize', alRedimensionar);
  let ult = performance.now();
  const alTick = () => { const t = performance.now(); estado.dt.push(t - ult); ult = t; if (estado.dt.length > 600) estado.dt.shift(); };
  gsap.ticker.add(alTick);
  window.__motor = {
    nombre: 'gsap', version: gsap.version, stVersion: ScrollTrigger.version,
    triggers: () => ScrollTrigger.getAll().length, tl: () => tlActual,
    st: () => tlActual?.scrollTrigger ? { start: tlActual.scrollTrigger.start, end: tlActual.scrollTrigger.end, pin: !!tlActual.scrollTrigger.pin } : null,
    destruir() { mm.revert(); gsap.ticker.remove(alTick); removeEventListener('resize', alRedimensionar); estado.destruido = true; }
  };
  return window.__motor;
}
