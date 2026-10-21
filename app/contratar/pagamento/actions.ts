"use server";

import { iniciarPagamentoInterno, type PagamentoState } from "@/lib/contratacao/iniciar-pagamento";
export type { PagamentoState } from "@/lib/contratacao/iniciar-pagamento";

/** A action pública nunca aceita um atalho de segurança fornecido pelo cliente. */
export async function iniciarPagamento(anterior: PagamentoState, form: FormData): Promise<PagamentoState> {
  return iniciarPagamentoInterno(anterior, form, false);
}
