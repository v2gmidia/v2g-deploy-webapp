import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Substitui a Bahnschrift do protótipo original (exclusiva do Windows,
// não embutida) — ver docs/arquitetura.md, Decisão 6. Auto-hospedada
// pelo Next.js no build: sem chamada de rede em runtime.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "V2G",
  description: "V2G — gestão de tráfego pago com IA para pequenos negócios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
