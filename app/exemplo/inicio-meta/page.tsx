import { notFound } from "next/navigation";
import { Casco } from "@/components/ui/Casco";
export default async function InicioMetaDeExemplo() {
  const modulo = process.env.NODE_ENV !== "production" ? await import("../_inicio_meta/Previa") : null;
  if (!modulo) notFound();
  return <Casco nome="Pessoa fictícia" rotuloDaConta="Negócio fictício" inicial="F" rotaAtiva="/inicio"><modulo.PreviaInicioMeta /></Casco>;
}
