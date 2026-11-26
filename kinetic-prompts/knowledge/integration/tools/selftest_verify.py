#!/usr/bin/env python3
"""Autoprueba del verificador (lote 16). Genera evidencias SINTÉTICAS en una carpeta temporal y comprueba que
verify_test_evidence.py acepta el caso correcto y rechaza los incorrectos. No son evidencias de integración.

Uso:  python selftest_verify.py <ruta_biblioteca>
Solo lee la biblioteca; escribe únicamente en una carpeta temporal del sistema que se borra al terminar.
"""
import json, os, subprocess, sys, tempfile, shutil

FICHAS = [("UX-002", "ux/UX-002-pagina-de-inicio-de-negocio.md"), ("SEO-003", "seo/SEO-003-seo-local-perfil-de-empresa.md"),
          ("A11Y-001", "accessibility/A11Y-001-reduced-motion.md"), ("ST-001", "scrolltrigger/ST-001-fundamentos-scrolltrigger.md"),
          ("WGPU-001", "threejs/WGPU-001-webgpu-vs-webgl-y-degradacion.md")]
PROMPT = ("Diseña el enfoque técnico para una página web premium de una barbería, con animaciones cinematográficas, scroll interactivo, "
          "reservas, SEO local y buena accesibilidad. Explica qué técnicas aplicarías y por qué. No escribas código ni archivos todavía.")


def construir(lib, ruta, extra="", errores=(), limite=None, omitir_ruta=None, sin_manifiesto=False, sin_registro=False):
    version = open(os.path.join(lib, "KNOWLEDGE_INDEX.md"), encoding="utf-8").read().split("Versión ", 1)[1].split(" ", 1)[0]
    ev = [{"type": "system", "subtype": "init", "skills": ["web-library-router"]}]
    llamadas = [("s0", "Skill", {"skill": "web-library-router"}), ("r1", "Read", {"file_path": os.path.join(lib, "KNOWLEDGE_INDEX.md")})]
    if not sin_manifiesto:
        llamadas.append(("r2", "Read", {"file_path": os.path.join(lib, "integration", "LIBRARY_MANIFEST.json")}))
    for k, (i, f) in enumerate(FICHAS):
        entrada = {"file_path": os.path.join(lib, f)}
        if limite and k == 0: entrada["limit"] = limite
        llamadas.append((f"f{k}", "Read", entrada))
    for cid, nombre, entrada in llamadas:
        ev.append({"type": "assistant", "message": {"content": [{"type": "tool_use", "id": cid, "name": nombre, "input": entrada}]}})
        ev.append({"type": "user", "message": {"content": [{"type": "tool_result", "tool_use_id": cid, "content": "ok", "is_error": cid in errores}]}})
    rutas = "\n".join(f"- {i}: {os.path.join(lib, f)}" for i, f in FICHAS if i != omitir_ruta)
    registro = "" if sin_registro else "## 1. Encargo\n## 2. Necesidades → fichas\n## 3. Aplicación\n## 4. Fichas consultadas y descartadas\n"
    texto = f"Versión {version}. Raíz {lib}\n{rutas}\nDescarto Three.js según WGPU-001.\n{extra}\n{registro}"
    ev.append({"type": "result", "result": texto})
    open(ruta, "w", encoding="utf-8").write("\n".join(json.dumps(e) for e in ev))


def main():
    if len(sys.argv) != 2: print(__doc__); return 2
    lib = os.path.abspath(sys.argv[1]); ver = os.path.join(os.path.dirname(__file__), "verify_test_evidence.py")
    for i, f in FICHAS:
        if not os.path.exists(os.path.join(lib, f)): print("Falta la ficha de prueba", f); return 2
    tmp = tempfile.mkdtemp(prefix="wel_selftest_")
    try:
        p = os.path.join(tmp, "prompt.txt"); open(p, "w", encoding="utf-8").write(PROMPT)
        casos = {"correcto": (dict(extra="TXT-001 (no leída) queda pendiente."), 0),
                 "atribucion_sin_leer": (dict(extra="Usaría SplitText según TXT-001."), 1),
                 "lectura_parcial": (dict(limite=5), 1), "lectura_con_error": (dict(errores={"f3"}), 1),
                 "sin_ruta_absoluta": (dict(omitir_ruta="SEO-003"), 1), "sin_manifiesto": (dict(sin_manifiesto=True), 1),
                 "sin_registro": (dict(sin_registro=True), 1)}
        fallos = 0
        for nombre, (kw, esperado) in casos.items():
            e = os.path.join(tmp, nombre + ".jsonl"); construir(lib, e, **kw)
            r = subprocess.run([sys.executable, "-I", ver, lib, e, "--prompt", p, "--modo", "automatico",
                                "--areas", "comercial,seo,accesibilidad,animacion,scroll,gsap,3d?"], capture_output=True, text=True)
            ok = (r.returncode == 0) == (esperado == 0)
            fallos += not ok
            print(("OK   " if ok else "FALLA"), nombre, "→", "SUPERA" if r.returncode == 0 else "NO SUPERA", "(esperado:", "SUPERA)" if esperado == 0 else "NO SUPERA)")
        print("AUTOPRUEBA:", "correcta" if not fallos else f"{fallos} casos con resultado inesperado")
        return 1 if fallos else 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
