import { respostasBasicas } from "../onboarding/bloco-um.ts";

export const UUID_AGENCIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export type ContextoAgencia = {
  businessId: string;
  agencyBusinessId?: string;
  agencia: string;
  anunciante: string;
  ramo: string | null;
  praca: string | null;
  verbaMensal: number | null;
  gestor: string | null;
};

/** O parentesco vem da relação; os dados operacionais vêm só do anunciante. */
export function contextoDoAnuncianteVinculado(linha: {
  id: unknown; profile_id: unknown; onboarding: unknown; monthly_budget: unknown;
}, perfilId: string, vinculo: { advertiser_business_id: string; advertiser_name: string; agency_business_id: string }, agencia: string): ContextoAgencia | null {
  if (linha.profile_id !== perfilId || !UUID_AGENCIA.test(perfilId) || linha.id !== vinculo.advertiser_business_id
    || !UUID_AGENCIA.test(vinculo.advertiser_business_id) || !UUID_AGENCIA.test(vinculo.agency_business_id)
    || !agencia.trim() || agencia.length > 200 || !vinculo.advertiser_name.trim() || vinculo.advertiser_name.length > 200) return null;
  const r = respostasBasicas(linha.onboarding);
  const verba = typeof linha.monthly_budget === "number" || typeof linha.monthly_budget === "string" && linha.monthly_budget.trim()
    ? Number(linha.monthly_budget) : NaN;
  return { businessId: vinculo.advertiser_business_id, agencyBusinessId: vinculo.agency_business_id,
    agencia: agencia.trim(), anunciante: vinculo.advertiser_name.trim(), ramo: r.ramo?.texto ?? null,
    praca: r.praca?.texto ?? null, verbaMensal: Number.isFinite(verba) && verba > 0 ? verba : null, gestor: null };
}
export type BuscaAgencia = Record<string, string | string[] | undefined>;
export type RetornoCarteira = { busca: string; pendentes: boolean; pagina: number; etapa?: string; filtroCliente?: string };

/** Um cadastro operacional explícito, não uma associação deduzida por nome. */
export function contextoAgenciaDoCadastro(linha: {
  id: unknown; profile_id: unknown; name: unknown; onboarding: unknown; monthly_budget: unknown;
}, perfilId: string): ContextoAgencia | null {
  if (!UUID_AGENCIA.test(perfilId) || linha.profile_id !== perfilId
    || typeof linha.id !== "string" || !UUID_AGENCIA.test(linha.id)
    || typeof linha.name !== "string" || !linha.name.trim() || linha.name.trim().length > 200) return null;
  const r = respostasBasicas(linha.onboarding);
  if (r.operador?.texto !== "Uma agência ou gestor opera para o anunciante" || !r.nome
    || r.nome.texto.length > 200 || !r.contratante || r.contratante.texto.length > 200) return null;
  const verba = typeof linha.monthly_budget === "number" || typeof linha.monthly_budget === "string"
    && linha.monthly_budget.trim() ? Number(linha.monthly_budget) : NaN;
  return {
    businessId: linha.id, agencia: linha.name.trim(), anunciante: r.nome.texto,
    ramo: r.ramo?.texto ?? null, praca: r.praca?.texto ?? null,
    verbaMensal: Number.isFinite(verba) && verba > 0 ? verba : null, gestor: null,
  };
}

/** URL seleciona apresentação; só o vínculo autenticado pode autorizar. */
export function selecionarVisaoAgencia(contexto: ContextoAgencia | null, busca: BuscaAgencia) {
  if (busca.cliente === undefined) return contexto ? "carteira" as const : "direto" as const;
  return contexto && typeof busca.cliente === "string" && busca.cliente === contexto.businessId
    && UUID_AGENCIA.test(busca.cliente) ? "cliente" as const : "invalido" as const;
}

const textoDeBusca = (v: unknown) => typeof v === "string" ? v.trim().slice(0, 120) : "";
const paginaDeBusca = (v: unknown) => typeof v === "string" && /^[1-9][0-9]{0,3}$/.test(v) ? Number(v) : 1;
export function retornoDaCarteira(busca: BuscaAgencia, noCliente = false): RetornoCarteira {
  const etapa = busca[noCliente ? "etapa_carteira" : "etapa"];
  const filtroCliente = busca[noCliente ? "filtro_cliente_carteira" : "filtro_cliente"];
  return { busca: textoDeBusca(busca[noCliente ? "busca_carteira" : "busca"]),
    pendentes: busca[noCliente ? "pendentes_carteira" : "pendentes"] === "1",
    pagina: paginaDeBusca(busca[noCliente ? "pagina_carteira" : "pagina"]),
    ...(typeof etapa === "string" && ["revisao", "aprovado", "ajustes", "arquivados"].includes(etapa) ? { etapa } : {}),
    ...(typeof filtroCliente === "string" && UUID_AGENCIA.test(filtroCliente) ? { filtroCliente } : {}) };
}
export function hrefDoCliente(area: "/inicio" | "/criativos" | "/anuncios", businessId: string,
  retorno: RetornoCarteira = { busca: "", pendentes: false, pagina: 1 },
  recorte?: { desde: string; ate: string; conta?: string }) {
  if (!UUID_AGENCIA.test(businessId)) return area;
  const p = new URLSearchParams({ cliente: businessId });
  if (retorno.busca) p.set("busca_carteira", retorno.busca.slice(0, 120));
  if (retorno.pendentes) p.set("pendentes_carteira", "1");
  if (retorno.pagina > 1 && retorno.pagina <= 9999) p.set("pagina_carteira", String(retorno.pagina));
  if (retorno.etapa && ["revisao", "aprovado", "ajustes", "arquivados"].includes(retorno.etapa)) p.set("etapa_carteira", retorno.etapa);
  if (retorno.filtroCliente && UUID_AGENCIA.test(retorno.filtroCliente)) p.set("filtro_cliente_carteira", retorno.filtroCliente);
  if (recorte) {
    p.set("desde", recorte.desde);
    p.set("ate", recorte.ate);
    if (recorte.conta && /^act_[0-9]+$/.test(recorte.conta)) p.set("conta", recorte.conta);
  }
  return `${area}?${p}`;
}
export function hrefDaCarteira(area: "/inicio" | "/criativos", retorno: RetornoCarteira) {
  const p = new URLSearchParams();
  if (retorno.busca) p.set("busca", retorno.busca.slice(0, 120));
  if (retorno.pendentes) p.set("pendentes", "1");
  if (retorno.pagina > 1 && retorno.pagina <= 9999) p.set("pagina", String(retorno.pagina));
  if (retorno.etapa && ["revisao", "aprovado", "ajustes", "arquivados"].includes(retorno.etapa)) p.set("etapa", retorno.etapa);
  if (retorno.filtroCliente && UUID_AGENCIA.test(retorno.filtroCliente)) p.set("filtro_cliente", retorno.filtroCliente);
  return `${area}${p.size ? `?${p}` : ""}`;
}
