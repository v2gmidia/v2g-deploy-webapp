"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarPublicacao } from "@/lib/criativos/publicacao";
import { caminhoConfereComRevisao } from "@/lib/criativos/revisao";
import { hojeEmSaoPaulo } from "@/lib/criativos/intencao-envio";
type Estado = { ok?: string; erro?: string };
export async function confirmarPublicacaoAction(_anterior: Estado, dados: FormData): Promise<Estado> {
  if (process.env.V2G_CREATIVE_REVIEW_ENABLED !== "true") return { erro: "A revisão não está disponível neste ambiente." };
  const cliente = await createClient();
  const { data: { user }, error } = await cliente.auth.getUser();
  if (error || user?.app_metadata?.papel !== "operador") return { erro: "Acesso não autorizado." };
  const entrada = validarPublicacao({ id: dados.get("id"), conta: dados.get("conta"), anuncio: dados.get("anuncio"),
    dia: dados.get("dia"), evidencia: dados.get("evidencia"), confirmo: dados.get("confirmo") }, hojeEmSaoPaulo());
  if (!entrada) return { erro: "Confira a conta, o ID do anúncio, uma data válida e a confirmação da peça publicada." };
  try {
    const admin = createAdminClient();
    const pedido = await admin.from("creative_review_requests").select("id, business_id, file_path, sha256, status")
      .eq("id", entrada.id).maybeSingle();
    const p = pedido.data;
    if (pedido.error || !p || p.id !== entrada.id || p.status !== "approved_for_manual_publish" || !caminhoConfereComRevisao(p))
      return { erro: "Confira uma peça aprovada da sua carteira antes de confirmar a publicação." };
    const atribuicao = await admin.from("manager_accounts").select("business_id, operator_profile_id")
      .eq("business_id", p.business_id).eq("operator_profile_id", user.id).maybeSingle();
    if (atribuicao.error || atribuicao.data?.business_id !== p.business_id || atribuicao.data?.operator_profile_id !== user.id)
      return { erro: "Só o gestor responsável por esta conta pode confirmar a publicação." };
    // A RPC repete a autorização e confere a conta em uma única transação.
    const r = await admin.rpc("confirmar_publicacao_criativo", { p_review: p.id, p_business: p.business_id, p_sha: p.sha256,
      p_actor: user.id, p_account: entrada.conta, p_ad: entrada.anuncio, p_day: entrada.dia, p_evidence: entrada.evidencia });
    if (r.error) return { erro: "Não foi possível confirmar o registro. Recarregue a página para conferir antes de tentar novamente." };
    if (r.data === "conflict") return { erro: "Já existe outra confirmação para esta peça. Atualize a página; o registro anterior foi preservado." };
    if (r.data !== "registered" && r.data !== "already_registered") return { erro: "A peça ou a conta mudou. Atualize e confira os dados com o gestor responsável." };
    revalidatePath("/gestor/criativos"); revalidatePath("/criativos");
    return { ok: "Publicação confirmada pelo gestor e registrada para o cliente. A entrega atual depende da leitura dos anúncios." };
  } catch { return { erro: "Não foi possível confirmar o registro. Recarregue a página para conferir o estado atual." }; }
}
