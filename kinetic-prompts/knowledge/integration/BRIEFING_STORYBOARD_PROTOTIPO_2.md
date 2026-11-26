# Prototipo n.º 2 — Briefing y storyboard (estado: PREPARADO, NO IMPLEMENTADO)

Lote 20 (2026-10-27). Toma los **principios** de la referencia Enky (CASE-003). No copia su identidad: ni sus marcas, ni sus textos, ni sus productos, ni su paleta exacta. Marca ficticia: **Barbería Castellana** (Madrid). Todo el contenido es ficticio. **No se empieza hasta que el usuario lo autorice.**

## 1. Briefing
| Campo | Decisión |
|---|---|
| Objetivo | Una landing que, **en una captura fija y en vídeo**, alcance el nivel creativo de la referencia (EVAL-001 C3 ≥ 4,0), **sin perder la utilidad comercial** que tenía A1 (precios, horario, reserva) |
| Idea central | **"El ritual"**: la historia de un afeitado clásico en 3 actos, contada por un único objeto que se transforma |
| Objeto protagonista | La **navaja**, que se convierte en **espuma** y la espuma en **vapor de toalla caliente** (transformación continua, SEQ-001) |
| Público | Hombres de 25–55 años en Madrid centro que valoran el oficio; también regalos |
| Tono | Sobrio, artesanal, cálido; sin estética "gamer" ni neón |
| Stack previsto | Astro 7.4.2 + GSAP 3.15.0 (ScrollTrigger, SplitText) + TypeScript 6.0.3 (`integration/PLAN_ASTRO_GSAP.md`); Lenis opcional |
| Recursos visuales | **Decisión pendiente del usuario** (§5). Sin recursos fotorrealistas el prototipo no puede aprobar C1 ni C3 |
| Fuera de alcance | Reservas reales, pagos, CMS, despliegue |

## 2. Dirección de arte (ART-001)
- **Paleta por acto**, dentro de una misma familia cálida. Valores en OKLCH **orientativos**, a medir con UI-002 y TEST-003:
  - Acto 1 "El filo": negro tabaco `oklch(18% 0.02 50)` con acento latón `oklch(72% 0.09 80)`.
  - Acto 2 "La espuma": crema `oklch(94% 0.02 85)` con texto tabaco.
  - Acto 3 "El calor": terracota apagada `oklch(52% 0.09 45)` con texto crema.
  - Cierre comercial: crema, con el latón como único acento.
- **Tipografía:**
  - Display serif de alto contraste y condensada para los titulares de ≥ 9 vw (a elegir entre fuentes libres, OFL; TYPE-001).
  - Sans humanista para el texto.
  - Microrrótulos en versalitas con `letter-spacing` 0,16 em: "ACTO I — EL FILO".
- **Luz:** clave baja con luz lateral cálida desde la izquierda en todos los recursos, sombra de contacto bajo el objeto y brillo especular en la hoja.
- **Interfaz:**
  - Cabecera fina (marca + menú en móvil, UX-004) y botón píldora "Reservar" de altura ≥ 44 px.
  - Puntos de progreso de los 3 actos a la derecha, con `aria-label`.
  - Botón de animaciones on/off (A11Y-001).

## 3. Storyboard (fotogramas clave; % = progreso del recorrido del pin de cada acto)
| # | Fotograma clave (1 440 px) | Capas, de atrás adelante (DEPTH-001) | Movimiento: entra → se transforma → sale | Móvil (375 px) |
|---|---|---|---|---|
| F0 · Carga | Fondo tabaco; navaja **cerrada** en el centro-derecha, en ángulo de 20° | fondo → palabra fantasma "FILO" (30 vw, +6 % de luminosidad) → titular "El oficio empieza en el filo." → navaja → motas de luz delante | 0–0,9 s: el titular entra por líneas (SplitText `mask: "lines"`, `y: 100 %`, `power3.out`, `stagger: 0.08`); la navaja entra con `autoAlpha` + `scale 0,96 → 1` en 0,8 s | Navaja arriba, titular debajo; palabra fantasma recortada |
| F1 · Acto I 0–40 % | La navaja **se abre** con el scroll; un destello recorre la hoja | igual que F0 | fotogramas 0–35 de la secuencia; el titular sube y se desvanece (40–60 %); el microrrótulo "ACTO I — EL FILO" queda fijo | igual |
| F2 · Acto I 40–100 % | Hoja abierta en primer plano; aparecen **3 satélites** en órbita: "Navaja libre", "Perfilado", "Afeitado clásico", con su precio | satélites delante y detrás de la hoja (`zIndex` según la profundidad) | los satélites entran escalonados (0,2 s) en el 50 %, orbitan lentamente (14 s por vuelta) y salen con `autoAlpha` en el 95 % | sin órbita: los 3 satélites en una fila debajo |
| F3 · Paso I→II | **Transformación**: del filo brotan hilos blancos que se enroscan en una **hélice de espuma** | el fondo pasa de tabaco a crema con `scrub` (backgroundColor) | fotogramas 35–70; el color del fondo cambia entre el 85 % del acto I y el 15 % del acto II; sin cortes | igual |
| F4 · Acto II | La espuma se posa en un cuenco con brocha; titular "La espuma se trabaja, no se aplica." **detrás** del cuenco | fondo crema → fantasma "ESPUMA" → titular → cuenco → burbujas delante | el titular sube (`yPercent`) más despacio que el cuenco (parallax −10 % / +5 %); burbujas a +20 % | titular encima del cuenco, sin solaparse |
| F5 · Paso II→III | La espuma se convierte en **vapor**, que se extiende hacia arriba | entra desde abajo un panel terracota de esquinas redondeadas (CARD-001), por encima del fondo y por debajo del vapor | fotogramas 70–100; el panel cubre el 100 % en el recorrido 0–30 % del acto III | igual |
| F6 · Acto III | **Toalla caliente** enrollada con vapor; titular "Diez minutos que no se cuentan." | panel terracota → fantasma "CALOR" → titular → toalla → vapor delante | la toalla se desenrolla (fotogramas 100–130); al final aparecen el subtítulo y el botón "Reservar mi ritual" (`autoAlpha` + `y 12 px`, 0,5 s) | igual |
| F7 · Cierre comercial | Sin secuencia: carta de servicios con precios y duraciones, horario, mapa esquemático y formulario (lo que mejor funcionó en A1) | crema; el latón como acento | revelados cortos (ST-005 batch, `once`) | una columna; botón de reserva visible |
| F8 · Reduced motion | Los 3 fotogramas clave (F2, F4 y F6) como imágenes estáticas con su texto | — | sin pin, sin secuencia, sin órbitas | igual |

Duraciones del pin (orientativas, a ajustar con C2): acto I `+=220 %`, acto II `+=160 %`, acto III `+=180 %` de la altura de la ventana; `scrub: 0.6`.

## 4. Criterios de aceptación (verificables; detalle en EVAL-001)
1. **Técnicos:** T1–T10 sin fallos críticos (TEST-004); cabecera en una fila a 320/375 px; contraste del titular p10 ≥ 3:1 sobre los recursos (TEST-003); LCP de laboratorio con el fotograma 0 como `<img>` prioritario; peso de la secuencia ≤ 8 MB en escritorio y ≤ 4 MB en móvil [presupuesto propio].
2. **C1 · fidelidad visual:**
   - capturas de F0, F2, F4, F6 y F7 a 1 440 y 375 px, lado a lado con este storyboard, con la conformidad de un revisor;
   - `foco_mayor_componente` ≥ 0,30 en F0, F2, F4 y F6;
   - `dispersion_tono` ≤ 0,05 dentro de cada acto;
   - titular ≥ 9 vw;
   - 0 ilustraciones genéricas.
3. **C2 · fidelidad de movimiento:**
   - curvas medidas de la tabla §3 (entrada y salida ±10 %);
   - secuencia continua (Δ ≤ 2 fotogramas por paso, 0 pasos sin objeto);
   - vídeo a 1 440 y 375 px revisado por una persona;
   - 0 tareas largas > 50 ms en escritorio;
   - *reduced motion* correcto.
4. **C3 · calidad creativa:** rúbrica de EVAL-001 con media ≥ 4,0 y ninguna dimensión < 3, puntuada por el usuario (o por una persona que no haya construido la web).
5. **Comercial:** precios, horario y reserva a ≤ 1 pantalla del final de la historia y accesibles desde el menú; formulario como en A1 (errores con texto, foco, 0 peticiones).

## 5. Decisiones pendientes del usuario (bloquean la implementación)
| # | Decisión | Opciones con 0 € | Observación |
|---|---|---|---|
| D1 | Origen de los recursos fotorrealistas (navaja, espuma, toalla y vapor en secuencia con alfa) | (a) render en **Blender** (gratuito; requiere autorización para instalarlo); (b) **Three.js** en tiempo real (navaja modelada, espuma y vapor con partículas o shaders: menos fotorrealista, más ligero); (c) fotografía o vídeo propio del usuario; (d) marcadores grises (solo prueba técnica, **no** aprobará C1/C3) | La referencia probablemente usó imagen o vídeo generado por IA (etiqueta de Instagram). Esa opción **no** está autorizada ni evaluada (coste y licencias) |
| D2 | Instalación del stack | `PLAN_ASTRO_GSAP.md` §7 | — |
| D3 | Quién puntúa C3 | el usuario u otra persona | Claude Code no puede autoevaluar C3 como aprobado |

## 6. Limitaciones
- Las velocidades y tiempos del storyboard son **propuestas**: la referencia solo permitió medir perfiles de scroll a baja resolución (CASE-003 §8).
- Los umbrales de C1 son provisionales (EVAL-001 §4).
