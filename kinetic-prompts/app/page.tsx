import { ArrowRight, ClipboardCopy, MousePointerClick, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { EffectTile } from "@/components/catalog/effect-tile";
import { ApartadoIcon } from "@/components/site/apartado-icon";
import { SiteHeader } from "@/components/site/site-header";
import { Stat } from "@/components/site/stat";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { APARTADOS } from "@/lib/apartados";
import { knowledgeCount } from "@/lib/content";
import { getGalleryItems, sourcesUsed } from "@/lib/gallery";

const STEPS = [
  {
    icon: MousePointerClick,
    title: "Pulsa un efecto",
    text: "Lo ves en marcha en una web de ejemplo, en escritorio y en móvil.",
  },
  {
    icon: SlidersHorizontal,
    title: "Elige tus opciones",
    text: "Tu tipo de proyecto, colores, duración… El prompt se reescribe solo.",
  },
  {
    icon: ClipboardCopy,
    title: "Copia y pega",
    text: "Pégalo en Claude Code o Cursor con tu proyecto abierto. Tu IA hace el resto.",
  },
];

// Inicio provisional hasta la Fase 2 (docs/PLAN.md): portada, novedades, cómo funciona y apartados.
export default function Home() {
  const items = getGalleryItems();
  return (
    <>
      <SiteHeader count={items.length} />
      <main className="mx-auto flex max-w-page flex-col gap-24 px-4 pt-12 pb-24 md:px-6">
        <section className="flex flex-col gap-8" aria-labelledby="portada">
          <p className="font-mono text-12 tracking-normal text-text-muted uppercase">
            Biblioteca de prompts para webs y animaciones
          </p>
          <h1 id="portada" className="text-40 md:text-64">
            Elige el efecto.
            <br />
            <span className="text-text-muted">Copia el prompt.</span>
            <br />
            Tu IA lo construye.
          </h1>
          <p className="text-16 text-text-muted md:text-20">
            Cada efecto sale de una ficha de la biblioteca, se implementa de verdad y se valida antes de
            publicarse.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/animaciones">
                Ver animaciones <Icon icon={ArrowRight} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secundario">
              <a href="#como-funciona">Cómo funciona</a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-8 pt-4">
            <Stat value={items.length} label="efectos validados" />
            <Stat value={3} label="niveles: básico, intermedio y avanzado" />
            <Stat value={knowledgeCount()} label={`fichas en la biblioteca (${sourcesUsed()} ya en uso)`} />
          </div>
        </section>

        {items.length ? (
          <section className="flex flex-col gap-6" aria-labelledby="novedades">
            <div className="flex items-end justify-between gap-4">
              <h2 id="novedades" className="text-28">
                Novedades
              </h2>
              <Link
                href="/animaciones"
                className="rounded-control text-14 text-text-muted underline-offset-4 outline-none kp-hover:text-text kp-hover:underline kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid"
              >
                Ver todas
              </Link>
            </div>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {items.slice(0, 4).map((item) => (
                <li key={item.slug}>
                  <EffectTile item={item} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          id="como-funciona"
          className="flex scroll-mt-24 flex-col gap-6"
          aria-labelledby="como-funciona-t"
        >
          <h2 id="como-funciona-t" className="text-28">
            Cómo funciona
          </h2>
          <ol className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-12 place-items-center rounded-card bg-surface-2 text-text">
                    <Icon icon={step.icon} />
                  </span>
                  <span className="font-mono text-28 text-text-muted">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="text-20">{step.title}</h3>
                <p className="text-14 text-text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="apartados">
          <div className="flex flex-col gap-2">
            <h2 id="apartados" className="text-28">
              Apartados
            </h2>
            <p className="text-14 text-text-muted">
              Las piezas con las que se monta una web. Pronto podrás combinarlas en el constructor y copiar el
              prompt de tu web entera.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APARTADOS.map((a, i) => {
              const count = items.filter((item) => item.category === a.id).length;
              const body = (
                <>
                  <div className="flex items-center justify-between">
                    <ApartadoIcon id={a.id} className={count ? "text-text" : "text-text-muted"} />
                    <span className="font-mono text-12 text-text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="text-16 font-medium">{a.label}</p>
                  <p className="text-14 text-text-muted">{a.description}</p>
                  <p className={count ? "text-12 font-medium text-text" : "text-12 text-text-muted"}>
                    {count ? `${count} ${count === 1 ? "efecto" : "efectos"}` : "Próximamente"}
                  </p>
                </>
              );
              return (
                <li key={a.id}>
                  {count ? (
                    <Link
                      href={`/animaciones#${a.id}`}
                      className="flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-4 transition-[transform,border-color] duration-(--dur-hover) ease-kp outline-none kp-hover:translate-y-(--lift) kp-hover:border-border-strong kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col gap-3 rounded-card border border-dashed border-border p-4">
                      {body}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
