---
id: UX-001
titulo: Duración, easing y frecuencia de las animaciones de interfaz (criterios de usabilidad)
categoria: ux
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Nielsen Norman Group, "Executing UX Animations: Duration and Motion Characteristics"; enlazado desde la guía a11y oficial de GSAP)
versiones: n/a
perfil: ambos (prioritario en comercial)
ultima_revision: 2026-10-26
---

# UX-001 · Duración y easing

1. **Finalidad.** Valores por defecto razonables para que Claude Code no improvise duraciones; distinguir animación de interfaz (feedback) de animación narrativa (scroll cinematográfico).
2. **Fuente.** nngroup.com/articles/animation-duration/.
3. **Recomendaciones (NN/g).**
   - La mayoría de animaciones de UI: **100–400 ms**; usar la más corta que no resulte brusca.
   - Feedback simple (checkbox, toggle): **~100 ms**. Cambios grandes (abrir modal): **200–300 ms**. Movimientos largos en pantallas grandes: **~400 ms**; cerca de **500 ms** ya se siente lento.
   - Entradas algo más largas que salidas (p. ej. 300 ms entrar, 200–250 ms salir).
   - **Ease-out** para casi todo, sobre todo al entrar; **ease-in** para salir; evitar lineal; ease-in-out es más rápido en el centro.
   - Cuanto más lejos viaja el elemento, más importa la suavidad y más duración admite.
   - Cuanto más frecuente, más corta y sutil.
   - Hover: respuesta inmediata, o un pequeño retardo si puede parpadear al pasar el cursor.
   - Limitar movimiento: destellos, parallax, carruseles automáticos y scroll-jacking pueden causar mareo; respetar "reducir movimiento".
4. **Traducción a GSAP (adaptación).** Entrada → `power2.out`/`power3.out` 0,3 s; salida → `power2.in` 0,2 s; feedback → 0,1 s; modal → 0,25–0,3 s. Equivalencias de curvas: `cubic-bezier(0.33, 1, 0.68, 1)` = easeOutCubic = `power2.out` (power1 = quad, power2 = cubic, power3 = quart).
5. **Contraste con las fuentes de la biblioteca.** Botón magnético con retorno elástico de 0,7–1 s (HOV-001) y revelados de texto de 0,75 s (TXT-002) superan el rango de UI: aceptables como **animaciones expresivas de marca**, no como feedback. Las animaciones con scrub dependen del scroll y no aplican estas duraciones.
6. **Dependencias.** n/a.
7. **Procedimiento.** Definir tokens de movimiento del proyecto (`--dur-fast: 100ms; --dur-base: 250ms; --dur-slow: 400ms; --ease-out: cubic-bezier(.33,1,.68,1)`) y usarlos en CSS y GSAP.
8. **Parámetros.** Ver §3–4.
9. **Código.** Tokens del §7 (propuesta).
10. **Problemas habituales.** Todo a 1 s "porque queda premium"; mismo easing para entrar y salir; animaciones de hover lentas.
11. **Accesibilidad.** Ver A11Y-001/002.
12. **Compatibilidad.** n/a.
13. **Aplicaciones.** Toda interfaz.
14. **Pruebas.** Revisión con usuarios; comparar 250 vs 300 ms (NN/g señala que se nota).
15. **Estado de evidencia.** Artículo leído (resumen). Equivalencia `power2` = cúbica **verificada en el código fuente de gsap 3.12.2** (`gsap-core.js`: la serie "Linear,Quad,Cubic,Quart,Quint" se registra como Power0…Power4, y `.out` = 1 − (1 − p)^n). Que `cubic-bezier(.33,1,.68,1)` aproxima easeOutCubic es una equivalencia aproximada de uso común, no exacta.
