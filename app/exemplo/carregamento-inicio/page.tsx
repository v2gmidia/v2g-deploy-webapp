import { notFound } from "next/navigation";
import { Casco } from "@/components/ui/Casco";

export const metadata = { title: "Carregamentos do Início — prévia local", robots: { index: false, follow: false } };

export default async function PreviaCarregamentoInicio() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_carregamento-inicio/Previa") : null;
  if (!modulo) notFound();
  return <Casco nome="Pessoa fictícia" nomeNegocio="Negócio de exemplo" rotuloDaConta="Negócio de exemplo" inicial="N" rotaAtiva="/inicio"><modulo.PreviaCarregamentoInicio /></Casco>;
}
