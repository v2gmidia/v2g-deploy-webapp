/**
 * Formatação de número e dinheiro em pt-BR.
 *
 * Existe como módulo porque /campanhas e /inicio mostram os mesmos
 * valores com as mesmas regras — e uma delas é sutil o bastante para
 * não querer duas versões: o retorno por real investido é sempre
 * ARREDONDADO PARA BAIXO.
 *
 * O protótipo dizia, na explicação do cálculo: "é uma estimativa
 * honesta: pode faltar venda aqui, nunca sobrar. Na dúvida,
 * arredondamos pra baixo". Arredondar para cima transformaria essa
 * frase em mentira na terceira casa decimal.
 */

export function dinheiro(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function numero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

/**
 * Retorno por real investido, arredondado para baixo em 2 casas.
 * `null` quando não houve investimento — dividir por zero aqui daria
 * `Infinity`, que apareceria na tela como um número absurdo.
 */
export function retornoPorReal(receita: number, investido: number): number | null {
  if (!investido || investido <= 0) return null;
  return Math.floor((receita / investido) * 100) / 100;
}
