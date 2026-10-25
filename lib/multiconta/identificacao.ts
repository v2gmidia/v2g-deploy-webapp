/** cnpj e nome tecnico legado: transporta CPF ou CNPJ do contratante. */
export interface PedidoParaIdentificarNegocio {
  business_id: string | null;
  cnpj: string;
  buyer_email: string | null;
  buyer_profile_id: string | null;
}

/** Recebe apenas pedidos aprovados, ordenados do mais recente ao mais antigo. */
export function cnpjsDoComprador(
  negociosLiberados: string[],
  pedidos: PedidoParaIdentificarNegocio[],
  perfilId: string,
  emailVerificado: string | null,
): Map<string, string> {
  const resultado = new Map<string, string>();
  const ids = new Set(negociosLiberados);
  const email = emailVerificado?.trim().toLowerCase();
  if (!email) return resultado;
  for (const pedido of pedidos) {
    if (!pedido.business_id || !ids.has(pedido.business_id) || resultado.has(pedido.business_id)) continue;
    if (pedido.buyer_email?.trim().toLowerCase() !== email) continue;
    if (pedido.buyer_profile_id !== null && pedido.buyer_profile_id !== perfilId) continue;
    resultado.set(pedido.business_id, pedido.cnpj);
  }
  return resultado;
}
