# Kinetic Prompts

- Plan completo: docs/PLAN.md. Léelo antes de cada fase.
- La app tiene dos apartados: Webs y Animaciones. Cada elemento vive en
  content/webs/<slug>/ o content/animaciones/<slug>/. Nunca escribas prompts dentro de componentes.
- Biblioteca: knowledge/. Empieza siempre por knowledge/KNOWLEDGE_INDEX.md.
  No la cargues entera. No modifiques las fichas existentes. Con permiso del usuario (2026-11-26) se
  pueden añadir fichas nuevas con knowledge/_templates/FICHA_TECNICA.md y actualizar KNOWLEDGE_INDEX.md
  y RESEARCH_PROGRESS.md.
- Diseño: usa solo los tokens de styles/tokens.css. Prohibido escribir colores o tamaños sueltos.
- Cimiento: todo prompt se copia con un clic con CopyButton (components/ui/copy-button.tsx),
  en tarjetas, fichas y secciones de web. No escribas otro código de portapapeles.
- Publicación: solo los elementos con status VALIDADO aparecen en las galerías.
- Antes de dar algo por terminado: npm run lint, npm run test y npm run test:e2e en verde,
  y revisa las capturas de Playwright.
- Distingue siempre código propuesto de código probado.
- Idioma de la interfaz: español.

## Skills (.claude/skills/)

- kp-design-system: al crear o tocar cualquier componente de la app.
- kp-crear-animacion / kp-crear-web: al añadir un elemento al catálogo.
- kp-validar: tras crear o cambiar una web o una animación.
- kp-revision-visual: al cerrar cada fase.

## Comandos

- npm run dev · npm run lint · npm run typecheck · npm run test · npm run test:e2e · npm run format
- Para instalar o actualizar dependencias usa `npx npm@11 install …` (npm 10.9 falla al resolver peers).
- Playwright necesita Chromium: `npx playwright install chromium` la primera vez en local.

## Next.js 16

@AGENTS.md
