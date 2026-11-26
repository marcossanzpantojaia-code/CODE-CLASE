# Enfoque técnico: web premium de barbería

Todavía no he escrito código ni archivos. Basé el diseño en la biblioteca del proyecto: `KNOWLEDGE_INDEX.md` v0.14.1, `RETRIEVAL_PROCEDURE.md`, `ARCH-001`, `SEO-002`, `SEO-003`, `A11Y-001`, `LN-001`, `ASTRO-002` y `PERF-001`. Todas esas fichas están en estado INVESTIGADO. Es documentación leída, no técnicas probadas, así que cada una llevará sus pruebas (campo 14) al plan de QA.

## 1. Decisión de perfil

El perfil es **A (comercial) con una capa cinematográfica contenida**. Una barbería vive de que la gente reserve desde el móvil y de aparecer en Google Maps. Lo cinematográfico es el envoltorio, así que debe cumplir tres condiciones:
- No retrasa el LCP.
- No bloquea la reserva.
- Se desactiva sin que se pierda contenido.

Por eso no usaría Three.js ni WebGL. Un 3D de 4 a 21 MB compite con el LCP (PERF-001 §6) y aporta poco a un negocio local. La sensación premium sale de fotografía, tipografía, ritmo y movimiento bien medido.

## 2. Stack y arquitectura

- **Astro 5 con islas** (ASTRO-001/002). La web es sobre todo contenido y casi no necesita JavaScript.
  - Ventaja: HTML estático, LCP bajo y SEO limpio.
  - Hidratamos solo lo interactivo: widget de reserva, galería y mapa, con `client:visible`.
  - El contenido (servicios, precios, equipo, horarios, FAQ) vive en **colecciones tipadas con esquema Zod**. Se edita sin tocar componentes. Los límites de `title` y `description` quedan garantizados en el build.
- **Alternativa:** Next.js App Router, solo si queremos un panel privado con reservas propias, autenticación y base de datos (NEXT-002/003). Es una decisión de producto que dejo abierta (ver preguntas).
- **TypeScript** con variables de entorno validadas en el build (TS-001, T3-001).
- **GSAP + ScrollTrigger** como única capa de animación compleja, con `gsap.matchMedia()`.
- **Lenis: opcional y a justificar.** LN-001 indica que en webs de negocio "suele ser prescindible". Mi recomendación es empezar sin él. Solo lo añadiría si el prototipo muestra que el scroll con pins se siente mejor con él. Si lo añado:
  - Una sola instancia, sincronizada con el ticker de GSAP.
  - Nada de `scroll-snap` CSS, porque es incompatible.
  - Respetando `respectReducedMotion`.

## 3. Animaciones cinematográficas y scroll interactivo

El principio es **mejora progresiva en capas**. Cada capa funciona sin la siguiente.

| Capa | Técnica | Por qué |
|---|---|---|
| 0. Base | HTML y CSS legibles con todo el contenido visible, sin JS | Si JS falla, nada queda invisible (riesgo de `opacity:0` documentado en A11Y-001) |
| 1. CSS nativo | Revelados con scroll-driven animations bajo `@supports` (CSS-001) y View Transitions entre páginas (CSS-002) | Cero JS y sin coste de hilo principal |
| 2. GSAP | Los efectos de abajo | Control fino solo donde aporta |

**Efectos concretos, con límite deliberado:**
- **Hero:** foto o vídeo corto de una barbería con `clip-path` o máscara que se abre (CLIP-001, MASK-001).
  - El `h1` y el CTA están en el HTML real, no en un canvas.
  - Sin precargador con temporizador y sin opacidad 0 inicial. Eso arruinaría el LCP.
  - Animamos solo `transform` y `clip-path`.
- **Titulares:** SplitText por líneas o palabras, no por letras, para no inflar el DOM (TXT-001, PERF-001). Se anima dentro de `onSplit()`.
- **Servicios:** revelados en grupo con `ScrollTrigger.batch` (ST-005) o tarjetas apiladas con `sticky` (CARD-001).
- **Narrativa del oficio:** una única sección con pin corto (ST-002) y parallax suave (PX-001).
  - Cuidado con ancestros que tengan `transform`, que rompen los pins.
  - En móvil, ST-006 (`ignoreMobileResize`).
- **Galería de cortes:** Flip o bento (FLIP-001/002) o pista arrastrable (DRAG-001). Si es arrastrable, lleva alternativa por teclado y botones, como exige WCAG 2.2.
- **Microinteracciones:** botón magnético con `quickTo` (HOV-001) y spotlight en tarjetas (HOV-004). Solo con puntero fino, nunca en táctil.
- **Tiempos:** duraciones y easings definidos como tokens (UX-001). Los 200–300 ms valen para feedback y los 600–900 ms para narrativa. Cuidado con los eases mal escritos, que fallan en silencio.

**Presupuesto propuesto (adaptación, a validar):** JS de animación ≤ 60 KB gzip, y todo con `transform`, `opacity` o `clip-path`. Nunca animar `top`, `left` o `height`.

## 4. Sistema de reservas

Primero hay que decidir **construir o integrar**:

- **Integrar un proveedor** (Fresha, Booksy, Cal.com, etc.):
  - Es rápido y el negocio ya gestiona agenda, recordatorios y pagos.
  - Contras: el iframe no tiene el diseño de la web, puede fallar en accesibilidad, y los terceros pueden requerir consentimiento de cookies.
  - Mitigación: botón "Reservar" propio y destacado que abre el flujo en un `<dialog>` nativo (A11Y-004), con enlace de respaldo y `tel:`/WhatsApp.
- **Construir propio** (Next.js o endpoints de Astro):
  - Control total del diseño y de los datos.
  - Contras: más mantenimiento (disponibilidad, solapes, recordatorios).

**Si es propio:**
- El flujo es una máquina de estados explícita: servicio → barbero → hueco → datos → confirmación → error (UX-003).
- Cada paso lleva sus estados "enviando", "error" y "éxito".
- Formulario con etiquetas asociadas, errores anunciados a lectores de pantalla y validación en cliente por usabilidad (FORM-001).
- **Validación en servidor con esquema** (SEC-002), porque la del cliente no protege.
- Control de concurrencia en la reserva del hueco.
- Antispam sin captcha invasivo (honeypot más límite de frecuencia).
- Cabeceras de seguridad y CSP (SEC-001).
- Mínimo de datos personales, por RGPD.

**En cualquier caso:** un CTA de reserva visible en móvil en todo momento (UX-002), con barra inferior fija. Cuidado con que no tape el foco (WCAG 2.4.11).

## 5. SEO local

Aquí está gran parte del retorno de una barbería. Se basa en SEO-001, SEO-002 y SEO-003.
- **Perfil de Empresa de Google** verificado y completo. Es el factor más importante y se gestiona fuera de la web: horarios especiales, categoría correcta, fotos y reseñas.
- **NAP idéntico** (nombre, dirección, teléfono) en la web, el perfil y los directorios. Debe estar en texto, no en imagen.
- **JSON-LD `LocalBusiness`** generado desde los mismos datos del sitio:
  - `name`, `address`, `geo`, `telephone` con prefijo de país y `openingHoursSpecification`.
  - Hay que buscar el subtipo exacto de schema.org para barbería. SEO-002 lo marca como **no verificado**, así que lo compruebo antes de usarlo.
  - Sin `aggregateRating` propio, porque Google lo prohíbe.
- **Una página por servicio** con texto propio, y por sede si hay varias. `h1` y `title` con servicio y ciudad, sin relleno de palabras clave.
- Sitemap, robots, Open Graph e imágenes con `alt` descriptivos y reales.
- Mapa y "Cómo llegar". Si el mapa es embebido, lo cargo bajo demanda por rendimiento y consentimiento.
- Reseñas reales con enlace a su fuente.
- **Core Web Vitals** como señal añadida: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 en móvil (PERF-001).
- **Idiomas:** solo si el negocio atiende a turistas. Entonces `hreflang` y rutas por idioma (I18N-001).

## 6. Accesibilidad

Aquí no hay concesiones.
- **`prefers-reduced-motion` obligatorio** (A11Y-001, A11Y-002). `gsap.matchMedia()` con dos ramas: movimiento completo, y reducido con fundidos o estado final.
  - Los barridos grandes, pins y parallax se sustituyen por estados fijos.
  - Añado un **interruptor de animaciones en la propia página**, como recomienda GSAP.
- **Sin autoplay de más de 5 s sin pausa** y sin destellos (WCAG 2.2.2, 2.3.1). El vídeo de fondo es silenciado, con botón de pausa y póster.
- **Semántica nativa primero:** `<button>`, `<a>`, `<dialog>`, `<details>` para las FAQ. Nada de `div` clicables.
- **Teclado y foco:** orden lógico, foco visible, y que las barras fijas o animaciones no lo tapen. Alternativas a todo arrastre.
- **Contraste y objetivos táctiles:** AA como mínimo, objetivos ≥ 24 px, y mejor 44 px (A11Y-003).
- **Texto animado accesible:** SplitText con `aria-label` en el padre y `aria-hidden` en los fragmentos.
- **Tema oscuro típico de barbería:** con cuidado, porque el dorado sobre negro suele pasar el contraste y el gris sobre negro a menudo no. Tokens semánticos de color (DS-001) y escala tipográfica fluida (TYPE-002).

## 7. Rendimiento

- **Imágenes** con AVIF/WebP, `srcset`/`sizes`, `width`/`height` siempre y `astro:assets` (IMG-001, ASTRO-004). `fetchpriority="high"` en la imagen del hero y **nunca lazy en el LCP**.
- **Vídeo del hero:** corto, comprimido, con póster. Carga diferida después del primer pintado.
- **Fuentes** autoalojadas, 1–2 familias, `font-display: swap` y subconjuntos (TYPE-001). Mejora el rendimiento y evita enviar datos a Google Fonts (RGPD).
- **JS dividido:** GSAP solo en las secciones que lo usan y registro de plugins mínimo. INP cuidado: sin `setState` por evento (PERF-002).

## 8. Cookies y analítica (España/UE)

Orientación técnica, no asesoramiento legal (LEGAL-001, ANALYTICS-001).
- Banner con "Rechazar" al mismo nivel que "Aceptar".
- Bloqueo previo de terceros: mapas, vídeo embebido y widget de reservas si usan cookies.
- Analítica sin consentimiento solo si cumple las condiciones de la AEPD. Si no, con consentimiento.
- Política de privacidad y aviso legal quedan fuera del alcance técnico, pero hay que enlazarlos.

## 9. QA y entrega

- Proceso con A11Y-005: lint de accesibilidad automático más prueba manual con teclado y lector de pantalla. La automática no basta.
- Reduced motion emulado y revisado en toda la página.
- Capturas a 375, 768 y 1440 px, en Chromium y WebKit.
- E2E con Playwright, centrado en el flujo de reserva (TEST-001), y regresión visual (TEST-002).
- Lighthouse CI con presupuestos en cada PR (CI-002), y revisión de errores de ScrollTrigger con ST-004.
- Validación final con la skill `web-qa-validation`.
- Cabeceras y CSP comprobadas en la URL final (DEPLOY-001).

## 10. Orden de trabajo (ARCH-001)

1. Brief: objetivos medibles, como reservas al mes y llamadas (CLIENT-001).
2. Contenido, estructura y copy (UX-002, COPY-001).
3. Stack, tokens de diseño, tipografía y maquetación mobile-first.
4. Componentes y reservas.
5. SEO, legal y rendimiento.
6. Capa CSS sin JS.
7. Capa GSAP, con las secciones por orden de valor.
8. QA y CI.

## Riesgos y límites que debes conocer

- Ninguna ficha de la biblioteca está IMPLEMENTADA ni VALIDADA. Cuando construya, cada técnica sale de documentación o código leído, no de pruebas propias.
- Las partes marcadas "adaptación" (presupuestos, orden de capas, la decisión de no usar 3D) son criterio mío, no de la biblioteca.
- El subtipo schema.org exacto de barbería, y la compatibilidad actual de las scroll-driven animations, requieren verificación en la documentación oficial antes de codificar.
- No he instalado nada ni creado archivos. Tampoco he escrito el plan en disco, porque pediste que no creara archivos.

## Preguntas para cerrar el diseño

1. **Reservas:** ¿integramos un proveedor existente o las construimos propias? Esta decisión cambia el stack (Astro o Next.js).
2. **Contenido:** ¿hay fotos y vídeo propios de calidad? Sin ellos, el efecto premium cae mucho, y es el mayor factor de riesgo.
3. **Alcance:** ¿una sede o varias, y qué idiomas?
4. **Marca:** ¿hay identidad visual ya definida (logotipo, colores, tono)?

Cuando me respondas, el siguiente paso es fijar el stack, el sistema de diseño y la estructura de la home, y después pasar a implementar.