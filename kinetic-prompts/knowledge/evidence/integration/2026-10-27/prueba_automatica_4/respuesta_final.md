# Enfoque técnico: barbería premium con animación cinematográfica

## 1. Decisión de partida: híbrido con prioridad comercial
Pides cine, pero también reservas y SEO local. Esto es una web comercial (perfil A) con una capa cinematográfica acotada. Un cliente que busca "barbería + barrio" en el móvil tiene que ver qué es, dónde está y cómo reservar en pocos segundos. Las fichas lo respaldan: UX-002 dice que un hero con retardo compite con el CTA, y PERF-001 §6 dice que los precargadores y los heros con opacidad 0 retrasan el LCP. El cine va encima de ese contenido y nunca lo bloquea.

## 2. Stack
- **Astro 5 con islas.** Es una web de contenido sin área privada (ARCH-001 paso 3). Casi no envía JS por defecto, y el JS que queda es el que elegimos: GSAP, el formulario y poco más (ASTRO-002).
- **Contenido como colecciones tipadas.** Servicios, precios, equipo, horarios y FAQ van en JSON/YAML con esquema Zod. `title ≤ 65` y `description ≤ 160` en el esquema fuerzan el SEO en el build (ASTRO-002).
- **Islas con `client:visible`** solo para el formulario de reserva, el mapa y la galería.
- **Next.js solo si** se añade un panel de citas con login o disponibilidad propia (ARCH-001 paso 3).

## 3. Animaciones cinematográficas, por capas
| Capa | Técnica | Por qué |
|---|---|---|
| Base | Revelados CSS con `animation-timeline: view()` dentro de `@supports` y `prefers-reduced-motion: no-preference` (CSS-001) | Cero JS. Soporte de ~88 %. El contenido es visible sin soporte. |
| Hero | h1, subtítulo y CTA reales en el HTML. El primer plano entra con `transform`/`clip-path` encima. La imagen LCP lleva `fetchpriority="high"`, sin lazy. | No retrasa el LCP ni causa CLS (PERF-001 §5–6). |
| Narrativa | GSAP + ScrollTrigger en 2 o 3 momentos: un pin corto de "oficio" (corte, navaja, toalla) y un parallax sutil. Una timeline con un solo ScrollTrigger por escena, con `clamp()` en los `start`. | ST-001 recomienda agrupar así. Fuera de eso, el movimiento es mínimo. |
| Scroll suave | **No por defecto.** Si se añade, uno suave (≤ 0,6) con las pruebas de anclas y foco. | GS-002 §13: en comercial, suavizado bajo o nada. |
| 3D/WebGL | **Descartado**, por criterio propio. | PERF-001 §6: un GLB de 4–21 MB compite con el LCP. En una web de reservas no compensa. Se puede reconsiderar después. |

**Presupuesto de movimiento.** Entradas ≤ 0,6 s (skill comercial). JS de animación ≤ 60 KB gzip y LCP ≤ 2,0 s en 4G simulado (PERF-001 §8, propuesta a validar). Solo se animan `transform` y `opacity`.

## 4. Reservas
- **Formulario accesible** (FORM-001):
  - Etiquetas visibles encima de cada campo, en una columna y con `autocomplete`.
  - Ayuda con `aria-describedby` y estilos `:user-invalid`.
  - Resumen de errores enfocable, conservando lo escrito.
  - Estados "Enviando…" y de éxito.
  - Mínimo de campos: servicio, fecha/hora, nombre, teléfono.
- **Validación en servidor** con esquema y anti-spam sin CAPTCHA intrusivo. En ASTRO-002 el formulario de ejemplo es simulado y tiene un bug de estado, así que lo usamos como patrón y no como código.
- **Dos opciones para la disponibilidad real** (ver pregunta 1):
  - **A.** Un endpoint propio con una agenda simple.
  - **B.** Un servicio externo de citas. Si se incrusta, cuenta como tercero y requiere consentimiento (LEGAL-001). Mejor un enlace o una carga solo al pulsar.
- **CTA "Reservar" y `tel:`** fijos y visibles en el móvil (SEO-003 §7, UX-002).

## 5. SEO local
Según SEO-003 y SEO-002:
- **Páginas propias por servicio**, con `h1` y `title` de servicio + ciudad, sin relleno de palabras clave.
- **NAP idéntico** al del Perfil de Empresa de Google, en texto y no en imagen.
- **JSON-LD `LocalBusiness`** generado desde un único `siteData`. Incluye `geo`, `openingHoursSpecification` y el subtipo de schema.org más específico (por verificar). Sin `aggregateRating` propio.
- **Reseñas reales** con enlace a su fuente, y un plan legítimo para pedirlas tras el servicio.
- **Horarios especiales** sincronizados entre web y Perfil de Empresa.
- **Mapa como imagen + "Cómo llegar"**, para evitar cookies de terceros.
- **Técnico:** sitemap, robots, Open Graph por página e imágenes responsive de `astro:assets`.

## 6. Accesibilidad
- **Reduced motion** con `gsap.matchMedia()` y `prefers-reduced-motion`. En modo reducido hay fundidos o estados finales, sin pins ni parallax. Añadiría un interruptor de animaciones en la página (A11Y-001).
- **Contenido visible sin JS.** No se oculta con `opacity: 0` en CSS a la espera de JS (A11Y-001 §10).
- **HTML semántico**, un solo `h1`, y navegación y formulario completos con teclado.
- **Contraste y objetivos táctiles** (A11Y-003, no leída).
- **Banner de cookies** (LEGAL-001): "Rechazar" al mismo nivel que "Aceptar", sin scripts de terceros antes del consentimiento y con enlace permanente "Configurar cookies". Es orientación técnica y no asesoramiento legal. Conviene que lo revise el responsable legal del cliente.

## 7. Proceso y verificación
1. **Descubrimiento** (CLIENT-001): propósito (reservas), público, acción principal, NAP, y fotos reales del local y del equipo (UX-002 desaconseja las de stock).
2. **Construcción** por tareas con criterio de aceptación comprobable.
3. **Pruebas** (las fichas no están validadas, así que sus pruebas entran en el plan):
   - Lighthouse móvil y CWV.
   - Teclado y lector de pantalla.
   - Emulación de reduced motion.
   - Capturas a 375, 768 y 1440 px.
   - Rich Results Test.
   - Playwright comprobando que no hay peticiones de terceros antes del consentimiento.
4. **Cierre:** `web-qa-validation`.

## Preguntas para cerrar el diseño
1. **¿Reservas con disponibilidad en tiempo real (agenda propia o servicio externo) o solicitud de cita que confirma la barbería?** Cambia el backend y la parte legal. La biblioteca no tiene ficha de motores de reserva, así que esta parte es criterio propio.
2. **¿Una sola sede o varias, y un idioma o más?** Afecta a las páginas por sede y al `hreflang` (I18N-001, no leída).
3. **¿Hay material real (fotos, vídeo corto del local) o hay que producirlo?** El efecto cinematográfico depende de ese material más que del código.

---

## Registro de consulta (`CONSULTA_BIBLIOTECA`)
No he guardado el archivo porque pediste no crear ninguno. La biblioteca es la v0.15.0 y todas las fichas están en estado INVESTIGADO. Ninguna está IMPLEMENTADA ni VALIDADA, así que todo lo anterior es diseño no probado.

**Fichas leídas (ruta base `/tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/itest4/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/`):**
- `KNOWLEDGE_INDEX.md`
- `integration/RETRIEVAL_PROCEDURE.md`
- `architecture/ARCH-001-receta-pagina-completa.md`
- `architecture/ASTRO-002-sitio-astro-5-completo.md`
- `ux/CLIENT-001-proceso-web-para-cliente.md`
- `ux/UX-002-pagina-de-inicio-de-negocio.md`
- `frontend/FORM-001-formularios-validacion.md`
- `seo/SEO-002-metadata-nextjs-y-datos-estructurados.md`
- `seo/SEO-003-seo-local-perfil-de-empresa.md`
- `accessibility/A11Y-001-reduced-motion.md`
- `scrolltrigger/ST-001-fundamentos-scrolltrigger.md`
- `gsap/GS-002-scrollsmoother-vs-lenis.md`
- `performance/PERF-001-core-web-vitals-y-animacion.md`
- `security/LEGAL-001-cookies-consentimiento-espana-ue.md`
- `css/CSS-001-scroll-driven-animations.md`

**Mencionadas sin leer:** A11Y-003, I18N-001.

**No he leído el manifiesto completo.** Solo comprobé que declara 128 fichas (`total_fichas`). En su lugar usé el índice y ARCH-001.

**Adaptaciones propias, no atribuidas a fichas:**
- Descartar el 3D.
- Astro con endpoint propio para la agenda.
- Los momentos concretos de la capa GSAP.

**Por verificar antes de implementar:**
- Subtipo de schema.org para barbería.
- Soporte de `animation-range` en Safari.
- Los presupuestos de PERF-001 §8.