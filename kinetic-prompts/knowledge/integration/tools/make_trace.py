#!/usr/bin/env python3
"""Genera traza.json para que una prueba de integración pueda verificarse aunque se borre la carpeta temporal (lote 17).

Uso:  python make_trace.py <copia_biblioteca_de_la_prueba> <evidencia.jsonl> <zip_publicado> <salida_traza.json>

Registra: versión del índice, sha256 del ZIP, sha256 del manifiesto, y por cada llamada a herramienta su orden, nombre,
ruta RELATIVA a la raíz de la biblioteca (si está dentro), parámetros de lectura (offset/limit), error sí/no, sha256 del
archivo leído en la copia, y el ID de ficha según el manifiesto. Solo lee archivos (biblioteca estándar).
Esto valida la TRANSCRIPCIÓN de herramientas; no demuestra ninguna implementación visual.
"""
import hashlib, json, os, re, sys


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(65536), b""): h.update(b)
    return h.hexdigest()


def main():
    if len(sys.argv) != 5: print(__doc__); return 2
    lib, evid, zp, out = (os.path.realpath(sys.argv[1]), sys.argv[2], sys.argv[3], sys.argv[4])
    man = json.load(open(os.path.join(lib, "integration", "LIBRARY_MANIFEST.json"), encoding="utf-8"))
    ci, cr = man["columnas"].index("id"), man["columnas"].index("ruta")
    id_de = {f[cr]: f[ci] for f in man["fichas"]}
    version = re.search(r"Versión (\d+\.\d+\.\d+)", open(os.path.join(lib, "KNOWLEDGE_INDEX.md"), encoding="utf-8").read()).group(1)
    llamadas, errores, init, resultado = [], set(), {}, {}
    for linea in open(evid, encoding="utf-8", errors="replace"):
        try: ev = json.loads(linea)
        except json.JSONDecodeError: continue
        if ev.get("type") == "system" and ev.get("subtype") == "init":
            init = {k: ev.get(k) for k in ("claude_code_version", "model", "permissionMode", "tools", "skills")}
        if ev.get("type") == "result":
            resultado = {k: ev.get(k) for k in ("subtype", "is_error", "num_turns", "duration_ms", "permission_denials")}
            resultado["result_sha256"] = hashlib.sha256((ev.get("result") or "").encode("utf-8")).hexdigest()
        if ev.get("type") in ("assistant", "user"):
            for c in ev.get("message", {}).get("content", []) if isinstance(ev.get("message", {}).get("content"), list) else []:
                if c.get("type") == "tool_use": llamadas.append(c)
                if c.get("type") == "tool_result" and c.get("is_error"): errores.add(c.get("tool_use_id"))
    filas = []
    for n, c in enumerate(llamadas, 1):
        inp = c.get("input") or {}; fila = {"orden": n, "herramienta": c.get("name")}
        ruta = inp.get("file_path") or inp.get("path")
        if c.get("name") == "Skill": fila["skill"] = inp.get("skill")
        if c.get("name") in ("Grep", "Glob"): fila["patron"] = inp.get("pattern")
        if ruta:
            r = os.path.realpath(ruta)
            dentro = os.path.commonpath([r, lib]) == lib
            fila["ruta_rel"] = os.path.relpath(r, lib).replace(os.sep, "/") if dentro else None
            fila["fuera_de_la_biblioteca"] = not dentro
            if dentro and os.path.isfile(r):
                fila["sha256"] = sha(r); fila["lineas"] = sum(1 for _ in open(r, encoding="utf-8", errors="replace"))
                fila["id_ficha"] = id_de.get(fila["ruta_rel"])
        for k in ("offset", "limit"):
            if k in inp: fila[k] = inp[k]
        fila["error"] = c.get("id") in errores
        filas.append(fila)
    traza = {"generado_por": "integration/tools/make_trace.py", "version_biblioteca": version,
             "zip": os.path.basename(zp), "zip_sha256": sha(zp),
             "manifiesto_sha256": sha(os.path.join(lib, "integration", "LIBRARY_MANIFEST.json")),
             "evidencia_sha256": sha(evid), "raiz_original": lib, "init": init, "resultado": resultado, "llamadas": filas,
             "nota": "Para re-verificar: descomprimir el mismo ZIP (mismo sha256) y usar verify_test_evidence.py --remap <raiz_original>=<nueva_raiz>."}
    json.dump(traza, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"traza: {len(filas)} llamadas · versión {version} · zip {traza['zip_sha256'][:12]}…")
    return 0


if __name__ == "__main__":
    sys.exit(main())
