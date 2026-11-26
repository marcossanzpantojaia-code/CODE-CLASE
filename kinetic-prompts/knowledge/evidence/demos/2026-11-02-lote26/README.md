# Evidencia del lote 26 (2026-11-02) — validación real con GSAP 3.15.0

**Entorno:**
- Contenedor Linux sin GPU (2 CPU, 7 GB); Chromium 153 vía Playwright 1.63.0; software rendering.
- GSAP 3.15.0 instalado con `npm ci` en una carpeta temporal aislada (autorización del usuario). `node_modules` **no** se incluye.
- Para reproducir: `npm ci` en `demos/`, servir la carpeta por HTTP y abrir `receta_{a,b,c}.html?motor=gsap|nativo&pin=1&scrub=0.8`.

| Carpeta / archivo | Contenido |
|---|---|
| `RESULTADOS.md` | Tablas consolidadas: pruebas nativo/GSAP, rendimiento y auditoría |
| `hoja_estados_gsap_{1440,375}.png` | 5 estados de las 3 recetas con GSAP (revisión visual) |
| `demos/` | Código ejecutado: recetas, motores, `arranque.js`, `genera_plato.py`, `validar_gsap.mjs`, `diferencias.py`, pruebas de los hallazgos D2 y D6, `package.json` y `package-lock.json` |
| `resultados/<receta>_<viewport>/` | `resultados.json`, `diferencias.json`, `mapa_diferencias.png`, estados nativo/GSAP/pin (WebP), reduced motion, `*_cortes.json`; vídeos de bajada y subida (GSAP; a 1 440 px también pin y nativo) |
| `hallazgos/` | `prueba_onrefresh.json` + capturas (D2), `prueba_breakpoint.json` (D6), partículas tras corregir la cuña y el mosaico |
| `auditoria/` | AUD-001 sobre las versiones GSAP corregidas (21 pasos, 1 440 y 375 px) |

**Limitaciones:**
- Solo Chromium.
- Recursos procedurales: no evaluables en C1/C3.
- Vídeos a 25 fps grabados por Playwright, con scroll de rueda simulado.
- Rendimiento sin GPU, que no representa dispositivos reales.
- En el paquete aparte del lote hay más capturas y vídeos (todas las variantes).
