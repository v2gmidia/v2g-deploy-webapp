import "server-only";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { escolherNegocio, type EscolhaDeNegocio } from "./escolha";

export const COOKIE_NEGOCIO_ATIVO = "v2g_negocio_ativo";

export type NegocioAtivoDaSessao = EscolhaDeNegocio | {
  status: "sem_sessao" | "falha_consulta";
};

/**
 * Núcleo para substituir as consultas que escolhem `limit(1)`.
 * A escolha fica inerte até as páginas e actions consumirem este resultado.
 */
export async function negocioAtivoDaSessao(): Promise<NegocioAtivoDaSessao> {
  const supabase = await createClient();
  const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
  if (erroSessao || !user) return { status: "sem_sessao" };

  const { data, error } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true });

  if (error || !data) return { status: "falha_consulta" };
  const preferencia = (await cookies()).get(COOKIE_NEGOCIO_ATIVO)?.value ?? null;
  return escolherNegocio(data, preferencia);
}
