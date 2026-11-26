# Bloqueo de dependencias del prototipo n.º 1 (registrado ANTES de construir, 2026-10-27)

Comprobado en el contenedor Linux de la sesión (sin instalar nada):
- **Disponibles:** Node v22.23.4, npm 10.9.9, Playwright 1.63.0 (Node y Python, con Chromium preinstalado), `http-server`, `serve`, `eslint`, `prettier`, `typescript`, `sharp` (paquetes globales ya presentes).
- **No disponibles:** **Astro**, **GSAP** y **Lighthouse** (no están en los módulos globales ni en el sistema; la caché de npm no contiene sus paquetes).
- La directiva prohíbe instalar paquetes sin autorización → **no se instala** `astro` ni `gsap` ni `lighthouse`.

Decisión (documentada antes de continuar):
- El prototipo se construye con **HTML, CSS y JavaScript nativos**, sin dependencias ni CDN, para poder ejecutar las pruebas con las herramientas existentes.
- **GSAP: BLOQUEADO** en este prototipo → los revelados y transiciones serán CSS/JS nativos (la biblioteca lo contempla como capa base: ARCH-001 paso 12, CSS-001). Las técnicas GSAP de la biblioteca **no se ponen a prueba** en esta ejecución.
- **Lighthouse: BLOQUEADO** → las métricas de rendimiento se toman con la API de rendimiento del navegador desde Playwright (laboratorio, no CWV de campo).
- Para un prototipo con Astro + GSAP + Lighthouse hace falta autorización explícita para `npm install` en la carpeta temporal (p. ej. `astro`, `gsap@3.15.0`, `lighthouse`).
