# Evidencia visual — sesión 2026-10-26 (lote 5)

**Qué es:** capturas y mediciones de **demostraciones públicas** de los autores, ejecutadas en el navegador integrado de Cowork (pane "Claude Browser", equipo del usuario), sin iniciar sesión ni instalar nada. Acceso concedido por sitio: blog.olivierlarose.com, codepen.io, cdpn.io, r3f-3d-text-effect.vercel.app, tympanus.net.

**Qué NO es:** no se ha visto ningún vídeo de YouTube. Una captura de una demo no equivale a estudiar el tutorial en vídeo.

**Condiciones:** viewport del pane 747×894 CSS px (no 1440×900), devicePixelRatio 1,5, ~60 fps medidos (242 frames en 4 s en la serie de ZOOM-001).

**Tamaño, reescalado y recorte de las capturas (aclaración v0.6.1):**
- La herramienta de captura trabaja en un **marco de coordenadas de 800×957 px** (no coincide con los 747×894 CSS px del viewport ni con los píxeles físicos a DPR 1,5; incluye la barra de scroll). Ese marco es el que usan las coordenadas de clic/hover citadas en las fichas.
- Las 12 capturas `.jpg` son vistas **completas** del pane **reducidas a 0,5** → **400×478 px** (≈ 0,535 px de imagen por px CSS). No están recortadas.
- `HOV-001_gsap_boton_atraido.png` (138×139 px): **recorte** de la región (100,240)–(330,470) del marco 800×957, devuelto a escala 0,6.
- `TXT3D-001_store_tarjetas_html.png` (352×129 px): **recorte** de la región (180,400)–(620,560), escala 0,8.
- Ninguna captura es un fotograma de vídeo. Compresión JPEG/PNG de la herramienta, sin edición posterior.
- Uso interno como evidencia; contienen imágenes de terceros (no redistribuir).

**Datos en bruto:** carpeta [data/](data/) — un JSON por medición, con el método, el tipo (`MEDIDO_DOM`) y las series. Las cifras de las fichas que no tengan JSON aquí son cálculos o estimaciones y así se etiquetan ([CALC]/[EST]).

**Código de terceros:** las demos se ejecutaron como páginas web públicas dentro del navegador (su sandbox normal). Solo se ejecutó código propio de medición en la consola de la página; en GL-002 se llamó a la función pública `sketch.next()` de la demo. Nada se ejecutó en la terminal ni en los proyectos del usuario.

**Método de medición:** `window.scrollTo` + espera para estados estables; bucles `requestAnimationFrame` que registran `getComputedStyle().transform`, `getBoundingClientRect()`, `gsap.getProperty()` o uniforms; movimiento real del puntero y rueda con la herramienta del navegador.

| Archivo | Demo | Ficha |
|---|---|---|
| ZOOM-001_p0_inicio.jpg · _p050_intermedio.jpg · _p100_final.jpg | blog.olivierlarose.com/demos/zoom-parallax | ZOOM-001 |
| TXT-002A_scroll350_degradado.jpg | blog.olivierlarose.com/demos/text-gradient-opacity-on-scroll | TXT-002 |
| FLIP-001_cardstack_tras_1_clic.jpg | cdpn.io/pen/debug/Yzdzxem (GreenSock "Flip Cards") | FLIP-001 |
| HOV-001_gsap_overwrite_reposo.jpg · HOV-001_gsap_boton_atraido.png | cdpn.io/pen/debug/azmKBBJ (GreenSock "Overwrite / Dynamic Tweens") | HOV-001 |
| TXT3D-001_home.jpg · _enter_transicion.jpg · _store_final.jpg · _store_tarjetas_html.png | r3f-3d-text-effect.vercel.app (Wawa Sensei) | TXT3D-001 |
| GL-002_demo1_inicio.jpg · _intermedio.jpg · _final.jpg | tympanus.net/Development/webGLImageTransitions/ (Yuri Artiukh / Codrops) | GL-002 |

Intento fallido documentado: Chromium de la nube (salida de red 403 a estos dominios) y extensión Claude in Chrome (no conectada). El pane integrado de Cowork sí funcionó.
