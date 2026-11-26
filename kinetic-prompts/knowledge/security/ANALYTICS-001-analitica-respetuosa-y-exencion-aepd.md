---
id: ANALYTICS-001
titulo: Analítica respetuosa con la privacidad — condiciones de la AEPD para medir audiencia sin consentimiento y cómo configurarlo
categoria: security
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (AEPD, "Guía: Uso de cookies para herramientas de medición de audiencia", enero 2024)
versiones: —
perfil: comercial
ultima_revision: 2026-10-27
---

# ANALYTICS-001 · Medición de audiencia

> **Aviso:** orientación técnica basada en una guía oficial; **no es asesoramiento jurídico**. La decisión final corresponde al responsable del tratamiento del cliente.

1. **Finalidad.** Medir visitas y conversiones de la web de un negocio sin mostrar banner para la analítica, **solo si** se cumplen todas las condiciones; si no, tratarla como cookie que requiere consentimiento (LEGAL-001).
2. **Fuente.** https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf (versión de enero de 2024). La guía **no nombra herramientas** concretas.
3. **Condiciones de exención [guía].**
   - Finalidad **limitada a medir la audiencia** del sitio, solo por cuenta del editor, para producir **estadísticas anónimas**.
   - Datos **no cruzados** con otros tratamientos ni cedidos a terceros.
   - **Sin seguimiento entre sitios** (nada de un mismo identificador en varias webs, p. ej. cookies de dominio de terceros).
   - Proveedores que declaren reutilizar los datos para otros fines **quedan fuera**.
   - Si un proveedor trata los datos, actúa como **encargado del tratamiento** (contrato art. 28 RGPD que prohíba reutilizar, con garantías para varios editores: datos y cookies independientes por editor).
   - Transferencias fuera de la UE: deben cumplir el RGPD (no se prohíben, se condicionan).
   - Evaluar y **documentar** que la herramienta puede configurarse y **está configurada** así.
4. **Qué se considera estrictamente necesario [guía].** Audiencia por página, página de referencia, tipo de dispositivo/navegador/resolución, tiempos de carga, tiempo por página, rebote, profundidad de desplazamiento, acciones del usuario y zona geográfica; agregadas por día u hora. Todo lo demás → consentimiento.
5. **Garantías del editor [guía].** Informar (p. ej. en la política de privacidad); vida de las cookies **≤ 13 meses sin renovación automática** en nuevas visitas; conservar la información **≤ 25 meses**; revisar periódicamente.
6. **Implementación [propuesta propia, no probada].**
   1. Herramienta de analítica autoalojada o con contrato de encargado en la UE, configurada sin compartir datos ni identificadores entre sitios, con IP truncada/anonimizada y sin funciones de publicidad o remarketing.
   2. Preferir analítica **sin cookies** cuando cubra las necesidades (menos superficie normativa).
   3. Eventos de conversión del negocio (pulsar "Llamar", "Reservar", envío del formulario) como acciones de usuario agregadas.
   4. Documento interno de la configuración (§3 último punto) entregado al cliente.
   5. Cualquier integración con publicidad (píxeles, audiencias) → fuera de la exención → banner (LEGAL-001).
7. **Rendimiento.** Script de analítica ligero, `defer`, sin bloquear el LCP; medir Core Web Vitals de campo (`useReportWebVitals` en Next.js — DEPLOY-001) con la misma herramienta si cumple las condiciones.
8–13. **Aplicaciones.** Barbería/clínica/despacho que quiere saber cuántas reservas llegan desde la web.
14. **Pruebas.** Revisar cookies creadas (nombre, dominio, caducidad ≤ 13 meses); peticiones a terceros; que no hay identificadores compartidos con otros dominios.
15. **Estado.** Guía oficial leída; implementación no probada.
