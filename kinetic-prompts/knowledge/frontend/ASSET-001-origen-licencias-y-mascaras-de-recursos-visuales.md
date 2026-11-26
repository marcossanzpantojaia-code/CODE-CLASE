---
id: ASSET-001
titulo: Origen de los recursos visuales de una web cinematográfica — fotografía o vídeo libre, render propio, recursos sintéticos — licencias verificadas, máscaras y transparencias, y qué permite cada opción
categoria: frontend
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (licencias de Unsplash, Pexels, Pixabay, Poly Haven, Blender; fichas de modelos en Hugging Face: BiRefNet, RMBG-2.0, FLUX.1-schnell, Wan2.1-T2V-1.3B, Depth-Anything-V2-Small; PyPI de rembg) — leídas el 2026-10-27. No es asesoramiento legal.
versiones: Blender 5.2.3 LTS; rembg 2.0.86
perfil: ambos
ultima_revision: 2026-10-27
---

# ASSET-001 · Recursos visuales: origen, licencias y máscaras

1. **Finalidad.** La calidad de las webs de referencia (CASE-003) depende sobre todo de los **recursos**. Esta ficha fija qué fuentes gratuitas se pueden usar, con qué restricciones y cómo obtener la **transparencia** necesaria para las capas de DEPTH-001.
2. **Fuentes.** Páginas oficiales de licencia y fichas de modelos citadas en la cabecera (enlaces en `VIDEO_RESEARCH_INDEX.json`, VR-186…VR-195).
3. **Ubicación.** Texto de cada licencia y ficha del modelo.
4. **Resultado.** Una tabla de decisión con las restricciones citadas.
5. **Licencias [DOC, citas literales en inglés].**
   | Fuente | Uso comercial | Atribución | Restricciones clave |
   |---|---|---|---|
   | **Unsplash** | sí, "including for commercial purposes" | no obligatoria | no compilar imágenes "to replicate a similar or competing service". La página no trata marcas ni personas |
   | **Pexels** (foto **y vídeo**) | sí | "Attribution is not required" | personas identificables no "in a bad light"; no usar como marca ("trade-mark… business name"); no vender copias sin modificar; no insinuar respaldo |
   | **Pixabay** | sí (con límites) | no | no distribuir el contenido por sí solo; nada de marcas o logotipos en productos; cuidado con personas reconocibles; "your responsibility to check" los derechos de terceros |
   | **Poly Haven** (HDRI, texturas, modelos) | sí, **CC0** ("effectively Public Domain") | no | CC0 cubre solo los recursos; logotipos y renders de ejemplo protegidos; sin *scraping* |
   | **Blender** (programa GPL) | — | — | "What you create with Blender is your sole property": **los renders no quedan bajo la GPL** |
   | **rembg** (recorte de fondos) | MIT (PyPI 2.0.86) | — | el modelo que descarga tiene **su propia** licencia |
   | **BiRefNet** (segmentación) | MIT | — | entrada de 1024 × 1024 en el ejemplo |
   | **RMBG-2.0** (BRIA) | **NO**: CC BY-NC 4.0; el uso comercial requiere un acuerdo con BRIA | — | **excluido** para webs de clientes |
   | **FLUX.1-schnell** (imagen) | sí, Apache-2.0 | — | 12 000 M de parámetros; hay que aceptar condiciones en Hugging Face; requiere GPU en la práctica [EST] |
   | **Wan2.1-T2V-1.3B** (vídeo) | Apache-2.0; "We claim no rights over the your generate contents" | — | **8,19 GB de VRAM**; ~4 min para 5 s a 480p en una RTX 4090 |
   | **Depth-Anything-V2-Small** (profundidad) | Apache-2.0 (Small) | — | la ficha no informa de las variantes grandes → verificar antes de usarlas |
6. **Restricciones del entorno de la sesión [MED, 2026-10-27].**
   - Contenedor sin GPU (`nvidia-smi` no existe), 2 CPU y 7 GB de RAM.
   - **huggingface.co y download.blender.org no son accesibles** desde el contenedor (código HTTP 000 a través del proxy).
   - Generar imágenes o vídeo con IA **en local no es viable** aquí. En servicios externos supondría un coste y no está autorizado.
7. **Máscaras y transparencias [DOC + adaptación].**
   - **Render propio:** alfa nativo con `Film > Transparent` y `Transparent Glass` en Cycles (SEQ-002). Es la mejor calidad de borde, porque no hay que recortar.
   - **Fotografía:** fondo liso (estudio casero) + recorte con un modelo MIT (BiRefNet vía rembg). Los bordes finos (pelo, vapor, espuma) son el punto débil [conocimiento general; verificar].
   - **Vídeo:** el recorte fotograma a fotograma produce parpadeo del borde [conocimiento general]. Es mejor rodar sobre negro o croma y componer con `mix-blend-mode: screen` (vapor y destellos sobre fondo oscuro) [adaptación].
   - **Profundidad desde una foto:** un mapa de profundidad (Depth-Anything-V2-Small, Apache-2.0) permite una parallax 2,5D en WebGL [adaptación; sin probar]. No crea transformaciones de objeto.
8. **Parámetros.** Resolución de origen ≥ 2× la de entrega; espacio de color sRGB; misma luz en todos los recursos de una historia (ART-001).
9. **Código.** —
10. **Problemas habituales.**
    - Mezclar fotos de *stock* con luces distintas: la continuidad se rompe.
    - Usar un modelo NC (RMBG-2.0) en un proyecto comercial.
    - Personas reconocibles de *stock* en contextos que sugieran respaldo (Pexels lo prohíbe).
    - Recursos generados con IA presentados como fotos reales del negocio: **engañoso** (CASE-003 §5).
11. **Rendimiento.** El peso depende de la entrega (SEQ-002), no de la fuente.
12. **Compatibilidad.** —
13. **Aplicaciones.** Toda web cinematográfica o con un héroe premium.
14. **Pruebas.**
    - Revisión de licencias de cada recurso en una tabla (`RECURSOS.md` con origen, URL, licencia y fecha).
    - Bordes del alfa ampliados al 400 % sobre fondo claro y oscuro.
15. **Estado.** Licencias leídas; ningún recurso descargado ni generado.
