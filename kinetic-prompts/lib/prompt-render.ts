/**
 * Sustituye las {{variables}} de un prompt por los valores de sus parámetros.
 * Lo que se copia es exactamente lo que devuelve esta función (criterio de la fase 3).
 */

export type ParamValue = string | number | string[];

const VARIABLE = /\{\{\s*([a-zA-Z][\w-]*)\s*\}\}/g;

const decimal = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 });

/** Variables que usa un prompt, sin repetir y en orden de aparición. */
export function promptVariables(template: string): string[] {
  return [...new Set([...template.matchAll(VARIABLE)].map((m) => m[1]!))];
}

/** Da formato a un valor para leerlo dentro de un texto en español: 0.9 → «0,9». */
export function formatValue(value: ParamValue): string {
  if (typeof value === "number") return decimal.format(value);
  if (Array.isArray(value)) return value.join(", ");
  return value;
}

/** Rellena el prompt. Una variable sin valor se queda tal cual para que el test la detecte. */
export function renderPrompt(template: string, values: Record<string, ParamValue>): string {
  return template.replace(VARIABLE, (match, id: string) => (id in values ? formatValue(values[id]!) : match));
}
