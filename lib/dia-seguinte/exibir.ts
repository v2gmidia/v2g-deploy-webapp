// Extensão `.ts` explícita: o `conferir:dia-seguinte` importa este arquivo
// direto do Node, sem bundler para resolver especificador sem extensão.
// Mesma regra do resto de `lib/dia-seguinte/` e de `lib/nichos/`.
import { dinheiro, dinheiroDeCentavos, type Moeda } from "../formato.ts";

/**
 * Como um número que pode faltar aparece na tela.
 *
 * ============================================================
 * `null` NUNCA VIRA `R$ 0,00`. É A REGRA 1 DO CONTRATO, NA TELA.
 *
 * "A tela nunca deve renderizar `null` como R$ 0,00." E não é preciosismo:
 * `investiu_centavos: null` significa **não sabemos** — o coletor da Meta
 * está desligado até o App Review. Mostrar R$ 0,00 diz ao dono que a
 * campanha dele não gastou nada, que é uma afirmação sobre o dinheiro
 * dele, e é falsa.
 *
 * O mesmo vale para o outro lado: `vendas: null` é "ele não respondeu",
 * `vendas: 0` é "ele respondeu que não vendeu". Zero venda é sinal forte e
 * não pode virar silêncio, nem silêncio virar zero.
 * ============================================================
 *
 * SEM `server-only`: a `/inicio` é Server Component hoje, mas o card da
 * pergunta diária é de cliente, e os dois mostram os mesmos números.
 */

/**
 * O que se escreve no lugar do número que não existe.
 *
 * "Ainda" faz o trabalho: diz que a ausência é temporária e nossa, não uma
 * limitação que o cliente tem que resolver. Sem ele, "não sabemos" soa
 * como desistência.
 */
export const AINDA_NAO_SABEMOS = "ainda não sabemos";

/**
 * Dinheiro em centavos, ou o recado de ausência.
 *
 * ============================================================
 * A MOEDA VEM DO CONSOLIDADO, E `null` SAI SEM SÍMBOLO.
 *
 * Até 10/09/2026 isto chamava um `dinheiroDeCentavos` com `"BRL"` cravado
 * lá dentro. Com a Byond cobrando em AUD no mesmo banco, era um erro de
 * fator de câmbio — ver o bloco de `lib/formato.ts`.
 *
 * Quem chama passa `consolidado.moeda`, que o backend manda no TOPO da
 * resposta. Ele vindo `null` não autoriza assumir real: o número sai sem
 * símbolo e quem lê a tela vê que a moeda não está declarada.
 * ============================================================
 */
export function dinheiroOuAusencia(centavos: number | null, moeda: Moeda | null): string {
  return centavos === null ? AINDA_NAO_SABEMOS : dinheiroDeCentavos(centavos, moeda);
}

/** Contagem, ou o recado de ausência. `0` é contagem, e aparece. */
export function contagemOuAusencia(valor: number | null): string {
  return valor === null ? AINDA_NAO_SABEMOS : String(valor);
}

/**
 * O retorno por real, como frase.
 *
 * ============================================================
 * O NÚMERO VEM CALCULADO DO BACKEND, E NÃO SE RECALCULA AQUI.
 *
 * O contrato é explícito: `retorno_por_real` "vem calculado, ou vem null.
 * É null quando falta um lado ou o investimento é zero. NÃO RECALCULE no
 * cliente: o campo existe para a divisão por zero ter um tratamento só."
 *
 * Esta função só o veste de frase. Se algum dia ela dividir alguma coisa,
 * alguém desfez a decisão.
 * ============================================================
 *
 * Sem jargão: nada de "ROAS". A frase é a que o dono usa — "para cada R$ 1
 * que você colocou, voltaram R$ X".
 */
export function frasePorRealInvestido(
  retornoPorReal: string | null,
  moeda: Moeda | null,
): string | null {
  if (retornoPorReal === null) return null;
  const n = Number(retornoPorReal);
  if (!Number.isFinite(n)) return null;
  // ============================================================
  // OS DOIS LADOS DA FRASE USAM A MESMA MOEDA, e o `R$ 1` era literal.
  //
  // A razão é adimensional — "voltaram 2,40 para cada 1 investido" vale
  // em qualquer moeda. O que NÃO vale é escrever `R$` nos dois lados de
  // uma conta australiana. Sem moeda declarada, os dois lados saem sem
  // símbolo, e a frase continua verdadeira.
  // ============================================================
  return `Pra cada ${dinheiro(1, moeda)} que você colocou, voltaram ${dinheiro(n, moeda)}`;
}
