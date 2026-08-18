import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { acharCampo, type Campo, type TabelaDePerfil } from "./campos";

/**
 * Leitura e decisão da proposta — o que a tela do operador usa.
 *
 * Cliente admin porque as duas tabelas têm RLS ligada e nenhuma política.
 * A autorização não vem do banco aqui: vem do `papel === "operador"`
 * conferido no proxy e de novo na página (Decisão 3).
 */

export type Decisao = "pendente" | "aceito" | "corrigido" | "descartado";

export interface ItemDaProposta {
  id: string;
  tabela: TabelaDePerfil;
  campo: string;
  rotulo: string;
  tipo: Campo["tipo"];
  dinheiro: boolean;
  valorProposto: unknown;
  confianca: "explicito" | "inferido";
  trecho: string;
  divergenciaAnotacao: boolean;
  valorAnotado: unknown;
  decisao: Decisao;
  valorFinal: unknown;
  decididoPor: string | null;
  decididoEm: string | null;
}

export interface DescartadoNaVerificacao {
  chave: string;
  motivo: string;
  valor: unknown;
  trecho?: string;
}

export interface PropostaCompleta {
  id: string;
  businessId: string;
  negocio: string;
  dadosFicticios: boolean;
  entrevistaId: string;
  realizadaEm: string | null;
  promptVersao: string;
  modelo: string;
  estado: "aberta" | "aplicada" | "descartada";
  criadoEm: string;
  aplicadaEm: string | null;
  aplicadaPor: string | null;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  itens: ItemDaProposta[];
  descartados: DescartadoNaVerificacao[];
  pendentes: number;
}

export async function carregarProposta(
  propostaId: string,
): Promise<PropostaCompleta | null> {
  const supa = createAdminClient();

  const { data: p } = await supa
    .from("propostas_de_perfil")
    .select(
      "id, business_id, entrevista_id, prompt_versao, modelo, estado, criado_em, aplicada_em, aplicada_por, tokens_entrada, tokens_saida, descartados",
    )
    .eq("id", propostaId)
    .maybeSingle();

  if (!p) return null;

  const [{ data: negocio }, { data: entrevista }, { data: itens }] =
    await Promise.all([
      supa
        .from("businesses")
        .select("name, dados_ficticios")
        .eq("id", p.business_id)
        .maybeSingle(),
      supa
        .from("entrevistas")
        .select("realizada_em")
        .eq("id", p.entrevista_id)
        .maybeSingle(),
      supa
        .from("itens_da_proposta")
        .select("*")
        .eq("proposta_id", propostaId)
        .order("tabela_alvo")
        .order("campo"),
    ]);

  const lista: ItemDaProposta[] = (itens ?? []).map((i) => {
    // O catálogo é a fonte do rótulo e do tipo. Um item cujo campo saiu do
    // catálogo depois de gravado ainda precisa aparecer — some da tela
    // seria o operador decidir sem saber que existe.
    const meta = acharCampo(`${i.tabela_alvo}.${i.campo}`);
    return {
      id: i.id,
      tabela: i.tabela_alvo as TabelaDePerfil,
      campo: i.campo,
      rotulo: meta?.rotulo ?? `${i.tabela_alvo}.${i.campo}`,
      tipo: meta?.tipo ?? "texto",
      dinheiro: Boolean(meta?.dinheiro),
      valorProposto: i.valor_proposto,
      confianca: i.confianca,
      trecho: i.trecho,
      divergenciaAnotacao: i.divergencia_anotacao,
      valorAnotado: i.valor_anotado,
      decisao: i.decisao as Decisao,
      valorFinal: i.valor_final,
      decididoPor: i.decidido_por,
      decididoEm: i.decidido_em,
    };
  });

  return {
    id: p.id,
    businessId: p.business_id,
    negocio: negocio?.name ?? "(negócio removido)",
    dadosFicticios: Boolean(negocio?.dados_ficticios),
    entrevistaId: p.entrevista_id,
    realizadaEm: entrevista?.realizada_em ?? null,
    promptVersao: p.prompt_versao,
    modelo: p.modelo,
    estado: p.estado as PropostaCompleta["estado"],
    criadoEm: p.criado_em,
    aplicadaEm: p.aplicada_em,
    aplicadaPor: p.aplicada_por,
    tokensEntrada: p.tokens_entrada,
    tokensSaida: p.tokens_saida,
    itens: lista,
    descartados: (p.descartados ?? []) as DescartadoNaVerificacao[],
    pendentes: lista.filter((i) => i.decisao === "pendente").length,
  };
}

/**
 * Grava UMA decisão, na hora do clique.
 *
 * Não existe "salvar" no fim. Ninguém revisa vinte campos numa sentada, e
 * perder o trabalho ao fechar a aba é o que faz a revisão não acontecer —
 * ou, pior, faz a segunda metade ser clicada às pressas para não perder a
 * primeira.
 */
export async function decidirItem(entrada: {
  itemId: string;
  decisao: Exclude<Decisao, "pendente">;
  valorFinal?: unknown;
  por: string;
}): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const supa = createAdminClient();

  if (entrada.decisao === "corrigido") {
    const v = entrada.valorFinal;
    if (v === null || v === undefined || v === "") {
      return { ok: false, mensagem: "Corrigir precisa de um valor." };
    }
  }

  const { data: item } = await supa
    .from("itens_da_proposta")
    .select("id, proposta_id, propostas_de_perfil(estado)")
    .eq("id", entrada.itemId)
    .maybeSingle();

  if (!item) return { ok: false, mensagem: "Item não encontrado." };

  // Proposta já aplicada é registro do que foi decidido. Deixar editar
  // depois faria a linha divergir do perfil que ela mesma produziu.
  const pai = item.propostas_de_perfil as unknown as { estado?: string } | null;
  if (pai?.estado && pai.estado !== "aberta") {
    return {
      ok: false,
      mensagem: `A proposta já está ${pai.estado}. Não dá para mudar decisão depois.`,
    };
  }

  const { error } = await supa
    .from("itens_da_proposta")
    .update({
      decisao: entrada.decisao,
      // `descartado` não guarda valor: guardar seria deixar um valor que
      // ninguém escolheu esperando para ser gravado.
      valor_final: entrada.decisao === "corrigido" ? entrada.valorFinal : null,
      decidido_por: entrada.por,
      decidido_em: new Date().toISOString(),
    })
    .eq("id", entrada.itemId);

  if (error) return { ok: false, mensagem: "Não foi possível gravar a decisão." };
  return { ok: true };
}

/** Volta um item para pendente — desfaz um clique errado. */
export async function reabrirItem(
  itemId: string,
): Promise<{ ok: true } | { ok: false; mensagem: string }> {
  const supa = createAdminClient();
  const { error } = await supa
    .from("itens_da_proposta")
    .update({
      decisao: "pendente",
      valor_final: null,
      decidido_por: null,
      decidido_em: null,
    })
    .eq("id", itemId);
  if (error) return { ok: false, mensagem: "Não foi possível reabrir o item." };
  return { ok: true };
}

// ============================================================
// A PRÉVIA
// ============================================================

export interface LinhaDaPrevia {
  tabela: TabelaDePerfil;
  campo: string;
  rotulo: string;
  /** O que vai ser gravado. */
  valorNovo: unknown;
  /** `extraido` (aceito) ou `manual` (corrigido). */
  origem: "extraido" | "manual";
  /** O que está no perfil hoje. `null` quer dizer campo vazio. */
  valorAtual: unknown;
  /** A procedência de hoje: confirmado | manual | extraido | desconhecida. */
  procedenciaAtual: string;
  /** O valor de hoje é igual ao que vai entrar? */
  semMudanca: boolean;
  /**
   * O cliente confirmou este campo e a decisão é `aceito`. Bloqueia a
   * aplicação inteira — a função de banco recusa.
   */
  conflitoBloqueante: boolean;
  /** O cliente confirmou e alguém corrigiu à mão por cima. Passa, com aviso. */
  sobrescreveConfirmado: boolean;
}

export interface Previa {
  linhas: LinhaDaPrevia[];
  descartados: number;
  bloqueios: number;
}

export async function montarPrevia(propostaId: string): Promise<Previa | null> {
  const supa = createAdminClient();
  const proposta = await carregarProposta(propostaId);
  if (!proposta) return null;

  const vaoEntrar = proposta.itens.filter(
    (i) => i.decisao === "aceito" || i.decisao === "corrigido",
  );

  // Lê o perfil de hoje. Uma consulta por tabela, e só das que têm item —
  // buscar as três sempre criaria a impressão, no log, de que a prévia
  // toca em coisa que ela não toca.
  const tabelas = new Set(vaoEntrar.map((i) => i.tabela));
  const atuais = new Map<TabelaDePerfil, Record<string, unknown> | null>();

  await Promise.all(
    [...tabelas].map(async (t) => {
      const coluna = t === "businesses" ? "id" : "business_id";
      const { data } = await supa
        .from(t)
        .select("*")
        .eq(coluna, proposta.businessId)
        .maybeSingle();
      atuais.set(t, data ?? null);
    }),
  );

  const linhas: LinhaDaPrevia[] = vaoEntrar.map((i) => {
    const linhaAtual = atuais.get(i.tabela) ?? null;
    const valorAtual = linhaAtual ? (linhaAtual[i.campo] ?? null) : null;
    const proc = linhaAtual?.procedencia as Record<string, { origem?: string }> | undefined;
    const procedenciaAtual = proc?.[i.campo]?.origem ?? "desconhecida";
    const valorNovo = i.decisao === "corrigido" ? i.valorFinal : i.valorProposto;

    return {
      tabela: i.tabela,
      campo: i.campo,
      rotulo: i.rotulo,
      valorNovo,
      origem: i.decisao === "corrigido" ? "manual" : "extraido",
      valorAtual,
      procedenciaAtual,
      semMudanca: JSON.stringify(valorAtual) === JSON.stringify(valorNovo),
      conflitoBloqueante: procedenciaAtual === "confirmado" && i.decisao === "aceito",
      sobrescreveConfirmado:
        procedenciaAtual === "confirmado" && i.decisao === "corrigido",
    };
  });

  return {
    linhas,
    descartados: proposta.itens.filter((i) => i.decisao === "descartado").length,
    bloqueios: linhas.filter((l) => l.conflitoBloqueante).length,
  };
}

// ============================================================
// O APLICAR
// ============================================================

export async function aplicarProposta(
  propostaId: string,
  por: string,
): Promise<{ ok: true; aplicados: number } | { ok: false; mensagem: string }> {
  const supa = createAdminClient();

  // Toda a atomicidade está na função de banco. Ver 0013: aplicar 20
  // campos são 40 escritas em três tabelas, e o cliente JS manda um
  // statement por vez.
  const { data, error } = await supa.rpc("aplicar_proposta", {
    p_proposta_id: propostaId,
    p_por: por,
  });

  if (error) {
    // A mensagem do `raise exception` é escrita para ser lida por quem
    // opera — diz o campo e o que fazer. Repassar é melhor que trocar por
    // um texto genérico que obrigaria a abrir o log.
    return { ok: false, mensagem: error.message };
  }

  const aplicados =
    typeof data === "object" && data !== null && "aplicados" in data
      ? Number((data as { aplicados: unknown }).aplicados)
      : 0;

  return { ok: true, aplicados };
}
