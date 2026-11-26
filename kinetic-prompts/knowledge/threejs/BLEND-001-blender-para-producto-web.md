---
id: BLEND-001
titulo: Blender aplicado a una web de producto — escena de bodegón (navaja), materiales metálicos con Principled BSDF, iluminación lateral con HDRI de estudio CC0 y luces de área, render en Cycles con transparencia, capas delante y detrás con "Holdout", salida PNG/WebP y cómo medir el coste antes de producir una secuencia
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (código de Blender, rama main ba33d29 = 5.4 alpha: node_shader_bsdf_principled.cc, cycles/addon/properties.py, rna_scene.cc, rna_layer.cc, creator_args.cc) + DOCUMENTACION_OFICIAL_ANALIZADA (blender.org: licencia y descarga 5.2.3 LTS; API de Poly Haven: 89 HDRI de estudio; API de Sketchfab: modelos de navaja y sus licencias) — nada instalado ni renderizado
versiones: Blender 5.2.3 LTS (estable, 22-10-2026); los nombres de las entradas se han leído en el código de 5.4 alpha → comprobar en 5.2 antes de usarlos
perfil: cinematografico
ultima_revision: 2026-10-27
---

# BLEND-001 · Blender para una web de producto

1. **Finalidad.** Definir **exactamente** qué hace falta para obtener en Blender un fotograma de producto de nivel publicitario (Hito A) y, después, una secuencia corta (Hito B), **sin afirmar que el resultado será profesional hasta verlo** (EVAL-001).
2. **Fuentes.**
   - Código de Blender (rutas de la cabecera).
   - blender.org/about/license ("What you create with Blender is your sole property").
   - API de Poly Haven (`/assets?type=hdris&categories=studio`).
   - API de Sketchfab (búsqueda "straight razor").
   - Manual 5.2: **el cuerpo de la página no se pudo leer** (solo la cabecera); por eso se cita el código.
3. **Ubicación.** Entradas del nodo Principled; propiedades de muestreo y eliminación de ruido de Cycles; `film_transparent`; `holdout` / `indirect_only` de las colecciones; opciones de la línea de comandos.
4. **Resultado.** La receta de escena de §6–8, con los parámetros que hay que fijar y medir.
5. **Modelo de la navaja: opciones [DOC + criterio].**
   | Opción | Licencia | Ventaja | Inconveniente |
   |---|---|---|---|
   | **Modelado propio** (hoja, espiga, cachas, pasador) | propiedad del autor | **piezas separadas** con pivote real para abrirla (Hito B); topología limpia para los reflejos | requiere modelado cuidadoso (biselado del filo, *hollow grind*) |
   | Sketchfab "Vintage Straight Razor – Classic Barber's Tool" (OVROO, 90 256 caras, 4 texturas, etiqueta `realitycapture`) | **CC BY** ("Author must be credited. Commercial use is allowed.") | detalle fotogramétrico | probablemente una **sola malla** (no se abre) y con la iluminación horneada en las texturas [inferencia por la fotogrametría]; aspecto antiguo |
   | Sketchfab "Straight razor Solingen" (archyalexandr, 78 188 caras, 4 materiales) | **CC BY** | geometría detallada | "Solingen" es un nombre de origen asociado a fabricantes: revisar que no haya marcas grabadas |
   | Free3D "Vintage straight razor" (28 288 tris, PBR 2K) | licencia *royalty free* de TurboSquid: renders en "marketing collateral" permitidos; **prohibido redistribuir** el modelo | texturas PBR | condiciones más restrictivas; la web solo puede llevar renders, nunca el modelo |
   | Poly Haven | CC0 | — | **no tiene navajas** (sí un sillón de barbero `BarberShopChair_01`) |

   **Criterio:** modelado propio para el protagonista (control y apertura); los CC BY solo como referencia de proporciones o como plan B, con **atribución en la web**. Descargar de Sketchfab exige una cuenta: no la creamos; la descarga la haría el usuario.
6. **Materiales (Principled BSDF) [entradas leídas en el código].**
   - Entradas disponibles: `Base Color, Metallic, Roughness, IOR, Alpha, Normal, Diffuse Roughness, Subsurface…, Specular IOR Level, Specular Tint, Anisotropic, Anisotropic Rotation, Tangent, Transmission Weight, Coat Weight/Roughness/IOR/Tint/Normal, Sheen…, Emission…, Thin Film Thickness, Thin Film IOR`.
   - **Acero pulido de la hoja:**
     - `Metallic 1`; `Base Color` gris neutro claro;
     - `Roughness` 0,08–0,15 con una textura de ruido muy fina, para que el reflejo no sea un espejo perfecto;
     - `Anisotropic` 0,3–0,6 con `Tangent` a lo largo de la hoja (pulido longitudinal);
     - bisel del filo con `Roughness` más bajo;
     - valores = **[criterio propio, a calibrar en el render]**.
   - **Cachas** (asta, madera o resina negra): dieléctrico con `Coat Weight` 0,5–1 y `Coat Roughness` 0,05–0,1, para dar la "laca" de producto [criterio propio].
   - **Pasador de latón:** `Metallic 1` y `Base Color` dorado, en línea con la paleta latón (ART-001).
   - **Película fina** (`Thin Film`): solo si se quiere irisación de temple azul. Opcional; puede parecer artificial.
7. **Iluminación [DOC Poly Haven + criterio].**
   - **HDRI de estudio CC0** como relleno y fuente de reflejos. De la categoría "Softbox & Lamp Setups": p. ej. `studio_small_09`, `studio_kontrast_01…04`, `monochrome_studio_01…04`, `ferndale_studio_01` (hasta 20 480 × 10 240). Para el render basta con 4K. **Elegir viendo el reflejo en la hoja**, no por el nombre.
   - Esquema de producto [conocimiento general de fotografía de producto; verificar en el render]:
     - **luz clave lateral izquierda** (área grande, rectangular y alargada: dibuja una franja de reflejo a lo largo de la hoja);
     - **contraluz** cálido en el borde (silueta del filo);
     - **tarjeta negra** a la derecha (contraste en el metal);
     - el HDRI a baja intensidad.
   - **Sombra de contacto** sobre un plano "atrapasombras": como `film_transparent` deja el fondo transparente, la sombra se recoge con un plano marcado como `is_shadow_catcher` ("Shadow Catcher", propiedad del objeto leída en `rna_object.cc`) o con un pase aparte.
   - Gestión del color: vista **AgX** (la predeterminada en Blender desde 4.0 [conocimiento general; verificar]); exportar en sRGB.
8. **Render [código de Cycles].**
   - `samples` (predeterminado 4096); `use_adaptive_sampling` (True) con `adaptive_threshold` (0,01);
   - `use_denoising` con `denoiser` OpenImageDenoise (CPU);
   - `time_limit` (0 = sin límite): **útil para acotar el coste de una prueba**;
   - rebotes `glossy_bounces` / `transmission_bounces`; `caustics_reflective`; `blur_glossy`;
   - `seed` / `use_animated_seed`: en una secuencia, una semilla fija reduce el parpadeo del ruido entre fotogramas [conocimiento general; verificar con la secuencia].
   - Dispositivos de GPU que contempla Cycles: CUDA, OptiX, HIP, Metal y oneAPI. **El contenedor de la sesión no tiene GPU** → solo CPU.
   - **Transparencia:** `film_transparent` ("World background is transparent, for compositing the render over another background") + `film_transparent_glass` ("Render transmissive surfaces as transparent…").
   - **Delante y detrás del titular (DEPTH-001)** con dos *view layers*:
     - capa "trasera" con la colección de la punta en **`holdout`** ("Mask out objects in collection from view layer");
     - capa "delantera" con solo la punta, y el resto en `indirect_only` para conservar los reflejos;
     - en la web: canvas trasero → titular h1 → canvas delantero [adaptación propia; sin probar].
9. **Línea de comandos [código].**
   - Un fotograma: `blender -b razor.blend -o //out/hitoA_#### -F PNG -f 1 -t 0 -- --cycles-device CPU`
   - Secuencia: `-s 1 -e 36 -a`.
   - `--cycles-print-stats` para las estadísticas.
   - `#` = relleno de ceros del número de fotograma.
10. **Medir el coste ANTES de producir [procedimiento propio].**
    1. Un fotograma a **960 × 540** con `time_limit = 120` s → tiempo real con `/usr/bin/time` y ruido residual tras el eliminador de ruido.
    2. Si es aceptable, a 1 920 × 1 080 → extrapolar a N fotogramas (tiempo × N).
    3. **Detener** si la estimación de la secuencia supera el presupuesto autorizado (p. ej. 2 h).
    4. Registrar CPU, hilos, versión de Blender, muestras y tiempo por fotograma.
11. **Rendimiento web.** Ver SEQ-002 y el presupuesto de `integration/PLAN_LOTE22_HITOS_ABC.md` §6. Recortar el render al **rectángulo del objeto**, porque la memoria decodificada se calcula como ancho × alto × 4 bytes por fotograma.
12. **Compatibilidad.** Blender 5.2.3 LTS para Linux: `.tar.xz` de 367 MB, glibc ≥ 2.28. download.blender.org **no es accesible** desde el contenedor.
13. **Aplicaciones.** Héroe de producto, secuencias de transformación, fondos con profundidad de campo.
14. **Pruebas.**
    - Hito A: rúbrica C1/C3 sobre el fotograma (EVAL-001).
    - Bordes del alfa al 400 %.
    - Comparación con la referencia R1/R3 en el mismo encuadre.
    - Tiempo por fotograma medido.
15. **Estado.** Parámetros leídos en el código; nada instalado ni renderizado; **la calidad alcanzable NO está comprobada**.

## Lote 23 · Versión, requisitos y decisión del modelo
- **5.2.3 LTS frente a 5.4 alpha** (código de la etiqueta `v5.2.3` frente a main): Principled idéntico salvo `Transmission Dispersion Scale/Abbe Number` (solo en 5.4); los ajustes de Cycles que usamos son idénticos; `film_transparent(_glass)`, `holdout`, `indirect_only` e `is_shadow_catcher` existen en 5.2.3. **Sin incompatibilidades** para el Hito A.
- **Requisitos oficiales:** CPU de 4 núcleos con SSE4.2 y 8 GB como mínimo (recomendados 8 núcleos y 32 GB); GPU NVIDIA serie 900 o posterior, AMD GCN de 4.ª generación o posterior, Intel Kaby Lake o posterior, con ≥ 2 GB de VRAM. **El contenedor de la sesión no cumple los mínimos** → se renderiza en el ordenador del usuario (Windows x64; GPU por confirmar).
- **Paquetes de Windows de 5.2.3:** .msi de 349 MB, **.zip portable de 387 MB**, Microsoft Store y versiones ARM64.
- **Modelo:** se decide el **modelado propio por script** (BLEND-002): sin descarga, abre y cierra con un pivote y no trae luz horneada. Los modelos CC BY de Sketchfab quedan como plan B (requieren atribución y que el usuario los descargue).
- Informe: `integration/INFORME_VIABILIDAD_HITO_A.md`.
