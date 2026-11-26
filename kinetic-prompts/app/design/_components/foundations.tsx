"use client";

import { CircleCheck, CircleX } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import { CONTRAST_PAIRS, MIN_TEXT_CONTRAST, contrastRatio } from "@/lib/contrast";

import { useCssVars, useReducedMotion } from "./hooks";
import { Section, SubHeading } from "./layout";

const COLOR_TOKENS = [
  { name: "--bg", swatch: "bg-bg", uso: "Fondo de la página" },
  { name: "--surface", swatch: "bg-surface", uso: "Tarjetas, paneles" },
  { name: "--surface-2", swatch: "bg-surface-2", uso: "Bloque del prompt, inputs, menús" },
  { name: "--border", swatch: "bg-border", uso: "Bordes de 1 px" },
  { name: "--text", swatch: "bg-text", uso: "Texto principal" },
  { name: "--text-muted", swatch: "bg-text-muted", uso: "Texto secundario, metadatos" },
  { name: "--accent", swatch: "bg-accent", uso: "Único acento: Copiar, enlaces activos, foco" },
  { name: "--success", swatch: "bg-success", uso: "«Copiado», estado VALIDADO" },
  { name: "--warning", swatch: "bg-warning", uso: "Límite de copias cerca" },
  { name: "--danger", swatch: "bg-danger", uso: "Errores" },
] as const;

const DERIVED_TOKENS = [
  { name: "--border-strong", swatch: "bg-border-strong", uso: "Borde en hover" },
  { name: "--accent-hover", swatch: "bg-accent-hover", uso: "Botón primario en hover" },
  { name: "--accent-press", swatch: "bg-accent-press", uso: "Botón primario pulsado" },
] as const;

const TYPE_SCALE = [
  {
    cls: "text-64 font-display font-extrabold tracking-display",
    label: "64 · SF Pro / Inter 800",
    sample: "Efectos en movimiento",
  },
  {
    cls: "text-40 font-display font-bold tracking-display",
    label: "40 · SF Pro / Inter 700",
    sample: "Galería de animaciones",
  },
  {
    cls: "text-28 font-display font-semibold tracking-display",
    label: "28 · SF Pro / Inter 600",
    sample: "Transición cortina",
  },
  {
    cls: "text-20 font-sans font-semibold",
    label: "20 · SF Pro / Inter 600",
    sample: "Parámetros de la animación",
  },
  {
    cls: "text-16 font-sans",
    label: "16 · SF Pro / Inter 400 (base)",
    sample: "Ajusta la duración y el prompt se reescribe solo.",
  },
  {
    cls: "text-14 font-sans font-medium text-text-muted",
    label: "14 · SF Pro / Inter 500",
    sample: "GSAP · Next.js · Ligero",
  },
  {
    cls: "text-12 font-sans text-text-muted",
    label: "12 · SF Pro / Inter 400",
    sample: "Nuevo · hace 3 días",
  },
] as const;

const SPACING = [
  { cls: "w-1", px: 4 },
  { cls: "w-2", px: 8 },
  { cls: "w-3", px: 12 },
  { cls: "w-4", px: 16 },
  { cls: "w-6", px: 24 },
  { cls: "w-8", px: 32 },
  { cls: "w-12", px: 48 },
  { cls: "w-16", px: 64 },
  { cls: "w-24", px: 96 },
] as const;

const RADII = [
  { cls: "rounded-control", label: "6 px · chips y botones" },
  { cls: "rounded-card", label: "12 px · tarjetas" },
  { cls: "rounded-panel", label: "20 px · paneles grandes" },
] as const;

const MOTION = [
  { momento: "Hover en tarjeta", token: "--dur-hover", comportamiento: "Sube 2 px y el borde se aclara" },
  { momento: "Menús, chips, toasts", token: "--dur-ui", comportamiento: "Fundido + desplazamiento de 8 px" },
  { momento: "Tarjeta → ficha", token: "--dur-signature", comportamiento: "Transición firma (fase 3)" },
  { momento: "Copiar prompt", token: "--dur-copied", comportamiento: "«Copiado ✓» visible" },
] as const;

/** «.15s» o «150ms» → «150 ms». */
function formatDuration(value: string | undefined): string {
  if (!value) return "—";
  const ms = value.endsWith("ms") ? parseFloat(value) : parseFloat(value) * 1000;
  return Number.isFinite(ms) ? `${Math.round(ms)} ms` : value;
}

const formatRatio = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

export function Palette() {
  const values = useCssVars(COLOR_TOKENS.map((t) => t.name));
  return (
    <Section
      id="paleta"
      title="Paleta"
      intro="Tema oscuro por defecto. El acento solo aparece en lo que se puede pulsar o en lo activo."
    >
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {COLOR_TOKENS.map((token) => (
          <li
            key={token.name}
            className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
          >
            <span className={cn("h-16 border-b border-border", token.swatch)} />
            <div className="flex flex-col gap-1 p-3">
              <code className="text-14 text-text">{token.name}</code>
              <span className="font-mono text-12 text-text-muted uppercase">
                {values?.[token.name] ?? "—"}
              </span>
              <span className="text-12 text-text-muted">{token.uso}</span>
            </div>
          </li>
        ))}
      </ul>
      <SubHeading>Derivados para estados</SubHeading>
      <p className="text-14 text-text-muted">
        Mezclas de los colores anteriores (<code>color-mix</code> en <code>styles/tokens.css</code>); no
        añaden tonos nuevos.
      </p>
      <ul className="flex flex-wrap gap-4">
        {DERIVED_TOKENS.map((token) => (
          <li
            key={token.name}
            className="flex items-center gap-3 rounded-card border border-border bg-surface p-3 pr-4"
          >
            <span className={cn("size-8 rounded-control border border-border", token.swatch)} />
            <span className="flex flex-col">
              <code className="text-14">{token.name}</code>
              <span className="text-12 text-text-muted">{token.uso}</span>
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RatioBadge({ ratio }: { ratio: number | null }) {
  const ok = ratio !== null && ratio >= MIN_TEXT_CONTRAST;
  return (
    <span
      className={cn("flex items-center justify-end gap-2 font-mono", ok ? "text-success" : "text-danger")}
    >
      {ratio === null ? "—" : `${formatRatio.format(ratio)}:1`}
      {ratio === null ? null : <Icon icon={ok ? CircleCheck : CircleX} label={ok ? "Cumple" : "No cumple"} />}
    </span>
  );
}

export function Contrast() {
  const names = [...new Set(CONTRAST_PAIRS.flatMap((p) => [p.fg, p.bg]))];
  const values = useCssVars(names);
  const rows = CONTRAST_PAIRS.map((pair) => {
    const fg = values?.[pair.fg];
    const bg = values?.[pair.bg];
    return { ...pair, key: `${pair.fg}-${pair.bg}`, ratio: fg && bg ? contrastRatio(fg, bg) : null };
  });
  return (
    <Section
      id="contraste"
      title="Contraste"
      intro={`Mínimo ${formatRatio.format(MIN_TEXT_CONTRAST)}:1 para texto (WCAG 2.2 AA). Se calcula con los valores reales de los tokens.`}
    >
      {/* Móvil: una tarjeta por pareja, sin scroll horizontal. */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3 text-14"
          >
            <span className="flex items-center justify-between gap-2">
              <span>
                <code>{row.fg}</code> <span className="text-text-muted">sobre</span> <code>{row.bg}</code>
              </span>
              <RatioBadge ratio={row.ratio} />
            </span>
            <span className="text-12 text-text-muted">{row.uso}</span>
          </li>
        ))}
      </ul>
      <div className="hidden rounded-card border border-border sm:block">
        <table className="w-full border-collapse text-left text-14">
          <thead className="bg-surface text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Texto
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Fondo
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Uso
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Contraste
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-border" data-contraste={row.ratio ?? undefined}>
                <td className="px-4 py-3">
                  <code>{row.fg}</code>
                </td>
                <td className="px-4 py-3">
                  <code>{row.bg}</code>
                </td>
                <td className="px-4 py-3 text-text-muted">{row.uso}</td>
                <td className="px-4 py-3">
                  <RatioBadge ratio={row.ratio} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export function Typography() {
  return (
    <Section
      id="tipografia"
      title="Tipografía"
      intro="Títulos en Bricolage Grotesque (tracking −2 %), texto en Instrument Sans y prompts en JetBrains Mono."
    >
      <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-surface">
        {TYPE_SCALE.map((row) => (
          <li key={row.label} className="flex flex-col gap-2 p-4 md:flex-row md:items-baseline md:gap-6">
            <span className="w-56 shrink-0 font-mono text-12 text-text-muted">{row.label}</span>
            <span className={cn("min-w-0 break-words", row.cls)}>{row.sample}</span>
          </li>
        ))}
      </ul>
      <SubHeading>Prompt (JetBrains Mono 14 / 1,6)</SubHeading>
      <pre className="overflow-x-auto rounded-card border border-border bg-surface-2 p-4 font-mono text-14 leading-mono text-text">
        {
          "## 4. Comportamiento paso a paso\n1. Disparador: clic en un enlace interno.\n2. Anima y de 100 % a 0 % en 0,9 s con power3.inOut."
        }
      </pre>
      <SubHeading>Párrafo (máximo 65 caracteres por línea)</SubHeading>
      <p className="text-16 text-text-muted">
        Cada prompt sale de una ficha validada de la biblioteca: el usuario ve el efecto funcionando, ajusta
        sus parámetros y copia un texto que su IA puede seguir paso a paso, con valores, unidades y criterios
        para comprobar el resultado.
      </p>
    </Section>
  );
}

export function SpacingAndShape() {
  return (
    <Section
      id="forma"
      title="Espaciado y forma"
      intro="Espaciado en múltiplos de 4 px. La profundidad se marca con bordes y con el cambio de superficie, sin sombras."
    >
      <SubHeading>Espaciado</SubHeading>
      <ul className="flex flex-col gap-2">
        {SPACING.map((step) => (
          <li key={step.px} className="flex items-center gap-4">
            <span className="w-12 font-mono text-12 text-text-muted">{step.px} px</span>
            <span className={cn("h-3 rounded-control bg-accent", step.cls)} />
          </li>
        ))}
      </ul>
      <SubHeading>Radios</SubHeading>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {RADII.map((radius) => (
          <li
            key={radius.cls}
            className={cn(
              "flex h-24 items-end border border-border bg-surface p-3 text-12 text-text-muted",
              radius.cls,
            )}
          >
            {radius.label}
          </li>
        ))}
      </ul>
      <SubHeading>Niveles de superficie</SubHeading>
      <div className="rounded-panel border border-border bg-bg p-4">
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="rounded-control border border-border bg-surface-2 p-4 text-14 text-text-muted">
            --bg → --surface → --surface-2
          </div>
        </div>
      </div>
    </Section>
  );
}

export function Motion() {
  const values = useCssVars([...MOTION.map((m): string => m.token), "--ease"]);
  const reduced = useReducedMotion();
  return (
    <Section
      id="movimiento"
      title="Movimiento"
      intro="Easing único cubic-bezier(0.2, 0.8, 0.2, 1). Con movimiento reducido, todo pasa a fundidos de 100 ms."
    >
      <p className="text-14 text-text-muted" data-reduced-motion={reduced ?? undefined}>
        Movimiento reducido en este navegador:{" "}
        <strong className="text-text">{reduced === null ? "—" : reduced ? "activado" : "desactivado"}</strong>
      </p>
      <ul className="flex flex-col gap-2 sm:hidden">
        {MOTION.map((row) => (
          <li
            key={row.token}
            className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3 text-14"
          >
            <span className="flex items-center justify-between gap-2">
              <span>{row.momento}</span>
              <span className="font-mono text-text-muted">{formatDuration(values?.[row.token])}</span>
            </span>
            <span className="text-12 text-text-muted">
              <code>{row.token}</code> · {row.comportamiento}
            </span>
          </li>
        ))}
      </ul>
      <div className="hidden rounded-card border border-border sm:block">
        <table className="w-full border-collapse text-left text-14">
          <thead className="bg-surface text-text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Momento
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Token
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Valor actual
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Comportamiento
              </th>
            </tr>
          </thead>
          <tbody>
            {MOTION.map((row) => (
              <tr key={row.token} className="border-t border-border">
                <td className="px-4 py-3">{row.momento}</td>
                <td className="px-4 py-3">
                  <code>{row.token}</code>
                </td>
                <td className="px-4 py-3 font-mono text-text-muted" data-token={row.token}>
                  {formatDuration(values?.[row.token])}
                </td>
                <td className="px-4 py-3 text-text-muted">{row.comportamiento}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <SubHeading>Prueba el hover de tarjeta</SubHeading>
      <a
        href="#movimiento"
        className="block w-full max-w-96 rounded-card border border-border bg-surface p-4 transition-[transform,border-color] duration-(--dur-hover) ease-kp outline-none kp-hover:translate-y-(--lift) kp-hover:border-border-strong kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid"
      >
        <span className="block aspect-16/10 rounded-control bg-surface-2" />
        <span className="mt-3 block text-14 font-medium">Tarjeta de ejemplo</span>
        <span className="block text-12 text-text-muted">
          Sube 2 px en 150 ms; con movimiento reducido, solo cambia el borde.
        </span>
      </a>
    </Section>
  );
}
