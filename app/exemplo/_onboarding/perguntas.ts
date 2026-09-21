/**
 * AS ONZE PERGUNTAS DO ONBOARDING NOVO — só dado, sem React.
 *
 * BANCADA: `/exemplo/onboarding`, 404 em produção. O onboarding que está
 * no ar continua sendo `app/(fluxo)/onboarding/`, intocado.
 *
 * ============================================================
 * O QUE SAIU, E POR QUÊ (briefing de 20/09/2026).
 *
 * As cinco perguntas de hoje perguntam ticket, custo e lucro — três
 * números que, desde 17/09, não decidem mais nada — e não perguntam site
 * nem Instagram, que são justamente o que o pipeline lê: o `5. varrer-site`
 * só roda com `site_url`, e o anunciante precisa de identidade.
 *
 * A ordem abaixo é a do briefing e não é acidental: nome da pessoa antes
 * do nome da empresa (quem responde é gente), e a verba só depois de o
 * nicho ser conhecido — sem o nicho, o slider não tem como dizer quanto
 * custa um contato.
 * ============================================================
 */

export type TipoDePasso =
  /** campo de texto, com áudio ou teclado */
  | "texto"
  /** CEP com máscara + escolha de raio, na mesma tela */
  | "local"
  /** o site, com a saída "não tenho" ao lado */
  | "site"
  /** lista fechada, sem campo livre */
  | "nicho"
  /** número com máscara, teclado numérico */
  | "telefone"
  /** o slider da verba */
  | "verba"
  /** arquivos: logo e fotos */
  | "material"
  /** a conexão com o Facebook */
  | "conexao";

export interface Passo {
  id: string;
  /** o número que aparece no progresso: "Pergunta 3 de 11" */
  ordem: number;
  /** a pergunta, como o cliente lê. Ocupa a tela. */
  titulo: string;
  /** uma linha abaixo dela, quando ajuda a responder */
  ajuda?: string;
  tipo: TipoDePasso;
  /**
   * Aceita áudio? Toda pergunta de TEXTO aceita; escolha, número e
   * arquivo não — ditar um CEP ou um telefone é pedir transcrição errada
   * num campo que tem formato. Ver DUVIDAS.md, DUVIDA-ONB-2.
   */
  audio: boolean;
  /**
   * Pergunta ABERTA — a resposta é livre e quanto mais longa, melhor para
   * quem vai escrever o anúncio.
   *
   * Nelas o convite ao áudio aparece e o microfone fica mais convidativo
   * que o teclado, SEM esconder o teclado. Nas curtas (nome, empresa,
   * Instagram, site) os dois ficam com o mesmo peso e não há convite: pedir
   * para alguém falar um `@` não economiza o tempo de ninguém.
   *
   * São duas no fluxo inteiro: esta, e a correção do resumo — que não é
   * passo numerado e por isso pede `aberta` na mão, lá no componente.
   */
  aberta?: boolean;
  placeholder?: string;
  /** rótulo do campo para quem usa leitor de tela */
  rotulo?: string;
}

export const PASSOS: Passo[] = [
  {
    id: "pessoa",
    ordem: 1,
    titulo: "Como posso te chamar?",
    ajuda: "Seu nome, não o da empresa — é com você que a gente fala.",
    tipo: "texto",
    audio: true,
    rotulo: "Seu nome",
    placeholder: "Seu nome",
  },
  {
    id: "empresa",
    ordem: 2,
    titulo: "Qual o nome da sua empresa?",
    ajuda: "É esse nome que vai aparecer no anúncio.",
    tipo: "texto",
    audio: true,
    rotulo: "O nome do seu negócio",
    placeholder: "O nome do seu negócio",
  },
  {
    id: "local",
    ordem: 3,
    titulo: "De onde você atende?",
    ajuda: "O CEP do seu ponto — e até onde vale a pena buscar cliente.",
    tipo: "local",
    audio: false,
    rotulo: "CEP",
    placeholder: "00000-000",
  },
  {
    id: "descricao",
    ordem: 4,
    titulo: "Me conta o que você vende.",
    ajuda: "Com suas palavras. É daqui que sai o texto do seu anúncio.",
    tipo: "texto",
    audio: true,
    aberta: true,
    rotulo: "O que você vende",
    placeholder: "Ex: bolo e salgado feitos no dia",
  },
  {
    id: "instagram",
    ordem: 5,
    titulo: "Qual o @ do seu Instagram?",
    ajuda: "É o perfil que aparece como anunciante. Pode colar o link.",
    tipo: "texto",
    audio: true,
    rotulo: "Seu Instagram",
    placeholder: "@seunegocio",
  },
  {
    id: "site",
    ordem: 6,
    titulo: "Você tem site?",
    ajuda: "A gente lê o site para entender melhor o que você vende.",
    tipo: "site",
    audio: true,
    rotulo: "Endereço do site",
    placeholder: "seunegocio.com.br",
  },
  {
    id: "nicho",
    ordem: 7,
    titulo: "Seu negócio é de que tipo?",
    ajuda: "Escolha o mais próximo. É isso que diz quanto custa cada contato.",
    tipo: "nicho",
    audio: false,
  },
  {
    id: "whatsapp",
    ordem: 8,
    titulo: "Qual WhatsApp recebe cliente?",
    ajuda: "É para lá que o anúncio manda quem clicar.",
    tipo: "telefone",
    audio: false,
    rotulo: "WhatsApp com DDD",
    placeholder: "(11) 90000-0000",
  },
  {
    id: "verba",
    ordem: 9,
    titulo: "Quanto você quer investir por mês?",
    ajuda: "Dá para mudar depois, quando quiser.",
    tipo: "verba",
    audio: false,
  },
  {
    id: "material",
    ordem: 10,
    titulo: "Manda sua logo e fotos do negócio.",
    ajuda: "Sem material, a gente não consegue montar o anúncio.",
    tipo: "material",
    audio: false,
  },
  {
    id: "conexao",
    ordem: 11,
    titulo: "Falta conectar seu Facebook.",
    ajuda: "É o que autoriza a gente a anunciar por você.",
    tipo: "conexao",
    audio: false,
  },
];

export const TOTAL = PASSOS.length;

/**
 * O CONVITE AO ÁUDIO — as duas frases, num lugar só.
 *
 * ============================================================
 * NÃO PROMETEM RESULTADO. Nada de "converte mais" ou "melhores
 * resultados": a gente não mede isso, e prometer o que não se mede é o
 * que esse público já comprou de agência antes.
 *
 * O que as frases afirmam é o que dá para observar na hora — falar é mais
 * rápido que digitar, e quem fala costuma contar mais. Decisão do Victor
 * em 20/09/2026 (`docs/decisoes.md`).
 * ============================================================
 */
export const CONVITE_ABAIXO_DO_CAMPO =
  "Prefere falar? É bem mais rápido, e quem fala costuma contar mais sobre o negócio.";

export const CONVITE_NO_MICROFONE =
  "Toque e fale, como se estivesse explicando para um cliente.";

/**
 * OS TIPOS DE NEGÓCIO, na bancada.
 *
 * Em produção esta lista vem do `GET /nichos` — `app/(fluxo)/onboarding/
 * page.tsx:47` já faz essa chamada, e `lib/nichos/validar.ts` confere a
 * escolha contra a lista viva. A bancada não tem token do backend, então
 * a lista aqui é fixa; os três primeiros são os que têm custo por contato
 * conhecido (ver `custo-por-contato.ts`).
 *
 * **Nunca campo livre**, como o briefing manda: quem não se encontra na
 * lista fala com uma pessoa, e o botão está sempre na tela.
 */
export const NICHOS_DA_BANCADA: { nicho: string; rotulo: string }[] = [
  { nicho: "distribuidora-de-bebidas", rotulo: "Distribuidora de bebidas" },
  { nicho: "agencia-de-marketing", rotulo: "Agência de marketing" },
  { nicho: "arquitetura", rotulo: "Arquitetura" },
  { nicho: "clinica-odontologica", rotulo: "Dentista" },
  { nicho: "barbearia", rotulo: "Barbearia" },
  { nicho: "manicure", rotulo: "Manicure" },
  { nicho: "petshop", rotulo: "Petshop" },
  { nicho: "oficina-mecanica", rotulo: "Oficina mecânica" },
];

/** As distâncias que o cliente escolhe no passo 3. */
export const RAIOS: { km: number; rotulo: string }[] = [
  { km: 3, rotulo: "Aqui perto" },
  { km: 10, rotulo: "Meu bairro e vizinhos" },
  { km: 25, rotulo: "A cidade toda" },
  { km: 50, rotulo: "Cidade e região" },
];
