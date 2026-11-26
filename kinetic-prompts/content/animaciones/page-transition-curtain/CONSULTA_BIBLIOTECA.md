# CONSULTA_BIBLIOTECA — Cortina con borde curvo (`page-transition-curtain`)

## 1. Encargo

- Descripción breve: transición de página de nivel intermedio. Una cortina sube con el borde curvo, que se endereza al tapar, y sale por arriba con otra curva.
- Perfil (A/B) y motivo: ambos. Agencias y portfolios con más curva; negocios clásicos con curva baja y color sobrio.
- Versión de la biblioteca: 0.32.0 · Lotes 0–32 · 2026-11-04.
- Stack y versiones: HTML, CSS y JavaScript con Web Animations API, sin dependencias. Comprobado en Chromium (Playwright 1.63.0).

## 2. Necesidades → fichas

| Necesidad | Ficha (ID) | Ruta | Estado de la ficha | Versiones ficha vs proyecto |
|---|---|---|---|---|
| Borde curvo que se aplana al llegar | MENU-001 | knowledge/transitions/MENU-001-menu-curvo-svg.md | INVESTIGADO | Fuente con Next 13 y framer-motion 10; aquí, sin dependencias |
| Enganche con la navegación, foco y anuncio | PT-001 | knowledge/transitions/PT-001-transiciones-de-pagina-paralelas.md | INVESTIGADO | Patrón secuencial |
| Movimiento reducido | A11Y-001 | knowledge/accessibility/A11Y-001-reduced-motion.md | INVESTIGADO | — |
| Duración y easing | UX-001 | knowledge/ux/UX-001-duracion-y-easing.md | INVESTIGADO | — |

## 3. Aplicación

| Ficha | Decisión tomada | Archivo:línea | ¿Copia código de la fuente? (licencia) | Adaptación propia (sí/no) |
|---|---|---|---|---|
| MENU-001 §5 | La curva sale del panel y se aplana justo al llegar; easing `cubic-bezier(0.76, 0, 0.24, 1)` | preview/index.html (`go`) | No: la fuente no tiene licencia; solo se usa la descripción | Sí |
| MENU-001 §5 y §9 | En vez de interpolar el atributo `d` de un trazado, un lóbulo elíptico (`border-radius`) que se escala en Y: solo `transform`, sin medir la ventana | preview/index.html (CSS `.lobulo`) | No | Sí |
| MENU-001 §5 | Solape de 1 px entre curva y panel para evitar la costura | preview/index.html (CSS `.lobulo`) | No | No |
| MENU-001 §7.1 | Medidas relativas (`vh`) para no leer la ventana en el render | preview/index.html, prompt.md §6 | No | No |
| MENU-001 §7.5 y A11Y-001 | Con movimiento reducido, fundido de 150 ms en lugar de la cortina | preview/index.html (`go`), prompt.md §7 | No | No |
| PT-001 §6 | Foco al `h1` nuevo y anuncio; la capa no recibe foco | preview/index.html (`show`), prompt.md §7 | No | Sí |
| UX-001 §5 | 0,7 s por fase: animación expresiva de marca, no de interfaz | item.json | No | Sí |

## 4. Fichas consultadas y descartadas

| Ficha | Motivo |
|---|---|
| A11Y-004 (no leída) | Citada por MENU-001 para el menú como diálogo; aquí no hay menú, solo transición |

## 5. Verificaciones en documentación oficial

| Afirmación de la ficha marcada "verificar" | Fuente consultada | Resultado |
|---|---|---|
| Ease `[0.76, 0, 0.24, 1]` ≈ easeInOutQuart [EST] | — | No verificado; se usa como curva propia, sin depender de la equivalencia |

## 6. Pruebas

| Prueba | Herramienta | Resultado | Artefacto |
|---|---|---|---|
| Al tapar no asoma la página (1366 × 768, 390 × 844 @3x, 1280 × 800) | Playwright + sharp | 0 px en los tres | VALIDACION.md |
| La curva está a mitad (0,50) y recta al llegar (0,00) | Playwright | ✓ | VALIDACION.md |
| Texto con contraste según el color (blanco o negro) | Playwright | ✓ | VALIDACION.md |
| Consola, anchos, parámetros, repetición, movimiento reducido | scripts/validar-animacion.mjs | 22/22 | VALIDACION.md |
| Safari y Firefox | — | No probado | Pendiente de prueba manual |

## 7. Propuestas para la biblioteca (no aplicar desde el proyecto)

- Correcciones de fichas: MENU-001 puede añadir la variante del lóbulo escalado (solo `transform`) como alternativa a animar `d`.
- Fichas que podrían pasar a IMPLEMENTADO/VALIDADO: ninguna.
