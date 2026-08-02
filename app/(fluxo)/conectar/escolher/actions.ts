"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface EscolhaState {
  erro?: string;
}

/**
 * Grava a conta de anúncio escolhida.
 *
 * Escreve com o cliente NORMAL, não com o admin: quem está escolhendo é
 * o usuário logado, e a RLS já garante que ele só alcança o próprio
 * negócio. Usar `service_role` aqui seria ignorar a proteção sem motivo.
 *
 * Grava também `meta_page_id`, que é OBRIGATÓRIO para publicar:
 * `object_story_spec.page_id` não tem valor padrão, e sem ele não existe
 * criativo de anúncio. Não grava `instagram_account_id` — ver a nota em
 * `lib/meta/graph.ts`.
 */
export async function salvarEscolhaAction(
  _prev: EscolhaState,
  formData: FormData,
): Promise<EscolhaState> {
  const contaExterna = String(formData.get("conta") ?? "").trim();
  const contaNome = String(formData.get("contaNome") ?? "").trim();
  const moeda = String(formData.get("moeda") ?? "").trim() || null;
  const paginaId = String(formData.get("pagina") ?? "").trim();

  if (!contaExterna) return { erro: "Escolha uma conta de anúncio para continuar." };
  if (!paginaId) return { erro: "Escolha a página do seu negócio para continuar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!business) return { erro: "Não encontramos seu negócio." };

  const { data: conexao } = await supabase
    .from("meta_connections")
    .select("id")
    .eq("business_id", business.id)
    .maybeSingle();
  if (!conexao) return { erro: "A conexão não foi encontrada. Conecte de novo." };

  // `ownership: 'cliente'` — a conta é do próprio cliente, não da V2G.
  // A coluna existe desde a 0005 justamente para essa distinção.
  const { error: erroConta } = await supabase.from("ad_accounts").upsert(
    {
      business_id: business.id,
      meta_connection_id: conexao.id,
      external_id: contaExterna,
      name: contaNome || contaExterna,
      currency: moeda,
      ownership: "cliente",
      status: "ok",
      is_active: true,
    },
    { onConflict: "business_id,external_id" },
  );

  if (erroConta) {
    console.error("[conectar] falha ao gravar ad_account ::", erroConta.message);
    return { erro: "Não conseguimos salvar sua escolha. Tente de novo." };
  }

  // A página é obrigatória para publicar, então a falha aqui NÃO é
  // silenciosa: sem ela a conexão fica pela metade e o cliente só
  // descobriria na hora de subir o anúncio.
  const { error: erroPagina } = await supabase
    .from("meta_connections")
    .update({ meta_page_id: paginaId })
    .eq("id", conexao.id);

  if (erroPagina) {
    console.error("[conectar] falha ao gravar meta_page_id ::", erroPagina.message);
    return { erro: "Salvamos a conta, mas não a página. Tente de novo." };
  }

  redirect("/inicio");
}
