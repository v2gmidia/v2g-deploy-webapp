"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TIPOS_DE_TAREFA, type TipoDeTarefa } from "@/lib/gestor/tarefas";
import { tarefasDaPreparacao } from "@/lib/gestor/preparacao";

export type EstadoTarefa = { ok?: string; erro?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FALHA = "Não foi possível gravar a tarefa agora. Tente novamente.";

async function operador() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && user?.app_metadata?.papel === "operador" ? user : null;
}

export async function criarTarefaAction(_anterior: EstadoTarefa, dados: FormData): Promise<EstadoTarefa> {
  if (process.env.V2G_MANAGER_WORK_ENABLED !== "true") return { erro: "A fila não está ativa neste ambiente." };
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  const id = dados.get("id");
  const businessId = dados.get("businessId");
  const tipo = dados.get("tipo");
  const titulo = dados.get("titulo");
  const descricao = dados.get("descricao");
  const prazo = dados.get("prazoUtc");
  if (typeof id !== "string" || !UUID.test(id) || typeof businessId !== "string" || !UUID.test(businessId) ||
      typeof tipo !== "string" || !(tipo in TIPOS_DE_TAREFA) ||
      typeof titulo !== "string" || titulo.trim().length < 5 || titulo.trim().length > 160 ||
      typeof descricao !== "string" || descricao.length > 2000 ||
      typeof prazo !== "string" || (prazo && (!Number.isFinite(Date.parse(prazo)) ||
        Date.parse(prazo) > Date.now() + 366 * 24 * 60 * 60_000)))
    return { erro: "Confira negócio, tipo, título e prazo da tarefa." };
  try {
    const admin = createAdminClient();
    const negocio = await admin.from("businesses").select("id").eq("id", businessId)
      .eq("dados_ficticios", false).maybeSingle();
    if (negocio.error || !negocio.data) return { erro: "Negócio não encontrado. Atualize a carteira." };
    const gravacao = await admin.from("manager_tasks").insert({
      id, business_id: businessId, task_type: tipo as TipoDeTarefa,
      title: titulo.trim(), description: descricao.trim() || null,
      assigned_to: user.id, created_by: user.id,
      due_at: prazo ? new Date(prazo).toISOString() : null,
    });
    if (gravacao.error) {
      if (gravacao.error.code === "23505") {
        const existente = await admin.from("manager_tasks")
          .select("id, created_by, business_id, task_type, title, description, due_at")
          .eq("id", id).maybeSingle();
        if (!existente.error && existente.data?.created_by === user.id &&
            existente.data.business_id === businessId && existente.data.task_type === tipo &&
            existente.data.title === titulo.trim() &&
            (existente.data.description ?? "") === descricao.trim() &&
            (existente.data.due_at === null && !prazo ||
              !!existente.data.due_at && !!prazo &&
              Date.parse(existente.data.due_at) === Date.parse(prazo)))
          return { ok: "Esta tarefa já estava registrada." };
      }
      return { erro: FALHA };
    }
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    return { ok: "Tarefa registrada para acompanhamento interno." };
  } catch {
    return { erro: FALHA };
  }
}

export async function assumirContaAction(_anterior: EstadoTarefa, dados: FormData): Promise<EstadoTarefa> {
  if (process.env.V2G_MANAGER_WORK_ENABLED !== "true") return { erro: "A atribuição não está ativa." };
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  const businessId = dados.get("businessId");
  if (typeof businessId !== "string" || !UUID.test(businessId)) return { erro: "Negócio inválido." };
  try {
    const admin = createAdminClient();
    const negocio = await admin.from("businesses").select("id").eq("id", businessId)
      .eq("dados_ficticios", false).maybeSingle();
    if (negocio.error || !negocio.data) return { erro: "Negócio não encontrado." };
    const gravacao = await admin.from("manager_accounts").insert({
      business_id: businessId, operator_profile_id: user.id, assigned_by: user.id,
    });
    if (gravacao.error) {
      if (gravacao.error.code === "23505") {
        const existente = await admin.from("manager_accounts").select("operator_profile_id")
          .eq("business_id", businessId).maybeSingle();
        if (!existente.error && existente.data?.operator_profile_id === user.id)
          return { ok: "Esta conta já está sob sua responsabilidade." };
        return { erro: "Esta conta já tem responsável. Consulte a equipe antes de alterar." };
      }
      return { erro: "Não foi possível atribuir a conta agora." };
    }
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    return { ok: "Você assumiu a responsabilidade operacional desta conta." };
  } catch {
    return { erro: "Não foi possível atribuir a conta agora." };
  }
}

/** Cria só as pendências iniciais ausentes, sem marcar reunião ou publicação. */
export async function prepararContaAction(_anterior: EstadoTarefa, dados: FormData): Promise<EstadoTarefa> {
  if (process.env.V2G_MANAGER_WORK_ENABLED !== "true") return { erro: "A fila não está ativa." };
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  const businessId = dados.get("businessId");
  if (typeof businessId !== "string" || !UUID.test(businessId)) return { erro: "Negócio inválido." };
  try {
    const admin = createAdminClient();
    const [negocio, atribuicao] = await Promise.all([
      admin.from("businesses").select("id").eq("id", businessId)
        .eq("dados_ficticios", false).maybeSingle(),
      admin.from("manager_accounts").select("operator_profile_id")
        .eq("business_id", businessId).maybeSingle(),
    ]);
    if (negocio.error || !negocio.data) return { erro: "Negócio não encontrado." };
    if (atribuicao.error || !atribuicao.data)
      return { erro: "Atribua um gestor à conta antes de preparar as pendências." };
    const itens = tarefasDaPreparacao(businessId);
    // A identidade da pendência inicial é o ID determinístico. Uma tarefa
    // manual com o mesmo título não deve esconder a preparação desta conta.
    const existentes = await admin.from("manager_tasks").select("id, business_id, task_type, title")
      .in("id", itens.map((item) => item.id));
    if (existentes.error || !existentes.data)
      return { erro: "Não foi possível conferir as pendências existentes. Tente novamente." };
    const jaRegistradas = new Map(existentes.data.map((item) => [item.id, item]));
    let criadas = 0;
    for (const item of itens) {
      const existente = jaRegistradas.get(item.id);
      if (existente) {
        if (existente.business_id !== businessId || existente.task_type !== item.tipo ||
            existente.title !== item.titulo)
          return { erro: "Há um conflito na identificação de uma pendência inicial. Confira a fila antes de continuar." };
        continue;
      }
      const insercao = await admin.from("manager_tasks").insert({
        id: item.id, business_id: businessId, task_type: item.tipo,
        title: item.titulo, description: item.descricao,
        assigned_to: atribuicao.data.operator_profile_id, created_by: user.id,
      });
      if (!insercao.error) { criadas++; continue; }
      if (insercao.error.code === "23505") {
        const existente = await admin.from("manager_tasks")
          .select("business_id, task_type, title").eq("id", item.id).maybeSingle();
        if (!existente.error && existente.data?.business_id === businessId &&
            existente.data.task_type === item.tipo && existente.data.title === item.titulo) continue;
      }
      return { erro: "Parte da preparação pode ter sido registrada. Atualize a fila e tente novamente; as tarefas existentes não serão duplicadas." };
    }
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    return { ok: criadas ? `${criadas} pendência(s) de preparação registrada(s).` :
      "As pendências desta preparação já estavam registradas." };
  } catch {
    return { erro: "Não foi possível preparar a conta agora. Confira a fila antes de tentar novamente." };
  }
}

export async function concluirTarefaAction(_anterior: EstadoTarefa, dados: FormData): Promise<EstadoTarefa> {
  if (process.env.V2G_MANAGER_WORK_ENABLED !== "true") return { erro: "A fila não está ativa." };
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  const id = dados.get("id");
  const nota = dados.get("nota");
  if (typeof id !== "string" || !UUID.test(id) || typeof nota !== "string" ||
      nota.trim().length < 5 || nota.trim().length > 2000)
    return { erro: "Registre em pelo menos cinco caracteres o que foi feito." };
  try {
    const admin = createAdminClient();
    const agora = new Date().toISOString();
    const gravacao = await admin.from("manager_tasks").update({
      status: "done", completion_note: nota.trim(), completed_by: user.id,
      completed_at: agora, updated_at: agora,
    }).eq("id", id).eq("status", "open").eq("assigned_to", user.id)
      .select("id").maybeSingle();
    if (gravacao.error) return { erro: "Não foi possível concluir a tarefa." };
    if (!gravacao.data) return { erro: "A tarefa mudou ou está com outro responsável. Atualize a página." };
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    return { ok: "Tarefa concluída com registro da ação. Isso não confirma estado de serviços externos." };
  } catch {
    return { erro: "Não foi possível concluir a tarefa." };
  }
}
