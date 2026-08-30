import "server-only";

import { createClient } from "@/lib/supabase/server";
import { COLUNAS_DO_CADASTRO, montarCadastro, type NegocioParaCadastro, type Pendencia } from "./montar";


/**
 * As pendências do negócio de quem está logado.
 *
 * As DUAS superfícies de cliente chamam isto — o fim do bloco 2 e o
 * `/inicio`. Compartilhar a função, e não só a copy, é o que garante que
 * elas não divirjam nem no dado: duas consultas com `select` diferentes
 * dariam listas diferentes com o mesmo texto em volta.
 *
 * Lê com o cliente NORMAL, sob RLS. Devolve lista vazia quando não há
 * negócio — quem ainda não passou pelo onboarding não tem pendência de
 * cadastro, tem cadastro nenhum, e são coisas diferentes na tela.
 */
export async function pendenciasDoCliente(): Promise<Pendencia[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("businesses")
    .select(COLUNAS_DO_CADASTRO)
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[cadastro] falha ao ler pendências ::", error.message);
    return [];
  }
  if (!data) return [];

  const r = montarCadastro(data as unknown as NegocioParaCadastro);
  return r.completo ? [] : r.pendencias;
}
