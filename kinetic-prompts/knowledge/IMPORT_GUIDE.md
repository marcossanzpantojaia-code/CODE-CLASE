# IMPORT_GUIDE — Uso con Claude Code

> Estado: PROPUESTO. No se ha probado esta instalación. No modifica proyectos existentes por sí sola.
>
> **Desde v0.12.0 la referencia es [integration/INTEGRATION_GUIDE.md](integration/INTEGRATION_GUIDE.md)** (rutas de Windows sin `~`, instalación enlazada de Skills, recuperación selectiva, pruebas y evidencias). Este documento se conserva como histórico. **Aviso v0.13.0:** la línea `WEB_LIBRARY_PATH=` del §3 está retirada; ver §2 de la guía nueva.

## 1. Ubicar la biblioteca

Descomprimir en una ruta fija fuera de cualquier proyecto, por ejemplo `~/knowledge/WEB_ENGINEERING_KNOWLEDGE_LIBRARY/`. Mantenerla separada de `AI_CINEMATIC_VIDEO_ENGINE`.

## 2. Instalar las Skills

Claude Code busca Skills en `~/.claude/skills/` (personales, para todos los proyectos) o en `.claude/skills/` dentro de un proyecto. Copiar las cuatro carpetas de `skills/` (excepto el README) a una de esas ubicaciones.

## 3. CLAUDE.md (una línea, no el contenido)

En el CLAUDE.md del proyecto donde se quiera usar:

```
WEB_LIBRARY_PATH=~/knowledge/WEB_ENGINEERING_KNOWLEDGE_LIBRARY — consulta KNOWLEDGE_INDEX.md mediante la skill web-library-router antes de implementar diseño, animación o 3D.
```

## 4. Skills oficiales de GSAP (opcional, requiere autorización)

GreenSock mantiene `greensock/gsap-skills` (MIT). Su README indica instalarlas desde el marketplace de plugins de Claude Code o copiando su carpeta `skills/`. Revisar su contenido antes de instalar.

## 5. Mantenimiento

- Nuevas fichas: copiar `_templates/FICHA_TECNICA.md`, asignar ID y añadirla a `KNOWLEDGE_INDEX.md` y a `SOURCE_CATALOG.json`.
- Al validar una técnica en un proyecto real, actualizar estado, versiones y evidencia en la ficha.
