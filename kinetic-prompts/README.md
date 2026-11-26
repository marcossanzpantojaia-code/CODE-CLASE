# Kinetic Prompts

Biblioteca de prompts con dos apartados, **Webs** y **Animaciones**: cada diseño se ve funcionando y lleva
dentro el prompt para construirlo con Claude Code, Cursor u otra IA. El encargo completo está en
[`docs/PLAN.md`](docs/PLAN.md) y se construye por fases, una por sesión.

## Estado

| Fase | Contenido                                                                | Estado                                                               |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| 0    | Preparación del proyecto                                                 | Hecha, salvo el resumen de la biblioteca (falta copiar `knowledge/`) |
| 1–8  | Sistema de diseño, galerías, fichas, catálogo, login, pagos, lanzamiento | Pendientes                                                           |

## Puesta en marcha

```bash
npm ci
npx playwright install chromium   # solo la primera vez
npm run dev                       # http://localhost:3000
```

Para añadir o actualizar dependencias usa npm ≥ 11 (`npx npm@11 install …`): npm 10.9 falla al resolver
los peers de Vitest 4.

## Comandos

| Comando                           | Qué hace                                                             |
| --------------------------------- | -------------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                                               |
| `npm run lint`                    | ESLint (Next.js + Prettier), sin avisos permitidos                   |
| `npm run typecheck`               | TypeScript sin emitir                                                |
| `npm run format` / `format:check` | Prettier (con orden de clases de Tailwind)                           |
| `npm run test`                    | Vitest: lógica y componentes (`**/*.test.ts(x)`)                     |
| `npm run test:e2e`                | Playwright: `tests/e2e/`, en escritorio (1440×900) y móvil (Pixel 7) |

## Estructura

```text
app/                 rutas (App Router)
components/          ui/ · gallery/ · item/ · web/ · animation/ · layout/
content/webs/        una carpeta por web: item.json, prompt.md, sections/, preview/, media/
content/animaciones/ una carpeta por animación: item.json, prompt.md, preview/, media/
lib/                 supabase/, stripe/, prompt-render.ts, content.ts
styles/              tokens.css (Fase 1)
knowledge/           copia de WEB_ENGINEERING_KNOWLEDGE_LIBRARY (solo lectura)
.claude/skills/      kp-design-system, kp-crear-animacion, kp-crear-web, kp-validar, kp-revision-visual
tests/               e2e/ y visual/ (capturas de referencia)
docs/PLAN.md         el plan
```

## Biblioteca

Copia el contenido de `WEB_ENGINEERING_KNOWLEDGE_LIBRARY` dentro de `knowledge/`, de forma que exista
`knowledge/KNOWLEDGE_INDEX.md`. Claude Code solo lee el índice y las fichas que necesita, y solo modifica
`knowledge/RESEARCH_PROGRESS.md`.
