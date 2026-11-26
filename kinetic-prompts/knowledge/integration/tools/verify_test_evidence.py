#!/usr/bin/env python3
"""Verifica las evidencias de las pruebas de integración (integration/MINIMAL_INTEGRATION_TEST.md).

Uso:
    python verify_test_evidence.py <ruta_biblioteca> <evidencia.jsonl> [--prompt <prompt.txt>] [--modo manual|automatico]
                                    [--areas comercial,seo,accesibilidad,animacion,scroll,gsap,3d?]
                                    [--remap <raíz_original>=<raíz_nueva>]

<evidencia.jsonl> es la salida de:  claude -p ... --output-format stream-json --verbose > evidencia.jsonl
Solo lee archivos (biblioteca estándar de Python). No ejecuta nada ni modifica la biblioteca.

Comprueba:
  1. Que la Skill web-library-router figura en el evento init y que su invocación (herramienta "Skill") no devolvió error.
  2. Que hubo lecturas reales (herramienta "Read") de KNOWLEDGE_INDEX.md, del manifiesto y de >= 5 fichas.
  3. Que cada ruta leída existe y está DENTRO de la biblioteca (contención real con os.path.commonpath;
     una ruta que solo comparte el prefijo de texto, p. ej. ".../LIBRARY_copia/x", no cuenta — corrección del lote 15).
  4. Que la respuesta final cita la versión real de KNOWLEDGE_INDEX.md, la ruta absoluta de la biblioteca y los IDs leídos.
  5. Que no se usaron herramientas de escritura o ejecución.
  6. (lote 15) Con --prompt: clasifica la invocación como MANUAL (el encargo menciona la Skill, las Skills o la biblioteca)
     o AUTOMÁTICA (encargo "limpio" y Claude Code invocó la Skill por iniciativa propia). Con --modo automatico,
     el veredicto exige encargo limpio + invocación correcta + que la Skill se invoque antes de la primera lectura de la biblioteca.
  7. (lote 16) Lecturas COMPLETAS y sin error: una lectura con error o con `limit`/`offset` que no cubre el archivo no cuenta.
  8. (lote 16) Atribución: todo ID de ficha que aparezca en la respuesta y NO se haya leído debe ir marcado "(no leída)"
     en la misma línea; si no, FALLA (información atribuida a una ficha no consultada).
  9. (lote 16) Registro CONSULTA (secciones 1–4) en la respuesta y ruta ABSOLUTA de cada ficha leída.
 11. (lote 17) --remap: re-verificar evidencias cuya carpeta temporal ya no existe. Se sustituye la raíz original de la
     biblioteca (la de la prueba) por otra copia descomprimida del MISMO ZIP en las rutas de las herramientas y en el texto.
     Compruebe antes con make_trace.py / traza.json que los hashes de los archivos leídos coinciden.
 10. (lote 16) Con --areas: al menos una ficha leída por área (por carpeta de la ficha). "3d?" solo se exige si la
     respuesta trata 3D/Three.js/WebGL/WebGPU (para usarlo o descartarlo).
El veredicto es orientativo: la revisión humana de la respuesta sigue siendo necesaria.
"""
import json, os, re, sys

AREAS = {  # área → prefijos de ruta (relativos a LIB) que cuentan como ficha específica de esa área
    "comercial": ("ux/",),
    "seo": ("seo/",),
    "accesibilidad": ("accessibility/",),
    "animacion": ("gsap/", "animations/", "transitions/", "scrolltrigger/", "interactions/"),
    "scroll": ("scrolltrigger/", "lenis/"),
    "gsap": ("gsap/", "scrolltrigger/"),
    "3d": ("threejs/",),
}
RE_3D = re.compile(r"three\.?js|webgl|webgpu|\b3d\b|escena 3d", re.I)

ESCRITURA = {"Edit", "Write", "NotebookEdit", "Bash", "MultiEdit", "PowerShell"}
SKILL = "web-library-router"
# Términos que convierten el encargo en una invocación "manual" (directiva del lote 15).
TERMINOS_PROMPT = [SKILL, "skill", "biblioteca", "library", "web_engineering", "knowledge_index", "manifest"]


def recorrer(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from recorrer(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from recorrer(v)


def canon(p):
    return os.path.normcase(os.path.realpath(os.path.normpath(p.replace("\\", "/"))))


def dentro(p, raiz):
    try:
        return os.path.commonpath([canon(p), raiz]) == raiz
    except ValueError:  # unidades distintas en Windows
        return False


def args():
    a = sys.argv[1:]
    opts = {"--prompt": None, "--modo": None, "--areas": None, "--remap": None}
    pos = []
    i = 0
    while i < len(a):
        if a[i] in opts and i + 1 < len(a):
            opts[a[i]] = a[i + 1]; i += 2
        else:
            pos.append(a[i]); i += 1
    return pos, opts


def main():
    pos, opts = args()
    if len(pos) != 2 or opts["--modo"] not in (None, "manual", "automatico"):
        print(__doc__); return 2
    lib, evid = canon(os.path.abspath(pos[0])), pos[1]
    manifest = json.load(open(os.path.join(lib, "integration", "LIBRARY_MANIFEST.json"), encoding="utf-8"))
    if "columnas" in manifest:  # formato compacto (v0.14.0+)
        ci, cr = manifest["columnas"].index("id"), manifest["columnas"].index("ruta")
        pares = [(f[ci], f[cr]) for f in manifest["fichas"]]
    else:  # formato con objetos (hasta v0.13.0)
        pares = [(f["id"], f["ruta"]) for f in manifest["fichas"]]
    rutas_fichas = {canon(os.path.join(lib, r)): i for i, r in pares}
    indice = open(os.path.join(lib, "KNOWLEDGE_INDEX.md"), encoding="utf-8").read()
    m = re.search(r"Versión (\d+\.\d+\.\d+)", indice)
    version = m.group(1) if m else None

    remap = None
    if opts["--remap"]:
        if "=" not in opts["--remap"]: print("--remap necesita <raíz_original>=<raíz_nueva>"); return 2
        o_, n_ = opts["--remap"].split("=", 1); remap = (o_.rstrip("/\\"), n_.rstrip("/\\"))
    eventos = []
    for linea in open(evid, encoding="utf-8", errors="replace"):
        linea = linea.strip()
        if remap: linea = linea.replace(remap[0], remap[1])
        if not linea: continue
        try: eventos.append(json.loads(linea))
        except json.JSONDecodeError: continue

    # Secuencia ordenada de llamadas: (orden, nombre, entrada, id)
    llamadas, errores_ids, texto_final, skill_en_init = [], set(), "", None
    for ev in eventos:
        if ev.get("type") == "system" and ev.get("subtype") == "init":
            skill_en_init = SKILL in (ev.get("skills") or [])
        if ev.get("type") == "stream_event":
            continue  # fragmentos parciales; los mensajes completos llegan como assistant/user
        for d in recorrer(ev):
            if d.get("type") == "tool_use" and "name" in d:
                llamadas.append((len(llamadas), d.get("name"), d.get("input") or {}, d.get("id")))
            if d.get("type") == "tool_result" and d.get("is_error"):
                errores_ids.add(d.get("tool_use_id"))
        if ev.get("type") == "result" and isinstance(ev.get("result"), str):
            texto_final = ev["result"]

    skill_calls = [c for c in llamadas if c[1] == "Skill" and SKILL in json.dumps(c[2])]
    skill_ok = [c for c in skill_calls if c[3] not in errores_ids]
    if skill_ok: skill_invocada = True
    elif skill_calls: skill_invocada = "error"
    elif SKILL in texto_final: skill_invocada = None
    else: skill_invocada = False

    def completa(c):
        """Lectura sin error que cubre todo el archivo (lote 16)."""
        if c[3] in errores_ids: return False
        ruta = c[2]["file_path"]
        if not os.path.exists(ruta): return False
        n = sum(1 for _ in open(ruta, encoding="utf-8", errors="replace"))
        off = int(c[2].get("offset") or 0); lim = c[2].get("limit")
        if off > 1: return False
        return lim is None or int(lim) >= n
    lecturas_todas = [c for c in llamadas if c[1] == "Read" and isinstance(c[2], dict) and c[2].get("file_path")]
    incompletas = [c[2]["file_path"] for c in lecturas_todas if dentro(c[2]["file_path"], lib) and not completa(c)]
    lecturas = [(c[0], c[2]["file_path"]) for c in lecturas_todas if completa(c) or not dentro(c[2]["file_path"], lib)]
    leidas_lib = [(o, p) for o, p in lecturas if dentro(p, lib)]
    fuera = [p for o, p in lecturas if not dentro(p, lib)]
    prefijo_falso = [p for p in fuera if canon(p).startswith(lib)]
    inexistentes = [p for o, p in leidas_lib if not os.path.exists(p)]
    ids_leidos = sorted({rutas_fichas[canon(p)] for o, p in leidas_lib if canon(p) in rutas_fichas})
    indice_leido = any(canon(p) == canon(os.path.join(lib, "KNOWLEDGE_INDEX.md")) for o, p in leidas_lib)
    manifiesto_leido = any(canon(p) == canon(os.path.join(lib, "integration", "LIBRARY_MANIFEST.json")) for o, p in leidas_lib)
    escritura = sorted({c[1] for c in llamadas if c[1] in ESCRITURA})
    cita_raiz = lib.replace("\\", "/").rstrip("/").lower() in texto_final.replace("\\", "/").lower()
    citados = [i for i in ids_leidos if i in texto_final]

    # Lote 16: atribuciones, registro, rutas absolutas y áreas
    todos_ids = {i for i, r in pares}
    ruta_de = {i: canon(os.path.join(lib, r)) for i, r in pares}
    leidos_set = set(ids_leidos)
    sin_marcar, marcadas = [], []
    for linea in texto_final.splitlines():
        ids_l = set(re.findall(r"\b([A-Z0-9]{2,6}-\d{3})\b", linea))
        for pre, a1, a2 in re.findall(r"\b([A-Z0-9]{2,6})-(\d{3})/(\d{3})\b", linea):
            ids_l |= {f"{pre}-{a1}", f"{pre}-{a2}"}
        for i in (ids_l & todos_ids) - leidos_set:
            (marcadas if re.search(r"no le[ií]da|sin leer", linea, re.I) else sin_marcar).append(i)  # "sin leer": aceptado desde el lote 16 (declarado antes de la prueba n.º 5)
    sin_marcar = sorted(set(sin_marcar)); marcadas = sorted(set(marcadas) - set(sin_marcar))
    t_low = texto_final.lower()
    secciones = {"1. Encargo": "1. encargo", "2. Necesidades": "2. necesidades", "3. Aplicación": "3. aplicaci", "4. Fichas consultadas": "4. fichas consultadas"}
    faltan_sec = [k for k, v in secciones.items() if v not in t_low]
    txt_norm = texto_final.replace("\\", "/")
    sin_ruta_abs = [i for i in ids_leidos if ruta_de[i].replace("\\", "/") not in txt_norm]
    areas = [a.strip() for a in (opts["--areas"] or "").split(",") if a.strip()]
    rutas_leidas_rel = [os.path.relpath(canon(p), lib).replace(os.sep, "/") for o, p in leidas_lib if canon(p) in rutas_fichas]
    trata_3d = bool(RE_3D.search(texto_final))
    area_checks = []
    for a in areas:
        cond = a.endswith("?"); nombre = a.rstrip("?")
        if nombre not in AREAS: area_checks.append((f"Área desconocida: {nombre}", False, "")); continue
        hits = sorted({rutas_fichas[canon(os.path.join(lib, r))] for r in rutas_leidas_rel if r.startswith(AREAS[nombre])})
        if cond and not trata_3d:
            area_checks.append((f"Área {nombre} (condicional): la respuesta no trata 3D → no exigida", True, "")); continue
        area_checks.append((f"Área {nombre}: al menos una ficha específica leída" + (" (exigida porque la respuesta trata 3D)" if cond else ""), bool(hits), ", ".join(hits)))

    # Clasificación de la invocación
    prompt_txt = open(opts["--prompt"], encoding="utf-8").read() if opts["--prompt"] else None
    terminos = [t for t in TERMINOS_PROMPT if prompt_txt and t in prompt_txt.lower()]
    primera_lectura_lib = min((o for o, p in leidas_lib), default=None)
    primera_skill_ok = min((c[0] for c in skill_ok), default=None)
    skill_antes = primera_skill_ok is not None and (primera_lectura_lib is None or primera_skill_ok < primera_lectura_lib)
    if prompt_txt is None: modo = "DESCONOCIDO (falta --prompt)"
    elif not skill_ok: modo = "NINGUNA (la Skill no se invocó con éxito)"
    elif terminos: modo = "MANUAL (el encargo menciona: " + ", ".join(terminos) + ")"
    else: modo = "AUTOMÁTICA (encargo limpio; Claude Code invocó la Skill por iniciativa propia)"

    checks = [
        ("Skill web-library-router registrada en la sesión (evento init)", skill_en_init is True, "sin evento init" if skill_en_init is None else ""),
        ("Skill web-library-router invocada con éxito", skill_invocada is True,
         {None: "solo mencionada", "error": "la llamada devolvió error", False: "no invocada"}.get(skill_invocada, "")),
        ("KNOWLEDGE_INDEX.md leído", indice_leido, ""),
        ("LIBRARY_MANIFEST.json leído", manifiesto_leido, ""),
        (">= 5 fichas del manifiesto leídas", len(ids_leidos) >= 5, ", ".join(ids_leidos)),
        ("Rutas leídas existen", not inexistentes, "; ".join(inexistentes)),
        ("Ninguna ruta con prefijo engañoso", not prefijo_falso, "; ".join(prefijo_falso)),
        ("Sin herramientas de escritura/ejecución", not escritura, ", ".join(escritura)),
        (f"Respuesta cita la versión {version}", bool(version) and version in texto_final, ""),
        ("Respuesta cita la ruta absoluta real de la biblioteca", cita_raiz, ""),
        ("Respuesta cita los IDs leídos", len(citados) >= min(5, len(ids_leidos)) and ids_leidos != [], f"{len(citados)}/{len(ids_leidos)}"),
        ("Lecturas de la biblioteca completas y sin error", not incompletas, "; ".join(os.path.relpath(canon(p), lib) for p in incompletas)),
        ("Ninguna ficha no leída citada sin marcar \"(no leída)\"", not sin_marcar, f"{len(sin_marcar)}: " + ", ".join(sin_marcar) if sin_marcar else ""),
        ("Registro CONSULTA (secciones 1–4) en la respuesta", not faltan_sec, "faltan: " + ", ".join(faltan_sec) if faltan_sec else ""),
        ("Ruta absoluta completa de cada ficha leída en la respuesta", not sin_ruta_abs and bool(ids_leidos), ", ".join(sin_ruta_abs)),
    ] + area_checks
    if opts["--modo"] == "automatico":
        checks += [
            ("Encargo sin mencionar Skill/Skills/biblioteca", prompt_txt is not None and not terminos, ", ".join(terminos) or ("falta --prompt" if prompt_txt is None else "")),
            ("Skill invocada antes de la primera lectura de la biblioteca", skill_antes, ""),
        ]
    for nombre, ok, detalle in checks:
        print(("OK   " if ok else "FALLA"), nombre, ("— " + detalle) if detalle else "")
    print("MODO DE INVOCACIÓN:", modo)
    if fuera: print("INFO lecturas fuera de la biblioteca:", "; ".join(fuera))
    print("INFO fichas leídas (completas):", ", ".join(ids_leidos) or "—")
    print("INFO fichas mencionadas como pendientes \"(no leída)\":", ", ".join(marcadas) or "—")
    print("INFO fichas citadas sin leer y sin marcar:", ", ".join(sin_marcar) or "—")
    aprobado = all(ok for _, ok, _ in checks)
    print("VEREDICTO:", "SUPERA los criterios automáticos (falta revisión humana)" if aprobado else "NO SUPERA")
    return 0 if aprobado else 1


if __name__ == "__main__":
    sys.exit(main())
