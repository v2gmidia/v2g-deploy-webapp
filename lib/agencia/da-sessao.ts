import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { pilotoQaHabilitado } from "@/lib/piloto-qa/acesso";
import { contextoAgenciaDoCadastro, UUID_AGENCIA, type ContextoAgencia } from "./contexto";

export type ContextoAgenciaDaSessao =
  | { status: "desligado" | "direto" | "indisponivel" }
  | { status: "agencia"; contexto: ContextoAgencia };

/** Somente QA já habilitada; nenhuma identidade, permissão ou dado é gravado. */
export const carregarAgenciaDaSessao = cache(async (): Promise<ContextoAgenciaDaSessao> => {
  if (!pilotoQaHabilitado()) return { status: "desligado" };
  try {
    const supabase = await createClient();
    const { data: { user }, error: erroSessao } = await supabase.auth.getUser();
    if (erroSessao || !user || !UUID_AGENCIA.test(user.id)) return { status: "indisponivel" };
    const ativo = await negocioAtivoDaSessao();
    if (ativo.status === "sem_negocio") return { status: "direto" };
    if (ativo.status !== "selecionado" || !UUID_AGENCIA.test(ativo.negocio.id)) return { status: "indisponivel" };
    const { data, error } = await supabase.from("businesses")
      .select("id, profile_id, name, onboarding, monthly_budget")
      .eq("profile_id", user.id).eq("id", ativo.negocio.id).maybeSingle();
    if (error || !data || data.id !== ativo.negocio.id || data.profile_id !== user.id) return { status: "indisponivel" };
    const contexto = contextoAgenciaDoCadastro(data, user.id);
    if (!contexto) {
      const onboarding = data.onboarding as { respostas?: { operador?: { texto?: unknown } } } | null;
      return onboarding?.respostas?.operador?.texto === "Uma agência ou gestor opera para o anunciante"
        ? { status: "indisponivel" } : { status: "direto" };
    }
    // Leitura administrativa mínima só depois de provar titular, seleção e cadastro.
    // Não amplia atribuição nem transforma o nome do gestor em autorização.
    try {
      const admin = createAdminClient();
      const atribuicao = await admin.from("manager_accounts").select("business_id, operator_profile_id")
        .eq("business_id", contexto.businessId).maybeSingle();
      if (!atribuicao.error && atribuicao.data?.business_id === contexto.businessId
        && UUID_AGENCIA.test(atribuicao.data.operator_profile_id)) {
        const perfil = await admin.from("profiles").select("id, full_name")
          .eq("id", atribuicao.data.operator_profile_id).maybeSingle();
        const p = perfil.data;
        if (!perfil.error && p && p.id === atribuicao.data.operator_profile_id
          && typeof p.full_name === "string" && p.full_name.trim().length <= 200)
          contexto.gestor = p.full_name.trim() || null;
      }
    } catch { /* A indisponibilidade do nome não desautoriza o titular já validado. */ }
    return { status: "agencia", contexto };
  } catch { return { status: "indisponivel" }; }
});
