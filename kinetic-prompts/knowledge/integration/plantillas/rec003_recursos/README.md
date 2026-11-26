# Integración preparada · REC-003 con recursos reales (lote 27)

Página `index.html` con la arquitectura **verificada con GSAP 3.15.0** (lote 26): pistas → timeline, `onRefresh`, medidas relativas, restauración al cruzar puntos de corte. Ahora se alimenta de un **manifiesto de recursos de imagen**.

**Probada con FIXTURES DE PRUEBA, rotulados en pantalla:**
- 0 errores y 0 cortes en 1 440, 375 × 812 y 375 × 800;
- nativo ↔ GSAP con 0 % de diferencia visible en layouts de px enteros;
- reversible, pin, resize, reduced motion y desmontaje correctos;
- 0–2 fotogramas > 33 ms.

Evidencias: `evidence/demos/2026-11-02-lote27/`.

## Pasos para sustituir los fixtures por los recursos del usuario
1. **Recibir.** El usuario entrega I1, I2 e I3 (≥ 4) en una carpeta, con los nombres de `integration/contratos/CONTRATO_RECURSOS_REC003.md` §3.
2. **Inspeccionar y preparar** (sin dependencias nuevas):
   ```
   python3 integration/tools/preparar_recursos.py preparar integration/contratos/contrato_rec003.json <entrada> <proyecto>/recursos
   ```
   Revisa `informe.json` (avisos de tamaño, luz, elevación y halo) y `hoja_inspeccion.png` (bordes sobre claro, oscuro y damero).
   - Si falta algo imprescindible, o el borde tiene halo tras descontaminar (|x| ≥ 25), **pide la regeneración**: no lo maquilles.
3. **Calibrar el nido.** Ajusta en `contrato_rec003.json` el `meta.nido` del héroe y del producto (fracciones de la imagen recortada) mirando la hoja. Repite el paso 2.
   - Criterio: en p = 0,86 el nido del héroe debe caer sobre el del plato. Compruébalo con la captura `estados` en 0,86.
4. **Servir.** Instala GSAP 3.15.0 con `npm ci` (con autorización), copia `index.html`, `*.js` y `recursos/`, y abre `index.html?motor=gsap`.
5. **Repetir las pruebas** (todas, con los recursos reales):
   | Prueba | Comando | Criterio |
   |---|---|---|
   | Mecánica, equivalencia, pin, scrub, resize, reduced motion, desmontaje, rendimiento, vídeo | `node integration/tools/validar_gsap.mjs <url>/index.html <salida> 1440`, después `375` y `375 800`; `python3 integration/tools/diferencias.py <salida>` | 0 errores; 0 % visible nativo↔GSAP en px enteros; triggers = 1; desmontaje sin estilos; fotogramas > 33 ms ≤ 2 |
   | Cortes | `python3 integration/tools/cortes_video.py <salida>/recorrido_gsap.webm` | 0 cortes |
   | Composición y legibilidad | `node integration/tools/auditoria_visual_escena.mjs '<url>/index.html?motor=gsap' <salida> '{"protagonista":"#heroe","textos":["#tit","#tit2"],"ocluyentes":[".ing"],"ocluyentes_img":["#delante","#heroe"]}' 1440 20` (y `375`) | `oclusion_img_max` ≤ 0,15 (ala delantera) y ≤ 0,05 (resto); `oclusion_texto_max` ≤ 0,05; ≤ 30 % de pasos sin línea legible |
   | Contraste | colores planos: calcular la razón WCAG (tinta `#231a14` sobre hueso `#efe6d6` = 13,8:1; sobre el panel granate `#7e2a1d` solo 1,82:1 y sobre terracota `#A4472D` 2,76:1 → el titular NUNCA debe cruzar el panel; calculado en el lote 27); si el titular cruza el panel o una imagen, `contraste_compuesto.mjs` **no sirve** en esta página (devuelve `[]`: solo evalúa textos sobre degradados o imágenes de fondo) → revisar la hoja de estados | ≥ 4,5:1 (3:1 en titulares grandes) |
   | Memoria | `informe.json` → `memoria_decodificada_max_MB` | ≤ 60 MB en escritorio |
   | C1 | hoja de estados (0 / 25 / 50 / 75 / 86 / 100 %) lado a lado con `REC003_FIDELIDAD_CINCO_ESTADOS.md` | revisión humana |
   | C3 | rúbrica de EVAL-001 | **la puntúa el usuario** |
6. **Si hay O1 (secuencia):** extrae los fotogramas (ffmpeg), recórtalos con `preparar_recursos.py` (rol `heroe`, uno por fotograma) y sustituye las pistas x / y / escala del héroe en 0,72–0,86 por la secuencia en canvas (SEQ-001, SEQ-002; interpolación según SEQ-003).

## Decisiones técnicas verificadas en el lote 27
- **Sin `mix-blend-mode` ni filtros CSS sobre capas que cambian cada fotograma.** Era la causa medida del bajo rendimiento de REC-003 a 1 440 px: con `multiply` en la sombra, 26–38 fotogramas > 33 ms; sin él, 0–1. Sombras y desenfoques **horneados** en los recursos.
- **`img.decode()` de todos los recursos antes de arrancar el timeline** (sin decodificaciones durante el scroll).
- **AVIF si el navegador lo decodifica, WebP en caso contrario;** variante = la menor ≥ ancho CSS × DPR (máx. 2).
- **Cambio de profundidad del héroe en p = 0,72**, oculto por el cambio de texto. Corrige una oclusión del 71 % medida en móvil.
- **Sin recursos imprescindibles la página no arranca** y lista lo que falta. No hay sustitutos vectoriales.

## Variante `index_flip.html` (lote 28, a partir de vídeos de GreenSock)
- **Aterrizaje del héroe:** `Flip.fit(contenedor, nidoPlato, { fitChild: nidoHéroe, scale: true, getVars: true })` en lugar del cálculo manual. Precisión equivalente: 0,96–1,11 px frente a 0,25–0,58 px. Úsala si el héroe rota o hay transformaciones anidadas.
- **Zoom:** `expoScale(1, s, power2.inOut)`. El ritmo percibido del zoom es ~25 veces más fiel a la curva (RMS del log del área 0,0009 frente a 0,024).
  - **Pendiente:** reconstruir el timeline tras un resize sin cruce de punto de corte (medido: RMS 0,0123).
- **Validada a 1 440 px con fixtures:** 0 errores, reversible, pin, resize, reduced motion y 0 fotogramas > 33 ms.
- **Cómo usarla:** `?motor=gsap` (modo Flip por defecto; `&modo=manual` para comparar; `&expo=0` sin expoScale).
