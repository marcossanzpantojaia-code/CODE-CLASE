---
id: COMP-001
titulo: Composición e iluminación de producto para experiencias web — iluminar lo que el objeto refleja (metal, vidrio, líquidos), gradientes que dan volumen, rellenos negros para definir bordes, luz clave, de relleno y de contorno, sombras de contacto, perspectiva y luz coherentes entre recursos, integración con el color del fondo y bordes limpios
categoria: ux
estado: INVESTIGADO
evidencia: ARTICULO_AUTOR_ANALIZADO (Fstoppers, A. Cooke, 12-10-2026, sobre un vídeo de Karl Taylor iluminando palos de golf cromados; PetaPixel, Joe Lenton, gradientes de luz para producto; V-Flat World, 03-04-2024, gradientes en objetos reflectantes) + DEMO_INSPECCIONADA propia (halo de alfa: DEPTH-001; sombras y capas: REC-003) + CODIGO_INSPECCIONADO (Blender: luces de área, shadow catcher; BLEND-001/002)
versiones: —
perfil: cinematografico (y héroe premium)
ultima_revision: 2026-11-02
---

# COMP-001 · Composición e iluminación de producto para web

**Estado:** INVESTIGADO. Principios de fotógrafos de producto aplicados al render (BLEND-002) y a la composición web. **Ninguna** imagen real producida todavía.

1. **Efecto.** Que el producto parezca **fotografiado en estudio e integrado** en la página (no recortado y pegado): volumen, material reconocible, sombra que lo apoya y luz del mismo "mundo" que el fondo y la tipografía.
2. **Cómo funciona — principios de los expertos.**
   - **Los objetos brillantes reflejan su entorno, no "la luz":** "A reflective object shows you an image of whatever it faces" (Karl Taylor, vía Fstoppers). Se ilumina el metal **diseñando lo que refleja**: superficies grandes de luz (difusores o scrims) y negras.
   - **Gradientes = volumen:** "A reflection that fades from bright to dark reads as a rounded surface"; un reflejo uniforme "reads as a flat stripe" (Fstoppers). En PetaPixel (Lenton), el gradiente lineal se crea inclinando la luz respecto al difusor; alejarla del panel suaviza el corte; acercarla y orientarla al panel da un borde duro y más área iluminada. Hace falta un difusor de calidad para evitar dominantes y texturas.
   - **Superficies grandes y cercanas** (scrim muy cerca del objeto) para que el reflejo llene lo que ve el metal curvo (Fstoppers).
   - **Negros para definir:** fondos o paneles negros dan contraste y bordes al cromo (Fstoppers menciona foam negro detrás y un panel de relleno donde el borde reflejaba el estudio).
   - **Control de los brillos:** subir la luz en pasos pequeños; "a half-stop increase is already enough to blow out a highlight" (Fstoppers).
3. **Traducción a Blender (BLEND-002) [adaptación propia].**
   | Principio | En la escena |
   |---|---|
   | Reflejar superficies grandes | luces de **área grandes y cercanas** con forma de tira (difusor), no puntuales; HDRI de estudio para el entorno reflejado |
   | Gradiente | luz de área **girada respecto a la superficie** o un plano emisor con textura de degradado (rampa) detrás del objeto, visible solo en los reflejos (`visible_camera = False`) |
   | Definir bordes | planos negros (`Tarjeta negra`) a los lados que **refleja** la hoja |
   | Contorno (rim) | contraluz cálido que separa el canto del fondo |
   | Relleno | luz grande y suave a baja potencia o un plano blanco de rebote |
   | Brillos | revisar el % de píxeles quemados (EVAL-001, Hito A < 1 %) y bajar en pasos pequeños |
   | Vidrio y líquido | `Transmission`, IOR correcto, **fondo con contraste detrás** (el vidrio se ve por los bordes y las cáusticas), `film_transparent_glass` si va sobre HTML |
4. **Integración en la web.**
   - **Sombra de contacto en su propia capa** bajo el producto (`is_shadow_catcher` en el render o PNG de la sombra con `mix-blend-mode: multiply`). Sin sombra, el objeto "flota pegado".
   - **Color del fondo en el objeto:** el reflejo o rebote del color del fondo (crema, caramelo) en los bordes del producto lo integra. En el render: un plano grande del color del fondo de la web, visible solo en los reflejos.
   - **Perspectiva coherente:** la misma altura de cámara y focal en **todos** los recursos de una escena (producto, ingredientes, plato). Si un recurso está fotografiado desde arriba y otro de frente, la composición se rompe aunque cada uno sea bueno.
   - **Luz coherente:** la misma dirección de la luz clave en todos los recursos de un acto (ART-001); la sombra apunta al lado contrario.
   - **Bordes limpios:** alfa bien premultiplicado (DEPTH-001: halo medido); máscaras pintadas con borde suave en el pelo, el vapor y la espuma; borde al 400 % sobre fondo claro y oscuro.
   - **Oclusión convincente:** las capas delantera y trasera deben venir **del mismo render o foto** (*holdout*, BLEND-001 §8). Una máscara dibujada a mano sobre una foto exige seguir el contorno real del objeto.
5. **Cuándo aporta una mejora visible y cuándo no.**
   | Técnica | Mejora visible | Complica sin beneficio |
   |---|---|---|
   | Gradientes en el metal | **siempre** en metal o vidrio (es lo que separa "producto" de "clip-art") | en objetos mate (tela, madera): basta una luz suave |
   | Rim light | fondo oscuro con objeto oscuro | fondo claro con objeto oscuro (el contorno ya existe) |
   | Sombra de contacto | **siempre** que el objeto "apoya" | objetos que flotan a propósito (partículas, ingredientes en el aire) |
   | Reflejo del color del fondo | fondos saturados (caramelo, granate) | fondos neutros |
   | Render en 2 pases (delantero y trasero) | cuando el titular atraviesa el objeto | si el objeto solo va delante o detrás |
6. **Recursos.** Escena de render (BLEND-002) o rodaje propio con difusor, paneles negros y blancos (ASSET-001). HDRI de estudio CC0 (Poly Haven).
7. **Parámetros.** Tamaño y distancia de las luces de área; ángulo respecto a la superficie; potencia en pasos de ½ stop; color de los rebotes; altura y focal de la cámara compartidas.
8. **Problemas visuales.**
   - Metal plano (sin gradiente).
   - Brillos quemados.
   - Reflejos de un estudio vacío (sin forma).
   - Objeto sin sombra.
   - Perspectivas mezcladas.
   - Halo oscuro.
   - Vidrio invisible sobre un fondo liso.
   - Color del fondo ajeno al objeto.
9. **Móvil.** Los mismos recursos en menor resolución; la sombra no debe recortarse al reencuadrar.
10. **Reduced motion.** Sin efecto sobre la composición.
11. **Coste.** Ninguno en la web (todo se decide en el recurso); en el render, más muestras para los gradientes suaves (ruido).
12. **Pruebas.** Revisión C1/C3 lado a lado con referencias R1; % de píxeles quemados; borde al 400 %; altura de cámara declarada por recurso (tabla en `RECURSOS.md`).
13. **Evidencia.** Artículos de expertos (texto, no los vídeos); pruebas propias del halo y de las capas. **No hay render ni fotografía propia que lo demuestre.**
14. **Cómo pedirlo.** "Prepara el recurso con COMP-001: gradiente en el metal, paneles negros, contraluz, sombra de contacto en su propia capa, reflejo del color del fondo, y la misma cámara y luz que el resto de recursos del acto; entrega el % de quemados y el borde al 400 %".

15. **Recursos de calidad publicitaria para sustituir los procedurales del lote 26** [síntesis propia a partir de esta ficha, SEQ-002, BLEND-001/002 y ASSET-001; no es investigación nueva].

    En el lote 26 solo se aplicaron, con dibujo procedural, la sombra de contacto, el volumen por gradientes y la luz coherente. **No demuestran calidad fotográfica.**

    | Receta | Recurso | Especificación mínima | Origen posible (0 €) |
    |---|---|---|---|
    | A (jarra → taza) | Jarra y taza con alfa en el estado inicial y en el de vertido | Mismo render o rodaje; luz clave única; vidrio con gradientes y paneles negros (§2); ≥ 2× el tamaño en pantalla; WebP/AVIF con alfa | Render propio (BLEND-002, pendiente de R1/R1b) o fotos propias con difusor |
    | A | Chorro de café | **Secuencia** de 24–48 fotogramas con alfa o vídeo con alfa (SEQ-002), sincronizada con el giro; no un trazo SVG | Simulación de fluidos en Blender (coste de render alto) o rodaje sobre fondo neutro y máscara |
    | B (gota → plato) | Imágenes A y B **compatibles** | Misma cámara, escala y luz (COMP-001 §4) para que el puente de partículas sea creíble; idealmente una secuencia real que haga innecesarias las partículas (TRN-001) | Render propio |
    | C (producto fijo) | Plato en **dos pases** (trasero y delantero) o *holdout* | Del MISMO render; sombra de contacto como pase aparte (*shadow catcher*); reflejo del color del fondo en el ala | Render propio |
    | C | Ingredientes reales | Fotos o renders con alfa, misma luz clave y altura de cámara; **sombras horneadas** en el PNG (en el lote 26, los filtros CSS costaron 30 fotogramas > 33 ms a 1 440 px) | Fotos propias o modelos CC0 (Poly Haven), según la licencia de ASSET-001 |

    Ningún recurso se ha descargado ni producido. Requiere autorización (Blender: R1/R1b) o material del usuario.

16. **Lote 27:** el contrato concreto para generar estos recursos con IA, con la biblia visual y los prompts, está en `integration/contratos/CONTRATO_RECURSOS_REC003.md`. La inspección automática de luz, elevación y halo está en AIIMG-001.
