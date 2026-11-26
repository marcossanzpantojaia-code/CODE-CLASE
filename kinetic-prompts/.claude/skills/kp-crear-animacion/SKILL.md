---
name: kp-crear-animacion
description: Añade una animación al apartado Animaciones de Kinetic Prompts a partir de una ficha de knowledge/. Construye la demo autocontenida en preview/, y escribe item.json y prompt.md con la plantilla de animaciones. Úsala cada vez que haya que crear o rehacer una animación del catálogo; después usa kp-validar.
---

# kp-crear-animacion

Resultado: una carpeta `content/animaciones/<slug>/` en estado IMPLEMENTADO, lista para
`kp-validar`. Plantillas y modelo de datos: sección «Anatomía de la ficha y plantilla de
prompt» de `docs/PLAN.md`.

## 1. Elegir la ficha

Sigue el procedimiento de `docs/BIBLIOTECA_CONSULTA.md` (orden de consulta, incompatibilidades,
licencias y registro). En resumen:

1. `knowledge/KNOWLEDGE_INDEX.md` → «Búsqueda por necesidad»; después
   `knowledge/integration/LIBRARY_MANIFEST.json` filtrado por categoría, perfil y estado.
   No cargues la biblioteca entera.
2. Elige una ficha que encaje con lo pedido (prioriza IMPLEMENTADO y las que tengan código o
   demo medida). Si no hay ninguna, dilo y para: no inventes una animación sin ficha.
3. Lee esa ficha y las que enlace (máximo 12). Anota sus rutas para `knowledgeRefs`
   (p. ej. `knowledge/transitions/MENU-001-menu-curvo-svg.md`).
4. Elige un `slug` en kebab-case, en inglés, que describa el efecto
   (`page-transition-curtain`, `text-split-reveal`).
5. Rellena `CONSULTA_BIBLIOTECA.md` en la carpeta del elemento (apartado 6 del procedimiento).

## 2. Estructura de la carpeta

```text
content/animaciones/<slug>/
  item.json
  prompt.md
  preview/index.html      demo autocontenida (sin dependencias de la app)
  media/loop.webm         lo genera kp-validar
  media/poster.webp       lo genera kp-validar
```

## 3. La demo (`preview/index.html`)

- Autocontenida: HTML, CSS y JS en la carpeta `preview/`. Las librerías (GSAP, Lenis,
  Three.js) se cargan con versión exacta, nunca «latest».
- Impleméntala desde cero a partir del procedimiento de la ficha. **No copies código de la
  fuente, aunque tenga licencia MIT** (apartado 5 de `docs/BIBLIOTECA_CONSULTA.md`).
- Repasa las incompatibilidades conocidas (apartado 4) antes de escribir la demo.
- Se ejecutará en un iframe con `sandbox`: no uses cookies, `localStorage` de la app ni
  `window.top`.
- Debe reproducirse en bucle (o tener disparador repetible) y funcionar a 390 px de ancho.
- Las transiciones de página usan la misma maqueta (la web ficticia «alba» con Inicio y Proyectos de
  `page-transition-blinds`) para que se comparen sobre las mismas dos páginas.
- `?loop=0` desactiva el bucle automático: la demo espera a `kp:replay`.
- Solo se mueve el foco o se anuncia algo tras un clic real dentro de la demo; el bucle no
  puede robar el foco a la página que la contiene.
- Anima con Web Animations o CSS siempre que se pueda: el validador congela las animaciones
  con `document.getAnimations()` para comparar fotogramas exactos.
- Escucha `postMessage` para aplicar los parámetros sin recargar. Contrato propuesto
  (se fija en la Fase 3; si allí cambia, actualiza esta skill):
  - `{ "type": "kp:params", "params": { "<id>": <valor>, … } }` aplica los valores.
  - `{ "type": "kp:replay" }` reinicia la animación desde el principio.
  - Valida `event.data.type` y el tipo de cada valor antes de usarlo.
- Con `prefers-reduced-motion: reduce`, queda en pausa en un fotograma representativo
  y solo se reproduce al pulsar «Reproducir».
- Anima solo `transform` y `opacity`. Limpia listeners, timelines y `requestAnimationFrame`.
- Sin errores ni avisos en consola.

## 4. `item.json`

Sigue el modelo de datos de animación de `docs/PLAN.md`:

- `section: "animaciones"`, `slug`, `title` (en español), `category` (transiciones,
  scroll, heros, texto, microinteracciones, 3d-webgl, fondos), `tech` (máximo 3 en la tarjeta),
  `difficulty` (1–3), `performance` (ligero, medio, pesado).
- `status: "IMPLEMENTADO"`. Solo `kp-validar` lo pasa a VALIDADO o NO VERIFICADO (este
  último, con `statusReason`; ver «Estado y `statusReason`» en `docs/PLAN.md`).
- `knowledgeRefs` con la ruta de la ficha, `usedIn` con los slugs de webs que la usan.
- **Siempre al menos un parámetro de color** (`color` o `palette`): todo efecto se puede cambiar de
  color (regla del 2026-11-26; lo comprueba `lib/content.test.ts`).
- `params`: cada uno con `id`, `label`, `type` (`range`, `color`, `select`, `text`,
  `palette`) y `default`; los `range` llevan `min`, `max`, `step` y `unit`.
- `summary`: una frase que dice qué se ve (va en la tarjeta para lectores de pantalla).
- `media` (la rellena el validador) y `createdAt` (AAAA-MM-DD).

## 5. `prompt.md`

Las nueve secciones de la plantilla de animaciones, en este orden:

1. Objetivo visual
2. Stack
3. Estructura
4. Comportamiento paso a paso
5. Parámetros configurables
6. Responsive
7. Accesibilidad
8. Rendimiento
9. Criterios de validación

Reglas de redacción:

- Frases imperativas y concretas: «Anima `y` de 100 % a 0 % en {{duration}} s», no «haz
  una animación bonita».
- Valores siempre con unidades.
- Cada parámetro de `item.json` aparece como `{{id}}` en el prompt, y cada `{{variable}}`
  del prompt existe en `params` (o es `title`).
- El prompt describe; el código lo genera la IA del usuario. Nada de código copiado.
- Las versiones del stack coinciden con las que usa la demo.
- El apartado «Estructura» empieza pidiendo a la IA que mire el proyecto y dice cómo integrarlo en
  Next.js (App Router), Astro y HTML de varias páginas (principio «muy, muy fácil de usar»).
- Debe poder incrustarse en el prompt de una web del constructor: sin referencias a «este prompt»
  ni pasos que dependan de ser el único efecto.

## 6. Cierre

- Comprueba que la demo abre sin errores en el navegador.
- Deja `status: "IMPLEMENTADO"` y pasa a `kp-validar`.
- Si esta animación se usa en webs, actualiza `animations` en el `item.json` de cada web.
