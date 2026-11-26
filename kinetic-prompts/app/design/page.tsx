import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DesignShowcase } from "./_components/showcase";

export const metadata: Metadata = {
  title: "Sistema de diseño · Kinetic Prompts",
  robots: { index: false, follow: false },
};

/** Catálogo del sistema de diseño. Solo existe en desarrollo: en producción devuelve 404. */
export default function DesignPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DesignShowcase />;
}
