import { diasAntesDe } from "./dia.ts";
import type { ConsolidadoBase } from "./tipos";

/**
 * Quais dias o dono ainda não respondeu — por SUBTRAÇÃO DE CALENDÁRIO.
 *
 * ============================================================
 * "EM ABERTO" É DEDUÇÃO, NÃO LEITURA. E vai continuar sendo.
 *
 * Enumera-se o calendário e subtraem-se os dias que têm resposta. Sobra o
 * que ninguém respondeu.
 *
 * A dedução carrega dois erros conhecidos: sozinha ela **não distingue
 * "não perguntamos" de "perguntamos e ele não respondeu"** — o primeiro é
 * resolvido por `perguntas_apresentadas`, ver o bloco seguinte —, e não
 * enxerga domingo nem feriado, o que segue aceito na v1.
 * ============================================================
 *
 * ============================================================
 * NÃO EXISTE SUBSTITUTO. A SUBTRAÇÃO DE CALENDÁRIO É DEFINITIVA — POR
 * ENQUANTO. Correção do Victor, 03/09/2026, contra o que este bloco dizia
 * antes.
 *
 * Chegou `perguntas_apresentadas`, chave `(id_execucao, dia, canal)`. A
 * versão anterior deste comentário prometia que o corpo daqui viraria um
 * `left join` e pararia de enumerar calendário. **Está errado, e é um erro
 * que valia caro:** a tabela registra APRESENTAÇÃO, não envio. Não existe
 * envio — a pergunta aparece quando o dono ABRE o app.
 *
 * Ou seja: dia em que ele não abriu não gera linha nenhuma. Um `left join`
 * enxergaria só os dias em que ele esteve aqui e não respondeu, e perderia
 * exatamente o caso que motivou esta função — o dono que sumiu três dias.
 *
 * O QUE A TABELA ENTREGA É A DISTINÇÃO, NÃO A SUBSTITUIÇÃO:
 *
 *   linha + sem resposta   apresentamos e ele não respondeu
 *   nenhuma das duas       ele não abriu; não apresentamos
 *
 * **Os dois continuam "em aberto" para o convite** — quem não viu a
 * pergunta e quem viu e não respondeu recebem a mesma oferta. Isso muda o
 * dashboard (dá para separar desinteresse de ausência), e não muda uma
 * linha do cálculo abaixo.
 *
 * Se um dia existir envio de verdade (push, WhatsApp), a conversa volta a
 * ser outra. Enquanto o único canal for `tela`, o calendário é a única
 * fonte que enxerga o dia em que ninguém esteve.
 * ============================================================
 *
 * ============================================================
 * POR QUE `async` E `idExecucao` FICAM MESMO ASSIM.
 *
 * A decisão de assinatura foi tomada em 03/09 esperando uma troca de
 * corpo que não vai acontecer. Ela continua certa — pelo motivo contrário
 * ao que a motivou: não é que um dia vão precisar ser assim, é que
 * **sempre vão precisar**. A leitura de `perguntas_apresentadas` que vai
 * classificar cada dia em aberto é uma chamada de rede endereçada por
 * `(id_execucao, dia)`, e ela entra aqui dentro — junto do calendário, não
 * no lugar dele.
 *
 * Ver os dois blocos marcados PARA A TROCA nos argumentos.
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
 *
 * CONFIRMADO pelo Victor em 03/09/2026, com o argumento fechado:
 * perguntar sobre dia que não existiu é pior que não perguntar.
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
 *
 * ============================================================
 * PARA A TROCA — POR QUE ELA É `async` SEM PRECISAR SER.
 *
 * O corpo de hoje é síncrono e puro: daria para devolver `string[]` direto.
 * Ela devolve `Promise` porque a classificação que vem a seguir é uma
 * LEITURA — `perguntas_apresentadas` mora do outro lado da rede, e função
 * que consulta o backend não pode ser síncrona.
 *
 * Se ela nascesse síncrona, o dia de acrescentar essa leitura mudaria o
 * tipo de retorno das duas funções daqui, dos dois chamadores e das
 * asserções do conferidor, tudo no mesmo commit em que a lógica muda — que
 * é justamente quando não se quer barulho em volta. O `await` de hoje não
 * custa nada: os dois chamadores já são assíncronos.
 * ============================================================
 */
export async function diasAtrasados(args: {
  /**
   * ============================================================
   * PARA A TROCA — ESTE CAMPO NÃO É LIDO HOJE. NÃO O APAGUE.
   *
   * `perguntas_apresentadas` tem chave `(id_execucao, dia, canal)`: sem o
   * id não há como endereçar a tabela que vai CLASSIFICAR cada dia desta
   * lista (apresentado e não respondido × nem apresentado). Ele entra
   * agora porque **os dois chamadores já têm o id na mão** na linha
   * anterior à chamada — `page.tsx` por `estado.diaSeguinte.execucao`,
   * `actions.ts` por `execucaoDoNegocio()` — e passá-lo hoje custa uma
   * palavra, enquanto acrescentá-lo depois custa mexer em todo mundo.
   *
   * E há uma segunda razão, menos óbvia: o `consolidado` que chega aqui é
   * o acumulado do NEGÓCIO, que atravessa execuções, enquanto a chave da
   * tabela é por EXECUÇÃO. Com duas rodadas os dois recortes deixam de
   * coincidir. Não morde hoje — só existe uma execução por negócio —, mas
   * é o id no argumento que vai permitir estreitar sem trocar assinatura.
   * ============================================================
   */
  idExecucao: string;
  consolidado: ConsolidadoBase | null;
  /** o dia da pergunta principal, `YYYY-MM-DD` */
  ontem: string;
  teto?: number;
}): Promise<string[]> {
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
export async function diaPodeSerRespondido(args: {
  dia: string;
  ontem: string;
  /** ver o bloco PARA A TROCA em `diasAtrasados` */
  idExecucao: string;
  consolidado: ConsolidadoBase | null;
  teto?: number;
}): Promise<boolean> {
  if (args.dia === args.ontem) return true;
  return (await diasAtrasados(args)).includes(args.dia);
}

/**
 * O dia cabe na janela de memória? Sete dias terminando em ontem.
 *
 * ============================================================
 * ESTA É A CHECAGEM QUE NÃO CUSTA REDE, e é de propósito que ela seja
 * mais fraca que `diaPodeSerRespondido`.
 *
 * Quem grava DINHEIRO usa a outra: ela lê o consolidado e sabe quais dias
 * estão de fato em aberto. Quem grava TELEMETRIA usa esta — o registro de
 * "a pergunta foi apresentada" acontece a cada card renderizado, e uma
 * leitura de consolidado por render, para proteger uma linha de
 * estatística, é caro pelo que entrega.
 *
 * O que ela barra é o que importa barrar: dia futuro e data inventada. O
 * que escapa é, no pior caso, uma linha a mais numa tabela de contagem.
 *
 * SÍNCRONA, E CONTINUA SÍNCRONA. Diferente das duas de cima, ela não é
 * um fato sobre o cliente — é aritmética de calendário, e nunca vai
 * precisar perguntar nada a ninguém.
 * ============================================================
 */
export function diaCabeNaMemoria(args: {
  dia: string;
  ontem: string;
  teto?: number;
}): boolean {
  const teto = args.teto ?? DIAS_DE_MEMORIA;
  return args.dia <= args.ontem && args.dia >= diasAntesDe(args.ontem, teto - 1);
}
