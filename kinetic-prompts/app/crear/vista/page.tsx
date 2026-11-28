import type { Metadata } from "next";

import { WebAssembly } from "@/components/builder/web-assembly";
import { getGalleryItems } from "@/lib/gallery";

export const metadata: Metadata = {
  title: "Tu web montada · Kinetic Prompts",
  description: "Las piezas elegidas en el constructor, juntas en una web de ejemplo.",
  robots: { index: false },
};

export default function VistaPage() {
  return (
    <main>
      <WebAssembly items={getGalleryItems()} />
    </main>
  );
}
