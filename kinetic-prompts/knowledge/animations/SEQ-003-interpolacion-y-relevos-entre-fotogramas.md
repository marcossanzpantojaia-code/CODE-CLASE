---
id: SEQ-003
titulo: Interpolación entre fotogramas de una secuencia controlada por scroll y relevos entre capas — escalonado frente a fundido (premultiplicado o no), fantasmas, cuándo añadir fotogramas, desenfoque de movimiento y relevos sin "valle" de visibilidad
categoria: animations
estado: IMPLEMENTADO
evidencia: DEMO_INSPECCIONADA propia (evidence/demos/2026-11-01-lote25/pruebas/interpolacion_secuencia.json y comparacion_interpolacion.png: apertura de una hoja de 0° a 165° con 12 y 36 fotogramas; auditoría de la microdemo B: valles de luminancia) + ARTICULO_AUTOR_ANALIZADO (realtimerendering.com, premultiplicación; DEPTH-001)
versiones: Python/PIL (cálculo de la mezcla), equivalente a drawImage + globalAlpha en canvas 2D (que compone en premultiplicado)
perfil: cinematografico
ultima_revision: 2026-11-02
---

# SEQ-003 · Interpolación entre fotogramas y relevos sin valles

**Estado:** probado con una secuencia sintética (una hoja que gira); **no** con un render real.

1. **Efecto.** Que una secuencia con pocos fotogramas parezca fluida al hacer scroll despacio, y que los relevos entre capas (imagen → partículas → imagen; escena → escena) no "apaguen" la pantalla.
2. **Cómo funciona — tres modos de mostrar un fotograma fraccionario f = p·(N−1).**
   | Modo | Qué dibuja | Resultado medido (N = 12, 121 pasos de scroll) |
   |---|---|---|
   | **Escalonado** | `frames[floor(f)]` | **109 de 120 pasos sin cambio** y saltos de golpe (salto medio máx. 18,1); con N = 36, 85 pasos sin cambio y salto máx. 9,8 |
   | **Fundido sin premultiplicar** (mezcla de RGBA "recto") | `A·(1−t) + B·t` con los transparentes en negro | sin escalones (salto máx. 1,66) **pero aparece una hoja fantasma OSCURA** (el negro de los píxeles transparentes entra en la mezcla): ver la fila 2 de `comparacion_interpolacion.png` |
   | **Fundido premultiplicado** (como compone el canvas con `globalAlpha`) | `drawImage(A); globalAlpha = t; drawImage(B)` | color correcto, pero se ven **dos hojas translúcidas** (fantasma, hasta un 7,1 % de píxeles con alfa intermedia con N = 12 y un 3,8 % con N = 36) |
3. **Cuándo conviene.**
   - El fundido entre fotogramas **solo mejora** cuando el desplazamiento entre fotogramas consecutivos es **pequeño** (≲ 2–3 px en pantalla o ≲ 2° de giro) [criterio propio a partir de la prueba: con 15° por fotograma el fantasma es evidente].
   - Si el objeto se mueve más → **más fotogramas** (o vídeo all-intra), no fundido.
   - El escalonado es aceptable si 1 fotograma ≤ ~8–10 px de scroll (los saltos no se perciben).
4. **Recursos.** La secuencia (SEQ-001/002). Para un desenfoque de movimiento real, el **render con motion blur** en Blender: es coherente con la velocidad del objeto; un `filter: blur()` uniforme no lo es.
5. **Tecnologías.** Canvas 2D (`drawImage` con `globalAlpha` compone en premultiplicado → no oscurece) o WebGL (premultiplicar las texturas; realtimerendering.com).
6. **Estructura.**
   ```js
   function dibujar(p) {                                  // modo "fundido" solo si el desplazamiento por fotograma es pequeño
     const f = p * (N - 1), i = Math.floor(f), t = f - i;
     ctx.clearRect(0, 0, w, h); ctx.globalAlpha = 1; ctx.drawImage(frames[i], 0, 0, w, h);
     if (FUNDIDO && t > 0.02 && i + 1 < N) { ctx.globalAlpha = t; ctx.drawImage(frames[i + 1], 0, 0, w, h); ctx.globalAlpha = 1; }
   }
   ```
   **Relevo sin valle** (entre capas distintas, H3 de AUD-001): la capa entrante aparece **al 100 % por debajo** y la saliente se desvanece **por encima**. Así la suma visible nunca baja. Nunca dos fundidos opuestos sobre un fondo oscuro:
   ```js
   // MAL (valle): A.alpha = 1 → 0 en [0,15–0,22] y las partículas 0 → 1 en [0,14–0,20]: hay pasos con ambas al ~50 % sobre negro
   // BIEN: partículas visibles al 100 % desde 0,14 (debajo) y A desvaneciéndose ENCIMA en [0,15–0,22]
   ```
7. **Parámetros.** N; px de scroll por fotograma; modo (escalonado o fundido); umbral de desplazamiento; solape de los relevos (≥ 5 % del recorrido).
8. **Problemas visuales.**
   - Fantasma doble (fundido con desplazamientos grandes).
   - Oscurecimiento por mezclar alfa sin premultiplicar.
   - Valles de luminancia en los relevos.
   - Desenfoque falso (CSS) que no sigue la dirección del movimiento.
   - Escalones visibles con N bajo y scroll lento.
9. **Móvil.** Menos fotogramas por peso → más importante elegir bien entre escalonado y fundido; el px de scroll por fotograma cambia con la altura del pin.
10. **Reduced motion.** Fotograma clave estático; sin fundidos.
11. **Coste.** Fundido = 2 `drawImage` por fotograma (el doble de relleno) y las dos imágenes decodificadas.
12. **Pruebas.**
    - Mosaico de 6 pasos alrededor de un fotograma intermedio (como `comparacion_interpolacion.png`).
    - Saltos y pasos sin cambio (`interpolacion_secuencia.json`).
    - En relevos: luminancia y cobertura del lienzo por paso (AUD-001).
13. **Evidencia.** Prueba sintética del lote 25; la luminancia de B (lote 24) muestra el valle (25 de 255 en p = 0,20).
14. **Cómo pedirlo.** "Muestra la secuencia con SEQ-003: justifica el modo (escalonado o fundido) con el desplazamiento por fotograma medido y haz los relevos sin valle; entrega el mosaico y la luminancia por paso".

**Movimiento de producto relacionado (velocidad, anticipación, desenfoque):** ver MOT-002.

**Corrección (lote 26, medida con GSAP 3.15.0 en REC-002):** el "relevo sin valle" exige además que la capa de debajo **cubra la misma área** que la de arriba.
- Con partículas al 100 % debajo de A pero dispersas (2 318 de 2 px), la luminancia seguía cayendo a 25 a p = 0,20: debajo de A casi no había nada.
- Con partículas del tamaño del paso de muestreo (teselando A y B), la luminancia mínima subió a **111**, frente a los extremos 128/184.
- Regla: **antes de desvanecer la capa superior, la de debajo debe ocupar al menos su silueta.**
