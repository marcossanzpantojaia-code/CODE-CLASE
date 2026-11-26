---
id: TXT3D-001
titulo: Titular 3D con una escena animada dentro de las letras (Text + RenderTexture)
categoria: threejs
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (TUT-006) + DEMO_INSPECCIONADA (lote 5)
versiones: fuente — three 0.153.0, @react-three/fiber 8.13.3, @react-three/drei 9.75.0, @react-three/postprocessing ^2.15.11
perfil: cinematografico
ultima_revision: 2026-10-26
---

# TXT3D-001 · Texto 3D con RenderTexture

1. **Nombre y finalidad.** Titular tipográfico en la escena 3D cuyas letras actúan como "ventana" a otra escena animada (tema 11).
2. **Fuente.** Wawa Sensei, `wass08/r3f-3d-text-effect`, `src/components/Experience.jsx` (TUT-006).
3. **Ubicación.** Bloque `<Text>` con material básico cuyo `map` es un `<RenderTexture>`.
4. **Resultado.** Letras gruesas (Poppins Black) que muestran el modelo flotando sobre fondo blanco, con bloom alrededor; suelo reflectante; niebla.
5. **Explicación técnica (observada).** `Text` de drei (troika, texto SDF desde un TTF) recibe como hijo un `meshBasicMaterial` con `toneMapped={false}` y un color multiplicado por 1,5 (superior a 1 para que el bloom lo capte). El `map` del material es un `RenderTexture`: drei renderiza una escena secundaria (fondo, entorno, modelo con `Float`) a un render target en cada frame y lo usa como textura de las letras.
6. **Dependencias.** drei (`Text`, `RenderTexture`, `Float`, `Environment`, `MeshReflectorMaterial`), postprocessing (Bloom).
7. **Procedimiento (adaptación).** Precargar la fuente (`useFont.preload` en la fuente original); limitar la resolución del `RenderTexture`; si se anima la opacidad, declarar `transparent`; duplicar el titular en un `h1` real del DOM (visible o visualmente oculto).
8. **Parámetros.** Tamaño/interlineado del texto, resolución del render target, intensidad del bloom (1,2), multiplicador de color (1,5), niebla (10–30).
9. **Código.** Sin fragmento (fuente sin licencia). Ver nombres de API en §5.
10. **Problemas habituales.** Opacidad sin `transparent`; coste de una escena extra por frame; texto WebGL no indexable ni legible por lectores de pantalla; licencia del modelo (CC-BY → atribución obligatoria).
11. **Rendimiento / a11y.** Presupuesto GPU alto (render target + reflector 2048 + bloom): ofrecer versión estática en móvil o con reduced motion.
12. **Compatibilidad.** WebGL 2; probar Safari iOS.
13. **Aplicaciones.** Hero de lanzamiento de producto, campaña de marca.
14. **Pruebas.** FPS en portátil integrado y móvil medio; lector de pantalla; carga de la fuente (FOUT en WebGL).
15. **Estado de evidencia.** Código leído; demo del autor inspeccionada en el lote 5 (ver abajo).


## Inspección visual REAL (lote 5, 2026-10-26) — `DEMO_INSPECCIONADA`
Navegador integrado de Cowork; viewport 747×894, DPR 1,5, 60 fps. Evidencia: [evidence/visual/2026-10-26](../evidence/visual/2026-10-26/README.md). **No es el vídeo del tutorial.**

- **Demo:** https://r3f-3d-text-effect.vercel.app/ (build del autor). Primer frame negro durante ~1–2 s mientras cargan fuente y modelos; después aparece el estado "home".
- **Estado inicial (home)** — `TXT3D-001_home.jpg`: titular "MY LITTLE / CAMPING" con la escena del camping visible **dentro de las letras**, halo de bloom blanco, reflejo del texto en el suelo, el camping a la derecha, botón naranja "ENTER".
- **Transición** — `TXT3D-001_enter_transicion.jpg` (~0,3–0,5 s tras el clic): el botón desaparece de inmediato y la cámara se desplaza lateralmente hacia el camping; el titular sigue con brillo completo mientras sale de cuadro (no se pudo confirmar si llega a fundirse: sale del encuadre antes).
- **Estado final (store)** — `TXT3D-001_store_final.jpg`, `TXT3D-001_store_tarjetas_html.png`: encuadre del camping con 4 tarjetas HTML sobre los objetos (Backpack, Lantern, Tent…, "Add to cart" 39,99–129,99 $).
- **Verificado en la página:** el botón ENTER queda con opacidad 0 pero **`tabIndex` 0** → sigue enfocable con teclado (antes era análisis estático); las tarjetas usan texto de 16 px pero a este tamaño de viewport se ven diminutas (legibilidad baja en pantallas estrechas); canvas a DPR 1,5 (1121×1341).


### Trazabilidad v0.6.1 (corrección tras auditoría)
Etiquetas: **[OBS]** visto en captura · **[MED]** medido en el DOM con datos guardados · **[CALC]** calculado a partir del código o de los datos · **[EST]** estimación (latencia de herramienta, ojo humano) · **[COD]** leído en el código.
- [OBS] estados home / transición / store (capturas). [MED] DOM: canvas 1121×1341 a 747×894 CSS; ENTER con opacidad de sección 0 y `tabIndex` 0 ([TXT3D-001_dom.json](../evidence/visual/2026-10-26/data/TXT3D-001_dom.json)).
- **[EST]** "primer frame negro ~1–2 s" y "transición ~0,3–0,5 s tras el clic" se deducen de la latencia entre capturas; **no se midieron**.
- **Sigue sin verificar** (campo 10): si el fundido de opacidad del texto funciona sin `transparent` — el texto sale de cuadro antes de poder comprobarlo.
