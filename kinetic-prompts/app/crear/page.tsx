import type { Metadata } from "next";

import { WebBuilder } from "@/components/builder/web-builder";
import { SiteHeader } from "@/components/site/site-header";
import { getGalleryItems } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Crea tu web · Kinetic Prompts",
  description: "Elige un fondo, una transición y unas letras, y copia el prompt de tu web entera.",
};

const STEPS = ["Elige una pieza por apartado", "Pon el nombre de tu negocio", "Copia el prompt de tu web"];

export default function CrearPage() {
  const items = getGalleryItems();
  return (
    <>
      <SiteHeader count={items.length} />
      <main className="mx-auto flex max-w-page flex-col gap-12 px-4 pt-8 md:px-6 lg:pb-24">
        <header className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="font-mono text-12 tracking-normal text-text-muted uppercase">
              Constructor · versión 1
            </p>
            <h1 className="text-40 md:text-64">Crea tu web por partes</h1>
            <p className="text-16 text-text-muted md:text-20">
              Elige las piezas y copia un solo prompt con todo: tu IA monta la web entera, en orden y sin que
              las piezas se pisen.
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 font-mono text-14 text-text">
                  {i + 1}
                </span>
                <span className="text-14 text-text">{step}</span>
              </li>
            ))}
          </ol>
        </header>
        <WebBuilder items={items} />
      </main>
    </>
  );
}
