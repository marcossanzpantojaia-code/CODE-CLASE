# CONSULTA_BIBLIOTECA — Persianas desde el centro (`page-transition-blinds`)

## 1. Encargo

- Descripción breve: transición de página de nivel intermedio. Unas tiras tapan la página desde el centro, cambia la página y se recogen igual.
- Perfil (A/B) y motivo: ambos. Es una transición de página que vale para una web comercial (corta, ligera) y para una cinematográfica.
- Versión de la biblioteca: 0.32.0 · Lotes 0–32 · 2026-11-04.
- Stack y versiones: HTML, CSS y JavaScript con Web Animations API, sin dependencias. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Tiras abiertas desde el centro y costuras | MASK-002 | knowledge/transitions/MASK-002-mascaras-svg-de-persianas-y-rejillas.md | IMPLEMENTADO | SVG mask + GSAP en la fuente; aquí, divs con transform (sin dependencias) |
| Enganchar la transición a la navegación, foco y anuncio | PT-001 | knowledge/transitions/PT-001-transiciones-de-pagina-paralelas.md | INVESTIGADO | React Router 8 en la fuente; aquí, patrón secuencial para Next.js, Astro y HTML |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |
| Duración y easing | UX-001 | knowledge/ux/UX-001-duracion-y-easing.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| MASK-002 §2 y §6 | Escalonado por distancia al centro: espera = abs(i − (N − 1) / 2) × escalonado | preview/index.html (`animateStrips`) | No | Sí: se aplica a tiras que cubren y destapan, no a una máscara entre dos escenas |
| MASK-002 §8 | Solape de 1 px por lado (tira de 100 % / N + 2 px) para evitar costuras con medidas fraccionarias | preview/index.html (`build`) | No | Sí: el solape de 0,05 unidades de la ficha pasa a 1 px por lado |
| MASK-002 §9 | En pantallas estrechas, la mitad de tiras (mínimo 6) | preview/index.html (`stripCount`) | No | Sí |
| MASK-002 §5 | Se cambia la máscara SVG por tiras con `transform: scale`: solo compositor y sin dependencias, y encaja con cualquier enrutador (cubrir → cambiar → descubrir) | preview/index.html | No | Sí |
| PT-001 §3 | Patrón secuencial (sale y luego entra), el más fácil de integrar; el paralelo queda para una transición avanzada | prompt.md §3 | No | Sí |
| PT-001 §6 | Foco al `h1` de la página nueva y anuncio `aria-live`; la capa no recibe foco ni clics | preview/index.html (`show`), prompt.md §7 | No | Sí: en la demo solo con clic real, para que el bucle no robe el foco a la ficha |
| A11Y-001 (lote 3) | Un barrido grande es desencadenante: con movimiento reducido, fundido de 150 ms | preview/index.html (`go`), prompt.md §7 | No | No |
| UX-001 §3 | Fase de 0,55 s + escalonado (0,72 s por fase), por encima de la UI pero como animación expresiva de marca | item.json (`duration`) | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| CSS-002 | Se usará en la transición básica (fundido nativo); aquí la captura estática del navegador no deja escalonar tiras |

## 5. Verificaciones en documentación oficial

| Afirmación de la ficha marcada "verificar" | Fuente consultada | Resultado |
|---|---|---|
| — | — | Ninguna afirmación marcada en las partes usadas |

## 6. Pruebas

| Prueba (campo 14 / A11Y-005 / TEST-001) | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Costuras con tiras cerradas en 1366 × 768, 390 × 844 @3x y 1280 × 800 (MASK-002 §12) | Playwright + sharp | 0 px de la página de debajo en los tres | VALIDACION.md |
| Reversibilidad, consola, anchos, parámetros, movimiento reducido, foco | scripts/validar-animacion.mjs | 23/23 | VALIDACION.md |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca (no aplicar desde el proyecto)

- Correcciones de fichas: MASK-002 podría añadir la variante «cubrir → destapar» con `transform` para transiciones de página, que evita animar atributos de una máscara.
- Fichas que podrían pasar a IMPLEMENTADO/VALIDADO (con evidencia): ninguna; esta demo valida la adaptación, no el tutorial original.
