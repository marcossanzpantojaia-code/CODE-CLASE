---
name: kp-design-system
description: Sistema de diseño de la app Kinetic Prompts (tokens, tipografía, rejilla, movimiento, estados obligatorios y lo prohibido). Úsala siempre antes de crear o modificar cualquier componente, pantalla o estilo de la app. No se aplica a las webs y demos de content/, que tienen identidad propia.
---

# kp-design-system

La dirección es una «sala de proyección»: fondo oscuro y sobrio, la interfaz en segundo
plano y los efectos como protagonistas. El color y el movimiento llamativo los ponen las
vistas previas; la interfaz solo acompaña. Fuente de verdad: sección «Dirección estética»
de `docs/PLAN.md`. Si algo de aquí contradice el plan, manda el plan.

## Antes de escribir código

1. Lee `styles/tokens.css`. Si un valor no existe como token, no lo inventes: añádelo
   primero al archivo de tokens (y justifícalo) o usa el token más cercano.
2. Usa las clases de Tailwind conectadas a los tokens. Prohibido escribir colores hex,
   `px` sueltos, sombras o radios fuera de los tokens.
3. Usa Radix UI para diálogos, pestañas, menús, tooltips, sliders y selects.

## Tokens

**Color (tema oscuro por defecto)**

| Token          | Valor     | Uso                                         |
| -------------- | --------- | ------------------------------------------- |
| `--bg`         | `#0E0F12` | Fondo de la página                          |
| `--surface`    | `#16181D` | Tarjetas, paneles                           |
| `--surface-2`  | `#1F2229` | Bloque del prompt, inputs, menús            |
| `--border`     | `#2A2E37` | Bordes de 1 px                              |
| `--text`       | `#ECEDEF` | Texto principal                             |
| `--text-muted` | `#9095A0` | Texto secundario, metadatos                 |
| `--accent`     | `#FF6B3D` | Único acento: Copiar, enlaces activos, foco |
| `--success`    | `#3DD68C` | «Copiado», estado VALIDADO                  |
| `--warning`    | `#F5B841` | Límite de copias cerca                      |
| `--danger`     | `#F2555A` | Errores                                     |

- `--accent` solo en lo que se puede pulsar o en lo activo. Nunca en fondos grandes ni degradados.
- Contraste de texto mínimo 4,5:1 (comprueba `--text-muted` sobre `--surface` y `--surface-2`).

**Tipografía (next/font, Google Fonts)**

- Títulos: Bricolage Grotesque, 600–800, tracking −2 %.
- Texto e interfaz: Instrument Sans, 400–600.
- Prompts y código: JetBrains Mono, 400, 14 px, interlineado 1,6.
- Escala (px): 12 · 14 · 16 · 20 · 28 · 40 · 64. Base 16 px. Párrafos de 65 caracteres como máximo.

**Espaciado, forma y rejilla**

- Espaciado en múltiplos de 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- Radios: 6 px chips y botones · 12 px tarjetas · 20 px paneles grandes.
- Ancho máximo 1440 px; márgenes laterales de 24 px en escritorio y 16 px en móvil.
- Galería de Animaciones: 4 columnas > 1280 px · 3 hasta 1024 px · 2 hasta 640 px · 1 en móvil.
- Galería de Webs: 3 columnas en escritorio · 2 en tablet · 1 en móvil.
- Tarjetas: siempre 16:10 y con la misma altura de pie en toda la rejilla.
- Sombras: casi ninguna. La profundidad se marca con bordes y con el paso de `--surface` a `--surface-2`.
- Iconos: Lucide, trazo 1,5 px, 20 px.

## Movimiento de la interfaz

| Momento              | Duración | Comportamiento                                                        |
| -------------------- | -------- | --------------------------------------------------------------------- |
| Hover en tarjeta     | 150 ms   | Sube 2 px, el borde se aclara, la vista previa empieza a reproducirse |
| Menús, chips, toasts | 240 ms   | Fundido + desplazamiento de 8 px                                      |
| Tarjeta → ficha      | 600 ms   | View Transitions API; GSAP Flip como alternativa                      |
| Copiar prompt        | 240 ms   | El botón cambia a «Copiado ✓» durante 2 s                             |

- Easing único: `cubic-bezier(0.2, 0.8, 0.2, 1)`. No uses otro.
- Con `prefers-reduced-motion`: las transiciones pasan a fundidos de 100 ms y las vistas
  previas muestran un fotograma estático con botón «Reproducir».
- Anima solo `transform` y `opacity`.

## Estados obligatorios

**De cada componente interactivo:** reposo, hover, foco de teclado visible (anillo de 2 px
en `--accent`), activo, deshabilitado y cargando (shimmer sobre `--surface-2`).

**De cada pantalla:**

| Situación                  | Qué se muestra                                                            |
| -------------------------- | ------------------------------------------------------------------------- |
| Sin resultados de búsqueda | Mensaje con la palabra buscada y 3 categorías sugeridas                   |
| Copiar sin sesión          | Panel lateral «Inicia sesión con Google para copiar», sin perder la ficha |
| Límite alcanzado           | Aviso en `--warning` con la fecha de renovación y el botón de plan        |
| Error de carga             | Mensaje que explica qué falló y botón Reintentar                          |
| Sin JavaScript             | Pósteres estáticos y texto informativo legible                            |

## Prohibido

- Degradados morado-azul, brillos y glassmorphism (la única translucidez permitida es la
  cabecera al hacer scroll, con desenfoque de 12 px).
- Emojis como iconos.
- Todo centrado.
- Más de un color de acento.
- Animar la interfaz por animar.
- Textos de la interfaz en otro idioma que no sea español.
- Contenido de catálogo (títulos, prompts) escrito dentro de componentes: se lee de `content/`.

## Cómo se usan en código (implementado en la Fase 1)

- **Tokens:** `styles/tokens.css`. **Clases:** `@theme` de `app/globals.css` (Tailwind 4 no usa
  `tailwind.config`). Los valores por defecto de Tailwind están vaciados: `bg-red-500`,
  `shadow-lg` o `rounded-3xl` no generan nada.
- **Colores:** `bg-bg`, `bg-surface`, `bg-surface-2`, `border-border`, `text-text`,
  `text-text-muted`, `bg-accent` + `text-on-accent`, `text-success`, `text-warning`,
  `text-danger`; derivados de estado `border-border-strong`, `bg-accent-hover`,
  `bg-accent-press`.
- **Tipografía:** `font-display` (+ `tracking-display`), `font-sans`, `font-mono`
  (+ `leading-mono`); tamaños `text-12`, `text-14`, `text-16`, `text-20`, `text-28`,
  `text-40` y `text-64`.
- **Espaciado:** base de 4 px (`p-1` = 4 px). Solo los pasos 1, 2, 3, 4, 6, 8, 12, 16 y 24.
- **Radios:** `rounded-control` (6), `rounded-card` (12), `rounded-panel` (20).
- **Rejilla:** `max-w-page` (1440 px), `max-w-measure` (65ch), `max-w-reading` (680 px);
  márgenes `px-4 md:px-6`.
- **Movimiento:** `ease-kp`, `duration-(--dur-hover)`, `duration-(--dur-ui)`,
  `duration-(--dur-signature)`, `translate-y-(--lift)`, `animate-pop-in` y
  `animate-pop-out`. Con movimiento reducido los tokens pasan solos a 100 ms y a 0 px.
- **Estados:** usa las variantes `kp-hover:`, `kp-focus:` y `kp-active:`, que además
  aceptan `data-force="hover|focus|active"` para mostrarlos en `/design`. Las clases
  comunes (`focusRing`, `stateTransition`, `disabledState`, `loadingState`, `fieldBase`)
  están en `components/ui/styles.ts`.
- **Cargando ≠ deshabilitado:** cargando mantiene el color, muestra `Spinner`, `aria-busy`
  y no ejecuta la acción; deshabilitado baja al 50 %.
- **Iconos:** `<Icon icon={…} />` (20 px, trazo de 1,5 px reales).
- **Guardia:** `styles/guardia.test.ts` falla con hex, funciones de color, valores
  arbitrarios con unidades, sombras, degradados, paleta por defecto, emojis o espaciado
  fuera de la escala. Un hex de contenido se permite con el comentario `kp-permitir-hex`.
- **Catálogo vivo:** `/design` (solo en desarrollo). Cada componente nuevo se añade allí
  con su matriz de estados.

## Botón de copia: el cimiento de la app

Cada efecto, cada web y cada sección de una web se copia con un clic. Ver «Principio rector:
el botón de copia» en `docs/PLAN.md`.

- Usa siempre `CopyButton` (`components/ui/copy-button.tsx`). No escribas otro código de
  portapapeles ni otro estado «Copiado»: `CopyProvider` (dentro de `UIProviders`) lleva la
  región aria-live y decide qué pasa sin sesión o con el límite alcanzado.
- `source`: el texto del prompt o, desde la fase 6, una función que lo pide a POST /api/copy.
  Si devuelve 401 o 429, lanza `CopyBlockedError` (`lib/clipboard.ts`).
- Tarjetas: `variant="secundario"` y `label="Copiar"`. En la ficha: primario y `size="lg"`, fijo al hacer scroll.
  En las secciones de una web: secundario. Pasa `what` («Prompt de …») para el aviso.
- Estados: los seis comunes más copiando, copiado (`--success` sobre `--surface-2`, 2 s =
  `--dur-copied`) y error («Reintentar» en `--danger` y un aviso que explica qué falló). El ancho
  no cambia entre estados.
- Lo copiado es exactamente lo que se muestra: pasa a `source` el mismo texto que se renderiza.

## Al terminar

Comprueba el componente con teclado, con `prefers-reduced-motion` y a 375 y 1440 px.
Al cerrar una fase, usa `kp-revision-visual`.
