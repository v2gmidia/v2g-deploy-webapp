/**
 * Quais números aparecem num pedaço de fala, em dígito ou por extenso.
 *
 * Existe por causa de uma coisa medida, não imaginada: transcrição
 * automática erra número de um jeito que não parece erro. "Duzentos" vira
 * "dois mil"; "cento e cinquenta" vira "cinquenta". A frase continua
 * gramatical e o valor continua plausível — e vira orçamento de campanha.
 *
 * O uso é sempre o mesmo: o agente propõe um valor e cita um trecho; aqui
 * se confere que o valor proposto está mesmo dentro daquele trecho. Um
 * número que não está no trecho não tem fonte, mesmo que o trecho exista.
 */

const UNIDADES: Record<string, number> = {
  zero: 0,
  um: 1,
  uma: 1,
  dois: 2,
  duas: 2,
  tres: 3,
  quatro: 4,
  cinco: 5,
  seis: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13,
  catorze: 14,
  quatorze: 14,
  quinze: 15,
  dezesseis: 16,
  dezasseis: 16,
  dezessete: 17,
  dezoito: 18,
  dezenove: 19,
  vinte: 20,
  trinta: 30,
  quarenta: 40,
  cinquenta: 50,
  sessenta: 60,
  setenta: 70,
  oitenta: 80,
  noventa: 90,
  cem: 100,
  cento: 100,
  duzentos: 200,
  duzentas: 200,
  trezentos: 300,
  trezentas: 300,
  quatrocentos: 400,
  quatrocentas: 400,
  quinhentos: 500,
  quinhentas: 500,
  seiscentos: 600,
  seiscentas: 600,
  setecentos: 700,
  setecentas: 700,
  oitocentos: 800,
  oitocentas: 800,
  novecentos: 900,
  novecentas: 900,
};

const ESCALAS: Record<string, number> = {
  mil: 1_000,
  milhao: 1_000_000,
  milhoes: 1_000_000,
};

/** Tira acento e baixa a caixa. "Duzentos" e "duzéntos" viram a mesma coisa. */
export function semAcento(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Números escritos em dígito.
 *
 * O ponto é o separador de milhar no Brasil e a vírgula é o decimal, e é
 * por isso que `1.200` tem que virar 1200 e não 1.2. A ambiguidade que
 * sobra é `1.5`: sem milhar de três casas, tratamos como decimal — é raro
 * em fala sobre dinheiro, e o caso comum (`1.200`) fica certo.
 */
function numerosEmDigito(texto: string): number[] {
  const achados: number[] = [];
  const re = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:[.,]\d+)?/g;
  for (const bruto of texto.match(re) ?? []) {
    let normal: string;
    if (/\d{1,3}(?:\.\d{3})+/.test(bruto)) {
      normal = bruto.replace(/\./g, "").replace(",", ".");
    } else {
      normal = bruto.replace(",", ".");
    }
    const n = Number(normal);
    if (Number.isFinite(n)) achados.push(n);
  }
  return achados;
}

/**
 * Números escritos por extenso.
 *
 * Acumula unidade e fecha o bloco a cada escala: "dois mil e quinhentos" =
 * (2 × mil) + 500.
 *
 * O "e" NÃO é um separador confiável, e essa foi a lição de um falso
 * positivo real. A primeira versão tratava "e" como mera ligação, e por
 * isso lia "entre doze e quarenta reais" como 52 — descartando dois itens
 * corretos numa extração de verdade.
 *
 * O que separa em português é a MAGNITUDE, não a conjunção: dentro de um
 * mesmo número as parcelas são estritamente decrescentes. "cento e
 * cinquenta" é 150 porque 50 < 100; "doze e quarenta" são dois números
 * porque 40 não é menor que 12. É essa comparação que decide, e não a
 * palavra no meio.
 *
 * Sequências separadas por qualquer palavra que não seja numeral também
 * viram números diferentes: "oitenta reais, cem clientes" dá 80 e 100.
 */
function numerosPorExtenso(texto: string): number[] {
  const palavras = semAcento(texto)
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const achados: number[] = [];
  let total = 0;
  let atual = 0;
  /** A última parcela somada. Zera após uma escala e a cada número novo. */
  let ultima = 0;
  let aberto = false;

  const fechar = () => {
    if (aberto) achados.push(total + atual);
    total = 0;
    atual = 0;
    ultima = 0;
    aberto = false;
  };

  for (const p of palavras) {
    if (p === "e") continue; // liga, não soma
    const escala = ESCALAS[p];
    if (escala !== undefined) {
      // "mil" sozinho é 1000, não 0.
      atual = (atual === 0 ? 1 : atual) * escala;
      total += atual;
      atual = 0;
      // Depois da escala, o que vier é parcela menor dela: em "mil e
      // duzentos" o 200 pertence ao mesmo número.
      ultima = 0;
      aberto = true;
      continue;
    }
    const unidade = UNIDADES[p];
    if (unidade !== undefined) {
      // Parcela que não decresce começa outro número.
      if (aberto && ultima !== 0 && unidade >= ultima) fechar();
      atual += unidade;
      ultima = unidade;
      aberto = true;
      continue;
    }
    fechar();
  }
  fechar();

  return achados;
}

/** Todos os números do texto, em dígito e por extenso. */
export function numerosNoTexto(texto: string): number[] {
  return [...numerosEmDigito(texto), ...numerosPorExtenso(texto)];
}

/**
 * O valor proposto está dentro deste trecho?
 *
 * A tolerância de um centavo existe porque `Number` não representa
 * decimal exato: `80.1` lido de dois caminhos diferentes pode divergir na
 * décima quinta casa, e reprovar um número certo por causa disso seria
 * pior que o problema que a função resolve.
 */
export function numeroApareceNoTrecho(valor: number, trecho: string): boolean {
  return numerosNoTexto(trecho).some((n) => Math.abs(n - valor) < 0.01);
}
