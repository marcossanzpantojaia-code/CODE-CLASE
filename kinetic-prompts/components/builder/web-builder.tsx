"use client";

import { Palette } from "lucide-react";
import { useState } from "react";

import { ParamControl } from "@/components/catalog/param-control";
import type { GalleryItem } from "@/components/catalog/types";
import { ApartadoIcon } from "@/components/site/apartado-icon";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ColorPicker } from "@/components/ui/color-picker";
import { CopyButton } from "@/components/ui/copy-button";
import { Input } from "@/components/ui/input";
import { APARTADOS } from "@/lib/apartados";
import { BUILD_ORDER, composeWebPrompt, paramDefaults } from "@/lib/compose";
import { type ParamValue, STACKS, type StackId } from "@/lib/prompt-render";

import { PieceOption } from "./piece-option";
import { PiecePreview } from "./piece-preview";

const NONE = "ninguna";

/** Constructor de webs por partes: una pieza (o ninguna) por apartado y un solo prompt para la web entera. */
export function WebBuilder({ items }: { items: GalleryItem[] }) {
  const steps = APARTADOS.filter((a) => items.some((i) => i.category === a.id));
  // Muy fácil: cada apartado empieza con su primera pieza elegida, así se puede copiar a la primera.
  const [choice, setChoice] = useState<Record<string, string>>(() =>
    Object.fromEntries(steps.map((s) => [s.id, items.find((i) => i.category === s.id)!.slug])),
  );
  const [stack, setStack] = useState<StackId>("auto");
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  // Opciones de cada pieza (empiezan con sus valores por defecto) y color de marca.
  const [values, setValues] = useState<Record<string, Record<string, ParamValue>>>(() =>
    Object.fromEntries(items.map((i) => [i.slug, paramDefaults(i.params)])),
  );
  const [brand, setBrand] = useState("#ff6b3d"); // kp-permitir-hex: valor inicial del selector, contenido del usuario
  const [brandApplied, setBrandApplied] = useState<string[]>([]);

  const setValue = (slug: string, id: string, value: ParamValue) =>
    setValues((v) => ({ ...v, [slug]: { ...v[slug], [id]: value } }));

  // El compilador de React memoiza solo: no hace falta useMemo.
  const chosen = steps
    .map((s) => items.find((i) => i.slug === choice[s.id]))
    .filter((i): i is GalleryItem => Boolean(i))
    .sort((a, b) => BUILD_ORDER.indexOf(a.category) - BUILD_ORDER.indexOf(b.category));

  /** Pone el color de marca en el color principal de cada pieza elegida que lo tenga. */
  function applyBrand() {
    const targets = chosen.filter((item) => item.brandParam);
    setValues((v) => {
      const next = { ...v };
      for (const item of targets) next[item.slug] = { ...next[item.slug], [item.brandParam!]: brand };
      return next;
    });
    setBrandApplied(targets.map((t) => t.title));
  }

  const prompt = composeWebPrompt({
    stack,
    brief: { name, sector },
    pieces: chosen.map((i) => ({
      slug: i.slug,
      title: i.title,
      category: i.category,
      categoryLabel: i.categoryLabel,
      promptTemplate: i.promptTemplate,
      values: values[i.slug] ?? paramDefaults(i.params),
    })),
  });

  const copy = (
    <CopyButton
      source={prompt}
      size="lg"
      label="Copiar el prompt de mi web"
      what="Prompt de tu web"
      className="w-full"
      disabled={chosen.length === 0}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
      <div className="flex flex-col gap-12 lg:col-span-2">
        {steps.map((step, index) => (
          <section key={step.id} aria-labelledby={`paso-${step.id}`} className="flex flex-col gap-4">
            <header className="flex items-start gap-4 border-t border-border pt-6">
              <span className="font-mono text-14 text-text-muted">{String(index + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1">
                <h2 id={`paso-${step.id}`} className="flex items-center gap-3 text-28">
                  <ApartadoIcon id={step.id} className="text-text-muted" />
                  {step.label}
                </h2>
                <p className="text-14 text-text-muted">{step.description}</p>
              </div>
            </header>
            <div
              role="radiogroup"
              aria-labelledby={`paso-${step.id}`}
              className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3"
              data-paso={step.id}
            >
              {items
                .filter((i) => i.category === step.id)
                .map((item) => (
                  <PieceOption
                    key={item.slug}
                    name={step.id}
                    value={item.slug}
                    checked={choice[step.id] === item.slug}
                    onSelect={() => setChoice((c) => ({ ...c, [step.id]: item.slug }))}
                    title={item.title}
                    meta={`Nivel ${item.levelLabel.toLowerCase()} · ${item.tech.slice(0, 2).join(" · ")}`}
                    poster={item.poster}
                  />
                ))}
              <PieceOption
                name={step.id}
                value={NONE}
                checked={choice[step.id] === NONE}
                onSelect={() => setChoice((c) => ({ ...c, [step.id]: NONE }))}
                title="Ninguna"
                meta="Sin pieza de este apartado"
              />
            </div>
            {(() => {
              const item = items.find((i) => i.slug === choice[step.id]);
              if (!item || item.params.length === 0) return null;
              return (
                <details className="rounded-card border border-border bg-surface" data-opciones={step.id}>
                  <summary className="cursor-pointer rounded-card px-4 py-3 text-14 font-medium outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid">
                    Opciones de «{item.title}»
                  </summary>
                  <div className="grid grid-cols-1 gap-4 px-4 pb-4 md:grid-cols-2">
                    {item.params.map((param) => (
                      <ParamControl
                        key={param.id}
                        param={param}
                        value={values[item.slug]?.[param.id] ?? param.default}
                        onChange={(value) => setValue(item.slug, param.id, value)}
                      />
                    ))}
                  </div>
                </details>
              );
            })()}
          </section>
        ))}
        {chosen.length ? (
          <section
            aria-labelledby="en-marcha"
            className="flex flex-col gap-4 border-t border-border pt-6"
            data-en-marcha
          >
            <div className="flex flex-col gap-1">
              <h2 id="en-marcha" className="text-28">
                Tus piezas en marcha
              </h2>
              <p className="text-14 text-text-muted">
                Cada pieza en su demo, con tus opciones y tu color de marca. Así ves si casan antes de copiar.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {chosen.map((item) =>
                item.demo ? (
                  <PiecePreview
                    key={item.slug}
                    title={item.title}
                    label={item.categoryLabel}
                    demo={item.demo}
                    values={values[item.slug] ?? {}}
                  />
                ) : null,
              )}
            </div>
          </section>
        ) : null}
      </div>

      <aside
        aria-labelledby="tu-web"
        className="flex flex-col gap-6 self-start rounded-panel border border-border bg-surface p-6 lg:sticky lg:top-24"
      >
        <div className="flex flex-col gap-2">
          <h2 id="tu-web" className="text-28">
            Tu web
          </h2>
          <ol className="flex flex-col gap-1 text-14" data-resumen>
            {steps.map((s) => {
              const item = items.find((i) => i.slug === choice[s.id]);
              return (
                <li key={s.id} className="flex justify-between gap-3">
                  <span className="text-text-muted">{s.label}</span>
                  <span className={item ? "text-right text-text" : "text-right text-text-muted"}>
                    {item ? item.title : "Ninguna"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre del negocio (opcional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Café Norte"
          />
          <Input
            label="Sector (opcional)"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Cafetería de especialidad"
          />
        </div>
        <div className="flex flex-col gap-3">
          <ColorPicker label="Color de tu marca" value={brand} onValueChange={setBrand} />
          <Button variant="secundario" icon={Palette} onClick={applyBrand} disabled={chosen.length === 0}>
            Aplicar a todas las piezas
          </Button>
          <p className="text-12 text-text-muted" aria-live="polite" data-marca>
            {brandApplied.length
              ? `Aplicado a ${brandApplied.join(", ")}.`
              : "Pone tu color en el color principal de cada pieza. Después puedes retocarlo en sus opciones."}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="font-sans text-16 font-semibold tracking-normal">Tu proyecto</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tu proyecto">
            {STACKS.map((s) => (
              <Chip key={s.id} active={stack === s.id} onClick={() => setStack(s.id)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
        {copy}
        <p className="text-12 text-text-muted">
          {chosen.length} {chosen.length === 1 ? "pieza" : "piezas"} con sus reglas para convivir: capas, una
          sola transición de página, un solo fondo y movimiento reducido para todo.
        </p>
        <details className="rounded-card border border-border bg-surface-2">
          <summary className="cursor-pointer rounded-card px-4 py-3 text-14 font-medium outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid">
            Ver el prompt
          </summary>
          <pre
            className="max-h-96 overflow-auto px-4 pb-4 font-mono text-12 leading-mono whitespace-pre-wrap"
            data-prompt-web
          >
            {prompt}
          </pre>
        </details>
      </aside>

      {/* En móvil, el botón de copiar siempre a mano. */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-bg px-4 py-3 lg:hidden">
        {copy}
      </div>
    </div>
  );
}
