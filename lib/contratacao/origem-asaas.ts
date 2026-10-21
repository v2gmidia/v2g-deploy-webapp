/** Origem vem do banco, nunca de campo enviado pelo pagador. */
export function origemAsaasPermitida(pedido: { origin: string; payment_method: string; assisted_operator_id?: string | null }, assistidoAtivo: boolean): boolean {
  if (pedido.payment_method !== "asaas_pix" && pedido.payment_method !== "asaas_card") return false;
  return pedido.origin === "self_service" || (assistidoAtivo && pedido.origin === "assisted"
    && typeof pedido.assisted_operator_id === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pedido.assisted_operator_id));
}
