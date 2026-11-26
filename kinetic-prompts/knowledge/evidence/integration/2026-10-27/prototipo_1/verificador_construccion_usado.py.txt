#!/usr/bin/env python3
"""Verifica las evidencias de una CONSTRUCCIÓN con Claude Code usando la biblioteca (lote 18).

Uso:
    python verify_build_evidence.py <copia_biblioteca> <evidencia.jsonl> <carpeta_proyecto> --prompt <prompt.txt>
                                    [--remap <raiz_original>=<raiz_nueva>]

Comprueba (orientativo; la revisión humana y las pruebas del prototipo son aparte):
  1. Skill web-library-router en `init` e invocada sin error, ANTES de la primera lectura de la biblioteca y del primer
     Write/Edit; encargo sin términos vetados (skill, biblioteca, library, web-library-router…) → activación AUTOMÁTICA.
  2. KNOWLEDGE_INDEX.md y LIBRARY_MANIFEST.json leídos completos; fichas leídas completas (sin error, sin limit/offset parcial).
  3. Al menos una ficha leída ANTES del primer Write/Edit de código del proyecto.
  4. Ninguna escritura fuera de la carpeta del proyecto (en particular, ninguna en la biblioteca) y sin Bash.
  5. Registro CONSULTA_BIBLIOTECA.md en el proyecto con los títulos "1. Encargo", "2. Necesidades", "3. Aplicación",
     "4. Fichas consultadas", y la ruta (absoluta o relativa a la biblioteca) de cada ficha leída que cite.
  6. Atribución: todo ID de ficha citado en los archivos del proyecto (md, html, css, js, astro, ts) debe haberse leído,
     salvo que la línea diga "(no leída)" o "sin leer".
No valida la calidad visual ni el funcionamiento del prototipo.
"""
import json, os, re, sys

SKILL = "web-library-router"
VETADOS = [SKILL, "skill", "biblioteca", "library", "web_engineering", "knowledge_index", "manifest"]
ESCRITURA = {"Write", "Edit", "MultiEdit", "NotebookEdit"}
EJECUCION = {"Bash", "PowerShell"}
EXT = (".md", ".html", ".css", ".js", ".mjs", ".astro", ".ts", ".tsx", ".jsx", ".json", ".txt")


def canon(p): return os.path.normcase(os.path.realpath(os.path.normpath(p.replace("\\", "/"))))
def dentro(p, r):
    try: return os.path.commonpath([canon(p), r]) == r
    except ValueError: return False


def main():
    a = sys.argv[1:]; opts = {"--prompt": None, "--remap": None}; pos = []; i = 0
    while i < len(a):
        if a[i] in opts and i + 1 < len(a): opts[a[i]] = a[i + 1]; i += 2
        else: pos.append(a[i]); i += 1
    if len(pos) != 3 or not opts["--prompt"]: print(__doc__); return 2
    lib, evid, proj = canon(pos[0]), pos[1], canon(pos[2])
    remap = tuple(x.rstrip("/") for x in opts["--remap"].split("=", 1)) if opts["--remap"] else None
    man = json.load(open(os.path.join(lib, "integration", "LIBRARY_MANIFEST.json"), encoding="utf-8"))
    ci, cr = man["columnas"].index("id"), man["columnas"].index("ruta")
    rel_de = {f[ci]: f[cr] for f in man["fichas"]}; id_de = {canon(os.path.join(lib, r)): i for i, r in rel_de.items()}
    llamadas, errores, skill_init = [], set(), None
    for linea in open(evid, encoding="utf-8", errors="replace"):
        if remap: linea = linea.replace(remap[0], remap[1])
        try: ev = json.loads(linea)
        except json.JSONDecodeError: continue
        if ev.get("type") == "system" and ev.get("subtype") == "init": skill_init = SKILL in (ev.get("skills") or [])
        if ev.get("type") in ("assistant", "user") and isinstance(ev.get("message", {}).get("content"), list):
            for c in ev["message"]["content"]:
                if c.get("type") == "tool_use": llamadas.append((len(llamadas), c.get("name"), c.get("input") or {}, c.get("id")))
                if c.get("type") == "tool_result" and c.get("is_error"): errores.add(c.get("tool_use_id"))
    def completa(c):
        r = c[2].get("file_path")
        if c[3] in errores or not r or not os.path.isfile(r): return False
        n = sum(1 for _ in open(r, encoding="utf-8", errors="replace"))
        return int(c[2].get("offset") or 0) <= 1 and (c[2].get("limit") is None or int(c[2]["limit"]) >= n)
    skill_ok = [c[0] for c in llamadas if c[1] == "Skill" and SKILL in json.dumps(c[2]) and c[3] not in errores]
    lect = [c for c in llamadas if c[1] == "Read" and c[2].get("file_path") and dentro(c[2]["file_path"], lib)]
    lect_ok = [c for c in lect if completa(c)]
    ids_leidos = {id_de[canon(c[2]["file_path"])] for c in lect_ok if canon(c[2]["file_path"]) in id_de}
    escrituras = [c for c in llamadas if c[1] in ESCRITURA]
    primera_esc = min((c[0] for c in escrituras), default=None)
    fichas_antes = {id_de[canon(c[2]["file_path"])] for c in lect_ok if canon(c[2]["file_path"]) in id_de and (primera_esc is None or c[0] < primera_esc)}
    fuera = sorted({c[2].get("file_path", "?") for c in escrituras if not dentro(c[2].get("file_path", "/"), proj)})
    en_lib = [p for p in fuera if dentro(p, lib)]
    ejec = sorted({c[1] for c in llamadas if c[1] in EJECUCION})
    prompt = open(opts["--prompt"], encoding="utf-8").read().lower(); vet = [t for t in VETADOS if t in prompt]
    primera_lect = min((c[0] for c in lect), default=None)
    skill_antes = bool(skill_ok) and (primera_lect is None or skill_ok[0] < primera_lect) and (primera_esc is None or skill_ok[0] < primera_esc)
    # Archivos del proyecto
    textos = {}
    for raiz, _, archivos in os.walk(proj):
        if "node_modules" in raiz: continue
        for f in archivos:
            if f.endswith(EXT): textos[os.path.join(raiz, f)] = open(os.path.join(raiz, f), encoding="utf-8", errors="replace").read()
    consulta = next((t for p, t in textos.items() if os.path.basename(p) == "CONSULTA_BIBLIOTECA.md"), None)
    faltan = [] if consulta is None else [k for k, v in {"1. Encargo": "1. encargo", "2. Necesidades": "2. necesidades", "3. Aplicación": "3. aplicaci", "4. Fichas consultadas": "4. fichas consultadas"}.items() if v not in consulta.lower()]
    sin_ruta = [] if consulta is None else [i for i in sorted(ids_leidos) if i in consulta and rel_de[i] not in consulta]
    sin_marcar = {}
    for p, t in textos.items():
        for ln in t.splitlines():
            ids = set(re.findall(r"\b([A-Z0-9]{2,6}-\d{3})\b", ln)) & set(rel_de)
            for x in ids - ids_leidos:
                if not re.search(r"no le[ií]da|sin leer", ln, re.I): sin_marcar.setdefault(x, os.path.relpath(p, proj))
    idx = any(canon(c[2]["file_path"]) == canon(os.path.join(lib, "KNOWLEDGE_INDEX.md")) for c in lect_ok)
    mani = any(canon(c[2]["file_path"]) == canon(os.path.join(lib, "integration", "LIBRARY_MANIFEST.json")) for c in lect_ok)
    checks = [
        ("Skill registrada (init)", skill_init is True, ""),
        ("Skill invocada con éxito", bool(skill_ok), ""),
        ("Encargo sin términos vetados (activación automática)", not vet, ", ".join(vet)),
        ("Skill antes de la primera lectura de la biblioteca y del primer Write/Edit", skill_antes, ""),
        ("KNOWLEDGE_INDEX.md leído completo", idx, ""),
        ("LIBRARY_MANIFEST.json leído completo", mani, ""),
        ("Lecturas de la biblioteca sin error ni parciales", len(lect_ok) == len(lect), f"{len(lect) - len(lect_ok)} incompletas"),
        ("Al menos una ficha leída antes del primer Write/Edit", bool(fichas_antes), ", ".join(sorted(fichas_antes))),
        ("Hubo escritura del proyecto", bool(escrituras), f"{len(escrituras)} llamadas"),
        ("Ninguna escritura fuera del proyecto", not fuera, "; ".join(fuera)),
        ("Ninguna escritura en la biblioteca", not en_lib, "; ".join(en_lib)),
        ("Sin herramientas de ejecución", not ejec, ", ".join(ejec)),
        ("CONSULTA_BIBLIOTECA.md en el proyecto", consulta is not None, ""),
        ("CONSULTA con secciones 1–4", consulta is not None and not faltan, ", ".join(faltan)),
        ("CONSULTA con la ruta de cada ficha leída que cita", consulta is not None and not sin_ruta, ", ".join(sin_ruta)),
        ("Ningún ID no leído citado sin marcar en los archivos del proyecto", not sin_marcar, "; ".join(f"{k} ({v})" for k, v in sorted(sin_marcar.items()))),
    ]
    for n, ok, d in checks: print(("OK   " if ok else "FALLA"), n, ("— " + d) if d else "")
    print("INFO fichas leídas completas:", ", ".join(sorted(ids_leidos)) or "—")
    print("INFO fichas leídas antes de escribir:", ", ".join(sorted(fichas_antes)) or "—")
    print("INFO archivos del proyecto:", ", ".join(sorted(os.path.relpath(p, proj) for p in textos)) or "—")
    ok = all(x for _, x, _ in checks)
    print("VEREDICTO:", "SUPERA los criterios automáticos de trazabilidad (falta revisión humana y pruebas del prototipo)" if ok else "NO SUPERA")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
