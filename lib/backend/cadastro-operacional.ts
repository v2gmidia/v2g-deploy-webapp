import "server-only";
import type { CadastroOperacionalV2 } from "@/lib/cadastro/montar";
import { enviar } from "./cliente";
import { falha, registrarErroBackend, type Resultado } from "./erros";

export interface CadastroOperacionalConferido {
  versao_contrato: "cadastro_operacional.v2";
  business_id: string;
  estado: "conferido_sem_execucao";
  persistido: false;
  id_execucao: null;
  pipeline_disparado: false;
  criacao_autorizada: false;
  publicacao_autorizada: false;
  diagnostico_economico: {
    estado: "indisponivel";
    motivo: "metodo_economico_nao_disponivel";
    cac_alvo: null; cpl_alvo: null; roas: null; lucro_estimado: null; meta_estimada: null;
  };
  pendencias_por_acao: Array<{
    acao: "ler_campanhas" | "preparar_campanha" | "publicar_campanha";
    motivo: "verificar_sessao_e_conta" | "definir_caminho" | "confirmar_orcamento"
      | "conferir_atendimento" | "revisar_materiais_e_destino" | "autorizar_e_conferir_prevoo";
  }>;
}

function validarResposta(bruto: unknown, businessIdEsperado: string): CadastroOperacionalConferido | null {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return null;
  const o = bruto as Record<string, unknown>;
  const diagnostico = o.diagnostico_economico;
  const d = diagnostico && typeof diagnostico === "object" && !Array.isArray(diagnostico)
    ? diagnostico as Record<string, unknown> : null;
  const pendencias = Array.isArray(o.pendencias_por_acao) ? o.pendencias_por_acao : null;
  const acoes = new Set(["ler_campanhas", "preparar_campanha", "publicar_campanha"]);
  const motivos = new Set(["verificar_sessao_e_conta", "definir_caminho", "confirmar_orcamento",
    "conferir_atendimento", "revisar_materiais_e_destino", "autorizar_e_conferir_prevoo"]);
  if (o.versao_contrato !== "cadastro_operacional.v2" || o.business_id !== businessIdEsperado
    || o.estado !== "conferido_sem_execucao" || o.persistido !== false
    || o.id_execucao !== null || o.pipeline_disparado !== false
    || o.criacao_autorizada !== false || o.publicacao_autorizada !== false
    || !d || d.estado !== "indisponivel" || d.motivo !== "metodo_economico_nao_disponivel"
    || d.cac_alvo !== null || d.cpl_alvo !== null || d.roas !== null
    || d.lucro_estimado !== null || d.meta_estimada !== null || !pendencias
    || pendencias.some((item) => !item || typeof item !== "object" || Array.isArray(item)
      || !acoes.has(String((item as Record<string, unknown>).acao))
      || !motivos.has(String((item as Record<string, unknown>).motivo)))) return null;
  return {
    versao_contrato: "cadastro_operacional.v2",
    business_id: businessIdEsperado,
    estado: "conferido_sem_execucao",
    persistido: false,
    id_execucao: null,
    pipeline_disparado: false,
    criacao_autorizada: false,
    publicacao_autorizada: false,
    diagnostico_economico: d as CadastroOperacionalConferido["diagnostico_economico"],
    pendencias_por_acao: pendencias as CadastroOperacionalConferido["pendencias_por_acao"],
  };
}

/** Valida o cadastro operacional. Este endpoint não cria nem publica nada. */
export async function conferirCadastroOperacional(
  payload: CadastroOperacionalV2,
): Promise<Resultado<CadastroOperacionalConferido>> {
  const resposta = await enviar("/cadastro/operacional", payload, { contexto: "cadastro-operacional" });
  if (!resposta.ok) return resposta;
  const validado = validarResposta(resposta.dados, payload.business_id);
  if (!validado) {
    registrarErroBackend("cadastro-operacional", {
      metodo: "POST",
      caminho: "/cadastro/operacional (resposta incompatível)",
      categoria: "resposta_ilegivel",
    });
    return falha("resposta_ilegivel");
  }
  return { ok: true, dados: validado };
}
