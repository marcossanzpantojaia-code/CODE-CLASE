# Plantilla verificada: escena por scroll con GSAP 3.15.0 (lote 26)

Copia exacta de los módulos ejecutados y medidos en `evidence/demos/2026-11-02-lote26/` (GS-005). Uso en un proyecto:

1. `npm ci` en la carpeta del proyecto (con `package.json` y `package-lock.json`: gsap 3.15.0 exacto). **Pide autorización antes de instalar.**
2. Sección `#acto` (400vh en sticky) con un hijo `.escenario` (`position: sticky; top: 0; height: 100vh`) y estas reglas para el pin:
   `.modo-pin #acto { height: auto } .modo-pin .escenario { position: relative }`.
3. Declara la receta: `{ recorrido, pistas({ movil }), actualizar(p, estado), limpiar(), final(estado) }` (ejemplos completos: `evidence/demos/2026-11-02-lote26/demos/receta_{a,b,c}.html`).
4. `import { arrancar } from './arranque.js'; arrancar(document.getElementById('acto'), receta);` → `?motor=gsap|nativo&pin=1&scrub=0.8`.
5. Valida: `node integration/tools/validar_gsap.mjs http://…/pagina.html <salida> 1440` y `375`, después `python3 integration/tools/diferencias.py <salida>`; auditoría visual con `auditoria_visual_escena.mjs`.

| Módulo | Función |
|---|---|
| `escena.js` | `muestra()`, curvas idénticas a GSAP (`power2.inOut`, `none`), `aplicaPistas()` para el motor nativo, `vw()`/`vh()` en función |
| `motor_gsap.js` | timeline + ScrollTrigger a partir de las pistas, matchMedia, `onRefresh`, restauración del progreso al cruzar puntos de corte, `destruir()` |
| `motor_nativo.js` | referencia sin dependencias (rAF + sticky) para comparar |
| `arranque.js` | elige el motor y carga GSAP **solo** si `motor=gsap` |

Reglas aprendidas (GS-005 §3): nada de `tl.set(…, 0)` para el estado inicial; medir en coordenadas del escenario; no animar elementos con la propiedad CSS `translate`; redibujar el canvas tras el resize. Los parámetros `?sinMovil`, `?sinOnRefresh` y `?sinRestaurarScroll` solo sirven para reproducir los defectos: no usarlos en producción.
