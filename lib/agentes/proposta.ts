import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { chaveDoCampo } from "./campos";
import { falha, registrarErroExtracao, type Resultado } from "./erros";
import { extrairPerfil } from "./extrair-perfil";
import type { ItemVerificado } from "./verificar";

/**
 * Da entrevista à proposta gravada. É o passo [3] do desenho.
 *
 * Usa o cliente admin porque `propostas_de_perfil` e `itens_da_proposta`
 * têm RLS ligada e nenhuma política: negado para todo mundo que não seja
 * `service_role`. Não é atalho — é o estado desejado enquanto a tela do
 * cliente não existe.
 */

export interface PropostaCriada {
  propostaId: string;
  itens: number;
  descartados: number;
  divergencias: number;
  jaExistia: boolean;
}

/**
 * O que a pessoa da V2G anotou à mão durante a conversa.
 *
 * Aceita as duas formas que a coluna pode ter: chave curta
 * (`monthly_budget`) ou chave completa (`businesses.monthly_budget`). A
 * curta é a que alguém digita às pressas depois da reunião, e recusar por
 * causa disso perderia justamente o dado que tem precedência.
 */
function lerAnotacoes(bruto: unknown): Map<string, number> {
  const mapa = new Map<string, number>();
  if (typeof bruto !== "object" || bruto === null || Array.isArray(bruto)) {
    return mapa;
  }
  for (const [k, v] of Object.entries(bruto as Record<string, unknown>)) {
    const n = typeof v === "string" ? Number(v.replace(",", ".")) : v;
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    mapa.set(k, n);
  }
  return mapa;
}

function anotacaoPara(
  anotacoes: Map<string, number>,
  item: ItemVerificado,
): number | undefined {
  const completa = anotacoes.get(chaveDoCampo(item.campo));
  if (completa !== undefined) return completa;
  return anotacoes.get(item.campo.campo);
}

export async function criarProposta(
  entrevistaId: string,
): Promise<Resultado<PropostaCriada>> {
  const supa = createAdminClient();

  const { data: entrevista } = await supa
    .from("entrevistas")
    .select("id, business_id, transcricao, anotacoes_numeros")
    .eq("id", entrevistaId)
    .maybeSingle();

  if (!entrevista) return falha("transcricao_vazia");

  // ---------- Idempotência, antes de gastar a chamada ----------
  // O índice único no banco já impede duas propostas abertas para a mesma
  // entrevista. Conferir aqui evita PAGAR a extração para descobrir isso
  // no insert — e devolver a que já existe é mais útil que um erro, porque
  // quem clicou duas vezes queria ver a proposta, não criar outra.
  const { data: aberta } = await supa
    .from("propostas_de_perfil")
    .select("id")
    .eq("entrevista_id", entrevistaId)
    .eq("estado", "aberta")
    .maybeSingle();

  if (aberta) {
    const { count } = await supa
      .from("itens_da_proposta")
      .select("id", { count: "exact", head: true })
      .eq("proposta_id", aberta.id);

    return {
      ok: true,
      dados: {
        propostaId: aberta.id,
        itens: count ?? 0,
        descartados: 0,
        divergencias: 0,
        jaExistia: true,
      },
    };
  }

  const extraida = await extrairPerfil({
    transcricao: entrevista.transcricao ?? "",
    entrevistaId,
  });
  if (!extraida.ok) return extraida;

  const anotacoes = lerAnotacoes(entrevista.anotacoes_numeros);

  const { data: proposta, error: erroProposta } = await supa
    .from("propostas_de_perfil")
    .insert({
      business_id: entrevista.business_id,
      entrevista_id: entrevistaId,
      prompt_versao: extraida.dados.promptVersao,
      modelo: extraida.dados.modelo,
      estado: "aberta",
      tokens_entrada: extraida.dados.tokensEntrada,
      tokens_saida: extraida.dados.tokensSaida,
      descartados: extraida.dados.descartados,
    })
    .select("id")
    .single();

  if (erroProposta || !proposta) {
    registrarErroExtracao("criar-proposta", {
      categoria: "servidor",
      codigo: erroProposta?.code,
      entrevistaId,
    });
    return falha("servidor");
  }

  let divergencias = 0;
  const linhas = extraida.dados.itens.map((item) => {
    const anotado = item.campo.dinheiro ? anotacaoPara(anotacoes, item) : undefined;

    // A anotação à mão VENCE, e por isso ela só precisa existir e
    // divergir — quem anotou ouviu com o ouvido, não com o transcritor.
    // Marcar aqui é o que faz a tela mostrar os dois valores lado a lado,
    // sem nenhum deles pré-selecionado.
    const diverge =
      anotado !== undefined && Math.abs(anotado - (item.valor as number)) >= 0.01;
    if (diverge) divergencias += 1;

    return {
      proposta_id: proposta.id,
      tabela_alvo: item.campo.tabela,
      campo: item.campo.campo,
      valor_proposto: item.valor,
      confianca: item.confianca,
      trecho: item.trecho,
      // Chega aqui só o que já passou pela verificação; gravar `false`
      // seria mentir sobre um item que foi conferido.
      trecho_verificado: true,
      divergencia_anotacao: diverge,
      valor_anotado: diverge ? anotado : null,
      decisao: "pendente",
    };
  });

  if (linhas.length > 0) {
    const { error: erroItens } = await supa
      .from("itens_da_proposta")
      .insert(linhas);

    if (erroItens) {
      // Cabeçalho sem item é uma proposta que a tela abriria vazia, como
      // se a conversa não tivesse dito nada. Apagar devolve o estado
      // anterior: nenhuma proposta, e o botão de extrair de novo.
      await supa.from("propostas_de_perfil").delete().eq("id", proposta.id);
      registrarErroExtracao("criar-proposta", {
        categoria: "servidor",
        codigo: erroItens.code,
        entrevistaId,
      });
      return falha("servidor");
    }
  }

  return {
    ok: true,
    dados: {
      propostaId: proposta.id,
      itens: linhas.length,
      descartados: extraida.dados.descartados.length,
      divergencias,
      jaExistia: false,
    },
  };
}
