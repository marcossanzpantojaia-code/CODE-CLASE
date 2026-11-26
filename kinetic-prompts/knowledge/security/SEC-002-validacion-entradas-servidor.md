---
id: SEC-002
titulo: Validación de entradas en el servidor (complemento de FORM-001)
categoria: security
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (OWASP Input Validation Cheat Sheet)
versiones: n/a
perfil: comercial
ultima_revision: 2026-10-26
---

# SEC-002 · Validación en servidor

1. **Finalidad.** Que el formulario de reserva/contacto (FORM-001) no sea una puerta de entrada de ataques.
2. **Fuente.** cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html.
3. **Principios (OWASP).** Validar **en el servidor** (el cliente solo mejora la experiencia); **listas de permitidos**, no de prohibidos; validar sintaxis (tipo, formato) **y** semántica (p. ej. fecha de fin posterior a la de inicio, coherencia entre campos); limitar tamaño y profundidad **antes** de parsear y decodificar una sola vez; rechazar peticiones inválidas sin seguir con datos a medias y enlazar solo los campos previstos (evitar *mass assignment*); regex anclada a todo el valor, con longitud acotada antes de evaluarla y sin patrones con retroceso excesivo (ReDoS); HTML enriquecido → saneador mantenido, no regex; subidas de archivos: no fiarse del nombre ni del tipo declarado, comprobar contenido y tamaño; email: validar formato con librería mantenida y **verificar** la propiedad aparte; validar también datos de fuentes internas; la validación **no sustituye** a consultas parametrizadas, codificación de salida contra XSS ni autorización.
4. **Aplicación (propuesta).** En Next.js, Server Actions o route handlers que validen con un esquema (librería de esquemas a elección del proyecto; no evaluada aquí), límite de longitud por campo, normalización del teléfono, respuesta de error genérica y registro sin datos personales; protección anti-spam (campo trampa, límite de frecuencia) — pendiente de fuente oficial.
5–9. n/a (principios).
10. **Errores habituales.** Confiar en `required`/`pattern` del HTML; regex sin anclar; mensajes de error que revelan la estructura interna.
11–14. Ver FORM-001.
15. **Estado de evidencia.** Cheat sheet leído (resumen). §4 = propuesta.
