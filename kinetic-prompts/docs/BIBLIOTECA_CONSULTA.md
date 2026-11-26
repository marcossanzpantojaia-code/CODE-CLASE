# Cómo consultar la biblioteca

Procedimiento común de `kp-crear-animacion` y `kp-crear-web`. Adaptado de la Skill `web-library-router` y de
`knowledge/integration/RETRIEVAL_PROCEDURE.md` de la biblioteca v0.32.0 (ambas en estado PROPUESTO). Las Skills
originales están en `knowledge/_skills_propuestas/` y no se activan solas.

## 1. Orden de consulta

1. **`knowledge/KNOWLEDGE_INDEX.md`**: anota la línea «Versión …» y busca cada necesidad en la tabla de fichas y en
   «Búsqueda por necesidad». No cargues la biblioteca entera.
2. **`knowledge/architecture/ARCH-001-receta-pagina-completa.md`**: orden de decisiones de una página y qué ficha
   respalda cada paso. Obligatoria en las webs; en las animaciones, solo los pasos 10–18.
3. **`knowledge/integration/LIBRARY_MANIFEST.json`**: léelo completo con Read (una ficha por línea según `columnas`).
   Filtra por `perfil` (incluye siempre `ambos`), `categoria` y `estado`, y comprueba que has visto `total_fichas`
   entradas. Si la lectura se trunca, continúa con `offset` o busca con Grep.
4. **Fichas**: de 1 a 3 por necesidad y como máximo 12 por elemento. Lee la cabecera (estado, evidencia, versiones) y
   los campos Procedimiento, Parámetros, Problemas y Pruebas (14).
5. **Estado**: INVESTIGADO o PROPUESTO es conocimiento documentado, no probado → sus pruebas del campo 14 entran en
   la validación. IMPLEMENTADO en la biblioteca no equivale a VALIDADO en Kinetic Prompts.
6. **Versiones**: contrasta la versión de la ficha con la que vas a usar y con
   `knowledge/integration/VERSIONES_VIGENTES.md`. Si cambia la versión mayor, consulta la documentación oficial antes
   de escribir código.
7. **Afirmaciones marcadas «verificar» o «[memoria]»**: compruébalas en la documentación oficial antes de usarlas.

## 2. Cobertura de áreas (webs)

Para cada área que toque el encargo lee al menos una ficha de su carpeta, también si la vas a descartar: UI/UX
(`ux/`), SEO (`seo/`), accesibilidad (`accessibility/`), animación y scroll (`scrolltrigger/`, `gsap/`), formularios
y frontend (`frontend/`) y 3D (`threejs/`). Para descartar el 3D, lee WGPU-001 o PERF-001 y una ficha de `threejs/`.
Proyectos completos y casos: `architecture/` y `recetas/`.

## 3. Mapa por elemento (nivel cinematográfico o hero premium)

| Elemento     | Fichas                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| Hero         | `ux/ART-001` (y su lista contra lo genérico), `animations/DEPTH-001`, `ux/UX-002`, `accessibility/A11Y-003`      |
| Recursos     | `frontend/ASSET-001`, `frontend/AIIMG-001`, `threejs/BLEND-001`, `integration/ESTRATEGIA_RECURSOS_VISUALES.md`   |
| Transiciones | `animations/MOT-001`, `animations/CONT-001`, `transitions/TRN-001`, `recetas/REC-001…003`, `animations/EDIT-001` |
| Cámara       | `threejs/CAM-003` (2,5D antes que 3D), `animations/MOT-002`                                                      |
| Responsive   | `ux/UX-004` (cabecera), `scrolltrigger/ST-006` (pins en móvil)                                                   |
| Validación   | `testing/EVAL-001` (C1, C2, C3), `testing/TEST-003`, `testing/TEST-004`, `testing/AUD-001`                       |

Si tras leerlas el diseño cumple 2 o más puntos de la lista contra lo genérico de ART-001, rehazlo antes de escribir
código.

## 4. Incompatibilidades conocidas (comprobar siempre)

- Lenis no admite CSS `scroll-snap` → `lenis/snap` (LN-001).
- `containerAnimation` exige `ease: "none"` y no admite pin ni snap (ST-003).
- Ancestros con `transform` o `will-change` rompen los pins (ST-002).
- Three.js no libera la GPU automáticamente: `dispose()` (TJ-001).
- `prefers-reduced-motion` es obligatorio (A11Y-001).
- `scroll-behavior: smooth` en `html` descoloca ScrollTrigger (ST-004).
- SplitText: animar dentro de `onSplit()` con `autoSplit`; no combinar con `text-wrap: balance` (TXT-001).
- Vídeo con scrub: esperar a los metadatos sin condición de carrera (VID-001).
- Un ease mal escrito (`"power3.Out"`) no avisa y cae al ease por defecto (TUT-002).
- `gsap.to()` en cada `mousemove` sin `overwrite` acumula tweens: usar `quickTo` (HOV-001).
- Efectos de React sin limpieza (Lenis, ScrollTrigger, timelines): `useGSAP` (GS-001).
- Animar `left`, `top` o `height` en vez de `transform`.
- `refreshPriority`: un número mayor se calcula antes; la Skill oficial `gsap-scrolltrigger` dice lo contrario (GS-004).
- three.js r183+: `RenderPipeline` en vez de `THREE.PostProcessing` y `THREE.Timer` en vez de `THREE.Clock`;
  `PCFSoftShadowMap` retirado en r186 (POST-001, GL-006, LIGHT-001).
- Next.js 16 con Cache Components: datos de sesión o de petición dentro de `<Suspense>`, nunca en `'use cache'`
  (NEXT-004).

Ante un fallo de scroll, recorre la tabla de ST-004 antes de cambiar código. Para la API de GSAP, usa las Skills
oficiales `gsap-*` si están instaladas, con las correcciones de GS-004.

## 5. Código y licencias

- **Ni las demos de `preview/` ni los prompts copian código de las fuentes**, aunque tengan licencia MIT: se
  implementan desde cero a partir del procedimiento de la ficha.
- Si una ficha dice «sin licencia» o «CC BY-NC», ni siquiera se reproducen fragmentos: solo la descripción.
- Cita solo fichas que hayas leído en la sesión. Si mencionas otra por su título en el índice, escribe «(no leída)» en
  la misma línea.

## 6. Registro

Deja en la carpeta del elemento un `CONSULTA_BIBLIOTECA.md` con las secciones de
`knowledge/integration/CONSULTA_BIBLIOTECA_TEMPLATE.md` (encargo, necesidades → fichas, aplicación, descartadas,
verificaciones y pruebas) y rutas que empiecen por `knowledge/`. En la sección 3, anota qué decisión creativa salió de
cada ficha. Las propuestas de corrección de la biblioteca van a la sección 7, no a las fichas.
