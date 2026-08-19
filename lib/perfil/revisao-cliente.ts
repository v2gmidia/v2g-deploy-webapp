import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  BLOCOS,
  CAMPOS_DO_CLIENTE,
  PODE_ESVAZIAR,
  type BlocoDoPerfil,
  type CampoDoCliente,
} from "./catalogo-cliente";

/**
 * O que a tela `/meu-negocio` lê.
 *
 * TUDO SOB RLS, com o cliente do próprio usuário — nenhum `service_role`
 * aqui. As três tabelas do perfil têm política de `select` por
 * `private.owns_business` desde a 0010, e `businesses` desde a 0001. Se um
 * dia esta leitura passar a precisar do cliente admin, é sinal de que alguém
 * está lendo o que não é do dono.
 *
 * O QUE ELA NÃO LÊ: `propostas_de_perfil` e `itens_da_proposta`. O desenho da
 * extração (docs/extracao-perfil.md §2) previa abrir uma política de `select`
 * para o cliente quando esta tela chegasse. Não foi preciso: tudo que a tela
 * mostra sobre a origem de um valor já está na coluna `procedencia`, que a
 * 0013 preenche com `entrevista_id` e `proposta_id`. Uma política a menos é
 * uma superfície a menos — e a proposta é o palpite do agente ANTES da
 * revisão, que é justamente o que o cliente não deve ver como se fosse o
 * perfil dele.
 */

export type OrigemDoCampo = "confirmado" | "manual" | "extraido" | "desconhecida";
export type AtoDoCliente = "confirmou" | "corrigiu" | "preencheu";

export interface CampoNaTela extends CampoDoCliente {
  /** O valor de hoje. Para o ticket é `{ de, ate }` — ver §8.1 do desenho. */
  valor: unknown;
  vazio: boolean;
  origem: OrigemDoCampo;
  /** Quando o cliente confirmou. Só existe quando `origem = confirmado`. */
  confirmadoEm: string | null;
  /** Qual foi o ato dele. Distingue "conferiu" de "digitou". */
  ato: AtoDoCliente | null;
  /**
   * Vazio e preenchível. Falso nos números difíceis: chute neles entra como
   * `confirmado` e vira orçamento de campanha, então a coleta é outra
   * (onboarding expandido), não um `input` nesta tela.
   */
  podePreencher: boolean;
  /**
   * Dá para deixar em branco. Calculado AQUI, no servidor, e não no
   * componente: mandar o `PODE_ESVAZIAR` para o navegador arrastaria o
   * catálogo inteiro — com os textos de guia do prompt junto — para dentro
   * do bundle do cliente, por uma resposta que é um booleano.
   */
  podeEsvaziar: boolean;
}

export interface BlocoNaTela {
  id: BlocoDoPerfil;
  titulo: string;
  abertura?: string;
  /** Preenchidos, e os vazios que o cliente pode preencher aqui. */
  campos: CampoNaTela[];
  /** Vazios que a tela mostra e NÃO deixa preencher. Nunca vira cobrança. */
  naoSabemos: CampoNaTela[];
}

export interface PerfilDoCliente {
  businessId: string;
  nomeDoNegocio: string | null;
  /** Data da entrevista mais recente. Muda a frase de abertura da tela. */
  entrevistaEm: string | null;
  blocos: BlocoNaTela[];
}

interface EntradaDeProcedencia {
  origem?: string;
  em?: string;
  ato?: string;
}

const ORIGENS: readonly string[] = ["confirmado", "manual", "extraido"];

/** Ordem de confiança. Usada para resolver o par do ticket (ver abaixo). */
const FORCA: Record<OrigemDoCampo, number> = {
  confirmado: 3,
  manual: 2,
  extraido: 1,
  desconhecida: 0,
};

function lerProcedencia(
  procedencia: unknown,
  campo: string,
): { origem: OrigemDoCampo; em: string | null; ato: AtoDoCliente | null } {
  const mapa = (procedencia ?? {}) as Record<string, EntradaDeProcedencia>;
  const e = mapa[campo];
  const bruta = e?.origem;
  const origem: OrigemDoCampo =
    bruta && ORIGENS.includes(bruta) ? (bruta as OrigemDoCampo) : "desconhecida";

  const ato =
    e?.ato === "confirmou" || e?.ato === "corrigiu" || e?.ato === "preencheu"
      ? (e.ato as AtoDoCliente)
      : null;

  return {
    origem,
    em: origem === "confirmado" ? (e?.em ?? null) : null,
    ato: origem === "confirmado" ? ato : null,
  };
}

/** Vazio de verdade: nulo, string em branco, ou lista sem item. */
function estaVazio(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export async function carregarPerfilDoCliente(): Promise<PerfilDoCliente | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // `select("*")` de propósito: o catálogo decide quais colunas a tela usa, e
  // listar 19 nomes aqui criaria um terceiro lugar para esquecer de
  // acrescentar um campo. A RLS já limita as LINHAS, que é o que importa —
  // `businesses` não tem coluna secreta (o token do Meta vive em
  // `meta_connections`, com revoke de coluna desde a 0003).
  const { data: negocio } = await supabase
    .from("businesses")
    .select("*")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!negocio) return null;

  const [{ data: narrativa }, { data: identidade }, { data: entrevista }] =
    await Promise.all([
      supabase
        .from("narrativa_negocio")
        .select("*")
        .eq("business_id", negocio.id)
        .maybeSingle(),
      supabase
        .from("identidade_visual")
        .select("*")
        .eq("business_id", negocio.id)
        .maybeSingle(),
      // A entrevista mais recente, só a data. O cliente tem direito de LER a
      // própria entrevista (política da 0010, art. 18 da LGPD), mas a tela
      // não mostra transcrição — ver §3.1 do desenho.
      supabase
        .from("entrevistas")
        .select("realizada_em")
        .eq("business_id", negocio.id)
        .order("realizada_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const linhas: Record<string, Record<string, unknown> | null> = {
    businesses: negocio,
    narrativa_negocio: narrativa,
    identidade_visual: identidade,
  };

  const montar = (c: CampoDoCliente): CampoNaTela => {
    const linha = linhas[c.tabela] ?? null;
    const valor = linha ? (linha[c.campo] ?? null) : null;
    const p = lerProcedencia(linha?.procedencia, c.campo);
    const vazio = estaVazio(valor);

    return {
      ...c,
      valor,
      vazio,
      origem: p.origem,
      confirmadoEm: p.em,
      ato: p.ato,
      podePreencher: vazio && !c.dificil,
      podeEsvaziar: !vazio && PODE_ESVAZIAR.has(c.chave),
    };
  };

  /**
   * O ticket: duas colunas, um campo na tela.
   *
   * A PROCEDÊNCIA DO PAR É A MAIS FRACA DAS DUAS, e não a do `min`. Se o
   * cliente confirmou o piso e o teto continua vindo da transcrição, dizer
   * "você conferiu isso" é mentira sobre metade do que está escrito ali. A
   * mais fraca governa; confirmar o par carimba as duas de uma vez, então na
   * prática elas andam juntas — a regra existe para o caso em que não
   * andaram.
   */
  const montarTicket = (c: CampoDoCliente): CampoNaTela => {
    const min = montar(c);
    const parChave = c.parCom;
    const par = parChave
      ? CAMPOS_DO_CLIENTE.find((x) => x.chave === parChave)
      : undefined;
    const max = par ? montar(par) : null;

    const origem: OrigemDoCampo =
      max && FORCA[max.origem] < FORCA[min.origem] ? max.origem : min.origem;

    return {
      ...min,
      valor: { de: min.valor, ate: max?.valor ?? null },
      vazio: min.vazio && (max?.vazio ?? true),
      origem,
      confirmadoEm: origem === "confirmado" ? min.confirmadoEm : null,
      ato: origem === "confirmado" ? min.ato : null,
      podePreencher: min.vazio && (max?.vazio ?? true) && !c.dificil,
      podeEsvaziar:
        !(min.vazio && (max?.vazio ?? true)) &&
        PODE_ESVAZIAR.has(c.chave) &&
        (!par || PODE_ESVAZIAR.has(par.chave)),
    };
  };

  const blocos: BlocoNaTela[] = BLOCOS.map((b) => {
    const doBloco = CAMPOS_DO_CLIENTE.filter((c) => c.bloco === b.id && !c.oculto);
    const montados = doBloco.map((c) => (c.parCom ? montarTicket(c) : montar(c)));

    return {
      id: b.id,
      titulo: b.titulo,
      abertura: b.abertura,
      // Vazio e difícil vai para a lista de baixo, sem ação. Todo o resto
      // fica na lista principal — inclusive o vazio preenchível, que ganha
      // entrada aberta. Tela que mostra campo vazio sem deixar preencher
      // ensina que é só leitura, e quem aprende isso não volta.
      campos: montados.filter((c) => !(c.vazio && c.dificil)),
      naoSabemos: montados.filter((c) => c.vazio && c.dificil),
    };
  }).filter((b) => b.campos.length > 0 || b.naoSabemos.length > 0);

  return {
    businessId: negocio.id as string,
    nomeDoNegocio: (negocio.name as string | null) ?? null,
    entrevistaEm: (entrevista?.realizada_em as string | null) ?? null,
    blocos,
  };
}

/**
 * Quantos campos o cliente já confirmou.
 *
 * NÃO É PARA A TELA DELE. O desenho (§6) proíbe contador na `/meu-negocio`:
 * contador de pendência converte revisão em tarefa, e tarefa com número
 * visível é o que se adia. Isto existe para operação — saber quanto de um
 * perfil está confirmado antes de confiar nele — e o lugar é a tela do
 * operador ou um relatório.
 */
export function contarConfirmados(perfil: PerfilDoCliente): {
  confirmados: number;
  total: number;
} {
  const todos = perfil.blocos.flatMap((b) => [...b.campos, ...b.naoSabemos]);
  return {
    confirmados: todos.filter((c) => c.origem === "confirmado").length,
    total: todos.length,
  };
}
