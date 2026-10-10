import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_REVISAO, rotuloDaRevisao, type StatusRevisao } from "@/lib/criativos/revisao";
import { DecidirPeca } from "./DecidirPeca";

export const metadata = { title: "Revisão de criativos | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CriativosDoGestorPage({ searchParams }: {
  searchParams: Promise<{ negocio?: string; filtro?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();
  if (process.env.V2G_CREATIVE_REVIEW_ENABLED !== "true")
    return <div className="canvas"><h1>Revisão de criativos</h1><p>A fila ainda não foi ativada neste ambiente.</p></div>;
  try {
    const admin = createAdminClient();
    const parametros = await searchParams;
    const minhas = parametros.filtro === "minhas";
    const negocioId = typeof parametros.negocio === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parametros.negocio)
      ? parametros.negocio : null;
    if (parametros.negocio && !negocioId) return <div className="canvas"><h1>Revisão de criativos</h1>
      <p className="form-warning">O negócio informado não é válido.</p><p><a href="/gestor/criativos">Ver toda a fila</a></p></div>;
    const atribuicoes = minhas ? await admin.from("manager_accounts")
      .select("business_id").eq("operator_profile_id", user.id).limit(1000) : null;
    if (atribuicoes?.error) throw new Error("atribuições indisponíveis");
    if (minhas && atribuicoes?.data?.length === 1000)
      return <div className="canvas"><h1>Revisão de criativos</h1>
        <p className="form-warning">A carteira ultrapassou o limite desta consulta. A lista de peças das suas contas poderia ficar incompleta.</p>
        <p><a href="/gestor/criativos">Ver toda a fila</a> · <a href="/gestor">Voltar à carteira</a></p></div>;
    const meusNegocios = (atribuicoes?.data ?? []).map((item) => item.business_id);
    if (minhas && negocioId && !meusNegocios.includes(negocioId))
      return <div className="canvas"><h1>Revisão de criativos</h1>
        <p className="form-warning">Esta conta não está na sua carteira de gestor.</p>
        <p><a href="/gestor/criativos?filtro=minhas">Ver minhas contas</a> · <a href="/gestor/criativos">Ver toda a fila</a></p></div>;
    // Buscar pendências antes do histórico: limitar os últimos envios primeiro
    // ocultava peças antigas que ainda precisavam de decisão do gestor.
    const colunas = "id, business_id, original_name, file_path, status, review_note, created_at";
    const consultaPendentes = admin.from("creative_review_requests")
      .select(colunas, { count: "exact" }).eq("status", "awaiting_review");
    const consultaHistorico = admin.from("creative_review_requests")
      .select(colunas).neq("status", "awaiting_review");
    const [pendentes, historico] = minhas && meusNegocios.length === 0
      ? [{ data: [], count: 0, error: null }, { data: [], error: null }]
      : await Promise.all([
        (negocioId ? consultaPendentes.eq("business_id", negocioId)
          : minhas ? consultaPendentes.in("business_id", meusNegocios) : consultaPendentes)
          .order("created_at", { ascending: true }).limit(100),
        (negocioId ? consultaHistorico.eq("business_id", negocioId)
          : minhas ? consultaHistorico.in("business_id", meusNegocios) : consultaHistorico)
          .order("created_at", { ascending: false }).limit(30),
      ]);
    if (pendentes.error || historico.error || !pendentes.data || !historico.data)
      throw new Error("fila indisponível");
    const pedidos = [...pendentes.data, ...historico.data];
    const ids = [...new Set(pedidos.map((pedido) => pedido.business_id))];
    const nomesConsultados = negocioId ? [negocioId] : ids;
    const negocios = nomesConsultados.length ? await admin.from("businesses")
      .select("id, name").in("id", nomesConsultados) : { data: [], error: null };
    const nomes = new Map((negocios.data ?? []).map((negocio) => [negocio.id, negocio.name]));
    const links = await Promise.all(pedidos.map(async (pedido) => {
      if (pedido.status === "uploading" || pedido.status === "upload_failed") return null;
      const url = await admin.storage.from(BUCKET_REVISAO).createSignedUrl(pedido.file_path, 600);
      return url.error ? null : url.data.signedUrl;
    }));
    const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
    return <div className="canvas"><div className="page-head"><p>OPERAÇÃO · USO INTERNO</p><h1>Revisão de criativos</h1>
      <p>Peças enviadas pelos clientes, por negócio. Aprovação interna não publica uma campanha.</p></div>
      <p><a href="/gestor">Voltar à carteira</a>{negocioId && <> · <a href="/gestor/criativos">Ver toda a fila</a></>}</p>
      <p><a href="/gestor/criativos?filtro=minhas" aria-current={minhas ? "page" : undefined}>Minhas contas</a> · <a href="/gestor/criativos" aria-current={!minhas ? "page" : undefined}>Toda a fila</a></p>
      {negocioId && <p>Conta selecionada: {nomes.get(negocioId) ?? negocioId}</p>}
      {minhas && meusNegocios.length === 0 && <p>Nenhuma conta atribuída a você. Consulte a carteira ou assuma uma conta na fila de tarefas.</p>}
      {(pendentes.count === null || pendentes.count > pendentes.data.length || negocios.error) &&
        <p className="form-warning">Há pendências além das exibidas ou nomes de negócios indisponíveis. Continue a revisão pela fila e confira a fonte antes de decidir.</p>}
      {historico.data.length === 30 && <p>Histórico: mostrando os 30 envios mais recentes que não aguardam revisão.</p>}
      {pedidos.length === 0 && <p>Nenhuma peça registrada para revisão.</p>}
      {pedidos.map((pedido, indice) => <section className="auth-card" key={pedido.id}>
        <h2>{nomes.get(pedido.business_id) ?? "Negócio sem nome disponível"}</h2>
        <p>{pedido.original_name} · {rotuloDaRevisao(pedido.status as StatusRevisao)} · {data.format(new Date(pedido.created_at))}</p>
        {links[indice] ? <p><a href={links[indice]!} target="_blank" rel="noopener noreferrer">Abrir imagem (link válido por 10 minutos)</a></p>
          : pedido.status === "awaiting_review" && <p className="form-warning">Imagem indisponível agora; não decida sem conferir a peça.</p>}
        {pedido.review_note && <p>Retorno registrado: {pedido.review_note}</p>}
        {pedido.status === "awaiting_review" && links[indice] && <DecidirPeca id={pedido.id} />}
      </section>)}
      <p className="foot-line">Esta fila não confirma recebimento de aviso pelo gestor, publicação na Meta nem desempenho da peça.</p>
    </div>;
  } catch {
    return <div className="canvas"><h1>Revisão de criativos indisponível</h1>
      <p className="form-error" role="alert">Não foi possível carregar a fila agora. Tente novamente.</p></div>;
  }
}
