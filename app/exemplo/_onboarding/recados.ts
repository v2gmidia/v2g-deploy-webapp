/**
 * OS RECADOS DE QUANDO A TRANSCRIÇÃO NÃO VEM — um lugar só.
 *
 * ============================================================
 * POR QUE NÃO MORAM DENTRO DA ROTA. Eles são lidos por dois lados: a rota
 * `/exemplo/api-transcrever`, que os devolve, e a bancada, que os mostra
 * em `?falha=` para a tela de cada caso poder ser OLHADA sem ninguém
 * derrubar a OpenAI de propósito.
 *
 * Com a frase escrita nos dois lugares, um dia um deles muda e o outro
 * não — e a tela que a gente capturou deixa de ser a tela que o cliente vê.
 * ============================================================
 *
 * ============================================================
 * A REGRA DE TODOS ELES, e ela é do produto:
 *
 *   1. nenhum usa a palavra proibida;
 *   2. nenhum começa pelo que o cliente deixou de fazer;
 *   3. todos dizem O QUE FAZER, e o teclado está em todos;
 *   4. nenhum vaza nome de campo da OpenAI, nem o nome dela.
 *
 * E a diferença entre eles é o que fazer, nunca o tom: em 429, tentar de
 * novo na hora é justamente o que piora, então esse é o único que manda
 * esperar.
 * ============================================================
 */

export type CasoDeFalha =
  /** a `OPENAI_API_KEY` não existe neste ambiente */
  | "sem_chave"
  /** limite de uso do outro lado */
  | "limite"
  /** 5xx, ou chave recusada: está fora do ar para nós */
  | "fora_do_ar"
  /** a rede caiu no meio da chamada */
  | "rede"
  /** o pedido foi recusado por algum motivo que não dá para explicar ao dono */
  | "recusado"
  /** não chegou áudio nenhum */
  | "sem_audio"
  /** áudio acima do teto */
  | "longo"
  /** veio áudio, não veio fala */
  | "mudo"
  /** o navegador não deu o microfone */
  | "sem_permissao"
  /** o teto de tempo da gravação parou sozinho */
  | "teto_de_tempo";

export const RECADOS: Record<CasoDeFalha, string> = {
  sem_chave: "A transcrição por áudio ainda não está ligada aqui. Pode escrever pelo teclado.",
  limite:
    "Muita gente falando ao mesmo tempo agora. Espera um minuto e tenta de novo, ou escreve pelo teclado — seu áudio continua aqui.",
  fora_do_ar:
    "A transcrição está com problema do lado de lá. Pode escrever pelo teclado, ou tentar de novo daqui a pouco.",
  rede: "Não consegui falar com a transcrição agora. Pode escrever pelo teclado.",
  recusado: "Não consegui entender esse áudio agora. Pode escrever pelo teclado.",
  sem_audio: "Não chegou áudio nenhum. Tenta gravar de novo, ou escreve pelo teclado.",
  longo: "Esse áudio ficou longo demais. Grava um trecho menor, ou escreve pelo teclado.",
  mudo: "O áudio veio sem fala. Tenta de novo, ou escreve pelo teclado.",
  sem_permissao:
    "Não consegui abrir seu microfone — o navegador pode não ter dado permissão. Pode escrever pelo teclado, funciona igual.",
  teto_de_tempo:
    "Parei em 2 minutos, que é o máximo de uma vez. O que você falou até aqui está indo — dá para gravar de novo ou completar pelo teclado.",
};

/**
 * Em quais casos o cliente JÁ TINHA GRAVADO alguma coisa.
 *
 * Nesses, o áudio fica na tela com tocador: a falha custa a transcrição,
 * não o que a pessoa falou. Nos outros não há áudio para mostrar.
 */
export const TEM_AUDIO_GUARDADO: Record<CasoDeFalha, boolean> = {
  sem_chave: false,
  limite: true,
  fora_do_ar: true,
  rede: true,
  recusado: true,
  sem_audio: false,
  longo: true,
  mudo: true,
  sem_permissao: false,
  teto_de_tempo: true,
};

/** O status HTTP que a rota devolve em cada caso que passa por ela. */
export const STATUS_DA_ROTA: Partial<Record<CasoDeFalha, number>> = {
  sem_chave: 501,
  limite: 429,
  fora_do_ar: 503,
  rede: 503,
  recusado: 502,
  sem_audio: 400,
  longo: 413,
  mudo: 422,
};
