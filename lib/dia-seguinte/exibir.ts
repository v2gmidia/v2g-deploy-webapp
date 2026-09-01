// Extensão `.ts` explícita: o `conferir:dia-seguinte` importa este arquivo
// direto do Node, sem bundler para resolver especificador sem extensão.
// Mesma regra do resto de `lib/dia-seguinte/` e de `lib/nichos/`.
import { dinheiro, dinheiroDeCentavos } from "../formato.ts";

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

/** Dinheiro em centavos, ou o recado de ausência. */
export function dinheiroOuAusencia(centavos: number | null): string {
  return centavos === null ? AINDA_NAO_SABEMOS : dinheiroDeCentavos(centavos);
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
export function frasePorRealInvestido(retornoPorReal: string | null): string | null {
  if (retornoPorReal === null) return null;
  const n = Number(retornoPorReal);
  if (!Number.isFinite(n)) return null;
  return `Pra cada R$ 1 que você colocou, voltaram ${dinheiro(n)}`;
}
