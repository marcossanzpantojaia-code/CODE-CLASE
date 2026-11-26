---
name: kp-crear-web
description: Añade una web completa al apartado Webs de Kinetic Prompts. Propone la web y espera aprobación, la construye entera en preview/ reutilizando animaciones del catálogo, y escribe item.json, el prompt maestro y un prompt por sección con la plantilla de webs. Úsala cada vez que haya que crear o rehacer una web del catálogo; después usa kp-validar.
---

# kp-crear-web

Resultado: una carpeta `content/webs/<slug>/` en estado IMPLEMENTADO, lista para
`kp-validar`. Plantillas y modelo de datos: sección «Anatomía de la ficha y plantilla de
prompt» de `docs/PLAN.md`.

**La web no usa el sistema de diseño de la app.** Cada web tiene su propia identidad
visual. `kp-design-system` solo se aplica a la interfaz de Kinetic Prompts.

## 1. Proponer y esperar aprobación

Antes de construir nada, presenta:

- Nombre ficticio (que no coincida con un negocio real conocido de la ciudad), sector y
  nivel: `comercial` (claridad, conversión, SEO, rendimiento) o `cinematografica`
  (scroll narrativo, 3D, transiciones avanzadas).
- Paleta de 3 colores, pareja tipográfica, páginas y secciones.
- Animaciones del catálogo que usará (solo las que estén en estado VALIDADO).

**Espera la aprobación del usuario.**

## 2. Investigar

Abre `knowledge/KNOWLEDGE_INDEX.md` y lee solo las fichas que apliquen de
`complete-projects/`, `ui-ux/`, `seo/` y `accessibility/`. Anota sus rutas para
`knowledgeRefs`.

## 3. Estructura de la carpeta

```text
content/webs/<slug>/
  item.json
  prompt.md               prompt maestro
  sections/<seccion>.md   un prompt por sección (hero.md, servicios.md, …)
  preview/                la web completa, todas sus páginas (index.html, servicios.html, …)
  media/scroll.webm       lo genera kp-validar
  media/poster.webp       lo genera kp-validar
```

## 4. Construir la web en `preview/`

- Todas las páginas de `pages`, navegables entre sí con rutas relativas.
- Reutiliza las animaciones validadas del apartado Animaciones siguiendo su `prompt.md`.
  Anota sus slugs en `animations` de la web y añade el slug de la web en `usedIn` de cada
  animación.
- Se ejecuta en un iframe con `sandbox`: sin cookies ni acceso a `window.top`.
- Escucha `postMessage`. Contrato propuesto (se fija en la Fase 3):
  - `{ "type": "kp:params", "params": { "businessName", "city", "palette", "fonts", "language" } }`
    actualiza textos, colores y tipografías sin recargar.
  - `{ "type": "kp:highlight", "section": "<id>" }` hace scroll hasta la sección
    (`data-kp-section="<id>"`) y la resalta con un borde; `"section": null` lo quita.
- Textos de ejemplo realistas para el sector.
- **Reseñas:** deja huecos marcados «Reseña real del cliente». Nunca inventes reseñas
  presentadas como reales.
- **Fotos:** de bancos con licencia libre o placeholders; indica la fuente de cada una
  (por ejemplo en `preview/CREDITS.md`).
- Responsive (375, 768, 1280 y 1440 px), `prefers-reduced-motion`, contraste AA y
  objetivo Lighthouse móvil: Rendimiento ≥ 90 y Accesibilidad ≥ 95.
- SEO local: títulos, descripciones y datos estructurados `LocalBusiness`.

## 5. `item.json`

Modelo de datos de web de `docs/PLAN.md`: `section: "webs"`, `slug`, `title`, `sector`,
`level`, `pages`, `sections`, `animations`, `tech`, `status: "IMPLEMENTADO"`,
`knowledgeRefs`, `params` (`businessName`, `city`, `palette`, `fonts`, `language`),
`media` y `createdAt`.

## 6. Prompts

- **`prompt.md` (maestro):** las diez secciones de la plantilla de webs, en orden:
  Brief · Identidad visual · Stack y estructura · Mapa del sitio · Home sección por
  sección · Páginas internas · Animaciones · Responsive, accesibilidad y rendimiento ·
  SEO · Criterios de validación.
- **`sections/<seccion>.md`:** un archivo por cada sección de `sections`, con el mismo
  esquema que el punto 5 del maestro (objetivo, contenido, maquetación en escritorio y
  en móvil, y animación), y lo bastante completo para usarse solo.
- Reglas de redacción: imperativo y concreto, valores con unidades, sin código copiado.
  En Animaciones, cada una enlaza a su prompt del apartado Animaciones.
- Cada `{{variable}}` existe en `params` (o es `title`).

## 7. Comprobar el prompt

1. En una carpeta temporal fuera del repositorio, sigue el prompt maestro desde cero,
   sin mirar `preview/`.
2. Haz capturas del resultado y de `preview/` a 375 y 1440 px y compáralas.
3. Anota las diferencias y mejora el prompt hasta que el resultado se parezca.
4. Guarda la pareja de capturas lado a lado para el informe de la fase.

## 8. Cierre

Deja `status: "IMPLEMENTADO"` y pasa a `kp-validar`.
