import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { andamentoDaExecucao, type Andamento } from "./relogios";

/**
 * O que ficou pelo caminho — para o operador, não para o cliente.
 *
 * ESTA LEITURA IGNORA RLS de propósito. `execucoes` é `default deny`
 * (RLS ligada, zero políticas — ver `0018_disparo_do_pipeline.sql`), e o
 * `service_role` é o único jeito de alcançá-la. Aqui isso é correto
 * porque quem chama é a `/saude-meta`, que é tela de operador e existe
 * justamente para ver o de TODO MUNDO.
 *
 * A regra de dono do `backend-integracao.md` §1 continua valendo em todo
 * o resto: nenhuma tela de cliente pode importar este módulo. Se um dia
 * uma precisar, o que ela pede é outra função, que receba o `business_id`
 * **já vindo de um select sob RLS** — e que devolva só `status` e
 * `atualizado_em`, nunca as colunas de agente. O porquê está em
 * `docs/auditoria-resultados.md`.
 *
 * O QUE ESTA LEITURA VÊ E A API NÃO: `criado_em` e `atualizado_em`. O
 * `RespostaExecucao` não expõe campo de tempo nenhum (`docs/backend-
 * integracao.md` §6.5), mas as colunas existem na tabela. Como a gente lê
 * o Postgres direto, a limitação da API não é nossa — e é isso que torna
 * possível dizer que uma execução parou.
 */

export interface ExecucaoVigiada {
  id: string;
  status: string;
  criadoEm: string | null;
  atualizadoEm: string | null;
  andamento: Andamento;
  /** minutos desde a última mudança; `null` quando não dá para saber */
  minutosParada: number | null;
  /** o nome do negócio ligado, quando há vínculo */
  nomeDoNegocio: string | null;
  /** o nome que o backend gravou na própria execução */
  nomeNaExecucao: string | null;
  temVinculo: boolean;
}

export interface Vigilancia {
  paradas: ExecucaoVigiada[];
  orfas: ExecucaoVigiada[];
  /** negócios presos em `enviando` além da trava — disparo que morreu */
  disparosPresos: { businessId: string; nome: string; desdeMin: number }[];
  total: number;
}

interface LinhaExecucao {
  id: string;
  status: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  business_id: string | null;
  cliente_id: string | null;
  nome_negocio: string | null;
  businesses: { name: string } | null;
}

function minutos(iso: string | null, agora: Date): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.floor((agora.getTime() - t) / 60_000);
}

export async function vigiarExecucoes(agora: Date): Promise<Vigilancia | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("execucoes")
    .select(
      "id, status, criado_em, atualizado_em, business_id, cliente_id, nome_negocio, businesses(name)",
    )
    .order("atualizado_em", { ascending: true });

  if (error) {
    console.error("[vigilancia] falha ao ler execuções ::", error.message);
    // `null` e não lista vazia: o operador precisa distinguir "nada
    // parado" de "não consegui olhar". Uma lista vazia diria a primeira
    // coisa quando a verdade é a segunda.
    return null;
  }

  const linhas = (data ?? []) as unknown as LinhaExecucao[];

  const vigiadas: ExecucaoVigiada[] = linhas.map((l) => {
    const status = l.status ?? "(sem status)";
    return {
      id: l.id,
      status,
      criadoEm: l.criado_em,
      atualizadoEm: l.atualizado_em,
      andamento: andamentoDaExecucao(status, l.atualizado_em, agora),
      minutosParada: minutos(l.atualizado_em, agora),
      nomeDoNegocio: l.businesses?.name ?? null,
      nomeNaExecucao: l.nome_negocio,
      // As DUAS marcas. `business_id` é o vínculo; `cliente_id` é o eco do
      // que mandamos na ida. Uma execução com só o eco não é órfã — é uma
      // cuja resposta se perdeu e que a reconciliação ainda vai ligar.
      temVinculo: Boolean(l.business_id ?? l.cliente_id),
    };
  });

  const { data: presos } = await admin
    .from("businesses")
    .select("id, name, cadastro_iniciado_em")
    .eq("cadastro_estado", "enviando");

  const disparosPresos = (presos ?? [])
    .map((b) => ({
      businessId: b.id as string,
      nome: (b.name as string) ?? "(sem nome)",
      desdeMin: minutos(b.cadastro_iniciado_em as string | null, agora) ?? 0,
    }))
    // A trava é de 2 minutos; abaixo disso é disparo em curso, normal.
    .filter((b) => b.desdeMin >= 5);

  return {
    paradas: vigiadas.filter((v) => v.andamento === "parada" || v.andamento === "demorando"),
    orfas: vigiadas.filter((v) => !v.temVinculo),
    disparosPresos,
    total: vigiadas.length,
  };
}
