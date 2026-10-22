import type { EventoFinanceiro } from "./evento-financeiro";

/** Consulta server-to-server precisa confirmar o mesmo fato, nao o retorno do navegador. */
export function confirmacaoCanonicaConfere(orderId: string, evento: EventoFinanceiro, valor: unknown): boolean {
  return identidadeCanonicaConfere(orderId, evento, valor)
    && ((valor as Record<string, unknown>).status === "CONFIRMED" || (valor as Record<string, unknown>).status === "RECEIVED");
}

function identidadeCanonicaConfere(orderId: string, evento: EventoFinanceiro, valor: unknown): boolean {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const p = valor as Record<string, unknown>;
  return p.id === evento.cobrancaId && p.customer === evento.clienteId && !p.deleted
    && p.billingType === evento.forma && p.dueDate === evento.vencimento
    && (p.subscription ?? null) === evento.assinaturaId && p.externalReference === orderId
    && typeof p.value === "number" && Number.isFinite(p.value)
    && Math.abs(p.value * 100 - evento.valorCentavos) < 0.00001;
}

/** Replay já persistido após estorno não pode recriar recorrência/enviar e-mail
 * nem bloquear a fila. Não cria evento de estorno: aguarda o evento original. */
export function replayEstornadoJaRegistrado(orderId: string, evento: EventoFinanceiro,
  valor: unknown, jaRegistrado: boolean): boolean {
  return jaRegistrado && ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(evento.tipo)
    && identidadeCanonicaConfere(orderId, evento, valor)
    && (valor as Record<string, unknown>).status === "REFUNDED";
}
