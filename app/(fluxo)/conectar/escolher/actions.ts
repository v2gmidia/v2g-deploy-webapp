"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { listarContasDeAnuncio, listarPaginas } from "@/lib/meta/graph";

export interface EscolhaState {
  erro?: string;
}

/**
 * Grava a conta de anúncio escolhida.
 *
 * A sessão resolve o negócio antes da escrita. A RPC abaixo é restrita ao
 * serviço e grava conta, unidade comprada e página numa transação única.
 * A API autenticada não tem escrita direta em ad_accounts.
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
  const paginaId = String(formData.get("pagina") ?? "").trim();

  if (!contaExterna) return { erro: "Escolha uma conta de anúncio para continuar." };
  if (!paginaId) return { erro: "Escolha a página do seu negócio para continuar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sua sessão expirou. Entre de novo." };

  const ativo = await negocioAtivoDaSessao();
  if (ativo.status !== "selecionado") return { erro: "Escolha um negócio para continuar." };
  if (formData.get("businessId") !== ativo.negocio.id) {
    return { erro: "Você trocou de negócio em outra aba. Atualize esta página antes de salvar." };
  }
  const business = ativo.negocio;

  const { data: conexao } = await supabase
    .from("meta_connections")
    .select("id")
    .eq("business_id", business.id)
    .maybeSingle();
  if (!conexao) return { erro: "A conexão não foi encontrada. Conecte de novo." };

  const admin = createAdminClient();
  const { data: token, error: erroToken } = await admin.rpc("obter_token_meta", {
    p_business_id: business.id,
  });
  if (erroToken || typeof token !== "string" || !token) {
    return { erro: "A conexão expirou. Conecte de novo para escolher a conta." };
  }
  let contaNome = contaExterna;
  let moeda: string | null = null;
  try {
    const [contas, paginas] = await Promise.all([
      listarContasDeAnuncio(token), listarPaginas(token),
    ]);
    const conta = contas.find((item) => item.externalId === contaExterna && item.elegivel);
    if (!conta || !paginas.some((pagina) => pagina.id === paginaId)) {
      return { erro: "Essa conta ou página não está disponível na conexão atual. Atualize a lista." };
    }
    contaNome = conta.nome || contaExterna;
    moeda = conta.moeda || null;
  } catch {
    return { erro: "Não conseguimos conferir as contas agora. Tente de novo em alguns minutos." };
  }

  const { error: erroEscolha } = await admin.rpc("registrar_conta_contratada", {
    p_business_id: business.id,
    p_connection_id: conexao.id,
    p_external_id: contaExterna,
    p_name: contaNome || contaExterna,
    p_currency: moeda,
    p_page_id: paginaId,
  });

  if (erroEscolha) {
    console.error("[conectar] falha ao gravar escolha ::", erroEscolha.message);
    if (erroEscolha.message.includes("sem unidade contratada disponivel")) {
      return { erro: "Todas as contas contratadas já estão em uso. Fale com a equipe para adicionar ou trocar uma conta." };
    }
    if (erroEscolha.message.includes("pedido ainda nao aprovado")) {
      return { erro: "Ainda falta aprovar o pagamento deste negócio para escolher outra conta." };
    }
    return { erro: "Não conseguimos salvar sua escolha. Tente de novo." };
  }

  redirect("/inicio");
}
