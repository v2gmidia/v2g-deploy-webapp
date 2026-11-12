import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventoFinanceiro } from "./evento-financeiro";

type ConsultarPagamento = (path: string) => Promise<{ ok: boolean; body: unknown }>;
const indicioPedido = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function objeto(valor: unknown): Record<string, unknown> | null {
  return valor !== null && typeof valor === "object" && !Array.isArray(valor)
    ? valor as Record<string, unknown> : null;
}

function referenciaExterna(valor: unknown): boolean {
  return valor === null || valor === undefined
    || (typeof valor === "string" && !indicioPedido.test(valor));
}

/**
 * Só reconhece uma cobrança externa após leitura canônica e ausência de cliente
 * vinculado. A criação V2G envia o UUID do pedido como externalReference e salva
 * o cliente antes de criar a cobrança. Qualquer dúvida preserva a retentativa.
 * Não confirma pagamento, corrige vínculo ou grava recibo financeiro.
 */
export async function eventoExternoSemPedidoConfirmado(
  admin: SupabaseClient,
  evento: EventoFinanceiro,
  payload: unknown,
  consultar: ConsultarPagamento,
): Promise<boolean> {
  try {
    const recebido = objeto(payload);
    const pagamento = recebido && objeto(recebido.payment);
    if (!pagamento || !referenciaExterna(pagamento.externalReference)) return false;

    const consulta = await consultar(`/payments/${encodeURIComponent(evento.cobrancaId)}`);
    const canonico = consulta.ok && objeto(consulta.body);
    if (!canonico || canonico.deleted
        || canonico.id !== evento.cobrancaId || canonico.customer !== evento.clienteId
        || (canonico.subscription ?? null) !== evento.assinaturaId
        || canonico.billingType !== evento.forma || canonico.dueDate !== evento.vencimento
        || typeof canonico.value !== "number" || !Number.isFinite(canonico.value)
        || Math.abs(canonico.value * 100 - evento.valorCentavos) > 0.00001
        || !referenciaExterna(canonico.externalReference)
        || (canonico.externalReference ?? null) !== (pagamento.externalReference ?? null)) return false;

    // Sem filtro de negócio/origem/status: um cliente ligado a QUALQUER pedido
    // impede o descarte, inclusive durante a criação ainda sem charge/subscription.
    const vinculos = await admin.from("commercial_orders")
      .select("id", { count: "exact", head: true })
      .eq("provider_customer_id", evento.clienteId);
    return !vinculos.error && vinculos.count === 0;
  } catch {
    return false;
  }
}
