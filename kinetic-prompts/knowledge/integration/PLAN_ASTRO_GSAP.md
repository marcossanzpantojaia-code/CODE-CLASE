# Plan: landing cinematográfica con Astro + GSAP (estado: PLANIFICADO, NADA INSTALADO)

Redactado en el lote 19 (2026-10-27). **No se ejecuta hasta que el usuario autorice la instalación.** Su objetivo es comprobar técnicas **reales** de GSAP y ScrollTrigger, no efectos CSS, y medir si las fichas son aplicables con las versiones vigentes.

## 1. Versiones fijadas (comprobadas con `npm view` el 2026-10-27) [MED]
| Paquete | Versión exacta | Licencia / nota |
|---|---|---|
| `astro` | **7.4.2** | MIT. `engines.node >= 22.23.4`; el contenedor tiene **22.23.4** (justo el mínimo). Usa Vite `^8.3.4` |
| `gsap` | **3.15.0** | "Standard 'no charge' license" (uso comercial permitido; ver VERSIONES_VIGENTES.md). Incluye ScrollTrigger, SplitText y ScrollToPlugin en el mismo paquete |
| `lenis` | 1.3.27 | MIT. **Opcional**: solo si la prueba incluye *smooth scroll* (ST-004, GS-002) |
| `typescript` | **6.0.3** (no 7.x) | `@astrojs/check@0.9.12` declara `peerDependencies.typescript: "^5.0.0 \|\| ^6.0.0"`. TS 7.0 no tiene API programática estable (prevista en 7.1), así que el servidor de lenguaje de Astro no funciona con él (TS-001, lote 19) |
| `@astrojs/check` | 0.9.12 | solo si se ejecuta `astro check` |
| `lighthouse` | 13.5.0 | Apache-2.0; `engines.node >= 22.19`. Opcional (T11) |
| `@playwright/test` | **no se instala** | se usa el Playwright 1.63.0 ya presente en el contenedor |

Todas son dependencias **oficiales y gratuitas**. No se usa ningún registro privado ni token (`.npmrc`) (DRAG-001, GS-004). Instalación con `npm install --save-exact` y `package-lock.json` guardado como evidencia.

## 2. Aislamiento
- Carpeta temporal nueva en el espacio de trabajo de la sesión, fuera de la biblioteca y de cualquier proyecto (`.../scratchpad/astro_gsap_1/`).
- `npm install --ignore-scripts` primero. Si algún paquete necesita *postinstall* (p. ej. `sharp` para imágenes), documentarlo y pedir confirmación antes de habilitarlo.
- Sin publicación ni despliegue; solo `astro build` + servidor local (`astro preview` o `python3 -m http.server` sobre `dist/`).
- Registrar `node --version`, `npm --version`, `npm ls --depth=0`, sha256 del lockfile y tamaño de `node_modules`.

### 2b. Comprobación previa sin instalar (lote 21) [MED, 2026-10-27]
- `npm view`: astro 7.4.2, gsap 3.15.0, typescript 7.0.2 (la última, **no** se usa) / 6.0.3, @astrojs/check 0.9.12, lenis 1.3.27 y sharp 0.35.5 siguen siendo las versiones vigentes.
- En `astro@7.4.2`:
  - `optionalDependencies.sharp: ^0.35.4`, sin script de instalación; usa binarios `@img/sharp-*` y `@img/sharp-libvips-*`;
  - `@astrojs/markdown-remark` es un par **opcional**;
  - no depende de esbuild; Vite 8.3.5 usa rolldown 1.2.15 y lightningcss.
- Árbol resuelto con `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` en una carpeta temporal, **sin crear `node_modules`**:
  - 336 paquetes;
  - un único `hasInstallScript`: **fsevents** (solo macOS, opcional);
  - licencias: MIT 260, Apache-2.0 17, ISC 14, MPL-2.0 12, **LGPL-3.0-or-later 10** (libvips, enlazado dinámicamente por sharp) y BSD, BlueOak, CC0 y 0BSD.
- `package.json` y `package-lock.json` guardados en `evidence/integration/2026-10-27/lote21/` (sha256 del lock `e51b664348161dd9b1906760a39340c5294a2e9e8d32d24bdfa09d1d55efeb3d`).

### 2c. Procedimiento de instalación (para cuando se autorice; nada global)
```bash
T=<scratchpad>/prueba_actos_i_ii && mkdir -p "$T" && cd "$T"
cp <biblioteca>/evidence/integration/2026-10-27/lote21/package.json <biblioteca>/evidence/integration/2026-10-27/lote21/package-lock.json .
printf 'fund=false\naudit=false\nsave-exact=true\n' > .npmrc        # configuración LOCAL del proyecto, sin ~/.npmrc
sha256sum package-lock.json                                         # debe coincidir con e51b6643…
npm ci --ignore-scripts                                             # instala exactamente el lockfile; sin -g
npx --no-install astro --version && npx --no-install tsc --version  # binarios locales (7.4.2 / 6.0.3)
node -e "import('gsap').then(m=>console.log(m.gsap.version))"       # 3.15.0
npm ls --depth=0 > npm_ls.txt; du -sh node_modules >> npm_ls.txt
```
- Si `sharp` falla al cargar con `--ignore-scripts`, **no** se habilitan scripts sin permiso: Astro puede usar `image.service: passthroughImageService()` en la prueba [verificar en la doc de Astro 7 antes de usarlo].
- Nada de `npm install -g`, `npm config set`, `corepack enable` ni cambios en `~/.npmrc`. Para retirarlo todo basta con borrar la carpeta temporal.

> **Aviso (lote 22):** el árbol resuelto en el §2b es un **análisis de dependencias**, no una instalación validada. Hasta ejecutar el §2c y las pruebas K1–K8, nada de esta tabla está comprobado en funcionamiento.

### 2d. Pruebas mínimas de GSAP (lote 22; se añaden a K1–K6)
| Prueba | Página mínima | Aprobada si |
|---|---|---|
| **K7 ScrollTrigger + pin + scrub** | Una sección de 3 alturas de ventana con un `div` fijado; `gsap.to(".caja", { x: 400, ease: "none", scrollTrigger: { trigger: ".s", pin: true, scrub: true, end: "+=200%" } })` | `curvas_scroll.mjs`: `tx` crece de forma monótona de 0 a 400 entre el 0 y el 100 % del recorrido del pin (±2 %); al volver a 0, `tx` = 0 (reversible); 0 errores de consola |
| **K8 SplitText con máscara de líneas** | Un `h1` de 3 líneas; `SplitText.create(h1, { type: "lines", mask: "lines", autoSplit: true, onSplit: s => gsap.from(s.lines, { yPercent: 100, stagger: 0.08 }) })` | se generan 3 líneas con su envoltorio de máscara; al redimensionar de 1 440 a 375 px se recalculan (`autoSplit`); el texto sigue siendo legible por el lector (`aria-label`, TXT-001); con reduced motion no hay animación |
| **K9 Limpieza** | Montar, desmontar y montar de nuevo el componente 5 veces (o navegar 5 veces con `<ClientRouter />`) | `ScrollTrigger.getAll().length` constante; sin `pin-spacer` huérfanos en el DOM |

### 2e. Limpieza del entorno (reversible)
1. Detener los servidores locales (`astro dev`/`preview`, `http.server`) por su PID.
2. Guardar las evidencias (lockfile, `npm_ls.txt`, resultados) en la biblioteca.
3. `rm -rf <scratchpad>/prueba_actos_i_ii` (borra `node_modules`, `.npmrc` local y `dist/`).
4. Comprobar que no quedó nada global: `npm ls -g --depth=0` sin cambios respecto al registro inicial; `~/.npmrc` sin modificar (comparar su sha256 antes y después; si no existía, que siga sin existir).
5. La caché de npm (`~/.npm/_cacache`) solo se purga si el usuario lo pide (`npm cache clean --force`); se documenta su tamaño antes y después.

## 3. Pruebas de compatibilidad con las fichas (antes de construir la landing)
(Se llaman K1–K6 desde el lote 20 para no confundirlas con los criterios C1–C3 de EVAL-001.)
Una página mínima por grupo, cada una con su criterio fijado antes:
| Prueba | Fichas | Comprobación ejecutable |
|---|---|---|
| K1 Script de GSAP en un componente Astro (módulo empaquetado) | ASTRO-001, ASTRO-004 §7 | `gsap.version === "3.15.0"`; 0 errores de consola; el *bundle* contiene GSAP una sola vez |
| K2 `<ClientRouter />` + `astro:page-load` / `astro:before-swap` + `gsap.context().revert()` | ASTRO-004 §7, ST-004 | ida y vuelta 5 veces entre 2 páginas: `ScrollTrigger.getAll().length` constante (no crece) |
| K3 Cambios de Astro 6/7 | ASTRO-004 (apéndice del lote 19) | no usar `<ViewTransitions />` ni las constantes `TRANSITION_*`; build sin avisos; el compilador Rust no rechaza el marcado |
| K4 `<Image />` con `layout="constrained"` | ASTRO-004 §5 | `srcset` y `sizes` generados; CLS = 0 |
| K5 `gsap.matchMedia()` con `reduceMotion` | GS-004 §6, A11Y-001 | con `reduce`: 0 ScrollTriggers con `scrub`, 0 contenido oculto |
| K6 TypeScript 6 + `astro check` | TS-001 | `astro check` sale con 0 errores |

Si una prueba falla, se anota en la ficha correspondiente como **incompatibilidad de versión**. No se sigue construyendo sobre ella sin documentarla.

## 4. Landing de demostración: técnicas GSAP reales que debe contener
Misma marca ficticia ("Barbería Castellana"), con contenido ficticio y sin servicios reales.
1. **Héroe con timeline de entrada** (`gsap.timeline` + SplitText por líneas con `mask: "lines"`, `autoSplit`, `onSplit` que devuelve la animación) — TXT-001, GS-004 §6.
2. **Sección fijada con scrub** (`pin: true`, `scrub: 1`, `end: "+=150%"`), con la secuencia de 3 pasos del "ritual" (corte → navaja → toalla) — ST-001, ST-002 (sin `will-change` ni `transform` en ancestros del pin).
3. **Galería horizontal** con `x: () => -(track.scrollWidth - innerWidth)`, `ease: "none"`, `invalidateOnRefresh: true` y `containerAnimation` para los revelados internos — ST-003, GS-004 (no copiar el ejemplo `Max.max`).
4. **Revelados por lotes** con `ScrollTrigger.batch` y `once: true` — ST-001.
5. **Anclas** con ScrollToPlugin `offsetY` = alto de la cabecera y foco al destino — GS-004 §6, A11Y-006.
6. **matchMedia** con escritorio, móvil y `reduceMotion`, más un interruptor visible de animaciones con `gsap.matchMediaRefresh()` — A11Y-001, GS-004.
7. **Cabecera móvil = marca + menú**; CTA de reserva dentro del menú y en una barra inferior fija — UX-004 (fallo de A1).
8. Capa base sin JS: todo el contenido visible si GSAP no carga — ARCH-001 paso 12.

## 5. Validación (misma batería que A1/B1 + específica de GSAP)
- T1–T10 con `integration/tools/prueba_web_playwright.mjs`, `extra_generico.mjs` y `contraste_compuesto.mjs`.
- Específicas:
  - número de ScrollTriggers creados y tras navegación;
  - posiciones `start`/`end` de cada trigger a 375 y 1440 px;
  - muestreo de `progress()` del pin a lo largo del scroll (curva de scrub);
  - vídeo `recordVideo` a 1440 y 375 px;
  - tiempo de *long tasks* durante el scroll (`PerformanceObserver` `longtask`);
  - `prefers-reduced-motion` con el interruptor.
- Una ficha solo pasa a **IMPLEMENTADO** si su técnica aparece en el código y su prueba pasa. Pasa a **VALIDADO** solo con revisión humana del vídeo y pruebas en ≥ 2 navegadores (`web-qa-validation`).

## 6. Comparación con y sin biblioteca sobre este stack
Para que la comparación mida la biblioteca y no la restricción de "sin dependencias", ambos brazos recibirían la **misma carpeta** con Astro + GSAP ya instalados (mismo lockfile). El encargo pediría la landing cinematográfica, el brazo B iría sin `--add-dir`, y las ejecuciones serían alternas, ≥ 3 por brazo (`COMPARACION_CON_SIN_BIBLIOTECA.md`). Claude Code necesitaría `Bash` restringido a `npx astro build`, para poder compilar y comprobar su propio trabajo. **Esto requiere una autorización aparte.**

## 7. Autorizaciones necesarias (ninguna concedida todavía)
1. `npm install --save-exact astro@7.4.2 gsap@3.15.0 typescript@6.0.3` (+ opcionales `lenis@1.3.27`, `@astrojs/check@0.9.12`, `lighthouse@13.5.0`) en la carpeta temporal.
2. Construcción de la landing por el orquestador (pruebas K1–K6 y §4), o encargo a Claude Code (§6).
