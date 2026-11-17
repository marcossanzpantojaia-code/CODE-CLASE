# Créditos y licencias — WILDPAW

## Protagonistas de la historia: golden retriever y gato atigrado

Las seis imágenes de estudio (perro corriendo de frente, perro de espaldas, perro de perfil,
gato de espaldas, gato saltando y gato de perfil) las **aportó el autor del proyecto** en el
archivo `gato_y_perro_6_perspectivas.zip`. Están en `assets/img/cast/`.

> **Pendiente de confirmar por el autor:** el origen exacto y los derechos de uso de estas seis
> imágenes (si son generadas con IA, con qué herramienta y bajo qué condiciones; si son de un
> banco, con qué licencia). Hasta entonces deben considerarse material del autor para un
> proyecto de clase, no recursos libres para redistribuir.

**Preparación hecha para esta web** (sin generar ni inventar píxeles nuevos): recorte del fondo
con un modelo de segmentación (`@imgly/background-removal-node`, ejecutado en local), limpieza del
color del fondo en los bordes del pelo, extracción de la sombra de contacto a una capa propia,
dos versiones desenfocadas de cada pose (para el desenfoque de proximidad), igualado de la
saturación entre poses y conversión a WebP. Las texturas `wash-dog.webp` y `wash-cat.webp` son un
desenfoque extremo del pelaje de esas mismas fotos, y las sombras `*-shadow-soft.webp`, un desenfoque
de sus sombras. En la web, cada foto se deforma en tiempo real con un esqueleto 2D (`js/rig.js`) para
mover patas, cola, orejas y lengua: es una modificación de la imagen, no material nuevo.

## Fotografías de productos y peces (CC BY 2.0)

Proceden del **Open Images Dataset** (Google), cuyas imágenes
se publicaron originalmente en Flickr bajo licencia
[Creative Commons Attribution 2.0](https://creativecommons.org/licenses/by/2.0/).

**Modificaciones realizadas:** eliminación del fondo, recorte, limpieza de bordes,
volteo horizontal en algunos peces y conversión a WebP. Las fotos se usan en una
tienda **demostrativa**; ningún autor respalda este proyecto.

| Uso en la web | Título original | Autor | Enlace |
|---|---|---|---|
| Producto: juguete (gato siamés) | Yuri | diogo86 | https://www.flickr.com/photos/diogo86/385760099 |
| Producto: collar (malinois) | HMKC Christmas Fun Run 2012 | SheltieBoy | https://www.flickr.com/photos/montanapets/8264360587/ |
| Producto: arnés (corgi) | 100均に買い出しに行ったら超かわいいコーギーがいた | ta@keshi kimi | https://www.flickr.com/photos/kimi-/6179233203 |
| Producto: rascador | 001 | Jennifer C. | https://www.flickr.com/photos/29638108@N06/5516329509 |
| Producto: cama de gato | Just another lazy Caturday | Bill & Vicki T | https://www.flickr.com/photos/iluvcocacola/13177267704 |
| Producto: cama cueva | The elusive and deadly Trap-Door Italian Greyhound. | Laurence Simon (Crap Mariner) | https://www.flickr.com/photos/isfullofcrap/10075116003 |
| Pez payaso | Shedd Aquarium | Hyderabadi Ladka | https://www.flickr.com/photos/srikanth554/8145221528 |
| Garibaldi | Orange Fish | 561design | https://www.flickr.com/photos/chofung/2675548185/ |
| Anthias | MM00031891 | Florida Keys--Public Libraries | https://www.flickr.com/photos/keyslibraries/5711675770 |
| Pez arcoíris | MY FISH 020 | LEONARDO DASILVA | https://www.flickr.com/photos/leonardodasilva/293971481 |
| Cirujano amarillo | Yellow Fish | Lori L. Stalteri | https://www.flickr.com/photos/llstalteri/5286900156 |
| Pez león | Pesce Leone | Nicola Sfondrini | https://www.flickr.com/photos/sfondrininicola/4675057796 |
| Roncador plateado | Yellow Striped Tropical Fish | Chris Williamson | https://www.flickr.com/photos/chriswsn/3336646085 |
| Pez mariposa | Acuario de Bergen | Adrián Santos | https://www.flickr.com/photos/adsaman/4997939389 |
| Damisela azul | Reef Tank at Long Island Aquarium | KEN_S_NY | https://www.flickr.com/photos/45817379@N06/9438650875 |

## Tipografía

- En iPhone, iPad y Mac se usa la tipografía del sistema (**SF Pro**), que no se incluye ni se
  redistribuye: la pone el propio dispositivo.
- En el resto de equipos se usa **Inter** (Rasmus Andersson), fuente variable bajo
  **SIL Open Font License 1.1**, incluida en `assets/fonts/inter-latin-var.woff2` (subconjunto latino).

## Librerías

- **GSAP 3.15.0**, **ScrollTrigger** y **Flip** (GreenSock) — licencia estándar gratuita
  ("Standard No Charge License", https://gsap.com/standard-license). Copiadas sin
  modificar en `js/vendor/`.

Todo el código propio (HTML, CSS y JS) se ha escrito para este proyecto.
