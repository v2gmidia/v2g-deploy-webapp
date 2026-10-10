import type { createAdminClient } from "@/lib/supabase/admin";
import { descricaoDaTarefaDeRevisao, idDaTarefaDeRevisao,
  TITULO_TAREFA_REVISAO } from "./revisao-pendente.ts";

const DECISOES = ["approved_for_manual_publish", "changes_requested", "rejected"];

/** Reconciliação repetível: a decisão da peça é a fonte, mesmo após falha parcial. */
export async function sincronizarTarefaDeRevisao(admin: ReturnType<typeof createAdminClient>,
  solicitacaoId: string, negocioEsperado?: string) {
  const pedido = await admin.from("creative_review_requests")
    .select("id, business_id, submitted_by, status, reviewed_by")
    .eq("id", solicitacaoId).maybeSingle();
  if (pedido.error || !pedido.data ||
      (negocioEsperado && pedido.data.business_id !== negocioEsperado))
    throw pedido.error ?? new Error("solicitação indisponível");
  const { business_id: negocioId, submitted_by: autorId } = pedido.data;
  if (pedido.data.status !== "awaiting_review" && !DECISOES.includes(pedido.data.status))
    throw new Error("solicitação ainda não recebida para revisão");

  const atribuicao = await admin.from("manager_accounts")
    .select("operator_profile_id").eq("business_id", negocioId).maybeSingle();
  if (atribuicao.error) throw atribuicao.error;
  const responsavel = atribuicao.data?.operator_profile_id ?? null;
  const id = idDaTarefaDeRevisao(solicitacaoId);
  const descricao = descricaoDaTarefaDeRevisao(solicitacaoId, negocioId);
  const insercao = await admin.from("manager_tasks").insert({
    id, business_id: negocioId, task_type: "other", title: TITULO_TAREFA_REVISAO,
    description: descricao, assigned_to: responsavel, created_by: autorId,
  });
  if (insercao.error && insercao.error.code !== "23505") throw insercao.error;
  const existente = await admin.from("manager_tasks")
    .select("business_id, task_type, title, description, created_by, status, assigned_to")
    .eq("id", id).maybeSingle();
  if (existente.error || !existente.data || existente.data.business_id !== negocioId ||
      existente.data.task_type !== "other" || existente.data.title !== TITULO_TAREFA_REVISAO ||
      existente.data.description !== descricao || existente.data.created_by !== autorId)
    throw existente.error ?? new Error("identidade da tarefa divergente");

  // Se a conta foi assumida ou transferida depois do envio, a pendência
  // aberta acompanha o responsável atual. Tarefa concluída não é transferida.
  if (existente.data.status === "open" && existente.data.assigned_to !== responsavel) {
    const transferida = await admin.from("manager_tasks").update({
      assigned_to: responsavel, updated_at: new Date().toISOString(),
    }).eq("id", id).eq("status", "open");
    if (transferida.error) throw transferida.error;
  }

  // Leia novamente após criar: a decisão pode ter vencido a inserção.
  const atual = await admin.from("creative_review_requests")
    .select("business_id, status, reviewed_by").eq("id", solicitacaoId).maybeSingle();
  if (atual.error || !atual.data || atual.data.business_id !== negocioId)
    throw atual.error ?? new Error("revisão indisponível");
  if (DECISOES.includes(atual.data.status)) {
    if (!atual.data.reviewed_by) throw new Error("decisão sem autor");
    const agora = new Date().toISOString();
    const fechamento = await admin.from("manager_tasks").update({
      status: "done", completion_note: `Decisão da revisão: ${atual.data.status}. A publicação da campanha continua manual.`,
      completed_by: atual.data.reviewed_by, completed_at: agora, updated_at: agora,
    }).eq("id", id).eq("business_id", negocioId).eq("status", "open");
    if (fechamento.error) throw fechamento.error;
  }
  const final = await admin.from("manager_tasks")
    .select("status, assigned_to").eq("id", id).maybeSingle();
  if (final.error || !final.data ||
      (DECISOES.includes(atual.data.status) && final.data.status !== "done") ||
      (atual.data.status === "awaiting_review" && final.data.status !== "open") ||
      (final.data.status === "open" && final.data.assigned_to !== responsavel))
    throw final.error ?? new Error("estado da tarefa divergente da revisão");
  return { status: final.data.status, assignedTo: final.data.assigned_to };
}
