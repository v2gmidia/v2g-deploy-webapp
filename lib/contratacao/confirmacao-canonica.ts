import type { EventoFinanceiro } from "./evento-financeiro";

/** Consulta server-to-server precisa confirmar o mesmo fato, nao o retorno do navegador. */
export function confirmacaoCanonicaConfere(orderId: string, evento: EventoFinanceiro, valor: unknown): boolean {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return false;
  const p = valor as Record<string, unknown>;
  return p.id === evento.cobrancaId && p.customer === evento.clienteId && !p.deleted
    && p.billingType === evento.forma && p.dueDate === evento.vencimento
    && (p.subscription ?? null) === evento.assinaturaId && p.externalReference === orderId
    && (p.status === "CONFIRMED" || p.status === "RECEIVED")
    && typeof p.value === "number" && Number.isFinite(p.value)
    && Math.abs(p.value * 100 - evento.valorCentavos) < 0.00001;
}
