import type { ReferenciaTriada } from "./triagem-referencias.ts";

export type RevisaoDePertinencia = { id: string; pertenceAoNicho: boolean };
export type AvaliacaoDeCorte = {
  corte: number;
  total: number;
  revisados: number;
  selecionados: number;
  selecionadosSemRevisao: number;
  falsosPositivosConhecidos: number;
  falsosNegativosConhecidos: number;
  precisao: number | null;
  cobertura: number | null;
};

/** Mede só pertinência ao nicho. Não estima vendas, lucro ou direito de uso. */
export function avaliarCortesDePertinencia(
  referencias: readonly ReferenciaTriada[],
  revisoes: readonly RevisaoDePertinencia[],
  cortes: readonly number[] = [0.8, 0.85],
): AvaliacaoDeCorte[] {
  const ids = new Set(referencias.map((r) => r.anuncio.id));
  if (ids.size !== referencias.length) throw new Error("Referências repetidas");
  const julgamentos = new Map<string, boolean>();
  for (const revisao of revisoes) {
    if (!ids.has(revisao.id) || julgamentos.has(revisao.id) ||
      typeof revisao.pertenceAoNicho !== "boolean") throw new Error("Revisão inválida ou repetida");
    julgamentos.set(revisao.id, revisao.pertenceAoNicho);
  }
  return cortes.map((corte) => {
    if (!Number.isFinite(corte) || corte < 0 || corte > 1) throw new Error("Corte inválido");
    const selecionadas = referencias.filter((r) =>
      r.anuncio.situacaoExibida === "ativo" && r.anuncio.midiaObservada === "imagem" &&
      r.diasDesdeInicioExibido !== null && r.jev?.rotulo === "servico_barbearia" &&
      r.jev.confianca >= corte);
    const selecionadasIds = new Set(selecionadas.map((r) => r.anuncio.id));
    const falsosPositivosConhecidos = selecionadas.filter((r) =>
      julgamentos.get(r.anuncio.id) === false).length;
    const falsosNegativosConhecidos = referencias.filter((r) =>
      julgamentos.get(r.anuncio.id) === true && !selecionadasIds.has(r.anuncio.id)).length;
    const completo = julgamentos.size === referencias.length;
    const positivos = [...julgamentos.values()].filter(Boolean).length;
    return {
      corte, total: referencias.length, revisados: julgamentos.size,
      selecionados: selecionadas.length,
      selecionadosSemRevisao: selecionadas.filter((r) => !julgamentos.has(r.anuncio.id)).length,
      falsosPositivosConhecidos, falsosNegativosConhecidos,
      precisao: completo && selecionadas.length ?
        (selecionadas.length - falsosPositivosConhecidos) / selecionadas.length : null,
      cobertura: completo && positivos ?
        (positivos - falsosNegativosConhecidos) / positivos : null,
    };
  });
}
