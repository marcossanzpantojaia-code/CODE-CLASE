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

## Al terminar

Comprueba el componente con teclado, con `prefers-reduced-motion` y a 375 y 1440 px.
Al cerrar una fase, usa `kp-revision-visual`.
