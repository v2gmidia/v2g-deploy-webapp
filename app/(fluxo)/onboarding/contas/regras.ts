/**
* As regras das três contas do bloco 2 — ticket, custo direto e lucro desejado.
 *
 * As estimativas continuam disponíveis; depois do teste de 13/10, o cliente
 * também pode digitar um valor em reais. Custo e valor a manter passam por
 * conferência antes de virar coluna do perfil; o ticket já tinha entrada direta.
 * Ver `docs/onboarding-expandido.md` §2 — o motivo é que um número que o
 * dono não sabe ele digita mesmo assim, e aí entra no perfil com a
 * procedência mais alta e desarma o `diagnosticar-orcamento`.
 *
 * Módulo puro: o cliente e o servidor leem daqui. É o servidor quem valida
 * a escolha recebida contra as opções que existem de verdade.
 */

import type { ChaveDeConta, RespostaDeConta } from "@/lib/cadastro/montar";

export const ORDEM_DAS_CONTAS: readonly ChaveDeConta[] = ["ticket", "custo", "lucro"];

/** A confirmação só pode seguir uma estimativa que o cliente acabou de ver. */
export function transicaoDaContaPermitida(
  conta: ChaveDeConta,
  anterior: RespostaDeConta | undefined,
  naoSei: boolean,
  confirmando: boolean,
): boolean {
  if (naoSei && confirmando) return false;
  // Ticket não tem uma etapa de confirmação de cálculo. "Não sei" é uma
  // resposta permitida após a segunda pergunta de confirmação da interface.
  if (conta === "ticket") return !confirmando;
  if (!confirmando) return true;
  return !!anterior && anterior.confirmado === false && !anterior.naoSei
    && typeof anterior.calculado === "number" && Number.isFinite(anterior.calculado);
}

/** Centavos, não frações de centavo. Dinheiro guardado com 7 casas é ruído. */
export function emReais(n: number): number {
  return Math.round(n * 100) / 100;
}

// ------------------------------------------------------------------ C1

/**
 * Ticket em faixa — a saída para quem não tem o valor exato na cabeça.
 *
 * Veio de `perguntas.ts`, onde vivia enquanto o ticket era pergunta do
 * bloco 1. `max: null` = faixa aberta para cima.
 */
export const TICKET_FAIXA: Record<string, { min: number; max: number | null }> = {
  "Até R$ 100": { min: 0, max: 100 },
  "R$ 100 a R$ 300": { min: 100, max: 300 },
  "R$ 300 a R$ 500": { min: 300, max: 500 },
  "R$ 500 a R$ 800": { min: 500, max: 800 },
  "Acima de R$ 800": { min: 800, max: null },
};

/**
 * A C1 NÃO TEM "não sei", e a ausência é decisão.
 *
 * As faixas já são a resposta de quem não tem certeza — é para isso que
 * elas existem. Um "não sei" aqui derrubaria as outras duas contas junto,
 * porque as duas se calculam sobre o ticket, e trocaria uma resposta
 * imprecisa (útil) por nenhuma resposta (inútil).
 */

// ------------------------------------------------------------------ C2

export interface OpcaoDeSobra {
  id: string;
  rotulo: string;
  /** quanto sobra, em % do que entra */
  sobraPct: number;
}

/**
 * "Quanto sobra" em vez de "qual seu custo direto".
 *
 * A pergunta invertida é a que o dono sabe responder. Ele não tem o custo
 * de um bolo na cabeça; tem noção de quanto do que entra fica com ele.
 */
export const SOBRA: readonly OpcaoDeSobra[] = [
  { id: "quase-tudo", rotulo: "Sobra quase tudo", sobraPct: 80 },
  { id: "metade", rotulo: "Sobra mais ou menos a metade", sobraPct: 50 },
  { id: "pouco", rotulo: "Sobra pouco", sobraPct: 30 },
];

/** O custo direto que sai de uma escolha de sobra. */
export function custoDaSobra(ticket: number, sobraPct: number): number {
  return emReais(ticket * (1 - sobraPct / 100));
}

// C3 recebe um valor informado em reais ou uma lacuna explícita. Uma
// preferência abstrata de crescimento não vira automaticamente um número.

// ------------------------------------------------------------- validação

export function opcaoDeSobra(id: string): OpcaoDeSobra | undefined {
  return SOBRA.find((o) => o.id === id);
}

/** Um único valor em reais. Faixas digitadas não viram um número inventado. */
export function numeroDoTexto(texto: string): number | null {
  const limpo = texto.trim()
    .replace(/^uns?\s+/i, "")
    .replace(/^r\$\s*/i, "")
    .replace(/\s+reais?$/i, "")
    .trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(limpo)) return null;
  const n = Number(limpo.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? emReais(n) : null;
}
