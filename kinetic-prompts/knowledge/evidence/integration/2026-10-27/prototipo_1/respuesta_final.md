He creado `index.html`, `styles.css` y `main.js` en la carpeta del proyecto, pero no he podido ejecutar ni abrir la página. No hay navegador ni terminal, así que no he hecho capturas ni pruebas con teclado y lector de pantalla. Tampoco he medido Core Web Vitals ni emulado `prefers-reduced-motion`. Lo único que he comprobado es que los `id` y las referencias `aria-describedby` del HTML son coherentes. Conviene abrirla y revisar las tres anchuras antes de darla por buena.

## Decisiones técnicas por sección

- **Enfoque general:** lo traté como web comercial con acabado cinematográfico, no como experiencia 3D. Fondo casi negro, latón y rojo/azul de poste de barbero, titulares serif y tipografías del sistema, sin fuentes externas. El tono cinematográfico sale de la viñeta, un haz de luz, el grano de película (un SVG estático en una sola capa) y marcas de encuadre en la galería. No hay GSAP, Lenis ni WebGL: sin conexión no se podían usar, y el CTA y la lectura no deben depender de efectos.
- **Cabecera y navegación:**
  - Una barra visible avisa de que es un prototipo con contenido ficticio.
  - El botón «Reservar cita» está siempre en la cabecera, también en móvil.
  - Hay enlace de salto y `scroll-padding` para que la cabecera no tape los anclajes.
  - El menú móvil es un botón con `aria-expanded` y se cierra con Escape. Si falla el JS, la navegación queda visible en línea.
- **Hero:**
  - El `h1`, el texto y el CTA están en el HTML y visibles desde el primer pintado. Nada empieza con opacidad 0 ni espera a un temporizador, para no retrasar el LCP.
  - El poste de barbero es solo CSS. Las franjas avanzan exactamente un periodo (113,14 px a 45°) y se repiten sin salto. Se animan con `transform`.
  - El haz de luz se mueve con el scroll mediante `animation-timeline: scroll()` dentro de `@supports`, sin JS.
- **Servicios:** una lista semántica con nombre, descripción, duración y precio. El precio lleva texto oculto «Precio:» para lectores de pantalla. En escritorio el título de la sección queda fijo mientras se recorre la lista, y los precios son visibles y están agrupados.
- **Galería:** seis ilustraciones SVG de cortes y barbas. Comparten un `<symbol>` base (capa, cuello, cabeza) y cada una añade solo su peinado. Los colores van en variables CSS, y cada figura tiene `aria-label` y pie de foto. Pesa muy poco y escala sin pérdida, y deja claro que serían fotos reales en la web definitiva. No usé carrusel, así que no hay autorrotación ni controles que gestionar.
- **Testimonios:** tres tarjetas con borde discontinuo, una etiqueta «Ejemplo · ficticio» en cada una y un aviso en la cabecera de la sección. No hay estrellas ni datos estructurados de reseñas, para no simular valoraciones.
- **Reserva:**
  - Etiquetas visibles encima de cada campo, `autocomplete`, ayuda enlazada con `aria-describedby` y una sola columna.
  - El JS añade mensajes de error en español con texto y un icono además del color. Al enviar con errores, enfoca el primer campo inválido.
  - Valida que el día no sea anterior a hoy, que no sea domingo ni lunes (cerrado) y que el sábado no se reserve después de las 16:30.
  - Al enviar con datos válidos, muestra una confirmación de demostración y resetea el formulario. Nunca se envía nada a ningún sitio (`preventDefault`).
  - Con JS desactivado, el botón recarga la página con los datos en la URL local y no los manda a ningún servidor.
- **Contacto:**
  - Dirección, teléfono (`000 000 000`) y correo (dominio `.example`) están marcados como ficticios.
  - El horario es una tabla con `th` de fila.
  - En lugar de un mapa de terceros hay un plano SVG propio con `<title>` y `<desc>`, rotulado como «esquemático ilustrativo, no es un mapa real».
- **Movimiento:**
  - Solo hay revelados cortos (0,55 s, con retardo escalonado de hasta 140 ms) en las secciones bajo el pliegue. Se usan `IntersectionObserver` y `transform`/`opacity`.
  - El CSS solo oculta esos elementos si hay JS y el usuario no pidió reducir movimiento. Con esa preferencia activa no se anima nada: ni revelados, ni poste, ni luz.
  - Si el JS falla, el contenido es visible igualmente.
- **Rendimiento y SEO:**
  - Son tres ficheros sin dependencias, con un script `defer` y un script inline de una línea que añade la clase `js`.
  - No hay imágenes rasterizadas ni fuentes que descargar, y los SVG son inline.
  - Puse `noindex` porque es un prototipo con datos inventados, y no añadí JSON-LD de `LocalBusiness` por la misma razón. Para una web real habría que quitar el `noindex`, añadir el JSON-LD y poner un `canonical`.

## Registro de consulta a la biblioteca

Versión de `KNOWLEDGE_INDEX.md`: 0.17.0. Perfil: A (comercial) con estética cinematográfica.

**1. Encargo**
Landing ficticia de barbería en HTML, CSS y JS nativos, sin red ni terminal.

**2. Necesidades → fichas** (todas en estado INVESTIGADO salvo ARCH-001, que es PROPUESTO)
- Orden de decisiones: `/tmp/claude-0/-home-claude/4163556f-e6b7-5519-9643-7a71e30aadce/scratchpad/build1/lib/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/architecture/ARCH-001-receta-pagina-completa.md`
- Estructura del hero y de la home: `.../ux/UX-002-pagina-de-inicio-de-negocio.md`
- Jerarquía, CTA y paleta: `.../ux/UI-002-jerarquia-cta-y-color.md`
- Movimiento reducido: `.../accessibility/A11Y-001-reduced-motion.md`
- Carruseles accesibles (leída para descartar el carrusel): `.../accessibility/A11Y-007-carrusel-accesible.md`
- Revelados con CSS: `.../css/CSS-001-scroll-driven-animations.md`
- Formulario: `.../frontend/FORM-001-formularios-validacion.md`
- SEO técnico: `.../seo/SEO-001-seo-tecnico-basico.md`
- Rendimiento: `.../performance/PERF-001-core-web-vitals-y-animacion.md`
- ScrollTrigger (leída para descartarlo): `.../scrolltrigger/ST-001-fundamentos-scrolltrigger.md`
- 3D (leída para descartarlo): `.../threejs/WGPU-001-webgpu-vs-webgl-y-degradacion.md`

**3. Aplicación**
- Hero visible sin esperar a animaciones, de UX-002 y PERF-001.
- Revelados con CSS bajo `@supports`, estado final como base y reduced motion, de CSS-001 y A11Y-001.
- Etiquetas, errores con texto y no solo color, conservar lo escrito y uno solo por columna, de FORM-001.
- Adaptaciones propias, no tomadas de una ficha:
  - Revelados con `IntersectionObserver`, porque el soporte de `animation-timeline` no es universal.
  - Poste de barbero con CSS.
  - Reglas de horario del formulario.
  - Plano SVG.
  - Mensajes de error escritos a mano.

**4. Fichas consultadas y descartadas**
- Descartadas: ScrollTrigger y GSAP (ST-001; sin red y no aportan para este CTA), 3D/WebGL (WGPU-001, perfil B) y carrusel (A11Y-007; una cuadrícula estática evita autorrotación).
- No leídas: TYPE-002 (no leída) y A11Y-003 (no leída) se tocan solo de forma indirecta. Los contrastes los calculé a ojo, sin medirlos.
- Pendiente de la skill de QA: `A11Y-005` y `TEST-001` (no leídas) describen las pruebas que quedan por hacer. Ninguna ficha pasa a IMPLEMENTADO ni VALIDADO, porque no hay ejecución ni evidencia.