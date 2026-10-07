"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_NEGOCIO_ATIVO, negocioAtivoDaSessao } from "@/lib/multiconta/ativo";

export interface EscolhaNegocioState { erro?: string }

export async function escolherNegocioAction(
  _anterior: EscolhaNegocioState,
  formData: FormData,
): Promise<EscolhaNegocioState> {
  const id = String(formData.get("businessId") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return { erro: "Escolha um negócio da lista." };

  const supabase = await createClient();
  const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !user) return { erro: "Sua sessão expirou. Entre novamente." };

  const acesso = await negocioAtivoDaSessao();
  if (!("negocios" in acesso) || !acesso.negocios.some((negocio) => negocio.id === id)) {
    return { erro: "Este negócio ainda não está disponível para sua conta." };
  }

  // O ID do formulário é preferência. A autorização vem da lista de
  // negócios liberados e desta conferência de propriedade sob RLS.
  const { data: negocio, error } = await supabase.from("businesses")
    .select("id").eq("id", id).eq("profile_id", user.id).maybeSingle();
  if (error || !negocio) return { erro: "Este negócio não está disponível para sua conta." };

  (await cookies()).set(COOKIE_NEGOCIO_ATIVO, negocio.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  revalidatePath("/", "layout");
  redirect("/inicio");
}

export async function limparNegocioAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  (await cookies()).delete(COOKIE_NEGOCIO_ATIVO);
  revalidatePath("/", "layout");
  redirect("/inicio");
}
