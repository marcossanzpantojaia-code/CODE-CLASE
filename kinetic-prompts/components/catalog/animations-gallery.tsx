"use client";

import { useState } from "react";

import { ApartadoIcon } from "@/components/site/apartado-icon";
import { Chip } from "@/components/ui/chip";
import { APARTADOS } from "@/lib/apartados";

import { EffectTile } from "./effect-tile";
import type { GalleryItem } from "./types";

const LEVELS = [
  { value: 1, label: "Básico" },
  { value: 2, label: "Intermedio" },
  { value: 3, label: "Avanzado" },
] as const;

const grid = "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4";

/** Galería por apartados numerados, con filtro de nivel. Los apartados vacíos salen como «Próximamente». */
export function AnimationsGallery({ items }: { items: GalleryItem[] }) {
  const [apartado, setApartado] = useState<string | null>(null);
  const [nivel, setNivel] = useState<number | null>(null);

  const withItems = APARTADOS.filter((a) => items.some((i) => i.category === a.id));
  const upcoming = APARTADOS.filter((a) => !items.some((i) => i.category === a.id));
  const levels = LEVELS.filter((l) => items.some((i) => i.level === l.value));
  const shown = withItems.filter((a) => apartado === null || a.id === apartado);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Apartado">
          <Chip active={apartado === null} onClick={() => setApartado(null)}>
            Todos ({items.length})
          </Chip>
          {withItems.map((a) => (
            <Chip
              key={a.id}
              active={apartado === a.id}
              onClick={() => setApartado(apartado === a.id ? null : a.id)}
            >
              {a.label} ({items.filter((i) => i.category === a.id).length})
            </Chip>
          ))}
        </div>
        {levels.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Nivel">
            <Chip active={nivel === null} onClick={() => setNivel(null)}>
              Todos los niveles
            </Chip>
            {levels.map((l) => (
              <Chip
                key={l.value}
                active={nivel === l.value}
                onClick={() => setNivel(nivel === l.value ? null : l.value)}
              >
                {l.label}
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-6">
          <p className="text-16 font-medium">Todavía no hay animaciones publicadas</p>
          <p className="text-14 text-text-muted">Cada efecto aparece aquí en cuanto pasa la validación.</p>
        </div>
      ) : null}

      {shown.map((a) => {
        const number = String(APARTADOS.findIndex((x) => x.id === a.id) + 1).padStart(2, "0");
        const visible = items.filter((i) => i.category === a.id && (nivel === null || i.level === nivel));
        return (
          <section
            key={a.id}
            id={a.id}
            aria-labelledby={`apartado-${a.id}`}
            className="flex scroll-mt-24 flex-col gap-6"
          >
            <header className="flex flex-col gap-3 border-t border-border pt-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-start gap-4">
                <span className="font-mono text-14 text-text-muted">{number}</span>
                <div className="flex flex-col gap-1">
                  <h2 id={`apartado-${a.id}`} className="flex items-center gap-3 text-28">
                    <ApartadoIcon id={a.id} className="text-text-muted" />
                    {a.label}
                  </h2>
                  <p className="text-14 text-text-muted">{a.description}</p>
                </div>
              </div>
              <span className="font-mono text-12 text-text-muted">
                {visible.length} {visible.length === 1 ? "efecto" : "efectos"}
              </span>
            </header>
            {visible.length === 0 ? (
              <p className="text-14 text-text-muted">No hay efectos de ese nivel en este apartado todavía.</p>
            ) : (
              <ul className={grid} data-galeria>
                {visible.map((item) => (
                  <li key={item.slug}>
                    <EffectTile item={item} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {upcoming.length && apartado === null ? (
        <section aria-labelledby="proximamente" className="flex flex-col gap-6 border-t border-border pt-6">
          <div className="flex flex-col gap-1">
            <h2 id="proximamente" className="text-28">
              Próximamente
            </h2>
            <p className="text-14 text-text-muted">
              Apartados en preparación. Cada efecto se construye desde una ficha de la biblioteca y se valida
              antes de aparecer aquí.
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-card border border-dashed border-border p-4"
              >
                <ApartadoIcon id={a.id} className="mt-1 text-text-muted" />
                <div className="flex flex-col gap-1">
                  <p className="text-16 font-medium">{a.label}</p>
                  <p className="text-14 text-text-muted">{a.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
