/** Só uma recusa explícita e documentada do Asaas permite nova tentativa.
 * Timeout, 5xx e resposta sem código permanecem reservados para conciliação. */
export function cartaoRecusadoSemCobranca(
  status: number, codigo: string | null, descricao: string | null = null,
): boolean {
  if (status !== 400) return false;
  if (codigo === "invalid_creditCard") return true;
  // O Sandbox devolveu invalid_action para essa recusa específica.
  // O código isolado é genérico e nunca basta para liberar a reserva.
  return codigo === "invalid_action" && descricao?.trim()
    === "Transação não autorizada. Verifique os dados do cartão de crédito e tente novamente.";
}

export const MAX_TENTATIVAS_CARTAO = 3;
