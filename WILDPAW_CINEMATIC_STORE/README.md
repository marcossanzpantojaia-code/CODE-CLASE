# WILDPAW — Discover their world

Tienda **demostrativa** de accesorios para perros, gatos y mundo acuático, construida como una
película en siete planos que se dirige con el scroll:

1. **The Arrival.** Un gato atigrado entra andando por delante de la palabra `WILDPAW` y se para.
2. **The Connection.** Un corte en iris desde su cabeza abre su primer plano: te mira y su cabeza sigue al cursor.
3. **The Leap.** Salta hacia la cámara y su pelaje tapa el encuadre.
4. **The Energy.** Bajo el pelaje aparece un golden retriever que llega galopando desde el fondo.
5. **The Reveal.** El perro cruza el objetivo; contraplano: se aleja y, al andar, abre detrás de él
   la sección de perros. El borde de la sección va pegado a su flanco y cada palabra («Keep», «up.»)
   y cada producto llega exactamente con una de sus pisadas. Se para y te mira: puedes añadir al carrito.
6. **The Meeting.** Arranca al trote, la cámara lo adelanta (él sale por la derecha y su sección por la
   izquierda) y alcanza al gato.
7. **The Deep.** El gato se aleja y el agua sube: peces nadando entre las letras.

Cierre, **Juntos**: mientras sube el encuadre, el perro y el gato entran andando de perfil, a la par;
las letras gigantes «Side by side. Every day.» se levantan a su paso y, cuando se paran, se dibuja la
navegación de la tienda por animal (Perros, Gatos, Acuáticos, Toda la tienda, con el número real de
productos). Al pasar por «Perros» o «Gatos», ese animal se queda en primer plano. Después, la
**Tienda** con filtros y carrito.

Los animales son fotos, pero no quietas: un esqueleto 2D deforma cada foto en tiempo real (WebGL).
Lo que una foto no puede dar (un giro real de cabeza, patas que giran) está especificado como
clips de vídeo IA en `RECURSOS_IA.md`.

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
js/duo.js             Cierre Juntos: entran andando (paso ligado a la distancia), letras a su paso, navegación
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
RECURSOS_IA.md        Clips de vídeo IA necesarios para el movimiento real, con prompts
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
| Gato de perfil (portada) | Entra andando desde fuera de cuadro: la fase del paso sale de la distancia recorrida, así la pata apoyada no patina; frena, se para, respira y mueve la cola. |
| Gato en primer plano | Te mira; la cabeza se inclina hacia el cursor (±2,8°) con un muelle y, si no mueves el ratón, mira a su alrededor por su cuenta. |
| Perro corriendo | Llega galopando desde el fondo: bote del cuerpo, patas delanteras que suben y bajan, cabeza que compensa el bote, orejas y lengua con muelles, cola. Cuanto más rápido el scroll, más rápido corre. |
| Perro de espaldas | Se aleja andando: la fase del paso sale del scroll y va ligada a su avance en profundidad, así sus pisadas caen en instantes conocidos (ahí llegan las palabras y los productos). Balanceo de cadera y cola; se para a mirarte y arranca al trote. |
| Gato de espaldas | Camina hasta que la cámara lo alcanza y se para, curioso: cola lenta, orejas que se sacuden, mirada. |
| Gato saltando | Desde el primer plano salta a la cámara: estira las patas, orejas atrás y la cola se queda atrás (muelle). |
| Juntos (perfil) | Entran andando a la par, con el paso ligado a la distancia que recorren (la pata apoyada no patina), frenan y vuelven a la postura de la foto. Al subir caminan hacia atrás; respiran y mueven la cola. |
| Sección de perros (plano 5) | No es un efecto de los animales: su borde sigue al perro y una luz cálida le acompaña. |
| Acercarse y alejarse | Movimiento de cámara (escala en perspectiva) con desenfoque de proximidad. |
| Peces | Nado procedural (franjas, batido de cola, profundidad; esquivan el cursor y huyen al tocar el agua). |

Límite honesto: son deformaciones de una sola foto por pose. Una pata no puede girar para enseñar su otro
lado ni el animal darse la vuelta; para eso harían falta secuencias de vídeo de cada animal.

## Accesibilidad y movimiento

- `prefers-reduced-motion`: sin pin ni scrub. Las escenas se apilan como secciones estáticas y los peces quedan en un único fotograma.
- Navegación y carrito accesibles con teclado: foco visible, Esc, foco atrapado en el panel, `inert` en las escenas fuera de cámara.
- Puntero propio, botones magnéticos e inclinación de tarjetas solo con ratón.
- Auditoría axe-core (WCAG 2.2 A/AA) en 9 puntos (incluidos la sección del perro y el cierre), a 1440 px y 390 px, y con movimiento reducido: 0 incidencias. Los enlaces del cierre no se pueden enfocar hasta que aparecen. Quedan contrastes que la herramienta no puede calcular sola (texto sobre fotos y degradados) y que se revisaron a ojo.

## Pruebas hechas (Chromium con Playwright)

- Carrito y tienda: 15 comprobaciones (añadir, filtros, cantidades, eliminar, subtotal, Esc, foco, persistencia).
- Filtros bajo estrés: 20 escenarios de cambios rápidos de filtro, en escritorio y móvil, sin tarjetas solapadas.
- Planos 5 y 6: el borde de la sección sigue al flanco del perro (0 px de error), la fase de su paso es exactamente su avance en profundidad, cada uno de los 7 elementos sale en una pisada (fases 1,22 · 1,72 · 2,21 · 2,72 · 3,21 · 3,71 · 4,20), «Añadir» funciona en la meseta y la sección deja de ser enfocable al irse; en Juntos, letras y animales fuera de cuadro al empezar, letras levantadas siempre a la izquierda de las que esperan, pata apoyada sin patinar (0,06–0,24 px por paso de 1,1–2,5 px), reversible, y «Gatos» abre la tienda filtrada (también con Tab + Enter).
- Movimiento: estados al 0/25/50/75/100 % de cada transición, relevo de desenfoque sin pérdida de opacidad, cortes siempre ocultos, reversibilidad en 8 puntos, scroll rápido de extremo a extremo y cambio de tamaño de ventana.
- Marionetas: se crean en `file://` y por http; la pata apoyada se desliza 0,03–0,3 px mientras el cuerpo avanza 1,5–3,3 px (no patina); hojas de ciclo a tamaño completo revisadas.
- Tamaños: 1440×900, 1280×800, 768×1024, 390×844 y 320×700, sin desbordamiento horizontal ni errores de consola.

## Limitaciones conocidas

- **Las patas se doblan, no giran.** La marioneta deforma una sola foto por pose: los movimientos son pequeños y verosímiles, no un ciclo completo filmado. Para eso harían falta secuencias de vídeo con transparencia de cada animal (ver `CONSULTA_BIBLIOTECA.md`).
- En el perro de espaldas, cuando la pata trasera derecha se levanta del todo, el borde entre las dos patas traseras puede verse cortado durante un instante.
- Mientras el perro de espaldas aún está muy desenfocado (las primeras décimas del plano 5), la parte baja derecha de su halo borroso muestra un borde escalonado. Ya ocurría antes de esta versión; no está resuelto.
- Sin WebGL o con movimiento reducido se ven las fotos tal cual (sin marionetas).
- El rendimiento solo se midió en Chromium **sin GPU** (WebGL por software). En ese caso la web activa un modo ligero (menos píxeles en las marionetas): 60 fps en el héroe y las mesetas, 49–60 fps en las transiciones (plano 5: 56; cámara y encuentro: 55) y 38–49 fps en «Juntos» a 1440 px (la versión anterior daba 34–39 en la misma máquina); a 390 px, 60 fps en todos los tramos. Con una GPU real no se ha podido medir aquí. No se ha medido en un móvil real.
- Las pruebas se hicieron con Chromium. No se probó en Firefox ni Safari.
- En iPhone, iPad y Mac la tipografía es SF Pro (la del sistema); en Windows y Android se ve Inter, muy parecida pero no idéntica.
- Algunos productos usan fotos de animales como imagen de ambiente, no fotos del producto.
- El origen y los derechos de las seis imágenes del perro y el gato están pendientes de confirmar por el autor (`CREDITS.md`).
