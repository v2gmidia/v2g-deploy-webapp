import type { ReactNode } from "react";

/**
 * Os 4 combinados, na ordem do protótipo
 * (`tela-02-expectativas-desktop.html`). Copy e ícones idênticos ao
 * original — esta tela é conteúdo puro, sem dado nenhum do banco.
 */
export interface Passo {
  titulo: string;
  sub: string;
  icone: ReactNode;
  swapLabel: string;
  swapTexto?: string;
  outlink?: string;
  recibo?: string[];
}

const Check = () => (
  <svg className="rcheck" width="13" height="13" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1.5 5.5 4 8 8.5 2.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
  </svg>
);

export const RECIBO_CHECK = Check;

export const PASSOS: Passo[] = [
  {
    titulo: "A gente não promete um número de vendas.",
    sub: "Ninguém consegue garantir isso de verdade — nem a agência mais cara da cidade. Quem promete, está chutando com a sua conta.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <rect x="4.3" y="0" width="1.4" height="2" />
        <rect x="4.3" y="8" width="1.4" height="2" />
        <rect x="0" y="4.3" width="2" height="1.4" />
        <rect x="8" y="4.3" width="2" height="1.4" />
        <rect x="4.3" y="4.3" width="1.4" height="1.4" />
        <rect x="2.6" y="2.6" width="4.8" height="4.8" fill="none" stroke="currentColor" strokeWidth="0.8" />
      </svg>
    ),
    swapLabel: "Em compensação",
    swapTexto:
      "Você vê todo dia quanto entrou e quanto voltou, sem esperar relatório de ninguém.",
  },
  {
    titulo: "A gente não coloca um gerente de conta só seu no telefone.",
    sub: "Isso é coisa de agência premium — e entra na sua conta todo mês, tenha o seu negócio precisado dele ou não.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <rect x="3.4" y="0.6" width="3.2" height="3.2" />
        <rect x="1.6" y="4.6" width="6.8" height="1.4" />
        <rect x="1" y="6" width="8" height="3.4" />
      </svg>
    ),
    swapLabel: "Em compensação",
    swapTexto:
      "Quem responde é gente de verdade, sem robô: no WhatsApp, em até 2 horas úteis, quantas vezes você precisar.",
  },
  {
    titulo: "A gente não atende quem investe mais de R$3 mil por mês em anúncio.",
    sub: "Se o seu negócio já passa disso, o formato certo é outro, com mais controle manual e estratégia dedicada. E a gente prefere dizer isso agora, não depois de passar o cartão.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <rect x="0" y="4.3" width="10" height="1.4" />
        <rect x="1" y="1.5" width="1.2" height="2.8" />
        <rect x="3.2" y="2.4" width="1.2" height="1.9" />
        <rect x="5.4" y="1.5" width="1.2" height="2.8" />
        <rect x="7.6" y="2.4" width="1.2" height="1.9" />
      </svg>
    ),
    swapLabel: "Em compensação",
    swapTexto:
      "Se não é o seu caso agora, ótimo — é exatamente pra esse tamanho que a V2G foi pensada.",
    outlink: "Já invisto mais que isso por mês →",
  },
  {
    titulo: "E o que a gente garante, a gente garante.",
    sub: "Sem fidelidade, sem multa, sem susto na fatura. Você manda — e cancela quando quiser, direto pelo app.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <rect x="2" y="0" width="6" height="1.6" />
        <rect x="0" y="1.6" width="2" height="4" />
        <rect x="8" y="1.6" width="2" height="4" />
        <rect x="2" y="1.6" width="6" height="4" />
        <rect x="2.6" y="5.6" width="4.8" height="1.8" />
        <rect x="3.6" y="7.4" width="2.8" height="1.8" />
      </svg>
    ),
    swapLabel: "Fica combinado assim",
    recibo: [
      "Sem número de vendas garantido",
      "Suporte humano, sem gerente fixo",
      "Feito pra investimento de até R$3 mil/mês",
      "Cancela quando quiser, sem multa",
    ],
  },
];
