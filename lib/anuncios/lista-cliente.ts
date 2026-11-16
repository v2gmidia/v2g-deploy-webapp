import { rotuloStatusMeta, type InventarioMeta, type MetricasMeta } from "./contrato-meta";
import { formatarConversas } from "./conversas-meta";

export type CriativoAssociado = { id: string; nome: string; href: string; imagem?: string | null };
export type AnuncioCliente = {
  id: string; nome: string; contexto: string; status: string;
  filtro: "ativos" | "pausados" | "outros";
  metricas: Array<{ rotulo: string; valor: string | null }>;
  criativos: CriativoAssociado[]; parcial?: boolean; campanha?: string;
};
export type VinculoCriativo = { id: string; business_id: string; external_ad_id: string | null; file_name: string | null };

export function metricasDoCliente(m: MetricasMeta, moeda: string | null) {
  let gasto: string | null = null;
  if (m.gasto !== null && moeda) {
    try { gasto = new Intl.NumberFormat("pt-BR", { style: "currency", currency: moeda }).format(m.gasto / 100); }
    catch { /* Moeda inválida não autoriza assumir reais. */ }
  }
  return [
    { rotulo: "Investido", valor: gasto },
    { rotulo: "Conversas (Meta)", valor: m.conversasMensagem == null ? null : formatarConversas(m.conversasMensagem) },
    { rotulo: "Cliques", valor: m.cliques === null ? null : m.cliques.toLocaleString("pt-BR") },
    { rotulo: "Impressões", valor: m.impressoes === null ? null : m.impressoes.toLocaleString("pt-BR") },
  ];
}

/** Nunca mistura totais de campanha/conjunto com métricas do anúncio. */
export function anunciosParaCliente(leitura: InventarioMeta, vinculos: VinculoCriativo[]): AnuncioCliente[] {
  return leitura.campanhas.flatMap(campanha => campanha.conjuntos.flatMap(conjunto => conjunto.anuncios.map(anuncio => ({
    id: anuncio.id, nome: anuncio.nome || "Anúncio sem nome informado",
    contexto: campanha.nome || "Campanha sem nome informado", campanha: campanha.id,
    status: rotuloStatusMeta(anuncio.statusEfetivo),
    filtro: anuncio.statusEfetivo === "ACTIVE" ? "ativos" as const
      : ["PAUSED", "CAMPAIGN_PAUSED", "ADSET_PAUSED"].includes(anuncio.statusEfetivo ?? "") ? "pausados" as const : "outros" as const,
    metricas: metricasDoCliente(anuncio.metricas, leitura.moeda), parcial: anuncio.metricas.estado === "parcial",
    criativos: vinculos.filter(v => v.business_id === leitura.businessId && v.external_ad_id === anuncio.id)
      .map(v => ({ id: v.id, nome: v.file_name || "Criativo sem nome", href: `/criativos?peca=${encodeURIComponent(`peca-${v.id}`)}` })),
  }))));
}
