---
id: NEXT-003
titulo: Decisiones de arquitectura en Next.js según Jack Herrington — Server Actions vs API, formularios con estado de acción, dónde poner componentes (y un consejo que contradice a OWASP)
categoria: architecture
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (pronextjs.dev, artículos gratuitos 2023–2024) + DOCUMENTACION_OFICIAL_ANALIZADA (OWASP HTML5 Security Cheat Sheet)
versiones: Next.js 13.4–14 en las fuentes (el hook se llamaba `useFormState`; hoy es `useActionState` de `react` — verificado en la guía oficial de formularios de Next.js, act. 2026-10-06)
perfil: ambos
ultima_revision: 2026-10-26
---

# NEXT-003 · Criterios de Jack Herrington

1. **Finalidad.** Respuestas de un ingeniero experto (ha dirigido adopciones de React/Next.js en Walmart Labs y Nike, según su web) a dudas recurrentes al estructurar una web Next.js.
2. **Fuentes (gratuitas).** https://www.pronextjs.dev/should-i-use-server-actions-or-apis (04-09-2023), https://www.pronextjs.dev/form-actions-with-the-useformstate-hook (26-02-2024), https://www.pronextjs.dev/where-should-i-put-my-components-in-the-app-router (06-08-2023), https://www.pronextjs.dev/storing-jwts (02-08-2023). Curso "Professional Next.js" de pago → INACCESIBLE_POR_COSTE. Canal YouTube @jherr: vídeos **no vistos**. Repos fijados en su GitHub: Module Federation/Webpack 5 (no relevantes para esta biblioteca).
3. **Server Actions o API [autor].** Solo tu app Next.js consume → Server Actions (tipado de extremo a extremo, menos control del formato). Hay clientes externos (app móvil, terceros) → rutas API (cualquier verbo y formato, sin tipado automático). Se pueden combinar: empezar con acciones y añadir API cuando haga falta. Llamar acciones desde fuera "no es buena idea": su formato puede cambiar entre versiones de Next.js.
4. **Formulario con estado de acción [autor].**
   - Acción `async (prevState, formData)` en un módulo con `"use server"` (todo lo exportado pasa a ser solo servidor).
   - Componente cliente: `useFormState(action, initialState)` → `[state, formAction]`; `<form action={formAction}>`; mostrar `state` (mensajes, errores) donde convenga.
   - **Funciona sin JavaScript** (mejora progresiva).
   - Devolver el estado permite no perder lo que escribió el usuario tras un error.
   - Validar antes de llamar a la acción con React Hook Form es "complicado" (lo trata en otro tutorial no leído).
   → Encaje: NEXT-002 §5 (errores por campo), TS-001 (esquema compartido), UX-003 (estados).
5. **Dónde poner componentes [autor].** Globales (sistema de diseño) en `src/components`; los de una ruta en una carpeta privada `_components` dentro de esa ruta (el guion bajo la excluye del enrutado); en proyectos pequeños, junto a `page` es aceptable; **no** usar grupos de rutas `(components)` para componentes; evita una carpeta por componente con `index.tsx` (muchos archivos con el mismo nombre). Reconoce que no hay consenso en la comunidad.
6. **Almacenar JWT — discrepancia con OWASP** (comparación de recomendaciones documentales; no se ha probado ningún ataque).
   - [autor] Recomienda `localStorage` para mantener la sesión al cerrar la ventana; primero ver si la librería de auth ya lo resuelve; niveles de seguridad según la app (en apps de alta seguridad, no persistir el token).
   - [OWASP, https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html] **No guardar identificadores de sesión en localStorage**: siempre accesible por JavaScript; un solo XSS los roba. Alternativa: cookies `HttpOnly`. `sessionStorage` si no hace falta persistencia.
   - **Regla de la biblioteca:** seguir OWASP — sesión en cookie `HttpOnly; Secure; SameSite=Lax` gestionada por la librería de auth; nunca tokens en `localStorage` en webs con datos de clientes (SEC-001/SEC-002).
7. **Procedimiento.** Al crear un proyecto: (1) ¿habrá clientes externos? → decide acciones/API; (2) formulario = acción + `useActionState` + esquema; (3) estructura `src/components` + `_components`; (4) auth con cookie HttpOnly.
8–13. **Aplicaciones.** Formularios de cita/contacto, área de clientes, futura app móvil del negocio (→ API).
14. **Pruebas.** Formulario sin JS; error de validación conserva valores; acción llamada sin sesión; revisar que no hay tokens en `localStorage` (DevTools → Application).
15. **Estado.** Artículos leídos; nombre del hook verificado; nada implementado.

## Lote 10 — patrón oficial vigente (https://nextjs.org/docs/app/guides/forms, act. 2026-10-06) — `DOCUMENTACION_OFICIAL_ANALIZADA`
- **Aviso oficial:** verificar autenticación y autorización **dentro de cada Server Action**, aunque el formulario solo se muestre en una página autenticada.
- Validación en servidor con Zod/Valibot: `schema.safeParse({...})` y, si falla, `return { errors: validatedFields.error.flatten().fieldErrors }`.
- Errores y estado de envío: componente cliente con `const [state, formAction, pending] = useActionState(action, initialState)` (import de `react`); la acción recibe `(prevState, formData)`; mensaje en `<p aria-live="polite">`; `disabled={pending}`. Alternativa: `useFormStatus` (de `react-dom`) en un componente hijo del formulario.
- `Object.fromEntries(formData)` incluye propiedades extra con prefijo `$ACTION_` → otra razón para construir el objeto campo a campo (NEXT-002).
- Argumentos extra con `action.bind(null, id)` (compatible con mejora progresiva); los `input hidden` quedan visibles en el HTML.
- `useOptimistic` para actualizaciones optimistas; `requestSubmit()` para envío por teclado (⌘/Ctrl+Enter).

