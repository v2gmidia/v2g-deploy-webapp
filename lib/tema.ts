export const COOKIE_TEMA = "v2g_tema";
export type Tema = "claro" | "escuro" | "sistema";

/** Cookie apagado pode voltar como string vazia na mesma requisição.
 * Ausência, vazio e valores inválidos respeitam a preferência do aparelho.
 * Compartilhado pelos leitores sem exportar utilitários do layout Next.
 */
export function temaDoCookie(bruto: string | undefined): Tema {
  return bruto === "claro" || bruto === "escuro" ? bruto : "sistema";
}
