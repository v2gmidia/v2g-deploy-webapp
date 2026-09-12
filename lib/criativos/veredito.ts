/**
 * O veredito da peça — vocabulário, NÃO porteira.
 *
 * ============================================================
 * A MESMA REGRA DO `nivel`, E ELA JÁ FOI PAGA UMA VEZ.
 *
 * `lib/resultado/nivel.ts` tinha sete níveis e frases próprias quando o
 * contrato declarava catorze. Os sete que faltavam não apareciam como
 * "sem frase": `FRASES[nivel]` devolvia `undefined` e `frase.titulo`
 * derrubava a página inteira. Um nível novo no backend virava tela
 * branca no cliente.
 *
 * Aqui a lista é vocabulário CONHECIDO, e não lista de permissão:
 *
 *   - valor conhecido  → apresentação própria
 *   - valor novo       → estado neutro, e os `motivos` aparecem do mesmo
 *                        jeito. A tela NUNCA some.
 *
 * Medido em 11/09/2026 contra o `openapi.json` de produção
 * (`c973b0cce8fd`): `veredito` é `string | null` **sem enum**, exatamente
 * como `nivel`. Os valores não estão no contrato — vieram de medição da
 * sessão do backend, que rodou quatro imagens pela rota. `presta` e
 * `nao_presta` saíram na resposta crua; `presta_com_ajuste` só apareceu
 * em teste unitário. **Enum pedido ao backend.**
 * ============================================================
 */

/** Os três que a medição viu. Vocabulário — quem não está aqui não é erro. */
export const VEREDITOS = ["presta", "presta_com_ajuste", "nao_presta"] as const;
export type Veredito = (typeof VEREDITOS)[number];

export function ehVeredito(v: unknown): v is Veredito {
  return typeof v === "string" && (VEREDITOS as readonly string[]).includes(v);
}

/**
 * Como cada veredito se apresenta.
 *
 * ============================================================
 * SEM NOTA, SEM ESTRELA, SEM SEMÁFORO — e a razão não é estética.
 *
 * "7 de 10" e três bolinhas coloridas convidam a comparar peças entre
 * si e a perseguir o número. O que a pessoa tem para fazer com o
 * resultado é UMA coisa: mandar do jeito que está, ajustar, ou trocar a
 * foto. São três ações, e é isso que o veredito diz.
 *
 * `nao_presta` NÃO é vermelho e não é falha. A pessoa mandou a peça do
 * negócio dela e não errou nada — a peça é que não vai render. O tom é o
 * de quem avisa antes, não o de quem reprova depois.
 * ============================================================
 */
export interface ApresentacaoDoVeredito {
  /** a manchete, em linguagem do dono */
  titulo: string;
  /** uma linha dizendo o que fazer com isso */
  apoio: string;
  /** o rótulo curto do selo */
  selo: string;
  /** a classe de estilo — `v-bom`, `v-ajuste`, `v-fraco`, `v-neutro` */
  estilo: string;
}

const APRESENTACAO: Record<Veredito, ApresentacaoDoVeredito> = {
  presta: {
    titulo: "Essa peça está boa para anunciar",
    apoio: "Dá para mandar do jeito que está.",
    selo: "Pronta",
    estilo: "v-bom",
  },
  presta_com_ajuste: {
    titulo: "Essa peça serve, com um ajuste",
    apoio: "Dá para anunciar assim, e fica melhor com o que está abaixo.",
    selo: "Serve com ajuste",
    estilo: "v-ajuste",
  },
  nao_presta: {
    // Não diz "reprovada" e não diz "ruim": diz o que vai acontecer se
    // ela subir assim, que é a informação que muda a decisão.
    titulo: "Essa peça ainda não está pronta para anunciar",
    apoio: "Do jeito que está, ela tende a render pouco. Abaixo, o que pesa mais.",
    selo: "Ainda não",
    estilo: "v-fraco",
  },
};

/**
 * O estado neutro — para veredito que a gente não conhece.
 *
 * Ele não afirma nada sobre a peça, de propósito. Inventar um veredito
 * para um valor novo é pior que não ter veredito: o dono decide com base
 * numa afirmação que ninguém fez.
 */
export const NEUTRO: ApresentacaoDoVeredito = {
  titulo: "A gente analisou sua peça",
  apoio: "Abaixo está o que a análise apontou.",
  selo: "Analisada",
  estilo: "v-neutro",
};

/** A apresentação do veredito. Valor desconhecido cai no neutro. */
export function apresentarVeredito(bruto: string | null): ApresentacaoDoVeredito | null {
  // `null` NÃO é o neutro: nulo quer dizer que nenhum arquivo foi aceito,
  // então não houve o que julgar. Quem chama trata esse caso sozinho —
  // ver `lib/backend/criativos-do-cliente.ts`. Devolver o neutro aqui
  // faria a tela dizer "a gente analisou sua peça" sobre uma peça que
  // nem chegou a ser lida.
  if (bruto === null) return null;
  return ehVeredito(bruto) ? APRESENTACAO[bruto] : NEUTRO;
}
