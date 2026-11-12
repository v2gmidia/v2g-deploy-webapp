import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { pilotoQaHabilitado } from "@/lib/piloto-qa/acesso";
import { contextoAgenciaDoCadastro, contextoDoAnuncianteVinculado, UUID_AGENCIA, type ContextoAgencia } from "./contexto";
import { lerVinculosDaSessao } from "./vinculos-da-sessao";
import { raizDaAgencia } from "./vinculos";

export type ContextoAgenciaDaSessao =
  | { status: "desligado" | "direto" | "indisponivel" }
  | { status: "agencia"; agencia: string; businessIdAtivo: string; contexto: ContextoAgencia | null;
    clientes: ContextoAgencia[]; agencyBusinessId: string; origem: "vinculo" | "legado" };

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
    const leitura = await lerVinculosDaSessao(supabase, user.id);
    if (leitura.estado === "indisponivel") return { status: "indisponivel" };
    const raiz = leitura.estado === "pronto" ? raizDaAgencia(leitura.vinculos, data.id) : null;
    let contexto = contextoAgenciaDoCadastro(data, user.id);
    let clientes: ContextoAgencia[] = contexto ? [contexto] : [];
    let nomeAgencia = contexto?.agencia ?? null;
    if (raiz && leitura.estado === "pronto") {
      // Pai e filhos continuam pertencendo ao mesmo titular e precisam estar liberados.
      const permitidos = new Set(ativo.negocios.map(n => n.id));
      if (!permitidos.has(raiz)) return { status: "indisponivel" };
      const vinculos = leitura.vinculos.filter(v => v.agency_business_id === raiz && permitidos.has(v.advertiser_business_id));
      const ids = [...new Set([raiz, ...vinculos.map(v => v.advertiser_business_id)])];
      const negocios = await supabase.from("businesses").select("id, profile_id, name, onboarding, monthly_budget")
        .eq("profile_id", user.id).in("id", ids).limit(501);
      if (negocios.error || !Array.isArray(negocios.data) || negocios.data.length !== ids.length
        || negocios.data.some(b => !ids.includes(b.id) || b.profile_id !== user.id)
        || new Set(negocios.data.map(b => b.id)).size !== ids.length) return { status: "indisponivel" };
      const pai = negocios.data.find(b => b.id === raiz);
      if (!pai || typeof pai.name !== "string" || !pai.name.trim() || pai.name.length > 200) return { status: "indisponivel" };
      nomeAgencia = pai.name.trim();
      const montados = vinculos.map(v => contextoDoAnuncianteVinculado(negocios.data.find(b => b.id === v.advertiser_business_id)!, user.id, v, pai.name));
      if (montados.some(c => !c)) return { status: "indisponivel" };
      clientes = (montados as ContextoAgencia[]).sort((a, b) => a.anunciante.localeCompare(b.anunciante, "pt-BR"));
      contexto = clientes.find(c => c.businessId === data.id) ?? null;
      // A raiz administrativa pode não ser anunciante. Nenhuma resposta de
      // onboarding, verba ou marca dos filhos é copiada para preencher essa lacuna.
      if (!contexto && data.id !== raiz) return { status: "indisponivel" };
    }
    if (!raiz && !contexto) {
      const onboarding = data.onboarding as { respostas?: { operador?: { texto?: unknown } } } | null;
      return onboarding?.respostas?.operador?.texto === "Uma agência ou gestor opera para o anunciante"
        ? { status: "indisponivel" } : { status: "direto" };
    }
    // Leitura administrativa mínima só depois de provar titular, seleção e cadastro.
    // Não amplia atribuição nem transforma o nome do gestor em autorização.
    await Promise.all(clientes.map(async contexto => { try {
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
    } catch { /* A indisponibilidade do nome não desautoriza o titular já validado. */ } }));
    if (!nomeAgencia) return { status: "indisponivel" };
    return { status: "agencia", agencia: nomeAgencia, businessIdAtivo: data.id, contexto, clientes,
      agencyBusinessId: raiz ?? data.id, origem: raiz ? "vinculo" : "legado" };
  } catch { return { status: "indisponivel" }; }
});
