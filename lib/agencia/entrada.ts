import "server-only";
import { carregarAgenciaDaSessao } from "./da-sessao";
import type { BuscaAgencia } from "./contexto";

/** Só apresentação QA; não cria vínculo, contrato nem liberação financeira. */
export async function entradaDoOnboardingDaAgencia(busca: BuscaAgencia = {}) {
  const agencia = await carregarAgenciaDaSessao();
  if (agencia.status === "indisponivel") return "indisponivel" as const;
  if (agencia.status !== "agencia" || agencia.businessIdAtivo !== agencia.agencyBusinessId)
    return "anunciante" as const;
  // Compatibilidade com o Dúú histórico: o mesmo ID ainda guarda os dados do
  // anunciante. Só a escolha explícita e conferida abre esse cadastro, sem movê-lo.
  return agencia.contexto && typeof busca.cliente === "string"
    && busca.cliente === agencia.contexto.businessId ? "anunciante" as const : "carteira" as const;
}
