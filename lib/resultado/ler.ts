import { ehNivel } from "./nivel.ts";
import type {
  BlocoDeMoeda,
  ConsolidadoBase,
  Moeda,
  ResultadoParaTela,
  ValorNaTela,
} from "./tipos.ts";

/**
 * A camada de leitura: do payload para o que a tela mostra.
 *
 * ============================================================
 * ELA EXISTE PARA A TELA NÃO DECIDIR NADA.
 *
 * Quem decide o que "não sabemos" quer dizer, o que se soma e o que não
 * se soma — é aqui. A tela recebe texto pronto e uma marca de ausência, e
 * a única escolha que sobra para ela é visual.
 *
 * O que ela NÃO decide mais: o que o nível significa. Isso é do backend, e
 * chega pronto em `nivelFrase`.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTA CAMADA SE RECUSA A FAZER, e o contrato foi explícito:
 *
 *   nota ou semáforo     opinião fingindo ser medida. Não existe função
 *                        aqui que devolva "bom" ou "ruim"
 *   custo por clique     é derivável, e é a porta para o dono comparar
 *                        com um número que ouviu de alguém. Não se calcula
 *   custo por conversa   idem, e o produto compara com o CPL-alvo dele,
 *                        que ainda não existe
 *   "0 pessoas chegaram" enquanto o medido não for `true`. Ausência não
 *                        vira zero em lugar nenhum
 *   somar moedas         sem taxa de câmbio não dá, e taxa de câmbio aqui
 *                        seria inventar dado de mercado
 *
 * Todas estão conferidas em `pnpm conferir:resultado`.
 * ============================================================
 */

/** O que se escreve no lugar do número que não existe. */
export const AINDA_NAO_SABEMOS = "ainda não sabemos";

/** Ausência: cinza, discreta, e nunca um número. */
const ausente = (): ValorNaTela => ({ texto: AINDA_NAO_SABEMOS, ausente: true });

const presente = (texto: string): ValorNaTela => ({ texto, ausente: false });

/**
 * Dinheiro em centavos, na moeda que o backend disse.
 *
 * ============================================================
 * SEM MOEDA, NÃO SE ESCREVE SÍMBOLO. NENHUM.
 *
 * "A$ 113,45" e "R$ 113,45" são o mesmo pixel, e a diferença entre os
 * dois é de mais de três para um. A Byond cobra em dólar australiano.
 *
 * Com `moeda: null` o valor sai **sem símbolo**, e quem monta a tela sabe,
 * pelo `moeda` do bloco, que a moeda não é conhecida. Chutar `R$` seria
 * escrever um número errado com aparência de certo — que é pior que não
 * escrever.
 * ============================================================
 */
export function dinheiroDaMoeda(centavos: number, moeda: Moeda | null): string {
  const valor = centavos / 100;
  if (!moeda) {
    // Sem símbolo, e com as casas decimais que dinheiro tem. O leitor vê
    // que é dinheiro pela posição na tela, não por um símbolo inventado.
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: moeda,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * O `Decimal` que a Meta manda como string.
 *
 * Continua string até aqui — converter antes jogaria fora a precisão que a
 * atribuição por modelo da Meta usa. Aqui é a hora de exibir, então é a
 * hora de converter.
 */
function pessoasComoTexto(bruto: string | null): ValorNaTela {
  if (bruto === null) return ausente();
  const n = Number(bruto);
  if (!Number.isFinite(n)) return ausente();
  const arredondado = Math.round(n * 100) / 100;
  return presente(arredondado.toLocaleString("pt-BR"));
}

function contagem(valor: number | null): ValorNaTela {
  return valor === null ? ausente() : presente(valor.toLocaleString("pt-BR"));
}

function dinheiroOuAusente(centavos: number | null, moeda: Moeda | null): ValorNaTela {
  return centavos === null ? ausente() : presente(dinheiroDaMoeda(centavos, moeda));
}

/**
 * Quantas pessoas chegaram — **ou o silêncio, que é o padrão de hoje**.
 *
 * ============================================================
 * O ZERO QUE MENTE, E QUEM O SEPARA DO ZERO QUE INFORMA.
 *
 * `pessoas_que_chegaram: 0` responde a duas perguntas opostas:
 *
 *   "medimos, e ninguém chegou"        → 0, e é um resultado RUIM
 *   "não há o que conte contato aqui"  → 0, e não é resultado nenhum
 *
 * Quem separa é `pessoas_que_chegaram_medido`, e ele só vira `true` quando
 * houve conversão registrada — conversão registrada **prova** que a
 * medição funciona. Medido em 10/09/2026: vem `null` nas três campanhas
 * com dinheiro real, e vai continuar vindo até alguém converter.
 *
 * Então a regra é `=== true`, e não `!== false`: enquanto não houver
 * prova, a tela mostra a `nivelFrase` no lugar do número.
 * ============================================================
 */
function pessoasSeForMedido(
  bruto: string | null,
  medido: boolean | null | undefined,
): ValorNaTela {
  return medido === true ? pessoasComoTexto(bruto) : ausente();
}

/** O mesmo, como número. Mesma trava — ver `pessoasSeForMedido`. */
function pessoasComoNumero(
  bruto: string | null,
  medido: boolean | null | undefined,
): number | null {
  if (medido !== true || bruto === null) return null;
  const n = Number(bruto);
  return Number.isFinite(n) ? n : null;
}

/**
 * O bloco da moeda do consolidado.
 *
 * ============================================================
 * OS TOTAIS SÃO OS DO TOPO, E NÃO A SOMA DOS DIAS.
 *
 * O backend já soma, e a tela tem que bater com ele: o critério de aceite
 * deste lote é a função devolver os MESMOS números que o `curl` devolve.
 * Ressomar os dias aqui criaria uma segunda definição de "quanto
 * investiu" — e a divergência só apareceria quando alguém comparasse a
 * tela com o log, que é o defeito mais caro de achar que existe.
 * ============================================================
 */
function blocoDe(c: ConsolidadoBase, medido: boolean | null | undefined): BlocoDeMoeda {
  const moeda = c.moeda;
  return {
    moeda,
    investido: dinheiroOuAusente(c.investiuCentavos, moeda),
    // `cliques` e `impressoes` somam sempre, inclusive entre moedas:
    // clique é clique em qualquer moeda. É o dinheiro que não soma.
    cliques: contagem(c.cliques),
    impressoes: contagem(c.impressoes),
    pessoas: pessoasSeForMedido(c.pessoasQueChegaram, medido),
    vendas: contagem(c.vendas),
    voltou: dinheiroOuAusente(c.voltouCentavos, moeda),
  };
}

/** Os dias com gasto conhecido, em ordem. `dias[]` já vem ordenado. */
function diasComGasto(c: ConsolidadoBase): string[] {
  return c.dias.filter((d) => d.investiuCentavos !== null).map((d) => d.dia);
}

/**
 * O resultado, pronto para a tela.
 *
 * ============================================================
 * O NÍVEL É SEMPRE SOBRE 30 DIAS CANÔNICOS — e quem garante é o BACKEND.
 *
 * Decisão do Gabriel, 10/09/2026, registrada no contrato: o recorte que a
 * tela pede (`desde`/`ate`) muda os NÚMEROS — `investiu`, `cliques`,
 * `impressoes`, `dias[]` — e **não muda o `nivel` nem a `nivel_frase`**,
 * que respondem sempre sobre a mesma janela do coletor.
 *
 * O motivo, medido pelo backend: com 90 dias de dado, o recorte de 06 a 10
 * saía `pausa_automatica` e o recorte padrão saía `sem_base`. E a frase de
 * `pausa_automatica` afirma "Pausamos a campanha" — com um seletor de
 * período, o dono conseguiria fazer o painel afirmar que pausamos a
 * campanha dele mexendo num filtro.
 *
 * `canonico` continua na assinatura como cinto e suspensório: se um dia a
 * garantia do backend cair, quem tiver a janela canônica na mão passa ela
 * aqui e o nível sai de lá. Quem não passa recebe o nível do recorte, que
 * hoje é a mesma coisa.
 * ============================================================
 */
export function resultadoParaTela(args: {
  /** o que o usuário pediu ver */
  recorte: ConsolidadoBase;
  /**
   * `pessoas_que_chegaram_medido`. **Só a rota da EXECUÇÃO manda.** Quem lê
   * o consolidado do NEGÓCIO não tem esse campo e deve omitir — e a omissão
   * esconde o número, que é o lado seguro de errar.
   */
  medido?: boolean | null;
  /** a janela canônica de 30 dias, se quem chama a tiver */
  canonico?: ConsolidadoBase | null;
}): ResultadoParaTela {
  const { recorte } = args;
  const fonteDoNivel = args.canonico ?? recorte;

  const comGasto = diasComGasto(recorte);

  return {
    nivel: fonteDoNivel.nivel,
    nivelFrase: fonteDoNivel.nivelFrase,
    nivelConhecido: ehNivel(fonteDoNivel.nivel),
    bloco: blocoDe(recorte, args.medido),
    pessoasQueChegaram: pessoasComoNumero(recorte.pessoasQueChegaram, args.medido),
    periodo: { desde: recorte.desde, ate: recorte.ate },
    periodoComDado:
      comGasto.length === 0
        ? null
        : { desde: comGasto[0]!, ate: comGasto[comGasto.length - 1]! },
    diasComGasto: comGasto.length,
    temDadoDaPlataforma: recorte.temDadoDaPlataforma,
  };
}
