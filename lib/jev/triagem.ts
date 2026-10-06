export type PrioridadeJev = "alta" | "media" | "baixa";

export type MotivoDaTriagem =
  | "prazo_operacional"
  | "acesso_ou_reuniao"
  | "resposta_do_cliente"
  | "dados_insuficientes";

/**
 * Contrato mínimo enviado ao Jev no piloto P0.
 *
 * Não entra nome, telefone, e-mail, CNPJ, descrição do negócio,
 * valores financeiros ou o texto integral das respostas. A IA só precisa
 * conhecer o tipo da pendência, sua idade e qual caminho a resolve.
 */
export interface EstadoDaTriagem {
  versao: "jev-p0-v1";
  pendencias: Array<{
    campo: string;
    motivo: string;
    caminho: string;
    diasEsperando: number | null;
  }>;
}

export interface SugestaoDaTriagem {
  prioridade: PrioridadeJev;
  motivo: MotivoDaTriagem;
  exigeRevisaoHumana: true;
}

/**
 * A regra da casa continua disponível se Jev estiver desligado, indisponível
 * ou pouco seguro. Ela também serve como linha de base para medir se o piloto
 * melhora a fila, em vez de apenas trocar uma regra por outra.
 */
export function sugestaoDeterministica(estado: EstadoDaTriagem): SugestaoDaTriagem {
  const maiorEspera = Math.max(
    -1,
    ...estado.pendencias.map((pendencia) => pendencia.diasEsperando ?? -1),
  );

  if (maiorEspera >= 5) {
    return {
      prioridade: "alta",
      motivo: "prazo_operacional",
      exigeRevisaoHumana: true,
    };
  }

  if (estado.pendencias.some((pendencia) => pendencia.motivo === "nao_sei")) {
    return {
      prioridade: "media",
      motivo: "resposta_do_cliente",
      exigeRevisaoHumana: true,
    };
  }

  return {
    prioridade: "baixa",
    motivo: "dados_insuficientes",
    exigeRevisaoHumana: true,
  };
}

export function estadoDaTriagem(
  pendencias: EstadoDaTriagem["pendencias"],
): EstadoDaTriagem {
  return { versao: "jev-p0-v1", pendencias };
}
