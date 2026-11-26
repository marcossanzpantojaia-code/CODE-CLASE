"use client";

import { Copy, Heart, Info, Share2, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { ColorPicker } from "@/components/ui/color-picker";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { SearchField } from "@/components/ui/search-field";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastCard, useToast } from "@/components/ui/toast";
import { Tooltip, tooltipBubble } from "@/components/ui/tooltip";

import { Section, StateMatrix, SubHeading, stateProps } from "./layout";

const EASINGS = [
  { value: "power3.inOut", label: "power3.inOut" },
  { value: "expo.inOut", label: "expo.inOut" },
  { value: "sine.inOut", label: "sine.inOut" },
];

/* Valor de ejemplo de un parámetro de demo (contenido, no color de la interfaz). */
const SAMPLE_COLOR = "#ff6b3d"; // kp-permitir-hex: parámetro de ejemplo, igual que el default de item.json

export function ComponentsSection() {
  const toast = useToast();
  const [chips, setChips] = useState<string[]>(["transiciones"]);
  const [duration, setDuration] = useState(0.9);
  const [color, setColor] = useState(SAMPLE_COLOR);
  const [copied, setCopied] = useState(false);

  function toggleChip(id: string) {
    setChips((current) => (current.includes(id) ? current.filter((c) => c !== id) : [...current, id]));
  }

  return (
    <Section
      id="componentes"
      title="Componentes"
      intro="Cada componente con sus seis estados: reposo, hover, foco visible (anillo de 2 px en --accent), activo, deshabilitado y cargando."
    >
      <SubHeading>Botones</SubHeading>
      <StateMatrix
        title="Button · primario"
        render={(s) => <Button {...stateProps(s)}>Copiar prompt</Button>}
      />
      <StateMatrix
        title="Button · secundario"
        render={(s) => (
          <Button variant="secundario" {...stateProps(s)}>
            Repetir
          </Button>
        )}
      />
      <StateMatrix
        title="Button · fantasma"
        render={(s) => (
          <Button variant="fantasma" {...stateProps(s)}>
            Cancelar
          </Button>
        )}
      />
      <StateMatrix
        title="IconButton"
        description="Siempre con nombre accesible. El favorito marcado usa --accent."
        render={(s) => (
          <div className="flex gap-2">
            <IconButton icon={Share2} label="Compartir" {...stateProps(s)} />
            <IconButton
              icon={Heart}
              label="Quitar de favoritos"
              variant="secundario"
              pressed
              {...stateProps(s)}
            />
          </div>
        )}
      />

      <SubHeading>Chips</SubHeading>
      <StateMatrix title="Chip · normal" render={(s) => <Chip {...stateProps(s)}>Scroll</Chip>} />
      <StateMatrix
        title="Chip · activo"
        render={(s) => (
          <Chip active {...stateProps(s)}>
            Transiciones
          </Chip>
        )}
      />

      <SubHeading>Campos</SubHeading>
      <p className="text-14 text-text-muted">
        En los campos, «activo» es el campo en uso: con un valor escrito o elegido.
      </p>
      <StateMatrix
        wide
        title="Input"
        render={(s) => (
          <Input
            label="Nombre del negocio"
            placeholder="Barbería Norte"
            defaultValue={s === "Activo" ? "Barbería del Puerto" : undefined}
            {...stateProps(s)}
          />
        )}
      />
      <Input
        label="Ciudad"
        defaultValue="M"
        error="La ciudad debe tener al menos 2 letras."
        className="max-w-96"
      />
      <StateMatrix
        wide
        title="SearchField"
        render={(s) => (
          <SearchField
            label="Buscar animaciones"
            placeholder="Buscar animaciones"
            shortcut={s === "Reposo"}
            defaultValue={s === "Activo" ? "cortina" : undefined}
            {...stateProps(s)}
          />
        )}
      />
      <StateMatrix
        wide
        title="Select"
        render={(s) => (
          <Select
            label="Easing"
            options={EASINGS}
            defaultValue={s === "Activo" ? "power3.inOut" : undefined}
            {...stateProps(s)}
          />
        )}
      />
      <StateMatrix
        wide
        title="Slider"
        description="El estado se fuerza en el tirador; activo = mientras se arrastra."
        render={(s) => (
          <Slider
            label="Duración"
            min={0.4}
            max={1.6}
            step={0.1}
            defaultValue={0.9}
            unit="s"
            className="w-full"
            {...stateProps(s)}
          />
        )}
      />
      <StateMatrix
        wide
        title="ColorPicker"
        render={(s) => (
          <ColorPicker label="Color de la cortina" defaultValue={SAMPLE_COLOR} {...stateProps(s)} />
        )}
      />

      <SubHeading>Pestañas</SubHeading>
      <StateMatrix
        title="TabsTrigger"
        description="Activo = pestaña seleccionada."
        render={(s) => (
          <Tabs defaultValue={s === "Activo" ? "prompt" : "uso"}>
            <TabsList>
              <TabsTrigger
                value="prompt"
                disabled={s === "Deshabilitado"}
                loading={s === "Cargando"}
                data-force={s === "Hover" ? "hover" : s === "Foco" ? "focus" : undefined}
              >
                Prompt
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      />

      <SubHeading>Juntos, como en una ficha</SubHeading>
      <div className="grid grid-cols-1 gap-6 rounded-panel border border-border bg-surface p-4 md:p-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SearchField label="Buscar en Animaciones" placeholder="Buscar animaciones" shortcut />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de efecto">
            {["transiciones", "scroll", "texto", "microinteracciones"].map((id) => (
              <Chip key={id} active={chips.includes(id)} onClick={() => toggleChip(id)}>
                {id[0]!.toUpperCase() + id.slice(1)}
              </Chip>
            ))}
          </div>
          <Slider
            label="Duración"
            min={0.4}
            max={1.6}
            step={0.1}
            value={duration}
            onValueChange={setDuration}
            unit="s"
          />
          <Select label="Easing" options={EASINGS} defaultValue="power3.inOut" />
          <ColorPicker label="Color de la cortina" value={color} onValueChange={setColor} />
        </div>
        <Tabs defaultValue="prompt">
          <TabsList aria-label="Contenido de la ficha">
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="incluye">Qué incluye</TabsTrigger>
            <TabsTrigger value="uso">Cómo usarlo</TabsTrigger>
          </TabsList>
          <TabsContent value="prompt">
            <pre className="overflow-x-auto rounded-card border border-border bg-surface-2 p-4 font-mono text-14 leading-mono whitespace-pre-wrap">
              {`## 4. Comportamiento paso a paso\n2. Secuencia: duración ${duration.toLocaleString("es-ES")} s, color ${color}.`}
            </pre>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="lg"
                icon={Copy}
                onClick={() => {
                  setCopied(true);
                  toast({
                    title: "Copiado ✓",
                    description: "El prompt está en tu portapapeles.",
                    tone: "exito",
                  });
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Copiado ✓" : "Copiar prompt"}
              </Button>
              <Tooltip content="Vuelve a reproducir la demo">
                <Button variant="secundario">Repetir</Button>
              </Tooltip>
            </div>
          </TabsContent>
          <TabsContent value="incluye">
            <p className="text-14 text-text-muted">
              Estructura, secuencia con tiempos, parámetros, responsive y accesibilidad.
            </p>
          </TabsContent>
          <TabsContent value="uso">
            <p className="text-14 text-text-muted">
              Pega el prompt en Claude Code o Cursor dentro de tu proyecto.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <SubHeading>Avisos (Toast)</SubHeading>
      <p className="text-14 text-text-muted">
        Aparecen con un fundido y 8 px de desplazamiento en 240 ms, y se anuncian a los lectores de pantalla.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ToastCard tone="exito" title="Copiado ✓" description="El prompt está en tu portapapeles." />
        <ToastCard
          tone="aviso"
          title="Te quedan 2 copias este mes"
          description="Se renuevan el 1 de diciembre."
        />
        <ToastCard
          tone="error"
          title="No se ha podido cargar la demo"
          description="Revisa tu conexión y pulsa Reintentar."
        />
        <ToastCard
          tone="info"
          title="Favorito guardado en este navegador"
          description="Inicia sesión para guardarlo en tu cuenta."
        />
      </div>
      <div>
        <Button
          variant="secundario"
          icon={Info}
          onClick={() =>
            toast({ title: "Aviso de prueba", description: "Así aparece un aviso real.", tone: "info" })
          }
        >
          Mostrar un aviso
        </Button>
      </div>

      <SubHeading>Tooltip</SubHeading>
      <div className="flex flex-wrap items-center gap-6">
        <span className={tooltipBubble} role="presentation">
          Pantalla completa
        </span>
        <Tooltip content="Añadir a favoritos">
          <IconButton icon={Heart} label="Añadir a favoritos" variant="secundario" />
        </Tooltip>
        <Tooltip content="Novedad de esta semana">
          <IconButton icon={Sparkles} label="Novedades" />
        </Tooltip>
      </div>

      <SubHeading>Skeleton (cargando)</SubHeading>
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Cargando tarjetas"
      >
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3">
            <Skeleton className="aspect-16/10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
