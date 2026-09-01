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

/**
 * Dinheiro que chegou em CENTAVOS inteiros.
 *
 * O backend do "dia seguinte" fala centavos ("centavos inteiros, nunca
 * float"), e o `dinheiro()` acima fala reais. A conversão acontece **na
 * hora de exibir**, aqui, e não na fronteira de rede: dividir por 100 ao
 * receber jogaria fora a garantia de inteiro logo na porta.
 *
 * `null` NÃO VIRA R$ 0,00. Quem chama decide o que escrever no lugar —
 * "não sabemos" e "não gastou nada" são coisas diferentes, e a tela que
 * as confunde mente sobre o dinheiro do cliente.
 */
export function dinheiroDeCentavos(centavos: number): string {
  return dinheiro(centavos / 100);
}
