import { NAO_SEI_BRIEFING } from "../../../lib/onboarding/briefing-trafego.ts";

/**
 * As perguntas do bloco 1 — "sobre o seu negócio".
 *
 * Fixas, por decisão: nada de LLM aqui. Ficam num módulo próprio (e não
 * dentro do componente) porque o servidor também precisa delas — é ele quem
 * valida a resposta recebida contra as opções existentes antes de gravar.
 *
 * O BLOCO 2 (as contas) NÃO ESTÁ AQUI. Ticket, custo direto e lucro
 * desejado vivem em `/onboarding/contas`, porque não são pergunta de
 * preferência: são conta, com resultado em reais e confirmação. Ver
 * `docs/onboarding-expandido.md` §3.
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
  /** a praça pede a cidade num campo à parte antes de escolher o alcance */
  pedeCidade?: boolean;
  fallbackLabel?: string;
  fallbackPlaceholder?: string;
  /** chip que só abre o campo de texto, sem responder (o "Outro") */
  chipAbreTexto?: string;
  /** Sugestões de atividade declaradas como texto, independentes do catálogo técnico. */
  seletorDeAtividade?: true;
  /** pergunta sem chip nenhum: só o campo de texto, já aberto */
  soTexto?: true;
  /** piso de caracteres, quando o backend impõe um */
  minimo?: { tamanho: number; recado: string };
  /** A resposta ausente só é aceita após uma segunda confirmação na tela. */
  admiteNaoSei?: true;
}

/**
 * IDs SÃO NOMES, e não mais "0".."4".
 *
 * A numeração antiga amarrava a resposta à POSIÇÃO da pergunta. Este lote
 * tira o ticket do meio e o objetivo do fim, então a antiga `"2"` (ticket)
 * passaria a ser lida como a descrição, e o balão do usuário mostraria
 * "R$ 100 a R$ 300" onde ele escreveu o que vende. Nome não desloca.
 */
export const PERGUNTAS: Pergunta[] = [
  {
    id: "inicio",
    texto:
      "Quer começar a preparar seu negócio agora? Vamos conhecer sua empresa para a conversa com o gestor. Suas respostas ficam salvas para continuar depois.",
    opcoes: [{ echo: "Quero começar", rotulo: "Começar onboarding" }],
  },
  {
    id: "nome",
    texto: "Como seus clientes conhecem sua empresa? Informe o nome do negócio, que pode ser diferente da razão social da compra.",
    opcoes: [],
    soTexto: true,
    fallbackLabel: "O nome do seu negócio",
    fallbackPlaceholder: "O nome do seu negócio",
  },
  {
    id: "ramo",
    texto: "Qual é o tipo do seu negócio? Busque uma atividade, como dentista ou restaurante, ou descreva com suas palavras.",
    seletorDeAtividade: true,
    // Sugestões em `lib/onboarding/atividades.ts`; não são IDs do backend.
    // O cliente escolhe uma descrição, sempre gravada com origem `texto`.
    opcoes: [],
    fallbackLabel: "Tipo de negócio",
    fallbackPlaceholder: "Ex.: software de gestão, padaria, salão de beleza",
    minimo: { tamanho: 4, recado: "Descreva o tipo do seu negócio com pelo menos quatro caracteres." },
  },
  {
    id: "descricao",
    texto:
      "Quais produtos ou serviços sua empresa oferece? Conte os principais. O gestor definirá com você o foco do primeiro anúncio.",
    opcoes: [],
    soTexto: true,
    fallbackLabel: "O que você vende ou faz",
    fallbackPlaceholder: "Ex.: criação de sites, produção de conteúdo e design para empresas",
    // O schema do backend exige 10 caracteres (`descricao_livre`,
    // `minLength: 10`). O recado NÃO cita o número: contar caractere na
    // tela é linguagem de formulário, e o piso útil é bem maior que o piso
    // do schema de qualquer jeito.
    minimo: {
      tamanho: 10,
      recado: "Conte um pouco mais — uma frase inteira ajuda a equipe a entender o que você vende.",
    },
  },
  {
    id: "oferta",
    texto: "Qual desses produtos ou serviços você quer anunciar primeiro? Conte o que está incluído; o valor médio da venda vem depois.",
    opcoes: [{ echo: NAO_SEI_BRIEFING, rotulo: "Quero decidir com o gestor" }],
    soTexto: true,
    admiteNaoSei: true,
    fallbackLabel: "Foco do primeiro anúncio",
    fallbackPlaceholder: "Ex.: criação de site institucional com até cinco páginas",
    minimo: { tamanho: 15, recado: "Descreva a oferta inicial e o que está incluído, ou deixe a escolha para a reunião." },
  },
  {
    id: "publico",
    texto: "Quem costuma comprar de você? Pense em uma pessoa ou empresa comum entre seus clientes.",
    opcoes: [{ echo: NAO_SEI_BRIEFING, rotulo: "Ainda não sei explicar" }],
    soTexto: true,
    admiteNaoSei: true,
    fallbackLabel: "Quem compra de você",
    fallbackPlaceholder: "Ex.: donos de pequenas lojas da minha cidade que vendem por conversa",
    minimo: { tamanho: 4, recado: "Conte quem costuma comprar de você, ou deixe para a reunião." },
  },
  {
    id: "motivo",
    texto: "O que essa pessoa precisa quando procura sua empresa? Pode ser um problema, desejo ou objetivo.",
    opcoes: [{ echo: NAO_SEI_BRIEFING, rotulo: "Ainda não sei explicar" }],
    soTexto: true,
    admiteNaoSei: true,
    fallbackLabel: "Motivo da procura",
    fallbackPlaceholder: "Ex.: precisa de um site para apresentar o negócio e receber contatos",
    minimo: { tamanho: 4, recado: "Conte o que esse cliente procura, ou deixe para a reunião." },
  },
  {
    id: "resultado",
    texto: "O que o cliente recebe depois da compra? Se a entrega muda conforme o serviço ou plano, conte as opções principais.",
    opcoes: [{ echo: NAO_SEI_BRIEFING, rotulo: "Ainda não sei explicar" }],
    soTexto: true,
    admiteNaoSei: true,
    fallbackLabel: "Resultado real para o cliente",
    fallbackPlaceholder: "Ex.: recebe um site publicado e acesso para atualizar textos e imagens",
    minimo: { tamanho: 4, recado: "Conte o que o cliente recebe, ou deixe para a reunião." },
  },
  {
    id: "diferencial",
    texto: "Por que seus clientes escolhem você? Conte algo que você realmente faz de modo diferente, se souber.",
    opcoes: [{ echo: NAO_SEI_BRIEFING, rotulo: "Quero descobrir com o gestor" }],
    soTexto: true,
    admiteNaoSei: true,
    fallbackLabel: "Por que escolhem sua empresa",
    fallbackPlaceholder: "Ex.: mostro uma primeira versão para o cliente antes da entrega final",
    minimo: { tamanho: 4, recado: "Dê um exemplo concreto ou deixe esta resposta para a reunião." },
  },
  {
    id: "prova",
    texto: "Você tem depoimentos, fotos de trabalhos ou outros exemplos reais que podemos conferir? Conte quais são; os arquivos da marca vêm na próxima etapa.",
    opcoes: [{ echo: "Ainda não tenho provas para enviar", rotulo: "Ainda não tenho" }],
    soTexto: true,
    fallbackLabel: "Exemplos e depoimentos disponíveis",
    fallbackPlaceholder: "Ex.: tenho fotos de três projetos e dois depoimentos autorizados",
  },
  {
    id: "praca",
    texto:
      "Onde você atende ou entrega? Escolha a área de onde podem vir clientes para o anúncio.",
    pedeCidade: true,
    opcoes: [
      { echo: "Só aqui perto (até 5 km)", rotulo: "Só aqui perto (até 5 km)" },
      { echo: "Na cidade toda", rotulo: "Na cidade toda" },
      { echo: "Cidade + região", rotulo: "Cidade + região" },
      { echo: "Brasil inteiro", rotulo: "Brasil inteiro" },
    ],
    fallbackLabel: "Área atendida",
    fallbackPlaceholder: "Ex.: atendo online em todo o estado",
  },
  {
    id: "instagram",
    contador: "Pergunta 7 de 8",
    texto: "Qual é o @ do Instagram do seu negócio? Se tiver, pode colar o link do perfil.",
    opcoes: [{ echo: "Não tenho Instagram", rotulo: "Não tenho Instagram" }],
    soTexto: true,
    fallbackLabel: "Instagram do negócio",
    fallbackPlaceholder: "@seunegocio",
  },
  {
    id: "site",
    contador: "Pergunta 8 de 8 · última",
    texto: "Seu negócio tem site? Se tiver, informe o endereço para a equipe conhecer melhor sua oferta.",
    opcoes: [{ echo: "Não tenho site", rotulo: "Não tenho site" }],
    soTexto: true,
    fallbackLabel: "Site do negócio",
    fallbackPlaceholder: "seunegocio.com.br",
  },
];

// A antiga pergunta de abertura não pede dado. Respostas já gravadas nela
// continuam legíveis, mas o percurso começa diretamente pela primeira tarefa.
// Instagram e site são conferidos na etapa visual, sem fazer a pessoa responder duas vezes.
// O foco da primeira campanha é decisão do gestor na reunião. A antiga
// resposta "oferta" permanece no histórico, mas não é pedida a novos clientes.
export const ORDEM = ["nome", "ramo", "praca", "descricao", "publico", "motivo", "resultado", "diferencial", "prova"];
export const ULTIMA = ORDEM[ORDEM.length - 1]!;

/**
 * As chaves antigas, para quem começou o onboarding antes deste lote.
 *
 * Só migra as DUAS perguntas que sobreviveram sem mudar de sentido. A
 * antiga `"2"` (ticket em faixas) e a `"4"` (objetivo) não têm destino: a
 * primeira virou conta no bloco 2 e a segunda saiu (§6). Elas continuam no
 * jsonb, que é a fonte — não são apagadas, só não são mais lidas como
 * resposta de pergunta.
 */
const CHAVE_ANTIGA: Record<string, string> = {
  "0": "inicio",
  "1": "ramo",
  "3": "praca",
};

/**
 * Traduz as chaves antigas para as novas, sem sobrescrever o que já existe
 * com o nome novo. Quem respondeu depois do lote manda.
 */
export function migrarChaves<T>(respostas: Record<string, T>): Record<string, T> {
  const saida: Record<string, T> = {};
  for (const [chave, valor] of Object.entries(respostas)) {
    const nova = CHAVE_ANTIGA[chave];
    if (nova === undefined) {
      saida[chave] = valor;
    } else if (respostas[nova] === undefined) {
      saida[nova] = valor;
    }
  }
  return saida;
}

/**
 * ============================================================
 * `MIN_RESTANTES` e `BLOCOS_ACESOS` FORAM REMOVIDAS EM 20/08/2026.
 *
 * Eram duas tabelas fixas indexadas pela última pergunta respondida DO
 * BLOCO 1. Elas não enxergavam o bloco 2 (as contas) nem a `/verba`, então
 * numa conta com o cadastro fechado e a execução já criada a trilha
 * continuava mostrando 4 blocos de 6 e "faltam ~7 min" — para sempre.
 *
 * Não foram removidas por não terem chamador: foram removidas porque
 * QUALQUER chamador futuro herdaria o mesmo defeito. Quem precisa do
 * progresso da trilha chama `blocosDaTrilha()` em `lib/estado/frases.ts`,
 * que conta os seis obrigatórios do cadastro — a mesma fonte que decide o
 * que falta em todas as outras telas.
 *
 * Os minutos não voltaram em outro lugar. Ver docs/estado-do-cliente.md §5.
 * ============================================================
 */

/**
 * Raio: "Na cidade toda" e "Cidade + região" não têm um número exato —
 * 25 km e 60 km são aproximações para a segmentação inicial, ajustáveis
 * depois pelo próprio usuário.
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
  for (const id of ORDEM) {
    const p = perguntaPorId(id)!;
    if (!respondidas.includes(p.id)) return p;
  }
  return null;
}
