import type { ConsolidadoBase } from "../dia-seguinte/tipos.ts";

/**
 * O resultado de campanha, como a tela precisa dele.
 *
 * ============================================================
 * OS CAMPOS CHEGARAM. Medido em 10/09/2026 contra produção:
 *
 *   GET /execucoes/{id}/consolidado
 *     moeda "BRL" · nivel "sem_alvo" · nivel_frase "Ainda não definimos…"
 *     cliques 64 · impressoes 1657 · pessoas_que_chegaram_medido null
 *
 *   GET /negocios/{id}/consolidado
 *     os mesmos, mais moedas[] e por_execucao[]
 *
 * Até essa medição este arquivo declarava `moeda`, `nivel` e `cliques`
 * como opcionais, com o comentário "AINDA NÃO VEM" em cada um. Era
 * verdade quando foi escrito e deixou de ser — e enquanto foi lido como
 * verdade, ninguém foi atrás de por que a tela não tinha símbolo de
 * moeda.
 *
 * **Agora eles são obrigatórios no tipo, e `null` é o valor de ausência.**
 * `campo?: T` e `campo: T | null` parecem a mesma coisa e não são: o
 * primeiro deixa quem monta o objeto esquecer o campo, o segundo obriga a
 * dizer que não sabe.
 * ============================================================
 *
 * A FORMA CRUA NÃO MORA MAIS AQUI. `ConsolidadoBase` de
 * `lib/dia-seguinte/tipos.ts` é a forma que a rota devolve, validada por
 * `lib/dia-seguinte/validar.ts`. Havia uma cópia paralela (`ConsolidadoCru`,
 * `LinhaCrua`) que ninguém alimentava com resposta de verdade — e foi
 * justamente ela que deixou passar "a moeda vem por dia", que a API nunca
 * fez.
 */
export type { ConsolidadoBase };

/** O código ISO da moeda, como o backend manda. `BRL`, `AUD`. */
export type Moeda = string;

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
 * Os números de UMA moeda só.
 *
 * ============================================================
 * UM BLOCO, UMA MOEDA, E NUNCA SE SOMA ENTRE ELES.
 *
 * A moeda vem do TOPO do consolidado, porque uma execução tem uma conta
 * de anúncio e uma conta tem uma moeda. Até 10/09/2026 esta camada
 * agrupava por `dia.moeda` — um campo que a API **nunca** preencheu — e o
 * resultado era um grupo só, com `moeda: null`, somando tudo. O
 * `moedasMisturadas` que devia acusar a mistura ficava `false` para
 * sempre, porque o mapa tinha uma chave só.
 *
 * Quem tem duas moedas é o NEGÓCIO, e o backend já resolve: o topo vem
 * com `investiuCentavos: null` e `moeda: null` de propósito, e cada
 * campanha vira uma ficha em `porExecucao`. **A tela vira duas fichas,
 * nunca uma soma.** Somar exigiria taxa de câmbio, e taxa de câmbio aqui
 * é inventar dado de mercado.
 * ============================================================
 */
export interface BlocoDeMoeda {
  /** `null` = a janela não tem uma moeda só. Escreve o número SEM símbolo. */
  moeda: Moeda | null;
  investido: ValorNaTela;
  cliques: ValorNaTela;
  impressoes: ValorNaTela;
  /** só aparece quando a plataforma PROVA que conta contato — ver `ler.ts`. */
  pessoas: ValorNaTela;
  vendas: ValorNaTela;
  voltou: ValorNaTela;
}

export interface ResultadoParaTela {
  /**
   * O slug cru, para quem quiser ramificar. **Não renderize.**
   * `null` quer dizer que o backend não mandou nível.
   */
  nivel: string | null;
  /**
   * A frase do backend, **como veio**.
   *
   * `null` = a tela não escreve NADA de nível. Não existe frase de
   * degradação escrita aqui: inventar uma seria a tradução local voltando
   * pela porta dos fundos.
   */
  nivelFrase: string | null;
  /**
   * O slug está no vocabulário de `nivel.ts`?
   *
   * É diagnóstico nosso — serve para o log dizer "chegou nível novo".
   * **Não decide o que a tela mostra**: nível desconhecido com frase
   * mostra a frase.
   */
  nivelConhecido: boolean;
  bloco: BlocoDeMoeda;
  /**
   * Quantas pessoas chegaram, como NÚMERO — e `null` quando não dá para
   * afirmar.
   *
   * Passa pela mesma trava do `bloco.pessoas`: só tem valor quando
   * `pessoas_que_chegaram_medido === true`. Existe porque contagem SOMA
   * entre campanhas (pessoa é pessoa em qualquer moeda) e quem soma
   * precisa de número, não de texto formatado. Dinheiro não tem um irmão
   * assim de propósito: somar dinheiro é o que não se pode fazer.
   */
  pessoasQueChegaram: number | null;
  /** o recorte PEDIDO — não o que decidiu o nível */
  periodo: { desde: string; ate: string };
  /**
   * Primeiro e último dia com gasto conhecido. `null` quando nenhum dia
   * tem. É isto que a tela mostra como "período da campanha": `desde`/`ate`
   * são a janela que a gente pediu, e dizer que a campanha rodou 30 dias
   * porque pedimos 30 dias seria afirmar coisa que ninguém mediu.
   */
  periodoComDado: { desde: string; ate: string } | null;
  /** quantos dias têm gasto conhecido */
  diasComGasto: number;
  /** houve alguma métrica da plataforma no período */
  temDadoDaPlataforma: boolean;
}
