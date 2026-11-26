---
id: A11Y-007
titulo: Carrusel accesible (patrón APG del W3C) — controles obligatorios, autorrotación que se detiene con foco y hover, roles y regiones vivas; aplicado a galerías, testimonios y sliders cinematográficos
categoria: accessibility
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (W3C WAI-ARIA Authoring Practices, "Carousel Pattern")
versiones: WAI-ARIA APG (consultado el 2026-10-27)
perfil: ambos
ultima_revision: 2026-10-27
---

# A11Y-007 · Carrusel accesible

1. **Nombre y finalidad.** Cualquier carrusel (testimonios de UX-002/HERO-001, galería de cortes, slider de DRAG-001, baraja HOV-006, slider 3D) debe poder usarse con teclado y lector y no moverse solo sin control.
2. **Fuente.** https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ .
3. **Ubicación.** Funciones, interacción de teclado, roles/estados/propiedades, variantes con pestañas y agrupada; ejemplos "Auto-Rotating Image Carousel with Buttons/Tabs for Slide Control".
4. **Resultado.** Carrusel con anterior/siguiente, botón de rotación y anuncios correctos.
5. **Requisitos [APG].**
   - **Controles:** anterior y siguiente (obligatorios); botón de **iniciar/detener rotación** si rota solo; selector de diapositiva opcional (pestañas o botones).
   - **Autorrotación:** se **detiene al entrar el foco de teclado** y **no se reanuda** salvo que el usuario lo pida; se detiene mientras el ratón está encima; el botón de rotación es el **primer** elemento tabulable del carrusel.
   - **Teclado:** Tab/Shift+Tab por los controles sin script especial; activar anterior/siguiente/rotación **no mueve el foco** (se puede pulsar repetidamente).
   - **ARIA básico:** contenedor `region` o `group` con `aria-roledescription="carousel"` y nombre (`aria-labelledby`/`aria-label`, **sin** la palabra "carrusel"); cada diapositiva `role="group"` + `aria-roledescription="slide"` + nombre (o "3 de 10"); botón de rotación nativo cuyo **texto cambia** ("Detener rotación"/"Iniciar rotación"), **sin** `aria-pressed`; contenedor de diapositivas con `aria-atomic="false"` y `aria-live="off"` mientras rota / `"polite"` cuando está parado.
   - **Variante pestañas:** diapositivas `tabpanel` (sin `aria-roledescription`), selectores `tab` en un `tablist` con `aria-label`.
   - **Variante agrupada:** botones selectores en un `group`; el actual con `aria-disabled="true"` (no `disabled`, para que siga tabulable); la APG la considera la menos cómoda con teclado.
6. **Dependencias.** Ninguna; compatible con GSAP para la animación.
7. **Procedimiento (adaptación).**
   1. Preferir **no** autorrotar en webs comerciales; si rota, cumplir además WCAG 2.2.2 (pausa para movimiento automático > 5 s, A11Y-002).
   2. Con reduced motion: sin autorrotación y cambio de diapositiva por fundido o corte (A11Y-001).
   3. Si hay arrastre (Draggable, DRAG-001), los botones anterior/siguiente son la **alternativa de puntero simple** de WCAG 2.5.7 (A11Y-006).
   4. Diapositivas ocultas fuera del orden de tabulación (`inert` en las no visibles) [criterio propio; la APG no lo detalla en el resumen leído].
   5. Objetivos ≥ 24×24 px (A11Y-003).
8. **Parámetros.** Intervalo de rotación (≥ 5 s [EST]), variante (botones/pestañas).
9. **Código (adaptación propuesta; no ejecutada):**
   ```html
   <section aria-roledescription="carousel" aria-label="Opiniones de clientes">
     <button type="button" class="rot">Detener rotación</button>
     <button type="button" aria-label="Opinión anterior">‹</button><button type="button" aria-label="Opinión siguiente">›</button>
     <div aria-live="off" aria-atomic="false">
       <div role="group" aria-roledescription="slide" aria-label="1 de 5">…</div>
     </div>
   </section>
   ```
10. **Problemas habituales.** Rotación sin botón de pausa; rotación que se reanuda sola al quitar el foco; `aria-live="polite"` mientras rota (anuncios continuos); diapositivas ocultas pero tabulables; puntos de navegación diminutos; solo gestos de arrastre.
11. **Rendimiento / a11y.** Pausar también la rotación cuando la pestaña no es visible (`visibilitychange`) [criterio propio].
12. **Compatibilidad.** ARIA universal; `aria-roledescription` bien soportado en lectores modernos (verificar con NVDA/VoiceOver).
13. **Aplicaciones.** Testimonios, galería de trabajos, equipo, promociones de temporada.
14. **Pruebas.** Solo teclado: entrar con Tab (debe parar); lector: anuncia "carrusel" y "diapositiva 1 de 5"; ratón encima (para); reduced motion; móvil (botones visibles).
15. **Estado.** Patrón oficial leído (resumen); no implementado.
