"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarEvidenciaManual, UUID_EVIDENCIA, type EvidenciaManual } from "@/lib/contratacao/evidencia-manual";
import { carteiraDaEvidencia, identidadeDaEvidenciaConfere } from "@/lib/contratacao/evidencia-manual-servidor";

export type EstadoEvidencia = { ok?: string; erro?: string };
async function usuarioOperador() {
  const s=await createClient(); const {data:{user},error}=await s.auth.getUser();
  return !error && user?.app_metadata?.papel==="operador" ? user : null;
}
export async function registrarEvidenciaManualAction(_: EstadoEvidencia, form: FormData): Promise<EstadoEvidencia> {
  const user=await usuarioOperador(); if(!user) return {erro:"Acesso não autorizado."};
  const v=validarEvidenciaManual(form); if(!v.dados) return {erro:v.erro};
  const d=v.dados;
  try {
    const admin=createAdminClient();
    if(!await carteiraDaEvidencia(admin,d.business_id,user.id)) return {erro:"Só o responsável atribuído a este negócio pode registrar a conferência."};
    if(!await identidadeDaEvidenciaConfere(admin,d)) return {erro:"Pessoa, e-mail, pedido ou negócio divergentes. Confira os identificadores; não crie outro pedido para contornar."};
    const r=await admin.rpc("registrar_evidencia_manual",{p_id:d.id,p_business_id:d.business_id,p_order_id:d.order_id,
      p_profile_id:d.proposed_profile_id,p_email:d.claimed_email,p_cnpj:d.claimed_cnpj,p_source:d.source_system,
      p_reference:d.source_reference,p_source_date:d.source_date,p_operator_id:user.id});
    if(r.error || typeof r.data!=="string" || !UUID_EVIDENCIA.test(r.data)) return {erro:"Não foi possível registrar. Confira a disponibilidade e se a referência já está vinculada. Não duplique nem altere a referência para contornar."};
  } catch { return {erro:"A conferência está indisponível agora. Nenhum acesso foi liberado."}; }
  revalidatePath("/pedidos"); return {ok:"Evidência pendente registrada. O vínculo é apenas proposto; nenhum acesso ou pagamento foi aprovado."};
}
export async function revisarEvidenciaManualAction(_: EstadoEvidencia, form: FormData): Promise<EstadoEvidencia> {
  const user=await usuarioOperador(); if(!user) return {erro:"Acesso não autorizado."};
  const id=String(form.get("id")??""), businessId=String(form.get("businessId")??""), status=String(form.get("status")??""), note=String(form.get("note")??"").trim();
  if(!UUID_EVIDENCIA.test(id)||!UUID_EVIDENCIA.test(businessId)||!["checked","rejected"].includes(status)||note.length<5||note.length>1000)
    return {erro:"Escolha conferida ou recusada e registre o motivo, de 5 a 1.000 caracteres."};
  const identity=form.get("identityChecked")==="yes", source=form.get("sourceChecked")==="yes";
  if(status==="checked" && (!identity||!source)) return {erro:"Confira a identidade e a fonte antes de marcar a evidência como conferida."};
  try {
    const admin=createAdminClient();
    if(!await carteiraDaEvidencia(admin,businessId,user.id)) return {erro:"Você não é o responsável atribuído a este negócio."};
    const e=await admin.from("commercial_manual_evidence")
      .select("id, business_id, order_id, proposed_profile_id, claimed_email, claimed_cnpj")
      .eq("id",id).eq("business_id",businessId).maybeSingle();
    if(e.error||!e.data||e.data.id!==id||e.data.business_id!==businessId) return {erro:"Evidência indisponível para este negócio. Atualize a página."};
    if(status==="checked" && !await identidadeDaEvidenciaConfere(admin,e.data as EvidenciaManual))
      return {erro:"A identidade ou o pedido mudou. Confira os dados antes da decisão."};
    const r=await admin.rpc("revisar_evidencia_manual",{p_id:id,p_business_id:businessId,p_operator_id:user.id,
      p_status:status,p_note:note,p_identity_checked:identity,p_source_checked:source});
    if(r.error||r.data!==true) return {erro:"Não foi possível concluir. Confira se há estorno, divergência, decisão anterior ou indisponibilidade. Nenhum acesso foi liberado."};
  } catch { return {erro:"Não foi possível salvar a conferência agora."}; }
  revalidatePath("/pedidos"); return {ok:status==="checked" ? "Evidência conferida pela equipe. A proposta de acesso continua sem aplicação." : "Evidência recusada. Nenhum acesso anterior foi alterado."};
}
