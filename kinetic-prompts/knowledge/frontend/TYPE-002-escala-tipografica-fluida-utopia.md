---
id: TYPE-002
titulo: Escala tipográfica fluida con dos escalas (móvil y escritorio) interpoladas — método Utopia, con tokens calculados
categoria: frontend
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Utopia, James Gilyead, 01-02-2020) + valores [CALC] propios
versiones: CSS `clamp()` (universal)
perfil: ambos
ultima_revision: 2026-10-26
---

# TYPE-002 · Escala fluida (Utopia)

1. **Finalidad.** Que H1…H6, cuerpo y textos pequeños crezcan proporcionalmente entre móvil y escritorio sin saltos en los *breakpoints*, con "roles" fijos (un H2 siempre es el paso 4) — amplía TYPE-001.
2. **Fuente.** https://utopia.fyi/blog/designing-with-fluid-type-scales/ (James Gilyead; la técnica CSS es de Trys Mudford, enlazada pero no leída en este lote).
3. **Método [artículo].** (1) Escala para pantalla pequeña; (2) escala para pantalla grande; (3) el navegador interpola según el ancho. Ejemplo del artículo: ratio **1,2 a 320 px** y **1,333 a 1500 px**. Ventajas: decisiones más rápidas y consistentes, tipografía proporcionada a cualquier ancho.
4. **Fórmula [CALC, derivación propia].** Para el paso *n*: `min = baseMin·rMinⁿ`, `max = baseMax·rMaxⁿ`; pendiente `m = (max − min)/(vwMax − vwMin)`; intersección `b = min − m·vwMin`; token `clamp(min, b + m·100vw, max)` (pasando px a rem /16).
5. **Tokens calculados [CALC]** con 320→1500 px, base 16→18 px, ratios 1,2→1,333:
   ```css
   --step--1: clamp(0.8333rem, 0.8305rem + 0.0144vw, 0.8440rem); /* 13,3 → 13,5 px */
   --step-0:  clamp(1.0000rem, 0.9661rem + 0.1695vw, 1.1250rem); /* 16 → 18 px (cuerpo) */
   --step-1:  clamp(1.2000rem, 1.1187rem + 0.4063vw, 1.4996rem); /* 19,2 → 24 px */
   --step-2:  clamp(1.4400rem, 1.2884rem + 0.7580vw, 1.9990rem); /* 23 → 32 px */
   --step-3:  clamp(1.7280rem, 1.4740rem + 1.2701vw, 2.6647rem); /* 27,6 → 42,6 px */
   --step-4:  clamp(2.0736rem, 1.6727rem + 2.0046vw, 3.5520rem); /* 33,2 → 56,8 px */
   --step-5:  clamp(2.4883rem, 1.8791rem + 3.0461vw, 4.7348rem); /* 39,8 → 75,8 px (H1) */
   ```
   La base 16→18 px es elección propia (el artículo no la fija).
6. **Accesibilidad.** Cada token suma `rem` + `vw` → respeta el zoom (TYPE-001). [EST, conocimiento general no verificado en este lote] Si el máximo supera ~2,5 veces el mínimo, el zoom al 200 % puede no duplicar el texto en pantallas anchas; aquí el paso 5 crece ×1,9.
7. **Procedimiento.**
   1. Fijar con diseño los dos extremos (móvil 320–375 px, escritorio 1240–1500 px) y los ratios (1,2 / 1,25 para webs sobrias; 1,333 / 1,414 para editoriales o cinematográficas).
   2. Asignar roles: cuerpo = 0, H3 = 2, H2 = 3–4, H1 = 5; texto legal = −1.
   3. Misma técnica para espacios (`--space-s…xl`) para que márgenes crezcan con el texto.
   4. Generar tokens con un script o la calculadora de Utopia (herramienta web gratuita; **no** usada aquí).
8. **Parámetros.** vwMin/vwMax, baseMin/baseMax, rMin/rMax, número de pasos.
9. **Código.** §5.
10. **Errores frecuentes.** Escalas distintas por componente; titulares en `vw` puro; ratio de escritorio aplicado a móvil (H1 enormes en 375 px).
11–13. **Aplicaciones.** Todas; DS-001 los incluye como tokens.
14. **Pruebas.** 320, 375, 768, 1440, 1920 px; zoom 200 %; textos largos (alemán) en H1.
15. **Estado.** Artículo leído; tokens calculados por script; no implementados en un proyecto.
