/** Patch enviado à RPC: os outros blocos são preservados no banco. */
export function patchDoBlocoUm<T>(respostas: Record<string, T>) {
  return { versao: 1, passo: 1, respostas };
}
