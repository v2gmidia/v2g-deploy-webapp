/** Transformação pura do contrato e28-07-v1. Não autoriza acesso nem lê rede. */
export const VERSAO_DO_ADAPTADOR = "e28-07-v1";
type Objeto = Record<string, unknown>;
export type Medida<T> = { valor: T | null; motivo: string | null };
type Identidade = { canal: "meta" | "google" | null; contaId: string | null;
  campanhaId: string | null; conjuntoId: string | null; anunciosIds: string[];
  criativosIds: string[]; origemVinculo: string | null; completa: boolean };
export type LeituraDaCampanha = {
  execucaoId: string; identidade: Identidade; fonte: string | null;
  periodo: { desde: string; ate: string }; moeda: string | null; fuso: string | null;
  coletadoEm: string | null; objetivo: string | null; atribuicao: string | null;
  completude: "sem_dados" | "desconhecida" | "inconsistente";
  diasComDados: number; zeroObservado: boolean | null; parcial: boolean;
  carimboAnteriorAoFim: boolean | null; origemHeterogenea: boolean;
  origens: Array<{ canal: "meta" | "google"; campanhaId: string }>;
  medicaoDeResultado: boolean | null;
  metricas: { investimentoCentavos: Medida<number>; impressoes: Medida<number>;
    cliquesTotais: Medida<number>; cliquesNoLink: Medida<number>;
    resultadosAtribuidos: Medida<string>; conversas: Medida<string> };
  motivosDeAusencia: Record<string, string>; avisos: string[];
};
const objeto = (v: unknown): v is Objeto => v !== null && typeof v === "object" && !Array.isArray(v);
const textoOuNulo = (v: unknown): v is string | null => v === null || (typeof v === "string" && v.trim().length > 0 && v.length <= 1000);
const inteiroOuNulo = (v: unknown): v is number | null => v === null || (typeof v === "number" && Number.isSafeInteger(v) && v >= 0);
const boolOuNulo = (v: unknown): v is boolean | null => v === null || typeof v === "boolean";
const lista = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 1000 && v.every((s) => typeof s === "string" && s.length > 0 && s.length <= 200);
export const uuidDaLeitura = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
export function dataDaLeitura(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v) || v.startsWith("0000-")) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
}
function carimbo(v: unknown): v is string | null {
  return v === null || (typeof v === "string" && dataDaLeitura(v.slice(0, 10)) &&
    /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(v) && Number.isFinite(Date.parse(v)));
}
function decimal(v: unknown): string | null | undefined {
  if (v === null) return null;
  if (typeof v === "string" && v.length <= 100 && /^\d+(?:\.\d+)?$/.test(v)) return v;
  // Strings decimais são preservadas sem conversão que perca precisão.
  if (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= Number.MAX_SAFE_INTEGER) return String(v);
  return undefined;
}
function anteriorAoFim(coletado: string | null, fuso: string | null, ate: string): boolean | null {
  if (!coletado) return null;
  if (fuso) {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(coletado));
    const parte = (t: string) => p.find((x) => x.type === t)!.value;
    return `${parte("year")}-${parte("month")}-${parte("day")}` < ate;
  }
  // Sem fuso, só afirmar quando a comparação é inequívoca até nos extremos UTC±14.
  const fim = Date.parse(`${ate}T00:00:00Z`), t = Date.parse(coletado);
  if (t < fim - 14 * 3600_000) return true;
  if (t >= fim + 14 * 3600_000) return false;
  return null;
}

function lerLinha(v: unknown, desde: string, ate: string): LeituraDaCampanha | null {
  if (!objeto(v) || !uuidDaLeitura(v.id_execucao) || !objeto(v.contrato_de_leitura)) return null;
  const c = v.contrato_de_leitura, i = c.identidade;
  if (!objeto(i) || ![null, "meta", "google"].includes(i.canal as string | null) ||
    !["id_conta_anuncio", "id_campanha", "id_conjunto", "origem_vinculo"].every((k) => textoOuNulo(i[k])) ||
    !lista(i.ids_anuncios) || !lista(i.ids_criativos) || typeof i.completa !== "boolean" ||
    ![null, "meta_marketing_api", "google_ads_api"].includes(c.fonte as string | null) ||
    c.desde !== desde || c.ate !== ate ||
    !["moeda", "fuso", "objetivo", "atribuicao"].every((k) => textoOuNulo(c[k])) || !carimbo(c.coletado_em) ||
    !["sem_dados", "desconhecida", "inconsistente"].includes(String(c.completude)) ||
    !inteiroOuNulo(c.dias_com_dados) || c.dias_com_dados === null ||
    !boolOuNulo(c.dados_zerados) || !boolOuNulo(c.medicao_de_resultado) ||
    typeof c.origem_heterogenea !== "boolean" || !Array.isArray(c.origens_metricas) || c.origens_metricas.length > 1000 ||
    !["cliques_total", "cliques_no_link", "impressoes"].every((k) => inteiroOuNulo(c[k])) ||
    decimal(c.resultados_atribuidos) === undefined || decimal(c.conversas) === undefined ||
    !objeto(c.motivos_de_ausencia) || Object.keys(c.motivos_de_ausencia).length > 100 ||
    Object.values(c.motivos_de_ausencia).some((x) => typeof x !== "string" || x.length > 2000)) return null;
  const diasDaJanela = (Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86400_000 + 1;
  if (c.dias_com_dados > diasDaJanela) return null;
  if (i.completa && (!i.canal || !i.id_conta_anuncio || !i.id_campanha || !i.id_conjunto ||
    i.ids_anuncios.length === 0 || i.ids_criativos.length === 0)) return null;
  if (c.fuso) try { new Intl.DateTimeFormat("pt-BR", { timeZone: String(c.fuso) }); } catch { return null; }
  const origens: LeituraDaCampanha["origens"] = [];
  for (const o of c.origens_metricas) {
    if (!objeto(o) || !["meta", "google"].includes(String(o.canal)) || !textoOuNulo(o.id_campanha) || o.id_campanha === null) return null;
    origens.push({ canal: o.canal as "meta" | "google", campanhaId: o.id_campanha });
  }
  const origemDivergente = origens.some((o) => (i.canal !== null && o.canal !== i.canal) ||
    (i.id_campanha !== null && o.campanhaId !== i.id_campanha));
  const heterogenea = c.origem_heterogenea || new Set(origens.map((o) => `${o.canal}:${o.campanhaId}`)).size > 1;
  const motivos = { ...c.motivos_de_ausencia } as Record<string, string>;
  const discrepancia = (v.cliques !== undefined && v.cliques !== null && c.cliques_total !== null && v.cliques !== c.cliques_total) ||
    (v.impressoes !== undefined && v.impressoes !== null && c.impressoes !== null && v.impressoes !== c.impressoes) ||
    (v.moeda !== undefined && v.moeda !== null && c.moeda !== null && v.moeda !== c.moeda);
  const zeroContraditorio = c.dados_zerados === true && [c.cliques_total, c.impressoes, decimal(c.resultados_atribuidos), v.investiu_centavos]
    .some((x) => x !== undefined && x !== null && Number(x) !== 0);
  const semDadosContraditorio = c.completude === "sem_dados" && (c.dias_com_dados !== 0 ||
    [c.cliques_total, c.impressoes, c.resultados_atribuidos, c.conversas, v.investiu_centavos].some((x) => x !== undefined && x !== null));
  const contagemContraditoria = (c.dias_com_dados === 0 && c.completude !== "sem_dados") ||
    (c.dias_com_dados > 0 && origens.length === 0);
  const fonteDivergente = (i.canal === "meta" && c.fonte === "google_ads_api") ||
    (i.canal === "google" && c.fonte === "meta_marketing_api");
  const inconsistente = c.completude === "inconsistente" || heterogenea || origemDivergente || discrepancia ||
    zeroContraditorio || semDadosContraditorio || contagemContraditoria || fonteDivergente;
  const semDados = c.completude === "sem_dados";
  const motivoTotais = motivos.totais || "Os números não formam uma leitura consistente da campanha. Confira a origem antes de decidir.";
  if (inconsistente) motivos.totais = motivoTotais;
  const medida = <T>(valor: T | null, chave: string): Medida<T> => inconsistente
    ? { valor: null, motivo: [motivoTotais, motivos[chave]].filter(Boolean).join(" ") }
    : semDados ? { valor: null, motivo: motivos[chave] || "Não há observações neste período." }
      : { valor, motivo: valor === null ? motivos[chave] || "Informação não fornecida pelo contrato." : null };
  const custo = v.investiu_centavos === undefined ? null : v.investiu_centavos;
  if (!inconsistente && !inteiroOuNulo(custo)) return null;
  const fuso = c.fuso as string | null;
  const anterior = anteriorAoFim(c.coletado_em, fuso, ate);
  return {
    execucaoId: v.id_execucao,
    identidade: { canal: i.canal as Identidade["canal"], contaId: i.id_conta_anuncio as string | null,
      campanhaId: i.id_campanha as string | null, conjuntoId: i.id_conjunto as string | null,
      anunciosIds: [...i.ids_anuncios], criativosIds: [...i.ids_criativos], origemVinculo: i.origem_vinculo as string | null, completa: i.completa },
    fonte: c.fonte as string | null, periodo: { desde, ate }, moeda: c.moeda as string | null, fuso,
    coletadoEm: c.coletado_em, objetivo: c.objetivo as string | null, atribuicao: c.atribuicao as string | null,
    completude: inconsistente ? "inconsistente" : c.completude as LeituraDaCampanha["completude"],
    diasComDados: c.dias_com_dados, zeroObservado: inconsistente || semDados ? null : c.dados_zerados,
    parcial: !semDados && c.dias_com_dados < diasDaJanela, carimboAnteriorAoFim: anterior,
    origemHeterogenea: heterogenea, origens, medicaoDeResultado: c.medicao_de_resultado,
    metricas: {
      investimentoCentavos: medida(custo as number | null, "investiu_centavos"),
      impressoes: medida(c.impressoes as number | null, "impressoes"),
      cliquesTotais: medida(c.cliques_total as number | null, "cliques_total"),
      cliquesNoLink: medida(c.cliques_no_link as number | null, "cliques_no_link"),
      resultadosAtribuidos: medida(decimal(c.resultados_atribuidos)!, "resultados_atribuidos"),
      conversas: medida(decimal(c.conversas)!, "conversas"),
    },
    motivosDeAusencia: motivos,
    avisos: [
      ...(c.completude === "desconhecida" ? ["Completude da coleta desconhecida."] : []),
      ...(!semDados && c.dias_com_dados < diasDaJanela ? ["Há dias do período sem observação."] : []),
      ...(anterior === true ? ["O carimbo de coleta antecede o último dia pedido; a causa não foi determinada."] : []),
      ...(fuso === null ? ["Fuso da conta não informado."] : []),
      ...(!i.completa ? ["Identidade da campanha incompleta."] : []),
      ...(c.fonte === null ? ["Fonte da leitura não informada."] : []),
      ...(inconsistente ? [motivoTotais] : []),
    ],
  };
}

/** Nunca lê totais no topo, nem converte campos irmãos em conversa/venda. */
export function lerPorExecucaoDaCarteira(bruto: unknown, esperado: { businessId: string; desde: string; ate: string }): LeituraDaCampanha[] | null {
  if (!uuidDaLeitura(esperado.businessId) || !dataDaLeitura(esperado.desde) || !dataDaLeitura(esperado.ate) || esperado.desde > esperado.ate ||
    !objeto(bruto) || bruto.business_id !== esperado.businessId || bruto.desde !== esperado.desde || bruto.ate !== esperado.ate ||
    !Array.isArray(bruto.por_execucao) || bruto.por_execucao.length > 1000) return null;
  const linhas: LeituraDaCampanha[] = [], ids = new Set<string>();
  for (const item of bruto.por_execucao) {
    const lida = lerLinha(item, esperado.desde, esperado.ate);
    if (!lida || ids.has(lida.execucaoId)) return null;
    ids.add(lida.execucaoId); linhas.push(lida);
  }
  return linhas;
}
