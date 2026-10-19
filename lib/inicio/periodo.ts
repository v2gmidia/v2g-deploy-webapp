export type IntervaloDoInicio = { desde: string; ate: string; hoje: string; erro?: string };

/** Validação compartilhada: não permite datas normalizadas silenciosamente pelo Date. */
export function erroDoIntervalo(desde: string, ate: string, hoje: string): string | null {
  const valida = (dia: string) => /^\d{4}-\d{2}-\d{2}$/.test(dia)
    && dia >= "0001-01-01"
    && Number.isFinite(Date.parse(dia + "T00:00:00Z"))
    && new Date(dia + "T00:00:00Z").toISOString().slice(0, 10) === dia;
  if (!valida(desde) || !valida(ate)) return "Preencha as duas datas com dias válidos.";
  if (desde > ate) return "A data final precisa ser igual ou posterior à data inicial.";
  if (ate > hoje) return "Escolha um período até hoje.";
  return null;
}

export function intervaloDoInicio(
  busca: Record<string, string | string[] | undefined>,
  hoje: string,
): IntervaloDoInicio {
  const primeiro = (valor: string | string[] | undefined) => Array.isArray(valor) ? valor[0] : valor;
  const padrao = { desde: `${hoje.slice(0, 8)}01`, ate: hoje, hoje };
  if (busca.desde === undefined && busca.ate === undefined) {
    // Preserva links antigos, sem limitar as escolhas do novo calendário.
    return busca.periodo ? { ...padrao, desde: inicioDoPeriodo(hoje, periodoDoInicio(primeiro(busca.periodo))) } : padrao;
  }
  const desde = primeiro(busca.desde) ?? "";
  const ate = primeiro(busca.ate) ?? "";
  const erro = erroDoIntervalo(desde, ate, hoje);
  return erro ? { ...padrao, erro: `${erro} Mostrando o mês atual.` } : { desde, ate, hoje };
}

export function rotuloDoIntervalo({ desde, ate }: Pick<IntervaloDoInicio, "desde" | "ate">): string {
  const formatar = (dia: string) => dia.split("-").reverse().join("/");
  return `${formatar(desde)} – ${formatar(ate)}`;
}

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
