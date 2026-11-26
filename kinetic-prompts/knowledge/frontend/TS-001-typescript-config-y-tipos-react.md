---
id: TS-001
titulo: TypeScript profesional para webs React/Next.js — tsconfig recomendado, tipos de props y validación en las fronteras
categoria: frontend
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Matt Pocock, Total TypeScript — artículos gratuitos)
versiones: TypeScript 5.x
perfil: ambos
ultima_revision: 2026-10-27
---

# TS-001 · TypeScript (Matt Pocock)

1. **Finalidad.** Configuración y patrones de tipos que evitan errores reales en webs de negocio (formularios, datos de servicios, componentes de UI).
2. **Fuentes (gratuitas).** https://www.totaltypescript.com/tsconfig-cheat-sheet · https://www.totaltypescript.com/react-component-props-type-helper · https://www.totaltypescript.com/when-should-you-use-zod (localizadas desde el RSS oficial del sitio). El libro *Total TypeScript Essentials* y los cursos no se usaron. Vídeos del autor **no vistos**.
3. **tsconfig base [autor].**
   - Todas: `esModuleInterop`, `skipLibCheck`, `target: "es2022"`, `allowJs`, `resolveJsonModule`, `moduleDetection: "force"`, `isolatedModules`, `verbatimModuleSyntax`.
   - Estrictez: `strict: true` ("indispensable"), **`noUncheckedIndexedAccess: true`** (obliga a comprobar `arr[i]`/`obj[key]`), `noImplicitOverride`. Las opciones "ruidosas" (`noUnusedLocals`…) son opcionales.
   - Si compila un bundler (Next.js, Vite, Astro): `module: "preserve"` (implica `moduleResolution: "Bundler"`) + `noEmit: true`; `lib: ["es2022","dom","dom.iterable"]`.
   - Si compila `tsc` (Node): `module: "NodeNext"`, `outDir`. Librerías: `declaration`, y en monorepo `composite`, `declarationMap`, `sourceMap`.
   - [Criterio propio] En Next.js, respetar lo que genera `create-next-app` (plugin `next`, `paths`) y **añadir** `noUncheckedIndexedAccess`.
4. **Tipos de props [autor].** `ComponentProps<"button">` para heredar todas las props nativas en un componente envoltorio (`type Props = ComponentProps<"button"> & { variant: "primary" | "ghost" }` y `...rest` al elemento); `ComponentProps<typeof Componente>` para props de librerías que no las exportan; `ComponentPropsWithRef<"input">` si hay ref.
5. **Validación en tiempo de ejecución [autor].** Validar con Zod (u otra) en las **fronteras de confianza**: parámetros y cuerpos de API, `FormData`, cabeceras, WebSockets, `localStorage`, APIs de terceros o de otros equipos. Datos de tu propio backend en tu frontend: normalmente no (coste ~12 kB gzip y algo de CPU). Usar `safeParse` → respuesta 400 limpia; inferir el tipo desde el esquema.
6. **Encaje con la biblioteca.** SEC-002 (validar en servidor), FORM-001 (formularios), UX-003 (uniones discriminadas para estados).
7. **Procedimiento profesional.**
   1. Un esquema por formulario en un módulo compartido; el Server Action hace `safeParse` y devuelve errores por campo; el cliente reutiliza el mismo esquema solo para ayudas inmediatas.
   2. Variables de entorno: validarlas al arrancar [inferencia propia; el artículo no lo cubre].
   3. `tsc --noEmit` en CI (TEST-001).
8. **Parámetros.** —
9. **Código (adaptación; no ejecutada):**
   ```tsx
   import type { ComponentProps } from "react";
   type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "ghost" };
   export function Button({ variant = "primary", ...rest }: ButtonProps) { return <button data-variant={variant} {...rest} />; }
   ```
10. **Problemas habituales.** `any` en eventos; acceso a arrays sin comprobar; confiar en tipos de TypeScript para datos externos (los tipos desaparecen en tiempo de ejecución).
11. **Rendimiento.** `skipLibCheck` acelera la comprobación; Zod solo donde haga falta.
12. **Compatibilidad.** TS ≥ 5.0 para `verbatimModuleSyntax`; `module: "preserve"` desde TS 5.4 (**verificado**, typescriptlang.org/tsconfig#module, lote 16).
13. **Aplicaciones.** Todas las webs del perfil A y B.
14. **Pruebas.** CI con `tsc --noEmit` + ESLint `@typescript-eslint/no-floating-promises` (TEST-001).
15. **Estado.** Artículos leídos; no implementado.

**Lote 18 — aviso de versión [MED, npm 2026-10-27]:** la última versión publicada es **TypeScript 7.0.2**; esta ficha se escribió para TS 5.x → revisar opciones de `tsconfig` en las notas de la versión instalada. Ver `integration/VERSIONES_VIGENTES.md`.

## Lote 19 · TypeScript 7 y Astro — `METADATOS_VERIFICADOS` (npm) + `ARTICULO_AUTOR_ANALIZADO` (InfoQ, 2026-08)
- TS 7.0 es el compilador nativo en Go (8–12× más rápido según Microsoft); **convierte en errores las obsoletas de 6.0**; `strict` y `esnext` pasan a ser los valores por defecto; **no** trae API programática estable (prevista en 7.1): las herramientas que la usan (typescript-eslint, Vue, Svelte, **Astro**, MDX) no funcionan aún con 7.0. Ruta recomendada: pasar primero por 6.0; paquete de convivencia `@typescript/typescript6` (`tsc6`).
- **[MED, npm 2026-10-27]:** `@astrojs/check@0.9.12` declara `peerDependencies.typescript: "^5.0.0 || ^6.0.0"` → **en proyectos Astro usar `typescript@6.0.3`**. Una petición de fusión pública (gitlab.com/gitlab-com/public-sector/pipeline MR 95) cita el issue withastro/astro#17268 ("TypeScript 7 does not currently support languages like Astro, Vue, Svelte") — fuente secundaria; el *peer range* sí está verificado.
