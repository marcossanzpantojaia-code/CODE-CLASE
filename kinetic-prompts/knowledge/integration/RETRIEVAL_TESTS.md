# Pruebas de recuperación para Claude Code (estado: DEFINIDAS, no ejecutadas)

Ejecutar en una carpeta aislada nueva, sin proyectos ni datos reales del usuario. Cada prueba se considera superada solo si cumple **todos** sus criterios y entrega `CONSULTA_BIBLIOTECA.md` completo (plantilla en esta carpeta). Ninguna prueba se ha ejecutado todavía.

## Prueba 1 — Web comercial para una barbería
**Encargo:** "Crea la web de 'Barbería Ejemplo' (Madrid): inicio, servicios con precios, equipo, reservas por formulario, ubicación, en español e inglés. Debe cumplir cookies en España."
**Fichas que deberían consultarse (mínimo):** CLIENT-001, UX-002, COPY-001, UI-002, DS-001, TYPE-002, ASTRO-002 o NEXT-002/003, FORM-001, SEC-002, SEO-002, SEO-003, I18N-001, LEGAL-001, ANALYTICS-001, A11Y-003, A11Y-005, PERF-001.
**Criterios:**
1. Perfil A declarado; ninguna técnica cinematográfica sin justificación (sin Lenis, sin Three.js).
2. H1 "qué + dónde", CTA primario único, precios visibles, NAP en texto y JSON-LD `LocalBusiness` válido sin autovaloraciones.
3. Formulario con validación en servidor, errores por campo accesibles y sin secretos en el cliente.
4. `hreflang` recíproco es/en y `html lang` correcto.
5. Banner con Aceptar/Rechazar/Configurar al mismo nivel; nada de terceros no exentos antes de aceptar (prueba Playwright de peticiones).
6. Reduced motion; contraste ≥ 4,5:1; teclado completo.
7. `CONSULTA_BIBLIOTECA.md` enlaza cada ficha con archivo/línea donde se aplicó.

## Prueba 2 — Landing cinematográfica con GSAP y Three.js
**Encargo:** "Landing de lanzamiento de un reloj: hero 3D, tres capítulos guiados por scroll, transición entre escenas, partículas, CTA de reserva."
**Fichas mínimas:** CASE-002, WGPU-001, GL-006, LN-001 o GS-002, ST-001/002, R3F-001 o CAM-001/002, SCN-001 o SCN-002, INST-001 o INST-002, TSL-001 (si usa WebGPURenderer), A11Y-001, A11Y-002, PERF-001, PERF-002, TJ-001.
**Criterios:**
1. Dispositivo objetivo y fps declarados antes de construir.
2. Una sola timeline maestra controlada por scroll; un único bucle de render.
3. Escalera de degradación implementada (al menos: HTML completo sin JS + nivel WebGL reducido) y probada con WebGL desactivado o `forceWebGL`.
4. Reduced motion → estados finales sin movimiento; contenido y CTA en HTML.
5. Recursos 3D liberados al desmontar (TJ-001); `renderer.info` estable tras navegar.
6. Licencias respetadas: ningún código copiado de fuentes "sin licencia".
7. Evidencias: vídeo/capturas de los 3 capítulos, fps medidos con método descrito, informe de pruebas.

## Prueba 3 — Revisión de una web React/Next.js
**Encargo:** "Revisa este proyecto Next.js (fixture de prueba con errores sembrados) por seguridad, accesibilidad y rendimiento." Fixture recomendado: copia de un repo público didáctico (p. ej. el de NEXT-002) en la carpeta aislada.
**Fichas mínimas:** NEXT-002, NEXT-003, SEC-001, SEC-002, T3-001, DEPLOY-001, A11Y-003, A11Y-004, A11Y-005, UX-004, PERF-001, PERF-002, TEST-001.
**Criterios:**
1. Informe con hallazgos clasificados (gravedad, archivo:línea, ficha de referencia, corrección propuesta).
2. Distingue **hallazgo de revisión** de **vulnerabilidad demostrada** (no afirma explotación sin prueba).
3. Detecta al menos los errores sembrados (p. ej. acción sin autorización, `Object.fromEntries(formData)` sin esquema, `div` clicable, imagen sin `alt`, script bloqueante).
4. Propone pruebas automatizables (Playwright/CI-001) para evitar regresiones.
5. No modifica el fixture salvo que se pida; cambios en rama separada.

## Registro de resultados
| Prueba | Fecha | Versión de la biblioteca | Resultado | Evidencias |
|---|---|---|---|---|
| 1 | — | — | NO EJECUTADA | — |
| 2 | — | — | NO EJECUTADA | — |
| 3 | — | — | NO EJECUTADA | — |
