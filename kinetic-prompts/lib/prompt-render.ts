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

/** Tipos de proyecto para los que un prompt puede dar instrucciones de integración. */
export const STACKS = [
  { id: "auto", label: "Que lo detecte mi IA" },
  { id: "nextjs", label: "Next.js" },
  { id: "astro", label: "Astro" },
  { id: "html", label: "HTML" },
] as const;
export type StackId = (typeof STACKS)[number]["id"];

const STACK_BLOCK = /<!--\s*solo:\s*([a-z,\s]+?)\s*-->\n?([\s\S]*?)<!--\s*fin\s*-->\n?/g;

/**
 * Deja solo las instrucciones del tipo de proyecto elegido. En prompt.md, cada bloque propio de
 * un stack va entre `<!-- solo: nextjs -->` (o `astro, html`) y `<!-- fin -->`. Con «auto» se
 * quedan todos los bloques y la IA elige según el proyecto.
 */
export function selectStack(template: string, stack: StackId): string {
  return template.replace(STACK_BLOCK, (_, list: string, body: string) => {
    const ids = list.split(",").map((s) => s.trim());
    return stack === "auto" || ids.includes(stack) ? body : "";
  });
}
