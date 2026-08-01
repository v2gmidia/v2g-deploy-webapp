/**
 * As perguntas do passo 1, na ordem do protótipo
 * (`tela-03-onboarding-desktop.html`). Copy idêntica ao original.
 *
 * Fixas nesta etapa, por decisão: nada de LLM aqui ainda. Ficam num
 * módulo próprio (e não dentro do componente) porque o servidor também
 * precisa delas — é ele quem valida a resposta recebida contra as
 * opções existentes antes de gravar.
 */

export interface Opcao {
  /** o que vira o balão do usuário e o que é gravado */
  echo: string;
  /** o que aparece escrito no chip (às vezes mais curto) */
  rotulo: string;
}

export interface Pergunta {
  id: string;
  contador?: string;
  texto: string;
  opcoes: Opcao[];
  /** q3 pede a cidade num campo à parte antes de escolher o alcance */
  pedeCidade?: boolean;
  fallbackLabel?: string;
  fallbackPlaceholder?: string;
  /** chip que só abre o campo de texto, sem responder (o "Outro") */
  chipAbreTexto?: string;
}

export const PERGUNTAS: Pergunta[] = [
  {
    id: "0",
    texto:
      "Oi! Sou a IA da V2G. Vou te fazer só algumas perguntas rápidas pra montar sua campanha do jeito certo. Bora?",
    opcoes: [{ echo: "Bora começar", rotulo: "Bora começar" }],
  },
  {
    id: "1",
    contador: "Pergunta 1 de 4",
    texto: "Qual desses é o seu negócio?",
    opcoes: [
      { echo: "Clínica / Consultório", rotulo: "Clínica / Consultório" },
      { echo: "Loja física", rotulo: "Loja física" },
      { echo: "Restaurante / Bar", rotulo: "Restaurante / Bar" },
      { echo: "Serviço (advocacia, arquitetura, contabilidade)", rotulo: "Serviço" },
      { echo: "Beleza e estética", rotulo: "Beleza e estética" },
    ],
    chipAbreTexto: "Outro",
    fallbackLabel: "Como você descreveria seu negócio",
    fallbackPlaceholder: "Como você descreveria seu negócio em poucas palavras?",
  },
  {
    id: "2",
    contador: "Pergunta 2 de 4",
    texto:
      "Quanto costuma ser o valor médio que um cliente paga em cada compra ou serviço? Isso ajuda a IA a não gastar seu investimento com o público errado.",
    opcoes: [
      { echo: "Até R$ 100", rotulo: "Até R$ 100" },
      { echo: "R$ 100 a R$ 300", rotulo: "R$ 100 a R$ 300" },
      { echo: "R$ 300 a R$ 800", rotulo: "R$ 300 a R$ 800" },
      { echo: "Acima de R$ 800", rotulo: "Acima de R$ 800" },
    ],
    fallbackLabel: "Valor médio",
    fallbackPlaceholder: "Digite o valor médio",
  },
  {
    id: "3",
    contador: "Pergunta 3 de 4",
    texto:
      "De onde vêm seus clientes? Me diz sua cidade — e até que distância vale a pena buscar cliente.",
    pedeCidade: true,
    opcoes: [
      { echo: "Só aqui perto (até 5 km)", rotulo: "Só aqui perto (até 5 km)" },
      { echo: "Na cidade toda", rotulo: "Na cidade toda" },
      { echo: "Cidade + região", rotulo: "Cidade + região" },
    ],
    fallbackLabel: "Onde seus clientes estão",
    fallbackPlaceholder: "Conte com suas palavras onde seus clientes estão",
  },
  {
    id: "4",
    contador: "Pergunta 4 de 4 · última",
    texto: "Perfeito. E o que você mais quer agora com os anúncios?",
    opcoes: [
      { echo: "Vender mais", rotulo: "Vender mais" },
      { echo: "Gerar contatos de interessados", rotulo: "Gerar contatos" },
      { echo: "Marcar visitas ou agendamentos", rotulo: "Marcar visitas ou agendamentos" },
    ],
    fallbackLabel: "O que você quer com os anúncios",
    fallbackPlaceholder: "Diga com suas palavras o que você quer",
  },
];

export const ORDEM = PERGUNTAS.map((p) => p.id);
export const ULTIMA = ORDEM[ORDEM.length - 1]!;

/** minutos restantes mostrados na trilha, por pergunta respondida */
export const MIN_RESTANTES: Record<string, number> = {
  "0": 10,
  "1": 9,
  "2": 8,
  "3": 7,
  "4": 5,
};

/** blocos acesos na trilha do passo 1 (de 6), por pergunta respondida */
export const BLOCOS_ACESOS: Record<string, number> = {
  "0": 2,
  "1": 3,
  "2": 4,
  "3": 5,
  "4": 6,
};

/**
 * Ticket médio: os chips são faixas, a coluna `businesses.avg_ticket` é
 * numérica. Guardamos o ponto médio da faixa para dar o que consultar, e
 * o texto exato escolhido continua em `businesses.onboarding` — a coluna
 * é uma estimativa derivada, a resposta crua é a fonte da verdade.
 * "Acima de R$ 800" vira 800 por ser piso, não média.
 */
export const TICKET_ESTIMADO: Record<string, number> = {
  "Até R$ 100": 50,
  "R$ 100 a R$ 300": 200,
  "R$ 300 a R$ 800": 550,
  "Acima de R$ 800": 800,
};

/**
 * Raio: mesma lógica. "Na cidade toda" e "Cidade + região" não têm um
 * número exato — 25 km e 60 km são aproximações para a segmentação
 * inicial, ajustáveis depois pelo próprio usuário.
 */
export const RAIO_KM: Record<string, number> = {
  "Só aqui perto (até 5 km)": 5,
  "Na cidade toda": 25,
  "Cidade + região": 60,
};

/** Extrai um número de uma resposta escrita à mão ("uns 250 reais"). */
export function numeroDoTexto(texto: string): number | null {
  const limpo = texto.replace(/\./g, "").replace(",", ".");
  const achado = limpo.match(/\d+(\.\d+)?/);
  if (!achado) return null;
  const n = Number(achado[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function perguntaPorId(id: string): Pergunta | undefined {
  return PERGUNTAS.find((p) => p.id === id);
}

/** A próxima pergunta ainda sem resposta, ou null se acabou. */
export function proximaPergunta(respondidas: string[]): Pergunta | null {
  for (const p of PERGUNTAS) {
    if (!respondidas.includes(p.id)) return p;
  }
  return null;
}

/**
 * As duas funções abaixo derivam o estado da trilha a partir das
 * respostas. Vivem aqui, e não no componente de chat, porque quem as
 * chama é a `page.tsx` — que roda no servidor. Num módulo `"use client"`
 * elas não seriam chamáveis de lá.
 *
 * Só olham quais chaves existem, então basta um `Record` de qualquer
 * coisa — evita importar o tipo de `actions.ts` e fechar um ciclo.
 */
function ultimaRespondida(respostas: Record<string, unknown>): string | undefined {
  const respondidas = ORDEM.filter((id) => respostas[id]);
  return respondidas[respondidas.length - 1];
}

/** Quantos blocos da trilha do passo 1 estão acesos (de 6). */
export function blocosDoPasso1(respostas: Record<string, unknown>): number {
  const ultima = ultimaRespondida(respostas);
  return ultima ? (BLOCOS_ACESOS[ultima] ?? 1) : 1;
}

/** Minutos restantes mostrados na trilha. */
export function minutosRestantes(respostas: Record<string, unknown>): number {
  const ultima = ultimaRespondida(respostas);
  return ultima ? (MIN_RESTANTES[ultima] ?? 10) : 10;
}
