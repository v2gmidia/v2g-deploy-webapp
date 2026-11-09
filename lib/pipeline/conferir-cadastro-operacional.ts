import "server-only";
import { createClient } from "@/lib/supabase/server";
import { negocioAtivoDaSessao } from "@/lib/multiconta/ativo";
import { conferirCadastroOperacional } from "@/lib/backend/cadastro-operacional";
import {
  COLUNAS_DO_CADASTRO_OPERACIONAL,
  montarCadastroOperacional,
  type NegocioParaCadastro,
} from "@/lib/cadastro/montar";

export type ResultadoConferenciaOperacional =
  | { fez: "nada"; porque: string }
  | { fez: "conferiu"; persistidoLocalmente: boolean }
  | { fez: "falhou"; porque: string };

/**
 * Confere o payload V2 no backend sem criar execução. Falha nunca desfaz a
 * resposta que a pessoa acabou de salvar.
 */
export async function conferirCadastroOperacionalSeCompleto(): Promise<ResultadoConferenciaOperacional> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { fez: "nada", porque: "sem sessão" };
    const ativo = await negocioAtivoDaSessao();
    if (ativo.status !== "selecionado") return { fez: "nada", porque: "sem negócio selecionado" };
    const { data, error } = await supabase.from("businesses")
      .select(COLUNAS_DO_CADASTRO_OPERACIONAL)
      .eq("profile_id", user.id).eq("id", ativo.negocio.id).maybeSingle();
    if (error || !data) return { fez: "nada", porque: error ? "leitura falhou" : "sem negócio" };
    const cadastro = montarCadastroOperacional(data as unknown as NegocioParaCadastro);
    if (!cadastro.completo) return { fez: "nada", porque: `faltam ${cadastro.pendencias.length} campos operacionais` };
    if (!cadastro.validavel) return { fez: "nada", porque: cadastro.motivo };

    const resposta = await conferirCadastroOperacional(cadastro.payload);
    if (!resposta.ok) return { fez: "falhou", porque: resposta.categoria };

    const { data: mesclado, error: erroPersistencia } = await supabase.rpc("mesclar_blocos_onboarding", {
      p_business_id: cadastro.payload.business_id,
      p_patch: { versao: 2, respostas: {
        _cadastro_operacional: {
          versao_contrato: cadastro.payload.versao_contrato,
          estado: resposta.dados.estado,
          validado_em: new Date().toISOString(),
          persistido_no_backend: resposta.dados.persistido,
          id_execucao: resposta.dados.id_execucao,
          pipeline_disparado: resposta.dados.pipeline_disparado,
          diagnostico_economico: resposta.dados.diagnostico_economico,
          pendencias_por_acao: resposta.dados.pendencias_por_acao,
        },
      } },
    });
    return { fez: "conferiu", persistidoLocalmente: !erroPersistencia && mesclado === true };
  } catch (erro) {
    console.error("[cadastro-operacional] conferência falhou ::",
      erro instanceof Error ? erro.message : String(erro));
    return { fez: "falhou", porque: "exceção" };
  }
}
