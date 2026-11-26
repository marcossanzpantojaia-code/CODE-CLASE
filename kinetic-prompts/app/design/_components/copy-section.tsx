"use client";

import { useState } from "react";

import { Chip } from "@/components/ui/chip";
import { CopyButton, type CopyStatus } from "@/components/ui/copy-button";
import { CopyBlockedError, type PromptSource } from "@/lib/clipboard";

import BOTONERA from "./botonera.json";
import { Section, STATES, StateMatrix, SubHeading, stateProps, type StateName } from "./layout";

const COPY_STATES = [...STATES, "Copiado", "Error"] as const;
type CopyStateName = (typeof COPY_STATES)[number];

function copyStateProps(state: CopyStateName): { forceStatus?: CopyStatus } & ReturnType<typeof stateProps> {
  if (state === "Copiado") return { forceStatus: "copiado" };
  if (state === "Error") return { forceStatus: "error" };
  return stateProps(state as StateName);
}

const MODES = [
  { id: "directo", label: "Directo", hint: "Fases 2 a 5: el prompt ya está en la página." },
  { id: "servidor", label: "Servidor", hint: "Fase 6: el prompt llega de POST /api/copy (600 ms)." },
  { id: "sesion", label: "Sin sesión", hint: "Fase 6: abrirá el panel de inicio de sesión." },
  { id: "limite", label: "Límite alcanzado", hint: "Fase 6: aviso con la fecha de renovación." },
  { id: "red", label: "Fallo de red", hint: "El servidor no responde." },
] as const;
type Mode = (typeof MODES)[number]["id"];

/** Simula el origen del prompt para ver cada camino del botón. */
function sourceFor(prompt: string, mode: Mode): PromptSource {
  if (mode === "directo") return prompt;
  return async () => {
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    if (mode === "sesion") throw new CopyBlockedError({ reason: "sesion" });
    if (mode === "limite") {
      const now = new Date();
      const renewsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      throw new CopyBlockedError({ reason: "limite", renewsAt });
    }
    if (mode === "red") throw new Error("Sin respuesta de /api/copy");
    return prompt;
  };
}

const SAMPLE = BOTONERA[1]!.prompt;

/** El cimiento de la app: un botón que copia el prompt con un clic, igual en todas partes. */
export function CopySection() {
  const [mode, setMode] = useState<Mode>("directo");
  const hint = MODES.find((m) => m.id === mode)!.hint;

  return (
    <Section
      id="copia"
      title="Botón de copia"
      intro="Es el cimiento de la app: cada efecto, cada web y cada sección de una web tiene un botón que copia su prompt con un clic. Todos usan CopyButton, con los mismos estados y el mismo comportamiento."
    >
      <StateMatrix
        title="CopyButton · tarjeta"
        description="En la galería y las novedades: variante secundaria, para que la rejilla no se llene de --accent."
        states={COPY_STATES}
        render={(s) => (
          <CopyButton source={SAMPLE} label="Copiar" variant="secundario" {...copyStateProps(s)} />
        )}
      />
      <StateMatrix
        title="CopyButton · ficha"
        description="En la ficha: primario y grande, fijo al hacer scroll. «Copiado ✓» dura 2 s (--dur-copied); el ancho no cambia entre estados."
        states={COPY_STATES}
        wide
        render={(s) => <CopyButton source={SAMPLE} size="lg" {...copyStateProps(s)} />}
      />

      <SubHeading>Botonera de prueba</SubHeading>
      <p className="text-14 text-text-muted">
        Un botón por categoría de Animaciones. Pulsa y el prompt de prueba queda en tu portapapeles; los
        prompts reales salen de <code>content/</code> a partir de la fase 4. Elige cómo llega el prompt para
        ver cada camino:
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Origen del prompt">
          {MODES.map((m) => (
            <Chip key={m.id} active={mode === m.id} onClick={() => setMode(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>
        <p className="text-12 text-text-muted" aria-live="polite">
          {hint}
        </p>
      </div>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-botonera>
        {BOTONERA.map((item) => (
          <li
            key={item.titulo}
            className="flex flex-col justify-between gap-4 rounded-card border border-border bg-surface p-4"
          >
            <div className="flex flex-col gap-1">
              <p className="text-12 text-text-muted">{item.categoria}</p>
              <p className="text-16 font-medium">{item.titulo}</p>
            </div>
            <CopyButton
              source={sourceFor(item.prompt, mode)}
              label="Copiar prompt"
              what={`Prompt de ${item.titulo}`}
              variant="secundario"
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
