import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kinetic Prompts",
  description:
    "Biblioteca de prompts para desarrollar webs y animaciones: ve el diseño funcionando, copia su prompt y constrúyelo con tu IA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
