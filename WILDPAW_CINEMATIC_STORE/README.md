# WILDPAW — Discover their world

Tienda **demostrativa** de accesorios para perros, gatos y mundo acuático, construida como
experiencia cinematográfica con scroll: perro → portal → gato → inmersión → océano →
RUN WILD (vídeo real de un perro y un gato corriendo) → tienda.

## Cómo abrirla en el ordenador de clase

1. Copia la carpeta `WILDPAW_CINEMATIC_STORE` completa (o descarga el repositorio y entra en ella).
2. Haz **doble clic en `index.html`**. Se abre en el navegador predeterminado.
   - Recomendado: Chrome, Edge o Firefox actualizados.
   - No necesita Internet, Node.js, npm ni instalar nada: fuentes, GSAP e imágenes están dentro de la carpeta.
3. Desplázate con la rueda del ratón, el trackpad o las flechas. La barra superior salta a cada escena.

**Versión de un solo archivo:** `WILDPAW-un-solo-archivo.html` (5 MB) lleva dentro todas las
imágenes, vídeos, fuentes y scripts. Se puede enviar por correo o copiar en un USB y abrir con doble
clic sin la carpeta `assets/`. Se regenera con `python3 tools/build-single.py`.

Si el centro bloquea abrir archivos locales con `file://` (poco habitual), ejecuta en una terminal,
desde esta carpeta:

```bash
python -m http.server 8000
```

y abre `http://localhost:8000`.

## Estructura

```
index.html            Estructura semántica de las 3 escenas, tienda y carrito
css/base.css          Tokens de color, tipografía, navegación, botones, loader
css/scenes.css        Composición de las escenas + modo estático (movimiento reducido)
css/shop.css          Tienda, panel del carrito y pie
js/vendor/            GSAP 3.15.0 + ScrollTrigger (copias oficiales sin modificar)
js/data/products.js   Catálogo local (9 productos)
js/core.js            Utilidades, detección de movimiento reducido, almacenamiento
js/decor.js           Hojas, partículas, fondo marino y burbujas generados en SVG/DOM
js/aquarium.js        Motor de peces en canvas
js/scenes.js          Intro y línea de tiempo del scroll (GSAP + ScrollTrigger)
js/cart.js / shop.js  Carrito (estado, persistencia, panel) y catálogo con filtros
js/run.js             Sección RUN WILD: vídeos en bucle solo cuando se ven, botón de pausa
js/main.js            Arranque, pantalla de carga, menú móvil, enlaces
assets/img/           Fotografías recortadas (WebP con transparencia)
assets/video/         Vídeos reales del perro y el gato corriendo (MP4 + póster)
assets/fonts/         Archivo e Instrument Serif (OFL)
capturas/             Capturas de pantalla y vídeo de las transiciones
CREDITS.md            Autores y licencias de cada foto
```

Se usan scripts clásicos (sin módulos ES) a propósito, para que funcione con doble clic.

## Tecnologías realmente usadas

HTML semántico · CSS moderno (variables, `clip-path`, máscaras, `svh`, `color-mix`) ·
JavaScript sin frameworks · **GSAP 3.15 + ScrollTrigger** (pin, scrub, timelines, `quickTo`) ·
Canvas 2D (peces, burbujas, partículas) · SVG generado (hojas, hierbas, rocas, juguete de plumas).
No se usan Three.js, Lenis, Astro ni ninguna API externa.

## Qué movimiento es real y cuál es simulado

| Elemento | Recurso | Movimiento |
|---|---|---|
| Perro (héroe) | Foto real recortada | Entrada con escala/máscaras, parallax con el ratón, "respiración" sutil y cámara por scroll. **Es movimiento de cámara sobre una foto fija, no animación del animal.** |
| Gato | Foto real recortada | Entrada lateral, encuadre por scroll y respiración sutil. **El animal no se anima.** El detalle animado es el juguete de plumas (SVG con péndulo). |
| Perro y gato corriendo (RUN WILD) | 2 vídeos reales (YFCC100M, CC BY 2.0) | **Movimiento real del animal**: un saluki galopando (velocidad real y luego cámara lenta) y un gato corriendo hacia la cámara grabado a 210 fps. Se reproducen en bucle solo cuando la sección está en pantalla y tienen botón de pausa. |
| Peces | 9 fotos reales recortadas | Nado procedural: cuerpo dividido en franjas que siguen trayectorias curvas, batido de cola simulado (escorzo de la aleta), profundidad por escala y tinte, esquiva del cursor. Es animación generada por código a partir de fotos fijas, no vídeo. |

## Accesibilidad y movimiento

- `prefers-reduced-motion`: sin pin ni scrub. Las escenas se apilan como secciones estáticas y los peces quedan en un único fotograma.
- Navegación y carrito accesibles con teclado: foco visible, Esc, foco atrapado en el panel, `inert` en las escenas fuera de cámara.
- Auditoría axe-core (WCAG A/AA): 0 incidencias en el héroe, el gato, el océano, la tienda y el carrito.

## Limitaciones conocidas

- Los vídeos del perro y el gato corriendo son reales pero antiguos (2011–2012) y de **640 px de origen**: se ven algo suaves a pantalla grande. Pexels y Pixabay estaban bloqueados desde el entorno de desarrollo. Las fotos del bulldog y del gato del inicio son fijas (Open Images, CC BY 2.0, máximo 1024 px): en pantallas retina o 4K se ven algo blandas.
- Algunos productos (arnés, collar, acuario, comida, luz) usan fotos de animales como imagen de ambiente, no fotos del producto.
- El rendimiento solo se midió en Chromium sin GPU (renderizado por software): héroe ≈60 fps, gato ≈45 fps y océano ≈15–20 fps. En equipos con GPU debería ir más fluido, pero no se ha comprobado.
- Las pruebas se hicieron con Chromium (Playwright). No se probó en Firefox ni Safari.
