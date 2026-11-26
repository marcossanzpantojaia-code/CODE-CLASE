---
id: ZOOM-001
titulo: Zoom parallax de collage (capas centradas escaladas desde el centro)
categoria: scrolltrigger
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-011, framer-motion) + ARTICULO_AUTOR_ANALIZADO + DEMO_INSPECCIONADA (lote 5); equivalente GSAP = adaptación propuesta
versiones: fuente — framer-motion ^10.18.0, Next 14.0.4; propuesta — gsap 3.15 + ScrollTrigger
perfil: ambos
ultima_revision: 2026-10-26
---

# ZOOM-001 · Zoom parallax

1. **Nombre y finalidad.** Entrar "dentro" de una imagen de un collage al hacer scroll: la central crece hasta llenar la pantalla y las demás se dispersan hacia fuera (temas 5, 6, 13 en versión 2D).
2. **Fuente.** Olivier Larose, `olivierlarose/zoom-parallax` (TUT-011).
3. **Ubicación.** `src/components/ZoomParallax/index.jsx` y `styles.module.scss`.
4. **Resultado.** Zoom con profundidad: cada imagen escala a ritmo distinto.
5. **Explicación técnica (observada).** Contenedor 300vh + hijo `sticky` 100vh con `overflow: hidden`. Cada imagen está dentro de una **capa absoluta de 100 % × 100 %** centrada con flex; la imagen se desplaza dentro de la capa con `top/left` en vh/vw. Se escala **la capa** (origen = centro del viewport), así que una imagen a +X del centro acaba a +X·escala: se aleja sola. Escalas finales 4, 5, 6, 5, 6, 8, 9 sobre el progreso 0→1 del contenedor; la central (25vw×25vh) × 4 = pantalla completa.
6. **Dependencias.** Fuente: framer-motion (`useScroll`, `useTransform`). Propuesta: gsap + ScrollTrigger.
7. **Procedimiento (adaptación).** Misma estructura CSS; una timeline con `scrollTrigger: { trigger: contenedor, start: "top top", end: "bottom bottom", scrub: true }` y un tween de `scale` por capa (todas en posición 0, `ease: "none"`). La central debe alcanzar `100vw / ancho_central` y `100vh / alto_central` (con imagen 25vw×25vh → 4).
8. **Parámetros.** Altura del recorrido (300vh), escalas por capa, tamaños/posiciones de las imágenes.
9. **Código (adaptación propuesta; no ejecutada):**
   ```js
   const tl = gsap.timeline({ scrollTrigger: { trigger: ".zoom", start: "top top", end: "bottom bottom", scrub: true } });
   gsap.utils.toArray(".zoom__layer").forEach((layer, i) => tl.to(layer, { scale: [4,5,6,5,6,8,9][i], ease: "none" }, 0));
   ```
10. **Problemas habituales.** Escalar la imagen en vez de la capa (no se dispersa); imágenes de baja resolución que se pixelan a ×9 (servir resolución suficiente para la central); `overflow: hidden` en un ancestro del sticky lo anula.
11. **Rendimiento / a11y.** Solo transform; pero escalar 7 imágenes grandes puede costar en móviles → `will-change: transform` solo durante el tramo. Reduced motion: collage estático.
12. **Compatibilidad.** `position: sticky` universal.
13. **Aplicaciones.** Portada de portfolio, presentación de un local/espacio, galería de proyectos.
14. **Pruebas.** 3 anchos (en vertical, revisar tamaños mínimos), nitidez de la central al final, scroll adelante/atrás, reduced motion.
15. **Estado de evidencia.** Código leído. No ejecutado.


## Inspección visual (lote 4, v0.5.0) — BLOQUEADA

- Demo pública: https://blog.olivierlarose.com/demos/zoom-parallax
- Intento 1: Chromium preinstalado en la nube (Playwright) → `ERR_TUNNEL_CONNECTION_FAILED` (la salida de red de esta sesión no permite ese host).
- Intento 2: navegador del usuario (Claude in Chrome) → extensión no conectada.
- No se repite el intento. **Nada de esta ficha ha sido visto en pantalla.**

## Estados derivados del código (calculados, NO observados) — lote 4, viewport teórico 1440×900

> Superado en parte por la medición real del lote 5 (viewport 747×894). Los porcentajes de esta tabla siguen siendo **[CALC]**.

Cálculo propio a partir de los valores CSS y las escalas del repo (viewport 1440×900; escala lineal con el progreso; script en el registro del lote 4):

| Progreso | Imagen central (escala → tamaño, % de pantalla cubierta) | Resto |
|---|---|---|
| 0 (inicio) | ×1 → 360×225 px, 6 % | 7 imágenes visibles; collage completo (≈46 % del viewport ocupado sumando todas) |
| 0,25 | ×1,75 → 630×394, 19 % | las exteriores ya se salen parcialmente; la de esquina inferior derecha (#7, ×3) desaparece |
| 0,5 (intermedio) | ×2,5 → 900×562, 39 % | solo #2 y #4 asoman (4 % cada una); el resto fuera |
| 1 (final) | ×4 → 1440×900, **100 %** | todas fuera de pantalla |

Consecuencias: (1) la central llena **exactamente** la pantalla al final solo si su tamaño es 25vw×25vh y la escala final 4 — cualquier cambio de tamaño exige recalcular `100/ancho_vw`; (2) el collage "se vacía" en la primera mitad del recorrido: la segunda mitad es solo el zoom de la central (ritmo a ajustar si se quiere más dispersión visible); (3) el ritmo es **lineal** con el scroll (framer `useTransform` sin easing; en GSAP, `ease: "none"`).
Incertidumbres: ritmo percibido con Lenis (inercia) y aspecto en móvil vertical.


## Inspección visual REAL (lote 5, 2026-10-26) — `DEMO_INSPECCIONADA`
Navegador integrado de Cowork; viewport 747×894, DPR 1,5, 60 fps. Evidencia: [evidence/visual/2026-10-26](../evidence/visual/2026-10-26/README.md). **No es el vídeo del tutorial.**

- **Demo:** https://blog.olivierlarose.com/demos/zoom-parallax (build de producción del autor, Next.js con imágenes `next/image` y Lenis activo: clases `lenis lenis-smooth` en `<html>`).
- **Estructura medida:** contenedor de 2 682 px (= 300vh de 894) con un hijo sticky de 894 px; recorrido útil 1 788 px.
- **Escalas medidas por capa** (estado estable tras cada salto): progreso 0 → todas ×1; 0,25 → 1,75 / 2 / 2,25 / 2 / 2,25 / 2,75 / 3; 0,5 → 2,5 / 3 / 3,5 / 3 / 3,5 / 4,5 / 5; 1 → 4 / 5 / 6 / 5 / 6 / 8 / 9. **Coinciden exactamente con el código y son lineales** con el scroll.
- **Estados observados** (capturas `ZOOM-001_p0/p050/p100`): inicio = collage de 7 imágenes centrado bajo el área vacía; intermedio = la imagen central (paisaje) ocupa la mayor parte y solo asoman los bordes de 2 imágenes vecinas — **igual que predijo el cálculo del lote 4**; final = la central llena el viewport (747×894 medido, con −8 px de desfase horizontal por la barra de scroll).
- **Inercia de Lenis medida** (5 pasos de rueda reales): el scroll avanza ~500 px y converge exponencialmente; la distancia restante se reduce ≈10 % por frame (cociente 0,90–0,91 entre frames consecutivos) → coherente con un `lerp` ≈ 0,1 a 60 fps (valor por defecto de Lenis según su README; aquí **medido**). 95 % del recorrido en ~480 ms, asentamiento total ~1,1 s.
- **Retardo de un frame:** la escala de framer-motion corresponde al scroll del frame anterior (p. ej. scroll 628 px → escala de 663 px un frame después). Irrelevante visualmente, pero explica por qué conviene leer el scroll de Lenis directamente si se sincroniza con WebGL.
- **Procedimiento reproducible para Claude Code:** ver §7–9; usar `ease: "none"`, escala aplicada a capas de pantalla completa, y Lenis con `lerp` 0,1 si se quiere la misma sensación.


### Trazabilidad v0.6.1 (corrección tras auditoría)
Etiquetas: **[OBS]** visto en captura · **[MED]** medido en el DOM con datos guardados · **[CALC]** calculado a partir del código o de los datos · **[EST]** estimación (latencia de herramienta, ojo humano) · **[COD]** leído en el código.
- [MED] escalas y rectángulos de cada imagen en 5 posiciones ([ZOOM-001_escalas_por_progreso.json](../evidence/visual/2026-10-26/data/ZOOM-001_escalas_por_progreso.json)); [MED] serie de la rueda ([ZOOM-001_lenis_rueda_serie.json](../evidence/visual/2026-10-26/data/ZOOM-001_lenis_rueda_serie.json)).
- [CALC] sobre la serie: cociente de distancia restante 0,90–0,91 por frame ("≈ lerp 0,1"); 95 % del recorrido 483 ms después del primer movimiento registrado; últimos cambios de 1 px hasta ~1,1 s. El instante de inicio depende de la latencia de la herramienta de scroll **[EST]**. Que el valor configurado sea exactamente `lerp: 0.1` es una **inferencia**, no se leyó la configuración.
- [OBS] capturas inicio/intermedio/final. El desfase de −8 px de la imagen final se atribuye a la barra de scroll: **hipótesis no comprobada**.
- [CALC] retardo de un frame entre scrollY y la escala (la escala de cada frame corresponde al scrollY del frame anterior en la serie).
