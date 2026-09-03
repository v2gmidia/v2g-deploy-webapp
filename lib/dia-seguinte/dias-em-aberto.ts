import { diasAntesDe } from "./dia.ts";
import type { ConsolidadoBase } from "./tipos";

/**
 * Quais dias o dono ainda não respondeu — por SUBTRAÇÃO DE CALENDÁRIO.
 *
 * ============================================================
 * ESTA FUNÇÃO É PROVISÓRIA POR CONSTRUÇÃO. TROQUE-A QUANDO PUDER.
 *
 * Ela existe porque hoje **não dá para saber a quem a pergunta foi
 * feita**. O backend tem `execucoes_de_rotina`, com chave `(tarefa, dia)`
 * e idempotente — mas ela registra que a ROTINA rodou, não que a pergunta
 * chegou a um cliente específico. O registro por cliente foi pedido e não
 * existe (03/09/2026).
 *
 * Sem ele, "dia em aberto" só pode ser deduzido: enumera-se o calendário e
 * subtraem-se os dias que têm resposta. É dedução, não leitura — e ela
 * carrega um erro conhecido: **não distingue "não perguntamos" de
 * "perguntamos e ele não respondeu"**, nem enxerga domingo e feriado.
 *
 * NO DIA EM QUE O REGISTRO POR CLIENTE EXISTIR, o corpo desta função vira
 * uma leitura daquele registro e o resto do app não sente. É por isso que
 * ela é uma função só, com este nome, e que ninguém mais no repositório
 * enumera dia: a troca tem que custar um arquivo.
 * ============================================================
 */

/**
 * A janela de memória: sete dias terminando em ONTEM.
 *
 * Sete porque o dono lembra "quantas vendas na quinta" com precisão
 * razoável dentro de uma semana; em quinze vira invenção — e o que a gente
 * pede é número aproximado, não contabilidade. Decisão do Victor,
 * 02/09/2026.
 */
export const DIAS_DE_MEMORIA = 7;

/** Um dia tem resposta do DONO — não da plataforma. */
function temRespostaDoDono(consolidado: ConsolidadoBase, dia: string): boolean {
  const linha = consolidado.dias.find((d) => d.dia === dia);
  if (!linha) return false;
  return linha.viraramVenda !== null || linha.voltouCentavos !== null;
}

/**
 * O piso: o dia mais antigo que o dono já respondeu.
 *
 * ============================================================
 * A PRIMEIRA RESPOSTA É A MATRÍCULA, e é o único piso que existe.
 *
 * Medido em 02/09: não há data de quando a campanha subiu — nem no
 * backend (os `resultados` da execução não têm passo de publicação) nem
 * aqui (`campaigns` tem zero linhas). O `criado_em` da execução é quando o
 * CADASTRO fechou, e usá-lo autorizaria perguntar sobre dias em que
 * anúncio nenhum rodou: a execução da V2G nasceu em 19/08 e seguia em
 * `aguardando_fotos` duas semanas depois.
 *
 * A primeira resposta é o único sinal de que havia algo sobre o que
 * responder — porque foi ele quem disse. E é a mesma marca que o contrato
 * do backend usa para a varredura ("já respondeu ao menos uma vez"), o que
 * evita duas definições de "está no loop".
 *
 * Quem nunca respondeu não tem atrasado: só a pergunta de ontem. Não é
 * lacuna a preencher — é que não há de onde tirar o piso sem chutar.
 * ============================================================
 */
function primeiraResposta(consolidado: ConsolidadoBase): string | null {
  const respondidos = consolidado.dias
    .filter((d) => d.viraramVenda !== null || d.voltouCentavos !== null)
    .map((d) => d.dia)
    .sort();
  return respondidos[0] ?? null;
}

/**
 * Os dias ATRASADOS — abertos, anteriores a ontem, do mais antigo para o
 * mais novo.
 *
 * `ontem` fica de fora de propósito: ele é a pergunta principal do card, e
 * quem cuida dele é o fluxo normal. Esta lista é só o convite opcional.
 *
 * Devolve vazio quando não dá para saber (sem consolidado) ou quando não
 * há piso. Vazio aqui quer dizer "não ofereça atrasado", nunca "está tudo
 * respondido" — a diferença importa para quem for mostrar contagem.
 */
export function diasAtrasados(args: {
  consolidado: ConsolidadoBase | null;
  /** o dia da pergunta principal, `YYYY-MM-DD` */
  ontem: string;
  teto?: number;
}): string[] {
  const { consolidado, ontem } = args;
  const teto = args.teto ?? DIAS_DE_MEMORIA;
  if (!consolidado) return [];

  const piso = primeiraResposta(consolidado);
  if (!piso) return [];

  const atrasados: string[] = [];
  // De `ontem - 1` para trás, até o teto. `i` começa em 1 porque ontem é a
  // pergunta principal, não um atrasado.
  for (let i = 1; i < teto; i++) {
    const dia = diasAntesDe(ontem, i);
    if (dia < piso) break; // antes da matrícula não se pergunta
    if (!temRespostaDoDono(consolidado, dia)) atrasados.push(dia);
  }
  return atrasados.reverse();
}

/**
 * Este dia pode receber resposta?
 *
 * ============================================================
 * O SERVIDOR NÃO ACREDITA NO DIA QUE A TELA MANDOU.
 *
 * Desde que a correção de dia antigo existe, o `dia` deixou de ser
 * calculado no servidor e passou a vir do cliente — e cliente manda o que
 * quiser. Sem esta checagem, um POST à mão gravaria resposta em qualquer
 * data, inclusive futura.
 *
 * A lista permitida sai das MESMAS funções que montam a tela, e não de uma
 * regra paralela: duas definições de "dia válido" divergiriam, e a que
 * divergisse seria a do servidor — a que ninguém olha.
 * ============================================================
 */
export function diaPodeSerRespondido(args: {
  dia: string;
  ontem: string;
  consolidado: ConsolidadoBase | null;
  teto?: number;
}): boolean {
  if (args.dia === args.ontem) return true;
  return diasAtrasados(args).includes(args.dia);
}
