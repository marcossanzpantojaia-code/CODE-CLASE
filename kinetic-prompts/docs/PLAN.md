# Kinetic Prompts: plan de construcción para Claude Code

Nov 23, 2026 · @Marcos

## Cómo usar este documento

Este documento es el encargo completo para que Claude Code construya Kinetic Prompts: una biblioteca con dos apartados, Webs y Animaciones. En cada uno mostramos nuestros diseños funcionando y, dentro de cada diseño, el prompt para que cualquiera pueda desarrollarlo con su IA.

1. Exporta este documento a Markdown y guárdalo en la raíz del proyecto como `docs/PLAN.md`.
2. Copia la carpeta `WEB_ENGINEERING_KNOWLEDGE_LIBRARY` dentro del proyecto, en `knowledge/`.
3. Abre Claude Code en la carpeta del proyecto y pega los prompts de la sección «Prompts para Claude Code» en orden, uno por sesión.
4. No pases al siguiente prompt hasta que se cumplan sus criterios de cierre.
5. Revisa tú cada fase en el navegador antes de aprobarla.

«Kinetic Prompts» es un nombre provisional: cámbialo en todo el documento con buscar y reemplazar.

**Regla de identidad:** la app sigue el mismo concepto que The Prompts Factory (galería con vistas previas en movimiento y prompt dentro), pero no copia su nombre, logo, textos, ilustraciones ni diseño visual. Todo lo visual es propio.

## Visión del producto

Kinetic Prompts es una biblioteca de prompts para desarrollar nuestras webs y animaciones. El usuario ve el diseño funcionando, copia su prompt y lo pega en su IA (Claude Code, Cursor…) para construir lo mismo en su proyecto.

**Para quién:** diseñadores y desarrolladores que construyen webs con Claude Code, Cursor u otras IAs, y agencias que hacen webs para negocios.

**Qué hace el usuario:**

- Explora una galería de efectos en movimiento sin necesidad de cuenta.
- Abre un efecto y lo ve en grande, en escritorio y en móvil.
- Ajusta parámetros (duración, easing, colores) y el prompt se reescribe solo.
- Copia el prompt de cualquier efecto con un clic, desde la tarjeta o desde la ficha (con sesión de Google a partir de la fase 6).
- Guarda favoritos y colecciones.
- Con plan de pago, aumenta su límite mensual de copias.

**Qué nos diferencia:** cada prompt sale de una ficha con estado VALIDADO en la WEB_ENGINEERING_KNOWLEDGE_LIBRARY. Solo se publican efectos que Claude Code ha implementado y probado.

### Principio rector: el botón de copia

Toda la app se construye sobre un mismo botón. Cada efecto, cada web y cada sección de una web tiene un botón que copia su prompt con un solo clic. La galería, la ficha y los parámetros existen para elegir qué copiar y con qué valores. *(Decisión del 2026-11-26.)*

- **Un clic, copiado.** El botón pasa a «Copiado ✓» durante 2 s y el prompt ya está en el portapapeles. No hay que abrir nada ni seleccionar texto. La ficha con vista previa y parámetros se mantiene para quien quiera verlo antes.
- **En todas partes donde hay un prompt:**
  - Tarjeta de la galería y de las novedades del inicio: variante secundaria, «Copiar», con los valores por defecto.
  - Ficha: primario grande, fijo al hacer scroll, con los parámetros elegidos.
  - Prompt maestro y cada sección de una web.
  - Relacionados, favoritos y resultados de búsqueda, porque usan la misma tarjeta.
- **Un solo componente:** `CopyButton` (`components/ui/copy-button.tsx`) con un único `CopyProvider`. Nadie escribe otro código de portapapeles.
- **Estados:** reposo, hover, foco, activo, deshabilitado, copiando, copiado y error. El error muestra «Reintentar» y un aviso que dice qué falló. Una región aria-live anuncia «Prompt de … copiado al portapapeles».
- **Sesión y límite (fase 6):** explorar es libre.
  - El primer clic sin sesión abre el panel «Inicia sesión con Google para copiar», sin salir de la página, y tras el login la copia se completa sola.
  - Cada copia, también la de una tarjeta, cuenta para el límite mensual (10 en el plan gratuito).
- **El prompt puede llegar del servidor sin perder el clic.** `lib/clipboard.ts` usa `ClipboardItem` con una promesa mientras responde POST /api/copy, y tiene `writeText` y `execCommand` como respaldo.

### Principio: muy, muy fácil de usar

La app tiene que ser muy, muy fácil de usar y facilitar de verdad la creación de la web. Si una decisión complica el camino de «veo el efecto» a «lo tengo en mi web», se descarta. *(Decisión del 2026-11-26.)*

- **Pulsar, elegir y copiar.** Pulsar la tarjeta de un efecto abre su panel con la demo en vivo, las opciones (tipo de proyecto y parámetros), el prompt y los consejos de la biblioteca. Cada opción actualiza la demo y el prompt al momento, y «Copiar prompt» se lleva exactamente lo que se ve. *(Cambio del 2026-11-26: sustituye a la copia instantánea al pulsar la tarjeta.)*
- **Tres clics como máximo** desde el inicio hasta tener un prompt copiado: «Animaciones» → tarjeta → «Copiar prompt».
- **Nombres llanos y en español:** «Persianas desde el centro», no «MASK-002». Los identificadores de la biblioteca nunca se ven en la interfaz.
- **Nivel a la vista:** cada efecto muestra si es básico, intermedio o avanzado (ver «Niveles de complejidad»), y la galería filtra por nivel.
- **Valores por defecto listos:** el prompt copiado funciona tal cual. Los parámetros son opcionales, no un formulario que haya que rellenar.
- **Cómo usarlo en tres pasos**, visibles en la galería: Pulsa un efecto · Elige tus opciones · Copia el prompt y pégalo en tu IA.
- **Una app nutrida de conocimiento:** cada efecto muestra los consejos de la biblioteca en lenguaje llano (`tips` en `item.json`) y las fichas en las que se basa.
- **Tu proyecto:** el panel deja elegir Next.js, Astro, HTML o «Que lo detecte mi IA». En `prompt.md`, las instrucciones propias de cada uno van entre `<!-- solo: nextjs -->` y `<!-- fin -->` (`selectStack` en `lib/prompt-render.ts`).
- **Sin botones muertos:** lo que todavía no funciona (favoritos, cuenta) no aparece hasta su fase.
- **Prompts que se integran solos:** cada prompt dice a la IA que mire primero el proyecto (Next.js, Astro, HTML…) y cómo encajar el efecto en cada caso (ver «Reglas de redacción de los prompts»).

### Niveles de complejidad

| Nivel | `difficulty` | Qué significa | Ejemplos de transición |
|---|---|---|---|
| Básico | 1 | Solo CSS o API nativa del navegador; se pega en cualquier web en minutos | Fundido nativo entre páginas |
| Intermedio | 2 | JavaScript propio o GSAP básico, sin 3D; necesita enganchar la navegación | Persianas desde el centro, cortina con borde curvo, pixelada |
| Avanzado | 3 | Coordina varias piezas (Flip, páginas en paralelo, WebGL) | Tarjeta que se convierte en página, páginas en paralelo, imagen con shader |

### Constructor de webs por partes

Esto es lo que diferencia a Kinetic Prompts: la app programa webs solo con elegir las partes. *(Decisión del 2026-11-26.)*

- **Apartados:** Fondos, Transiciones de página, Transiciones de objetos, Letras (tipografía y animación de texto), Heros, Scroll, Microinteracciones y 3D. Cada pieza es una tarjeta-botón que se ve y se copia sola, como en la galería.
- **Constructor (`/crear`):**
  - Se recorre un apartado por paso. En cada uno se elige una pieza o «Ninguna», con la misma tarjeta.
  - Un resumen «Tu web» va mostrando lo elegido.
  - Al final, un solo botón: **«Copiar el prompt de mi web»**.
- **El prompt de la web** se compone a partir de las piezas:
  - Un brief opcional (nombre del negocio y sector).
  - Cómo mirar el proyecto e integrar todo.
  - Una sección por pieza, con su prompt rellenado con los valores elegidos.
  - Reglas de convivencia: una sola transición de página y un solo fondo, un solo `prefers-reduced-motion` para todo, orden de carga y presupuesto de rendimiento.
- **Requisito para el contenido:** cada `prompt.md` tiene que poder incrustarse. El compositor quita su título y su línea de introducción, y baja sus `##` a `###` bajo «Pieza: …». Un test comprobará que el prompt compuesto no deja `{{variables}}` y contiene todas las piezas.
- **Letras** necesita un tipo de pieza nuevo, las parejas tipográficas (Google Fonts gratuitas), además de las animaciones de texto. Hay que investigarlas antes, con permiso para añadir fichas a `knowledge/`.
- **Orden propuesto:**
  1. Transiciones (en curso).
  2. Fondos.
  3. Letras.
  4. Constructor v1 en cuanto haya piezas en tres apartados.
  5. El resto de apartados se van sumando al constructor según existan.
- **Aspecto:** las tarjetas grandes que son el propio botón siguen el concepto de la referencia del usuario (The Prompts Factory), con la identidad visual propia de la «Regla de identidad».

### Los dos apartados

La app se divide en dos apartados con su propia galería, sus filtros y su plantilla de prompt. La navegación principal los muestra siempre: **Webs** y **Animaciones**.

| | Webs | Animaciones |
|---|---|---|
| Qué es | Una web completa diseñada por nosotros (home y páginas internas) | Un efecto suelto que se añade a cualquier web |
| Qué copia el usuario | Un prompt maestro para la web entera y un prompt por sección (hero, servicios, contacto…) | Un prompt para ese efecto, con sus parámetros |
| Vista previa | La web navegable dentro de un marco de navegador, en escritorio y móvil | El efecto en bucle, con botón Repetir |
| Parámetros | Nombre del negocio, ciudad, colores, tipografía, nivel | Duración, easing, colores, dirección |
| Filtros | Sector y nivel (comercial o cinematográfico) | Tipo de efecto y tecnología |

**Categorías de Webs (por sector):** barbería y estética, clínica y salud, despacho profesional, restaurante, inmobiliaria, gimnasio, producto y tecnología, portfolio. Cada web lleva una etiqueta de nivel:

- **Comercial profesional:** prioriza claridad, conversión, SEO y rendimiento.
- **Cinematográfica premium:** añade scroll narrativo, 3D y transiciones avanzadas.

**Categorías de Animaciones:**

| Categoría | Ejemplos |
|---|---|
| Transiciones de página | Cortina, fundido, morph de tarjeta a página, barrido diagonal |
| Scroll | Pin con progreso, parallax por capas, scroll horizontal, storytelling |
| Heros | Tipografía animada, vídeo enmascarado, objeto 3D |
| Letras (texto) | Split text, revelado por líneas, scramble; en el constructor, también parejas tipográficas |
| Microinteracciones | Botón magnético, cursor personalizado, hover con imagen |
| 3D / WebGL | Escena de producto, foto con volumen, configurador |
| Fondos | Shader de fondo, ruido, partículas, color en movimiento |
| Transiciones de objetos | Un producto que viaja entre secciones, objeto que se transforma, morph de formas, transformación por partículas |

Los dos apartados están conectados. Cada web enumera las animaciones que usa, con un enlace a su ficha en Animaciones, y cada animación muestra en qué webs aparece.

## Dirección estética

La dirección es una «sala de proyección»: fondo oscuro y sobrio, la interfaz en segundo plano y los efectos como protagonistas. Todo el color y el movimiento llamativo lo ponen las vistas previas; la interfaz solo acompaña.

### Color (tema oscuro por defecto)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0E0F12` | Fondo de la página (grafito, no negro puro) |
| `--surface` | `#16181D` | Tarjetas, paneles |
| `--surface-2` | `#1F2229` | Bloque del prompt, inputs, menús |
| `--border` | `#2A2E37` | Bordes de 1 px |
| `--text` | `#ECEDEF` | Texto principal |
| `--text-muted` | `#9095A0` | Texto secundario, metadatos |
| `--accent` | `#FF6B3D` | Un único acento: botón Copiar, enlaces activos, foco |
| `--success` | `#3DD68C` | «Copiado», estado VALIDADO |
| `--warning` | `#F5B841` | Límite de copias cerca |
| `--danger` | `#F2555A` | Errores |

El acento solo aparece en lo que se puede pulsar o en lo activo. Nunca se usa en fondos grandes ni degradados.

### Tipografía: estilo iOS 16

*(Cambio del 2026-11-26, a petición del usuario. Sustituye a Bricolage Grotesque e Instrument Sans.)*

- **Títulos y texto:** SF Pro, la letra de iOS 16, a través de la fuente del sistema (`-apple-system`) en iPhone, iPad y Mac. En el resto de sistemas, **Inter** (Google Fonts, licencia libre), que es muy parecida. SF Pro no se puede incrustar ni servir desde una web: su licencia de Apple lo prohíbe.
- **Títulos:** pesos 600–800, tracking −2 %. **Texto e interfaz:** pesos 400–600.
- **Prompts y código:** SF Mono en Apple y JetBrains Mono en el resto, 400, 14 px, interlineado 1,6.
- **Escala (px):** 12 · 14 · 16 · 20 · 28 · 40 · 64. Texto base 16 px; ancho máximo de párrafo 65 caracteres.

### Espaciado, forma y rejilla

- **Espaciado** en múltiplos de 4 px: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.
- **Radios:** 6 px en chips y botones, 12 px en tarjetas, 20 px en paneles grandes.
- **Rejilla:** ancho máximo 1440 px; márgenes laterales de 24 px en escritorio y 16 px en móvil.
- **Galería:**
  - 4 columnas por encima de 1280 px.
  - 3 columnas hasta 1024 px.
  - 2 columnas hasta 640 px.
  - 1 columna en móvil.
- **Tarjetas:** todas en proporción 16:10 y con la misma altura de pie.
- **Sombras:** casi ninguna. La profundidad se marca con bordes y con el cambio de `--surface` a `--surface-2`.

### Movimiento de la propia interfaz

| Momento | Duración | Comportamiento |
|---|---|---|
| Hover en tarjeta | 150 ms | Sube 2 px, el borde se aclara, la vista previa empieza a reproducirse |
| Menús, chips, toasts | 240 ms | Fundido + desplazamiento de 8 px |
| Tarjeta → ficha (momento firma) | 600 ms | La tarjeta se expande hasta la vista previa grande (View Transitions API, con GSAP Flip como alternativa) |
| Copiar prompt | 240 ms | El botón cambia a «Copiado ✓» durante 2 s |

- **Easing único:** `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Con `prefers-reduced-motion`:** las transiciones de la interfaz pasan a fundidos de 100 ms y las vistas previas muestran un fotograma estático con botón «Reproducir».

### Lo que hay que evitar

- Degradados morado-azul, brillos y glassmorphism.
- Emojis como iconos.
- Todo centrado.
- Más de un color de acento.
- Animar la interfaz por animar: el espectáculo está en las vistas previas.

**Iconos:** Lucide, trazo de 1,5 px, 20 px.

## Pantallas y componentes

La app tiene un inicio que presenta los dos apartados y, dentro de cada uno, la misma pareja de pantallas: Galería y Ficha. Ahí se juega la impresión de calidad.

### 1. Inicio y navegación

- **Cabecera fija de 64 px:**
  - Logo a la izquierda.
  - En el centro, el selector de apartado **Webs | Animaciones**, como un control segmentado. El apartado activo va relleno con `--surface-2` y el texto en `--text`.
  - Buscador (atajo `/`), que busca dentro del apartado activo.
  - Favoritos, plan y avatar a la derecha.
  - Al hacer scroll, la cabecera se vuelve translúcida con desenfoque de 12 px.
- **Inicio (`/`):** un titular de una línea y dos bloques grandes lado a lado, «Webs» y «Animaciones». Cada bloque tiene un vídeo de fondo, el número de prompts y el botón Explorar. Debajo, las novedades de cada apartado en dos filas de tarjetas.
- **En móvil:** el selector Webs | Animaciones pasa a una barra inferior fija con dos pestañas.

### 2. Galería de cada apartado (`/webs` y `/animaciones`)

- **Introducción breve, de 160 px de alto como máximo:** nombre del apartado y una frase. Las tarjetas se ven sin hacer scroll.
- **Galería de Webs:**
  - Chips de sector (barbería, clínica, despacho…).
  - Filtro de nivel: Comercial o Cinematográfica.
  - Rejilla de 3 columnas en escritorio, con tarjetas más grandes, porque una web necesita más superficie para leerse.
- **Galería de Animaciones:**
  - Chips de tipo (transiciones, scroll, texto…).
  - Filtro de tecnología (CSS, GSAP, Lenis, Three.js).
  - Rejilla de 4 columnas en escritorio.
- **Orden en ambas:** Nuevos o Más copiados.
- **Carga progresiva al hacer scroll**, con botón «Cargar más» como respaldo.

### 3. Tarjeta

- Vista previa 16:10: vídeo en bucle WebM/MP4, sin sonido, de 4 a 8 s y menos de 600 KB.
- **Reproducción:**
  - Solo cuando la tarjeta es visible (IntersectionObserver).
  - En escritorio, al pasar el ratón.
  - Si no, muestra el póster estático.
- **Pie de la tarjeta:**
  - Nombre del efecto.
  - Chips de tecnología (máximo 3).
  - Botón **Copiar** (`CopyButton`, variante secundaria): copia el prompt con los valores por defecto sin abrir la ficha.
  - Botón de favorito con forma de corazón.
- Etiqueta «Nuevo» durante 14 días.
- Estados: reposo, hover, foco de teclado (anillo de 2 px en `--accent`) y cargando (shimmer sobre `--surface-2`).

En Webs hay tres diferencias: el vídeo de la tarjeta es un recorrido de scroll por la home, el pie muestra sector y nivel en lugar de tecnologías, y su botón Copiar copia el prompt maestro.

### 4. Ficha de animación

Es la pantalla más importante. En escritorio se divide en dos columnas: 60 % vista previa y 40 % panel.

- **Vista previa en vivo:**
  - El efecto real dentro de un iframe aislado (`sandbox`).
  - Controles: Repetir, Escritorio/Móvil y Pantalla completa.
- **Cabecera del panel:**
  - Nombre y categoría.
  - Chips de tecnología.
  - Dificultad (1–3 puntos).
  - Indicador de rendimiento: Ligero / Medio / Pesado.
- **Parámetros:** controles (sliders, selectores de color y de easing) que reescriben el prompt al momento, resaltando en `--accent` lo que cambia.
- **Bloque del prompt:**
  - Fondo `--surface-2` y JetBrains Mono.
  - Pestañas «Prompt», «Qué incluye» y «Cómo usarlo».
  - Botón grande **Copiar prompt** (`CopyButton` primario), fijo al hacer scroll.
- Contador visible: «12 de 30 copias este mes».
- Efectos relacionados (4 tarjetas).
- **En móvil:**
  - Vista previa arriba y panel debajo.
  - Botón Copiar fijo en la parte inferior, sobre la zona segura.

### 5. Ficha de web

Tiene la misma estructura de dos columnas, con estos cambios:

- **Vista previa:**
  - La web entera, navegable dentro de un marco de navegador con barra de dirección falsa.
  - Selector Escritorio/Tablet/Móvil.
  - Lista de páginas para saltar entre la home y las internas.
- **Cabecera del panel:**
  - Sector y nivel.
  - Número de secciones y de páginas.
  - Animaciones que usa, como chips enlazados a sus fichas.
- **Parámetros de personalización:**
  - Nombre del negocio.
  - Ciudad.
  - Paleta (3 colores).
  - Pareja tipográfica.
  - Idioma.
  - El prompt se reescribe con esos datos.
- **Bloque del prompt con dos niveles:**
  - **Prompt maestro:** construye la web completa.
  - **Prompts por sección:** Hero, Servicios, Sobre nosotros, Reseñas, Galería, Precios, Ubicación, Contacto y Pie. Se muestran como acordeón, cada uno con su botón Copiar, para rehacer o añadir solo una parte.
- **Al pasar el ratón por una sección del acordeón,** la vista previa hace scroll hasta esa sección y la resalta con un borde de `--accent`.

### 6. Favoritos

- Dos pestañas, Webs y Animaciones, con la misma cuadrícula que sus galerías.
- Sin cuenta, se guardan en el navegador. Al iniciar sesión, se pasan a la cuenta.

### 7. Cuenta, planes y páginas legales

- **Cuenta:** perfil, plan actual, copias del mes y botón de mejorar plan.
- **Planes:** dos o tres columnas comparativas, con el plan recomendado destacado solo con un borde en `--accent`.
- **Páginas legales:** Acerca de, Privacidad, Términos, Reembolsos y Contacto, con una plantilla de lectura de 680 px de ancho.

### Estados que siempre hay que diseñar

| Situación | Qué se muestra |
|---|---|
| Sin resultados de búsqueda | Mensaje con la palabra buscada y 3 categorías sugeridas |
| Copiar sin sesión | Panel lateral «Inicia sesión con Google para copiar», sin perder la ficha |
| Copia fallida | El botón pasa a «Reintentar» y un aviso dice qué falló (portapapeles bloqueado o red) y cómo seguir |
| Límite alcanzado | Aviso en `--warning` con la fecha de renovación y el botón de plan |
| Error de carga | Mensaje que explica qué falló y botón Reintentar |
| Sin JavaScript | Pósteres estáticos y texto informativo legible |

## Anatomía de la ficha y plantilla de prompt

Cada elemento del catálogo es una carpeta dentro de su apartado: `content/webs/<slug>/` o `content/animaciones/<slug>/`. Las dos tienen los mismos cuatro archivos:

- `item.json`: los datos.
- `prompt.md`: el prompt con variables. Las webs tienen además una carpeta `sections/` con un `.md` por sección.
- `preview/`: la demo en vivo. En Webs es la web completa, con todas sus páginas.
- `media/`: el vídeo en bucle y el póster.

Además, cada carpeta lleva un `CONSULTA_BIBLIOTECA.md` con las fichas leídas y la decisión que salió de cada una (ver `docs/BIBLIOTECA_CONSULTA.md`). La app no lo lee.

La app lee esas carpetas; no hay contenido escrito a mano dentro de los componentes.

### Modelo de datos de una animación (`item.json`)

```json
{
  "section": "animaciones",
  "slug": "page-transition-curtain",
  "title": "Transición cortina",
  "summary": "Una cortina de color sube con el borde curvo y deja ver la página nueva.",
  "category": "transiciones",
  "tech": ["GSAP", "Next.js"],
  "difficulty": 2,
  "performance": "ligero",
  "status": "VALIDADO",
  "knowledgeRefs": ["knowledge/transitions/MENU-001-menu-curvo-svg.md"],
  "usedIn": ["barberia-norte"],
  "params": [
    { "id": "duration", "label": "Duración", "type": "range", "min": 0.4, "max": 1.6, "step": 0.1, "default": 0.9, "unit": "s" },
    { "id": "color", "label": "Color de la cortina", "type": "color", "default": "#FF6B3D" },
    { "id": "ease", "label": "Easing", "type": "select", "options": ["power3.inOut", "expo.inOut", "sine.inOut"], "default": "power3.inOut" }
  ],
  "media": { "video": "media/loop.webm", "videoMp4": "media/loop.mp4", "poster": "media/poster.webp" },
  "createdAt": "2026-11-26"
}
```

### Modelo de datos de una web (`item.json`)

```json
{
  "section": "webs",
  "slug": "barberia-norte",
  "title": "Barbería Norte",
  "sector": "barberia",
  "level": "comercial",
  "pages": ["home", "servicios", "reservar", "contacto"],
  "sections": ["hero", "servicios", "sobre-nosotros", "resenas", "galeria", "precios", "ubicacion", "contacto", "pie"],
  "animations": ["page-transition-curtain", "text-split-reveal", "button-magnetic"],
  "tech": ["Next.js", "Tailwind", "GSAP"],
  "status": "VALIDADO",
  "knowledgeRefs": ["knowledge/architecture/ARCH-001-receta-pagina-completa.md", "knowledge/ux/UX-002-pagina-de-inicio-de-negocio.md"],
  "params": [
    { "id": "businessName", "label": "Nombre del negocio", "type": "text", "default": "Barbería Norte" },
    { "id": "city", "label": "Ciudad", "type": "text", "default": "Madrid" },
    { "id": "palette", "label": "Paleta", "type": "palette", "default": ["#111111", "#F4EFE6", "#C8A15A"] },
    { "id": "fonts", "label": "Tipografías", "type": "select", "options": ["Clásica", "Moderna", "Editorial"], "default": "Clásica" },
    { "id": "language", "label": "Idioma", "type": "select", "options": ["es", "en"], "default": "es" }
  ],
  "media": { "video": "media/scroll.webm", "poster": "media/poster.webp" },
  "createdAt": "2026-11-26"
}
```

### Estado y `statusReason`

Los dos modelos comparten estos campos de estado:

- `status`: `IMPLEMENTADO` (demo y prompts escritos, sin validar), `VALIDADO` (pasa `kp-validar`) o `NO VERIFICADO` (no pasa, o no se ha podido comprobar). Solo `kp-validar` pone `VALIDADO` o `NO VERIFICADO`.
- `statusReason` (texto): obligatorio cuando `status` es `NO VERIFICADO`; explica qué falló o qué no se pudo comprobar, y qué haría falta. Se omite en los demás estados.

Ejemplo de un elemento que no pasa la validación:

```json
{
  "status": "NO VERIFICADO",
  "statusReason": "El vídeo pesa 740 KB (límite 600 KB) incluso a 960×600; hace falta acortar el bucle a 5 s."
}
```

### Plantilla de prompt para animaciones (`prompt.md`)

Todas las animaciones siguen estas nueve secciones, en este orden. Las variables entre `{{ }}` se sustituyen con los parámetros que elige el usuario.

```markdown
# {{title}}

## 1. Objetivo visual
Describe en 2–3 frases qué ve el usuario final, de principio a fin.

## 2. Stack
Tecnologías y versiones exactas (p. ej. GSAP 3.x con el plugin Flip).

## 3. Estructura
HTML/componentes necesarios, con nombres de clases o props.

## 4. Comportamiento paso a paso
1. Disparador (clic, scroll, carga).
2. Secuencia con tiempos: duración {{duration}}s, easing {{ease}}.
3. Estado final y limpieza.

## 5. Parámetros configurables
Lista de variables con su valor por defecto.

## 6. Responsive
Qué cambia por debajo de 768 px y en pantallas táctiles.

## 7. Accesibilidad
Comportamiento con prefers-reduced-motion, foco y lectores de pantalla.

## 8. Rendimiento
Animar solo transform y opacity; limpiar listeners y timelines al desmontar.

## 9. Criterios de validación
Lista de comprobaciones que demuestran que funciona.
```

### Plantilla de prompt para webs

Cada web tiene un **prompt maestro** (`prompt.md`), que construye la web completa, y un prompt por sección en `sections/` (por ejemplo `sections/hero.md`). Los prompts de sección siguen el mismo esquema que el punto 5 del maestro, para poder usarse solos.

```markdown
# Web {{title}} para {{businessName}} ({{city}})

## 1. Brief
Sector, objetivo principal de la web (reservas, llamadas, formulario) y público.

## 2. Identidad visual
Paleta {{palette}}, pareja tipográfica {{fonts}}, tono de los textos y estilo de fotografía.

## 3. Stack y estructura del proyecto
Tecnologías exactas y árbol de carpetas.

## 4. Mapa del sitio
Páginas y navegación (cabecera, menú móvil, pie).

## 5. Home, sección por sección
Para cada sección: objetivo, contenido, maquetación en escritorio y en móvil, y animación.
- Hero
- Servicios
- Sobre nosotros
- Reseñas (espacio para reseñas reales del negocio, nunca inventadas)
- Galería
- Precios
- Ubicación y horario
- Contacto / reserva
- Pie

## 6. Páginas internas
Estructura de cada página adicional.

## 7. Animaciones
Lista de animaciones usadas, con sus parámetros (cada una enlaza a su prompt del apartado Animaciones).

## 8. Responsive, accesibilidad y rendimiento
Cortes de pantalla, prefers-reduced-motion, contraste y objetivos de Lighthouse.

## 9. SEO
Títulos y descripciones, datos estructurados LocalBusiness y SEO local para {{city}}.

## 10. Criterios de validación
Comprobaciones para dar la web por terminada.
```

### Reglas de redacción de los prompts

- **Frases imperativas y concretas:** «Anima `y` de 100 % a 0 % en 0,9 s», no «haz una animación bonita».
- **Valores con unidades** siempre.
- **Sin código copiado de tutoriales:** el prompt describe; el código lo genera la IA del usuario. Las demos de `preview/` tampoco copian código: se implementan desde cero a partir del procedimiento de la ficha, aunque la fuente tenga licencia MIT.
- **Fuentes:** cada prompt enlaza internamente a su ficha de la biblioteca (`knowledgeRefs`), que conserva las referencias a las fuentes originales.
- **Integración según el proyecto:** el apartado «Estructura» empieza pidiendo a la IA que mire el proyecto (framework, enrutado, si ya hay GSAP) y dice cómo encajar el efecto en cada caso: Next.js (App Router), Astro y HTML de varias páginas. Así el usuario no tiene que traducir nada.
- **Sin dependencias si se puede:** si el efecto sale bien con CSS o JavaScript propio, el prompt no pide librerías; si las pide, con versión exacta.

## Stack y arquitectura

La app va en Next.js con TypeScript y Tailwind. Usa Supabase para el login y los datos de usuario, y Stripe para los planes. El contenido de los efectos vive en archivos del repositorio, no en la base de datos.

| Capa | Elección | Motivo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Páginas indexables por efecto (SEO) y rutas de API |
| Estilos | Tailwind con los tokens de «Dirección estética» como variables CSS | Un solo origen de verdad para el diseño |
| Componentes base | Radix UI (diálogos, pestañas, menús) | Accesibilidad resuelta |
| Animación de la interfaz | View Transitions API + GSAP Flip como alternativa | La transición tarjeta → ficha |
| Animación de las demos | GSAP, ScrollTrigger, Lenis, Three.js según el efecto | Lo que dicte la ficha de la biblioteca |
| Login | Supabase Auth con Google y flujo **PKCE** | Los tokens nunca aparecen en la URL |
| Datos de usuario | Supabase Postgres con Row Level Security | Favoritos, copias y plan, protegidos por usuario |
| Pagos | Stripe Checkout + webhooks | Planes y límite de copias |
| Pruebas | Vitest (lógica) + Playwright (navegación y capturas) | Validación visual automática |
| Despliegue | Vercel | Vistas previas por rama |

### Estructura de carpetas

```text
/app                   rutas: /, /webs, /webs/[slug], /animaciones, /animaciones/[slug],
                       /favoritos, /cuenta, /planes, /legal/*
/components            ui/ (botones, chips, inputs) · gallery/ · item/ · web/ · animation/ · layout/
/content/webs          una carpeta por web (item.json, prompt.md, sections/, preview/, media/)
/content/animaciones   una carpeta por animación (item.json, prompt.md, preview/, media/)
/lib                   supabase/, stripe/, prompt-render.ts (sustituye {{variables}}), content.ts
/styles                tokens.css (variables de color, tipo y espaciado)
/knowledge             copia de WEB_ENGINEERING_KNOWLEDGE_LIBRARY (solo lectura)
/.claude/skills        skills del proyecto (ver sección siguiente)
/tests                 e2e/ y visual/ (capturas de referencia)
/docs/PLAN.md          este documento
```

### Tablas en Supabase

| Tabla | Campos principales |
|---|---|
| `profiles` | id, email, nombre, avatar, plan, creado |
| `favorites` | user_id, section (webs o animaciones), slug, creado |
| `copies` | user_id, section, slug, tipo (maestro o sección), fecha (para contar el límite mensual) |
| `subscriptions` | user_id, stripe_customer_id, estado, renovación |

### Seguridad

- **El límite de copias se comprueba en el servidor.** Una ruta de API registra la copia y devuelve el texto del prompt. El prompt completo no viaja al navegador hasta que se permite copiarlo.
- **Las demos se ejecutan en iframes con `sandbox`**, sin acceso a las cookies de la app.
- **Las claves de Supabase y Stripe van solo en variables de entorno.** Nunca se suben al repositorio.

## Integración con la biblioteca y Skills

Claude Code no carga la biblioteca entera. Lee `knowledge/KNOWLEDGE_INDEX.md`, localiza la ficha que necesita y solo abre esa. Las instrucciones especializadas van en Skills que se cargan bajo demanda.

El orden de consulta (índice → ARCH-001 → `integration/LIBRARY_MANIFEST.json` → fichas), las incompatibilidades conocidas y las reglas de licencias están en `docs/BIBLIOTECA_CONSULTA.md`, adaptados de la Skill `web-library-router` de la biblioteca. Las Skills propias de la biblioteca están en `knowledge/_skills_propuestas/`, fuera de `.claude/`, para que no se activen solas.

Carpetas de la biblioteca que usa el apartado Webs: `architecture/` y `recetas/` (proyectos completos, casos y recetas), `ux/` (UI/UX), `seo/` y `accessibility/`.

### CLAUDE.md del proyecto (corto, unas 30 líneas)

```markdown
# Kinetic Prompts

- Plan completo: docs/PLAN.md. Léelo antes de cada fase.
- La app tiene dos apartados: Webs y Animaciones. Cada elemento vive en
  content/webs/<slug>/ o content/animaciones/<slug>/. Nunca escribas prompts dentro de componentes.
- Biblioteca: knowledge/. Empieza siempre por knowledge/KNOWLEDGE_INDEX.md.
  No la cargues entera. Es de solo lectura: no la modifiques salvo RESEARCH_PROGRESS.md.
- Diseño: usa solo los tokens de styles/tokens.css. Prohibido escribir colores o tamaños sueltos.
- Publicación: solo los elementos con status VALIDADO aparecen en las galerías.
- Antes de dar algo por terminado: npm run lint, npm run test y npm run test:e2e en verde,
  y revisa las capturas de Playwright.
- Distingue siempre código propuesto de código probado.
- Idioma de la interfaz: español.
```

### Skills del proyecto (`.claude/skills/`)

| Skill | Cuándo se usa | Qué hace |
|---|---|---|
| `kp-design-system` | Al crear o tocar cualquier componente de la app | Recuerda tokens, escala tipográfica, estados obligatorios y lo que hay que evitar |
| `kp-crear-animacion` | Al añadir una animación al apartado Animaciones | Busca la ficha en la biblioteca, construye la demo en `preview/` y escribe `item.json` y `prompt.md` con la plantilla de animaciones |
| `kp-crear-web` | Al añadir una web al apartado Webs | Diseña y construye la web completa en `preview/`, reutiliza animaciones del catálogo, y escribe el prompt maestro y los prompts por sección con la plantilla de webs |
| `kp-validar` | Tras crear o cambiar una web o una animación | Ejecuta Playwright, graba el vídeo y el póster, comprueba rendimiento y `prefers-reduced-motion`, y cambia el estado a VALIDADO o explica por qué no |
| `kp-revision-visual` | Al cerrar cada fase | Hace capturas a 375, 768, 1280 y 1440 px y las compara con la checklist de calidad |
| `gsap` (oficial, si está disponible) | Cuando una demo usa GSAP | API y buenas prácticas de GSAP. Nuestras fichas lo complementan, no lo sustituyen |

### Flujo para cada web o animación nueva

1. Elige una ficha de la biblioteca en estado INVESTIGADO, PROPUESTO o IMPLEMENTADO. Para una web, una ficha de `architecture/` o `recetas/` (casos, recetas y la receta de página completa ARCH-001) o un sector de los dos niveles de producción.
2. Usa `kp-crear-animacion` o `kp-crear-web`: implementa la demo y escribe los prompts (estado IMPLEMENTADO).
3. `kp-validar`: pruebas, vídeo y póster (estado VALIDADO, o NO VERIFICADO con el motivo en `statusReason`).
4. Anota el resultado en `knowledge/RESEARCH_PROGRESS.md`.
5. Solo los elementos VALIDADO aparecen en las galerías.

## Prompts para Claude Code

Nueve prompts, uno por fase, para pegar en orden. Cada uno termina con criterios de cierre: si no se cumplen, se pide a Claude Code que los corrija antes de seguir. Las animaciones se cargan antes que las webs, porque las webs las reutilizan. Al final hay dos prompts reutilizables: uno para añadir una animación y otro para añadir una web.

### Fase 0: Preparación del proyecto

```text
Lee docs/PLAN.md entero. Vamos a construir Kinetic Prompts siguiendo ese plan.
La app tiene dos apartados: Webs (prompts para desarrollar nuestras webs completas)
y Animaciones (prompts para desarrollar nuestras animaciones).

Tarea de esta fase:
1. Crea un proyecto Next.js (App Router) con TypeScript, Tailwind, ESLint y Prettier.
2. Crea la estructura de carpetas exacta de la sección "Stack y arquitectura",
   con content/webs/ y content/animaciones/.
3. Crea CLAUDE.md con el contenido de la sección "Integración con la biblioteca y Skills".
4. Crea las Skills kp-design-system, kp-crear-animacion, kp-crear-web, kp-validar y kp-revision-visual
   en .claude/skills/, cada una con su SKILL.md. Redacta sus instrucciones a partir de este plan.
5. Lee knowledge/KNOWLEDGE_INDEX.md y dame un resumen en dos bloques:
   - Fichas útiles para Animaciones, por categoría.
   - Fichas útiles para Webs (architecture/ y recetas/, ux/, seo/).
   Incluye cuántas hay en cada estado (INVESTIGADO, PROPUESTO, IMPLEMENTADO, VALIDADO, NO VERIFICADO).
6. Configura Vitest y Playwright con un test de humo que abra la página de inicio.

No construyas todavía ninguna pantalla.

Criterios de cierre:
- npm run dev arranca sin errores.
- npm run lint y npm run test pasan.
- Me entregas el resumen de la biblioteca.
```

### Fase 1: Sistema de diseño

```text
Usa la skill kp-design-system. Implementa el sistema de diseño de la sección
"Dirección estética" de docs/PLAN.md.

1. styles/tokens.css: todas las variables de color, tipografía, espaciado, radios y easing.
   Conéctalas a tailwind.config para usarlas como clases.
2. Carga Bricolage Grotesque, Instrument Sans y JetBrains Mono con next/font.
3. Crea en components/ui/: Button (primario, secundario, fantasma), Chip (normal, activo),
   IconButton, Input, SearchField, Tabs, Slider, ColorPicker, Select, Toast, Skeleton y Tooltip.
   Usa Radix UI donde aplique.
4. Todos los componentes tienen estados de reposo, hover, foco visible (anillo de 2 px con --accent),
   activo, deshabilitado y cargando.
5. Crea la ruta /design (solo en desarrollo) que muestre todos los componentes y estados,
   la paleta y la escala tipográfica.
6. Respeta prefers-reduced-motion en todas las transiciones.

Prohibido: colores o tamaños fuera de los tokens, degradados, sombras grandes, emojis.

Criterios de cierre:
- /design muestra todo sin errores de consola.
- Capturas de Playwright de /design a 375 y 1440 px. Revísalas tú mismo y corrige lo que se vea mal.
- Contraste de texto mínimo 4,5:1 (comprueba --text-muted sobre --surface).
```

**Notas de implementación (2026-11-26)** · Tailwind 4 no usa `tailwind.config`: los tokens de `styles/tokens.css` se conectan a las clases con `@theme` en `app/globals.css`, que además vacía los valores por defecto de Tailwind. Las clases y las variantes de estado (`kp-hover`, `kp-focus`, `kp-active`) están documentadas en la Skill `kp-design-system`. `styles/guardia.test.ts` comprueba la lista «Prohibido» en cada `npm run test`.

**Ampliación (2026-11-26): el botón de copia como cimiento.** Ver «Principio rector: el botón de copia».

- `components/ui/copy-button.tsx` (`CopyButton`), `components/ui/copy-provider.tsx` (`CopyProvider`, dentro de `UIProviders`) y `lib/clipboard.ts`.
- `/design` abre con la sección «Botón de copia». Contiene:
  - Las matrices de los dos usos, tarjeta y ficha, con sus ocho estados.
  - Una botonera de prueba con un botón por categoría, Fondos incluida.
  - Un selector para simular cómo llega el prompt: directo, servidor, sin sesión, límite y fallo de red.

### Fase 2: Inicio y galerías de Webs y Animaciones

```text
Usa kp-design-system. Construye el Inicio y las dos galerías (pantallas 1, 2 y 3 de docs/PLAN.md).

1. Layout con la cabecera fija de 64 px:
   - Logo.
   - Selector segmentado Webs | Animaciones.
   - Buscador con atajo "/" que busca en el apartado activo.
   - Favoritos y avatar.
   Al hacer scroll se vuelve translúcida con desenfoque de 12 px.
   En móvil, el selector pasa a una barra inferior fija con dos pestañas.
2. Inicio (/):
   - Titular de una línea.
   - Dos bloques grandes lado a lado, Webs y Animaciones, cada uno con vídeo de fondo,
     número de prompts y botón Explorar.
   - Debajo, dos filas de novedades, una por apartado.
3. /webs:
   - Chips de sector y filtro de nivel (Comercial / Cinematográfica).
   - Rejilla de 3 columnas en escritorio, 2 en tablet y 1 en móvil.
4. /animaciones:
   - Chips de tipo (las 7 categorías, Fondos incluida) y filtro de tecnología.
   - Rejilla de 4, 3, 2 y 1 columnas según los cortes del plan.
5. Los filtros se reflejan en la URL (?cat=&nivel=&tech=&sort=).
6. ItemCard, un solo componente con variante "web" y "animacion":
   - Vista previa 16:10 con vídeo en bucle que se reproduce solo cuando es visible
     (IntersectionObserver) o con hover en escritorio. Si no, muestra el póster.
   - Pie con el nombre, hasta 3 chips (tecnología en animaciones, sector y nivel en webs),
     el botón Copiar y el corazón de favorito.
   - Botón Copiar: CopyButton de components/ui, variante secundaria, label "Copiar".
     Un clic copia el prompt con los valores por defecto (en webs, el prompt maestro)
     y muestra "Copiado ✓" 2 s, sin abrir la ficha. Por ahora copia sin login.
   - Etiqueta "Nuevo" durante 14 días.
   - Todas las tarjetas de una rejilla tienen la misma altura.
7. lib/content.ts lee content/webs/*/item.json y content/animaciones/*/item.json
   y muestra solo los elementos con status VALIDADO.
   Crea 4 webs y 6 animaciones de ejemplo, con "demo": true, pósteres de color sólido
   y un prompt.md de prueba para que el botón Copiar copie algo real.
   Se borrarán en las fases 4 y 5.
8. Diseña los estados sin resultados, cargando (skeleton) y error.

Criterios de cierre:
- Con 30 tarjetas, el scroll va a 60 fps (graba una traza de rendimiento en Playwright).
- Nunca hay más de 6 vídeos reproduciéndose a la vez.
- Test e2e: un clic en Copiar de una tarjeta deja su prompt en el portapapeles, muestra
  "Copiado ✓" y no navega a la ficha.
- Capturas del inicio y de las dos galerías a 375, 768, 1280 y 1440 px,
  revisadas con kp-revision-visual.
```

### Fase 3: Fichas de animación y de web, y transición firma

```text
Usa kp-design-system. Construye las dos fichas (pantallas 4 y 5 de docs/PLAN.md):
/animaciones/[slug] y /webs/[slug]. Comparten el layout; cambian la vista previa y el bloque del prompt.

Parte común:
1. Escritorio: dos columnas, 60 % vista previa y 40 % panel. Móvil: vista previa arriba y panel debajo.
2. Parámetros generados desde item.json (range, color, palette, select, text).
3. lib/prompt-render.ts sustituye las {{variables}} con los valores de los parámetros.
   Al cambiar un parámetro, el texto cambiado parpadea en --accent durante 600 ms.
   Los parámetros también se envían a la demo con postMessage para que se actualice.
4. Botón Copiar grande (CopyButton primario, size "lg"), fijo al hacer scroll (en móvil, abajo con safe-area).
   Copia el prompt con los parámetros elegidos y cambia a "Copiado ✓" durante 2 s.
   Por ahora copia sin login; el límite llega en la fase 6.
5. Relacionados: 4 tarjetas del mismo apartado.
6. Metadatos SEO por ficha: title, description, Open Graph con el póster.

Ficha de animación:
7. Vista previa en vivo: preview/index.html en un iframe con sandbox.
   Controles: Repetir, Escritorio/Móvil (390 px) y Pantalla completa.
8. Bloque del prompt con pestañas Prompt / Qué incluye / Cómo usarlo.
9. Lista "Se usa en estas webs", con enlaces a las fichas de web (campo usedIn).

Ficha de web:
10. Vista previa: la web completa en un iframe con sandbox, dentro de un marco de navegador
    con barra de dirección falsa.
    - Selector Escritorio/Tablet/Móvil.
    - Lista de páginas para navegar entre ellas.
11. Cabecera del panel con sector, nivel, número de páginas y secciones, y las animaciones
    que usa como chips enlazados a sus fichas.
12. Bloque del prompt:
    - Arriba, el prompt maestro con su botón Copiar.
    - Debajo, un acordeón con un prompt por sección (sections/*.md), cada uno con su botón Copiar.
    - Al pasar el ratón por una sección del acordeón, la vista previa hace scroll hasta ella
      y la resalta con un borde de --accent (mensaje postMessage al iframe).

Transición firma:
13. Al abrir una tarjeta, su vista previa se expande hasta la vista previa de la ficha
    en 600 ms con cubic-bezier(0.2, 0.8, 0.2, 1).
    Usa la View Transitions API, con GSAP Flip como alternativa si el navegador no la soporta.
    Con prefers-reduced-motion, un fundido de 100 ms.

Criterios de cierre:
- La transición se ve fluida en Chrome y Safari, y funciona también el botón Atrás.
- El prompt copiado coincide exactamente con lo mostrado (test de Vitest sobre prompt-render).
- Capturas de las dos fichas a 375 y 1440 px, revisadas con kp-revision-visual.
```

### Fase 4: Las primeras 10 animaciones

```text
Usa las skills kp-crear-animacion y kp-validar.

1. Borra las animaciones con "demo": true.
2. Lee knowledge/KNOWLEDGE_INDEX.md y propón 10 animaciones para el lanzamiento:
   3 transiciones de página, 2 de scroll, 2 de texto, 1 hero, 1 microinteracción y 1 de 3D/WebGL.
   Elige las de mayor valor visual que tengan una ficha con procedimiento claro,
   y las que más sirvan para las webs de la fase 5.
   Enséñame la lista y espera mi aprobación.
3. Para cada animación aprobada, de una en una:
   a. Lee solo su ficha (y las que esta enlace).
   b. Construye la demo autocontenida en preview/index.html. Debe escuchar postMessage para los parámetros.
   c. Escribe item.json y prompt.md con la plantilla de animaciones de docs/PLAN.md.
   d. Valida:
      - Graba con Playwright un bucle de 4–8 s en WebM, de menos de 600 KB.
      - Saca un póster WebP de menos de 80 KB.
      - Comprueba prefers-reduced-motion y que la consola no tenga errores.
   e. Si pasa, pon status VALIDADO. Si no, NO VERIFICADO con el motivo en statusReason.
   f. Actualiza knowledge/RESEARCH_PROGRESS.md.
4. No copies código de tutoriales: impleméntalo a partir del procedimiento de la ficha.

Criterios de cierre:
- Al menos 8 de 10 animaciones en estado VALIDADO.
- Tabla final con cada animación, su estado, el peso del vídeo y las incidencias.
```

**Transiciones primero (2026-11-26).** Por decisión del usuario, estos días se adelantan las transiciones. Son de varios niveles de complejidad: las de la biblioteca y alguna más. El orden lo elige Claude Code.

- Se construye una **galería mínima** de `/animaciones`, que es un adelanto de la fase 2. Tiene tarjetas que se ven y se copian, filtro por nivel y los tres pasos de uso. Cada transición validada aparece ahí.
- Hoja de ruta:

  | Nivel | Transición | Ficha |
  |---|---|---|
  | Intermedio | Persianas desde el centro | MASK-002 (IMPLEMENTADO en la biblioteca) |
  | Básico | Fundido nativo entre páginas | CSS-002 |
  | Avanzado | Tarjeta que se convierte en página | FLIP-001 |
  | Intermedio | Cortina con borde curvo | MENU-001 |
  | Intermedio | Pixelada | PIX-001 |
  | Avanzado | Páginas en paralelo | PT-001 |
  | Avanzado | Escala y giro entre secciones | SECT-001 |
  | Avanzado | Imagen con shader | GL-002 |

- «Alguna más»: las transiciones que no tengan ficha necesitan investigarse antes, y añadir fichas a `knowledge/` requiere permiso del usuario.
- Las de página siguen el patrón **cubrir → cambiar → descubrir**, que encaja con cualquier enrutador: la capa tapa la página al pulsar un enlace, se navega y se destapa al cargar la nueva.

**Pendientes apuntados por el usuario (2026-11-26):**

- **Fondos, en marcha (2026-11-28).** Primera pieza: «Manchas de color en movimiento» (básico, solo CSS, ficha nueva FONDO-001). Segunda: «Constelación de partículas» (intermedio, canvas 2D, ficha nueva FONDO-002). Tercera: «Olas de luz» (avanzado, shader WebGL sin librerías, ficha nueva FONDO-003). Fondos tiene ya los tres niveles.
- **Permiso para ampliar la biblioteca (2026-11-26).** Se pueden añadir fichas nuevas a `knowledge/` (con la plantilla `_templates/FICHA_TECNICA.md`, fuentes conservadas y estado INVESTIGADO o PROPUESTO) para Fondos, Letras y transiciones que no tengan ficha. Las fichas existentes no se modifican.

- **Transiciones de objetos.** Es un apartado propio (`objetos`), distinto de las transiciones de página: un objeto que viaja, se transforma o une dos secciones. La biblioteca tiene buen material, cuatro de ellas en estado IMPLEMENTADO:

  | Ficha | Qué aporta |
  |---|---|
  | CONT-001 | Continuidad del protagonista entre escenas (IMPLEMENTADO) |
  | REC-001 | Objeto que conecta dos secciones (IMPLEMENTADO) |
  | REC-002 | Transformación por partículas (IMPLEMENTADO) |
  | REC-003 | Producto fijo con el entorno cambiante (IMPLEMENTADO) |
  | TRN-001 | Matriz de transformaciones de producto y escena |
  | MORPH-001 | Morph de formas SVG |
  | SEQ-001 y SEQ-003 | Objeto continuo con secuencia de fotogramas |
  | MOT-002 | Movimiento de producto cinematográfico |

  Hecho: «Objeto que une dos secciones» (REC-001 + CONT-001, avanzado, VALIDADO). Ya con imágenes reales generadas con IA por el usuario (encargo en `docs/ENCARGO_IMAGENES_REC001.md`; recursos en `preview/recursos/`). Siguen MORPH-001 (morph de formas, básico o intermedio), REC-003 (producto fijo, entorno cambiante) y REC-002 (partículas, avanzado).
- **Todo efecto se puede cambiar de color.** Cada elemento del catálogo tiene al menos una opción de tipo `color` o `palette`; lo comprueba `lib/content.test.ts`. Hecho en los cuatro efectos actuales: el fundido nativo funde a través de un color y la tarjeta que se convierte en página elige el color de su detalle.

**Notas aprobadas (2026-11-26)** · candidatas de `docs/BIBLIOTECA_FASE0.md`, para proponer la lista del paso 2:

| Hueco | Candidatas |
|---|---|
| Transiciones (3) | MASK-002 (barrido de persianas), FLIP-001 (morph de tarjeta a página), CSS-002 (fundido), MENU-001 (cortina con borde curvo) |
| Scroll (2) | GS-005 (pin con progreso), ZOOM-001 (zoom parallax), CARD-001 (pila de tarjetas) |
| Texto (2) | TXT-002 (revelado por líneas, con TXT-001 para la división) y **TXT-003 (scramble) como segunda animación de texto** |
| Hero (1) | MASK-001 (imagen o vídeo enmascarado), TXT3D-001 (tipografía 3D) |
| Microinteracción (1) | HOV-001 (botón magnético) |
| 3D / WebGL (1) | GL-003 (foto con volumen), GL-002 (transición de imagen con shader) |

- «Contador» no forma parte de las animaciones de texto.
- Las demos de `preview/` se implementan desde cero a partir del procedimiento de la ficha, sin copiar código de la fuente, aunque tenga licencia MIT; con las fuentes sin licencia, ni fragmentos.
- La consulta de cada ficha sigue `docs/BIBLIOTECA_CONSULTA.md`.
- **Fondos, categoría nueva (2026-11-26).** Necesita un hueco en la lista del paso 2.
  - La biblioteca solo tiene apoyos parciales: TSL-003 (superficie procedural en shader), GL-004 (imagen ondulada con el scroll) e INST-002 (partículas por instancing). Ninguna es un fondo listo para usar.
  - Antes del paso 2 hay que investigar fichas de fondos: ruido en shader, color en movimiento y partículas ligeras en canvas 2D. Como `knowledge/` es de solo lectura, añadirlas requiere tu permiso.
  - Con Fondos, la lista propone 11 animaciones (1 fondo). Si prefieres 10, se quita una transición. Se decide al aprobar la lista.

### Fase 5: Las primeras 4 webs

```text
Usa las skills kp-crear-web, kp-validar y kp-design-system (solo para la app, no para las webs:
cada web tiene su propia identidad visual).

1. Borra las webs con "demo": true.
2. Propón 4 webs para el lanzamiento y espera mi aprobación:
   - 2 de nivel comercial: por ejemplo, una barbería y una clínica.
   - 2 de nivel cinematográfico: por ejemplo, una landing de producto 3D y un estudio creativo.
   Para cada una, dame nombre ficticio, sector, paleta, tipografías, páginas
   y animaciones del catálogo que usará.
3. Para cada web aprobada, de una en una:
   a. Consulta en la biblioteca las fichas de architecture/, recetas/, ux/, seo/ y accessibility/ que apliquen.
   b. Construye la web completa en preview/, con todas sus páginas. Reutiliza las animaciones validadas
      del apartado Animaciones y anota sus slugs en item.json (animations) y en su usedIn.
      Debe escuchar postMessage para los parámetros (nombre, ciudad, paleta, tipografías)
      y para resaltar secciones.
   c. Usa textos de ejemplo realistas para el sector. En Reseñas, deja huecos marcados
      "Reseña real del cliente": nunca inventes reseñas presentadas como reales.
      Las fotos son de bancos con licencia libre o placeholders, y se indica su fuente.
   d. Escribe item.json, el prompt maestro (prompt.md) y un prompt por sección en sections/,
      con la plantilla de webs de docs/PLAN.md.
   e. Comprueba el prompt: en una carpeta temporal, sigue el prompt maestro desde cero
      y compara el resultado con preview/ en capturas a 375 y 1440 px.
      Anota las diferencias y mejora el prompt hasta que el resultado se parezca.
   f. Valida:
      - Graba un vídeo de 8–12 s haciendo scroll por la home, de menos de 900 KB.
      - Saca un póster.
      - Pasa Lighthouse móvil a la web: Rendimiento 90 o más, Accesibilidad 95 o más.
   g. Pon status VALIDADO o NO VERIFICADO con el motivo en statusReason, y actualiza RESEARCH_PROGRESS.md.

Criterios de cierre:
- Las 4 webs en estado VALIDADO.
- Para cada web, captura de preview/ y del resultado de seguir el prompt maestro, lado a lado.
```

**Notas aprobadas (2026-11-26)** · candidatas por web en `docs/BIBLIOTECA_FASE0.md`.

- **Orden:** barbería, clínica, estudio creativo y, la última, la landing de producto 3D.
- **Barbería:** criterio de cierre adicional: un test e2e del menú móvil a 375 px (abre, navega, cierra con teclado y no tapa el contenido). El prototipo n.º 1 de la biblioteca falló justo en la cabecera móvil (UX-004).
- **Clínica:** el formulario no pide datos de salud: solo nombre, contacto y un motivo general de la consulta. La analítica solo se carga después del consentimiento de cookies (LEGAL-001, ANALYTICS-001).
- **Producto 3D:** solo modelos y texturas con licencia CC0 (por ejemplo, Poly Haven), con la fuente anotada. Si no alcanza la calidad visual (criterios C1 y C3 de EVAL-001), se avisa al usuario y se cambia la web antes de seguir.
- Las demos de `preview/` se implementan desde cero, sin copiar código de las fuentes.

### Fase 6: Login, favoritos y límite de copias

```text
Implementa la autenticación y los datos de usuario según "Stack y arquitectura" de docs/PLAN.md.

1. Supabase Auth con Google usando el flujo PKCE (@supabase/ssr). Los tokens no pueden aparecer
   nunca en la URL ni en el hash. Escribe un test que lo compruebe.
2. Crea las tablas profiles, favorites, copies y subscriptions con migraciones SQL y Row Level Security:
   cada usuario solo lee y escribe sus filas.
3. Explorar no requiere cuenta. Al pulsar Copiar sin sesión (en la ficha o en una tarjeta), se abre un panel
   lateral "Inicia sesión con Google para copiar" sin salir de la página; tras el login, la copia se completa sola.
   Si el navegador exige un clic nuevo al volver del login (Safari, Firefox), el botón queda resaltado
   y un clic termina la copia. El panel se conecta a CopyProvider (onBlocked + retry): /api/copy
   responde 401 sin sesión y 429 con renewsAt al llegar al límite, y CopyButton los recibe como CopyBlockedError.
4. Ruta de API POST /api/copy: comprueba sesión y límite del mes, registra la copia y devuelve
   el prompt renderizado. El texto completo del prompt no se envía al navegador antes de esa llamada;
   la ficha muestra las primeras 12 líneas y un degradado de --surface-2 sobre el resto.
5. Límite del plan gratuito: 10 copias al mes (configurable). Contador visible "X de 10 copias este mes".
   Al llegar al límite, aviso en --warning con la fecha de renovación y un enlace a /planes.
6. Favoritos: sin sesión, en localStorage; al iniciar sesión, se migran a la tabla favorites.
   La página /favoritos usa la misma rejilla que la galería.
7. Página /cuenta con perfil, plan, copias del mes y cerrar sesión.

Criterios de cierre:
- Tests e2e de: copiar sin sesión, login, copiar con sesión, alcanzar el límite y migrar favoritos.
- Un usuario no puede leer las filas de otro (test contra la base de datos).
```

### Fase 7: Planes, pagos y páginas legales

```text
1. Página /planes con 3 columnas: Gratis (10 copias al mes), Pro (copias ilimitadas y colecciones)
   y Equipo (varios usuarios). El plan recomendado se marca solo con un borde de --accent.
   Los precios se leen de una configuración, no van escritos en el componente.
2. Stripe Checkout para Pro y Equipo, el portal de cliente para gestionar la suscripción,
   y un webhook que actualiza subscriptions y profiles.plan. Verifica la firma del webhook.
3. Páginas /legal/acerca, /legal/privacidad, /legal/terminos, /legal/reembolsos y /legal/contacto
   con una plantilla de lectura de 680 px. Deja textos de ejemplo marcados como [REVISAR CON ABOGADO].
4. Pie de página con los enlaces legales en todas las pantallas.

Criterios de cierre:
- Compra en modo test de Stripe de principio a fin, con cambio de plan reflejado en /cuenta.
- Cancelar la suscripción devuelve al plan gratuito en la siguiente renovación.
```

### Fase 8: Conexión entre apartados, pulido y lanzamiento

```text
1. Conexión entre apartados:
   - En cada ficha de web, las animaciones que usa enlazan a su ficha.
   - En cada ficha de animación aparece "Se usa en estas webs".
   - Comprueba con un test que todos los slugs de animations y usedIn existen y coinciden.
2. SEO: sitemap.xml con las dos secciones, robots.txt y datos estructurados por ficha.
3. Rendimiento de la app: Lighthouse en móvil con al menos 90 en Rendimiento
   y 95 en Accesibilidad en el inicio, en las dos galerías y en una ficha de cada tipo.
   LCP por debajo de 2,5 s.
4. Accesibilidad: navegación completa con teclado (también el selector Webs | Animaciones
   y el acordeón de secciones), textos alternativos en los pósteres y aria-live en los avisos de "Copiado".
5. Pasa la checklist completa de la última sección de docs/PLAN.md con kp-revision-visual
   y corrige todo lo que falle.

Criterios de cierre:
- Checklist completa en verde.
- Informe final con las puntuaciones de Lighthouse y las capturas.
```

### Prompts reutilizables

**Añadir una animación:**

```text
Usa kp-crear-animacion y kp-validar.
Quiero añadir al apartado Animaciones: [DESCRIPCIÓN O NOMBRE DE LA FICHA].

1. Busca en knowledge/KNOWLEDGE_INDEX.md la ficha que mejor encaje. Si no hay ninguna, dímelo y para.
2. Construye la demo, item.json y prompt.md con la plantilla de animaciones de docs/PLAN.md.
3. Valida, graba el vídeo y el póster, y pon el estado que corresponda.
4. Actualiza knowledge/RESEARCH_PROGRESS.md.
5. Enséñame la captura de la ficha a 1440 px y el prompt final.
```

**Añadir una web:**

```text
Usa kp-crear-web y kp-validar.
Quiero añadir al apartado Webs: una web de [SECTOR], nivel [COMERCIAL / CINEMATOGRÁFICO].
Idea: [DESCRIPCIÓN, REFERENCIAS DE ESTILO, PÁGINAS].

1. Propón nombre ficticio, paleta, tipografías, páginas, secciones y animaciones del catálogo que usará.
   Espera mi aprobación.
2. Construye la web en preview/, y escribe item.json, el prompt maestro y los prompts por sección
   con la plantilla de webs de docs/PLAN.md.
3. Sigue el prompt maestro desde cero en una carpeta temporal, compara con preview/ y mejora el prompt.
4. Valida, graba el vídeo de scroll y el póster, y pon el estado que corresponda.
5. Enséñame la captura de la ficha a 1440 px, el prompt maestro y la lista de prompts por sección.
```

## Checklist de calidad visual y técnica

Claude Code pasa esta lista al cerrar cada fase con `kp-revision-visual`, y tú la repasas en el navegador antes de aprobar.

**Estética**

- [ ] Solo se usan colores, tamaños y radios de `styles/tokens.css`.
- [ ] El acento `--accent` aparece solo en elementos pulsables o activos.
- [ ] Todas las tarjetas tienen la misma proporción, altura y alineación de pie.
- [ ] Títulos y texto usan la letra estilo iOS 16 (SF Pro del sistema o Inter); los prompts, SF Mono o JetBrains Mono.
- [ ] Ningún texto se corta ni se sale de su caja a 375, 768, 1280 y 1440 px.
- [ ] La galería muestra tarjetas sin hacer scroll en 1440×900.
- [ ] No hay degradados decorativos, emojis ni sombras grandes.

**Movimiento**

- [ ] La transición tarjeta → ficha dura 600 ms y se ve fluida.
- [ ] Los hovers duran 150 ms y los menús 240 ms, con el easing único.
- [ ] Con `prefers-reduced-motion`, todo pasa a fundidos y las demos quedan en pausa.
- [ ] No hay más de 6 vídeos reproduciéndose a la vez.

**Interacción**

- [ ] Todo se puede usar con teclado y el foco siempre es visible.
- [ ] Cada efecto, cada web y cada sección de una web tiene su botón de copia de un clic, y todos usan `CopyButton`.
- [ ] Copiar muestra «Copiado ✓» y el texto copiado coincide con el mostrado.
- [ ] Los estados vacío, cargando, error, sin sesión y límite alcanzado están diseñados.
- [ ] Los mensajes de error dicen qué falló y cómo solucionarlo.

**Técnica**

- [ ] La consola no muestra errores ni avisos.
- [ ] Lighthouse móvil: Rendimiento 90 o más y Accesibilidad 95 o más.
- [ ] Los vídeos pesan menos de 600 KB y los pósteres menos de 80 KB.
- [ ] Los tokens de sesión nunca aparecen en la URL.
- [ ] El límite de copias se comprueba en el servidor.
- [ ] Lint, tests unitarios y tests e2e pasan.
