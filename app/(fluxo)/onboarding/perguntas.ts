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
  /**
   * A pergunta é respondida pelo `SeletorDeNicho`, com a lista viva do
   * `GET /nichos` — e não pelas `opcoes` daqui.
   *
   * Quando isto está ligado, as `opcoes` deixam de ser a lista principal e
   * viram **reserva**: só aparecem se o endpoint não responder. Ver o
   * comentário na pergunta `ramo`.
   */
  seletorDeNicho?: true;
  /** pergunta sem chip nenhum: só o campo de texto, já aberto */
  soTexto?: true;
  /** piso de caracteres, quando o backend impõe um */
  minimo?: { tamanho: number; recado: string };
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
      "Oi! Sou a IA da V2G. Vou te fazer só algumas perguntas rápidas pra montar sua campanha do jeito certo. Bora?",
    opcoes: [{ echo: "Bora começar", rotulo: "Bora começar" }],
  },
  {
    id: "nome",
    contador: "Pergunta 1 de 4",
    texto: "Como se chama o seu negócio? É esse nome que vai aparecer no anúncio.",
    opcoes: [],
    soTexto: true,
    fallbackLabel: "O nome do seu negócio",
    fallbackPlaceholder: "O nome do seu negócio",
  },
  {
    id: "ramo",
    contador: "Pergunta 2 de 4",
    texto: "Qual desses é o seu negócio?",
    seletorDeNicho: true,
    /**
     * ============================================================
     * ESTAS CINCO NÃO SÃO MAIS A LISTA. SÃO A RESERVA.
     *
     * Elas só chegam à tela quando o `GET /nichos` não responde. Enquanto
     * foram a lista principal, esta era a conta do estrago, medida opção
     * por opção contra os dez nichos de `knowledge/`:
     *
     *   Clínica / Consultório  → cobre TRÊS (odontológica, estética, médico)
     *   Beleza e estética      → cobre QUATRO (barbearia, manicure, salão,
     *                            clínica estética — que aparecia nas duas)
     *   Restaurante / Bar      → cobre um
     *   Loja física            → NENHUM
     *   Serviço (advocacia…)   → NENHUM
     *
     * E três nichos reais eram inalcançáveis pelo seletor: `academia`,
     * `oficina-mecanica`, `petshop`.
     *
     * NÃO ACRESCENTE OPÇÃO AQUI. Toda linha nova é uma lista paralela
     * envelhecendo em silêncio, que é o defeito que este lote apagou. A
     * lista certa é a do backend; esta existe só para a tela não ficar
     * sem nada num dia em que ele estiver fora.
     *
     * Elas continuam com `echo` porque o servidor valida contra elas
     * quando é a reserva que está no ar — ver `actions.ts`.
     * ============================================================
     */
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
    id: "descricao",
    contador: "Pergunta 3 de 4",
    texto:
      "Me conta com suas palavras o que você vende ou faz. Pode ser uma frase — é isso que a IA usa pra escrever seu anúncio.",
    opcoes: [],
    soTexto: true,
    fallbackLabel: "O que você vende ou faz",
    fallbackPlaceholder: "Ex: bolos e salgados feitos no dia, pra festa e pro dia a dia",
    // O schema do backend exige 10 caracteres (`descricao_livre`,
    // `minLength: 10`). O recado NÃO cita o número: contar caractere na
    // tela é linguagem de formulário, e o piso útil é bem maior que o piso
    // do schema de qualquer jeito.
    minimo: {
      tamanho: 10,
      recado: "Conta um pouco mais — uma frase inteira ajuda a IA a entender o que você vende.",
    },
  },
  {
    id: "praca",
    contador: "Pergunta 4 de 4 · última",
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
];

export const ORDEM = PERGUNTAS.map((p) => p.id);
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
  for (const p of PERGUNTAS) {
    if (!respondidas.includes(p.id)) return p;
  }
  return null;
}
