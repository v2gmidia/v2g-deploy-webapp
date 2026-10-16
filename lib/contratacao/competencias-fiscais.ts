import { valorDoPedidoCentavos, type PeriodoDeCobranca } from "./preco.ts";

export type CompetenciaFiscalPlanejada = {
  competencia: string;
  valorCentavos: number;
};

/**
 * Prévia interna da divisão do serviço, sem criar nota ou presumir início da prestação.
 * Uma mensalidade gera somente a primeira competência: as renovações exigem
 * cobrança e período de serviço próprios antes de qualquer emissão.
 */
export function planejarCompetenciasFiscais(dados: {
  periodo: PeriodoDeCobranca;
  contas: number;
  totalCentavos: number;
  primeiroMesDeServico: string;
  valoresPorCompetenciaCentavos?: number[];
}): CompetenciaFiscalPlanejada[] {
  const {
    periodo, contas, totalCentavos, primeiroMesDeServico,
    valoresPorCompetenciaCentavos,
  } = dados;
  if (!/^\d{4}-(0[1-9]|1[0-2])-01$/.test(primeiroMesDeServico)) {
    throw new Error("Confirme o primeiro mês integral de prestação antes de planejar a nota.");
  }
  if (!Number.isSafeInteger(totalCentavos) || totalCentavos !== valorDoPedidoCentavos(contas, periodo)) {
    throw new Error("O valor do pedido não confere com a oferta contratada.");
  }
  const meses = periodo === "monthly" ? 1 : periodo === "semiannual_upfront" ? 6 : 12;
  const valores = periodo === "monthly" ? [totalCentavos] : valoresPorCompetenciaCentavos;
  if (!valores || valores.length !== meses
      || valores.some(valor => !Number.isSafeInteger(valor) || valor <= 0)
      || valores.reduce((soma, valor) => soma + valor, 0) !== totalCentavos)
    throw new Error("Informe a distribuição fiscal aprovada para cada competência do plano antecipado.");
  const ano = Number(primeiroMesDeServico.slice(0, 4));
  const mes = Number(primeiroMesDeServico.slice(5, 7));
  return valores.map((valorCentavos, indice) => {
    const competencia = new Date(Date.UTC(ano, mes - 1 + indice, 1)).toISOString().slice(0, 10);
    return { competencia, valorCentavos };
  });
}
