"use server";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { acessoContratadoAtivo, ID_ACESSO_CONTRATADO } from "@/lib/contratacao/acesso-contratado";
export type EstadoConcessao = {erro?:string; ok?:string; caminho?:string};
export async function decidirAcessoContratado(_:EstadoConcessao,form:FormData):Promise<EstadoConcessao> {
  if (!acessoContratadoAtivo()) return {erro:"Liberação por contratação histórica indisponível neste ambiente."};
  const modo = String(form.get("modo") ?? "");
  const id = String(form.get("id") ?? "");
  const note = String(form.get("note") ?? "").trim();
  if (!["emitir","revogar"].includes(modo) || !ID_ACESSO_CONTRATADO.test(id) || note.length<5 || note.length>1000)
    return {erro:"Confira o identificador, a operação e o motivo de 5 a 1.000 caracteres."};
  if (form.get("confirmed") !== "yes") return {erro:"Confirme a contratação, a autoridade do destinatário e o negócio exato."};
  try {
    const s = await createClient();
    const {data:{user},error} = await s.auth.getUser();
    if (error || user?.app_metadata?.papel !== "operador") return {erro:"Acesso não autorizado."};
    const admin = createAdminClient();
    if (modo === "revogar") {
      const r = await admin.rpc("revogar_acesso_contratado",{p_id:id,p_operator_id:user.id,p_note:note});
      return !r.error && r.data===true ? {ok:"Liberação revogada. Outros negócios e permissões são conferidos separadamente."}
        : {erro:"Não foi possível revogar. Confira sua carteira e o identificador."};
    }
    const r = await admin.rpc("emitir_acesso_contratado",{p_id:randomUUID(),p_evidence_id:id,p_operator_id:user.id,p_note:note});
    return !r.error && typeof r.data==="string" && ID_ACESSO_CONTRATADO.test(r.data)
      ? {ok:"Liberação registrada. Nenhuma mensagem foi enviada. Confira o destinatário antes de compartilhar o link.",caminho:`/acesso-contratado/${r.data}`}
      : {erro:"Não foi possível emitir. Confira a evidência histórica, sua carteira, o destinatário e o negócio. Não crie um pedido para contornar."};
  } catch { return {erro:"Conferência indisponível. Nenhuma liberação foi confirmada."}; }
}
