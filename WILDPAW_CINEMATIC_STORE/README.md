# WILDPAW — Discover their world

Tienda **demostrativa** de accesorios para perros, gatos y mundo acuático, construida como
experiencia cinematográfica con scroll: perro → portal → gato → inmersión → océano →
la persecución (sombras de un gato y un perro corriendo) → tienda.

## Cómo abrirla en el ordenador de clase

1. Copia la carpeta `WILDPAW_CINEMATIC_STORE` completa (o descarga el repositorio y entra en ella).
2. Haz **doble clic en `index.html`**. Se abre en el navegador predeterminado.
   - Recomendado: Chrome, Edge o Firefox actualizados.
   - No necesita Internet, Node.js, npm ni instalar nada: fuentes, GSAP e imágenes están dentro de la carpeta.
3. Desplázate con la rueda del ratón, el trackpad o las flechas. La barra superior salta a cada escena.

**Versión de un solo archivo:** `WILDPAW-un-solo-archivo.html` (3,2 MB) lleva dentro todas las
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
js/vendor/            GSAP 3.15.0 + ScrollTrigger + Flip (copias oficiales sin modificar)
js/data/products.js   Catálogo local (9 productos)
js/core.js            Utilidades, detección de movimiento reducido, almacenamiento
js/decor.js           Hojas, partículas, fondo marino y burbujas generados en SVG/DOM
js/aquarium.js        Motor de peces en canvas (+ ondas al tocar el agua)
js/living.js          Fotos vivas: foto + mapa de profundidad en WebGL (cámara 3D)
js/data/living-photos.js  Las mismas fotos y mapas en data: URI (WebGL no lee file://)
js/chase.js           La persecución: sombras con zancada sincronizada al scroll
js/fx.js              Cursor, botones magnéticos, barra de progreso, toques en el agua
js/scenes.js          Intro y línea de tiempo del scroll (GSAP + ScrollTrigger)
js/cart.js / shop.js  Carrito (estado, persistencia, panel) y catálogo con filtros
js/main.js            Arranque, pantalla de carga, menú móvil, enlaces
assets/img/           Fotografías recortadas (WebP con transparencia)
assets/img/depth/     Mapas de profundidad del perro y el gato (hechos a mano a partir del recorte)
assets/img/chase/     Hojas de siluetas: gato (Muybridge, 1887) y perro (galope de lobo, CC0)
assets/fonts/         Archivo e Instrument Serif (OFL)
capturas/             Capturas de pantalla y vídeo de las transiciones
CREDITS.md            Autores y licencias de cada foto
```

Se usan scripts clásicos (sin módulos ES) a propósito, para que funcione con doble clic.

## Tecnologías realmente usadas

HTML semántico · CSS moderno (variables, `clip-path`, máscaras, `svh`, `color-mix`) ·
JavaScript sin frameworks · **GSAP 3.15 + ScrollTrigger + Flip** (pin, scrub, timelines, `quickTo`,
reordenado de la tienda) · **WebGL** (fotos vivas con mapa de profundidad) · Canvas 2D (peces,
burbujas, ondas) · SVG generado (hojas, hierbas, rocas, juguete de plumas) · sprites de siluetas.
No se usan Three.js, Lenis, Astro ni ninguna API externa.

## Qué movimiento es real y cuál es simulado

| Elemento | Recurso | Movimiento |
|---|---|---|
| Perro (héroe) | Foto real + mapa de profundidad | **Foto viva**: una cámara virtual gira levemente alrededor de la foto en 3D (ratón, scroll y deriva lenta). Es movimiento de cámara; el animal no se anima. |
| Gato | Foto real + mapa de profundidad | Igual que el perro, más entrada lateral y encuadre por scroll. El juguete de plumas sí se balancea. |
| La persecución: gato | 12 fotografías reales de Muybridge (1887) | **Movimiento real**: es la carrera de un gato fotografiada fotograma a fotograma, convertida en sombra. |
| La persecución: perro | Ciclo de galope de un lobo 3D (Quaternius, CC0) | Animación 3D convertida en sombra; no se muestra el modelo, solo su silueta. |
| Peces | 9 fotos reales recortadas | Nado procedural (franjas, batido de cola, profundidad, esquivan el cursor y huyen al tocar el agua). |

## Accesibilidad y movimiento

- `prefers-reduced-motion`: sin pin ni scrub. Las escenas se apilan como secciones estáticas y los peces quedan en un único fotograma.
- Navegación y carrito accesibles con teclado: foco visible, Esc, foco atrapado en el panel, `inert` en las escenas fuera de cámara.
- Cursor propio, botones magnéticos e inclinación de tarjetas solo con ratón; en táctil y con movimiento reducido no se activan. Sin WebGL, las fotos vivas vuelven a ser fotos normales.
- Auditoría axe-core (WCAG A/AA): 0 incidencias en el héroe, el gato, el océano, la tienda y el carrito.

## Limitaciones conocidas

- La red del entorno de desarrollo bloqueaba Unsplash, Pexels y los bancos de vídeo. Las fotos salen de Open Images (CC BY 2.0) y tienen como máximo 1024 px, por lo que en pantallas retina o 4K el perro se ve algo blando.
- Algunos productos (arnés, collar, acuario, comida, luz) usan fotos de animales como imagen de ambiente, no fotos del producto.
- No hay un perro ni un gato realistas corriendo a todo color: los modelos 3D realistas con animación son de pago y los bancos de vídeo/modelos estaban bloqueados. El movimiento real de carrera aparece como sombras en "La persecución".
- El rendimiento solo se midió en Chromium sin GPU (renderizado por software): héroe ≈46 fps, gato ≈37, océano ≈19, persecución ≈50, tienda ≈51. En equipos con GPU debería ir más fluido, pero no se ha comprobado.
- Las pruebas se hicieron con Chromium (Playwright). No se probó en Firefox ni Safari.
