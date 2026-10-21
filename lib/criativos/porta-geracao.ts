/**
 * Contrato local antes de uma chamada paga de imagem. Não consulta o banco,
 * não reserva orçamento de modo atômico e não chama qualquer provedor.
 * A integração deverá carregar o histórico do mesmo negócio e reservar o
 * teto da tentativa em transação antes de usar esta decisão.
 */

export type TipoDaTentativa = "inicial" | "refacao";
export type EstadoDaTentativa = "reservada" | "concluida" | "falhou";

export interface TentativaDeImagem {
  businessId: string;
  tipo: TipoDaTentativa;
  estado: EstadoDaTentativa;
  /** Valor máximo reservado ou custo final cobrado, mesmo após falha. */
  custoCentavos: number | null;
}

export interface EntradaDaPortaDeGeracao {
  businessId: string;
  tipo: TipoDaTentativa;
  instrucaoDaRefacao?: string | null;
  historicoCompleto: boolean;
  tentativas: TentativaDeImagem[];
  /** Limite aprovado para esta sequência de uma peça, não um padrão global. */
  limiteTotalCentavos: number | null;
  /** Pior custo possível desta chamada segundo a configuração do provedor. */
  tetoDaProximaTentativaCentavos: number | null;
}

export type BloqueioDaGeracao =
  | "negocio_ausente"
  | "historico_incompleto"
  | "historico_de_outro_negocio"
  | "custo_desconhecido"
  | "limite_nao_aprovado"
  | "teto_da_chamada_desconhecido"
  | "tentativa_em_andamento"
  | "imagem_inicial_ja_entregue"
  | "imagem_inicial_pendente"
  | "instrucao_da_refacao_ausente"
  | "limite_de_refacoes"
  | "orcamento_insuficiente";

function centavosValidos(valor: number | null): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
}

export function avaliarPortaDeGeracao(entrada: EntradaDaPortaDeGeracao):
  | { ok: true; saldoDepoisDaReservaCentavos: number; refacoesRestantesDepois: number }
  | { ok: false; bloqueios: BloqueioDaGeracao[] } {
  const bloqueios: BloqueioDaGeracao[] = [];
  const businessId = entrada.businessId?.trim();
  if (!businessId) bloqueios.push("negocio_ausente");
  if (!entrada.historicoCompleto) bloqueios.push("historico_incompleto");
  if (entrada.tentativas.some((item) => item.businessId !== businessId))
    bloqueios.push("historico_de_outro_negocio");
  if (entrada.tentativas.some((item) => !centavosValidos(item.custoCentavos)))
    bloqueios.push("custo_desconhecido");
  if (!centavosValidos(entrada.limiteTotalCentavos) || entrada.limiteTotalCentavos === 0)
    bloqueios.push("limite_nao_aprovado");
  if (!centavosValidos(entrada.tetoDaProximaTentativaCentavos)
    || entrada.tetoDaProximaTentativaCentavos === 0)
    bloqueios.push("teto_da_chamada_desconhecido");
  if (entrada.tentativas.some((item) => item.estado === "reservada"))
    bloqueios.push("tentativa_em_andamento");

  const iniciaisEntregues = entrada.tentativas.filter((item) =>
    item.tipo === "inicial" && item.estado === "concluida").length;
  const refacoesEntregues = entrada.tentativas.filter((item) =>
    item.tipo === "refacao" && item.estado === "concluida").length;
  if (entrada.tipo === "inicial" && iniciaisEntregues > 0)
    bloqueios.push("imagem_inicial_ja_entregue");
  if (entrada.tipo === "refacao") {
    if (iniciaisEntregues !== 1) bloqueios.push("imagem_inicial_pendente");
    if (!entrada.instrucaoDaRefacao?.trim()) bloqueios.push("instrucao_da_refacao_ausente");
    if (refacoesEntregues >= 3) bloqueios.push("limite_de_refacoes");
  }

  const gastoConhecido = entrada.tentativas.reduce((total, item) =>
    total + (centavosValidos(item.custoCentavos) ? item.custoCentavos : 0), 0);
  const saldoDepoisDaReserva = (entrada.limiteTotalCentavos ?? 0)
    - gastoConhecido - (entrada.tetoDaProximaTentativaCentavos ?? 0);
  if (!Number.isSafeInteger(gastoConhecido) || saldoDepoisDaReserva < 0)
    bloqueios.push("orcamento_insuficiente");

  if (bloqueios.length) return { ok: false, bloqueios };
  return {
    ok: true,
    saldoDepoisDaReservaCentavos: saldoDepoisDaReserva,
    refacoesRestantesDepois: Math.max(0, 3 - refacoesEntregues - (entrada.tipo === "refacao" ? 1 : 0)),
  };
}
