#!/usr/bin/env python3
"""Comprobador y generador de manifiesto de WEB_ENGINEERING_KNOWLEDGE_LIBRARY.

Uso (desde cualquier carpeta; solo lee la biblioteca y escribe integration/LIBRARY_MANIFEST.json):
    python integration/tools/library_check.py <ruta_biblioteca> [--write-manifest] [--baseline <carpeta de la versión anterior>]

Solo usa la biblioteca estándar de Python (sin dependencias). No modifica fichas.
Comprueba: JSON válidos, enlaces relativos Markdown, IDs citados que existen,
rutas e IDs citados en las Skills, estados permitidos en las fichas.
"""
import glob, json, os, re, sys

ESTADOS = ("INVESTIGADO", "PROPUESTO", "IMPLEMENTADO", "VALIDADO", "NO VERIFICADO")
CARPETAS_NO_FICHA = ("tutorials", "_templates", "skills", "evidence", "_origen", "integration")
ID_RE = re.compile(r"\b([A-Z][A-Z0-9]{1,6}-\d{3})\b")

def frontmatter(texto):
    m = re.match(r"---\n(.*?)\n---", texto, re.S)
    datos = {}
    if m:
        for linea in m.group(1).splitlines():
            if ":" in linea:
                k, v = linea.split(":", 1)
                datos[k.strip()] = v.strip()
    return datos

def main():
    if len(sys.argv) < 2:
        print(__doc__); return 2
    raiz = os.path.abspath(sys.argv[1]); os.chdir(raiz)
    errores, avisos = [], []
    for f in glob.glob("**/*.json", recursive=True):
        try: json.load(open(f, encoding="utf-8"))
        except Exception as e: errores.append(f"JSON inválido: {f}: {e}")
    fichas = {}
    for f in sorted(glob.glob("*/*.md")):
        carpeta = f.split(os.sep)[0].split("/")[0]
        if carpeta in CARPETAS_NO_FICHA or os.path.basename(f) == "README.md": continue
        fm = frontmatter(open(f, encoding="utf-8").read())
        if "id" not in fm: avisos.append(f"Sin id en frontmatter: {f}"); continue
        estado = fm.get("estado", "")
        if not estado.startswith(ESTADOS): avisos.append(f"Estado no estándar en {f}: {estado}")
        fichas[fm["id"]] = {"id": fm["id"], "ruta": f.replace(os.sep, "/"), "titulo": fm.get("titulo", ""),
                            "categoria": fm.get("categoria", carpeta), "estado": estado,
                            "perfil": fm.get("perfil", ""), "evidencia": fm.get("evidencia", ""),
                            "ultima_revision": fm.get("ultima_revision", "")}
    tuts = {os.path.basename(f).split("-")[0] + "-" + os.path.basename(f).split("-")[1]: f
            for f in glob.glob("tutorials/TUT-*.md")}
    conocidos = set(fichas) | set(tuts)
    prefijos = {i.split("-")[0] for i in conocidos}
    for f in glob.glob("**/*.md", recursive=True):
        if f.startswith(("_origen", "_templates")): continue
        texto = open(f, encoding="utf-8").read()
        for enlace in re.findall(r"\]\(([^)#\s]+)", texto):
            if enlace.startswith(("http://", "https://", "mailto:")): continue
            if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(f), enlace))):
                errores.append(f"Enlace roto en {f}: {enlace}")
        for ident in set(ID_RE.findall(texto)):
            if ident.split("-")[0] in prefijos and ident not in conocidos:
                errores.append(f"ID inexistente citado en {f}: {ident}")
    for f in glob.glob("skills/*/SKILL.md"):
        texto = open(f, encoding="utf-8").read()
        for ruta in re.findall(r"`(?:\$WEB_LIBRARY_PATH/|LIB/)?((?:[a-z_]+/)+[A-Za-z0-9_.\-]+\.(?:md|json|py|ps1))`", texto):
            if not os.path.exists(ruta):
                errores.append(f"Skill {f} cita una ruta inexistente: {ruta}")
        for ident in set(ID_RE.findall(texto)):
            if ident.split("-")[0] in prefijos and ident not in conocidos:
                errores.append(f"Skill {f} cita un ID inexistente: {ident}")
    # Convenciones de Skills de Claude Code y espejo .claude/skills
    import filecmp
    for d in sorted(glob.glob("skills/*/")):
        nombre = os.path.basename(os.path.dirname(d)); sk = os.path.join(d, "SKILL.md")
        if not os.path.exists(sk): errores.append(f"Falta SKILL.md en {d}"); continue
        texto = open(sk, encoding="utf-8").read()
        if not texto.startswith("---\n"): errores.append(f"{sk}: el frontmatter debe empezar en la primera línea")
        fm = frontmatter(texto)
        if fm.get("name") and fm["name"] != nombre: errores.append(f"{sk}: name '{fm['name']}' distinto de la carpeta '{nombre}'")
        desc = fm.get("description", "")
        if not desc: errores.append(f"{sk}: falta description")
        if len(desc) + len(fm.get("when_to_use", "")) > 1536: errores.append(f"{sk}: description+when_to_use > 1536 caracteres")
        if re.search(r"[<>]", fm.get("name", "")): errores.append(f"{sk}: name con caracteres no permitidos")
        if texto.count("\n") > 500: avisos.append(f"{sk}: más de 500 líneas")
        espejo = os.path.join(".claude", "skills", nombre, "SKILL.md")
        if not os.path.exists(espejo): errores.append(f"Falta el espejo {espejo}")
        elif not filecmp.cmp(sk, espejo, shallow=False): errores.append(f"{espejo} difiere de {sk} (copiar skills/ → .claude/skills/)")
    # Lote 16: protección frente a pérdidas — ninguna ficha/TUT/VR de la versión anterior puede desaparecer.
    if "--baseline" in sys.argv:
        try:
            base_dir = os.path.abspath(sys.argv[sys.argv.index("--baseline") + 1])
            bm = json.load(open(os.path.join(base_dir, "integration", "LIBRARY_MANIFEST.json"), encoding="utf-8"))
            ci = bm["columnas"].index("id") if "columnas" in bm else None
            base_ids = {(f[ci] if ci is not None else f["id"]) for f in bm["fichas"]}
            perdidas = sorted(base_ids - set(fichas))
            if perdidas: errores.append("Fichas de la versión anterior que ya no existen: " + ", ".join(perdidas))
            base_tut = set(bm.get("tutoriales", [])); act_tut = {p.replace(os.sep, "/") for p in tuts.values()}
            if base_tut - act_tut: errores.append("TUT desaparecidos: " + ", ".join(sorted(base_tut - act_tut)))
            bvr = {i["id"] for i in json.load(open(os.path.join(base_dir, "VIDEO_RESEARCH_INDEX.json"), encoding="utf-8"))["items"]}
            avr = {i["id"] for i in json.load(open("VIDEO_RESEARCH_INDEX.json", encoding="utf-8"))["items"]}
            if bvr - avr: errores.append("Registros VR desaparecidos: " + ", ".join(sorted(bvr - avr)))
            bsrc = {x["id"]: x["coverage"].get("n_est", 0) for x in json.load(open(os.path.join(base_dir, "SOURCE_CATALOG.json"), encoding="utf-8"))["sources"]}
            asrc = {x["id"]: x["coverage"].get("n_est", 0) for x in json.load(open("SOURCE_CATALOG.json", encoding="utf-8"))["sources"]}
            bajan = [k for k in bsrc if asrc.get(k, -1) < bsrc[k]]
            if bajan: avisos.append("Fuentes cuyo n.º de estudiados BAJA respecto a la versión anterior (¿sobrescritura?): " + ", ".join(bajan))
            print(f"Baseline {base_dir}: {len(base_ids)} fichas, {len(bvr)} VR comprobados")
        except (OSError, ValueError, KeyError, IndexError) as e:
            errores.append(f"No se pudo comparar con la versión anterior: {e}")
    # Lote 17: el manifiesto debe listar exactamente las fichas existentes (salvo si se va a reescribir ahora).
    if "--write-manifest" not in sys.argv and os.path.exists("integration/LIBRARY_MANIFEST.json"):
        try:
            mm = json.load(open("integration/LIBRARY_MANIFEST.json", encoding="utf-8"))
            mi = mm["columnas"].index("id") if "columnas" in mm else None
            m_ids = {(f[mi] if mi is not None else f["id"]) for f in mm["fichas"]}
            if m_ids != set(fichas):
                errores.append("LIBRARY_MANIFEST.json desactualizado (faltan: " + ", ".join(sorted(set(fichas) - m_ids)) + "; sobran: " + ", ".join(sorted(m_ids - set(fichas))) + ") → ejecutar con --write-manifest")
        except (ValueError, KeyError) as e:
            errores.append(f"LIBRARY_MANIFEST.json ilegible: {e}")
    # Lote 15: coherencia de inventario entre KNOWLEDGE_INDEX.md y los archivos reales.
    try:
        idx = open("KNOWLEDGE_INDEX.md", encoding="utf-8").read()
        vr = json.load(open("VIDEO_RESEARCH_INDEX.json", encoding="utf-8"))["items"]
        m1 = re.search(r"Fichas por técnica y conocimiento \((\d+)\)", idx)
        m2 = re.search(r"(\d+) fichas TUT-001", idx)
        m3 = re.search(r"(\d+) entradas \(VR-001…VR-(\d+)\)", idx)
        if m1 and int(m1.group(1)) != len(fichas): errores.append(f"KNOWLEDGE_INDEX dice {m1.group(1)} fichas; hay {len(fichas)}")
        if m2 and int(m2.group(1)) != len(tuts): errores.append(f"KNOWLEDGE_INDEX dice {m2.group(1)} TUT; hay {len(tuts)}")
        ultimo = max(int(i["id"].split("-")[1]) for i in vr)
        if m3 and (int(m3.group(1)) != len(vr) or int(m3.group(2)) != ultimo):
            errores.append(f"KNOWLEDGE_INDEX dice {m3.group(1)} entradas (hasta VR-{m3.group(2)}); VIDEO_RESEARCH_INDEX tiene {len(vr)} (hasta VR-{ultimo:03d})")
        if not (m1 and m2 and m3): avisos.append("No se encontraron las líneas de recuento en KNOWLEDGE_INDEX.md")
    except (OSError, ValueError, KeyError) as e:
        avisos.append(f"Comprobación de inventario no realizada: {e}")
    print(f"Fichas: {len(fichas)} · TUT: {len(tuts)} · VR: {len(json.load(open('VIDEO_RESEARCH_INDEX.json', encoding='utf-8'))['items'])} · errores: {len(errores)} · avisos: {len(avisos)}")
    for e in errores: print("ERROR", e)
    for a in avisos: print("AVISO", a)
    if "--write-manifest" in sys.argv:
        manifest = {"biblioteca": "WEB_ENGINEERING_KNOWLEDGE_LIBRARY", "generado_por": "integration/tools/library_check.py",
                    "nota": "Índice legible por máquina para recuperación selectiva. La fuente de verdad son las fichas.",
                    "fichas": sorted(fichas.values(), key=lambda x: x["id"]),
                    "tutoriales": sorted(p.replace(os.sep, "/") for p in tuts.values())}
        # Formato compacto (lote 13): una ficha por línea como lista, sin evidencia (está en cada ficha), para que la herramienta
        # Read de Claude Code lo lea completo de una vez (en la prueba mínima del 2026-10-27 el formato con
        # indent=1, 55 KB, se truncó en la línea 930 de 1240).
        cols = ["id", "ruta", "titulo", "categoria", "estado", "perfil", "ultima_revision"]
        compactas = []
        for f in manifest["fichas"]:
            g = dict(f); g.pop("evidencia", None)
            if len(g.get("titulo", "")) > 60: g["titulo"] = g["titulo"][:59].rstrip() + "…"
            compactas.append(json.dumps([g.get(c, "") for c in cols], ensure_ascii=False))
        with open("integration/LIBRARY_MANIFEST.json", "w", encoding="utf-8") as out:
            out.write("{\n")
            for k in ("biblioteca", "generado_por", "nota"):
                out.write(f" {json.dumps(k)}: {json.dumps(manifest[k], ensure_ascii=False)},\n")
            out.write(' "formato": "una ficha por línea como lista en el orden de columnas; títulos abreviados a 60 caracteres; título y evidencia completos en la cabecera de cada ficha",\n')
            out.write(' "total_fichas": ' + str(len(compactas)) + ',\n')
            out.write(' "columnas": ' + json.dumps(cols) + ',\n')
            out.write(' "fichas": [\n  ' + ",\n  ".join(compactas) + "\n ],\n")
            out.write(' "tutoriales": ' + json.dumps(manifest["tutoriales"], ensure_ascii=False) + "\n}\n")
        print("Manifiesto escrito: integration/LIBRARY_MANIFEST.json")
    if os.path.exists("integration/LIBRARY_MANIFEST.json") and os.path.getsize("integration/LIBRARY_MANIFEST.json") > 35000:
        print("AVISO LIBRARY_MANIFEST.json supera 35 KB: la herramienta Read de Claude Code puede truncarlo (prueba mínima 2026-10-27); dividirlo por categoría")
    return 1 if errores else 0

if __name__ == "__main__":
    sys.exit(main())
