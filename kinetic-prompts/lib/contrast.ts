/** Contraste WCAG 2.x entre colores #rrggbb (o #rgb). */

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace(/^#/, "");
  const full = clean.length === 3 ? [...clean].map((c) => c + c).join("") : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Color no válido: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channel) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Mínimo para texto normal (WCAG 2.2 AA, criterio 1.4.3). */
export const MIN_TEXT_CONTRAST = 4.5;

/** Parejas de tokens de texto y fondo que la interfaz usa de verdad. */
export const CONTRAST_PAIRS: ReadonlyArray<{ fg: string; bg: string; uso: string }> = [
  { fg: "--text", bg: "--bg", uso: "Texto principal sobre la página" },
  { fg: "--text", bg: "--surface", uso: "Texto principal en tarjetas" },
  { fg: "--text", bg: "--surface-2", uso: "Prompt, inputs y menús" },
  { fg: "--text-muted", bg: "--bg", uso: "Metadatos sobre la página" },
  { fg: "--text-muted", bg: "--surface", uso: "Metadatos en tarjetas (criterio de la fase 1)" },
  { fg: "--text-muted", bg: "--surface-2", uso: "Placeholder y ayudas en campos" },
  { fg: "--bg", bg: "--accent", uso: "Texto del botón primario (--on-accent)" },
  { fg: "--accent", bg: "--bg", uso: "Enlace activo sobre la página" },
  { fg: "--accent", bg: "--surface", uso: "Enlace activo en tarjetas" },
  { fg: "--success", bg: "--surface-2", uso: "«Copiado ✓» y estado VALIDADO" },
  { fg: "--warning", bg: "--surface", uso: "Aviso de límite de copias" },
  { fg: "--danger", bg: "--surface-2", uso: "Errores en campos" },
];
