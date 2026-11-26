---
id: BLEND-002
titulo: Escena de producto reproducible generada por script de Python en Blender (bpy) — patrón para que Claude Code prepare renders verificables sin tocar la interfaz: geometría paramétrica, materiales, luz relativa al objeto, cámara por encuadre, límites de coste, registro JSON y verificación de la API contra la versión exacta
categoria: threejs
estado: PROPUESTO
evidencia: CODIGO_INSPECCIONADO (API verificada en el código de la etiqueta v5.2.3 de Blender: nodo Principled, cycles/addon/properties.py, rna_scene, rna_layer, rna_object, rna_light, rna_camera, rna_nodetree, config.ocio) + script propio integration/blender/hitoA_navaja.py — sintaxis comprobada con py_compile; NO EJECUTADO
versiones: Blender 5.2.3 LTS
perfil: cinematografico
ultima_revision: 2026-10-27
---

# BLEND-002 · Escena de producto por script

1. **Finalidad.** Que una escena de producto sea **reproducible, revisable y acotada en coste**: Claude Code no puede manejar la interfaz de Blender, pero sí escribir un script `bpy` que construya la escena entera y renderice en modo sin interfaz. Cualquier ajuste queda en el control de versiones.
2. **Fuentes.**
   - Código de Blender en la etiqueta `v5.2.3` (`git show v5.2.3:<ruta>` sobre el espejo de GitHub).
   - Requisitos de blender.org.
   - Script de referencia: `integration/blender/hitoA_navaja.py` (navaja) y `listar_dispositivos.py`.
3. **Ubicación.** Ver las rutas de la cabecera.
4. **Resultado.** Un único comando genera el `.blend`, el PNG RGBA y un JSON (versión, dispositivo, muestras, límite y segundos).
5. **Patrón [adaptación propia].**
   1. **Empezar vacío:** `bpy.ops.wm.read_factory_settings(use_empty=True)` + `--factory-startup` (sin complementos ni preferencias del usuario).
   2. **Escala real** (1 unidad = 1 m; navaja de ~15 cm): la profundidad de campo y el tamaño de las luces dependen de ella.
   3. **Geometría paramétrica con `bmesh`:** hoja como dos superficies (u = longitud, v = filo → lomo) con grosor `t(v)` cóncavo (vaciado) y UV propias (u a lo largo de la hoja), que alimentan la tangente de la anisotropía. Piezas separadas y jerarquía con un **vacío como pivote** (el estado abierto o cerrado es una rotación).
   4. **Materiales** con Principled (nombres de entrada exactos) + nodos de ruido y Map Range para la microrrugosidad.
   5. **Colocación calculada:** caja envolvente en coordenadas de mundo → apoyar el objeto a 0,5 mm del suelo (sombra de contacto con `is_shadow_catcher`).
   6. **Luces relativas al centro del objeto** (`to_track_quat("-Z","Y")` para orientar).
   7. **Cámara por encuadre:** distancia = largo / (fracción del ancho × 2·tan(FOV/2)); `shift_x` para descentrar.
   8. **Render acotado:** `cycles.time_limit`, muestreo adaptativo, OIDN, `film_transparent`, AgX, PNG RGBA de 16 bits.
   9. **GPU si existe:** recorrer `OPTIX, CUDA, HIP, ONEAPI, METAL` con `prefs.get_devices_for_type()`; si no hay, CPU. Registrar el dispositivo en el JSON.
   10. **Registro:** JSON junto a cada PNG (tiempo, dispositivo, versión, parámetros).
6. **Verificación de la API (obligatoria).** Comparar los nombres con el código de la **versión exacta** que se va a usar:
   - De 5.2.3 a 5.4 alpha solo cambian las entradas de dispersión de la transmisión y dos propiedades de eliminación de ruido.
   - Nombres verificados en 5.2.3: luces `shape/size/size_y/use_temperature/temperature`; cámara `dof.use_dof/focus_object/aperture_fstop/lens`; Tangent `UV_MAP`; vista `AgX`.
7. **Procedimiento de ejecución.**
   1. Primero `listar_dispositivos.py`, sin render.
   2. Después `--calidad prueba` (960 × 540, 128 muestras, 120 s).
   3. Revisión visual.
   4. Ajuste de la luz.
   5. Por último `--calidad final`.

   Cada paso necesita la autorización correspondiente (R1/R1b).
8. **Parámetros.** Estado (cerrada/abierta), calidad, HDRI opcional, salida; dentro del script: dimensiones, rugosidades, anisotropía, potencia y temperatura de las luces, focal, elevación y f/.
9. **Código.** `integration/blender/hitoA_navaja.py` (≈ 220 líneas). **No ejecutado:** los errores de tiempo de ejecución (p. ej. un enum no disponible o el contexto de los operadores) solo se verán al ejecutarlo.
10. **Problemas previsibles.**
    - Rutas `//` sin un `.blend` abierto (se usan rutas normales).
    - Operadores (`primitive_*_add`, `shade_smooth`) que dependen de la selección activa.
    - Parámetros de luz "a ojo" que exigen iterar.
    - Geometría de aspecto "de catálogo" si faltan detalles (desgaste, grabado, chaflanes).
    - El primer render puede no ser bueno: **el script es la base para iterar, no garantiza calidad**.
11. **Rendimiento.** Ver los límites de R1b en `integration/INFORME_VIABILIDAD_HITO_A.md` §6.
12. **Compatibilidad.**
    - Windows/Linux/macOS (Blender 5.2.3 LTS). Mínimos: 4 núcleos con SSE4.2 y 8 GB (requisitos oficiales) → **el contenedor de la sesión no los cumple** (2 núcleos y 7 GB).
    - GPU: NVIDIA serie 900 o posterior, AMD GCN de 4.ª generación o posterior, Intel Kaby Lake o posterior, con ≥ 2 GB de VRAM.
13. **Aplicaciones.** Cualquier héroe de producto (navaja, frasco, reloj) y secuencias cortas con el mismo script y otro estado.
14. **Pruebas.**
    - Ejecución limpia.
    - JSON coherente.
    - Alfa al 400 %.
    - Revisión C1/C3 del usuario (EVAL-001, apéndice del lote 23).
15. **Estado.** **PROPUESTO**: preparado y con la sintaxis comprobada; sin ejecutar.
