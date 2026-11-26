---
id: LEGAL-001
titulo: Cookies y consentimiento en España/UE — requisitos de la Guía de la AEPD (2024) traducidos a decisiones de implementación
categoria: security
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (AEPD, "Guía sobre el uso de las cookies", actualizada mayo 2024)
versiones: normativa citada por la guía — art. 22.2 LSSI, RGPD, LOPDGDD; Directrices 05/2020 y Dictamen 8/2024 del CEPD
perfil: comercial
ultima_revision: 2026-10-27
---

# LEGAL-001 · Cookies y consentimiento

> **Aviso:** resumen técnico de una guía oficial para orientar la implementación. **No es asesoramiento jurídico.** Cada proyecto debe revisarlo con el responsable legal del cliente, y la normativa y los criterios de la autoridad pueden cambiar.

1. **Finalidad.** Que el banner de cookies y la carga de scripts de terceros de una web española cumplan los criterios publicados por la AEPD.
2. **Fuente.** https://www.aepd.es/guias/guia-cookies.pdf (portada: actualizada en mayo de 2024; apartados citados abajo). La nota de prensa de la AEPD no se pudo leer (la web devolvió un script de protección).
3. **Base legal [guía, Introducción y apdo. 1].** Art. 22.2 LSSI interpretado con RGPD y LOPDGDD: consentimiento tras información clara y completa.
4. **Exentas de consentimiento [apdo. 1].** Las que solo permiten la comunicación o son estrictamente necesarias para un servicio pedido expresamente: entrada de usuario, autenticación (de sesión), seguridad, personalización de interfaz elegida por el usuario. Se recomienda informar de ellas de forma genérica. Una cookie con varias finalidades, si alguna no está exenta, requiere consentimiento salvo que puedan tratarse por separado. Medición de audiencia: exención condicionada → ANALYTICS-001.
5. **Primera capa [apdo. 3.1.2.2].** Identificar al editor; finalidades; propias o de terceros; aviso genérico de perfilado si lo hay; cómo **aceptar, configurar o rechazar**; enlace visible a la segunda capa. Se muestra **antes** de usar cookies y hasta que el usuario decide. Nada premarcado a favor de aceptar.
6. **Rechazar [apdos. 3.1.2.2 y 3.2.3].** La opción de rechazo **en la misma capa y al mismo nivel**; si hay botón "Aceptar", debe haber botón "Rechazar"; el contraste/diseño no puede inducir a error.
7. **Acción afirmativa [apdo. 3.2.1].** Seguir navegando, abrir la segunda capa o gestionar preferencias **no** es consentimiento. Separado de la aceptación de condiciones o de la política de privacidad.
8. **Retirada [apdo. 3.2.9 y 3.2.3.f].** En cualquier momento y tan fácil como darlo; acceso permanente al panel; la configuración del navegador no basta como único mecanismo.
9. **Duración de la elección [apdos. 3.2.7–3.2.8].** Buena práctica: validez del consentimiento no superior a **24 meses** y no volver a preguntar en cada visita; volver a pedirlo si cambian finalidades o terceros.
10. **Muros de cookies [apdo. 3.2.10].** No admisibles sin alternativa; denegar acceso solo si se informa y hay alternativa equivalente (que puede no ser gratuita y debe ofrecerla el propio editor). Para grandes plataformas, el Dictamen 8/2024 del CEPD desaconseja el "consentir o pagar" binario.
11. **Responsabilidades [apdos. 4.1–4.2].** Con finalidades no exentas, editor y terceros responden de la información; contratos que regulen obtención y revocación; posible corresponsabilidad (art. 26 RGPD).
12. **Implementación técnica [traducción propia, no probada].**
    1. **Bloqueo previo:** ningún script no exento (analítica no exenta, píxeles, vídeos incrustados con cookies, mapas) se carga hasta la aceptación; usar `type="text/plain" data-category="…"` o carga dinámica tras el consentimiento.
    2. Banner = componente accesible (A11Y-004): botones `<button>` "Aceptar", "Rechazar", "Configurar" con el mismo tamaño y peso visual (UI-002 aplicado al revés: aquí **no** debe haber CTA dominante).
    3. Guardar la elección con fecha y versión de la política; caducar a los 24 meses; re-preguntar si cambia la lista de terceros.
    4. Enlace permanente "Configurar cookies" (pie de página).
    5. Alternativas sin cookies: vídeo con portada estática y carga al pulsar (p. ej. modo de privacidad del proveedor), mapa como imagen + enlace "Cómo llegar" (SEO-003).
    6. Probar con Playwright que antes de aceptar no hay peticiones a dominios de terceros no exentos (TEST-001, `page.on('request')`).
13. **Aplicaciones.** Todas las webs de clientes en España/UE.
14. **Pruebas.** Primera carga sin cookies no exentas (DevTools → Application/Network); rechazar es tan fácil como aceptar; retirada desde el pie; caducidad.
15. **Estado.** Guía oficial leída (resumen; el texto se cortó al final del apdo. 4.2); implementación no probada.
