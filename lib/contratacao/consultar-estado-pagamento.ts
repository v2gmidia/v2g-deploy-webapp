import type { SupabaseClient } from "@supabase/supabase-js";
import { OCORRENCIAS_PUBLICAS, estadoPagamentoPublico, type EstadoPagamentoPublico } from "./estado-pagamento-publico.ts";

export async function consultarEstadoPagamento(admin: Pick<SupabaseClient, "from">,
  pedido: { id: string; status: string; provider_charge_id: string | null }): Promise<EstadoPagamentoPublico> {
  // Sem cobrança inicial ainda não há movimento que possa ser atribuído a ela.
  // Aprovação sem ID não é evidência suficiente de uma consulta financeira limpa.
  if (!pedido.provider_charge_id)
    return estadoPagamentoPublico(pedido.status, [], pedido.status !== "payment_approved");
  try {
    const { data, error } = await admin.from("commercial_payment_events")
      .select("event_type").eq("order_id", pedido.id)
      .eq("provider_charge_id", pedido.provider_charge_id)
      .in("event_type", [...OCORRENCIAS_PUBLICAS])
      .order("received_at", { ascending: false }).limit(100);
    // Limite atingido é consulta parcial, não ausência de ocorrência.
    return estadoPagamentoPublico(pedido.status, data ?? [], !error && !!data && data.length < 100);
  } catch {
    return "verification_unavailable";
  }
}
