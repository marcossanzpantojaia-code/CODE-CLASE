// Puerto a GSAP del motor de las microdemos (lote 25). PREPARADO, NO EJECUTADO: GSAP no está instalado (requiere autorización).
// Mantiene la API montar(seccion, aplica, opciones) para que la MISMA función aplica(p) se dibuje con ScrollTrigger y se
// puedan comparar capturas nativo frente a GSAP. Requiere gsap.min.js y ScrollTrigger.min.js (UMD) cargados antes.
export function montar(seccion, aplica, { scrub = true, pin = false } = {}) {
  const { gsap, ScrollTrigger } = window; gsap.registerPlugin(ScrollTrigger);
  const estado = window.__estado = window.__estado || {}; estado.dt = []; estado.trabajo = [];
  const q = new URLSearchParams(location.search);
  if (q.has('scrub')) scrub = q.get('scrub') === 'true' ? true : +q.get('scrub');
  if (q.get('pin') === '1') pin = true;
  const mm = gsap.matchMedia();
  mm.add({ normal: '(prefers-reduced-motion: no-preference)', reducir: '(prefers-reduced-motion: reduce)' }, ctx => {
    if (ctx.conditions.reducir) {                       // sin pin ni scrub: composición estática (como .rm en el motor nativo)
      document.documentElement.classList.add('rm'); aplica(1, estado); estado.reducedMotion = true;
      return () => document.documentElement.classList.remove('rm');
    }
    if (pin) { seccion.style.height = '100vh'; seccion.querySelector('.escenario').style.position = 'relative'; }
    const proxy = { p: 0 };
    const tl = gsap.timeline({ scrollTrigger: {
      trigger: seccion, start: 'top top', end: pin ? '+=300%' : 'bottom bottom',
      pin: pin ? seccion.querySelector('.escenario') : false, scrub, invalidateOnRefresh: true } });
    tl.to(proxy, { p: 1, ease: 'none', duration: 1, onUpdate: () => {
      const t0 = performance.now(); aplica(proxy.p, estado); estado.trabajo.push(performance.now() - t0); if (estado.trabajo.length > 600) estado.trabajo.shift();
      estado.p = +proxy.p.toFixed(4); estado.objetivo = +tl.scrollTrigger.progress.toFixed(4); } });
    aplica(0, estado); estado.p = 0;
    return () => { seccion.style.height = ''; seccion.querySelector('.escenario').style.position = ''; };   // limpieza al revertir
  });
  let ult = performance.now(); gsap.ticker.add(() => { const t = performance.now(); estado.dt.push(t - ult); ult = t; if (estado.dt.length > 600) estado.dt.shift(); });
  window.__gsapInfo = { version: gsap.version, triggers: () => ScrollTrigger.getAll().length };
}
