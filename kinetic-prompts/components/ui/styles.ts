/**
 * Clases compartidas por los componentes de components/ui.
 * Todas salen de los tokens de styles/tokens.css a través de app/globals.css.
 */

/** Anillo de foco visible: 2 px en --accent, separado 2 px. */
export const focusRing =
  "outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-solid kp-focus:outline-accent kp-focus:outline-offset-2";

/** Transición de estados de la interfaz (150 ms, easing único; 100 ms con movimiento reducido). */
export const stateTransition =
  "transition-[color,background-color,border-color,opacity,transform] duration-(--dur-hover) ease-kp";

/** Deshabilitado: atenuado al 50 % y sin cursor de acción. */
export const disabledState = "disabled:cursor-not-allowed disabled:opacity-50";

/** Cargando: color completo (no se confunde con deshabilitado), indicador y cursor de espera. */
export const loadingState = "data-loading:cursor-wait";

/** Pulsado: leve escala (1 con movimiento reducido). */
export const pressState = "kp-active:scale-(--press-scale)";

/** Campo de formulario (Input, SearchField, Select, ColorPicker). */
export const fieldBase =
  "h-10 w-full rounded-control border border-border bg-surface-2 px-3 text-14 text-text placeholder:text-text-muted kp-hover:border-border-strong aria-invalid:border-danger";

/** Etiqueta visible de un campo. */
export const fieldLabel = "text-14 font-medium text-text";

/** Texto de ayuda y de error bajo un campo. */
export const fieldHint = "text-12 text-text-muted";
export const fieldError = "text-12 text-danger";
