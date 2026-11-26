---
id: SEC-003
titulo: Seguridad de datos en Next.js — capa de acceso a datos (DAL), DTO mínimos, taint, qué protege Next.js en las Server Actions y lista de auditoría oficial
categoria: security
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (nextjs.org/docs/app/guides/data-security, act. 2026-10-06)
versiones: Next.js App Router (proxy.ts, Server Actions)
perfil: comercial (áreas privadas, reservas, paneles)
ultima_revision: 2026-10-27
---

# SEC-003 · Seguridad de datos en Next.js

1. **Finalidad.** Completar SEC-001/002 y NEXT-002/003 con el modelo oficial: dónde se leen los datos, qué se manda al cliente y cómo auditar un proyecto.
2. **Fuente.** https://nextjs.org/docs/app/guides/data-security .
3. **Tres enfoques (elegir uno, no mezclar) [doc].** APIs HTTP existentes (proyectos grandes; modelo *Zero Trust*); **Capa de acceso a datos (DAL)** para proyectos nuevos; acceso desde el componente solo para prototipos.
4. **DAL [doc].** Módulo interno que **solo corre en servidor** (`import 'server-only'`), **comprueba autorización** y devuelve **DTO mínimos** (solo los campos que la vista necesita, decididos por reglas de privacidad: p. ej. el teléfono solo si es admin o del mismo equipo). `getCurrentUser` envuelto en `cache()` de React para reutilizarlo en la misma petición. Solo la DAL lee `process.env` (secretos).
5. **Exposición accidental [doc].** Pasar un registro completo de BD a un Client Component lo expone entero; props de Client Components deben ser estrechas. `experimental.taint` + `experimental_taintObjectReference` / `experimental_taintUniqueValue` como capa extra (no sustituye filtrar en la DAL). Solo las variables `NEXT_PUBLIC_` llegan al cliente; funciones y clases no pueden pasarse a Client Components.
6. **Server Actions [doc].**
   - Son **alcanzables por POST directo** aunque no se importen en la UI → validar entrada, autenticar **y autorizar** (propiedad del recurso, contra IDOR) **dentro de cada acción**; la comprobación de la página no se extiende a sus acciones.
   - Protecciones propias de Next.js: IDs de acción cifrados y no deterministas (recalculados entre builds, caché máx. 14 días), eliminación de acciones no usadas, variables de cierre (*closures*) cifradas con una clave por build (no confiar solo en ello), solo `POST`, y **comparación `Origin` vs `Host`/`X-Forwarded-Host`** (si no coinciden se aborta); `serverActions.allowedOrigins` para proxies inversos; `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` si hay varios servidores.
   - Devolver solo lo que la UI necesita (`{ success: true }`, no el registro).
   - *Rate limiting* para operaciones caras (correo, escritura).
   - Nada de mutaciones como efecto del render (p. ej. cerrar sesión por `searchParams`): usar acciones.
7. **Lista de auditoría oficial [doc].** DAL aislada (BD y `process.env` no importados fuera); archivos `"use client"` con props demasiado amplias; archivos `"use server"`: validación de argumentos, re-autorización, propiedad del recurso, valores devueltos filtrados, acceso delegado a la DAL; carpetas `[param]` = entrada del usuario (validar); `proxy.ts` y `route.ts` con más poder → auditoría tradicional y pruebas de penetración periódicas.
8. **Encaje.** NEXT-002 §4 (hallazgos en código de curso) se corrige con §4–§6; RETRIEVAL_TESTS prueba 3 usa §7 como guion.
9. **Código (adaptación de la doc; no ejecutada):**
   ```ts
   // data/citas.ts
   import 'server-only'
   export async function cancelarCita(id: string) {
     const user = await getCurrentUser(); if (!user) throw new Error('Unauthorized')
     const cita = await db.cita.findUnique({ where: { id } })
     if (cita?.clienteId !== user.id) throw new Error('Forbidden')
     await db.cita.update({ where: { id }, data: { estado: 'cancelada' } })
   }
   ```
10–13. **Aplicaciones.** Área de clientes de una clínica (historial), reservas de barbería, panel de un despacho.
14. **Pruebas.** Invocar la acción por POST sin sesión y con otro usuario (debe fallar); revisar el HTML/RSC de la página buscando campos privados; build con imports de BD fuera de la DAL (lint o búsqueda).
15. **Estado.** Doc oficial leída; no implementado.
