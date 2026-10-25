import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventoFinanceiro } from "./evento-financeiro";
import { asaasSandbox } from "./asaas-sandbox";
import { vencimentoNoMesSeguinte } from "./fluxo-cartao-mensal";

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
}
function valorConfere(valor: unknown, centavos: number): boolean {
  return typeof valor === "number" && Number.isFinite(valor)
    && Math.abs(valor * 100 - centavos) < 0.00001;
}

/** Somente após o guard QA/Sandbox e a ausência de vínculo sem erro de consulta.
 * Reconhece limpeza pelo estado canônico e evidências persistidas, sem reparar
 * vínculo ou gravar evento. Ausência, divergência e indisponibilidade falham fechado. */
export async function reconhecerEnsaioEncerrado(admin: SupabaseClient,
  evento: EventoFinanceiro, payload: unknown): Promise<boolean> {
  if (evento.tipo !== "PAYMENT_CREATED" || evento.forma !== "CREDIT_CARD" || !evento.assinaturaId) return false;
  const recebido = objeto(objeto(payload)?.payment);
  if (recebido?.status !== "PENDING") return false;
  try {
    const resposta = await asaasSandbox(`/payments/${encodeURIComponent(evento.cobrancaId)}`);
    const parcela = resposta.ok ? objeto(resposta.body) : null;
    const referencia = parcela?.externalReference;
    if (!parcela || typeof referencia !== "string"
        || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(referencia)
        || recebido.externalReference !== referencia || parcela.id !== evento.cobrancaId
        || parcela.customer !== evento.clienteId || parcela.subscription !== evento.assinaturaId
        || parcela.billingType !== evento.forma || parcela.dueDate !== evento.vencimento
        || !valorConfere(parcela.value, evento.valorCentavos)
        || parcela.deleted !== true || parcela.status !== "PENDING") return false;

    const consulta = await admin.from("commercial_orders")
      .select("id,business_id,status,origin,payment_method,billing_period,total_cents,provider_customer_id,provider_charge_id,provider_subscription_id,provider_first_due_date,provider_checkout_id,provider_card_flow,subscription_creation_started_at,provider_subscription_first_due_date")
      .eq("id", referencia).maybeSingle();
    const pedido = consulta.data;
    if (consulta.error || !pedido || pedido.id !== referencia || pedido.origin !== "self_service"
        || pedido.status !== "payment_approved" || pedido.provider_card_flow !== "initial_3ds"
        || pedido.payment_method !== "asaas_card" || pedido.billing_period !== "monthly"
        || pedido.total_cents !== evento.valorCentavos || pedido.provider_customer_id !== evento.clienteId
        || pedido.provider_subscription_id !== null || pedido.provider_checkout_id !== null
        || !pedido.business_id || !pedido.subscription_creation_started_at
        || !/^pay_[A-Za-z0-9]+$/.test(pedido.provider_charge_id ?? "")
        || pedido.provider_charge_id === evento.cobrancaId
        || typeof pedido.provider_first_due_date !== "string"
        || vencimentoNoMesSeguinte(pedido.provider_first_due_date) !== evento.vencimento
        || pedido.provider_subscription_first_due_date !== evento.vencimento) return false;
    const negocio = await admin.from("businesses").select("id,dados_ficticios")
      .eq("id", pedido.business_id).maybeSingle();
    if (negocio.error || negocio.data?.id !== pedido.business_id || negocio.data?.dados_ficticios !== true) return false;
    const ledger = await admin.from("commercial_payment_events")
      .select("provider_event_id", { count: "exact", head: true })
      .eq("order_id", pedido.id).eq("provider_charge_id", pedido.provider_charge_id)
      .is("provider_subscription_id", null).in("event_type", ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"])
      .eq("amount_cents", evento.valorCentavos).eq("due_date", pedido.provider_first_due_date);
    if (ledger.error || !ledger.count) return false;

    const assinaturaResposta = await asaasSandbox(`/subscriptions/${encodeURIComponent(evento.assinaturaId)}`);
    const assinatura = assinaturaResposta.ok ? objeto(assinaturaResposta.body) : null;
    if (!assinatura || assinatura.id !== evento.assinaturaId || assinatura.customer !== evento.clienteId
        || assinatura.externalReference !== pedido.id || assinatura.billingType !== evento.forma
        || !valorConfere(assinatura.value, evento.valorCentavos) || assinatura.cycle !== "MONTHLY"
        || assinatura.deleted !== true || assinatura.status !== "INACTIVE"
        || assinatura.nextDueDate !== vencimentoNoMesSeguinte(evento.vencimento)) return false;
    const inicialResposta = await asaasSandbox(`/payments/${encodeURIComponent(pedido.provider_charge_id)}`);
    const inicial = inicialResposta.ok ? objeto(inicialResposta.body) : null;
    if (!inicial || inicial.id !== pedido.provider_charge_id || inicial.customer !== evento.clienteId
        || inicial.externalReference !== pedido.id || (inicial.subscription ?? null) !== null
        || inicial.billingType !== evento.forma || inicial.dueDate !== pedido.provider_first_due_date
        || !valorConfere(inicial.value, evento.valorCentavos) || inicial.status !== "REFUNDED" || inicial.deleted === true
        || !Array.isArray(inicial.refunds)) return false;
    const estornos = inicial.refunds.map(objeto);
    if (estornos.some(item => !item || !["DONE", "CANCELLED"].includes(String(item.status)))) return false;
    if (estornos.some(item => item?.status === "DONE" && (typeof item.value !== "number"
      || item.value <= 0 || !Number.isSafeInteger(Math.round(item.value * 100))
      || !valorConfere(item.value, Math.round(item.value * 100))))) return false;
    const total = estornos.filter(item => item?.status === "DONE")
      .reduce((soma, item) => soma + (typeof item?.value === "number" ? item.value : NaN), 0);
    return valorConfere(total, evento.valorCentavos);
  } catch { return false; }
}
