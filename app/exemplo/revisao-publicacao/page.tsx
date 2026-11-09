import { notFound } from "next/navigation";
import { Casco } from "@/components/ui/Casco";
export default async function RevisaoPublicacaoDeExemplo() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("./Previa") : null;
  if (!modulo) notFound();
  return <Casco nome="Demonstração" nomeNegocio="Negócio fictício" rotuloDaConta="Negócio fictício"
    inicial="D" ehOperador rotaAtiva="/criativos"><modulo.Previa /></Casco>;
}
