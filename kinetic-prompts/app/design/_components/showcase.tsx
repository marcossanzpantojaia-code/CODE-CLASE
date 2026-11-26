"use client";

import { ComponentsSection } from "./components-section";
import { Contrast, Motion, Palette, SpacingAndShape, Typography } from "./foundations";

const NAV = [
  { href: "#paleta", label: "Paleta" },
  { href: "#contraste", label: "Contraste" },
  { href: "#tipografia", label: "Tipografía" },
  { href: "#forma", label: "Espaciado y forma" },
  { href: "#movimiento", label: "Movimiento" },
  { href: "#componentes", label: "Componentes" },
];

/** Página /design: paleta, escala tipográfica, movimiento y todos los componentes con sus estados. */
export function DesignShowcase() {
  return (
    <main className="mx-auto flex max-w-page flex-col gap-16 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-4">
        <p className="text-12 font-medium tracking-normal text-text-muted uppercase">Solo en desarrollo</p>
        <h1 className="text-40 md:text-64">Sistema de diseño</h1>
        <p className="text-16 text-text-muted">
          Tokens de <code>styles/tokens.css</code> y componentes de <code>components/ui</code>. Fuente:
          sección «Dirección estética» de <code>docs/PLAN.md</code>.
        </p>
        <nav aria-label="Secciones del sistema de diseño">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-14">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="rounded-control text-text-muted underline-offset-4 outline-none hover:text-text hover:underline focus-visible:outline-(length:--focus-w) focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <Palette />
      <Contrast />
      <Typography />
      <SpacingAndShape />
      <Motion />
      <ComponentsSection />
    </main>
  );
}
