He creado la landing de "Barbería Castellana" en `index.html`, `styles.css` y `main.js`. No la he abierto en un navegador, porque el entorno no tiene terminal. Está sin probar en pantalla, así que revisa el diseño a mano en móvil, tablet y escritorio.

## Decisiones técnicas por sección

**Base y estética cinematográfica**
- **Paleta y tipografía:** fondo casi negro, acento dorado y tipografías del sistema (serif para titulares, sans para texto). Sin fuentes externas, así que no hay peticiones de red ni parpadeo al cargar.
- **Grano de película:** un ruido SVG embebido en CSS, estático. Da textura sin coste de animación.
- **Aviso de prototipo:** una franja fija arriba indica que el contenido es ficticio.
- **Accesibilidad básica:** enlace "Saltar al contenido", foco visible, áreas táctiles de al menos 44 px y contraste alto.

**Cabecera**
- Es sticky, con desenfoque de fondo.
- En móvil hay un menú con `aria-expanded`, que se cierra con Escape o al elegir un enlace.

**Hero**
- **Ilustración:** un poste de barbero dibujado en SVG, más un haz de luz en CSS que se balancea despacio. Es la única animación continua.
- **Letterbox:** dos bandas negras arriba y abajo dan el aspecto de fotograma de cine.
- **Llamada a la acción:** "Reservar cita" es el botón principal y enlaza al formulario.
- **Móvil:** el poste se atenúa para que el texto se lea bien.

**Servicios**
- Es una carta con puntos guía hasta el precio, en una lista semántica (`ul`).
- Tiene dos columnas en escritorio y una en móvil.

**Galería**
- Seis ilustraciones SVG propias de cortes y barbas. Los colores se controlan con clases CSS.
- Cada una lleva `role="img"`, `aria-label` y `figcaption`.
- El zoom al pasar el ratón es sutil.
- La cuadrícula pasa de 3 columnas a 2 en tablet y móvil (con menos espacio entre tarjetas).

**Testimonios**
- Cada tarjeta lleva un sello "Ejemplo", y el encabezado de la sección dice que no son opiniones reales.

**Reserva**
- **Sin envío:** el formulario llama a `preventDefault()`, no hace ninguna petición y muestra un mensaje de reserva simulada.
- **Validación:** es local y accesible. Hay mensajes enlazados con `aria-describedby`, el foco va al primer error y el estado se anuncia con `role="status"`.
- **Fecha:** el campo no admite fechas pasadas.

**Contacto y ubicación**
- **Datos ficticios:** dirección y teléfono son inventados, y el correo usa el dominio `.invalid`.
- **Plano:** en vez de un mapa de terceros, hay un plano esquemático en SVG, rotulado como ilustrativo.
- **Horario:** va en una lista de definición (`dl`).

**Movimiento y rendimiento**
- **Revelados:** solo se aplican a cabeceras de sección, ítems de la carta, fotos de galería, testimonios y bloques de reserva y contacto. Usan `IntersectionObserver`, se disparan una vez y tienen un escalonado corto. No hay parallax ni efectos en el hero.
- **Sin JavaScript:** los elementos solo se ocultan si JavaScript añade la clase `.js`, así que sin él todo se ve.
- **`prefers-reduced-motion`:** con esa preferencia se desactivan la animación del haz, las transiciones y el scroll suave, y todo aparece de inmediato.
- **Peso y carga:** son tres archivos, sin imágenes ni librerías. El script va con `defer` y el CSS es una sola hoja.

Todo el contenido es de ejemplo, como pediste.