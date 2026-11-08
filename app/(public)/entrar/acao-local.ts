/** Falha de transporte não prova que a operação no servidor deixou de ocorrer. */
export async function executarComFeedback<T>(acao: () => Promise<T>, falha: T): Promise<T> {
  try { return await acao(); }
  catch (erro) {
    const digest = erro && typeof erro === "object" && "digest" in erro ? erro.digest : null;
    // Preservar a navegação sinalizada pelo Next, inclusive após salvar a senha.
    if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_HTTP_ERROR_FALLBACK"))) throw erro;
    return falha;
  }
}
