"""Hito A — escena de producto "navaja de barbero" generada por script (Blender 5.2.3 LTS, Cycles).

ESTADO: PREPARADO, **NO EJECUTADO** (lote 23). Los nombres de la API se verificaron en el código de v5.2.3
(BLEND-001, BLEND-002). Ejecutar solo con la autorización R1 + R1b:

  blender -b --factory-startup --python hitoA_navaja.py -- --estado cerrada --calidad prueba --salida out
  blender -b --factory-startup --python hitoA_navaja.py -- --estado abierta --calidad final  --salida out [--hdri estudio.exr]

Calidades:
  prueba = 960x540, 128 muestras, time_limit 120 s   (máx. 3 renders de prueba, R1b)
  final  = 2560x1440, 1024 muestras, time_limit 600 s con GPU / 1200 s con CPU
Salida: PNG RGBA con fondo transparente (film_transparent) + registro JSON (tiempo, dispositivo, versión).
Sin HDRI: luces de área + mundo oscuro (la HDRI CC0 de Poly Haven requiere autorización de descarga).
"""
import bpy, bmesh, math, sys, json, time, os, argparse
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument("--estado", choices=["cerrada", "abierta"], default="cerrada")
ap.add_argument("--calidad", choices=["prueba", "final"], default="prueba")
ap.add_argument("--salida", default="out", help="carpeta de salida (relativa a la carpeta desde la que se ejecuta)")
ap.add_argument("--hdri", default="")
ap.add_argument("--solo-escena", action="store_true", help="guarda el .blend sin renderizar")
A = ap.parse_args(argv)

MM = 0.001  # 1 mm en metros (escala real: Cycles y la profundidad de campo dependen de ella)

# ---------------------------------------------------------------- limpieza
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def coleccion(nombre):
    c = bpy.data.collections.new(nombre); sc.collection.children.link(c); return c
C_OBJ, C_SET = coleccion("Navaja"), coleccion("Plato")

def enlazar(ob, col):
    for c in ob.users_collection: c.objects.unlink(ob)
    col.objects.link(ob)

# ---------------------------------------------------------------- materiales
def principled(nombre, **v):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    for k, val in v.items(): b.inputs[k].default_value = val
    return m, b

def acero():
    m, b = principled("Acero pulido", **{"Base Color": (0.80, 0.80, 0.82, 1), "Metallic": 1.0, "Roughness": 0.11,
                                          "Anisotropic": 0.45})
    nt = m.node_tree; n = nt.nodes
    # microvariación de rugosidad (evita el espejo perfecto)
    tex = n.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 900.0; tex.inputs["Detail"].default_value = 4.0
    mr = n.new("ShaderNodeMapRange"); mr.inputs["To Min"].default_value = 0.08; mr.inputs["To Max"].default_value = 0.15
    nt.links.new(tex.outputs["Fac"], mr.inputs["Value"]); nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])
    # pulido longitudinal: tangente desde el mapa UV (u a lo largo de la hoja)
    tg = n.new("ShaderNodeTangent"); tg.direction_type = "UV_MAP"; tg.uv_map = "UVMap"
    nt.links.new(tg.outputs["Tangent"], b.inputs["Tangent"])
    return m

M_ACERO = acero()
M_CACHA, _ = principled("Resina negra lacada", **{"Base Color": (0.012, 0.011, 0.010, 1), "Roughness": 0.35,
                                                   "Coat Weight": 0.8, "Coat Roughness": 0.07})
M_LATON, _ = principled("Latón", **{"Base Color": (0.91, 0.70, 0.38, 1), "Metallic": 1.0, "Roughness": 0.22})
M_NEGRO, _ = principled("Tarjeta negra", **{"Base Color": (0.003, 0.003, 0.003, 1), "Roughness": 0.9})

# ---------------------------------------------------------------- hoja (hollow grind por geometría)
def hoja(L=78 * MM, W=16 * MM, t_lomo=3.0 * MM, t_filo=0.12 * MM, nu=96, nv=28):
    """Superficies superior e inferior paramétricas: u = longitud (0 talón -> 1 punta), v = 0 filo -> 1 lomo.
    Grosor cóncavo (vaciado) t(v) = t_filo + (t_lomo - t_filo) * v**2.6; punta redondeada en el último 9 %."""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new("UVMap")
    def ancho(u):
        return W if u < 0.91 else W * math.sqrt(max(0.0, 1 - ((u - 0.91) / 0.09) ** 2)) * 0.98 + W * 0.02
    def grosor(v):
        return t_filo + (t_lomo - t_filo) * v ** 2.6
    caras = {}
    for lado in (1, -1):
        g = [[None] * (nv + 1) for _ in range(nu + 1)]
        for i in range(nu + 1):
            u = i / nu; w = ancho(u)
            for j in range(nv + 1):
                v = j / nv
                x, y = u * L, (v - 1) * w + W  # el lomo queda recto (y = W); el filo baja con el ancho
                g[i][j] = bm.verts.new((x, y, lado * grosor(v) / 2))
        caras[lado] = g
        for i in range(nu):
            for j in range(nv):
                q = [g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]]
                f = bm.faces.new(q if lado == 1 else q[::-1])
                for lp, (a, b) in zip(f.loops, ([(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)] if lado == 1 else [(i, j + 1), (i + 1, j + 1), (i + 1, j), (i, j)])):
                    lp[uv].uv = (a / nu, b / nv)
    top, bot = caras[1], caras[-1]
    # cerrar perímetro: filo (j=0), lomo (j=nv), talón (i=0) y punta (i=nu)
    for i in range(nu):
        for j in (0, nv):
            q = [top[i][j], bot[i][j], bot[i + 1][j], top[i + 1][j]]
            bm.faces.new(q if j == 0 else q[::-1])
    for j in range(nv):
        for i in (0, nu):
            q = [top[i][j], top[i][j + 1], bot[i][j + 1], bot[i][j]]
            bm.faces.new(q if i == 0 else q[::-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("Hoja"); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = True
    ob = bpy.data.objects.new("Hoja", me); me.materials.append(M_ACERO); return ob

def caja(nombre, dims, pos, mat, bisel=0.6 * MM, subdiv=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos); ob = bpy.context.active_object; ob.name = nombre
    ob.scale = dims; bpy.ops.object.transform_apply(scale=True)
    m = ob.modifiers.new("Bisel", "BEVEL"); m.width = bisel; m.segments = 4; m.limit_method = "ANGLE"
    if subdiv: s = ob.modifiers.new("Subdiv", "SUBSURF"); s.levels = s.render_levels = subdiv
    ob.data.materials.append(mat); bpy.ops.object.shade_smooth(); return ob

# ---------------------------------------------------------------- ensamblaje
pivote = bpy.data.objects.new("Pivote", None); sc.collection.objects.link(pivote); enlazar(pivote, C_OBJ)
pivote.location = (0, 0, 0)
H = hoja(); sc.collection.objects.link(H); enlazar(H, C_OBJ)
H.location = (6 * MM, -8 * MM, 0); H.parent = pivote
espiga = caja("Espiga", (34 * MM, 9 * MM, 3.2 * MM), (-14 * MM, -4 * MM, 0), M_ACERO); enlazar(espiga, C_OBJ); espiga.parent = pivote
L_CACHA, SEP = 150 * MM, 4.2 * MM
for k, z in (("Cacha A", SEP / 2 + 1.3 * MM), ("Cacha B", -SEP / 2 - 1.3 * MM)):
    ob = caja(k, (L_CACHA, 19 * MM, 2.6 * MM), (L_CACHA / 2 - 8 * MM, -3 * MM, z), M_CACHA, bisel=1.2 * MM, subdiv=2); enlazar(ob, C_OBJ)
bpy.ops.mesh.primitive_cylinder_add(radius=2.3 * MM, depth=SEP + 7 * MM, location=(0, 0, 0)); pin = bpy.context.active_object
pin.name = "Pasador"; pin.data.materials.append(M_LATON); bpy.ops.object.shade_smooth(); enlazar(pin, C_OBJ)
bpy.ops.mesh.primitive_cylinder_add(radius=2.0 * MM, depth=SEP + 7 * MM, location=(L_CACHA - 14 * MM, -3 * MM, 0)); pin2 = bpy.context.active_object
pin2.name = "Pasador cola"; pin2.data.materials.append(M_LATON); bpy.ops.object.shade_smooth(); enlazar(pin2, C_OBJ)
# estado: abierta = hoja alineada hacia -X (fuera de las cachas); cerrada = hoja plegada entre las cachas
pivote.rotation_euler[2] = math.radians(180 if A.estado == "abierta" else 0)
# presentación: de pie sobre el canto (cara de la hoja hacia la cámara) y en diagonal ascendente ~20° en el encuadre
raiz = bpy.data.objects.new("Presentacion", None); sc.collection.objects.link(raiz); enlazar(raiz, C_OBJ)
for ob in list(C_OBJ.objects):
    if ob is not raiz and ob.parent is None: ob.parent = raiz
raiz.rotation_euler = (math.radians(90), math.radians(-20), 0)

def caja_mundo(objs):
    bpy.context.view_layer.update()
    pts = [ob.matrix_world @ Vector(c) for ob in objs if ob.type == "MESH" for c in ob.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi
MALLAS = [o for o in C_OBJ.objects if o.type == "MESH"]
lo, hi = caja_mundo(MALLAS); raiz.location.z -= lo.z - 0.5 * MM   # el punto más bajo a 0,5 mm del suelo (sombra de contacto)
lo, hi = caja_mundo(MALLAS); centro = (lo + hi) / 2; largo = max(hi.x - lo.x, hi.z - lo.z)

# ---------------------------------------------------------------- plato, luces y cámara (relativas al objeto)
bpy.ops.mesh.primitive_plane_add(size=3.0, location=(centro.x, centro.y, 0)); suelo = bpy.context.active_object; suelo.name = "Atrapasombras"
suelo.is_shadow_catcher = True; enlazar(suelo, C_SET)

def luz_area(nombre, desp, w, h, energia, temp_k):
    l = bpy.data.lights.new(nombre, "AREA"); l.shape = "RECTANGLE"; l.size, l.size_y = w, h; l.energy = energia
    l.use_temperature = True; l.temperature = temp_k
    ob = bpy.data.objects.new(nombre, l); C_SET.objects.link(ob); ob.location = centro + Vector(desp)
    ob.rotation_euler = (centro - ob.location).to_track_quat("-Z", "Y").to_euler(); return ob

# valores de partida [criterio propio]: ajustar mirando la franja de reflejo de la hoja en la prueba
luz_area("Clave lateral (izq.)", (-0.55, -0.35, 0.25), 0.70, 0.08, 160, 5200)   # caja de luz alargada -> franja en la hoja
luz_area("Contraluz cálido", (0.30, 0.55, 0.30), 0.35, 0.35, 80, 3200)
luz_area("Relleno cenital suave", (0.0, -0.15, 0.80), 0.9, 0.9, 15, 4500)
bpy.ops.mesh.primitive_plane_add(size=0.6, location=centro + Vector((0.50, -0.10, 0.05))); card = bpy.context.active_object
card.name = "Tarjeta negra"; card.rotation_euler = (math.radians(90), 0, math.radians(100)); card.data.materials.append(M_NEGRO)
enlazar(card, C_SET); card.visible_camera = False

w = bpy.data.worlds.new("Mundo"); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes["Background"]
if A.hdri and os.path.exists(os.path.abspath(A.hdri)):
    env = w.node_tree.nodes.new("ShaderNodeTexEnvironment"); env.image = bpy.data.images.load(os.path.abspath(A.hdri))
    w.node_tree.links.new(env.outputs["Color"], bg.inputs["Color"]); bg.inputs["Strength"].default_value = 0.35
else:
    bg.inputs["Color"].default_value = (0.020, 0.016, 0.013, 1); bg.inputs["Strength"].default_value = 0.6

# cámara de 90 mm, elevación 15°, objeto al ~55 % del ancho y desplazado a la derecha (shift_x)
cam_d = bpy.data.cameras.new("Cam 90mm"); cam_d.lens = 90; cam_d.sensor_width = 36
ancho_visible = 2 * math.tan(math.atan(cam_d.sensor_width / 2 / cam_d.lens))   # ancho visible por metro de distancia
dist = largo / (0.55 * ancho_visible)
elev = math.radians(15)
cam = bpy.data.objects.new("Camara", cam_d); C_SET.objects.link(cam); sc.camera = cam
cam.location = centro + Vector((0, -math.cos(elev), math.sin(elev))) * dist
cam.rotation_euler = (centro - cam.location).to_track_quat("-Z", "Y").to_euler()
cam_d.shift_x = -0.12
foco = bpy.data.objects.new("Foco (punta)", None); C_SET.objects.link(foco)
bpy.context.view_layer.update(); foco.location = H.matrix_world @ Vector((70 * MM, 8 * MM, 0))
cam_d.dof.use_dof = True; cam_d.dof.focus_object = foco; cam_d.dof.aperture_fstop = 8.0

# ---------------------------------------------------------------- render
CAL = {"prueba": dict(res=(960, 540), samples=128, limit=120), "final": dict(res=(2560, 1440), samples=1024, limit=None)}[A.calidad]
sc.render.engine = "CYCLES"
dispositivo = "CPU"
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for tipo in ("OPTIX", "CUDA", "HIP", "ONEAPI", "METAL"):
        try:
            prefs.compute_device_type = tipo
        except TypeError:
            continue
        gpus = [d for d in prefs.get_devices_for_type(tipo) if d.type != "CPU"]
        if gpus:
            for d in prefs.devices: d.use = (d.type != "CPU")
            sc.cycles.device = "GPU"; dispositivo = f"{tipo}: " + ", ".join(d.name for d in gpus); break
except Exception as e:  # sin GPU utilizable -> CPU
    dispositivo = f"CPU (detección GPU: {e})"
sc.cycles.samples = CAL["samples"]; sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.01
sc.cycles.use_denoising = True; sc.cycles.denoiser = "OPENIMAGEDENOISE"
sc.cycles.time_limit = CAL["limit"] or (600 if sc.cycles.device == "GPU" else 1200)
sc.cycles.glossy_bounces = 6; sc.cycles.max_bounces = 10
sc.render.film_transparent = True
sc.render.resolution_x, sc.render.resolution_y = CAL["res"]; sc.render.resolution_percentage = 100
sc.view_settings.view_transform = "AgX"; sc.view_settings.look = "None"
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"; sc.render.image_settings.color_depth = "16"

base = os.path.abspath(A.salida); os.makedirs(base, exist_ok=True)  # sin .blend abierto, "//" no tiene base: usar rutas normales
nombre = f"hitoA_{A.estado}_{A.calidad}"
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(base, nombre + ".blend"))
if not A.solo_escena:
    sc.render.filepath = os.path.join(base, nombre + ".png")
    t0 = time.time(); bpy.ops.render.render(write_still=True); dt = time.time() - t0
    json.dump({"archivo": nombre + ".png", "blender": bpy.app.version_string, "dispositivo": dispositivo,
               "muestras": CAL["samples"], "limite_s": sc.cycles.time_limit, "resolucion": CAL["res"],
               "segundos": round(dt, 1), "hdri": A.hdri or None, "estado": A.estado},
              open(os.path.join(base, nombre + ".json"), "w"), indent=1)
    print("RENDER", nombre, round(dt, 1), "s", dispositivo)
