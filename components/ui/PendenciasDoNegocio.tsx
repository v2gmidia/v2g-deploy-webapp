import { createClient } from "@/lib/supabase/server";
import { TIPOS_VISIVEIS_AO_CLIENTE } from "@/lib/decisoes/visibilidade";
import { lerTodasPaginas } from "@/lib/multiconta/paginacao";

/** Sempre no negócio escolhido pela sessão; nenhum dado do painel de operação. */
export async function PendenciasDoNegocio({ businessId }: { businessId: string }) {
  const supabase = await createClient();
  const data = await lerTodasPaginas<{ id: string; kind: string; payload: unknown; created_at: string }>((de, ate) => supabase.from("decisions")
    .select("id, kind, payload, created_at")
    .eq("business_id", businessId).in("kind", [...TIPOS_VISIVEIS_AO_CLIENTE])
    .eq("needs_review", true).order("created_at", { ascending: false }).order("id").range(de, ate));
  const historico = await supabase.from("decisions").select("id, kind, payload, created_at")
    .eq("business_id", businessId).in("kind", [...TIPOS_VISIVEIS_AO_CLIENTE])
    .eq("status", "done").eq("needs_review", false).order("created_at", { ascending: false }).limit(10);
  return <>
    {data === null ? <p className="form-warning">Não conseguimos conferir as pendências deste negócio. Tente novamente.</p>
      : (data ?? []).map(d => <div className="form-warning" key={d.id}>
        <strong>{d.kind === "classification" ? "Revisar dados do negócio" : "Revisar diagnóstico do negócio"}</strong>
        <p>{resumoDaDecisao(d.payload)}</p><a href="/meu-negocio">Conferir informações</a>
      </div>)}
    {historico.error ? <p className="form-warning">Não conseguimos carregar as atualizações deste negócio.</p>
      : !!historico.data?.length && <details><summary>Atualizações do negócio</summary>
        {historico.data.map(d => <p key={d.id}><time dateTime={d.created_at}>{new Date(d.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</time> · {resumoDaDecisao(d.payload)}</p>)}
        <p className="hint">Últimas dez atualizações registradas.</p>
      </details>}
  </>;
}

export async function PendenciasNoInicio({ businessId }: { businessId: string }) {
  const supabase = await createClient();
  const [decisoes, criativos] = await Promise.all([
    supabase.from("decisions").select("id", { count: "exact", head: true })
      .eq("business_id", businessId).in("kind", [...TIPOS_VISIVEIS_AO_CLIENTE]).eq("needs_review", true),
    process.env.V2G_CREATIVE_REVIEW_ENABLED === "true"
      ? supabase.from("creative_review_requests").select("id", { count: "exact", head: true })
        .eq("business_id", businessId).eq("status", "changes_requested")
      : Promise.resolve({ count: 0, error: null }),
  ]);
  if (decisoes.error || criativos.error) return <p className="form-warning" role="status">Não conseguimos conferir todas as pendências. Consulte <a href="/conta#negocio">seu negócio</a> e <a href="/criativos?aba=revisao">os criativos</a>.</p>;
  if (!decisoes.count && !criativos.count) return null;
  return <section aria-label="Pendências para resolver" className="pendencias-contextuais">
    {!!decisoes.count && <p><strong>Seu cadastro precisa de revisão.</strong> <a href="/conta#negocio">Conferir negócio →</a></p>}
    {!!criativos.count && <p><strong>{criativos.count === 1 ? "Um criativo precisa de ajuste." : `${criativos.count} criativos precisam de ajuste.`}</strong> <a href="/criativos?aba=revisao">Ver pedidos do gestor →</a></p>}
  </section>;
}

function resumoDaDecisao(payload: unknown) {
  if (payload && typeof payload === "object") {
    const p = payload as Record<string, unknown>;
    for (const chave of ["resumo", "summary", "mensagem", "texto"]) {
      if (typeof p[chave] === "string" && p[chave].trim()) return p[chave];
    }
  }
  return "Confira os dados do negócio com a equipe.";
}
