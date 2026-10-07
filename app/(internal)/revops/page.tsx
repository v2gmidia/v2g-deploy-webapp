import { notFound } from "next/navigation";
import { listarOportunidadesRevOps } from "@/lib/revops/dados";
import { usuarioRevOps } from "@/lib/revops/sessao";
import { tituloDaAba } from "@/lib/titulos";
import { TelaRevOps } from "./TelaRevOps";

export const metadata = tituloDaAba("/revops");
export const dynamic = "force-dynamic";

export default async function RevOpsPage() {
  const user = await usuarioRevOps();
  if (!user) notFound();

  let oportunidades = [] as Awaited<ReturnType<typeof listarOportunidadesRevOps>>;
  let falhaConsulta = false;
  try {
    oportunidades = await listarOportunidadesRevOps();
  } catch (error) {
    console.error("[revops] falha ao consultar ::",
      error instanceof Error ? error.message : "erro desconhecido");
    falhaConsulta = true;
  }

  return <TelaRevOps oportunidades={oportunidades} falhaConsulta={falhaConsulta}
    referencia={crypto.randomUUID()} />;
}
