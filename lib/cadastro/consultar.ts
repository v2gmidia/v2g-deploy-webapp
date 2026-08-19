import "server-only";

import { createClient } from "@/lib/supabase/server";
import { montarCadastro, type NegocioParaCadastro, type Pendencia } from "./montar";

/**
 * As colunas que `montarCadastro` lê. Uma constante, e não uma string
 * repetida em cada `select`: uma tela que esquecesse `monthly_budget`
 * receberia `undefined`, e `montarCadastro` chamaria de pendência um campo
 * que está preenchido. A tela mentiria sem erro em lugar nenhum.
 */
export const COLUNAS_DO_CADASTRO =
  "id, name, description, avg_ticket_min, avg_ticket_max, avg_direct_cost, " +
  "target_profit_per_customer, monthly_budget, cep, site_url, instagram_handle, " +
  "atende_somente_no_local, differentiators, guarantee, delivery_time, " +
  "payment_policy, business_hours, availability, onboarding";

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
