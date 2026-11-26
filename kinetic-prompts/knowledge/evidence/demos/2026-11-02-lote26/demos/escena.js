// Utilidades compartidas por los dos motores (lote 26). Sin dependencias.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// Curvas IDÉNTICAS a las de GSAP con el mismo nombre (power2 = cúbica en GSAP):
export const ease = {
  none: t => t,
  inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,   // = "power2.inOut"
};
export const NOMBRE_GSAP = new Map([[ease.none, 'none'], [ease.inOut, 'power2.inOut']]);
// pista: [[p0, v0], [p1, v1], ...]; dos claves con el mismo valor = meseta
export function muestra(keys, p, e = ease.inOut) {
  if (p <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [p1, v1] = keys[i], [p0, v0] = keys[i - 1];
    if (p <= p1) { const t = e(clamp((p - p0) / (p1 - p0 || 1))); return lerp(v0, v1, t); }
  }
  return keys.at(-1)[1];
}
// Una receta declara PISTAS: { el, keys, ease, desfase, gsap: { prop, conv } } (prop = propiedad de GSAP).
// - Motor GSAP: tweens reales fromTo por tramo en un timeline con ScrollTrigger.
// - Motor nativo: muestra() + composición de transform en el MISMO orden que GSAP
//   (translate(xPercent, yPercent) translate(x, y) rotate scale) y estilos directos para el resto.
const TRANSF = new Set(['x', 'y', 'xPercent', 'yPercent', 'rotation', 'scale']);
const resolver = v => typeof v === 'function' ? v() : v;
export function aplicaPistas(pistas, p) {
  const tocados = new Set();
  for (const t of pistas) {
    const v = resolver((t.gsap.conv || (x => x))(muestra(t.keys, clamp(p - (t.desfase || 0)), t.ease || ease.inOut)));
    if (TRANSF.has(t.gsap.prop)) { (t.el.__t ||= {})[t.gsap.prop] = v; tocados.add(t.el); }
    else t.el.style[t.gsap.prop] = v;
  }
  for (const el of tocados) { const q = el.__t;
    el.style.transform = `translate(${q.xPercent || 0}%, ${q.yPercent || 0}%) translate(${q.x || 0}px, ${q.y || 0}px) rotate(${q.rotation || 0}deg) scale(${q.scale ?? 1})`; }
}
export const vw = v => () => v * innerWidth / 100;      // valores en función → se recalculan en refresh (invalidateOnRefresh)
export const vh = v => () => v * innerHeight / 100;
