/**
 * O catálogo de campos que a extração pode propor.
 *
 * FONTE ÚNICA, e essa é a razão de o arquivo existir. Daqui saem três
 * coisas que precisam concordar entre si:
 *
 *   1. a lista de campos escrita dentro do prompt;
 *   2. o `json_schema` que restringe a saída do modelo;
 *   3. a validação do que voltou, antes de virar item de proposta.
 *
 * Se a lista do prompt fosse escrita à mão no arquivo do prompt, um campo
 * novo entraria no schema e não no texto — e o modelo nunca proporia um
 * campo que ele não sabe que existe, sem erro em lugar nenhum. Silêncio é
 * a falha mais cara aqui.
 *
 * Este módulo NÃO importa `server-only`: não tem segredo, e a tela de
 * revisão do operador precisa dos rótulos.
 */

export type TipoCampo = "texto" | "numero" | "booleano" | "lista";

export type TabelaDePerfil =
  | "businesses"
  | "identidade_visual"
  | "narrativa_negocio";

export interface Campo {
  /** A tabela real. Só as três que têm coluna `procedencia`. */
  tabela: TabelaDePerfil;
  /** O nome da coluna, exatamente. */
  campo: string;
  tipo: TipoCampo;
  /**
   * Campo de dinheiro. Liga as regras duras do §5 do desenho: só
   * `explicito`, o número precisa aparecer no trecho, confronto com a
   * anotação à mão, e nunca entra em aceitar-em-lote.
   */
  dinheiro?: true;
  /** O que o operador lê na tela. */
  rotulo: string;
  /** O que vai para o prompt. Escrito para o modelo, não para nós. */
  guia: string;
}

export const CAMPOS: readonly Campo[] = [
  // ---------- businesses: fatos ----------
  {
    tabela: "businesses",
    campo: "city",
    tipo: "texto",
    rotulo: "Cidade",
    guia: "Cidade onde o negócio fica. Só o nome da cidade.",
  },
  {
    tabela: "businesses",
    campo: "cep",
    tipo: "texto",
    rotulo: "CEP",
    guia: "CEP do endereço, se foi dito. Só dígitos e hífen.",
  },
  {
    tabela: "businesses",
    campo: "niche",
    tipo: "texto",
    rotulo: "Ramo",
    guia:
      "O ramo, como a própria pessoa chama: barbearia, clínica de estética, padaria. Não traduza para categoria de mercado.",
  },
  {
    tabela: "businesses",
    campo: "description",
    tipo: "texto",
    rotulo: "O que o negócio faz",
    guia: "Uma a três frases sobre o que o negócio vende ou entrega.",
  },
  {
    tabela: "businesses",
    campo: "atende_somente_no_local",
    tipo: "booleano",
    rotulo: "Atende só no local",
    guia:
      "true se o cliente precisa ir até lá; false se entrega, atende em domicílio ou é online. Só preencha se a conversa disser — não deduza do ramo.",
  },
  {
    tabela: "businesses",
    campo: "business_hours",
    tipo: "texto",
    rotulo: "Horário",
    guia: "Horário de funcionamento, como foi dito.",
  },
  {
    tabela: "businesses",
    campo: "availability",
    tipo: "texto",
    rotulo: "Disponibilidade para atender",
    guia:
      "Quanto o negócio dá conta hoje: se a agenda está cheia, se sobra espaço, quantos clientes por dia aguenta.",
  },
  {
    tabela: "businesses",
    campo: "delivery_time",
    tipo: "texto",
    rotulo: "Prazo",
    guia: "Quanto tempo leva para entregar ou atender.",
  },
  {
    tabela: "businesses",
    campo: "payment_policy",
    tipo: "texto",
    rotulo: "Formas de pagamento",
    guia: "Como o cliente paga: pix, cartão, parcelamento, sinal.",
  },
  {
    tabela: "businesses",
    campo: "guarantee",
    tipo: "texto",
    rotulo: "Garantia",
    guia:
      "Garantia ou promessa oferecida ao cliente. Só se for dita — não invente a garantia padrão do ramo.",
  },
  {
    tabela: "businesses",
    campo: "differentiators",
    tipo: "lista",
    rotulo: "Diferenciais",
    guia:
      "O que a pessoa diz que a diferencia dos concorrentes. Lista curta de frases curtas, nas palavras dela.",
  },
  {
    tabela: "businesses",
    campo: "site_url",
    tipo: "texto",
    rotulo: "Site",
    guia: "Endereço do site, se houver.",
  },
  {
    tabela: "businesses",
    campo: "instagram_handle",
    tipo: "texto",
    rotulo: "Instagram",
    guia: "O perfil do Instagram, sem arroba e sem URL.",
  },

  // ---------- businesses: dinheiro ----------
  {
    tabela: "businesses",
    campo: "avg_ticket_min",
    tipo: "numero",
    dinheiro: true,
    rotulo: "Ticket médio (mínimo)",
    guia:
      "Menor valor típico de uma venda, em reais. Se a pessoa deu um valor único, use o mesmo aqui e no máximo.",
  },
  {
    tabela: "businesses",
    campo: "avg_ticket_max",
    tipo: "numero",
    dinheiro: true,
    rotulo: "Ticket médio (máximo)",
    guia: "Maior valor típico de uma venda, em reais.",
  },
  {
    tabela: "businesses",
    campo: "avg_direct_cost",
    tipo: "numero",
    dinheiro: true,
    rotulo: "Custo direto por venda",
    guia:
      "Quanto sai do bolso para entregar UMA venda: material, produto, comissão. Não é despesa fixa do mês.",
  },
  {
    tabela: "businesses",
    campo: "monthly_budget",
    tipo: "numero",
    dinheiro: true,
    rotulo: "Orçamento mensal de anúncio",
    guia:
      "Quanto a pessoa quer gastar POR MÊS em anúncio, em reais. Não confunda com faturamento nem com o que ela já gastou antes.",
  },

  // ---------- narrativa ----------
  {
    tabela: "narrativa_negocio",
    campo: "quem_somos",
    tipo: "texto",
    rotulo: "Quem somos",
    guia: "Como a pessoa apresenta o próprio negócio.",
  },
  {
    tabela: "narrativa_negocio",
    campo: "historia",
    tipo: "texto",
    rotulo: "História",
    guia: "Como começou, há quanto tempo existe, o que mudou no caminho.",
  },
  {
    tabela: "narrativa_negocio",
    campo: "por_que_existe",
    tipo: "texto",
    rotulo: "Por que existe",
    guia: "O motivo que ela dá para fazer o que faz.",
  },
  {
    tabela: "narrativa_negocio",
    campo: "para_quem",
    tipo: "texto",
    rotulo: "Para quem",
    guia:
      "Quem é o cliente dela, nas palavras dela. Pode ser inferido do que ela conta sobre quem aparece na loja.",
  },
  {
    tabela: "narrativa_negocio",
    campo: "o_que_nao_fazemos",
    tipo: "texto",
    rotulo: "O que não fazemos",
    guia:
      "O que o negócio NÃO faz, não vende ou não promete. Vale muito: é o que impede o anúncio de prometer o que ela não entrega.",
  },

  // ---------- identidade ----------
  // Cor e fonte ficam DE FORA de propósito. `cor_primaria` e `fonte_titulo`
  // são lidas pela geração de criativo como código de cor e nome de fonte;
  // alguém dizendo numa reunião que o logo é verde e amarelo não produz um
  // hex. Gravar a palavra ali seria pôr texto onde o pipeline espera valor,
  // e ele quebraria longe daqui, sem ninguém ligar uma coisa à outra. O que
  // for dito de cor cabe em `observacoes`, que é livre e é lido por gente.
  {
    tabela: "identidade_visual",
    campo: "tom_de_voz",
    tipo: "texto",
    rotulo: "Tom de voz",
    guia:
      "Como ela quer soar para o cliente: informal, técnica, acolhedora. Só se falarem disso.",
  },
  {
    tabela: "identidade_visual",
    campo: "observacoes",
    tipo: "texto",
    rotulo: "Observações de identidade",
    guia:
      "Qualquer coisa sobre a marca que não cabe nos outros campos: cores citadas por nome, referências, o que ela não quer ver no anúncio.",
  },
] as const;

/** Chave estável de um campo. Usada no item, no log e no mapa da resposta. */
export function chaveDoCampo(c: Pick<Campo, "tabela" | "campo">): string {
  return c.tabela + "." + c.campo;
}

const POR_CHAVE = new Map(CAMPOS.map((c) => [chaveDoCampo(c), c]));

export function acharCampo(chave: string): Campo | undefined {
  return POR_CHAVE.get(chave);
}

export const CHAVES: readonly string[] = CAMPOS.map(chaveDoCampo);

/** A lista que entra no prompt, no lugar de `{{CAMPOS}}`. */
export function listaParaPrompt(): string {
  const porTabela = new Map<string, Campo[]>();
  for (const c of CAMPOS) {
    const atual = porTabela.get(c.tabela) ?? [];
    atual.push(c);
    porTabela.set(c.tabela, atual);
  }

  const linhas: string[] = [];
  for (const [tabela, campos] of porTabela) {
    linhas.push("### " + tabela);
    for (const c of campos) {
      const marca = c.dinheiro ? " **(dinheiro — regra dura)**" : "";
      linhas.push(
        "- `" +
          chaveDoCampo(c) +
          "` — " +
          c.rotulo +
          " (" +
          c.tipo +
          ")" +
          marca +
          ": " +
          c.guia,
      );
    }
    linhas.push("");
  }
  return linhas.join("\n").trim();
}
