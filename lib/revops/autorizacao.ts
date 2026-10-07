export const AUTORIZACAO_REVOPS = "revops";

export interface UsuarioComAppMetadata {
  id: string;
  app_metadata?: Record<string, unknown>;
}

/**
 * A autorização vive em `app_metadata`, que é assinada pelo Supabase e não
 * pode ser editada pelo próprio usuário. O papel genérico de operador não
 * participa desta decisão.
 */
export function temAutorizacaoRevOps(user: UsuarioComAppMetadata | null | undefined): boolean {
  const autorizacoes = user?.app_metadata?.autorizacoes;
  return Array.isArray(autorizacoes) && autorizacoes.includes(AUTORIZACAO_REVOPS);
}

