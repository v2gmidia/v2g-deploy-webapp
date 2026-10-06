import type { ReactNode } from "react";

/**
 * Quatro informações da jornada atual. A página não registra aceite
 * contratual nem inicia pagamento; os ícones vêm da bancada antiga.
 */
export interface Passo {
  titulo: string;
  sub: string;
  icone: ReactNode;
  swapLabel: string;
  swapTexto?: string;
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
    sub: "O resultado também depende da oferta e do atendimento aos contatos. A V2G não garante vendas nem retorno financeiro.",
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
      "Quando houver anúncio em veiculação, você acompanha o investimento e os contatos registrados, sem confundir conversa com venda.",
  },
  {
    titulo: "O primeiro anúncio passa por um gestor.",
    sub: "Na reunião vocês tratam dos acessos e do primeiro criativo. O gestor confere a estrutura digital e publica a primeira campanha manualmente, quando ela estiver pronta.",
    icone: (
      <svg width="28" height="28" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        <rect x="3.4" y="0.6" width="3.2" height="3.2" />
        <rect x="1.6" y="4.6" width="6.8" height="1.4" />
        <rect x="1" y="6" width="8" height="3.4" />
      </svg>
    ),
    swapLabel: "Em compensação",
    swapTexto:
      "Depois de concluir as perguntas, o próximo passo é escolher um horário. A reunião só estará marcada quando a reserva for confirmada.",
  },
  {
    titulo: "O negócio precisa ter CNPJ e vender pelo WhatsApp.",
    sub: "Essas duas condições são declaradas antes da compra. O gestor também avalia o Instagram e pode recomendar ajustes de marca e atendimento.",
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
      "Um Instagram que precisa melhorar não impede a compra. A avaliação e a orientação acontecem com o gestor.",
  },
  {
    titulo: "A contratação prevê permanência mínima de seis meses.",
    sub: "A mensalidade é recorrente. As condições de pagamento, desconto por antecipação e cancelamento devem estar no contrato da sua contratação.",
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
    swapLabel: "Em resumo",
    recibo: [
      "Vendas e retorno não são garantidos",
      "Primeira campanha publicada pelo gestor após as conferências",
      "CNPJ e venda pelo WhatsApp são condições da compra",
      "Permanência mínima de seis meses; consulte o contrato",
    ],
  },
];
