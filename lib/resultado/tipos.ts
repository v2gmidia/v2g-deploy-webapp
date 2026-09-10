import type { Nivel } from "./nivel.ts";

/**
 * O resultado de campanha, como a tela precisa dele.
 *
 * ============================================================
 * TRÊS CAMPOS AINDA NÃO EXISTEM NA API. Medido em 10/09/2026:
 *
 *   GET /negocios/{id}/consolidado   dia: dia, investiu_centavos,
 *   GET /execucoes/{id}/consolidado       pessoas_que_chegaram,
 *                                         viraram_venda, voltou_centavos
 *
 * Nem `moeda`, nem `nivel`, nem `cliques`. O backend está acrescentando.
 *
 * Por isso os três são **opcionais no tipo** — e não é frouxidão: é o que
 * permite a camada existir hoje e não mudar quando eles chegarem. Um tipo
 * que os exigisse obrigaria a inventar valor, e inventar moeda é como se
 * mostra "R$ 113,45" para uma conta que cobra em dólar australiano.
 * ============================================================
 */

/** O código ISO da moeda, como o backend manda. `BRL`, `AUD`. */
export type Moeda = string;

/** Uma linha de dia, do jeito que a rota devolve. */
export interface LinhaCrua {
  dia: string;
  investiuCentavos: number | null;
  pessoasQueChegaram: string | null;
  viraramVenda: number | null;
  voltouCentavos: number | null;
  /** AINDA NÃO VEM. Por linha, porque uma execução tem uma moeda só. */
  moeda?: Moeda | null;
  /** AINDA NÃO VEM. */
  cliques?: number | null;
}

/** O corpo das duas rotas de consolidado, no que elas têm em comum. */
export interface ConsolidadoCru {
  desde: string;
  ate: string;
  dias: LinhaCrua[];
  investiuCentavos: number | null;
  voltouCentavos: number | null;
  pessoasQueChegaram: string | null;
  vendas: number | null;
  retornoPorReal: string | null;
  diasComOsDoisLados: number;
  temDadoDaPlataforma: boolean;
  /** AINDA NÃO VEM. Ver `lib/resultado/nivel.ts`. */
  nivel?: Nivel | null;
  /** AINDA NÃO VEM. */
  moeda?: Moeda | null;
  /** AINDA NÃO VEM. */
  cliques?: number | null;
}

/**
 * Um número do jeito que ele aparece na tela.
 *
 * ============================================================
 * `ausente` É CAMPO, E NÃO SE DEDUZ DO TEXTO.
 *
 * A tela precisa saber a diferença entre "não sabemos" e "é zero" para
 * escolher o TOM, não só o texto — ausência é cinza e discreta, zero é um
 * número como qualquer outro. Uma tela que comparasse `texto === "ainda
 * não sabemos"` para descobrir isso quebraria no dia em que a frase
 * mudasse.
 * ============================================================
 */
export interface ValorNaTela {
  texto: string;
  ausente: boolean;
}

/**
 * Um bloco de uma moeda só.
 *
 * ============================================================
 * UM BLOCO POR MOEDA, E NUNCA SE SOMA ENTRE ELES.
 *
 * Decisão do Victor, 10/09/2026: quando houver moedas diferentes, são
 * DUAS telas. O backend mediu que a rota do NEGÓCIO soma moedas — o que
 * transforma R$ 73,25 + A$ 113,45 em um número que não existe.
 *
 * Esta camada nunca soma. Ela agrupa, e quando sobra mais de um grupo,
 * `moedasMisturadas` fica `true` e quem monta a tela decide como separar.
 * ============================================================
 */
export interface BlocoDeMoeda {
  /** `null` quando o backend ainda não manda a moeda. */
  moeda: Moeda | null;
  investido: ValorNaTela;
  cliques: ValorNaTela;
  pessoas: ValorNaTela;
  vendas: ValorNaTela;
  voltou: ValorNaTela;
  /** Quantos dias deste bloco. */
  dias: number;
}

export interface ResultadoParaTela {
  /** A manchete e o corpo. Nunca uma nota, nunca um semáforo. */
  titulo: string;
  corpo: string;
  bola: "cliente" | "nossa" | "ninguem";
  /** O nível veio do backend, ou é a frase de degradação? */
  nivelVeio: boolean;
  blocos: BlocoDeMoeda[];
  /** Mais de uma moeda no mesmo recorte. Quem monta a tela SEPARA. */
  moedasMisturadas: boolean;
  /** O recorte pedido — não o que decidiu o nível. */
  periodo: { desde: string; ate: string };
}
