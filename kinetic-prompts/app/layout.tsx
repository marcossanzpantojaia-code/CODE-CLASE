import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";

import { UIProviders } from "@/components/ui/providers";

import "./globals.css";

/* Familias del sistema de diseño (docs/PLAN.md). Son fuentes variables: se cargan todos los pesos. */
const display = Bricolage_Grotesque({ subsets: ["latin"], display: "swap", variable: "--font-bricolage" });
const sans = Instrument_Sans({ subsets: ["latin"], display: "swap", variable: "--font-instrument" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Kinetic Prompts",
  description:
    "Biblioteca de prompts para desarrollar webs y animaciones: ve el diseño funcionando, copia su prompt y constrúyelo con tu IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <UIProviders>{children}</UIProviders>
      </body>
    </html>
  );
}
