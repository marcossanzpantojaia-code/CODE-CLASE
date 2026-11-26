---
id: VEL-001
titulo: Inclinación (skew) proporcional a la velocidad del scroll
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código literal en el lote 6; en el lote 3 solo resumen) — demo oficial GSAP "Velocity Skew", CodePen eYpGLYL; movimiento NO observado
versiones: demo con build "latest beta" de GSAP 3 (versión exacta no visible); docs 3.15
perfil: ambos (sutil en comercial)
ultima_revision: 2026-10-26
---

# VEL-001 · Skew por velocidad

1. **Nombre y finalidad.** Las imágenes se inclinan al hacer scroll rápido y vuelven a su sitio al frenar: sensación de inercia física (temas 4 y 6).
2. **Fuente.** GSAP Demo Hub, "Velocity Skew", CodePen GreenSock/eYpGLYL (código leído como resumen automático).
3. **Ubicación.** Único script del pen.
4. **Resultado.** Inclinación vertical (`skewY`) que crece con la velocidad, satura y se relaja suavemente.
5. **Explicación técnica (según el resumen).** Un objeto proxy `{ skew: 0 }`; `gsap.quickSetter(".skewElem", "skewY", "deg")`; `gsap.utils.clamp(-20, 20)`. Un `ScrollTrigger.create` con `onUpdate` lee `self.getVelocity()`, divide entre −300 y limita. Solo si el nuevo valor absoluto supera al actual se aplica: se asigna al proxy y un `gsap.to(proxy, { skew: 0, duration: 0.8, ease: "power3", overwrite: true, onUpdate })` lo devuelve a 0 escribiendo con el quickSetter en cada frame. `transformOrigin: "right center"` y `force3D: true`.
6. **Dependencias.** gsap + ScrollTrigger.
7. **Procedimiento (adaptación).** Igual, aplicado a una lista de imágenes; compatible con Lenis (ScrollTrigger recibe la velocidad del scroll real).
8. **Parámetros.** Divisor de velocidad (−300), límite (±20°), retorno (0,8 s, power3), origen de transformación.
9. **Código.** Sin fragmento (pen sin licencia explícita); ver nombres de API en §5.
10. **Problemas habituales.** Sin la condición "solo si supera" la inclinación tiembla al desacelerar; sin `overwrite: true` se acumulan tweens; valores altos marean.
11. **Rendimiento / a11y.** `quickSetter` evita crear tweens por evento → barato. Movimiento vestibular: limitar a ±5–8° en webs comerciales y desactivar con reduced motion.
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Galería de trabajos, listado editorial.
14. **Pruebas.** Rueda rápida/lenta, trackpad, táctil, con y sin Lenis, reduced motion; verificar los parámetros en el editor de CodePen antes de validar.
15. **Estado de evidencia.** Solo resumen automático del código; no se ha visto el código literal ni la demo en ejecución.


## Lote 6 — código LITERAL leído (CodePen GreenSock/eYpGLYL, creado 2020-05-01, act. 2025-08-01; pen público → MIT)
- Confirma el resumen del lote 3: proxy `{skew: 0}`, `gsap.quickSetter(".skewElem", "skewY", "deg")`, `gsap.utils.clamp(-20, 20)`, `self.getVelocity() / -300`, aplicación solo si el nuevo valor es mayor en valor absoluto, retorno `gsap.to(proxy, {skew: 0, duration: 0.8, ease: "power3", overwrite: true})`, `transformOrigin: "right center"`, `force3D: true`. `ScrollTrigger.create` **sin `trigger`** (toda la página).
- Precisión: `"power3"` equivale a `power3.out`, que en GSAP es una curva **cuártica** (Power0–4 = lineal, quad, cubic, quart, quint; verificado en `gsap-core.js`, UX-001).
- HTML: 10 imágenes cuadradas de 300 px (`max-width: 80vw`) separadas 20vh; `alt=""`.
- **[CALC]** satura a 20° con una velocidad de 6 000 px/s (20 × 300).
- **NO observado:** el movimiento (requiere scroll con el panel visible). Estado: `CODIGO_INSPECCIONADO` (ya no solo resumen).
