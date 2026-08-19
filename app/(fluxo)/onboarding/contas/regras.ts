/**
* As regras das três contas do bloco 2 — ticket, custo direto e lucro desejado.
 *
 * A REGRA QUE GOVERNA ESTE ARQUIVO: nunca peça o número. Peça a coisa que
 * ele sabe, calcule, mostre em reais, e deixe ele confirmar ou corrigir.
 * Ver `docs/onboarding-expandido.md` §2 — o motivo é que um número que o
 * dono não sabe ele digita mesmo assim, e aí entra no perfil com a
 * procedência mais alta e desarma o `diagnosticar-orcamento`.
 *
 * Módulo puro: o cliente e o servidor leem daqui. É o servidor quem valida
 * a escolha recebida contra as opções que existem de verdade.
 */

import type { ChaveDeConta } from "@/lib/cadastro/montar";

export const ORDEM_DAS_CONTAS: readonly ChaveDeConta[] = ["ticket", "custo", "lucro"];

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
  "R$ 300 a R$ 800": { min: 300, max: 800 },
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

// ------------------------------------------------------------------ C3

export interface OpcaoDePostura {
  id: string;
  rotulo: string;
  /** quanto da margem ele quer guardar */
  fracaoQueFica: number;
}

/**
 * A C3 é uma escolha de postura, não um número.
 *
 * E a ordem dos chips é do mais agressivo para o mais conservador de
 * propósito: o primeiro que ele lê é o que deixa a IA gastar mais. O valor
 * em reais aparece DENTRO do chip, porque é ele que torna a troca visível
 * — quanto mais fica no bolso, menos a IA pode gastar, menos cliente
 * entra. Dizer isso em jargão de CPA seria falha; mostrar os dois números
 * é a mesma informação sem nenhuma palavra técnica.
 */
export const POSTURA: readonly OpcaoDePostura[] = [
  { id: "crescer", rotulo: "Quero crescer rápido", fracaoQueFica: 0.2 },
  { id: "meio-a-meio", rotulo: "Meio a meio", fracaoQueFica: 0.5 },
  { id: "lucro-agora", rotulo: "Quero lucro agora", fracaoQueFica: 0.8 },
];

export function lucroDaPostura(margem: number, fracao: number): number {
  return emReais(margem * fracao);
}

// ------------------------------------------------------------- validação

export function opcaoDeSobra(id: string): OpcaoDeSobra | undefined {
  return SOBRA.find((o) => o.id === id);
}

export function opcaoDePostura(id: string): OpcaoDePostura | undefined {
  return POSTURA.find((o) => o.id === id);
}

/** Um número escrito à mão ("uns 250", "1.200,50"). */
export function numeroDoTexto(texto: string): number | null {
  const limpo = texto.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", ".");
  if (!limpo) return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n >= 0 ? emReais(n) : null;
}
