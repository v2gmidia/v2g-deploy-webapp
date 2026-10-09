export type PeriodoDeCobranca = "monthly" | "semiannual_upfront" | "annual_upfront";

export const MENSALIDADE_POR_CONTA_CENTAVOS = 50_000;
export const DESCONTO_ANUAL_A_VISTA_PERCENTUAL = 12;
export const DESCONTO_SEMESTRAL_A_VISTA_PERCENTUAL = 5;

/** Valor fechado por pedido; centavos inteiros e uma unidade por conta. */
export function valorDoPedidoCentavos(
  contas: number,
  periodo: PeriodoDeCobranca,
): number {
  if (!Number.isSafeInteger(contas) || contas < 1) {
    throw new Error("Quantidade de contas inválida.");
  }
  if (periodo !== "monthly" && periodo !== "semiannual_upfront" && periodo !== "annual_upfront") {
    throw new Error("Período de cobrança inválido.");
  }
  const porConta = periodo === "monthly" ? MENSALIDADE_POR_CONTA_CENTAVOS
    : periodo === "semiannual_upfront"
      ? MENSALIDADE_POR_CONTA_CENTAVOS * 6
        * (100 - DESCONTO_SEMESTRAL_A_VISTA_PERCENTUAL) / 100
      : MENSALIDADE_POR_CONTA_CENTAVOS * 12
        * (100 - DESCONTO_ANUAL_A_VISTA_PERCENTUAL) / 100;
  const total = porConta * contas;
  if (!Number.isSafeInteger(total)) throw new Error("Valor do pedido inválido.");
  return total;
}
