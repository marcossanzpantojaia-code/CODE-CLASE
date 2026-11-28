/**
 * Compone el prompt de una web entera a partir de las piezas elegidas en el constructor (/crear).
 * Sin fs: se usa en el cliente. Cada prompt.md se incrusta sin su título ni su línea de introducción,
 * con sus «##» bajados a «###» (docs/PLAN.md, «Constructor de webs por partes»).
 */
import { contrastRatio, MIN_TEXT_CONTRAST } from "./contrast";
import { type ParamValue, renderPrompt, selectStack, type StackId } from "./prompt-render";

export type BuilderPiece = {
  slug: string;
  title: string;
  categoryLabel: string;
  promptTemplate: string;
  values: Record<string, ParamValue>;
};

export type Brief = { name?: string; sector?: string };

/** Orden de montaje: lo que no depende de la navegación primero, la transición de página al final. */
export const BUILD_ORDER = [
  "fondos",
  "texto",
  "heros",
  "scroll",
  "objetos",
  "microinteracciones",
  "3d-webgl",
  "transiciones",
];

const STACK_NAMES: Record<StackId, string> = {
  auto: "el que tenga el proyecto (míralo antes de empezar)",
  nextjs: "Next.js (App Router)",
  astro: "Astro",
  html: "HTML de varias páginas",
};

/** El cuerpo de un prompt.md listo para incrustar: sin título, sin la línea de introducción y un nivel más abajo. */
export function embedPiece(piece: BuilderPiece, stack: StackId): string {
  const text = renderPrompt(selectStack(piece.promptTemplate, stack), {
    ...piece.values,
    title: piece.title,
  });
  const lines = text.split("\n");
  const firstSection = lines.findIndex((l) => l.startsWith("## "));
  return lines
    .slice(firstSection)
    .map((l) => (l.startsWith("## ") ? `#${l}` : l))
    .join("\n")
    .trim();
}

export function composeWebPrompt({
  pieces,
  stack,
  brief = {},
}: {
  pieces: (BuilderPiece & { category: string })[];
  stack: StackId;
  brief?: Brief;
}): string {
  const ordered = [...pieces].sort(
    (a, b) => BUILD_ORDER.indexOf(a.category) - BUILD_ORDER.indexOf(b.category),
  );
  const name = brief.name?.trim();
  const sector = brief.sector?.trim();
  const hasPageTransition = ordered.some((p) => p.category === "transiciones");
  const hasBackground = ordered.some((p) => p.category === "fondos");

  const out: string[] = [
    `# Prompt de mi web${name ? `: ${name}` : ""}`,
    "",
    `Prompt compuesto en Kinetic Prompts con ${ordered.length} ${ordered.length === 1 ? "pieza" : "piezas"}. Pégalo en tu IA (Claude Code, Cursor…) dentro de tu proyecto.`,
    "",
    "## 1. Brief",
    "",
    name
      ? `- Negocio: ${name}${sector ? ` (${sector})` : ""}.`
      : "- Negocio: usa el nombre y el contenido que ya tenga el proyecto.",
    `- Proyecto: ${STACK_NAMES[stack]}.`,
    "- Piezas, en el orden en que se montan:",
    ...ordered.map((p, i) => `  ${i + 1}. ${p.categoryLabel}: ${p.title}.`),
    "",
    "## 2. Antes de empezar",
    "",
    "1. Mira el proyecto: framework, enrutado, layout común, estilos globales y si ya usa GSAP u otra librería de animación.",
    "2. Monta las piezas de una en una y en el orden del brief. Después de cada una, comprueba que la web sigue funcionando y que la consola no muestra errores.",
    "3. Reutiliza lo que ya exista (tokens de color, tipografías, componentes) en vez de duplicarlo.",
    "",
    "## 3. Reglas de convivencia",
    "",
    "- **Capas:** el fondo va por debajo de todo el contenido; las capas de transición de página, por encima de todo. El contenido queda entre medias y nunca se tapa sin querer.",
    ...(hasPageTransition
      ? ["- **Una sola transición de página** para toda la web: si el proyecto ya tiene otra, sustitúyela."]
      : []),
    ...(hasBackground
      ? [
          "- **Un solo fondo animado** por página, y el texto encima con un contraste de al menos 4,5:1 también en su peor momento.",
        ]
      : []),
    "- **Movimiento reducido para todo a la vez:** una sola comprobación de `prefers-reduced-motion` que apaguen o simplifiquen todas las piezas.",
    "- **Rendimiento:** cada bucle de animación se para cuando su elemento no se ve. Anima solo `transform` y `opacity` salvo donde la pieza diga otra cosa. Objetivo: Lighthouse móvil con Rendimiento de 90 o más.",
    "- **Colores:** si los de una pieza no casan con la marca, ajústalos a la paleta de la web manteniendo los contrastes.",
    "",
  ];

  ordered.forEach((piece, i) => {
    out.push(
      `## ${i + 4}. Pieza ${i + 1} · ${piece.categoryLabel}: ${piece.title}`,
      "",
      embedPiece(piece, stack),
      "",
    );
  });

  out.push(
    `## ${ordered.length + 4}. Criterios de validación de la web`,
    "",
    "- Cada pieza cumple sus propios criterios de validación.",
    "- Las piezas no se pisan: capas en su orden, una sola transición de página y un solo fondo.",
    "- A 375 y a 1440 px no hay desbordes ni texto tapado.",
    "- Con movimiento reducido, todas las piezas quedan quietas o con fundidos cortos.",
    "- La consola no muestra errores ni avisos.",
  );
  return out.join("\n");
}

/** Valores por defecto de los parámetros de una pieza (lo que copia el constructor en su primera versión). */
export function paramDefaults(params: { id: string; default: ParamValue }[]): Record<string, ParamValue> {
  return Object.fromEntries(params.map((p) => [p.id, p.default]));
}

/** Colores de titular que propone el constructor cuando el elegido no se lee sobre el fondo. */
const HEADLINE_LIGHT = "#f6f3ee"; // kp-permitir-hex: color de contenido de la web del usuario
const HEADLINE_DARK = "#141311"; // kp-permitir-hex: color de contenido de la web del usuario

export type HeadlineContrast = {
  ratio: number;
  ok: boolean;
  /** El color de titular (claro u oscuro) que mejor se lee sobre el color base del fondo. */
  suggestion: string;
  tone: "claro" | "oscuro";
};

/**
 * ¿Se lee el titular sobre el fondo? Compara el color del texto de la pieza de Letras (su parámetro
 * «color») con el color base de la pieza de Fondos (su parámetro «base»), con el mínimo de 4,5:1 que
 * piden las reglas de convivencia. Es una comprobación sobre el color base: el prompt pide además
 * revisar el peor momento de la animación. Devuelve null si falta alguno de los dos colores.
 */
export function headlineContrast(
  base: ParamValue | undefined,
  text: ParamValue | undefined,
): HeadlineContrast | null {
  if (typeof base !== "string" || typeof text !== "string") return null;
  const light = contrastRatio(base, HEADLINE_LIGHT);
  const dark = contrastRatio(base, HEADLINE_DARK);
  const ratio = contrastRatio(base, text);
  return {
    ratio,
    ok: ratio >= MIN_TEXT_CONTRAST,
    suggestion: light >= dark ? HEADLINE_LIGHT : HEADLINE_DARK,
    tone: light >= dark ? "claro" : "oscuro",
  };
}
