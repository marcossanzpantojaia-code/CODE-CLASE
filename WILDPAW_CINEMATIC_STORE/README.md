# WILDPAW — Discover their world

Tienda **demostrativa** de accesorios para perros, gatos y mundo acuático, construida como una
pequeña película que se dirige con el scroll. Todo ocurre en un único estudio blanco:

1. **Perros.** Un golden retriever llega galopando hacia la cámara, por delante de la palabra `WILDPAW`.
2. **El perro cruza el objetivo.** Se acerca hasta desenfocarse y tapar el encuadre con su pelaje;
   al despejarse lo vemos de espaldas alejándose y, al fondo, un gato.
3. **Gatos.** La cámara adelanta al perro y alcanza al gato: «Born to be curious» y tres productos.
4. **El salto.** El gato se aleja, se gira a lo lejos y salta contra la cámara, que cae al agua.
5. **Acuáticos.** «Dive into their world», con peces fotografiados nadando entre las letras.
6. **Juntos**: el perro y el gato cruzan el plano caminando de perfil, paso a paso con el scroll, y la **Tienda** con filtros y carrito.

Los animales no son fotos quietas: un esqueleto 2D deforma cada foto en tiempo real (WebGL). Galopan, trotan, mueven la cola,
las orejas y la lengua, respiran y se paran a mirar. Ver «Qué movimiento es real» más abajo.

## Cómo abrirla en el ordenador de clase

1. Copia la carpeta `WILDPAW_CINEMATIC_STORE` completa (o descarga el repositorio y entra en ella).
2. Haz **doble clic en `index.html`**. Se abre en el navegador predeterminado.
   - Recomendado: Chrome, Edge o Firefox actualizados.
   - No necesita Internet, Node.js, npm ni instalar nada: fuente, GSAP e imágenes están dentro de la carpeta.
3. Desplázate con la rueda del ratón, el trackpad o las flechas. La barra superior salta a cada escena.

**Versión de un solo archivo:** `WILDPAW-un-solo-archivo.html` lleva dentro todas las imágenes, la
fuente y los scripts. Se puede enviar por correo o copiar en un USB y abrir con doble clic sin la
carpeta `assets/`. Se regenera con `python3 tools/build-single.py`.

Si el centro bloquea abrir archivos locales con `file://` (poco habitual), ejecuta en una terminal,
desde esta carpeta:

```bash
python -m http.server 8000
```

y abre `http://localhost:8000`.

## Estructura

```
index.html            Historia (3 actos), sección Juntos, tienda y carrito
css/base.css          Colores, tipografía del sistema, navegación, botones, avisos
css/scenes.css        Escenario, actores, velos de pelaje, océano, Juntos y modo estático
css/shop.css          Tienda, panel del carrito y pie
js/vendor/            GSAP 3.15.0 + ScrollTrigger + Flip (copias oficiales sin modificar)
js/data/products.js   Catálogo local (9 productos)
js/core.js            Utilidades, detección de movimiento reducido, almacenamiento
js/scenes.js          Encuadres, intro y línea de tiempo del scroll (GSAP + ScrollTrigger)
js/rig.js             Marionetas: deforma las fotos con un esqueleto 2D (WebGL), ciclos de paso, muelles
js/data/rigs.js       Malla y pesos de cada pose (generado por tools/build-rigs.py)
js/data/cast-data.js  Fotos incrustadas: solo se cargan al abrir con doble clic (file://)
js/aquarium.js        Motor de peces en canvas (+ ondas al tocar el agua)
js/duo.js             Sección Juntos: caminan de perfil, el paso va con la distancia recorrida
js/decor.js           Burbujas de la zambullida
js/fx.js              Puntero propio, botones magnéticos, puntos de progreso, toques en el agua
js/cart.js / shop.js  Carrito (estado, persistencia, panel) y catálogo con filtros
js/main.js            Arranque, pantalla de carga, menú móvil, enlaces
assets/img/cast/      Las 6 poses de perro y gato: recorte, sombra (nítida y suave) y dos desenfoques
tools/                build-single.py, build-rigs.py (+ rig-def.json: esqueletos), build-cast-data.py
assets/img/fish/      Peces recortados        assets/img/products/  Productos
assets/fonts/         Inter (OFL), alternativa a la tipografía del sistema
capturas/             Capturas antes/después, estados de las transiciones y vídeo del recorrido
CONSULTA_BIBLIOTECA.md  Fichas de la biblioteca aplicadas, decisiones y pruebas
CREDITS.md            Autores y licencias
```

Se usan scripts clásicos (sin módulos ES) a propósito, para que funcione con doble clic.

## Tecnologías realmente usadas

HTML semántico · CSS (variables, `svh`, `aspect-ratio`, `inert`) · JavaScript sin frameworks ·
**GSAP 3.15 + ScrollTrigger + Flip** (pin, scrub, timelines con valores por función, `quickTo`) ·
**WebGL** (marionetas de los animales: malla deformada por huesos, sin librerías) · Canvas 2D (peces,
burbujas, ondas). No se usan Three.js, Lenis ni ninguna API externa: la profundidad se consigue con
capas 2,5D, que para este material es más nítido y ligero.

## Qué movimiento es real y cuál es de cámara

Los animales son **fotografías fijas**, pero ya no se ven quietas: cada foto va pegada a una malla fina
que un esqueleto 2D deforma 60 veces por segundo, como la herramienta «marioneta» de After Effects.
No se inventa ningún píxel: se doblan los que hay.

| Elemento | Qué se mueve |
|---|---|
| Perro corriendo (portada) | Galope: bote del cuerpo, patas delanteras que suben y bajan, cabeza que compensa el bote, orejas y lengua con muelles, cola. Trota en la portada y galopa cuando haces scroll; cuanto más rápido el scroll, más rápido corre. |
| Perro de espaldas | Paso, balanceo de cadera, cola moviéndose; se para a mirarte en «Keep up.» y arranca otra vez. |
| Gato de espaldas | Camina hasta que la cámara lo alcanza y se para, curioso: cola lenta, orejas que se sacuden, mirada. |
| Gato saltando | Estira las patas hacia la cámara, orejas atrás y la cola se queda atrás (muelle). |
| Juntos (perfil) | Trote del perro y paso del gato ligados a la distancia que recorren: la pata apoyada no patina. Al subir caminan hacia atrás; sin scroll se quedan quietos, pero respiran y mueven la cola. |
| Acercarse y alejarse | Movimiento de cámara (escala en perspectiva) con desenfoque de proximidad. |
| Peces | Nado procedural (franjas, batido de cola, profundidad; esquivan el cursor y huyen al tocar el agua). |

Límite honesto: son deformaciones de una sola foto por pose. Una pata no puede girar para enseñar su otro
lado ni el animal darse la vuelta; para eso harían falta secuencias de vídeo de cada animal.

## Accesibilidad y movimiento

- `prefers-reduced-motion`: sin pin ni scrub. Las escenas se apilan como secciones estáticas y los peces quedan en un único fotograma.
- Navegación y carrito accesibles con teclado: foco visible, Esc, foco atrapado en el panel, `inert` en las escenas fuera de cámara.
- Puntero propio, botones magnéticos e inclinación de tarjetas solo con ratón.
- Auditoría axe-core (WCAG 2.2 A/AA) en 7 puntos, a 1440 px y 390 px: 0 incidencias. Quedan contrastes que la herramienta no puede calcular sola (texto sobre fotos y degradados) y que se revisaron a ojo.

## Pruebas hechas (Chromium con Playwright)

- Carrito y tienda: 15 comprobaciones (añadir, filtros, cantidades, eliminar, subtotal, Esc, foco, persistencia).
- Filtros bajo estrés: 20 escenarios de cambios rápidos de filtro, en escritorio y móvil, sin tarjetas solapadas.
- Movimiento: estados al 0/25/50/75/100 % de cada transición, relevo de desenfoque sin pérdida de opacidad, cortes siempre ocultos, reversibilidad en 8 puntos, scroll rápido de extremo a extremo y cambio de tamaño de ventana.
- Marionetas: se crean en `file://` y por http; la pata apoyada se desliza 0,03–0,3 px mientras el cuerpo avanza 1,5–3,3 px (no patina); hojas de ciclo a tamaño completo revisadas.
- Tamaños: 1440×900, 1280×800, 768×1024, 390×844 y 320×700, sin desbordamiento horizontal ni errores de consola.

## Limitaciones conocidas

- **Las patas se doblan, no giran.** La marioneta deforma una sola foto por pose: los movimientos son pequeños y verosímiles, no un ciclo completo filmado. Para eso harían falta secuencias de vídeo con transparencia de cada animal (ver `CONSULTA_BIBLIOTECA.md`).
- En el perro de espaldas, cuando la pata trasera derecha se levanta del todo, el borde entre las dos patas traseras puede verse cortado durante un instante.
- Sin WebGL o con movimiento reducido se ven las fotos tal cual (sin marionetas).
- El rendimiento solo se midió en Chromium **sin GPU** (WebGL por software). En ese caso la web activa un modo ligero (menos píxeles en las marionetas): 60 fps en el héroe y las mesetas, 49–60 fps en las transiciones y 33–42 fps en «Juntos» a 1440 px; a 390 px, 60 fps. Con una GPU real no se ha podido medir aquí. No se ha medido en un móvil real.
- Las pruebas se hicieron con Chromium. No se probó en Firefox ni Safari.
- En iPhone, iPad y Mac la tipografía es SF Pro (la del sistema); en Windows y Android se ve Inter, muy parecida pero no idéntica.
- Algunos productos usan fotos de animales como imagen de ambiente, no fotos del producto.
- El origen y los derechos de las seis imágenes del perro y el gato están pendientes de confirmar por el autor (`CREDITS.md`).
