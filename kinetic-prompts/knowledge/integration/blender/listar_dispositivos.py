"""Paso 1 del Hito A (sin render): qué dispositivos de Cycles ve Blender en ESTE equipo. PREPARADO, NO EJECUTADO.
Uso (tras la autorización R1):  blender -b --factory-startup --python listar_dispositivos.py
Imprime la versión de Blender y, por tipo (OPTIX, CUDA, HIP, ONEAPI, METAL), los dispositivos detectados.
Si no aparece ninguna GPU, Cycles renderizará con CPU (más lento): medirlo con la calidad "prueba".
"""
import bpy, json, os, multiprocessing
prefs = bpy.context.preferences.addons["cycles"].preferences
res = {"blender": bpy.app.version_string, "cpu_hilos": multiprocessing.cpu_count(), "tipos": {}}
for tipo in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
    try:
        prefs.compute_device_type = tipo
        res["tipos"][tipo] = [f"{d.type}: {d.name}" for d in prefs.get_devices_for_type(tipo)]
    except Exception as e:
        res["tipos"][tipo] = f"no disponible ({e.__class__.__name__})"
print(json.dumps(res, indent=1, ensure_ascii=False))
