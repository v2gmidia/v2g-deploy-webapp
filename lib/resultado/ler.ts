import { fraseDoNivel, SEM_NIVEL, type Nivel } from "./nivel.ts";
import type {
  BlocoDeMoeda,
  ConsolidadoCru,
  LinhaCrua,
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
 * se soma, e qual frase o nível vira — é aqui. A tela recebe texto pronto
 * e uma marca de ausência, e a única escolha que sobra para ela é visual.
 *
 * O motivo é o mesmo do `lib/estado/frases.ts`: quando cinco telas leem a
 * mesma resposta e cada uma decide sozinha o que aquilo significa, elas
 * divergem — e já divergiram neste repositório.
 * ============================================================
 *
 * ============================================================
 * O QUE ESTA CAMADA SE RECUSA A FAZER, e o backend foi explícito:
 *
 *   nota ou semáforo     opinião fingindo ser medida. Não existe função
 *                        aqui que devolva "bom" ou "ruim"
 *   custo por clique     é derivável, e é a porta para o dono comparar
 *                        com um número que ouviu de alguém. Não se calcula
 *   "0 pessoas chegaram" enquanto o medido for `null`. Ausência não vira
 *                        zero em lugar nenhum
 *
 * As três estão conferidas em `pnpm conferir:resultado`. Se alguém
 * acrescentar qualquer uma, o conferidor fica vermelho.
 * ============================================================
 */

/** O que se escreve no lugar do número que não existe. Mesma palavra do `lib/dia-seguinte/exibir.ts`. */
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
 * "A$ 113,45" e "R$ 113,45" são o mesmo número numa tela sem moeda, e a
 * diferença entre os dois é de mais de três para um. A Byond cobra em
 * dólar australiano.
 *
 * Enquanto o backend não manda `moeda`, o valor sai **sem símbolo** e
 * quem monta a tela sabe, pelo `moeda: null` do bloco, que precisa dizer
 * que a moeda ainda não é conhecida. Chutar `R$` seria escrever um número
 * errado com aparência de certo — que é pior que não escrever.
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
 * Continua string até aqui — converter antes jogaria fora precisão que a
 * atribuição por modelo da Meta usa. Aqui é a hora de exibir, então é a
 * hora de converter.
 */
function pessoasComoTexto(bruto: string | null): ValorNaTela {
  if (bruto === null) return ausente();
  const n = Number(bruto);
  if (!Number.isFinite(n)) return ausente();
  // `0` É CONTAGEM e aparece — mas só quando o backend disse zero. A
  // regra "nunca 0 pessoas enquanto for null" está no `=== null` acima.
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
 * Soma que preserva a ausência.
 *
 * ============================================================
 * `null + 5` NÃO É `5`. Se um dia não sabemos, o total não sabe.
 *
 * A tentação é `(a ?? 0) + (b ?? 0)`, e ela transforma sete dias sem dado
 * e um dia com R$ 10 em "você investiu R$ 10 no mês" — uma afirmação
 * sobre o dinheiro do cliente, e falsa.
 *
 * Aqui: se TODOS os dias são `null`, o total é `null`. Se pelo menos um
 * tem número, o total é a soma dos que têm — e quem monta a tela sabe,
 * pelo `diasComDado`, que o total é parcial.
 * ============================================================
 */
function somaPreservandoAusencia(valores: (number | null)[]): number | null {
  const comDado = valores.filter((v): v is number => v !== null);
  return comDado.length === 0 ? null : comDado.reduce((a, b) => a + b, 0);
}

/**
 * Agrupa as linhas por moeda.
 *
 * Linha sem moeda cai num grupo `null` — que é onde TODAS caem hoje,
 * porque o campo ainda não vem.
 */
function porMoeda(dias: LinhaCrua[]): Map<Moeda | null, LinhaCrua[]> {
  const grupos = new Map<Moeda | null, LinhaCrua[]>();
  for (const d of dias) {
    const chave = d.moeda ?? null;
    grupos.set(chave, [...(grupos.get(chave) ?? []), d]);
  }
  return grupos;
}

function blocoDe(moeda: Moeda | null, dias: LinhaCrua[]): BlocoDeMoeda {
  return {
    moeda,
    investido: dinheiroOuAusente(
      somaPreservandoAusencia(dias.map((d) => d.investiuCentavos)),
      moeda,
    ),
    cliques: contagem(somaPreservandoAusencia(dias.map((d) => d.cliques ?? null))),
    pessoas: pessoasComoTexto(
      dias.some((d) => d.pessoasQueChegaram !== null)
        ? String(
            dias.reduce((soma, d) => soma + (d.pessoasQueChegaram ? Number(d.pessoasQueChegaram) : 0), 0),
          )
        : null,
    ),
    vendas: contagem(somaPreservandoAusencia(dias.map((d) => d.viraramVenda))),
    voltou: dinheiroOuAusente(somaPreservandoAusencia(dias.map((d) => d.voltouCentavos)), moeda),
    dias: dias.length,
  };
}

/**
 * O resultado, pronto para a tela.
 *
 * ============================================================
 * DOIS ARGUMENTOS SEPARADOS, E É O QUE IMPEDE O BURACO DA JANELA.
 *
 * `recorte` é o que o usuário pediu ver. `canonico` é a janela fixa de 30
 * dias, e é DELE que o nível sai.
 *
 * O backend mediu que o nível depende da janela: com um seletor de
 * período, o dono conseguiria fazer a tela dizer "pausamos sua campanha"
 * só mexendo no zoom. Separar os dois na assinatura é o que torna esse
 * erro impossível de cometer sem perceber — quem quiser o nível do
 * recorte tem que passar o recorte duas vezes, de propósito.
 *
 * Quando `canonico` não vem, o nível é o do recorte E a tela avisa que
 * ainda não sabe interpretar — nunca o contrário.
 * ============================================================
 */
export function resultadoParaTela(args: {
  /** o que o usuário pediu ver */
  recorte: ConsolidadoCru;
  /** a janela canônica de 30 dias, de onde o nível sai */
  canonico?: ConsolidadoCru | null;
}): ResultadoParaTela {
  const { recorte } = args;
  const nivelBruto: Nivel | null | undefined = (args.canonico ?? recorte).nivel;

  const frase = nivelBruto ? fraseDoNivel(nivelBruto) : SEM_NIVEL;

  const grupos = porMoeda(recorte.dias);
  const blocos = [...grupos.entries()]
    .map(([moeda, dias]) => blocoDe(moeda, dias))
    // Ordem estável: a moeda conhecida antes da desconhecida, e depois
    // alfabética. Sem isto a tela trocaria de ordem entre carregamentos.
    .sort((a, b) => (a.moeda ?? "zzz").localeCompare(b.moeda ?? "zzz"));

  return {
    titulo: frase.titulo,
    corpo: frase.corpo,
    bola: frase.bola,
    nivelVeio: Boolean(nivelBruto),
    blocos: blocos.length > 0 ? blocos : [blocoDe(recorte.moeda ?? null, [])],
    moedasMisturadas: grupos.size > 1,
    periodo: { desde: recorte.desde, ate: recorte.ate },
  };
}
