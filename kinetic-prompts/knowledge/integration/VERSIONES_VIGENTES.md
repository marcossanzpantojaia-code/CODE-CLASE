# Versiones vigentes frente a las versiones de las fichas (medido el 2026-10-27)

Fuente: registro público de npm (`npm view <paquete> version`), consultado el 2026-10-27 desde el contenedor de la sesión **[MED]**. Sirve para el paso 5 de `web-library-router` ("contrasta la versión de la ficha con la instalada"). No se ha instalado nada.

| Paquete | Última versión publicada | Versión en las fichas | Riesgo | Fichas afectadas |
|---|---|---|---|---|
| `astro` | **7.4.2** (`engines.node >= 22.23.4`) | Astro 4.4–5.x; ASTRO-004 actualizada con los cambios de 6/7 (lote 19) | **Alto** para ASTRO-001…003 (colecciones *legacy* eliminadas en 6, `ViewTransitions` eliminado en 6); medio para ASTRO-004 | ASTRO-001, ASTRO-002, ASTRO-003, ASTRO-004 |
| `typescript` | **7.0.2** (6.x: **6.0.3**) | TypeScript 5.x | **Medio/alto**: versión mayor nueva; **en Astro usar 6.0.3** (`@astrojs/check@0.9.12` solo admite `^5 \|\| ^6`; lote 19) | TS-001, T3-001 |
| `next` | 16.4.3 | Next.js 16 (docs oct-2026); fuentes de cursos 13.4–14 | Bajo con NEXT-004/SEC-003 (docs vigentes); **alto** para el código de cursos (NEXT-002/003) | NEXT-001…004, SEC-003 |
| `react` | 19.3.1 | React 19.2 | Bajo (versión menor) | REACT-001, GS-001 |
| `gsap` | 3.15.0 | GSAP 3.15 | Ninguno | ST-*, TXT-*, GS-*, FLIP-*, MORPH-001… |
| `@gsap/react` | 2.1.2 | 2.1.2 | Ninguno | GS-001 |
| `lenis` | 1.3.27 | 1.3.27 | Ninguno | LN-001 |
| `three` | 0.186.1 | r186 (rama dev para algunos ejemplos) | Bajo; `LightMapper`/`unwrapUVs` aún no publicados | TSL-*, WGPU-001, LIGHT-*, POST-001, PBR-001 |
| `@react-three/fiber` | 9.8.2 | 9.x | Bajo | R3F-001/002, CFG-001 |
| `@playwright/test` | 1.64.1 | "actual" (1.63.0 instalado en el contenedor) | Bajo | TEST-001/002, CI-001 |
| `vite` | 8.3.5 | — | — | — |
| `tailwindcss` | 4.3.3 | Tailwind 3.3–3.4 en fuentes de cursos | Medio: v4 cambió la configuración | ASTRO-003, NEXT-002 (solo como contexto) |
| `lighthouse` | 13.5.0 (Apache-2.0, `node >= 22.19`) | `@lhci/cli` 0.15.x | — | CI-002 |
| `@astrojs/check` | 0.9.12 (peer `typescript ^5 \|\| ^6`) | — | Bloquea TS 7 en proyectos Astro | TS-001, ASTRO-004 |

## Licencia de GSAP (dato del registro)
El campo `license` de `gsap@3.15.0` en npm es **"Standard 'no charge' license: https://gsap.com/standard-license"** (no MIT). Las Skills oficiales dicen que es gratuito también para uso comercial (GS-004, DRAG-001). Texto leído en el lote 18 (gsap.com/standard-license, en vigor desde el 30-04-2025, modificada el 30-05-2025) — `DOCUMENTACION_OFICIAL_ANALIZADA`: licencia no exclusiva y mundial para usar GSAP "on any website, web application, or digital interface", **incluido uso comercial** y los antiguos plugins de pago; **prohibido** sin permiso escrito usarlo en herramientas visuales sin código que compitan con el constructor de animaciones de Webflow, o hacer ingeniería inversa para crearlas; **sin atribución obligatoria**, pero no se pueden quitar los avisos de propiedad; Webflow puede modificarla (las versiones anteriores siguen valiendo con sus términos) o rescindirla por incumplimiento. Según su texto, una web de cliente encaja en los usos permitidos; la excepción relevante son los editores visuales de animación. No es asesoramiento legal.

## Regla para Claude Code
Antes de escribir código con una ficha cuya versión difiere de forma **mayor** (Astro, TypeScript), consultar la documentación oficial de la versión instalada y anotarlo en `CONSULTA_BIBLIOTECA.md` §5. Actualizar esta tabla en cada lote con `npm view`.
