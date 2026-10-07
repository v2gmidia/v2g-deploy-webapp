/** Condições aprovadas para novas contratações em outubro de 2026. */
export const OFERTA_OUTUBRO = {
  precoMensalPorContaCentavos: 50_000,
  permanenciaMinimaMeses: 6,
  unidade: "conta_de_anuncios",
  descontoAntecipacaoPercentual: null,
} as const;

export type MotivoDeInaptidao =
  | "cnpj_nao_declarado"
  | "venda_por_whatsapp_nao_declarada";

/** Declaração pré-compra; não consulta CNPJ nem comprova operação comercial. */
export function avaliarQualificacao(entrada: {
  declaraTerCnpj: boolean | null;
  declaraVenderPeloWhatsApp: boolean | null;
}): { apto: boolean; motivos: MotivoDeInaptidao[] } {
  const motivos: MotivoDeInaptidao[] = [];
  if (entrada.declaraTerCnpj !== true) motivos.push("cnpj_nao_declarado");
  if (entrada.declaraVenderPeloWhatsApp !== true) {
    motivos.push("venda_por_whatsapp_nao_declarada");
  }
  return { apto: motivos.length === 0, motivos };
}

/** Valor-base mensal em centavos. Desconto antecipado ainda não foi decidido. */
export function mensalidadeBaseCentavos(quantidadeDeContas: number): number | null {
  if (!Number.isSafeInteger(quantidadeDeContas) || quantidadeDeContas < 1) return null;
  const total = quantidadeDeContas * OFERTA_OUTUBRO.precoMensalPorContaCentavos;
  return Number.isSafeInteger(total) ? total : null;
}
