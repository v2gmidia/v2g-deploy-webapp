import "server-only";
import { lerMetricasDaCarteira } from "@/lib/backend/metricas-da-carteira";
import { DadosDaConta } from "./DadosDaConta";

/** Default OFF. Sem fixture e sem efeito em Auth/configuração externa. */
export async function LeituraDaConta({ businessId, nome, desde, ate }: {
  businessId: string; nome: string; desde: string; ate: string;
}) {
  if (process.env.V2G_MANAGER_METRICS_READ_ENABLED !== "true") return null;
  const resultado = await lerMetricasDaCarteira({ businessId, desde, ate });
  return <DadosDaConta resultado={resultado} nome={nome} />;
}
