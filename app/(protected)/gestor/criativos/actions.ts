"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_REVISAO } from "@/lib/criativos/revisao";
import { sincronizarTarefaDeRevisao } from "@/lib/gestor/sincronizar-revisao";

export type EstadoDaRevisao = { ok?: string; erro?: string };

export async function revisarPecaAction(_anterior: EstadoDaRevisao,
  dados: FormData): Promise<EstadoDaRevisao> {
  if (process.env.V2G_CREATIVE_REVIEW_ENABLED !== "true")
    return { erro: "A fila de revisão não está disponível neste ambiente." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") return { erro: "Acesso não autorizado." };
  const id = dados.get("id");
  const decisao = dados.get("decisao");
  const nota = dados.get("nota");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id) ||
      !["approved_for_manual_publish", "changes_requested", "rejected"].includes(String(decisao)) ||
      typeof nota !== "string" || nota.length > 2000 ||
      (decisao !== "approved_for_manual_publish" && nota.trim().length < 5))
    return { erro: "Escolha uma decisão válida e explique os ajustes ou a recusa." };
  try {
    const admin = createAdminClient();
    const pendente = await admin.from("creative_review_requests")
      .select("id, business_id, file_path").eq("id", id).eq("status", "awaiting_review")
      .maybeSingle();
    if (pendente.error) return { erro: "Não foi possível conferir a peça. Tente novamente." };
    if (!pendente.data) return { erro: "Esta peça já foi decidida ou não está mais na fila. Atualize a página." };
    if (process.env.V2G_MANAGER_WORK_ENABLED === "true") {
      const conta = await admin.from("manager_accounts").select("operator_profile_id")
        .eq("business_id", pendente.data.business_id).maybeSingle();
      if (conta.error) return { erro: "Não foi possível conferir o gestor responsável. Tente novamente." };
      if (conta.data?.operator_profile_id !== user.id)
        return { erro: "Só o gestor responsável por esta conta pode decidir a revisão." };
    }
    // A action também pode ser chamada sem passar pela tela. Confirme que o
    // arquivo privado existe antes de aceitar uma decisão sobre a peça.
    const arquivo = await admin.storage.from(BUCKET_REVISAO).download(pendente.data.file_path);
    if (arquivo.error || !arquivo.data)
      return { erro: "A imagem não está disponível agora. Não registre a decisão sem conferir a peça." };
    const registro = await admin.from("creative_review_requests")
      .update({ status: decisao, review_note: nota.trim() || null,
        reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id).eq("status", "awaiting_review").select("id").maybeSingle();
    if (registro.error) return { erro: "Não foi possível registrar a decisão. Tente novamente." };
    if (!registro.data) return { erro: "Esta peça já foi decidida ou não está mais na fila. Atualize a página." };
    let tarefaPendente = false;
    if (process.env.V2G_MANAGER_WORK_ENABLED === "true") {
      try { await sincronizarTarefaDeRevisao(admin, id, pendente.data.business_id); }
      catch {
        tarefaPendente = true;
        console.error("[gestor/criativos] tarefa interna não foi sincronizada");
      }
    }
    revalidatePath("/gestor/criativos");
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    revalidatePath("/criativos");
    return { ok: tarefaPendente
      ? "Decisão registrada. Confira a tarefa interna de revisão, que pode continuar aberta. A publicação da campanha continua manual."
      : "Decisão registrada. A publicação da campanha continua manual." };
  } catch {
    return { erro: "Não foi possível registrar a decisão. Tente novamente." };
  }
}

/** Repara falha parcial sem repetir nem alterar a decisão já registrada. */
export async function sincronizarTarefaPecaAction(_anterior: EstadoDaRevisao,
  dados: FormData): Promise<EstadoDaRevisao> {
  if (process.env.V2G_CREATIVE_REVIEW_ENABLED !== "true" ||
      process.env.V2G_MANAGER_WORK_ENABLED !== "true")
    return { erro: "A fila interna não está ativa neste ambiente." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") return { erro: "Acesso não autorizado." };
  const id = dados.get("id");
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
    return { erro: "Peça inválida." };
  try {
    const admin = createAdminClient();
    const pedido = await admin.from("creative_review_requests")
      .select("business_id").eq("id", id).maybeSingle();
    if (pedido.error || !pedido.data) return { erro: "Peça não encontrada. Atualize a fila." };
    const conta = await admin.from("manager_accounts").select("operator_profile_id")
      .eq("business_id", pedido.data.business_id).maybeSingle();
    if (conta.error) return { erro: "Não foi possível conferir o responsável desta conta." };
    if (conta.data?.operator_profile_id !== user.id)
      return { erro: "Só o gestor responsável pode atualizar esta tarefa." };
    await sincronizarTarefaDeRevisao(admin, id, pedido.data.business_id);
    revalidatePath("/gestor/criativos");
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    return { ok: "Tarefa interna conferida com o estado da revisão. A publicação continua manual." };
  } catch {
    return { erro: "Não foi possível reconciliar a tarefa agora. Tente novamente." };
  }
}
