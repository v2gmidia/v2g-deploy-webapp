/**
 * Contrato e28-meta-ads-read-v1, docs/contratos/e28-meta-ads-read-v1.md do backend,
 * concluído em 29/10/2026. Não conhece conta ou cliente fixos.
 */
export type PeriodoMeta = { desde: string; ate: string };
export type MetricasMeta = {
  estado: "observado" | "sem_dados" | "zero_medido" | "parcial";
  gasto: number | null;
  impressoes: number | null;
  cliques: number | null;
  conversas: string | null;
  dias: string[];
  entregaObservada: boolean | null;
};
export type ObjetoMeta = {
  id: string; nome: string | null; statusConfigurado: string | null;
  statusEfetivo: string | null; metricas: MetricasMeta;
};
export type AnuncioMeta = ObjetoMeta & { campanhaId: string; conjuntoId: string };
export type ConjuntoMeta = ObjetoMeta & { campanhaId: string; anuncios: AnuncioMeta[] };
export type CampanhaMeta = ObjetoMeta & { conjuntos: ConjuntoMeta[] };
export type ContextoMeta = {
  businessId: string; contaId: string; periodo: PeriodoMeta;
  moeda: string | null; fuso: string | null; coletadoEm: string;
};
export type LeituraMeta = ContextoMeta & { campanha: CampanhaMeta };
export type InventarioMeta = ContextoMeta & { campanhas: CampanhaMeta[] };
export type ResultadoAnunciosMeta =
  | { ok: true; dados: LeituraMeta }
  | { ok: false; motivo: "acesso" | "sem_conta" | "indisponivel" | "escopo" | "periodo" | "resposta"; mensagem: string };
export type ContaMetaParaConsulta = { id: string };
export type ResultadoInventarioMeta = (
  | { ok: true; dados: InventarioMeta }
  | { ok: false; motivo: "acesso" | "sem_conta" | "escolher_conta" | "indisponivel" | "escopo" | "periodo" | "resposta" | "fonte"; mensagem: string }
) & { contas: ContaMetaParaConsulta[]; contaSelecionada: string | null };

const registro = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
export const idMeta = (v: unknown): v is string => typeof v === "string" && /^[0-9]{1,40}$/.test(v);
export const uuidMeta = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const texto = (v: unknown): v is string | null => v === null || (typeof v === "string" && v.length <= 500);
const inteiro = (v: unknown): v is number | null => v === null || (typeof v === "number" && Number.isSafeInteger(v) && v >= 0);
const dia = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)
  && Number.isFinite(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
export function periodoMetaValido(p: PeriodoMeta): boolean {
  return dia(p.desde) && dia(p.ate) && p.desde <= p.ate
    && (Date.parse(p.ate) - Date.parse(p.desde)) / 86400000 < 31;
}

/** IDs e período esperados vêm da consulta autorizada, não da resposta. Falha invalida o lote inteiro. */
export function lerContratoMeta(raw: unknown, esperado: {
  businessId: string; contaId: string; campanhaId: string; periodo: PeriodoMeta;
}): LeituraMeta | null {
  if (!registro(raw) || !idMeta(esperado.campanhaId)) return null;
  const inventario = lerInventarioMeta({ ...raw, campanhas: [raw.campanha] }, esperado);
  const campanha = inventario?.campanhas[0];
  return inventario && campanha?.id === esperado.campanhaId ? { ...inventario, campanha } : null;
}

/** Coleção é a descoberta: inventário vazio não é falha nem medição zerada. */
export function lerInventarioMeta(raw: unknown, esperado: {
  businessId: string; contaId: string; periodo: PeriodoMeta;
}): InventarioMeta | null {
  if (!uuidMeta(esperado.businessId) || !/^act_[0-9]{1,40}$/.test(esperado.contaId)
    || !periodoMetaValido(esperado.periodo)) return null;
  if (!registro(raw) || raw.versao !== "e28-meta-ads-read-v1" || raw.business_id !== esperado.businessId
    || raw.conta_id !== esperado.contaId || raw.id_execucao !== null || raw.origem_vinculo !== "ad_accounts"
    || raw.fonte !== "meta_marketing_api" || !registro(raw.periodo)
    || raw.periodo.desde !== esperado.periodo.desde || raw.periodo.ate !== esperado.periodo.ate
    || !(raw.moeda === null || (typeof raw.moeda === "string" && /^[A-Z]{3}$/.test(raw.moeda)))
    || !texto(raw.fuso) || typeof raw.coletado_em !== "string"
    || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(raw.coletado_em)
    || !Number.isFinite(Date.parse(raw.coletado_em)) || !Array.isArray(raw.avisos)
    || !raw.avisos.every(v => typeof v === "string")) return null;

  const moeda = raw.moeda;
  function metricas(m: unknown): MetricasMeta | null {
    if (!registro(m) || !["observado", "sem_dados", "zero_medido", "parcial"].includes(String(m.estado))
      || !inteiro(m.gasto_centavos) || !inteiro(m.impressoes) || !inteiro(m.cliques_totais)
      || !inteiro(m.cliques_no_link) || !(m.conversas_whatsapp === null || (typeof m.conversas_whatsapp === "string"
        && /^\d{1,15}(?:\.\d{1,6})?$/.test(m.conversas_whatsapp)))
      || !(m.entrega_observada_no_periodo === null || typeof m.entrega_observada_no_periodo === "boolean")
      || !Array.isArray(m.dias_com_observacao) || !m.dias_com_observacao.every(d => dia(d)
        && d >= esperado.periodo.desde && d <= esperado.periodo.ate)
      || new Set(m.dias_com_observacao).size !== m.dias_com_observacao.length
      || !Array.isArray(m.motivos) || !m.motivos.every(v => typeof v === "string")
      || (moeda === null && m.gasto_centavos !== null)) return null;
    const dias = m.dias_com_observacao as string[];
    if (m.estado === "sem_dados" && (dias.length || [m.gasto_centavos, m.impressoes, m.cliques_totais,
      m.cliques_no_link, m.conversas_whatsapp, m.entrega_observada_no_periodo].some(v => v !== null))) return null;
    if (m.estado !== "sem_dados" && !dias.length) return null;
    if (m.estado === "zero_medido" && (m.gasto_centavos !== 0 || m.impressoes !== 0 || m.cliques_totais !== 0)) return null;
    if (m.estado === "observado" && [m.gasto_centavos, m.impressoes, m.cliques_totais].some(v => v === null)) return null;
    const entrega = (m.impressoes !== null && m.impressoes > 0) || (m.gasto_centavos !== null && m.gasto_centavos > 0)
      ? true : m.impressoes === 0 && m.gasto_centavos === 0 ? false : null;
    if (m.entrega_observada_no_periodo !== entrega) return null;
    return { estado: m.estado as MetricasMeta["estado"], gasto: m.gasto_centavos, impressoes: m.impressoes,
      cliques: m.cliques_totais, conversas: m.conversas_whatsapp as string | null,
      dias, entregaObservada: m.entrega_observada_no_periodo };
  }
  const ids = new Set<string>();
  function objeto(v: unknown): ObjetoMeta | null {
    if (!registro(v) || !idMeta(v.id) || ids.has(v.id) || !texto(v.nome)
      || !texto(v.status_configurado) || !texto(v.status_efetivo)) return null;
    const m = metricas(v.metricas);
    if (!m) return null;
    ids.add(v.id);
    return { id: v.id, nome: v.nome, statusConfigurado: v.status_configurado, statusEfetivo: v.status_efetivo, metricas: m };
  }
  if (!Array.isArray(raw.campanhas) || raw.campanhas.length > 500) return null;
  const campanhas: CampanhaMeta[] = [];
  for (const c of raw.campanhas) {
    const campanha = objeto(c);
    if (!campanha || !registro(c) || !Array.isArray(c.conjuntos) || c.conjuntos.length > 500) return null;
    const conjuntos: ConjuntoMeta[] = [];
    for (const g of c.conjuntos) {
      const conjunto = objeto(g);
      if (!conjunto || !registro(g) || g.campanha_id !== campanha.id || !Array.isArray(g.anuncios) || g.anuncios.length > 500) return null;
      const anuncios: AnuncioMeta[] = [];
      for (const a of g.anuncios) {
        const anuncio = objeto(a);
        if (!anuncio || !registro(a) || a.campanha_id !== campanha.id || a.conjunto_id !== conjunto.id) return null;
        anuncios.push({ ...anuncio, campanhaId: campanha.id, conjuntoId: conjunto.id });
      }
      conjuntos.push({ ...conjunto, campanhaId: campanha.id, anuncios });
    }
    campanhas.push({ ...campanha, conjuntos });
  }
  return { businessId: esperado.businessId, contaId: esperado.contaId,
    periodo: { desde: esperado.periodo.desde, ate: esperado.periodo.ate },
    moeda: raw.moeda as string | null, fuso: raw.fuso, coletadoEm: raw.coletado_em, campanhas };
}

/** Estado configurado/efetivo não é prova de veiculação atual. Nunca escreve “no ar”. */
export function rotuloStatusMeta(status: string | null): string {
  const rotulos: Record<string, string> = {
    ACTIVE: "Ativado na Meta", PAUSED: "Pausado", CAMPAIGN_PAUSED: "Campanha pausada", ADSET_PAUSED: "Conjunto pausado",
    PENDING_REVIEW: "Em análise", IN_PROCESS: "Preparando", PENDING_PROCESSING: "Preparando", PROCESSING: "Preparando",
    WITH_ISSUES: "Precisa de conferência", DISAPPROVED: "Reprovado", ARCHIVED: "Arquivado", DELETED: "Excluído",
    PENDING_BILLING_INFO: "Pagamento precisa de conferência", PREAPPROVED: "Pré-aprovado",
  };
  return status !== null && Object.hasOwn(rotulos, status) ? rotulos[status]! : "Status não informado";
}
