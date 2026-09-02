/**
 * A pergunta diária — o texto exato, num lugar só.
 *
 * ============================================================
 * O CONTRATO EXIGE `pergunta` NO CORPO, E É TEXTO, NÃO CÓDIGO.
 *
 * "Uma resposta só é interpretável junto da pergunta que a produziu:
 * 'quantas viraram venda?' e 'quantas pessoas te chamaram?' dão números
 * diferentes."
 *
 * Por isso o texto mora aqui e não no JSX: a tela renderiza ESTA
 * constante e a Server Action grava ESTA constante. Se a copy virasse
 * string no componente e outra string na ação, o dia em que alguém
 * melhorasse a frase da tela deixaria o banco registrando a pergunta
 * velha — e ninguém veria, porque as duas continuariam plausíveis.
 * ============================================================
 *
 * SEM `server-only`: o card é componente de cliente e a ação é de
 * servidor. As duas leem daqui.
 */

/**
 * A pergunta sobre VENDAS.
 *
 * Zero jargão: não é "conversões", é "viraram venda". E fala do dia que
 * fechou, porque é sobre ontem que se pergunta — ver `./dia.ts`.
 */
export const PERGUNTA_DE_VENDAS = "Quantas dessas conversas viraram venda ontem?";

/**
 * A pergunta sobre RECEITA.
 *
 * ============================================================
 * SÃO DUAS PERGUNTAS, E ISSO É O CONTRATO.
 *
 * "`vendas` e `receita_centavos` são opcionais SEPARADAMENTE, e essa é a
 * regra mais importante deste contrato. 'Umas 3' o dono responde de
 * cabeça; 'quanto deu' exige contar. Aceitar só a primeira é o caso
 * NORMAL, não a exceção."
 *
 * Uma pergunta só, exigindo os dois números, transformaria o caso normal
 * em abandono.
 * ============================================================
 */
export const PERGUNTA_DE_RECEITA = "E quanto entrou com elas, mais ou menos?";

/**
 * O que vai no campo `pergunta` do corpo.
 *
 * As duas juntas porque o corpo é UM, e o que se registra é o que a tela
 * mostrou — que foram as duas. Separar exigiria duas linhas por dia, e a
 * chave é `(execução, dia)`.
 */
export const PERGUNTA_GRAVADA = `${PERGUNTA_DE_VENDAS} ${PERGUNTA_DE_RECEITA}`;

/**
 * Converte o que o dono digitou em reais para os centavos do contrato.
 *
 * ============================================================
 * "R$ 1.600,50" PRECISA VIRAR 160050, E NÃO 1600.5.
 *
 * O contrato pede "centavos inteiros, nunca float". Um `Number()` direto
 * sobre "1.600,50" devolve `NaN` em pt-BR — o ponto é separador de
 * milhar, não decimal.
 *
 * `Math.round` no fim, e não `Math.trunc`: `16.005 * 100` dá
 * `1600.4999999999998` em ponto flutuante, e truncar perderia um centavo
 * do cliente. Arredondar é o que devolve o número que ele digitou.
 * ============================================================
 *
 * Devolve `null` quando não dá para ler — e quem chama trata `null` como
 * "não respondeu", nunca como zero.
 */
export function centavosDoQueFoiDigitado(bruto: string): number | null {
  const limpo = bruto.trim();
  if (limpo === "") return null;

  // Tira "R$", espaço (inclusive o não separável do `Intl`) e o separador
  // de milhar; a vírgula vira ponto decimal.
  const normalizado = limpo
    .replace(/R\$/gi, "")
    .replace(/[\s ]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const n = Number(normalizado);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/**
 * O que o dono digitou como contagem de vendas.
 *
 * Aceita só inteiro não negativo. "Umas 3" não passa de propósito: o
 * campo é numérico, e adivinhar o número dentro de uma frase é o tipo de
 * palpite que este produto não dá sobre dado do cliente.
 */
export function vendasDoQueFoiDigitado(bruto: string): number | null {
  const limpo = bruto.trim();
  if (limpo === "") return null;
  if (!/^\d+$/.test(limpo)) return null;
  const n = Number(limpo);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * ============================================================
 * A MÁSCARA DE MOEDA — teclado de banco, da direita para a esquerda.
 *
 *   digita 1      → 0,01
 *   digita 16     → 0,16
 *   digita 160    → 1,60
 *   digita 16050  → 160,50
 *   digita 200000 → 2.000,00
 *
 * POR QUE ELA EXISTE: no celular, com teclado numérico, a vírgula é onde o
 * dono erra. Digitar "200" querendo dois mil e guardando duzentos é um erro
 * de uma tecla num campo de dinheiro.
 *
 * ============================================================
 * ELA NÃO SUBSTITUI O `centavosDoQueFoiDigitado`, E ISSO É REGRA.
 *
 * Os dois caminhos são diferentes e precisam continuar existindo:
 *
 *   DIGITAR → cada dígito entra pela direita. É esta função.
 *   COLAR   → o texto já vem formatado ("1.600,50", "R$ 1.600,50", "1600")
 *             e é lido como REAIS, pelo parser de sempre.
 *
 * Se a máscara tratasse texto colado, "1600" viraria R$ 16,00 — o valor
 * que a pessoa colou dividido por cem, sem nada avisando. Por isso o
 * componente usa `onPaste` para o parser e `onChange` para a máscara: não
 * é heurística sobre o tamanho da mudança, é o evento dizendo qual é o
 * caso.
 * ============================================================
 */
export function centavosDeDigitos(bruto: string): number | null {
  const digitos = bruto.replace(/\D/g, "");
  if (digitos === "") return null;

  const n = Number(digitos);
  // Não é decisão de teto de valor — é recusar número que o JavaScript não
  // representa direito. Acima disso a aritmética de centavos começa a
  // mentir, e mentir sobre dinheiro em silêncio é o que não pode.
  if (!Number.isSafeInteger(n)) return null;
  return n;
}

/**
 * Os centavos como o campo os mostra: `1.600,50`.
 *
 * SEM o "R$", ao contrário do `dinheiroDeCentavos`. O símbolo dentro do
 * campo atrapalha a edição — apagar de trás para a frente esbarraria nele,
 * e o cursor teria que saber pulá-lo. O rótulo do campo diz que é dinheiro.
 */
const NO_CAMPO = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function centavosNoCampo(centavos: number): string {
  return NO_CAMPO.format(centavos / 100);
}
