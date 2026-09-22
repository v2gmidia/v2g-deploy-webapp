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
   * Aceita áudio?
   *
   * ============================================================
   * SÓ ONDE DITAR NÃO PIORA — decisão do Victor, 21/09/2026.
   *
   * Até a v2, cinco perguntas aceitavam áudio. Sobrou UMA: "o que você
   * vende". As outras quatro saíram, e por motivos diferentes:
   *
   *   nome e empresa   — são uma palavra ou duas. Ditar não economiza
   *                      nada, e nome próprio é o que a transcrição mais
   *                      erra: "Thainá" volta "Tainá" e ninguém relê.
   *   Instagram e site — têm FORMATO. Ditar um `@` ou um endereço erra
   *                      letra, e uma letra errada num `@` é um
   *                      anunciante que não existe.
   *
   * CEP, telefone, escolha, número e arquivo nunca aceitaram, pelo mesmo
   * motivo dos dois últimos. Ver DUVIDAS.md, DUVIDA-ONB-2.
   * ============================================================
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
    audio: false,
    rotulo: "Seu nome",
    placeholder: "Seu nome",
  },
  {
    id: "empresa",
    ordem: 2,
    titulo: "Qual o nome da sua empresa?",
    ajuda: "É esse nome que vai aparecer no anúncio.",
    tipo: "texto",
    audio: false,
    rotulo: "O nome do seu negócio",
    placeholder: "O nome do seu negócio",
  },
  {
    id: "local",
    ordem: 3,
    titulo: "De onde você atende?",
    // A ordem da tela mudou na v3 (alcance antes do CEP), e a ajuda
    // seguiu: liderar pelo CEP faria quem vende online digitar um
    // para so depois descobrir que nao precisava.
    ajuda: "Até onde vale a pena buscar cliente — e de que ponto a gente parte.",
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
    audio: false,
    rotulo: "Seu Instagram",
    placeholder: "@seunegocio",
  },
  {
    id: "site",
    ordem: 6,
    titulo: "Você tem site?",
    ajuda: "A gente lê o site para entender melhor o que você vende.",
    tipo: "site",
    audio: false,
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
    // NAO presume que ela ja anuncia. Metade do publico que a V2G quer
    // atender nunca anunciou, e abrir com "falta conectar" transformava a
    // ultima pergunta numa exigencia que essa metade nao tem como cumprir.
    titulo: "Falta uma última coisa.",
    ajuda: "Como a gente vai publicar seu anúncio.",
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
 * OS TIPOS DE NEGÓCIO — cópia fiel do `GET /nichos`, lida em 21/09/2026.
 *
 * ============================================================
 * A LISTA DA v2 ESTAVA ERRADA, e não por pouco. Ela tinha oito nomes
 * (bebidas, agência, barbearia, manicure, petshop, oficina…) dos quais
 * **só dois existem no backend**: `arquitetura` e `clinica-odontologica`.
 * Os outros seis nunca existiram — inclusive a `distribuidora-de-bebidas`
 * que aparecia em todas as capturas da v2.
 *
 * Medido em 21/09/2026 contra `api.v2gmidia.com.br/nichos`: 8 nichos,
 * 113 termos de busca, campos em snake_case (`termos_de_busca`,
 * `sub_tipos`).
 *
 * A LISTA ABAIXO É CÓPIA, NÃO FONTE. A bancada não tem o token do backend
 * (ele é de servidor), então ela não chama a rota. Em produção quem chama
 * é `app/(fluxo)/onboarding/page.tsx:47`, e `lib/nichos/validar.ts` já
 * confere a escolha contra a lista viva.
 *
 * A lista viva MUDA — ela encolheu de 10 para 8, que é o vermelho do
 * `pnpm conferir:nichos`. Cópia envelhece: por isso a data está escrita
 * aqui, e por isso esta tela não decide nada sobre nicho.
 * ============================================================
 */
export const NICHOS_DA_BANCADA: { nicho: string; rotulo: string; termos: string[] }[] = [
  {
    nicho: "advocacia",
    rotulo: "Advogado",
    termos: ["advogado", "advocacia", "escritório de advocacia", "advogado trabalhista", "advogado previdenciário", "advogado de família", "divórcio", "inventário", "pensão alimentícia", "advogado criminal", "advogado civil", "direito do consumidor", "consultoria jurídica", "assessoria jurídica"],
  },
  {
    nicho: "analise-coloracao-pessoal",
    rotulo: "Análise de coloração pessoal / consultoria de imagem (Austrália)",
    termos: ["colour analysis", "color analysis", "personal colour analysis", "colour consultant", "colour consultation", "personal stylist", "image consultant", "style consultant", "seasonal colour analysis", "colour draping", "colour season", "analise de coloracao pessoal", "coloracao pessoal", "consultoria de imagem", "consultor de imagem", "cartela de cores"],
  },
  {
    nicho: "arquitetura",
    rotulo: "Arquiteto",
    termos: ["arquiteto", "arquitetura", "escritório de arquitetura", "projeto arquitetônico", "projeto de casa", "projeto de reforma", "arquitetura de interiores", "design de interiores", "decoração de interiores", "paisagismo", "projeto residencial", "projeto comercial"],
  },
  {
    nicho: "clinica-odontologica",
    rotulo: "Dentista",
    termos: ["dentista", "odontologia", "ortodontia", "implante", "aparelho", "clareamento", "consultorio odontologico", "prótese", "siso", "canal", "extração", "limpeza", "restauração", "faceta", "lente de contato dental", "dentadura", "aparelho invisível", "periodontia", "endodontia", "odontopediatria", "clareamento a laser"],
  },
  {
    nicho: "gestao-de-trafego",
    rotulo: "Gestão de tráfego pago / anúncios no Google e no Instagram para pequeno negócio",
    termos: ["gestão de tráfego", "gestor de tráfego", "agência de tráfego pago", "tráfego pago", "agência de marketing digital", "anúncio no Google", "anúncio no Instagram", "anúncio no Facebook", "campanha de anúncio", "assessoria de marketing", "consultoria de marketing digital", "fazer anúncio para minha empresa"],
  },
  {
    nicho: "rastreamento-veicular",
    rotulo: "Rastreamento veicular / rastreador para carro, moto e frota",
    termos: ["rastreamento veicular", "rastreador veicular", "rastreador", "rastreador de carro", "rastreador de moto", "rastreamento de frota", "gestão de frota", "monitoramento veicular", "telemetria veicular", "bloqueador veicular", "localizador de veículo", "segurança veicular"],
  },
  {
    nicho: "reparos",
    rotulo: "Reparos residenciais",
    termos: ["reparos residenciais", "marido de aluguel", "manutenção residencial", "pequenos reparos", "conserto em casa", "eletricista", "encanador", "pintor", "vazamento", "desentupimento", "instalação elétrica", "instalação de chuveiro", "montagem de móveis", "pequena reforma"],
  },
  {
    nicho: "venda-de-veiculo",
    rotulo: "Loja de veículos",
    termos: ["loja de carros", "loja de motos", "revenda de veículos", "venda de carros", "venda de motos", "seminovos", "carro usado", "moto usada", "concessionária", "multimarcas", "garagem de carros", "compra e venda de veículos"],
  },
];

/**
 * OS `sub_tipos` DO BACKEND ESTÃO VAZIOS — medido em 22/09/2026.
 *
 * ============================================================
 * O briefing manda usar os SUBTIPOS que o `GET /nichos` devolve, para
 * "designer de interiores" cair em `arquitetura`. Medido na resposta
 * viva: `sub_tipos` é `[]` nos oito nichos. **Total de subtipos na lista
 * inteira: zero.**
 *
 * O resultado pedido existe, por OUTRO campo: `termos_de_busca` de
 * `arquitetura` contém "design de interiores", "arquitetura de
 * interiores" e "decoração de interiores" — 12 termos ao todo, e 113 na
 * lista inteira.
 *
 * Por isso a busca local lê `termos`, e não `sub_tipos`. Quando o backend
 * preencher os subtipos, eles entram aqui ao lado — não no lugar: termo
 * de busca e subtipo não são a mesma coisa.
 * ============================================================
 */
export const TOTAL_DE_TERMOS = 113;

/**
 * "Outro" NÃO é um nicho do backend — é uma saída da tela.
 *
 * ============================================================
 * MEDIDO: não existe nicho genérico. Os oito são todos específicos, e
 * nenhum se chama `outro`, `geral` ou `diverso`. O briefing pede que
 * "Outro" caia "no nicho genérico do backend", e esse nicho não existe.
 *
 * O que a bancada faz: guarda `outro` e abre um campo curto para a pessoa
 * dizer qual é o negócio dela — o texto vai junto, para uma pessoa ler.
 * NÃO inventei um mapeamento para um dos oito, e não inventei um nicho.
 *
 * O que falta do lado do backend: DUVIDAS.md, DUVIDA-ONB-12.
 * ============================================================
 */
export const NICHO_OUTRO = "outro";

/**
 * ATENDER O BRASIL INTEIRO não é um raio grande — é outra coisa.
 *
 * ============================================================
 * Guardado como a string `"brasil"`, e NÃO como um km enorme. Um
 * `radius_km = 99999` seria número que parece número e não é: o backend
 * monta `geo_locations.custom_locations` com lat/lng mais raio
 * (`src/meta/graph.py:1166`), e um raio absurdo em volta de um CEP não é
 * o país — é um círculo que entra no mar e no Paraguai.
 *
 * O BACKEND HOJE NÃO SABE SEGMENTAR PAÍS. Medido em 21/09/2026 contra o
 * instantâneo do backend: `Conjunto.raio_km` é obrigatório, `cep_centro`
 * nulo gera o aviso "a Meta vai precisar de uma localização definida a
 * mão antes de publicar", e `_segmentacao` só emite `custom_locations`.
 * Ver DUVIDAS.md, DUVIDA-ONB-11.
 * ============================================================
 */
export const ABRANGENCIA_BRASIL = "brasil";

/** O que o cliente escolhe no passo 3. `valor` é o que fica guardado. */
export const RAIOS: { valor: string; rotulo: string; nota: string }[] = [
  { valor: "3", rotulo: "Aqui perto", nota: "3 km" },
  { valor: "10", rotulo: "Meu bairro e vizinhos", nota: "10 km" },
  { valor: "25", rotulo: "A cidade toda", nota: "25 km" },
  { valor: "50", rotulo: "Cidade e região", nota: "50 km" },
  {
    valor: ABRANGENCIA_BRASIL,
    rotulo: "O Brasil inteiro",
    nota: "vendo online / entrego em todo lugar",
  },
];

/** Atende o país inteiro? Então o CEP deixa de ser obrigatório. */
export function atendeOBrasilInteiro(respostas: Record<string, string>): boolean {
  return respostas.local_raio === ABRANGENCIA_BRASIL;
}

/**
 * ONDE A PESSOA PAROU — a primeira pergunta sem resposta.
 *
 * ============================================================
 * A PRIMEIRA SEM RESPOSTA, e não a última respondida. Se ela voltou para
 * corrigir o Instagram e fechou o navegador ali, "a última respondida"
 * seria a verba, e ela reabriria no fim sem o Instagram. A primeira sem
 * resposta reabre exatamente onde falta trabalho.
 *
 * Tudo respondido devolve `TOTAL`, que é o resumo.
 * ============================================================
 *
 * DUAS PERGUNTAS TÊM MAIS DE UMA RESPOSTA NA MESMA TELA:
 *
 *   passo 3 — CEP e raio. As duas são obrigatórias, MENOS quando a pessoa
 *             atende o Brasil inteiro: aí o CEP não é, porque quem vende
 *             online não tem um ponto de onde o raio parta.
 *   passo 7 — o tipo de negócio e, quando ele é "Outro", o texto curto que
 *             diz qual é. Um "Outro" sem texto não diz nada a ninguém.
 */
export function ondeParou(respostas: Record<string, string>): number {
  const respondido = (id: string) => {
    const v = respostas[id];
    if (v === undefined || v === null) return false;
    // O site tem saída legítima: "não tenho site" grava string vazia, e
    // isso É uma resposta. Os outros em branco não são.
    if (id === "site") return true;
    return v.trim() !== "";
  };
  for (let i = 0; i < PASSOS.length; i++) {
    const p = PASSOS[i]!;
    if (p.id === "local") {
      if (!respondido("local_raio")) return i;
      // Brasil inteiro: sem CEP obrigatório. Quem vende online não tem um
      // ponto de onde o raio parta.
      if (!atendeOBrasilInteiro(respostas) && !respondido("local")) return i;
      continue;
    }
    if (p.id === "nicho") {
      if (!respondido("nicho")) return i;
      // "Outro" sem o texto não diz nada a ninguém.
      if (respostas.nicho === NICHO_OUTRO && !respondido("nicho_outro")) return i;
      continue;
    }
    if (!respondido(p.id)) return i;
  }
  return PASSOS.length;
}
