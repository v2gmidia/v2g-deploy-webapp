/**
 * O nível da escada — os sete estados, e a frase de cada um.
 *
 * ============================================================
 * O NÍVEL RESPONDE UMA PERGUNTA SÓ: "dá para dizer se está indo bem?"
 *
 * Ele não é nota, não é semáforo e não é avaliação da campanha. É o quanto
 * a gente CONSEGUE afirmar hoje — e os seis primeiros estados são todos
 * formas diferentes de "ainda não dá para afirmar".
 *
 * Por isso NENHUMA das sete frases pode soar como erro do cliente. Quem
 * abre a tela e lê "sem alvo" entende que fez algo errado; quem lê "a
 * gente ainda não sabe quanto vale uma venda para você" entende que falta
 * um passo, e que o passo é nosso.
 * ============================================================
 *
 * ============================================================
 * O NÍVEL É SEMPRE SOBRE 30 DIAS. Decisão do Victor, 10/09/2026.
 *
 * O backend mediu que o nível depende da JANELA. Com um seletor de
 * período, o dono conseguiria fazer a tela dizer "pausamos sua campanha"
 * só mexendo no recorte — e uma tela que muda de diagnóstico conforme o
 * zoom não é diagnóstico, é acaso.
 *
 * Então: **o nível vem sempre da janela canônica de 30 dias; o recorte que
 * o usuário escolher muda só os NÚMEROS.** Ver `resultadoParaTela()`, que
 * recebe os dois separados de propósito.
 * ============================================================
 *
 * ============================================================
 * `sem_medicao` É INALCANÇÁVEL HOJE, e nada pode depender dele.
 *
 * O backend mediu: quando a conta não tem nada contando conversão, o que
 * sai é `alerta_urgente`, não `sem_medicao`. A tela diria "sua campanha
 * está cara" quando a verdade é "ninguém está medindo venda aqui".
 *
 * Ele fica declarado porque o contrato o declara, e porque no dia em que
 * o backend consertar isso a frase já existe. Mas **nenhuma tela deve ter
 * um caminho que só funcione se `sem_medicao` chegar** — hoje ele não
 * chega.
 * ============================================================
 */

/** Os sete, na ordem da escada. */
export const NIVEIS = [
  "sem_alvo",
  "sem_dado",
  "sem_gasto",
  "sem_medicao",
  "sem_comparacao",
  "em_aprendizado",
  "ok",
] as const;

export type Nivel = (typeof NIVEIS)[number];

export function ehNivel(v: unknown): v is Nivel {
  return typeof v === "string" && (NIVEIS as readonly string[]).includes(v);
}

export interface FraseDoNivel {
  /** A manchete. Curta, e nunca uma acusação. */
  titulo: string;
  /** O que está acontecendo, em uma frase. */
  corpo: string;
  /**
   * A bola está com quem?
   *
   * Mesma distinção do `lib/estado/frases.ts`: quando é do cliente, a tela
   * pode pedir ação; quando é nossa, pedir ação seria inventar trabalho
   * para ele.
   */
  bola: "cliente" | "nossa" | "ninguem";
}

/**
 * ============================================================
 * AS SETE FRASES. Escritas para o dono do negócio, não para o gestor.
 *
 * Três regras que valem para todas, e que vieram do `CLAUDE.md`:
 *
 *   zero jargão      nada de CPA, CPC, ROAS, conversão, otimização
 *   sem diminutivo   caloroso não é infantil
 *   sem culpa        a ausência de dado é nossa, não dele
 *
 * E uma quarta, desta tela: **nenhuma frase pode virar nota.** "Está indo
 * bem" e "está indo mal" não aparecem em lugar nenhum — o que aparece é o
 * número e o que dá para dizer sobre ele.
 * ============================================================
 */
const FRASES: Record<Nivel, FraseDoNivel> = {
  /**
   * Não existe alvo para comparar. É o estado das três campanhas reais
   * hoje, medido em 10/09 — as três em `sem_alvo`.
   */
  sem_alvo: {
    titulo: "Sua campanha está no ar",
    corpo:
      "Ainda não dá para dizer se o preço está bom, porque a gente ainda não sabe " +
      "quanto vale uma venda para você. É a primeira coisa que a gente vai acertar.",
    bola: "nossa",
  },

  /** Nada chegou ainda. Diferente de "chegou zero". */
  sem_dado: {
    titulo: "Ainda não chegaram números",
    corpo:
      "O Facebook leva um tempo para começar a contar. Assim que chegar, os números " +
      "aparecem aqui sem você precisar fazer nada.",
    bola: "nossa",
  },

  /**
   * No ar e sem gastar. É comum nos primeiros dias e assusta quem não
   * sabe — por isso a frase diz que é normal ANTES de dizer o que é.
   */
  sem_gasto: {
    titulo: "Sua campanha ainda não gastou",
    corpo:
      "Isso é normal no começo: o Facebook procura as pessoas certas antes de começar " +
      "a investir. Se passar de alguns dias, a gente mexe.",
    bola: "nossa",
  },

  /**
   * Gastando e ninguém conta venda. **Inalcançável hoje** — ver o bloco no
   * topo. A frase existe para o dia em que ele chegar.
   */
  sem_medicao: {
    titulo: "Estamos investindo, mas ainda não conseguimos contar as vendas",
    corpo:
      "O anúncio está rodando. O que falta é o Facebook conseguir enxergar quando alguém " +
      "compra — sem isso, a gente não consegue dizer se valeu a pena. Já estamos cuidando.",
    bola: "nossa",
  },

  /** Tem número, não tem com o que comparar. */
  sem_comparacao: {
    titulo: "Os primeiros números chegaram",
    corpo:
      "Ainda é cedo para comparar com alguma coisa — em poucos dias a gente vai poder " +
      "dizer se está melhorando ou piorando.",
    bola: "ninguem",
  },

  /**
   * O aprendizado. É o estado em que o cliente ansioso PAUSA a campanha, e
   * pausar no dia 3 é o comportamento mais destrutivo que existe — por
   * isso a frase pede explicitamente para não mexer.
   */
  em_aprendizado: {
    titulo: "O Facebook ainda está aprendendo",
    corpo:
      "Nos primeiros dias os números balançam muito, e isso não quer dizer nada ainda. " +
      "Não mexa na campanha agora — mexer reinicia o aprendizado e atrasa o resultado.",
    bola: "ninguem",
  },

  /** Dá para comparar. É o único estado que não é uma forma de "ainda não". */
  ok: {
    titulo: "Dá para acompanhar",
    corpo:
      "Os números já dizem alguma coisa. Abaixo está quanto entrou, quanto saiu, e o que " +
      "você me contou sobre as vendas.",
    bola: "ninguem",
  },
};

export function fraseDoNivel(nivel: Nivel): FraseDoNivel {
  return FRASES[nivel];
}

/**
 * O que a tela diz quando o nível NÃO VEIO.
 *
 * ============================================================
 * E ELE NÃO VEM HOJE. Medido em 10/09/2026 contra produção:
 *
 *   GET /negocios/{id}/consolidado  → sem `nivel`
 *   GET /execucoes/{id}/consolidado → sem `nivel`
 *
 * O contrato do dashboard descreve o campo; a API publicada ainda não o
 * tem. Enquanto for assim, esta é a frase — e ela é honesta em vez de
 * inventar um nível por conta própria.
 *
 * Deduzir o nível aqui seria o pior caminho: duas definições de "como
 * está indo", e a que divergisse seria a nossa, que ninguém audita.
 * ============================================================
 */
export const SEM_NIVEL: FraseDoNivel = {
  // ============================================================
  // O TÍTULO NÃO PODE SER IGUAL AO DE NENHUM DOS SETE, e a primeira
  // versão desta constante era palavra por palavra igual ao `sem_alvo`.
  //
  // O conferidor pegou. E não era detalhe: com títulos iguais, "o backend
  // não mandou o nível" e "o nível é sem_alvo" viravam a mesma tela — que
  // é exatamente a família de defeito que este repositório já pagou duas
  // vezes (o card que sumia sem rastro, a /inicio degradando calada).
  // ============================================================
  titulo: "Os números que a gente tem hoje",
  corpo:
    "Os números abaixo são os que a gente tem hoje. Em breve esta tela também vai " +
    "dizer o que eles significam.",
  bola: "nossa",
};
