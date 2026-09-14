import type { Metadata } from "next";

/**
 * O NOME DE CADA LUGAR — o título da aba, rota por rota. 14/09/2026.
 *
 * Um mapa só, e toda página lê daqui: nenhuma repete a string. O espelho
 * legível está em docs/titulos.md, uma linha por rota. Se os dois
 * divergirem, vale este arquivo.
 *
 * AS DUAS REGRAS (decisão do Victor, 14/09/2026):
 *
 * 1. Rota que aparece na barra de cinco itens usa o rótulo da barra, letra
 *    por letra — o mesmo lugar não pode ter dois nomes. `/conta` é "Conta",
 *    não "Sua conta". Os rótulos estão em `app/(protected)/layout.tsx`.
 *
 * 2. Nas demais, um nome curto do assunto: nunca frase, nunca ponto final,
 *    alvo de 25 caracteres antes do " — V2G". Nome que passar disso volta
 *    para o Victor antes de entrar aqui.
 *
 * O TÍTULO NÃO ACOMPANHA O ESTADO DA TELA. Quem mostra estado é o `<h1>`;
 * título e cabeçalho são superfícies diferentes. Por isso não há
 * `generateMetadata` neste mapa: título de aba não custa consulta.
 *
 * ROTA DINÂMICA NUNCA LEVA O PARÂMETRO NO TÍTULO. `/exclusao-de-dados/[codigo]`
 * é "Exclusão de dados": o código é dado do cliente, e título de aba vai
 * para o histórico do navegador e para o compartilhamento de tela.
 *
 * `/` não está aqui: fica com o "V2G" do layout raiz enquanto a decisão de
 * produto sobre ela está pendente. `/campanhas` só redireciona.
 */
export const NOMES_DAS_ROTAS = {
  // A barra de cinco itens — rótulo da barra, letra por letra.
  "/inicio": "Início",
  "/criativos": "Criativos",
  "/anuncios": "Anúncios",
  "/alertas": "Avisos",
  "/conta": "Conta",

  // App, fora da barra.
  "/vendas": "Suas vendas",
  "/meu-negocio": "Seu negócio",

  // Operador.
  "/saude-meta": "Fila de revisão",
  // Exceção à regra 2, mantida por decisão: o título já existia antes dela.
  "/revisar-perfil": "Quem está esperando",
  "/revisar-perfil/[proposta]": "Revisar perfil",

  // Fluxo.
  "/onboarding": "Sobre o seu negócio",
  "/onboarding/contas": "Suas contas",
  "/expectativas": "Expectativas",
  "/conectar": "Conectar sua conta",
  "/conectar/escolher": "Escolher página",
  "/verba": "Sua verba e o cartão",
  // Mesmo título de propósito: é o mesmo assunto em dois desfechos.
  "/aprovar": "Aprovar anúncio",
  "/reprovado": "Aprovar anúncio",
  "/sem-instagram": "Instagram profissional",
  "/whatsapp-business": "WhatsApp Business",

  // Públicas. `/entrar` cobre cadastro e login no mesmo lugar.
  "/entrar": "Entrar",
  "/recuperar": "Recuperar acesso",
  "/redefinir": "Nova senha",
  "/exclusao-de-dados/[codigo]": "Exclusão de dados",
} as const;

export type RotaComTitulo = keyof typeof NOMES_DAS_ROTAS;

/** `export const metadata = tituloDaAba("/rota")` — e nada mais na página. */
export function tituloDaAba(rota: RotaComTitulo): Metadata {
  return { title: `${NOMES_DAS_ROTAS[rota]} — V2G` };
}
