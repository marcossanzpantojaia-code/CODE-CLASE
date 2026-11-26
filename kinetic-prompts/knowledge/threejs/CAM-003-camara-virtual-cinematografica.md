---
id: CAM-003
titulo: Cámara virtual cinematográfica en la web — vocabulario de planos y movimientos (dolly, truck, orbit, pan, tilt, foco), diferencia entre cámara 3D real, movimiento 2,5D y zoom sobre una foto, y cómo ligar cada uno al scroll
categoria: threejs
estado: INVESTIGADO
evidencia: síntesis de CAM-001, CAM-002 (incluida la trayectoria de cámara de Blender de Codrops, lote 22), GL-003 (profundidad), DEPTH-001 (capas) + microdemos del lote 24 ("dolly" de escala 1 → 1,06 sobre el producto fijo de la C; parallax de 3 planos) + vocabulario de cine [conocimiento general]
versiones: three r186; GSAP 3.15
perfil: cinematografico
ultima_revision: 2026-11-01
---

# CAM-003 · Cámara virtual

**Estado:**
- **DOCUMENTADO:** la cámara 3D (CAM-001/002).
- **PROBADO:** la mecánica 2,5D por capas (microdemo C: dolly por escala + 3 planos de velocidad).
- **VISUALMENTE VALIDADO:** no.

1. **Efecto.** La sensación de una **cámara de anuncio de producto** que se acerca, rodea o desliza alrededor del objeto mientras se hace scroll.
2. **Cómo funciona — tres niveles (no confundirlos).**
   | Nivel | Qué es | Qué puede hacer | Qué NO puede |
   |---|---|---|---|
   | **Zoom sobre una foto** | `scale` de una imagen plana | Acercarse (como un Ken Burns) | Paralaje: todo crece igual y se nota plano |
   | **2,5D** | Varias capas recortadas (o foto + mapa de profundidad) que se mueven a **velocidades distintas** según su profundidad | Dolly, *truck* y pan **pequeños** con paralaje creíble | Órbita (no hay caras ocultas), giros > ~5° (GL-003) |
   | **Cámara 3D real** | `PerspectiveCamera` de Three.js en una escena con el modelo (o un render de Blender con la cámara animada → secuencia) | Todo: órbita, *crane*, trayectorias | En tiempo real, el realismo del material queda por debajo del render offline (PROD-001) |
3. **Vocabulario → implementación.**
   | Movimiento | Definición | 2,5D (capas) | 3D (Three.js) |
   |---|---|---|---|
   | Dolly in/out | la cámara avanza o retrocede | escala por capa: cerca ×1,10, objeto ×1,06, fondo ×1,02 | `camera.position` a lo largo del eje de visión |
   | Truck | desplazamiento lateral | x por capa × factor de profundidad (cerca > lejos) | `camera.position.x` + `lookAt` fijo o desplazado |
   | Pedestal / crane | subir o bajar | y por capa con factor | `position.y` |
   | Pan / tilt | girar la cámara sin moverla | desplazar **todas** las capas por igual (sin paralaje) | rotación de la cámara |
   | Orbit | girar alrededor del objeto | **no** (salvo una secuencia prerenderizada) | posición en una esfera alrededor del objetivo + `lookAt` |
   | Foco / DOF | desenfoque por distancia | `filter: blur()` en las capas lejanas o cercanas (barato si son pequeñas) | *postprocessing* bokeh (POST-001) o DOF del render |
   | Trayectoria | recorrido sobre una curva | claves por estado (MOT-001) | `CatmullRomCurve3.getPoint(p)` (curva exportada de Blender, CAM-002) |
4. **Cuándo.** Regla de la Skill: **evaluar el 2,5D antes de añadir Three.js**. Si el movimiento necesario es dolly, *truck* o tilt leves, sobra con capas y es más ligero y nítido. Si hace falta órbita → secuencia prerenderizada (calidad) o 3D en tiempo real (interactividad).
5. **Recursos.** 2,5D: capas recortadas con alfa (DEPTH-001) o una foto + mapa de profundidad. 3D: modelo GLB optimizado (GLTF-001) + HDRI. Render: escena de Blender (BLEND-002) con la cámara animada.
6. **Estructura (2,5D).**
   ```js
   // Cada capa declara su profundidad z ∈ [0 lejos, 1 cerca]; la "cámara" es un objeto {dolly, truck, ped}
   capas.forEach(c => {
     const f = 0.4 + c.z * 1.2;                                   // factor de paralaje
     c.el.style.transform = `translate(${-cam.truck * f}vw, ${-cam.ped * f}vh) scale(${1 + cam.dolly * f})`;
   });
   // cam.* = funciones de p (MOT-001); en GSAP: tl.to(cam, { dolly: .06, truck: 4, onUpdate: aplicar }, "label")
   ```
7. **Parámetros.** Factor de paralaje por capa; amplitud máxima del dolly (≤ 8 % para que no se pixelen los recursos); velocidad (que no supere la del scroll en el plano principal).
8. **Problemas visuales.**
   - Zoom que pixela (recurso de poca resolución).
   - Paralaje excesivo (las capas se separan y se ven los recortes).
   - Pan con paralaje (no es un pan).
   - Órbita fingida con 2,5D (se ve el truco).
   - Cámara que se mueve en todos los tramos: sin mesetas no hay "plano".
9. **Móvil.** Amplitudes ×0,6; desenfoque solo en capas pequeñas; en 3D, DPR ≤ 2 y una escena simplificada.
10. **Reduced motion.** Cámara fija en el encuadre del estado clave; sin paralaje.
11. **Coste.** 2,5D: transform y compositor, muy bajo (microdemo C: script p95 0,4 ms con 9 elementos secundarios + dolly). 3D: GPU, según la escena (PERF-001, TJ-*).
12. **Pruebas.** Capturas en los estados; medir la velocidad relativa de las capas (curvas de `tx` por capa con `curvas_scroll.mjs`); vídeo. Comprobar que no se ven bordes de recorte en el máximo del paralaje.
13. **Evidencia.** Microdemo C (dolly 1 → 1,06 y planos de velocidad 0,6/1/1,6), mecánica probada. Cámara 3D: documentada (CAM-001/002).
14. **Cómo pedirlo.** "Describe el movimiento de cámara con el vocabulario de CAM-003 (p. ej., 'dolly in del 5 % + truck izquierda en el acto II'), indica si es 2,5D o 3D y por qué, y entrega el factor de paralaje por capa".
