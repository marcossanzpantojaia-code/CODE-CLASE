import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { UIProviders } from "@/components/ui/providers";

import "./globals.css";

/* Letra estilo iOS 16: en Apple se usa SF Pro del sistema (no se puede servir desde la web por su
 * licencia); en el resto, Inter, que es libre y muy parecida. Ver --family-* en styles/tokens.css. */
const sans = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: "Kinetic Prompts",
  description:
    "Biblioteca de prompts para desarrollar webs y animaciones: ve el diseño funcionando, copia su prompt y constrúyelo con tu IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <UIProviders>{children}</UIProviders>
      </body>
    </html>
  );
}
