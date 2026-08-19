/**
 * Os relógios do pipeline — quanto tempo de silêncio vira "demorando" e
 * quanto vira "parou".
 *
 * SEM `server-only`: são números, não segredo, e a `/saude-meta` pode
 * querer mostrá-los na tela para o operador saber com que régua está
 * medindo.
 *
 * ============================================================
 * ATENÇÃO: 20 E 90 SÃO CHUTE. NINGUÉM MEDIU.
 *
 * A base tem 4 execuções, todas de 05/08/2026, nenhuma acompanhada do
 * começo ao fim com relógio. Não existe medição da duração real de um
 * pipeline — nem da mediana, nem do pior caso, nem da diferença entre
 * um negócio com site (que roda `varrer-site`) e um sem.
 *
 * Estão como variável de ambiente para poderem ser corrigidos sem
 * deploy no dia em que alguém medir. **Quando a medição existir, ela
 * vira documento próprio e estes números mudam** — e este aviso só sai
 * depois disso. Enquanto ele estiver aqui, os dois cortes são palpite.
 *
 * O risco de errar para baixo: a `/saude-meta` acusa execução saudável
 * de parada, e o operador aprende a ignorar o bloco. O risco de errar
 * para cima: execução travada de verdade fica invisível por horas.
 * Entre os dois, errar para baixo é o lado reversível — dá para ver o
 * falso positivo; não dá para ver o que não apareceu.
 * ============================================================
 */

function minutosDoAmbiente(chave: string, padrao: number): number {
  const bruto = process.env[chave];
  if (bruto === undefined) return padrao;
  const n = Number(bruto);
  // Valor sujo no ambiente cai no padrão em vez de virar NaN. Um NaN aqui
  // faria toda comparação de tempo devolver `false`, e o bloco de
  // execuções paradas ficaria eternamente vazio — falha silenciosa, que é
  // o pior jeito de este arquivo quebrar.
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`[pipeline] ${chave}="${bruto}" não é minuto válido; usando ${padrao}`);
    return padrao;
  }
  return n;
}

/** Silêncio a partir do qual a execução merece um olhar. */
export const MINUTOS_ATE_DEMORANDO = minutosDoAmbiente("V2G_MIN_ATE_DEMORANDO", 20);

/** Silêncio a partir do qual a gente trata como parada. */
export const MINUTOS_ATE_PARADA = minutosDoAmbiente("V2G_MIN_ATE_PARADA", 90);

/** Minutos que a trava de concorrência do disparo segura (§4.3). */
export const MINUTOS_ATE_DESTRAVAR_DISPARO = 2;

export type Andamento = "andando" | "demorando" | "parada" | "esperando_cliente";

/**
 * Como está uma execução, pelo silêncio dela.
 *
 * Conta desde `atualizado_em`, **não** desde `criado_em`. A `/processando`
 * de hoje conta desde a criação, e isso é pior: um pipeline que avançou
 * aos 29 minutos parece travado aos 31.
 *
 * `aguardando_fotos` NÃO entra nos cortes. Ele não está parado — está
 * esperando o cliente mandar foto. Um relógio correndo ali acusaria a
 * gente de uma falha que é pendência dele, e é a mesma disciplina do
 * `nao_sei` em `lib/cadastro/pendencias.ts`: nunca esconder de quem é a
 * vez.
 *
 * Estados terminais (`estrutura_pronta`, `gerado`) também ficam de fora:
 * eles acabaram, e uma execução acabada há três dias não está "parada".
 */
export function andamentoDaExecucao(
  status: string,
  atualizadoEm: string | null,
  agora: Date,
): Andamento {
  if (status === "aguardando_fotos") return "esperando_cliente";
  if (status === "estrutura_pronta" || status === "gerado") return "andando";

  if (!atualizadoEm) return "andando";
  const t = Date.parse(atualizadoEm);
  if (!Number.isFinite(t)) return "andando";

  const minutos = (agora.getTime() - t) / 60_000;
  if (minutos >= MINUTOS_ATE_PARADA) return "parada";
  if (minutos >= MINUTOS_ATE_DEMORANDO) return "demorando";
  return "andando";
}
