"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_REVISAO } from "@/lib/criativos/revisao";

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
      .select("id, file_path").eq("id", id).eq("status", "awaiting_review")
      .maybeSingle();
    if (pendente.error) return { erro: "Não foi possível conferir a peça. Tente novamente." };
    if (!pendente.data) return { erro: "Esta peça já foi decidida ou não está mais na fila. Atualize a página." };
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
    revalidatePath("/gestor/criativos");
    revalidatePath("/criativos");
    return { ok: "Decisão registrada. A publicação da campanha continua manual." };
  } catch {
    return { erro: "Não foi possível registrar a decisão. Tente novamente." };
  }
}
