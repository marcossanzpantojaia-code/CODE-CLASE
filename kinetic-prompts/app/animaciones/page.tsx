import type { Metadata } from "next";
import Link from "next/link";

import { AnimationsGallery } from "@/components/catalog/animations-gallery";
import type { GalleryItem } from "@/components/catalog/types";
import { CATEGORIES, LEVELS, contentUrl, defaultPrompt, getPublishedAnimations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Animaciones · Kinetic Prompts",
  description:
    "Transiciones, fondos y efectos para tu web. Pulsa uno: lo ves en marcha y su prompt se copia.",
};

const STEPS = [
  "Elige un efecto",
  "Púlsalo: se reproduce y su prompt se copia",
  "Pégalo en tu IA dentro de tu proyecto",
];

export default function AnimacionesPage() {
  const items: GalleryItem[] = getPublishedAnimations().map((item) => ({
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    category: item.category,
    categoryLabel: CATEGORIES[item.category],
    level: item.difficulty,
    levelLabel: LEVELS[item.difficulty],
    tech: item.tech,
    prompt: defaultPrompt(item),
    poster: item.media.poster ? contentUrl(item, item.media.poster) : undefined,
    video: item.media.video ? contentUrl(item, item.media.video) : undefined,
    videoMp4: item.media.videoMp4 ? contentUrl(item, item.media.videoMp4) : undefined,
  }));

  return (
    <main className="mx-auto flex max-w-page flex-col gap-8 px-4 py-8 md:px-6">
      <header className="flex flex-col gap-4">
        <Link
          href="/"
          className="w-fit rounded-control font-display text-20 font-bold tracking-display text-text outline-none kp-focus:outline-(length:--focus-w) kp-focus:outline-offset-2 kp-focus:outline-accent kp-focus:outline-solid"
        >
          Kinetic Prompts
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-40 md:text-64">Animaciones</h1>
          <ol className="flex flex-wrap gap-x-6 gap-y-1 text-14 text-text-muted">
            {STEPS.map((step, i) => (
              <li key={step}>
                <span className="font-mono text-text">{i + 1}</span> {step}
              </li>
            ))}
          </ol>
        </div>
      </header>
      <AnimationsGallery items={items} />
    </main>
  );
}
