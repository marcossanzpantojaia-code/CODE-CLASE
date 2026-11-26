# Reproducir el prototipo n.º 1 y sus pruebas

## Ver el prototipo
No tiene dependencias: abrir `proyecto/index.html` en un navegador, o servir la carpeta:
```
cd proyecto && python3 -m http.server 4321
```

## Repetir la construcción (requiere autorización: consume cuota)
1. Descomprimir `WEB_ENGINEERING_KNOWLEDGE_LIBRARY_v0.17.0.zip` (sha256 `dfeec461…74c6b5`) en una carpeta temporal y crear una carpeta `proyecto/` vacía.
2. Crear `settings.json` con reglas *deny* de `Edit(//<copia>/**)` y `Write(//<copia>/**)` (ver el de esta carpeta).
3. Desde `proyecto/`:
```
claude -p --setting-sources project --strict-mcp-config --no-chrome \
  --tools "Read,Grep,Glob,Skill,Write,Edit" --allowedTools "Skill(web-library-router)" \
  --settings settings.json --add-dir <copia> --permission-mode acceptEdits --permission-prompts none \
  --no-session-persistence --max-budget-usd 6 --output-format stream-json --verbose "$(cat prompt.txt)" \
  < /dev/null > evidencia_construccion.jsonl
```
4. Verificar: `python verify_build_evidence.py <copia> evidencia_construccion.jsonl proyecto --prompt prompt.txt` y `python make_trace.py <copia> evidencia_construccion.jsonl <zip> traza.json` antes de borrar la carpeta temporal.

## Repetir las pruebas (Playwright ya instalado en el entorno)
```
node herramientas_prueba/run_tests.mjs http://127.0.0.1:4321/ salida/
node herramientas_prueba/extra.mjs http://127.0.0.1:4321/ salida/
```
Versiones usadas: Playwright 1.63.0, Chromium 153.0.8010.12, Node 22.23.4.
