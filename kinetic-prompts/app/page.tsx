import Link from "next/link";

import { Button } from "@/components/ui/button";

// Marcador hasta la Fase 2, en la que se construye el Inicio real (docs/PLAN.md).
export default function Home() {
  return (
    <main className="mx-auto flex max-w-page flex-col items-start gap-6 px-4 py-16 md:px-6">
      <h1 className="text-40 md:text-64">Kinetic Prompts</h1>
      <p className="text-16 text-text-muted">
        Efectos para tu web listos para copiar. Pulsa uno: lo ves en marcha y su prompt queda en tu
        portapapeles.
      </p>
      <Button asChild size="lg">
        <Link href="/animaciones">Ver animaciones</Link>
      </Button>
    </main>
  );
}
