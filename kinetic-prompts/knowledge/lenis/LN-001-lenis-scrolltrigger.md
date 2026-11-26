---
id: LN-001
titulo: Lenis + GSAP ScrollTrigger (scroll suave sincronizado)
categoria: lenis
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (README del repositorio oficial)
versiones: lenis 1.3.27 (README 2026-10-26; **confirmada como última en npm el 2026-10-27**, publicación modificada el 2026-10-15); GSAP 3.15.0
perfil: cinematografico; en comercial solo si aporta valor
ultima_revision: 2026-10-27
---

# LN-001 · Lenis + ScrollTrigger

1. **Finalidad.** Scroll suave sincronizado con ScrollTrigger y escenas WebGL desde un único bucle.
2. **Fuente.** https://github.com/darkroomengineering/lenis (Setup → GSAP ScrollTrigger; Settings; Reduced motion; Limitations; Troubleshooting). Licencia MIT.
3. **Ubicación.** Secciones citadas del README.
4. **Resultado.** Desplazamiento fluido; ScrollTrigger actualizado en cada frame de Lenis.
5. **Explicación técnica.** Lenis envuelve el scroll **nativo** (por eso `position: sticky`, anclas y accesibilidad siguen funcionando) e interpola la posición. Sincronización: evento `scroll` de Lenis → `ScrollTrigger.update`; `lenis.raf()` ejecutado desde el ticker de GSAP (segundos → ms) y `lagSmoothing(0)`.
6. **Dependencias.** `lenis`, CSS `lenis/dist/lenis.css`, gsap + ScrollTrigger. Paquetes `lenis/react`, `lenis/vue`, `lenis/snap`.
7. **Procedimiento.** Una sola instancia; conectar con ScrollTrigger; importar el CSS; modales con `lenis.stop()/start()` o `data-lenis-prevent`; `anchors: true` si hay enlaces internos; `lenis.destroy()` al desmontar.
8. **Parámetros.** `lerp` (0.1), `duration`/`easing` (ignorados si hay lerp), `smoothWheel`, `syncTouch` (inestable en iOS < 16), `anchors`, `allowNestedScroll` (coste) vs `prevent`, `respectReducedMotion` (true), `autoRaf`.
9. **Código (patrón del README reescrito; no ejecutado):**
   ```js
   import Lenis from "lenis";
   import "lenis/dist/lenis.css";
   const lenis = new Lenis({ anchors: true });
   lenis.on("scroll", ScrollTrigger.update);
   gsap.ticker.add((t) => lenis.raf(t * 1000));
   gsap.ticker.lagSmoothing(0);
   ```
10. **Problemas.** Incompatible con CSS `scroll-snap` (usar `lenis/snap`); no funciona sobre iframes; 60 fps máx. en Safari y 30 fps en bajo consumo; `position: fixed` con retraso en Safari de Macs pre-M1; scroll anidado requiere configuración. **Hipótesis propia a validar:** combinar `autoRaf: true` con el ticker de GSAP duplicaría las actualizaciones.
11. **Rendimiento / a11y.** Con `prefers-reduced-motion: reduce`, Lenis fuerza `lerp: 1` y hace instantáneos los `scrollTo`. No desactivar `respectReducedMotion`. Alternativa oficial de GSAP: ScrollSmoother (también sobre scroll nativo).
12. **Compatibilidad.** `autoToggle` requiere Safari > 17.3, Chrome > 116, Firefox > 128.
13. **Aplicaciones.** Webs de marca, portfolios, WebGL. En webs de negocio suele ser prescindible: justificar su uso.
14. **Pruebas.** Rueda, trackpad, táctil, teclado (espacio, AvPág, flechas), anclas, modales con scroll interno, reduced motion, Safari.
15. **Evidencia.** README oficial. Código no ejecutado. Tutoriales enlazados (Codrops, Edoardo Lunardi) pendientes.


**Medición real (lote 5):** en la demo zoom-parallax de Olivier Larose (Lenis activo), 5 pasos de rueda → ~500 px de recorrido, distancia restante reducida ≈10 % por frame (lerp ≈ 0,1 a 60 fps), 95 % en ~480 ms y asentamiento ~1,1 s. Ver ZOOM-001 y evidence/visual/2026-10-26.

**Trazabilidad v0.6.1:** la medición anterior es [MED]+[CALC] sobre los datos guardados en evidence/visual/2026-10-26/data/ZOOM-001_lenis_rueda_serie.json; el valor `lerp 0.1` es una inferencia por el cociente entre frames, no lectura de la configuración del sitio.
