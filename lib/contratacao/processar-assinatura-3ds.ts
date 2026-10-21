import "server-only";
import { isIP } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import { asaasSandbox } from "./asaas-sandbox";
import { garantirAssinaturaApos3ds, type PedidoParaAssinatura3ds } from "./assinatura-apos-3ds";
import { OCORRENCIAS_PUBLICAS } from "./estado-pagamento-publico";
import { checkoutSandboxSeguroNesteServidor } from "./ambiente-checkout";

export async function processarAssinatura3ds(admin: SupabaseClient, orderId: string): Promise<boolean> {
  if (!checkoutSandboxSeguroNesteServidor() || process.env.V2G_CHECKOUT_3DS_SCHEMA_ENABLED !== "true"
      || process.env.V2G_CHECKOUT_3DS_ENABLED !== "true") return false;
  const { data: pedido, error } = await admin.from("commercial_orders")
    .select("id,status,total_cents,provider_card_flow,provider_charge_id,provider_customer_id,provider_first_due_date,provider_subscription_id,subscription_creation_started_at,provider_subscription_first_due_date")
    .eq("id", orderId).maybeSingle();
  if (error || !pedido) return false;
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const objeto = (valor: unknown) => valor && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
  return garantirAssinaturaApos3ds(pedido as PedidoParaAssinatura3ds, {
    lerCobranca: async id => {
      const resposta = await asaasSandbox(`/payments/${id}`);
      return resposta.ok ? objeto(resposta.body) : null;
    },
    lerIpPagador: async () => {
      const contexto = await admin.from("checkout_3ds_context").select("payer_ip,expires_at")
        .eq("order_id", orderId).gt("expires_at", new Date().toISOString()).maybeSingle();
      const ip = typeof contexto.data?.payer_ip === "string" ? contexto.data.payer_ip.replace(/\/\d+$/, "") : "";
      return !contexto.error && isIP(ip) ? ip : null;
    },
    buscarAssinaturas: async id => {
      const resposta = await asaasSandbox(`/subscriptions?externalReference=${encodeURIComponent(id)}&limit=100`);
      const body = objeto(resposta.body);
      return resposta.ok && body?.hasMore === false && Array.isArray(body.data)
        ? body.data.filter((sub: Record<string, unknown>) => sub.externalReference === id) : null;
    },
    semOcorrencias: async () => {
      const movimentos = await admin.from("commercial_payment_events").select("provider_event_id", { count: "exact", head: true })
        .eq("order_id", orderId).eq("provider_charge_id", pedido.provider_charge_id)
        .in("event_type", [...OCORRENCIAS_PUBLICAS]);
      return !movimentos.error && movimentos.count === 0;
    },
    reservar: async vencimento => {
      const resposta = await admin.rpc("reservar_assinatura_apos_3ds", { p_order_id: orderId, p_next_due_date: vencimento });
      return !resposta.error && resposta.data === true;
    },
    criar: async body => {
      const resposta = await asaasSandbox("/subscriptions", { method: "POST", body, timeoutMs: 65000 });
      return resposta.ok ? objeto(resposta.body) : null;
    },
    salvar: async (id, vencimento) => {
      const resposta = await admin.from("commercial_orders").update({ provider_subscription_id: id })
        .eq("id", orderId).eq("status", "payment_approved").eq("provider_card_flow", "initial_3ds")
        .eq("provider_subscription_first_due_date", vencimento).not("subscription_creation_started_at", "is", null)
        .is("provider_subscription_id", null).select("id").maybeSingle();
      const salvo = !resposta.error && !!resposta.data;
      if (salvo) {
        const limpeza = await admin.from("checkout_3ds_context").delete().eq("order_id", orderId);
        if (limpeza.error) console.error("[checkout/3ds] contexto requer limpeza");
      }
      return salvo;
    },
  }, hoje);
}
