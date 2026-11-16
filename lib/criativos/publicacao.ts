/** Declaração humana: aprovação, publicação e entrega são fatos distintos. */
export const COLUNAS_PUBLICACAO = "review_request_id, business_id, content_sha256, ad_account_id, ad_id, published_on, evidence, confirmed_by, confirmed_at, source";
export type PublicacaoConfirmada = {
  review_request_id: string; business_id: string; content_sha256: string;
  ad_account_id: string; ad_id: string; published_on: string; evidence: string;
  confirmed_by: string; confirmed_at: string; source: "manager_declaration";
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function diaValido(valor: unknown): valor is string {
  return typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    && Number.isFinite(Date.parse(`${valor}T12:00:00Z`))
    && new Date(`${valor}T12:00:00Z`).toISOString().slice(0, 10) === valor;
}
export function validarPublicacao(entrada: { id: unknown; conta: unknown; anuncio: unknown; dia: unknown; evidencia: unknown; confirmo: unknown }, hoje: string) {
  if (typeof entrada.id !== "string" || !UUID.test(entrada.id)
    || typeof entrada.conta !== "string" || !/^act_[0-9]{1,40}$/.test(entrada.conta)
    || typeof entrada.anuncio !== "string" || !/^[0-9]{1,40}$/.test(entrada.anuncio)
    || !diaValido(entrada.dia) || entrada.dia > hoje
    || typeof entrada.evidencia !== "string" || entrada.evidencia.trim().length < 10 || entrada.evidencia.trim().length > 2000
    || entrada.confirmo !== "on") return null;
  return { id: entrada.id, conta: entrada.conta, anuncio: entrada.anuncio, dia: entrada.dia, evidencia: entrada.evidencia.trim() };
}
export function lerPublicacao(valor: unknown, pedido: { id: string; business_id: string; sha256: string; status: string }): PublicacaoConfirmada | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor) || pedido.status !== "approved_for_manual_publish") return null;
  const p = valor as Record<string, unknown>;
  if (p.review_request_id !== pedido.id || p.business_id !== pedido.business_id || p.content_sha256 !== pedido.sha256
    || !/^[a-f0-9]{64}$/.test(pedido.sha256) || p.source !== "manager_declaration"
    || typeof p.ad_account_id !== "string" || !/^act_[0-9]{1,40}$/.test(p.ad_account_id)
    || typeof p.ad_id !== "string" || !/^[0-9]{1,40}$/.test(p.ad_id)
    || !diaValido(p.published_on) || typeof p.evidence !== "string" || p.evidence.trim().length < 10 || p.evidence.length > 2000
    || typeof p.confirmed_by !== "string" || !UUID.test(p.confirmed_by)
    || typeof p.confirmed_at !== "string" || !Number.isFinite(Date.parse(p.confirmed_at))) return null;
  return p as PublicacaoConfirmada;
}
export function textoDaPublicacao(p: PublicacaoConfirmada | null, indisponivel = false): string {
  if (indisponivel) return "Não foi possível consultar a confirmação de publicação.";
  if (!p) return "Ainda sem confirmação de publicação.";
  return `Confirmada pelo gestor em ${p.published_on.split("-").reverse().join("/")}. Registro manual; não confirma entrega atual.`;
}
