---
id: INTEG-001
titulo: Integración y acabado cinematográfico de recursos 2D en la web — igualar el elemento a la escena, sombra derivada de la silueta, capas de sombreado y luz rebotada, luz motivada, profundidad con partículas y bokeh, respiro de foco, grano, viñeta y gate weave; qué se hornea, qué va en tiempo real y cuánto cuesta
categoria: frontend
estado: IMPLEMENTADO
evidencia: TRANSCRIPCION_ANALIZADA + VIDEO_INSPECCIONADO (Ben Marriott rdi0bPWqYyI "Advanced Lighting"; SonduckFilm JHeMJ_l2iNA) + TRANSCRIPCION_ANALIZADA (Marriott a7Nyzqy9_I0, l_-c5QDpYY0; SonduckFilm 2bi5YcnOGkA) + DEMO_INSPECCIONADA propia (microprueba ROSSO/CREMA del lote 32: evidence/demos/2026-11-04-lote32/)
versiones: Canvas 2D, CSS, GSAP 3.15.0 (reloj), Pillow 12.3 (horneado)
perfil: cinematografico
ultima_revision: 2026-11-04
---

# INTEG-001 · Integración y acabado cinematográfico de recursos 2D

**Estado:**
- **IMPLEMENTADO (mecánica y coste medidos)** con fixtures en una microprueba.
- **C1 y C3 sin evaluar:** los fixtures no permiten juzgar si el elemento "pertenece" a la escena.
- No sustituye a COMP-001 (iluminar y fotografiar el producto) ni a AIIMG-001 (preparar y recortar recursos). Cubre lo que se hace **después**: componer el elemento con la escena para que parezca rodado junto a ella.

## 1. Resultado esperado
Un protagonista generado por separado parece **filmado con la misma cámara, luz y película** que su entorno:
- mismo color y contraste;
- sombra y sombreado coherentes con la fuente de luz;
- grano común;
- profundidad con partículas desenfocadas por delante y por detrás.

## 2. Procedimiento (fuente → web)
| # | Técnica | Fuente (vídeo, timestamp) | Web | ¿Hornear? |
|---|---|---|---|---|
| 1 | **Igualar el elemento a la escena, no al revés:** desaturar (−12), oscurecer (−10) y corregir el tinte (menos azul en altas) | Marriott rdi0bPWqYyI 0:35–2:53 | `grado32.py`: aplicado **a cada recurso** antes de publicar | **Sí** |
| 2 | **Grado común** para todo: curvas (más rojo en altas, más azul en sombras) | rdi0bPWqYyI 17:10–23:30; Sonduck JHeMJ_l2iNA 7:28 | Las mismas curvas horneadas en **todas** las capas; nunca `filter` por fotograma (AIIMG-001) | **Sí** |
| 3 | **Sombra = la silueta del propio elemento**, aplanada, oscurecida con un color de la escena, desplazada en contra de la luz, desvanecida con la distancia y desenfocada | rdi0bPWqYyI 5:03–7:51 | `escena32.js`, `sombra()`: silueta prerenderizada con 2 desenfoques (6 y 28 px, a **media resolución**); al acercarse se cruza de la suave a la dura y el desplazamiento baja a 0 | Silueta: sí. Posición: tiempo real |
| 4 | **Capas de sombreado:** sombreado inferior con pluma grande (~45 %) y brillo de la luz principal | rdi0bPWqYyI 8:05–11:03 | Pintado una vez sobre el sprite con `source-atop` | Sí |
| 5 | **Luz rebotada** desde la superficie (cálida, borde inferior, ~35 %) | rdi0bPWqYyI 11:09–12:09 | Sprite aparte cuya opacidad = cercanía a la superficie | Sprite: sí. Opacidad: tiempo real |
| 6 | **Que no asome un borde claro** bajo el sombreado | rdi0bPWqYyI 12:24 (Simple Choker 0,8) | La máscara del sombreado no sale del sprite (`source-atop`) | — |
| 7 | **Nunca sombra sobre sombra** | rdi0bPWqYyI 15:11 | Una sola capa de sombreado por zona | — |
| 8 | **Luz motivada:** el fondo se ilumina donde está la luz (degradado radial centrado en ella) y el contraste viene de la luz principal | Sonduck JHeMJ_l2iNA 1:18–2:34 | `radial-gradient` **fuera** del contenedor que hace el push-in | No (CSS estático) |
| 9 | **Profundidad intencionada + partículas que la cámara atraviesa** | JHeMJ_l2iNA 4:53–6:17 | `atmosfera32.js`, ver §6 | Discos de bokeh: sí |
| 10 | **Bokeh** de lente (hexagonal), no gaussiano | rdi0bPWqYyI 24:33–25:49; JHeMJ_l2iNA 7:42–8:20 | Discos hexagonales prerenderizados a 5 radios | Sí |
| 11 | **Respiro de foco** 0 → 4 px → 0 al aterrizar | rdi0bPWqYyI 26:04–26:41 | Solo en lo que está **fuera del plano de foco** (partículas). Ver la corrección en §8 | — |
| 12 | **Grano** monocromo, ~4 % (Marriott) / 12 % (Sonduck, sobre fondos oscuros) | rdi0bPWqYyI 3:23–4:53; JHeMJ_l2iNA 6:43 | Lienzo con 4 teselas de ruido que rotan a 24 fps, opacidad 0,045 | Teselas: sí |
| 13 | **Viñeta** centrada en la luz, ~75 % | rdi0bPWqYyI 19:33; JHeMJ_l2iNA 7:17 | `radial-gradient` fijo | No |
| 14 | **Gate weave:** wiggle(12 Hz, 3 px) + escala 101 % | a7Nyzqy9_I0 4:55 | Opcional: `transform` del contenedor con ruido de 12 Hz. **No probado** | — |
| 15 | **Tensión antes del impacto:** temblor que crece justo antes | a7Nyzqy9_I0 7:04 | Opcional, con reduced motion desactivado. **No probado** | — |
| 16 | **Rayos de luz:** máscara del elemento + desenfoque radial desde la fuente, en overlay | l_-c5QDpYY0 5:39; JHeMJ_l2iNA 6:52 | Prerenderizado (no hay desenfoque radial barato en el navegador) | Sí |

## 3. Recursos necesarios
- Los del contrato (protagonista recortado y superficie).
- **Nada nuevo** para los puntos 3–7: se derivan del propio recurso.
- Para el punto 16 o una profundidad real: una pasada de rayos o un mapa de profundidad generado aparte (opcional).

## 4. Parámetros
| Parámetro | Valor |
|---|---|
| Match del protagonista | sat −12 %, luminosidad −10 % (ajustar con los recursos reales) |
| Sombra | opacidad máx. 0,5; desplazamiento = altura × 0,35 en contra de la luz; aplanado 0,28 |
| Sombreado inferior | 45 % |
| Luz rebotada | 35 % × cercanía |
| Grano | opacidad 0,045, 24 fps |
| Viñeta | 0,42 de oscuro en el borde (fondo claro) o 0,55 (fondo oscuro) |
| Partículas | 70; profundidad z de 0,35 a 2,95; foco en z = 1; radio = 2,2/z + 9·\|1/z − 1\| + respiro |

## 5. Herramientas
- Pillow (horneado del grado y de los desenfoques).
- Canvas 2D (sprite, sombra, partículas, grano).
- CSS (luz motivada y viñeta).
- GSAP como reloj.
- **Nada de three.js.**

## 6. Implementación
- **Partículas** en dos lienzos:
  - **detrás** del plato (z ≥ 0,8);
  - **delante** de todo (z < 0,8: grandes y desenfocadas).
- **Paralaje:** posición escalada por `cam^(1/z)` en el push-in.
- **Deriva:** sube a 0,018/z del alto por segundo.
- **Brillo:** proporcional a la distancia a la luz (luz motivada).
- **Lienzo de partículas a MEDIA resolución:** el bokeh no tiene detalle que perder.

## 7. Coste medido
Fuente: `evidence/demos/2026-11-04-lote32/coste/`. Reproducción de 2,5 s, Chromium sin GPU.

**Fase 1: aislar el coste**

| Configuración (1 280, CPU × 1) | Fotogramas > 33 ms | Intervalo p50 |
|---|---|---|
| Lote 31 (sin capas nuevas) | 1 | 16,7 ms |
| Lote 32, primera versión | 26–31 | **33,4 ms** |
| … sin partículas | 15 | 16,7 ms |
| … sin desenfoque de movimiento | 14–26 | 33,3 ms |

Causas: las partículas a resolución completa, el degradado de fondo **dentro** del contenedor que escala (se re-rasteriza en cada fotograma) y el motion blur sobre el lienzo completo (MBLUR-001, corregido en este lote).

**Fase 2: optimizaciones**
- recorte del sprite y rectángulo sucio en MBLUR-001;
- partículas y siluetas a media resolución;
- fondo fuera del contenedor;
- 110 → 70 partículas.

Resultado final (`coste32.json`, ejecución sin carga paralela):

| | Lote 31 | Lote 32 |
|---|---|---|
| 1 280, CPU × 1 | 1 fotograma > 33 ms, JS p95 5,3 ms | **2**, JS p95 5,1 ms |
| 375, CPU × 1 | 0 | **0** |
| 1 280, CPU × 4 | 2 | **14** |
| 375, CPU × 4 | 1 | **9** |

**En CPU lenta, el acabado completo no cabe.** Hace falta degradación adaptativa: sin partículas delanteras si dos fotogramas seguidos superan 33 ms. **Pendiente de implementar.**

La versión optimizada es visualmente idéntica a la primera: diferencia media ≤ 0,16 niveles por fotograma y p99,9 ≤ 2.

## 8. Problemas visuales (encontrados en la microprueba)
- **Desenfoque de foco incoherente: CORREGIDO.** Desenfocar solo el plato (con capas prerenderizadas) dejaba **nítidos los ingredientes del mismo plano** (fotograma 50, `descartado/`).
  - **Regla:** un cambio de foco afecta a **todas** las capas del mismo plano por igual.
  - Sin desenfoque de pantalla completa en tiempo real, el respiro queda limitado a lo que está fuera del plano de foco.
- **Partículas cálidas invisibles sobre fondo claro** (ROSSO). El efecto solo se lee sobre fondos oscuros (CREMA y R6 de CASE-003).
- Grano visible en el texto (aceptable a 0,045; revisar la legibilidad).
- Sombra que no sigue a la luz si cambia la dirección de la luz.

## 9. Pruebas
| Prueba | Criterio | Resultado (fixtures) |
|---|---|---|
| Mecánica sin cambios (`auditar31.py`) | relevo ≤ 2 px; 0 de doble imagen | Idéntica al lote 31 (0,7 px; 0) |
| Sombra coherente con la luz | desplazamiento ∝ altura, en contra de la luz; 0 en el contacto | 41,9 → 9,2 → 0,7 → 0 px; desplazada a la derecha con la luz arriba a la izquierda |
| Profundidad de las partículas | bokeh delantero > trasero; aumenta con el respiro | 15,3 frente a 5,2 px de media; 21,2 / 7,5 en el pico de foco |
| Coste (`medir32.mjs`) | CPU × 1: ≤ 2 fotogramas > 33 ms | 2 (1 280) y 0 (375) |
| C1 / C3 | revisión humana con recursos reales | **pendiente** |

## 10. Cómo pedirlo
"Integra el protagonista con INTEG-001:
- iguala el elemento a la escena horneando el grado en todos los recursos;
- sombra a partir de la silueta, en contra de la luz, que se afila al acercarse;
- sombreado inferior y luz rebotada;
- luz motivada y viñeta en CSS fijo;
- partículas con profundidad y bokeh prerenderizado (solo en fondos oscuros);
- respiro de foco solo fuera del plano;
- grano al 4 %;
- mide el coste con CPU × 1 y × 4, y degrada si no cabe."
