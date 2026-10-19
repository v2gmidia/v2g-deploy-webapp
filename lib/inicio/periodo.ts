export const PERIODOS_DO_INICIO = [
  { id: "1m", rotulo: "1 mês", meses: 1 },
  { id: "3m", rotulo: "3 meses", meses: 3 },
  { id: "6m", rotulo: "6 meses", meses: 6 },
  { id: "1a", rotulo: "1 ano", meses: 12 },
] as const;

export type PeriodoDoInicio = (typeof PERIODOS_DO_INICIO)[number]["id"];

export function periodoDoInicio(valor: string | undefined): PeriodoDoInicio {
  return PERIODOS_DO_INICIO.some((periodo) => periodo.id === valor)
    ? valor as PeriodoDoInicio
    : "1m";
}

export function rotuloDoPeriodo(periodo: PeriodoDoInicio): string {
  return PERIODOS_DO_INICIO.find((opcao) => opcao.id === periodo)!.rotulo;
}

/**
 * Volta meses de calendário sem transformar 31 de março em 3 de março.
 * Quando o mês de destino é menor, usa seu último dia.
 */
export function inicioDoPeriodo(ate: string, periodo: PeriodoDoInicio): string {
  const [ano, mes, dia] = ate.split("-").map(Number) as [number, number, number];
  const quantidade = PERIODOS_DO_INICIO.find((opcao) => opcao.id === periodo)!.meses;
  const indiceDoMes = ano * 12 + (mes - 1) - quantidade;
  const anoDeDestino = Math.floor(indiceDoMes / 12);
  const mesDeDestino = indiceDoMes - anoDeDestino * 12;
  const ultimoDia = new Date(Date.UTC(anoDeDestino, mesDeDestino + 1, 0)).getUTCDate();
  const diaDeDestino = Math.min(dia, ultimoDia);

  return new Date(Date.UTC(anoDeDestino, mesDeDestino, diaDeDestino))
    .toISOString()
    .slice(0, 10);
}
