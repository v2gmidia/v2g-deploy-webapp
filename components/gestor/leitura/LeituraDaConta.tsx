import "server-only";
import { anunciosDoGestorAtribuido } from "@/lib/backend/anuncios-do-negocio";
import { InventarioDeAnunciosMeta } from "@/app/(protected)/anuncios/AnunciosMeta";
import { SeletorDePeriodo } from "@/app/(protected)/inicio/SeletorDePeriodo";
import type { IntervaloDoInicio } from "@/lib/inicio/periodo";

/** Default OFF. Sem fixture e sem efeito em Auth/configuração externa. */
export async function LeituraDaConta({ businessId, nome, intervalo, contaId }: {
  businessId: string; nome: string; intervalo: IntervaloDoInicio; contaId?: string;
}) {
  if (process.env.V2G_MANAGER_METRICS_READ_ENABLED !== "true") return null;
  const resultado = await anunciosDoGestorAtribuido({ businessId, desde: intervalo.desde, ate: intervalo.ate, contaId });
  return <section id="leitura-da-carteira" aria-label={`Números de ${nome}`}>
    <div className="section-title"><h2>Números de {nome}</h2></div>
    <SeletorDePeriodo key={`${intervalo.desde}-${intervalo.ate}`} intervalo={intervalo} />
    {intervalo.erro && <p className="form-warning" role="status">{intervalo.erro}</p>}
    <InventarioDeAnunciosMeta resultado={resultado} periodo={intervalo} negocioDoGestor={businessId} contaSolicitada={contaId} />
  </section>;
}
