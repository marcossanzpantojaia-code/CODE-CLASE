---
id: NEXT-002
titulo: Proyecto Next.js App Router completo (grupos de rutas, loading/error/not-found, Suspense, Server Actions) y los errores de seguridad que hay que evitar
categoria: architecture
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (The Net Ninja, `iamshaunjp/nextjs-masterclass`, rama lesson-43, sin licencia) + DOCUMENTACION_OFICIAL_ANALIZADA (DEPLOY-001) (TUT-025)
versiones: fuente — next 13.4.9, react 18.2, @supabase/auth-helpers-nextjs ^0.7.3, Tailwind 3.3
perfil: comercial (áreas privadas, paneles, reservas)
ultima_revision: 2026-10-26
---

# NEXT-002 · App Router en un proyecto real

1. **Finalidad.** Esqueleto de una app con zona pública de acceso, zona privada, listado con carga progresiva y formularios que escriben en base de datos — y lista de errores comunes vistos en código de curso.
2. **Fuente.** Shaun Pelling (The Net Ninja), repo https://github.com/iamshaunjp/nextjs-masterclass, una rama por lección (lesson-1…lesson-43; última leída: lesson-43, 2023-07-13). El curso completo está en Net Ninja Pro (de pago → INACCESIBLE_POR_COSTE); el repo es público. Vídeos **no vistos**.
3. **Estructura [COD].**
   - **Grupos de rutas:** `app/(auth)/{login,signup,verify}` con su `layout`, y `app/(dashboard)/…` con otro `layout` (los paréntesis no aparecen en la URL).
   - **Por segmento:** `loading.jsx` (estado de carga automático), `error.jsx` (Client Component con `reset()`), `not-found.jsx`, y una ruta comodín `[...not-found]/page.jsx` para 404 dentro del grupo.
   - **Streaming:** `tickets/page.jsx` envuelve `<TicketList />` (Server Component asíncrono) en `<Suspense fallback={<Loading/>}>` → la cabecera aparece al instante.
   - **Metadatos por página:** `export const metadata = { title }`.
   - **Server Actions:** `tickets/actions.js` con `"use server"`; el formulario usa `<form action={addTicket}>` (funciona sin JS); `revalidatePath('/tickets')` + `redirect('/tickets')` tras escribir.
   - **Estado de envío:** `SubmitButton` cliente con `useFormStatus()` (en la versión del curso, `experimental_useFormStatus`) para deshabilitar y mostrar "Submitting…".
   - **API:** `app/api/tickets/route.js`, `[id]/route.js`, y callback de auth en `api/auth/callback/route.js`.
4. **Hallazgos de revisión estática [COD] y corrección profesional.** *Trazabilidad: todos proceden de leer el código de la rama lesson-43 (2023-07-13); ninguno se ha ejecutado ni explotado; son riesgos potenciales en código didáctico, no vulnerabilidades demostradas en un sitio en producción. La columna "Riesgo" describe lo que podría ocurrir si el patrón se copiara tal cual.*
   | Error en el repo | Riesgo | Corrección |
   |---|---|---|
   | `const ticket = Object.fromEntries(formData)` insertado tal cual | **Asignación masiva**: el cliente puede añadir campos (p. ej. `user_email` de otro) | Validar con esquema (TS-001, SEC-002) y construir el objeto campo a campo |
   | `deleteTicket(id)` sin comprobar sesión ni propietario | Posible borrado por quien invoque la acción **si** la base de datos no lo impide (no se revisaron las políticas RLS de Supabase del curso) | Verificar auth **y autorización** dentro de cada acción (DEPLOY-001) + reglas RLS en BD |
   | Protección de la zona privada solo en `(dashboard)/layout.jsx` | Las acciones y rutas API no pasan por el layout | Comprobar en cada acción/route handler; capa de datos `server-only` |
   | `supabase.auth.getSession()` en servidor | La sesión de la cookie no se revalida contra el servidor de auth [conocimiento general; Supabase recomienda `getUser()` en servidor — verificar en su doc] | `getUser()` en servidor |
   | `middleware.js` dentro de `app/` | La doc oficial exige el archivo en la raíz del proyecto o en `src/`, al mismo nivel que `app` → dentro de `app/` no se ejecuta [DOC: nextjs.org/docs/app/api-reference/file-conventions/proxy, act. 2026-09-04] | Moverlo a la raíz. Desde **Next.js 16** `middleware` está obsoleto y se llama `proxy.ts` (codemod `middleware-to-proxy`); ver SEC-001 |
   | `<Link><button>…</button></Link>` | Elemento interactivo dentro de otro (HTML inválido, foco doble) | `<Link className="btn">` |
   | `throw new Error(...)` genérico en la acción | El usuario ve "Oh No!" sin saber qué corregir | Devolver `{ errors }` por campo y mostrarlos (`useActionState`) |
5. **Procedimiento profesional (plantilla).**
   1. `app/(public)` (web del negocio, estática), `app/(app)` (privado), `app/api` (solo si hay clientes externos).
   2. `loading`/`error`/`not-found` por grupo + `global-error` y `global-not-found` (DEPLOY-001).
   3. Formularios: Server Action + esquema + errores por campo + `useFormStatus` + mensaje en `role="status"`.
   4. Toda acción: validar → autenticar → autorizar → escribir → `revalidatePath`.
6–13. **Aplicaciones.** Sistema de reservas de una clínica, panel de citas de una barbería, área de clientes de un despacho.
14. **Pruebas.** Llamar a la acción sin sesión (debe fallar); enviar campos extra; formulario sin JS; errores de BD; 404 dentro y fuera del grupo (TEST-001).
15. **Estado.** Código de la última lección leído; ubicación/renombrado del proxy verificados en la doc oficial; lo de `getUser()` sigue como conocimiento general pendiente de verificar; nada ejecutado.

**Nota oficial añadida (doc de proxy):** las Server Functions no son rutas separadas: se envían como POST a la ruta donde se usan, así que un `matcher` que excluye una ruta también excluye sus acciones; mover una acción puede dejarla sin cobertura del proxy → verificar autenticación y autorización **dentro de cada Server Function**. Sin `matcher`, el proxy corre también para estáticos (`_next/static`, imágenes, `public/`).
