/** Preserva os outros blocos do snapshot lido; não faz merge concorrente no banco. */
export function comRespostasDoBlocoUm<T>(
  atual: unknown,
  respostas: Record<string, T>,
): Record<string, unknown> {
  const documento = atual && typeof atual === "object" && !Array.isArray(atual)
    ? (atual as Record<string, unknown>)
    : {};

  return { ...documento, versao: 1, passo: 1, respostas };
}
