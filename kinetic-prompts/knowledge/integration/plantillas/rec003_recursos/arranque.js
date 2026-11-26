// Selecciona el motor por URL: ?motor=gsap|nativo (por defecto gsap) &pin=1 &scrub=true|<s>
// Con motor=gsap carga GSAP desde la instalación local (npm ci en esta carpeta): node_modules/gsap/dist/.
// La versión nativa NO carga GSAP (así la comparación no está contaminada).
export const RUTA_GSAP = 'node_modules/gsap/dist/';
const q = new URLSearchParams(location.search);
export const opciones = {
  motor: q.get('motor') || 'gsap',
  pin: q.get('pin') === '1',
  scrub: !q.has('scrub') || q.get('scrub') === 'true' ? true : +q.get('scrub'),
};
const script = src => new Promise((ok, mal) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No carga ' + src)); document.head.append(s); });
export async function arrancar(seccion, receta) {
  document.documentElement.dataset.motor = opciones.motor;
  if (opciones.motor === 'gsap') {
    if (!window.gsap) await script(RUTA_GSAP + 'gsap.min.js');                 // no recargar si la página ya lo cargó (plugins registrados)
    if (!window.ScrollTrigger) await script(RUTA_GSAP + 'ScrollTrigger.min.js');
    const { montar } = await import('./motor_gsap.js'); return montar(seccion, receta, opciones);
  }
  const { montar } = await import('./motor_nativo.js'); return montar(seccion, receta, opciones);
}
