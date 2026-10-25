/** Condições aprovadas para novas contratações em outubro de 2026. */
export const OFERTA_OUTUBRO = {
  precoMensalPorContaCentavos: 50_000,
  permanenciaMinimaMeses: 6,
  unidade: "conta_de_anuncios",
  descontoAntecipacaoPercentual: null,
} as const;

export type MotivoDeInaptidao =
  | "documento_nao_declarado"
  | "venda_por_whatsapp_nao_declarada";

/** Declaração pré-compra; não consulta cadastro nem comprova operação comercial. */
export function avaliarQualificacao(entrada: {
  declaraDocumentoContratante?: boolean | null;
  /** Compatibilidade de chamada anterior: agora significa documento CPF ou CNPJ informado. */
  declaraTerCnpj?: boolean | null;
  declaraVenderPeloWhatsApp: boolean | null;
}): { apto: boolean; motivos: MotivoDeInaptidao[] } {
  const motivos: MotivoDeInaptidao[] = [];
  if ((entrada.declaraDocumentoContratante ?? entrada.declaraTerCnpj) !== true) motivos.push("documento_nao_declarado");
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
