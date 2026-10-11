/** A carteira pode receber só as primeiras 1.000 linhas de cada consulta. */
export function resumoDoTrabalhoDaConta(entrada: {
  operadorId: string;
  responsavelId: string | undefined;
  atribuicoesParciais: boolean;
  tarefasAbertasRetornadas: number;
  tarefasParciais: boolean;
}): string {
  const responsavel = entrada.responsavelId === entrada.operadorId ? "você" :
    entrada.responsavelId ? "outro operador" :
    entrada.atribuicoesParciais ? "não confirmado nesta consulta parcial" : "não atribuído";
  const tarefas = entrada.tarefasParciais ?
    entrada.tarefasAbertasRetornadas > 0 ? `ao menos ${entrada.tarefasAbertasRetornadas}` : "quantidade não confirmada de" :
    String(entrada.tarefasAbertasRetornadas);
  return `Gestor responsável: ${responsavel} · ${tarefas} tarefa(s) aberta(s)`;
}

/** Uma ausência em fonte truncada não serve para decidir a próxima ação. */
export function proximaAcaoConfiavel(acaoCalculada: string, fonteOperacionalIncompleta: boolean): string {
  return fonteOperacionalIncompleta ? "Conferir pedidos, contas e execução nas telas específicas" : acaoCalculada;
}

/** Uma atribuição ausente do recorte só prova vaga quando o recorte está completo. */
export function negociosSemResponsavel<T extends { id: string }>(
  negocios: T[], atribuicoesRetornadas: { business_id: string }[], atribuicoesParciais: boolean,
): T[] {
  if (atribuicoesParciais) return [];
  const atribuidos = new Set(atribuicoesRetornadas.map((a) => a.business_id));
  return negocios.filter((negocio) => !atribuidos.has(negocio.id));
}
