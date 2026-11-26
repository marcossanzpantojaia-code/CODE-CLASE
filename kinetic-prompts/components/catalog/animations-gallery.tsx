"use client";

import { useMemo, useState } from "react";

import { Chip } from "@/components/ui/chip";

import { EffectTile } from "./effect-tile";
import type { GalleryItem } from "./types";

const LEVELS = [
  { value: 1, label: "Básico" },
  { value: 2, label: "Intermedio" },
  { value: 3, label: "Avanzado" },
] as const;

/** Galería por apartados y niveles. Solo aparecen los filtros que tienen algo que mostrar. */
export function AnimationsGallery({ items }: { items: GalleryItem[] }) {
  const [apartado, setApartado] = useState<string | null>(null);
  const [nivel, setNivel] = useState<number | null>(null);

  const apartados = useMemo(() => {
    const seen = new Map<string, { label: string; count: number }>();
    for (const item of items) {
      const entry = seen.get(item.category) ?? { label: item.categoryLabel, count: 0 };
      entry.count++;
      seen.set(item.category, entry);
    }
    return [...seen.entries()];
  }, [items]);

  const visible = items.filter(
    (item) => (apartado === null || item.category === apartado) && (nivel === null || item.level === nivel),
  );
  const levels = LEVELS.filter((l) =>
    items.some((i) => i.level === l.value && (apartado === null || i.category === apartado)),
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-6">
        <p className="text-16 font-medium">Todavía no hay animaciones publicadas</p>
        <p className="text-14 text-text-muted">
          Cada efecto aparece aquí en cuanto pasa la validación. Vuelve en unos días.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Apartado">
          <Chip active={apartado === null} onClick={() => setApartado(null)}>
            Todos ({items.length})
          </Chip>
          {apartados.map(([id, { label, count }]) => (
            <Chip key={id} active={apartado === id} onClick={() => setApartado(apartado === id ? null : id)}>
              {label} ({count})
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
      {visible.length === 0 ? (
        <p className="text-14 text-text-muted">No hay efectos de ese nivel en este apartado todavía.</p>
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4"
          data-galeria
        >
          {visible.map((item) => (
            <li key={item.slug}>
              <EffectTile item={item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
