---
id: UX-003
titulo: Interfaz guiada por estados — un solo estado finito en la raíz y CSS que reacciona (App Menu With Lock Screen)
categoria: ux
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (CodePen de Hyperplexed, MIT, compilado desde TypeScript/React) (TUT-022)
versiones: React (UMD en CodePen), TypeScript compilado, SCSS compilado
perfil: ambos
ultima_revision: 2026-10-26
---

# UX-003 · Estados de interfaz explícitos

1. **Finalidad.** Organizar una interfaz con varias fases (bloqueada → introduciendo PIN → verificando → error → dentro) de modo que cada fase tenga su aspecto y sus transiciones sin lógica de animación repartida por los componentes (temas 10 y 15; aplicable a reservas, formularios en pasos, checkout).
2. **Fuente.** https://codepen.io/Hyperplexed/pen/vYpXNJd (MIT; JS 23 KB y CSS 20 KB leídos parcialmente el 2026-10-26).
3. **Ubicación.** Enum `UserStatus` y contexto `AppContext` en el JS; reglas `#app.logged-out`, `#app.logging-in`, etc. en el CSS.
4. **Resultado (según código).** Pantalla de bloqueo con hora y tiempo; al pulsar, el fondo se desenfoca y aparece un teclado de PIN; spinner mientras "verifica"; dígitos en rojo si falla; menú de la app al acertar.
5. **Explicación técnica [COD].**
   - **Estado finito único:** `enum UserStatus { LoggedOut, LoggingIn, VerifyingLogIn, LogInError, LoggedIn }` en un contexto de React; la raíz recibe la clase correspondiente.
   - **CSS reactivo:** cada clase define opacidad, `transform` y `pointer-events` de las piezas (`#app-info`, `#sign-in-button-wrapper`, `#app-pin-wrapper`, `#app-loading-icon`, `#app-menu`) con transiciones de 250 ms. Ej.: en `logging-in` / `verifying` / `error`, la foto de fondo pasa a `filter: blur(8px)` y `scale(1.2)`.
   - **Varios estados comparten estilo** con selectores agrupados (`#app.logging-in …, #app.log-in-error …`).
   - **Captura del PIN:** un `<input>` oculto recibe el foco y el teclado; los "dígitos" son `div` que muestran el valor y lo ocultan a los 500 ms.
   - **Verificación simulada** con una promesa de 300–700 ms aleatorios (demo).
   - **Botón con "llamada de atención":** animación `bounce` de 3 s con 3 s de retraso, solo `:not(:hover)`.
6. **Dependencias.** React, classnames.
7. **Procedimiento profesional (adaptación).**
   1. Modelar los estados de cada flujo (p. ej. reserva: `idle → choosing → submitting → error | success`) como unión discriminada en TypeScript (TS-001) o con una librería de máquinas de estado si hay muchas transiciones.
   2. Publicar el estado como `data-state` en la raíz del componente y estilar con `[data-state="submitting"]` → el diseño de cada fase vive en CSS.
   3. Anunciar los cambios (`aria-live`, `aria-busy` durante "verificando", mensaje de error asociado con `aria-describedby`).
   4. Nunca validar credenciales en el cliente: el PIN "1234" en el código es solo de demo.
   5. Para PIN/códigos: `inputmode="numeric"`, `autocomplete="one-time-code"`, no `type="number"` (permite `e`, flechas y quita ceros iniciales).
8. **Parámetros.** Transiciones 250 ms; blur 8 px + escala 1,2; ocultar dígito a 500 ms; latencia simulada 300–700 ms.
9. **Código (adaptación propia; no ejecutada):**
   ```tsx
   type BookingState = { s: "idle" } | { s: "submitting" } | { s: "error"; msg: string } | { s: "success"; id: string };
   <form data-state={state.s} aria-busy={state.s === "submitting"}>…</form>
   ```
10. **Problemas detectados [COD].** `type: "number"` para el PIN; "Cancel" es un `span` con `onClick`; desplazamiento por arrastre solo con ratón; prop `className` duplicada en un `createElement`; intervalo de 100 ms para el reloj (bastaría alinearse al cambio de minuto).
11. **Rendimiento / a11y.** `filter: blur` sobre una foto a pantalla completa es caro al animar; usar una versión ya desenfocada que aparece con opacidad si va lento.
12. **Compatibilidad.** Universal.
13. **Aplicaciones.** Formularios de cita/reserva, presupuestos en pasos, acceso a área de clientes (con autenticación real en servidor — SEC-002).
14. **Pruebas.** Recorrer todos los estados con teclado y lector; doble envío durante "submitting"; error → reintento; red lenta.
15. **Estado de evidencia.** Código leído parcialmente (los primeros ~7 000 caracteres de JS y CSS); no ejecutado.
