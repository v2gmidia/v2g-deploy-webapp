/**
 * Contrato puro para o futuro acesso à mesa. NÃO está ligado às rotas.
 * O chamador precisa obter usuário/papel no servidor e carregar vínculos
 * verificados no banco antes de consultar dados detalhados com service_role.
 */

export type PapelDaMesa = "cliente" | "gestor_v2g" | "gestor_agencia" | "admin_v2g";

export interface NegocioDaMesa {
  id: string;
  agenciaId: string | null;
}

export interface AtribuicaoDaMesa {
  userId: string;
  businessId: string;
  agenciaId: string | null;
  ativa: boolean;
}

export interface MembroDaAgencia {
  userId: string;
  agenciaId: string;
  ativo: boolean;
}

export interface ContextoDaMesa {
  /** ID retornado por auth.getUser(), nunca e-mail ou campo de formulário. */
  userId: string | null;
  /** Papel verificado pelo servidor; user_metadata não é fonte de autorização. */
  papel: PapelDaMesa | null;
  /** Uma consulta paginada/truncada não pode parecer carteira completa. */
  negociosCompletos: boolean;
  atribuicoesCompletas: boolean;
  membrosCompletos: boolean;
  negocios: NegocioDaMesa[];
  atribuicoes: AtribuicaoDaMesa[];
  membros: MembroDaAgencia[];
}

export type ErroDeEscopo = "sem_identidade" | "papel_negado" | "consulta_incompleta";

export type EscopoDaMesa =
  | { ok: true; businessIds: string[] }
  | { ok: false; motivo: ErroDeEscopo };

/**
 * Define apenas IDs elegíveis. Consultas de pedidos, tarefas, arquivos e
 * resultados deverão usar estes IDs como limite ANTES de buscar os dados.
 */
export function escopoDaMesa(contexto: ContextoDaMesa): EscopoDaMesa {
  const userId = contexto.userId?.trim();
  if (!userId) return { ok: false, motivo: "sem_identidade" };
  if (contexto.papel !== "gestor_v2g" && contexto.papel !== "gestor_agencia"
    && contexto.papel !== "admin_v2g") return { ok: false, motivo: "papel_negado" };
  if (!contexto.negociosCompletos || !contexto.atribuicoesCompletas
    || (contexto.papel === "gestor_agencia" && !contexto.membrosCompletos))
    return { ok: false, motivo: "consulta_incompleta" };

  if (contexto.papel === "admin_v2g") {
    return { ok: true, businessIds: [...new Set(contexto.negocios.map((n) => n.id).filter(Boolean))] };
  }

  const atribuicoesAtivas = contexto.atribuicoes.filter((item) => item.userId === userId && item.ativa);
  const agenciasAtivas = new Set(contexto.membros
    .filter((item) => item.userId === userId && item.ativo).map((item) => item.agenciaId));
  const ids = new Set<string>();

  for (const negocio of contexto.negocios) {
    if (!negocio.id) continue;
    const atribuido = atribuicoesAtivas.some((item) => item.businessId === negocio.id
      && (contexto.papel === "gestor_v2g"
        ? item.agenciaId === null
        : Boolean(negocio.agenciaId) && item.agenciaId === negocio.agenciaId
          && agenciasAtivas.has(negocio.agenciaId!)));
    if (atribuido) ids.add(negocio.id);
  }
  return { ok: true, businessIds: [...ids] };
}

export function negocioNaMesa(escopo: EscopoDaMesa, businessId: string): boolean {
  return escopo.ok && Boolean(businessId) && escopo.businessIds.includes(businessId);
}
