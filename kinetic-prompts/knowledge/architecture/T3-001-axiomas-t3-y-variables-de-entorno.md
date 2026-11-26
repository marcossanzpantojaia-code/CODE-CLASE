---
id: T3-001
titulo: Criterios de la T3 Stack (Theo) y validación de variables de entorno en build con Zod
categoria: architecture
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (create.t3.gg: introducción y variables de entorno)
versiones: create-t3-app (docs 2026-10-26), `@t3-oss/env-nextjs`
perfil: ambos
ultima_revision: 2026-10-26
---

# T3-001 · T3 Stack

1. **Finalidad.** Reglas de decisión de un stack muy usado (creado por Theo, @t3dotgg) y una técnica concreta para que una web nunca se despliegue con variables de entorno ausentes o mal formadas.
2. **Fuentes.** https://create.t3.gg/en/introduction · https://create.t3.gg/en/usage/env-variables . Canal de Theo: vídeos **no vistos**.
3. **Axiomas [docs].**
   - **Resolver problemas:** añadir solo herramientas que cubren un hueco concreto (NextAuth.js, Prisma, tRPC); se excluyen librerías de estado como Redux o Zustand.
   - **Sangrar con responsabilidad:** usar tecnología nueva y arriesgada solo en partes menos críticas (base de datos SQL probada; tRPC sí, porque es fácil de abandonar).
   - **El tipado no es opcional:** cualquier elección que debilite la seguridad de tipos pertenece a otro proyecto.
   - create-t3-app es una **CLI modular**, no una plantilla fija: Next.js + TypeScript (+ Tailwind habitualmente) y opcionalmente tRPC, Prisma, NextAuth.
4. **Variables de entorno [docs].**
   - `src/env.js` con `createEnv` de `@t3-oss/env-nextjs` y esquemas Zod separados en `server` y `client`; leer una variable de servidor desde el cliente lanza un error en tiempo de ejecución.
   - Las del cliente llevan prefijo `NEXT_PUBLIC_`.
   - `runtimeEnv` mapea cada clave a `process.env.CLAVE` (evita que Next.js la elimine del bundle).
   - Se valida en **build y en ejecución** → si falta una variable requerida, el build no termina.
   - Valores de `.env` son cadenas → `z.coerce.number()` etc.
   - Añadir variable: `.env` → esquema + `runtimeEnv` → `.env.example` sin secretos.
5. **Encaje con la biblioteca.** Completa TS-001 §7.2 (allí era inferencia propia; aquí es documentación oficial) y DEPLOY-001 (`.env*` en `.gitignore`, solo lo público con `NEXT_PUBLIC_`).
6. **Procedimiento para webs de clientes [criterio propio].** Claves de formularios (servicio de correo, CAPTCHA, API de reservas) siempre en `server`; el `.env.example` documenta qué debe configurar quien despliegue; en Astro, el equivalente es el esquema de `astro:env` [conocimiento general, verificar en docs de Astro].
7–13. **Aplicaciones.** Cualquier proyecto Next.js con secretos; webs con formulario de contacto/reservas.
14. **Pruebas.** Build sin una variable (debe fallar); `NEXT_PUBLIC_` no contiene secretos (revisar el bundle).
15. **Estado.** Docs leídas; no implementado.
