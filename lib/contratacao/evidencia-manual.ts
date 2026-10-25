import { lerDocumentoContratante } from "./documento-contratante.ts";
import { OCORRENCIAS_PUBLICAS } from "./estado-pagamento-publico.ts";

export const UUID_EVIDENCIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const IMPEDIMENTOS_EVIDENCIA = [...OCORRENCIAS_PUBLICAS, "PAYMENT_OVERDUE"];
export type EvidenciaManual = {
  id: string; business_id: string; order_id: string | null; proposed_profile_id: string | null;
  claimed_email: string; claimed_cnpj: string; source_system: "direct_pix" | "historical_contract";
  source_reference: string; source_date: string; recorded_by: string; recorded_at: string;
  status: "pending" | "checked" | "rejected"; reviewed_by: string | null;
  reviewed_at: string | null; review_note: string | null;
};
export function hojeDaEvidencia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function validarEvidenciaManual(form: FormData, hoje = hojeDaEvidencia()):
  { dados: Pick<EvidenciaManual,"id"|"business_id"|"order_id"|"proposed_profile_id"|"claimed_email"|"claimed_cnpj"|"source_system"|"source_reference"|"source_date">; erro?: never } | { erro: string; dados?: never } {
  const campo = (nome: string) => typeof form.get(nome) === "string" ? String(form.get(nome)).trim() : "";
  const id=campo("id"), business_id=campo("businessId"), order_id=campo("orderId") || null,
    proposed_profile_id=campo("profileId") || null, claimed_email=campo("email").toLowerCase(),
    claimed_cnpj=lerDocumentoContratante(campo("cnpj"))?.numero ?? "", source_system=campo("source"),
    source_reference=campo("reference"), source_date=campo("sourceDate");
  if (![id,business_id,...[order_id,proposed_profile_id].filter((x): x is string => x !== null)].every(x=>UUID_EVIDENCIA.test(x))
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimed_email) || claimed_email.length>254
    || !claimed_cnpj) return {erro:"Confira negócio, pedido, perfil, e-mail e CPF ou CNPJ do contratante exatos. Não use dados aproximados."};
  if (source_system!=="direct_pix" && source_system!=="historical_contract") return {erro:"Informe se a evidência é de Pix ou de contratação histórica."};
  if (source_reference.length<5 || source_reference.length>300 || /[\r\n\x00]/.test(source_reference)) return {erro:"Informe uma referência localizável, de 5 a 300 caracteres, sem senha ou chave."};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(source_date) || !Number.isFinite(Date.parse(source_date+"T12:00:00Z"))
    || new Date(source_date+"T12:00:00Z").toISOString().slice(0,10)!==source_date || source_date>hoje)
    return {erro:"Informe a data real da evidência, sem data futura."};
  return {dados:{id,business_id,order_id,proposed_profile_id,claimed_email,claimed_cnpj,source_system,source_reference,source_date}};
}

/** Projecao documental. Nao e entitlement, aprovacao financeira ou titularidade. */
export function situacaoEvidencia(e: EvidenciaManual, pedido: {id:string;business_id:string|null;status:string;provider_charge_id:string|null}|null,
  eventos: {order_id:string;provider_charge_id:string;event_type:string}[], integra=true) {
  if (!integra || (e.order_id && (!pedido || pedido.id!==e.order_id || pedido.business_id!==e.business_id))) return "verification_unavailable";
  if (e.order_id && (pedido?.status==="cancelled" || eventos.some(x=>x.order_id===e.order_id
    && x.provider_charge_id===pedido?.provider_charge_id && IMPEDIMENTOS_EVIDENCIA.includes(x.event_type)))) return "blocked";
  return e.status;
}
