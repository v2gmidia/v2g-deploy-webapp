/** Distingue ausência comprovada de pendências de leitura parcial ou falha. */
export function resumirPendencias(entrada: {
  decisoesExibidas: number;
  decisoesTotal: number | null;
  ajustesExibidos: number;
  ajustesTotal: number | null;
}): { total: number | null; leituraCompleta: boolean; ajustesNaoExibidos: number } {
  const { decisoesExibidas, decisoesTotal, ajustesExibidos, ajustesTotal } = entrada;
  const contagensCoerentes = decisoesTotal !== null && ajustesTotal !== null
    && decisoesTotal >= decisoesExibidas && ajustesTotal >= ajustesExibidos;
  const leituraCompleta = contagensCoerentes && decisoesExibidas >= decisoesTotal;
  return {
    total: contagensCoerentes ? decisoesTotal + ajustesTotal : null,
    leituraCompleta,
    ajustesNaoExibidos: ajustesTotal === null ? 0 : Math.max(0, ajustesTotal - ajustesExibidos),
  };
}
