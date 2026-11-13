import type { AcessoContratado } from "./acesso-contratado";

type Titular = { id: string; email?: string | null; email_confirmed_at?: string | null };
type Concessao = Pick<AcessoContratado, "id" | "business_id" | "recipient_email" | "accepted_by" | "accepted_at" | "revoked_at">;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Session-owned accepted grant only. This does not validate or grant Meta permissions. */
export function parametrosContaAcessoContratado(entrada: {
  titular: Titular; concessoes: Concessao[]; businessId: string; connectionId: string;
  externalId: string; name: string; currency: string | null; pageId: string; agora?: number;
}) {
  const { titular: user } = entrada;
  const email = user.email?.trim().toLowerCase();
  if (!user.email_confirmed_at || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !UUID.test(user.id) || !UUID.test(entrada.businessId) || !UUID.test(entrada.connectionId)
    || !/^act_[0-9]{1,40}$/.test(entrada.externalId) || !/^[0-9]{1,40}$/.test(entrada.pageId)
    || entrada.name.length > 200 || entrada.currency !== null && !/^[A-Z]{3}$/.test(entrada.currency)) return null;
  const agora = entrada.agora ?? Date.now();
  const candidatas = entrada.concessoes.filter(g => UUID.test(g.id) && g.business_id === entrada.businessId
    && g.accepted_by === user.id && g.recipient_email === email && g.revoked_at === null
    && g.accepted_at !== null && Number.isFinite(Date.parse(g.accepted_at)) && Date.parse(g.accepted_at) <= agora);
  const concessao = candidatas[0];
  if (candidatas.length !== 1 || !concessao) return null;
  return { p_access_id: concessao.id, p_profile_id: user.id, p_email: email,
    p_business_id: entrada.businessId, p_connection_id: entrada.connectionId, p_external_id: entrada.externalId,
    p_name: entrada.name, p_currency: entrada.currency, p_page_id: entrada.pageId };
}
