import { tituloDaAba } from "@/lib/titulos";

// A página é "use client", e página client não exporta `metadata`. Este
// layout existe só para o título da aba — não desenha nada.
export const metadata = tituloDaAba("/entrar");

export default function EntrarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
