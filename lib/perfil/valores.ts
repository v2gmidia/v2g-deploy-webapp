import type { CampoDoCliente } from "./catalogo-cliente";

/**
 * O que o cliente digitou → o valor que vai para a coluna.
 *
 * Arquivo separado das Server Actions por um motivo mecânico: um módulo
 * `"use server"` só pode exportar função assíncrona, então nada aqui poderia
 * ser exportado de lá — e o que não é exportável não é conferível em
 * separado. Conversão de número é exatamente o que se quer conferir em
 * separado.
 *
 * Devolve resultado, não lança. Valor que não dá para converter precisa
 * virar frase na tela, e a frase é diferente por tipo — "1500 ou 1.500,00" só
 * ajuda quem digitou letra num campo de dinheiro.
 */

export type Convertido =
  | { ok: true; valor: unknown }
  | { ok: false; mensagem: string };

/**
 * Número no teclado do Brasil.
 *
 * "1.200,50" e "1200.50" entram. O ponto só é descartado quando separa
 * milhar (três dígitos e fim de grupo) — sem esse cuidado, "1.5" viraria 15.
 * Mesma regra da tela do operador; se uma mudar, a outra precisa mudar
 * junto, porque as duas escrevem na mesma coluna.
 */
export function numeroBrasileiro(bruto: string): number | null {
  const limpo = bruto
    .replace(/\s|R\$/g, "")
    .replace(/\.(?=\d{3}\b)/g, "")
    .replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : null;
}

export function converterValor(campo: CampoDoCliente, bruto: string): Convertido {
  const t = bruto.trim();

  // Vazio NÃO é convertido aqui. Quem trata campo esvaziado é o despacho da
  // Server Action, que manda para outra função de banco — ver o comentário
  // do DESPACHO. Deixar o vazio virar `null` neste ponto misturaria os dois
  // caminhos e apagaria a diferença que existe justamente para a procedência
  // não sobreviver ao valor.
  if (t === "") return { ok: false, mensagem: "Esse campo ficou em branco." };

  switch (campo.tipo) {
    case "numero": {
      const n = numeroBrasileiro(t);
      if (n === null) {
        return {
          ok: false,
          mensagem: campo.dinheiro
            ? "Escreva só o número, sem letras. Por exemplo: 1500 ou 1.500,00."
            : "Não entendi esse número. Escreva só os dígitos — 25, por exemplo.",
        };
      }
      if (n < 0) return { ok: false, mensagem: "Esse número não pode ser negativo." };
      // Zero é recusado em DINHEIRO, não em "difícil". A primeira versão
      // desta linha testava `dificil` e deixava passar ticket de R$ 0 —
      // `avg_ticket_min` é dinheiro e não é difícil. Venda de R$ 0 e verba
      // de R$ 0 não são resposta: são campo em branco com outro nome, e
      // campo em branco tem caminho próprio (a função de esvaziar), que não
      // deixa procedência afirmando que alguém conferiu o zero.
      if (campo.dinheiro && n === 0) {
        return { ok: false, mensagem: "Esse valor não pode ser zero." };
      }
      return { ok: true, valor: n };
    }

    case "booleano": {
      const s = t.toLowerCase();
      if (["true", "sim", "1"].includes(s)) return { ok: true, valor: true };
      if (["false", "nao", "não", "0"].includes(s)) return { ok: true, valor: false };
      return { ok: false, mensagem: "Responda sim ou não." };
    }

    case "lista": {
      const itens = t
        .split(/\r?\n|;/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (itens.length === 0) {
        return { ok: false, mensagem: "Escreva pelo menos uma coisa, uma por linha." };
      }
      return { ok: true, valor: itens };
    }

    default:
      return { ok: true, valor: t };
  }
}

/**
 * O par do ticket, conferido junto.
 *
 * Piso maior que teto passa em qualquer validação de campo isolado e produz
 * uma faixa que não existe. O erro só apareceria depois, na conta do
 * orçamento, longe daqui.
 */
export function conferirFaixaDeTicket(
  de: number,
  ate: number,
): { ok: true } | { ok: false; mensagem: string } {
  if (de > ate) {
    return {
      ok: false,
      mensagem: "O primeiro valor precisa ser o menor. Troque os dois de lugar.",
    };
  }
  return { ok: true };
}
