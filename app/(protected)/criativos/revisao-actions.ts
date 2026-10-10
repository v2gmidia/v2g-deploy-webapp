"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { sincronizarTarefaDeRevisao } from "@/lib/gestor/sincronizar-revisao";
import { BUCKET_REVISAO, caminhoDaRevisao, podeRepetirEnvio,
  TAMANHO_MAXIMO_REVISAO, tipoRealDaImagem, type StatusRevisao } from "@/lib/criativos/revisao";

export type ResultadoDaSolicitacao =
  | { ok: true; id: string; repetido: boolean }
  | { ok: false; recado: string };

const RECADO_FALHA = "Não foi possível registrar a peça agora. Ela não foi publicada. Tente novamente.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A fila de peças continua sendo a fonte mesmo quando a tarefa auxiliar falha. */
async function garantirTarefaDeRevisao(negocioId: string, submissaoId: string) {
  if (process.env.V2G_MANAGER_WORK_ENABLED !== "true") return;
  try {
    await sincronizarTarefaDeRevisao(createAdminClient(), submissaoId, negocioId);
    revalidatePath("/gestor/tarefas");
    revalidatePath("/gestor");
    revalidatePath("/gestor/criativos");
  } catch {
    // A peça já pode estar salva para revisão. Uma repetição do mesmo envio
    // tenta novamente registrar a tarefa, sem criar segunda solicitação.
    console.error("[criativos] tarefa interna de revisão indisponível");
  }
}

/** Persistência separada da análise automática e da publicação na Meta. */
export async function solicitarRevisaoAction(dados: FormData): Promise<ResultadoDaSolicitacao> {
  if (process.env.V2G_CREATIVE_REVIEW_ENABLED !== "true")
    return { ok: false, recado: "O envio para revisão ainda não está disponível." };
  const id = dados.get("submissaoId");
  const arquivo = dados.get("arquivo");
  const businessId = dados.get("businessId");
  if (typeof id !== "string" || !UUID.test(id) || !(arquivo instanceof File) ||
      typeof businessId !== "string" || arquivo.size < 1 || arquivo.size > TAMANHO_MAXIMO_REVISAO)
    return { ok: false, recado: "Escolha uma imagem JPG ou PNG de até 9 MB e tente novamente." };

  const supabase = await createClient();
  const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
  const negocio = await negocioAtivoDaSessao();
  if (erroSessao || !user || negocio.status !== "selecionado" || negocio.negocio.id !== businessId)
    return { ok: false, recado: "A conta selecionada mudou. Atualize a página antes de enviar." };

  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  const mimeType = tipoRealDaImagem(bytes);
  if (!mimeType || mimeType !== arquivo.type)
    return { ok: false, recado: "O arquivo precisa ser uma imagem JPG ou PNG válida." };
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const caminho = caminhoDaRevisao(businessId, id);
  const nome = arquivo.name.trim().slice(0, 180) || "imagem";

  try {
    const admin = createAdminClient();
    const colunas = "id, business_id, submitted_by, sha256, status, updated_at";
    const atual = await admin.from("creative_review_requests").select(colunas).eq("id", id).maybeSingle();
    if (atual.error) return { ok: false, recado: RECADO_FALHA };
    if (atual.data) {
      if (atual.data.business_id !== businessId || atual.data.submitted_by !== user.id ||
          atual.data.sha256 !== sha256) return { ok: false, recado: "Este envio pertence a outra peça. Escolha o arquivo novamente." };
      if (atual.data.status === "awaiting_review" ||
          ["approved_for_manual_publish", "changes_requested", "rejected"].includes(atual.data.status)) {
        if (atual.data.status === "awaiting_review")
          await garantirTarefaDeRevisao(businessId, id);
        return { ok: true, id, repetido: true };
      }
      if (!podeRepetirEnvio(atual.data.status as StatusRevisao, atual.data.updated_at, Date.now()))
        return { ok: false, recado: "Este envio ainda está em andamento. Aguarde e confira a lista antes de tentar novamente." };
      const retomar = await admin.from("creative_review_requests")
        .update({ status: "uploading", updated_at: new Date().toISOString() })
        .eq("id", id).eq("status", atual.data.status).select("id").maybeSingle();
      if (retomar.error || !retomar.data) return { ok: false, recado: RECADO_FALHA };
    } else {
      const insercao = await admin.from("creative_review_requests").insert({
        id, business_id: businessId, submitted_by: user.id, file_path: caminho,
        original_name: nome, mime_type: mimeType, size_bytes: bytes.length, sha256,
        status: "uploading",
      });
      if (insercao.error) return { ok: false, recado: RECADO_FALHA };
    }

    // Caminho determinístico e hash fixo. Uma repetição depois de falha parcial
    // regrava somente o mesmo conteúdo, nunca cria uma segunda solicitação.
    const upload = await admin.storage.from(BUCKET_REVISAO).upload(caminho, bytes, {
      contentType: mimeType, upsert: true, cacheControl: "0",
    });
    if (upload.error) {
      await admin.from("creative_review_requests").update({
        status: "upload_failed", updated_at: new Date().toISOString(),
      }).eq("id", id).eq("status", "uploading");
      return { ok: false, recado: RECADO_FALHA };
    }
    const concluido = await admin.from("creative_review_requests")
      .update({ status: "awaiting_review", updated_at: new Date().toISOString() })
      .eq("id", id).eq("status", "uploading").select("id").maybeSingle();
    if (concluido.error || !concluido.data) return { ok: false, recado: RECADO_FALHA };
    await garantirTarefaDeRevisao(businessId, id);
    return { ok: true, id, repetido: false };
  } catch {
    return { ok: false, recado: RECADO_FALHA };
  }
}
