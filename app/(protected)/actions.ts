"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_NEGOCIO_ATIVO } from "@/lib/multiconta/ativo";

export async function signOutAction() {
  const supabase = await createClient();
  // O botão promete encerrar somente este acesso. O padrão do Supabase
  // é global e também derrubaria as sessões dos outros aparelhos.
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).delete(COOKIE_NEGOCIO_ATIVO);
  redirect("/entrar");
}
