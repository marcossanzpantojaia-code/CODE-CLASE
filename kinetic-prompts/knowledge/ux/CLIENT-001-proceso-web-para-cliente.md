---
id: CLIENT-001
titulo: Proceso de una web para un cliente — propósito, objetivos medibles, especificación y entrega verificable (Flux Academy + desarrollo dirigido por especificación)
categoria: ux
estado: PROPUESTO (síntesis; no probada en un proyecto real)
evidencia: ARTICULO_AUTOR_ANALIZADO (Flux Academy, Monica Galvan, sin fecha; Carlos Azaustre, 11-05-2026) + síntesis de fichas
versiones: —
perfil: comercial
ultima_revision: 2026-10-26
---

# CLIENT-001 · De la reunión con el cliente a la entrega

1. **Finalidad.** Que Claude Code no empiece por los efectos: primero propósito y métricas, luego especificación, luego construcción por tareas verificables.
2. **Fuentes.** Flux Academy, "What Is the Purpose of Your Website?" (Monica Galvan): https://www.flux-academy.com/blog/what-is-the-purpose-of-your-website . Carlos Azaustre, "Del Vibe Coding al Spec Driven Development": https://carlosazaustre.es/blog/spec-driven-development-agentes-ia . Flux Academy vende cursos (Webflow Masterclass, de pago); sus vídeos no se han visto.
3. **Propósito y objetivos [Flux].** Un propósito principal: **notoriedad**, **venta/conversión** o **información**; preguntarlo en la fase de descubrimiento, antes de diseñar; puede cambiar con el negocio. Traducirlo a metas con plazo (tráfico orgánico/pago/email, interacción, altas a la lista). Web de negocio = notoriedad + ventas, con contenido encontrable o anuncios que llevan a páginas de aterrizaje centradas en la conversión; mostrar servicios, premios, trabajos, testimonios y detalle de la oferta. El artículo **no** da maquetas ni cifras de conversión.
4. **Especificación antes que código [Azaustre].** La especificación es la fuente de verdad y el código un derivado. Patrón de prompt **CRISP** (Contexto, Rol, Instrucciones, Especificaciones, criterios de terminado); el agente propone un plan en modo plan sin tocar nada; el humano lo aprueba; se divide en tareas atómicas con criterio de aceptación; se implementa tarea a tarea con *hooks* que impiden saltarse validaciones (p. ej. linter) y revisión de diffs. Contexto permanente: archivo de proyecto (stack, convenciones, prohibiciones), skills cargadas bajo demanda, memoria que se consolida. Riesgos del "vibe coding": aceptar código sin entenderlo, replicar malas configuraciones (cita el caso de 170 de 1 645 apps de Lovable que filtraban datos por una configuración de Supabase — dato del autor, no verificado), deuda técnica, prompts vagos, permisos excesivos, degradación del contexto.
5. **Procedimiento de la biblioteca [síntesis; propuesta].**
   1. **Descubrimiento:** propósito (§3), público, acción principal (reservar, llamar, pedir presupuesto), NAP y horarios (SEO-003), contenido real disponible (fotos, reseñas verificables — HERO-001).
   2. **Especificación (spec):** páginas y secciones (UX-002), tokens de marca (DS-001, TYPE-002, UI-002), perfil A/B (ARCH-001 §1), presupuestos de rendimiento (PERF-001), requisitos legales del país (cookies/RGPD: **sin ficha todavía**).
   3. **Plan y tareas:** cada tarea con criterio de aceptación comprobable (Playwright, Lighthouse, a11y).
   4. **Construcción:** stack (ASTRO-001/002/003 o NEXT-001/002/003), formularios seguros (SEC-002, NEXT-002, T3-001).
   5. **Entrega:** DEPLOY-001 + A11Y-005 + TEST-001; informe con métricas iniciales para comparar con los objetivos de §3.
6. **Límites.** El artículo de Flux es introductorio y general; el de Azaustre está pensado para agentes de IA en general. Esta ficha **no integra** la biblioteca con Claude Code (restricción vigente): solo describe el proceso.
7–14. **Pruebas.** Revisar que cada sección de la web responde a un objetivo de §3; que cada tarea tiene su prueba.
15. **Estado.** Síntesis propuesta; no aplicada.
