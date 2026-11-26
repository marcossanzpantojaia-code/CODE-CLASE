# Viabilidad del Hito A: render real de la navaja (lote 23, 2026-10-27)

**Estado: PREPARADO. No se ha instalado Blender, ni se ha descargado ningún recurso, ni se ha ejecutado ningún render.** R1 y R1b siguen **sin autorizar**, así que **no hay imagen**. Esta página se limita a dejar lista la ejecución y a decir qué falta.

## 1. Equipo donde se ejecutaría Blender
| Equipo | Hecho comprobado | Viable para el Hito A |
|---|---|---|
| Contenedor de la sesión | 2 núcleos, 7 GB, sin GPU [MED]; download.blender.org bloqueado | **No**: por debajo de los **mínimos oficiales** de Blender (4 núcleos con SSE4.2 y 8 GB; blender.org/download/requirements) |
| **Ordenador del usuario "ordenadorcobra"** | **Windows x64** (`get_device_info`, 2026-10-27). **GPU desconocida**: la VM de Linux del puente no puede verla y no hay ninguna carpeta conectada | **Sí, si se confirma la GPU** (o con CPU si tiene ≥ 4 núcleos y ≥ 8 GB) |
| VM de Linux del puente | sin carpetas conectadas; GPU del anfitrión no accesible | No recomendada (solo CPU, recursos desconocidos) |

**Cómo comprobar la GPU sin instalar nada** (lo hace el usuario en Windows, PowerShell):
```powershell
Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion
nvidia-smi        # solo si es NVIDIA: modelo, driver y VRAM
```
O en el Administrador de tareas → Rendimiento → GPU. Después de instalar Blender, `listar_dispositivos.py` dice qué ve Cycles.

**Soporte de GPU en Blender (requisitos oficiales):**
- NVIDIA GeForce serie 900 o posterior (incluidas las RTX);
- AMD GCN de 4.ª generación o posterior;
- Intel Kaby Lake o posterior;
- 2 GB de VRAM como mínimo (recomendados 8 GB); OpenGL 4.3 / Vulkan 1.3.

Cycles admite CUDA, OptiX, HIP, oneAPI y Metal (código de v5.2.3). La página oficial no indica la capacidad de cómputo CUDA ni las versiones de driver: se comprueba con `listar_dispositivos.py`.

## 2. Blender 5.2.3 LTS frente al código de 5.4 alpha que se había leído
Fuentes de la etiqueta `v5.2.3` comparadas con la rama main (ba33d29) [CÓDIGO]:
- **Principled BSDF:** entradas idénticas, salvo que 5.4 añade `Transmission Dispersion Scale` y `Transmission Dispersion Abbe Number` (vidrio). **No afectan** al acero, la resina ni el latón.
- **Cycles:** sin cambios en `samples` (4096), `adaptive_threshold` (0,01), `time_limit` (0), `use_adaptive_sampling` (True), eliminador de ruido (OIDN), `seed` ni `use_animated_seed` (False). 5.4 añade `denoising_store_motion_passes` y `preview_denoising_upscale_quality` (no los usamos).
- `film_transparent`, `film_transparent_glass`, `holdout`/`indirect_only`, `is_shadow_catcher`, las opciones de la línea de comandos y la lista de dispositivos (CPU, CUDA, OptiX, HIP, Metal, oneAPI) **existen en 5.2.3**.
- Verificados también en 5.2.3: luces (`shape`, `size`, `size_y`, `use_temperature`, `temperature`), cámara (`dof.use_dof`, `focus_object`, `aperture_fstop`, `lens`), nodo Tangent (`UV_MAP`) y la vista **AgX** en `config.ocio`.

→ **No hay incompatibilidades** para el Hito A.

## 3. Modelado propio frente a adaptar un modelo existente
| | Modelado propio por script | Adaptar un modelo CC BY de Sketchfab |
|---|---|---|
| Recurso | `integration/blender/hitoA_navaja.py` (hoja vaciada paramétrica, espiga, cachas, pasadores y pivote) | "Straight razor Solingen" (78 188 caras, 4 materiales) u "OVROO" (90 256 caras, fotogrametría) |
| Descarga | ninguna | la hace el usuario (exige una cuenta, que no creamos) |
| Licencia | propia | CC BY: atribución obligatoria en la web; revisar que no haya marcas grabadas ("Solingen") |
| **Abrir la navaja** (estado abierto, B0/B1) | **sí** (pivote real: un parámetro) | dudoso: si es una sola malla hay que separarla y reconstruir el pivote |
| Materiales y luz | coherentes con nuestro esquema | la fotogrametría trae la luz **horneada** en las texturas → choca con nuestra iluminación |
| Detalle | geometría limpia; sin desgaste ni grabado | más detalle de superficie |
| Riesgo | que la forma parezca "de catálogo 3D", simple | calidad desconocida: **las miniaturas no se pudieron ver** (media.sketchfab.com bloqueado desde el contenedor) |

**Decisión:** empezar por el **modelo propio por script** (sin descargas, reproducible y que se abre). Si el render no supera C1 por geometría, plan B: el usuario descarga un modelo CC BY y se adapta. Para valorarlo antes, el usuario puede ver los modelos en https://sketchfab.com/3d-models/none-db51394b122b46dbaa7875eea1988245 y https://sketchfab.com/3d-models/none-6810084303194949baa67eddf4c82301.

## 4. Corrección del Hito B0
B0 (máscara o disolución entre la navaja cerrada y la abierta) necesita **dos estados**. El Hito A entrega por eso **dos renders finales** de la misma escena y la misma cámara: `--estado cerrada` (héroe) y `--estado abierta`. Si solo se aprueba el cerrado, B0 espera a tener el abierto. Los 36 fotogramas **no** se crean.

## 5. Preparado para ejecutar (nada ejecutado)
| Archivo | Qué hace |
|---|---|
| `integration/blender/listar_dispositivos.py` | versión de Blender y dispositivos de Cycles; **sin render** |
| `integration/blender/hitoA_navaja.py` | genera la escena completa: navaja (hoja vaciada con UV para la anisotropía), acero con microrrugosidad y `Anisotropic` 0,45, resina con `Coat`, latón; clave lateral alargada (5 200 K), contraluz (3 200 K), relleno, tarjeta negra, atrapasombras, cámara de 90 mm a 15° con el objeto al 55 % del ancho, DOF a f/8 en la punta, AgX, PNG RGBA de 16 bits con fondo transparente; elige la GPU si la hay; guarda el `.blend` y un JSON con el tiempo y el dispositivo. HDRI CC0 opcional (`--hdri`). **Solo se ha comprobado su sintaxis** (`py_compile`); no se ha ejecutado |
| `integration/blender/composicion_hitoA.html` | composición estática: palabra fantasma "FILO" y titular **detrás**, render **delante**; sin el render muestra "pendiente" (probada a 1 440 y 375 px: sin desbordamiento ni errores) |

Los valores de luz y material son **puntos de partida**. Se ajustan mirando la primera prueba.

## 6. Límites propuestos para R1b (a confirmar por el usuario)
| Paso | Límite |
|---|---|
| Instalación | Blender **5.2.3 LTS** para Windows en versión **portable (.zip, 387 MB; blender.org/download, 2026-10-27)**, sin instalador ni permisos de administrador en una carpeta propia; reversible borrando la carpeta |
| Detección | 1 ejecución de `listar_dispositivos.py` |
| Pruebas | **≤ 3** renders `--calidad prueba` (960 × 540, 128 muestras, `time_limit` 120 s) para ajustar la luz |
| Finales | **2** renders `--calidad final` (cerrada + abierta; 2 560 × 1 440, 1 024 muestras, `time_limit` 600 s con GPU / 1 200 s con CPU) |
| Tope total | ≈ 6 min de pruebas + ≤ 40 min de finales con CPU (≤ 20 min con GPU); **se detiene** si una prueba agota su límite con ruido visible |
| Disco | 387 MB de descarga + la carpeta extraída (a medir); salidas < 100 MB |
| Quién ejecuta | (a) **el usuario** en PowerShell con los comandos de la cabecera del script, o (b) Claude con control del escritorio si el usuario lo concede expresamente |

## 7. Aceptación del Hito A (solo tras inspeccionar el render real)
La aprueba **el usuario**, nunca el script ni Claude. Detalle en EVAL-001 (apéndice del lote 23).
- Metal creíble (franja de reflejo continua, sin aspecto plástico).
- Reflejos e iluminación profesionales.
- Geometría y proporciones correctas de una navaja de barbero.
- Composición editorial.
- Tipografía integrada.
- Alfa limpio al 400 %.
- Comparación lado a lado con referencias R1 de producto y con CASE-003.

## 8. Bloqueos
1. **R1** (instalar Blender 5.2.3 LTS en el ordenador del usuario) y **R1b** (límites del §6): sin autorizar.
2. **GPU del ordenador del usuario**: desconocida (el usuario debe indicarla).
3. Sin carpeta conectada en el ordenador del usuario: si se quiere que Claude deje ahí los scripts, hace falta conectar una.
4. HDRI de Poly Haven (CC0): opcional; su descarga también requiere autorización.
