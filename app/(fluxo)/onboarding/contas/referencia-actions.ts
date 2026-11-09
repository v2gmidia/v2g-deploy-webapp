"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { conferirCadastroOperacionalSeCompleto } from "@/lib/pipeline/conferir-cadastro-operacional";
import { lerOfertaDoOnboarding, prepararReferenciaDePreco } from "@/lib/onboarding/referencia-preco";
export interface EstadoReferenciaPreco { ok?: string; erro?: string; aviso?: string }
export async function salvarReferenciaPrecoAction(_anterior: EstadoReferenciaPreco, dados: FormData): Promise<EstadoReferenciaPreco> {
  const supabase = await createClient();
  const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !user) return { erro: "Sua sessão expirou. Entre novamente para salvar." };
  const ativo = await negocioAtivoDaSessao();
  const negocioId = dados.get("businessId");
  if (ativo.status !== "selecionado" || typeof negocioId !== "string" || ativo.negocio.id !== negocioId)
    return { erro: "Escolha o negócio correto antes de salvar essa referência." };
  const texto = (nome: string) => typeof dados.get(nome) === "string" ? String(dados.get(nome)) : "";
  const preparado = prepararReferenciaDePreco({ minimo: texto("minimo"), maximo: texto("maximo"), unidade: texto("unidade"), certeza: texto("certeza") },
    "Informado pela pessoa autenticada nesta operação", new Date().toISOString());
  if (preparado.estado === "erro") return { erro: preparado.erro };
  if (preparado.estado === "sem_alteracao") return { ok: "Nenhuma referência nova foi informada. Os dados já salvos foram mantidos." };
  const { data: negocio, error } = await supabase.from("businesses").select("id, onboarding")
    .eq("id", negocioId).eq("profile_id", user.id).maybeSingle();
  if (error || !negocio) return { erro: "Não conseguimos conferir esse negócio agora. Tente novamente." };
  const oferta = lerOfertaDoOnboarding(negocio.onboarding);
  const historico = Array.isArray(oferta.historico_precos) ? oferta.historico_precos : [];
  const anterior = oferta.preco_referencia;
  const { data: salvo, error: erroGravacao } = await supabase.rpc("mesclar_blocos_onboarding", {
    p_business_id: negocioId, p_patch: { respostas: { _oferta: { ...oferta, preco_referencia: preparado.referencia, informado_por: user.id,
      ...(anterior ? { historico_precos: [...historico, anterior] } : {}) } } },
  });
  if (erroGravacao || salvo !== true) return { erro: "Não conseguimos confirmar a gravação. Reabra esta página para conferir antes de tentar novamente." };
  revalidatePath("/onboarding/contas"); revalidatePath("/onboarding/marca"); revalidatePath("/inicio");
  const conferencia = await conferirCadastroOperacionalSeCompleto();
  const aviso = conferencia.fez === "falhou" || (conferencia.fez === "conferiu" && !conferencia.persistidoLocalmente)
    ? "O preço foi salvo, mas a conferência do cadastro no sistema ainda está pendente." : undefined;
  return { ok: "Referência de preço salva. Ela não altera o ticket médio nem inicia anúncios.", ...(aviso ? { aviso } : {}) };
}
