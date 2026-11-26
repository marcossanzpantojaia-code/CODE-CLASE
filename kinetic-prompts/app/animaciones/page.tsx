import type { Metadata } from "next";

import { AnimationsGallery } from "@/components/catalog/animations-gallery";
import { SiteHeader } from "@/components/site/site-header";
import { Stat } from "@/components/site/stat";
import { APARTADOS } from "@/lib/apartados";
import { knowledgeCount } from "@/lib/content";
import { getGalleryItems, sourcesUsed } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Animaciones · Kinetic Prompts",
  description: "Transiciones, fondos y efectos para tu web. Pulsa uno, elige tus opciones y copia su prompt.",
};

const STEPS = ["Pulsa un efecto", "Elige tus opciones", "Copia el prompt y pégalo en tu IA"];

export default function AnimacionesPage() {
  const items = getGalleryItems();
  return (
    <>
      <SiteHeader count={items.length} />
      <main className="mx-auto flex max-w-page flex-col gap-12 px-4 pt-8 pb-24 md:px-6">
        <header className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="font-mono text-12 tracking-normal text-text-muted uppercase">
              Biblioteca · Animaciones
            </p>
            <h1 className="text-40 md:text-64">Animaciones</h1>
            <p className="text-16 text-text-muted md:text-20">
              Efectos listos para tu web, cada uno con su demo, sus opciones y un prompt que tu IA entiende.
            </p>
          </div>
          <div className="flex flex-wrap gap-8">
            <Stat value={items.length} label="efectos validados" />
            <Stat
              value={new Set(items.map((i) => i.category)).size}
              label={`apartados con efectos de ${APARTADOS.length}`}
            />
            <Stat
              value={sourcesUsed()}
              label={`fichas de la biblioteca consultadas de ${knowledgeCount()}`}
            />
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
        <AnimationsGallery items={items} />
      </main>
    </>
  );
}
