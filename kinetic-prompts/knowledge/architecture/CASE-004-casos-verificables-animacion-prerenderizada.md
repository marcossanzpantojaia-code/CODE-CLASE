---
id: CASE-004
titulo: Casos verificables de animación prerenderizada en webs reales (OPTIKKA de Zajno; AirPods Pro 3 de Apple) y clasificación obligatoria de toda referencia en demo funcional, vídeo conceptual o diseño generado con IA
categoria: architecture
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Awwwards, caso OPTIKKA) + DEMO_INSPECCIONADA (optikka.com y apple.com/airpods-pro: DOM y red en el navegador del usuario el 2026-10-27; panel oculto, sin observación visual) + VIDEO_INSPECCIONADO (CASE-003, como contraste)
versiones: —
perfil: cinematografico
ultima_revision: 2026-10-27
---

# CASE-004 · Casos reales verificables y clasificación de referencias

1. **Finalidad.** No confundir referencias. Los reels de Enky (CASE-003) pueden ser **vídeos conceptuales generados con IA**. OPTIKKA y Apple son **webs públicas que funcionan** y en las que se ha podido comprobar la técnica.
2. **Fuentes.** Awwwards (07-08-2025) sobre OPTIKKA; inspección de optikka.com y apple.com/airpods-pro (2026-10-27).
3. **Clasificación obligatoria de toda referencia (lote 21).**
   | Clase | Definición | Qué se puede aprender | Ejemplo |
   |---|---|---|---|
   | **R1 · Demo funcional verificada** | web pública inspeccionada (DOM, red o código) | técnica **y** dirección de arte | optikka.com, apple.com/airpods-pro |
   | **R2 · Caso documentado por su autor** | artículo, caso de estudio o repositorio, sin inspección propia | técnica declarada (puede estar simplificada) | artículo de Awwwards sobre OPTIKKA |
   | **R3 · Vídeo conceptual** | vídeo, reel o maqueta sin web comprobable | composición y movimiento **deseados** | reels de Enky |
   | **R4 · Diseño generado con IA** | marcado como IA o con señales (texto incoherente) | solo dirección de arte orientativa | reels de Enky (etiqueta de Instagram) |

   Una referencia R3/R4 **no** sirve para afirmar que algo es viable en web. La viabilidad se demuestra con R1/R2 o con un prototipo propio.
4. **OPTIKKA (Zajno) — R1 + R2.**
   - **Técnica:** WebP en canvas tras descartar el vídeo; juegos por dispositivo; carga escalonada y direccional (SEQ-002 §5).
   - **Inspección [MED]:**
     - `canvas.sequence-canvas` dentro de un contenedor fijo;
     - 224 fotogramas `/mobile/frame_NNN.webp` ≈ 3,35 MB pedidos al recorrer la página;
     - no se encontró la clase `lenis` en `<html>`, aunque el artículo la declara: puede usar otra forma de iniciarla [no concluyente].
   - **Dirección de arte (artículo):** metáforas visuales de capas que se funden y vista cenital; paleta cálida "sand" con acentos coral.
5. **Apple AirPods Pro 3 — R1.** Componente `VideoScrub` con:
   - vídeo **con alfa**;
   - tramos de progreso por punto de corte, anclados a un `.sticky-container`;
   - sustitución de recursos por punto de corte;
   - `role="img"` con `aria-label` en el contenedor y `aria-hidden` en el vídeo.

   No hay canvas. Los vídeos se cargan bajo demanda (SEQ-002 §5).
6. **Limitación de la inspección.** El panel del navegador estaba **oculto** (ventana de 0 × 0): no se vio ni se grabó la animación, y la elección de recursos pudo verse afectada (OPTIKKA cargó el juego móvil). Hace falta repetirla con el panel visible para C1/C2.
7. **Lecciones para "El ritual".**
   - (a) La secuencia WebP es una solución **probada en producción** para una web de agencia en Astro + GSAP.
   - (b) Apple demuestra el vídeo con alfa en producción a gran escala.
   - (c) Las dos separan los recursos por dispositivo.
   - (d) Las dos marcan el medio como decorativo y le dan una descripción accesible.
8. **Parámetros.** ≈ 15 KB por fotograma WebP en móvil (OPTIKKA) [MED].
9. **Código.** No se ha copiado código de terceros.
10. **Problemas.** Atribuir técnicas a una referencia R3/R4; medir con el panel oculto.
11. **Rendimiento / a11y.** Ver el §7(d).
12. **Compatibilidad.** —
13. **Aplicaciones.** Elegir referencias para el storyboard: al menos 1 de clase R1 por técnica clave.
14. **Pruebas.** Repetir la inspección con el panel visible a 1 440 y 375 px y grabar vídeo (EVAL-001, C2).
15. **Estado.** Dos webs inspeccionadas en el DOM y la red; sin observación visual.
