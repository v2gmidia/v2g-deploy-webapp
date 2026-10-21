import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asaasSandbox } from "./asaas-sandbox";
import { checkoutSandboxSeguroNesteServidor } from "./ambiente-checkout";
import { OCORRENCIAS_PUBLICAS } from "./estado-pagamento-publico";
import { prepararEmailPagamento, despacharEmailPagamento, type EmailNaFila } from "./email-pagamento";

/** Adaptador inicialmente exclusivo QA. Flags falsas nao consultam a tabela nova. */
export async function processarEmailPagamento(admin: SupabaseClient, orderId: string, chargeId: string): Promise<boolean> {
  if (process.env.V2G_PAYMENT_EMAIL_ENABLED !== "true") return true;
  if (!checkoutSandboxSeguroNesteServidor()) return false;
  const key = process.env.V2G_PAYMENT_EMAIL_RESEND_API_KEY;
  const from = process.env.V2G_PAYMENT_EMAIL_FROM;
  const destinoTeste = process.env.V2G_PAYMENT_EMAIL_QA_TO;
  // QA so envia ao destinatario real explicitamente confirmado pelo titular.
  if (!key || !from || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(from)
      || destinoTeste !== "victor.cabral@v2gmidia.com.br") return false;
  try {
    const { data: pedido, error } = await admin.from("commercial_orders")
      .select("id,buyer_email,legal_name,status,total_cents,provider_customer_id,provider_subscription_id,provider_charge_id,billing_period,provider_first_due_date,provider_card_flow")
      .eq("id", orderId).single();
    if (error || !pedido || !pedido.provider_customer_id) return false;
    if (pedido.status !== "payment_approved") return true;
    const resposta = await asaasSandbox(`/payments/${encodeURIComponent(chargeId)}`);
    const pagamento = resposta.body as { id: string; customer: string; subscription?: string | null;
      status: string; value: number; deleted?: boolean; dueDate?: string; externalReference?: string } | null;
    if (!resposta.ok || !pagamento) return false;
    if (["REFUNDED", "REFUND_IN_PROGRESS", "CHARGEBACK_REQUESTED", "CHARGEBACK_DISPUTE", "AWAITING_CHARGEBACK_REVERSAL"].includes(pagamento.status)) return true;
    const primeiraCompra = pedido.provider_charge_id === chargeId;
    if (!primeiraCompra && (pedido.billing_period !== "monthly" || !pedido.provider_subscription_id
      || !pedido.provider_first_due_date || !pagamento.dueDate || pagamento.dueDate <= pedido.provider_first_due_date)) return false;
    const ocorrencias = await admin.from("commercial_payment_events").select("provider_event_id", { count: "exact", head: true })
      .eq("order_id", orderId).eq("provider_charge_id", chargeId).in("event_type", [...OCORRENCIAS_PUBLICAS]);
    if (ocorrencias.error || ocorrencias.count === null) return false;
    if (ocorrencias.count !== 0) return true;
    const mensagem = prepararEmailPagamento({ orderId, email: pedido.buyer_email, negocio: pedido.legal_name,
      statusPedido: pedido.status, totalCentavos: pedido.total_cents, chargeId,
      customerId: pedido.provider_customer_id, subscriptionId: primeiraCompra && pedido.provider_card_flow === "initial_3ds" ? null : pedido.provider_subscription_id,
      primeiraCompra }, pagamento, process.env.NEXT_PUBLIC_SITE_URL ?? "");
    if (!mensagem) return false;
    // Nao enviar dados de comprador QA ficticio a destinatarios arbitrarios.
    const payload = { ...mensagem, from: `V2G <${from}>`, to: [destinoTeste],
      subject: "[TESTE QA] V2G | Pagamento confirmado", text: `[TESTE QA — sem dinheiro real]\n${mensagem.text}` };
    const fila = admin.from("commercial_payment_email_outbox");
    const gravacao = await fila.upsert({ order_id: orderId, provider_charge_id: chargeId, payload },
      { onConflict: "order_id,provider_charge_id", ignoreDuplicates: true });
    if (gravacao.error) return false;
    const existente = await admin.from("commercial_payment_email_outbox").select("id,status,payload")
      .eq("order_id", orderId).eq("provider_charge_id", chargeId).single();
    if (existente.error || !existente.data) return false;
    const item = existente.data as EmailNaFila;
    const resultado = await despacharEmailPagamento(item, {
      reservar: async () => {
        const r = await admin.from("commercial_payment_email_outbox").update({ status: "sending", updated_at: new Date().toISOString() })
          .eq("id", item.id).eq("status", "queued").select("id").maybeSingle();
        return !r.error && !!r.data;
      },
      enviar: async (body, idempotencyKey) => {
        const r = await fetch("https://api.resend.com/emails", { method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
          body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
        const recebido: unknown = await r.json().catch(() => null);
        return r.ok && recebido && typeof recebido === "object" && "id" in recebido && typeof recebido.id === "string" && recebido.id
          ? recebido.id : null;
      },
      registrar: async (status, id) => {
        const r = await admin.from("commercial_payment_email_outbox")
          .update({ status, provider_message_id: id, updated_at: new Date().toISOString() })
          .eq("id", item.id).eq("status", "sending").select("id").maybeSingle();
        return !r.error && !!r.data;
      },
    });
    if (resultado === "review") console.error("[email-pagamento] conciliacao necessaria", item.id);
    // Fato financeiro ja persistido. Falha de transporte nao solicita nova cobranca.
    return true;
  } catch { return false; }
}
