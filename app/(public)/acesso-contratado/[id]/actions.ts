"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { acessoContratadoAtivo, ID_ACESSO_CONTRATADO } from "@/lib/contratacao/acesso-contratado";
export async function aceitarAcessoContratado(_: {erro?:string}, form: FormData): Promise<{erro?:string}> {
  const id = String(form.get("id") ?? "");
  if (!acessoContratadoAtivo() || !ID_ACESSO_CONTRATADO.test(id)) return {erro:"Liberação indisponível. Fale com a equipe."};
  try {
    const s = await createClient();
    const {data:{user},error} = await s.auth.getUser();
    if (error || !user?.email_confirmed_at) return {erro:"Entre e confirme seu e-mail antes de continuar."};
    const r = await s.rpc("aceitar_acesso_contratado",{p_id:id});
    if (r.error || r.data !== true) return {erro:"Não foi possível liberar este negócio. Confira o e-mail usado ou fale com a equipe."};
  } catch { return {erro:"Não foi possível conferir a liberação agora. Tente novamente."}; }
  revalidatePath("/","layout");
  redirect("/escolher-negocio");
}
