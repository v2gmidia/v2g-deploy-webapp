/** Contrato de leitura da mesa. Valores monetários em centavos; cada conta tem um único tipo de resultado. */
export type PeriodoMesa = 7 | 14 | 30;
export type EstadoMesa = "critico" | "atencao" | "saudavel" | "sem_dados";
export type TipoResultadoMesa = "conversas" | "leads" | "compras";

export interface DiaMesa {
  data: string;
  gastoCentavos: number;
  impressoes: number;
  cliquesLink: number;
  resultados: number;
}

export interface CriativoMesa {
  id: string;
  nome: string;
  formato: "Imagem";
  conceito: "oferta" | "ambiente" | "prova";
  titulo: string;
  ativo: boolean;
  dias: DiaMesa[];
}

export interface ContaMesa {
  id: string;
  negocio: string;
  nomeConta: string;
  responsavel: string;
  nicho: string;
  canal: "Meta Ads";
  tipoResultado: TipoResultadoMesa;
  moeda: "BRL";
  atualizadoEm: string | null;
  leitura: "disponivel" | "indisponivel";
  dias: DiaMesa[];
  /** Valor único do período informado pela fonte. Nunca somar alcance diário para obtê-lo. */
  frequenciaPorPeriodo: Record<PeriodoMesa, number | null>;
  tetoMensalCentavos: number | null;
  cobranca: { tipo: "pre_pago"; saldoCentavos: number | null }
    | { tipo: "pos_pago"; emAbertoCentavos: number | null };
  metas: { custoResultadoMaxCentavos: number | null; ctrMin: number | null; frequenciaMax: number | null; amostraMinimaResultados: number };
  criativos: CriativoMesa[];
}

export interface MetricasMesa {
  gastoCentavos: number;
  impressoes: number;
  cliquesLink: number;
  resultados: number;
  cprCentavos: number | null;
  cpcCentavos: number | null;
  cpmCentavos: number | null;
  ctr: number | null;
}

export interface SinalMesa {
  estado: EstadoMesa;
  titulo: string;
  motivo: string;
  proximoPasso: string;
  dimensao: "dados" | "aquisicao" | "verba";
}

export function intervaloMesa(referencia: string, dias: PeriodoMesa, anterior = false) {
  const fim = new Date(`${referencia}T12:00:00Z`);
  if (anterior) fim.setUTCDate(fim.getUTCDate() - dias);
  const inicio = new Date(fim);
  inicio.setUTCDate(inicio.getUTCDate() - dias + 1);
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

export function diasDoPeriodo(dados: DiaMesa[], referencia: string, periodo: PeriodoMesa, anterior = false) {
  const { inicio, fim } = intervaloMesa(referencia, periodo, anterior);
  return dados.filter((dia) => dia.data >= inicio && dia.data <= fim);
}

export function leituraCompletaMesa(conta: ContaMesa, referencia: string, periodo: PeriodoMesa) {
  const dias = diasDoPeriodo(conta.dias, referencia, periodo);
  return conta.leitura === "disponivel" && conta.atualizadoEm?.slice(0, 10) === referencia && dias.length === periodo &&
    new Set(dias.map((d) => d.data)).size === periodo && dias.every((d) =>
      [d.gastoCentavos, d.impressoes, d.cliquesLink, d.resultados].every((v) => Number.isFinite(v) && v >= 0));
}

export function metricasMesa(dias: DiaMesa[]): MetricasMesa {
  const total = dias.reduce((soma, dia) => ({
    gastoCentavos: soma.gastoCentavos + dia.gastoCentavos,
    impressoes: soma.impressoes + dia.impressoes,
    cliquesLink: soma.cliquesLink + dia.cliquesLink,
    resultados: soma.resultados + dia.resultados,
  }), { gastoCentavos: 0, impressoes: 0, cliquesLink: 0, resultados: 0 });
  return { ...total,
    cprCentavos: total.resultados > 0 ? total.gastoCentavos / total.resultados : null,
    cpcCentavos: total.cliquesLink > 0 ? total.gastoCentavos / total.cliquesLink : null,
    cpmCentavos: total.impressoes > 0 ? total.gastoCentavos / total.impressoes * 1000 : null,
    ctr: total.impressoes > 0 ? total.cliquesLink / total.impressoes * 100 : null,
  };
}

/** Sem base anterior, a variação é desconhecida; não é zero nem crescimento infinito. */
export function variacaoMesa(atual: number | null, anterior: number | null) {
  return atual !== null && anterior !== null && anterior > 0 ? (atual / anterior - 1) * 100 : null;
}

export function verbaMesa(conta: ContaMesa, referencia: string) {
  const mes = referencia.slice(0, 7);
  const dias = conta.dias.filter((dia) => dia.data.startsWith(mes) && dia.data <= referencia);
  const teto = conta.tetoMensalCentavos;
  const dia = Number(referencia.slice(8, 10));
  const diasNoMes = new Date(Date.UTC(Number(referencia.slice(0, 4)), Number(referencia.slice(5, 7)), 0)).getUTCDate();
  const completa = dias.length === dia && new Set(dias.map((d) => d.data)).size === dia;
  const gasto = completa ? dias.reduce((soma, d) => soma + d.gastoCentavos, 0) : null;
  const esperado = teto !== null && teto > 0 ? teto * dia / diasNoMes : null;
  return { gastoCentavos: gasto, tetoCentavos: teto, completa,
    restanteCentavos: teto !== null && gasto !== null ? teto - gasto : null,
    percentual: teto !== null && teto > 0 && gasto !== null ? gasto / teto * 100 : null,
    razaoDoRitmo: esperado !== null && gasto !== null ? gasto / esperado : null, dia, diasNoMes };
}

export function estadoDoRitmoMesa(verba: ReturnType<typeof verbaMesa>): EstadoMesa {
  if (!verba.completa || verba.razaoDoRitmo === null) return "sem_dados";
  return verba.razaoDoRitmo > 1.2 || verba.razaoDoRitmo < .8 ? "atencao" : "saudavel";
}

export function estadoDoCustoMesa(custoCentavos: number | null, metaCentavos: number | null,
  resultados: number, amostraMinima: number): EstadoMesa {
  if (custoCentavos === null || metaCentavos === null || metaCentavos <= 0 || resultados <= 0) return "sem_dados";
  if (resultados < amostraMinima) return "atencao";
  return custoCentavos / metaCentavos > 1.3 ? "critico" : custoCentavos > metaCentavos ? "atencao" : "saudavel";
}

export function sinaisDaConta(conta: ContaMesa, referencia: string, periodo: PeriodoMesa): SinalMesa[] {
  const dias = diasDoPeriodo(conta.dias, referencia, periodo);
  const atual = metricasMesa(dias);
  if (!leituraCompletaMesa(conta, referencia, periodo)) return [{
    estado: "sem_dados", titulo: "Leitura incompleta", dimensao: "dados",
    motivo: "Não há uma leitura atual e completa para o período selecionado.",
    proximoPasso: "Conferir a sincronização antes de avaliar o desempenho.",
  }];
  const amostraInsuficiente = atual.resultados > 0 && atual.resultados < conta.metas.amostraMinimaResultados;
  const sinais: SinalMesa[] = [];
  if (amostraInsuficiente) sinais.push({
    estado: "atencao", titulo: "Amostra para conferir", dimensao: "dados",
    motivo: "O período ainda não alcançou a amostra mínima de resultados configurada para esta conta.",
    proximoPasso: "Conferir a medição, o tempo de veiculação e a amostra antes de atribuir a causa ao criativo.",
  });
  const meta = conta.metas.custoResultadoMaxCentavos;
  if (!amostraInsuficiente && meta !== null && meta > 0 && atual.cprCentavos !== null && atual.cprCentavos > meta) sinais.push({
    estado: atual.cprCentavos / meta > 1.3 ? "critico" : "atencao", titulo: "Custo acima da meta", dimensao: "aquisicao",
    motivo: `Custo por resultado acima do limite configurado para esta conta (${Math.round((atual.cprCentavos / meta - 1) * 100)}%).`,
    proximoPasso: "Comparar os criativos, o destino e a qualidade das conversas antes de decidir o ajuste.",
  });
  if (atual.gastoCentavos > 0 && atual.resultados === 0) sinais.push({
    estado: "atencao", titulo: "Sem resultado registrado", dimensao: "aquisicao",
    motivo: "Há investimento no período, mas nenhum resultado registrado pela fonte.",
    proximoPasso: "Conferir a medição e a entrega antes de atribuir a causa ao criativo.",
  });
  if (conta.cobranca.tipo === "pre_pago" && conta.cobranca.saldoCentavos !== null &&
    conta.cobranca.saldoCentavos < atual.gastoCentavos / periodo * 2) sinais.push({
    estado: "critico", titulo: "Saldo baixo", dimensao: "verba",
    motivo: "O saldo disponível cobre menos de dois dias no gasto médio deste período.",
    proximoPasso: "Conferir o saldo e alinhar a reposição de mídia com o cliente.",
  });
  const verba = verbaMesa(conta, referencia);
  if (!verba.completa) sinais.push({
    estado: "sem_dados", titulo: "Verba mensal incompleta", dimensao: "dados",
    motivo: "A leitura do mês não está completa; gasto acumulado, restante e ritmo não podem ser confirmados.",
    proximoPasso: "Conferir todos os dias do mês antes de avaliar o orçamento.",
  });
  if (verba.razaoDoRitmo !== null && (verba.razaoDoRitmo > 1.2 || verba.razaoDoRitmo < .8)) sinais.push({
    estado: "atencao", titulo: verba.razaoDoRitmo > 1.2 ? "Gasto acelerado" : "Gasto abaixo do ritmo", dimensao: "verba",
    motivo: "O gasto acumulado diverge mais de 20% da distribuição linear do teto mensal. É um sinal para conferir, não uma ordem para mudar a verba.",
    proximoPasso: "Conferir calendário de veiculação, limites e estratégia da conta.",
  });
  const frequencia = conta.frequenciaPorPeriodo[periodo];
  if (frequencia !== null && conta.metas.frequenciaMax !== null && frequencia > conta.metas.frequenciaMax) sinais.push({
    estado: "atencao", titulo: "Frequência para conferir", dimensao: "aquisicao",
    motivo: "A frequência do período ultrapassou o limite configurado para esta conta.",
    proximoPasso: "Investigar repetição de exposição junto com custo e tendência dos criativos.",
  });
  if (conta.metas.ctrMin !== null && atual.ctr !== null && atual.ctr < conta.metas.ctrMin) sinais.push({
    estado: "atencao", titulo: "CTR abaixo da meta", dimensao: "aquisicao",
    motivo: "A taxa de clique no link está abaixo da meta configurada para a conta.",
    proximoPasso: "Conferir promessa, imagem e chamada para ação; a taxa isolada não comprova a causa.",
  });
  if (meta === null || meta <= 0 || conta.metas.ctrMin === null || conta.metas.frequenciaMax === null || verba.tetoCentavos === null || verba.tetoCentavos <= 0 ||
    frequencia === null || (conta.cobranca.tipo === "pre_pago" ? conta.cobranca.saldoCentavos === null : conta.cobranca.emAbertoCentavos === null)) sinais.push({
    estado: "sem_dados", titulo: "Critérios incompletos", dimensao: "dados",
    motivo: "Faltam limites ou dados necessários para avaliar todos os critérios da conta.",
    proximoPasso: "Conferir as metas e fontes ausentes antes de considerar a conta em dia.",
  });
  return sinais.length ? sinais : [{ estado: "saudavel", titulo: "Dentro dos critérios", dimensao: "aquisicao",
    motivo: "Não há desvio nos critérios medidos deste período. Isso não comprova vendas nem elimina revisões periódicas.",
    proximoPasso: "Manter o acompanhamento e conferir a qualidade dos resultados no processo comercial.",
  }];
}

export const ordemMesa: Record<EstadoMesa, number> = { critico: 0, atencao: 1, sem_dados: 2, saudavel: 3 };
export function sinalPrincipalMesa(sinais: SinalMesa[]): SinalMesa {
  return [...sinais].sort((a, b) => ordemMesa[a.estado] - ordemMesa[b.estado])[0] ?? {
    estado: "sem_dados", titulo: "Avaliação indisponível", dimensao: "dados",
    motivo: "Nenhum critério foi avaliado nesta consulta.", proximoPasso: "Conferir as fontes e os critérios da conta.",
  };
}
