---
id: FORM-001
titulo: Formularios y validación accesible (HTML nativo, :user-invalid, mensajes y servidor)
categoria: frontend
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (web.dev Learn Forms: "Validation")
versiones: HTML/CSS vigentes
perfil: comercial (conversión)
ultima_revision: 2026-10-27
---

# FORM-001 · Formularios

1. **Finalidad.** Formularios de contacto/reserva que convierten, son accesibles y seguros — el corazón de una web de negocio.
2. **Fuente.** web.dev/learn/forms/validation.
3. **Reglas (docs).**
   - **Validación nativa primero:** `required`, `type` (email, tel, url…), `minlength`/`maxlength`, `min`/`max`, `pattern` (p. ej. `pattern="[a-z]{2,20}"`).
   - **Explicar las reglas antes de enviar:** texto de ayuda enlazado con `aria-describedby`.
   - **Estilos de estado:** `:required`, `:valid`, `:invalid`; preferir **`:user-invalid`** (solo tras interactuar) a `:invalid` (se aplica antes de tocar el campo). **No depender solo del color**: añadir texto o icono (daltonismo rojo-verde).
   - **Mensajes coherentes:** Constraint Validation API, `setCustomValidity()` en el evento `invalid`; validar en `blur` para respuesta temprana.
   - **Validar siempre en el servidor** antes de guardar o compartir datos.
4. **No cubierto por la página:** `aria-invalid`, `novalidate`, prevención de spam, envío y estados de carga/éxito → pendientes (OWASP/MDN en un lote posterior).
5–7. **Procedimiento para Claude Code.** `<label>` visible para cada campo; `autocomplete` adecuado (name, email, tel); ayuda con `aria-describedby`; errores con texto bajo el campo y `:user-invalid`; resumen de errores enfocable al enviar; estado de envío (botón deshabilitado + texto "Enviando…"); confirmación clara; validación y saneado en servidor; protección anti-spam sin CAPTCHA intrusivo cuando sea posible.
8. **Parámetros.** Reglas por campo.
9. **Código (patrón de atributos):** `<input id="tel" name="tel" type="tel" autocomplete="tel" required aria-describedby="tel-ayuda">` (propuesta).
10. **Errores habituales.** Placeholder como etiqueta; errores solo en rojo; validar solo en cliente; mensajes distintos por navegador.
11. **Accesibilidad.** Etiquetas, descripción, foco tras error; no animar los errores en exceso (UX-001).
12. **Compatibilidad.** `:user-invalid` en navegadores actuales (verificar soporte en MDN).
13. **Aplicaciones.** Reserva de cita (barbería, clínica), contacto (despacho), presupuesto.
14. **Pruebas.** Teclado completo, lector de pantalla, envío con errores, JS desactivado (validación nativa sigue), servidor rechazando datos inválidos.
15. **Estado de evidencia.** Docs leídas (resumen). §5–7 incluye propuestas propias marcadas como tales.

**Lote 10:** patrón oficial vigente de Next.js para validación en servidor, errores por campo y estado de envío (`useActionState`) → [NEXT-003](../architecture/NEXT-003-decisiones-de-arquitectura-jack-herrington.md) (sección lote 10); errores frecuentes en código de curso → [NEXT-002](../architecture/NEXT-002-app-router-proyecto-completo-y-errores.md).

## Lote 12 — usabilidad de formularios (NN/g) — `ARTICULO_AUTOR_ANALIZADO`
Fuente: Kathryn Whitenton, "Website Forms Usability: Top 10 Recommendations", NN/g, 01-05-2016 (https://www.nngroup.com/articles/web-form-design/).
- Etiqueta junto al campo, idealmente **encima** (móvil y formularios cortos), asociada para lectores.
- **Una columna** (salvo campos cortos relacionados: ciudad/CP).
- Agrupar campos relacionados y separar temas en secciones (también para lectores: `fieldset`/`legend` [técnica general]).
- Eliminar campos opcionales; si quedan 1–2, marcarlos como "opcional".
- **No usar el *placeholder* como etiqueta.**
- Radios en lugar de desplegable con 2–3 opciones; ancho del campo acorde a lo esperado.
- Errores: no solo color (borde + texto + peso), mensaje concreto, **conservar lo escrito**.
- Sin botones "Borrar/Restablecer"; "Cancelar" menos visible que el principal.
- No trata el momento de la validación en línea.
- Relación: WCAG 2.2 3.3.7 entrada redundante (A11Y-006); estados (UX-003); servidor (SEC-002, SEC-003).

**Lote 18 (prototipo n.º 1, [MED] con Playwright + Chromium 153):** en `<input type="date">`, Chromium añade paradas de tabulación internas (día, mes, año y selector de calendario); la del **selector de calendario no mostró indicador de foco** con los estilos del prototipo. Comprobar el foco de los campos nativos de fecha/hora en cada navegador; si falla, valorar un selector propio accesible o estilos específicos del navegador [criterio propio, sin probar]. El formato visible depende del idioma del navegador (`mm/dd/yyyy` en el Chromium de pruebas, aunque la página es `lang="es"`).
