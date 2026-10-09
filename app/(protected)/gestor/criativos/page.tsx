import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_REVISAO, rotuloDaRevisao, type StatusRevisao } from "@/lib/criativos/revisao";
import { DecidirPeca } from "./DecidirPeca";

export const metadata = { title: "Revisão de criativos | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CriativosDoGestorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();
  if (process.env.V2G_CREATIVE_REVIEW_ENABLED !== "true")
    return <div className="canvas"><h1>Revisão de criativos</h1><p>A fila ainda não foi ativada neste ambiente.</p></div>;
  try {
    const admin = createAdminClient();
    const consulta = await admin.from("creative_review_requests")
      .select("id, business_id, original_name, file_path, status, review_note, created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (consulta.error || !consulta.data) throw new Error("fila indisponível");
    const pedidos = consulta.data.sort((a, b) =>
      Number(b.status === "awaiting_review") - Number(a.status === "awaiting_review") ||
      a.created_at.localeCompare(b.created_at));
    const ids = [...new Set(pedidos.map((pedido) => pedido.business_id))];
    const negocios = ids.length ? await admin.from("businesses")
      .select("id, name").in("id", ids) : { data: [], error: null };
    const nomes = new Map((negocios.data ?? []).map((negocio) => [negocio.id, negocio.name]));
    const links = await Promise.all(pedidos.map(async (pedido) => {
      if (pedido.status === "uploading" || pedido.status === "upload_failed") return null;
      const url = await admin.storage.from(BUCKET_REVISAO).createSignedUrl(pedido.file_path, 600);
      return url.error ? null : url.data.signedUrl;
    }));
    const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
    return <div className="canvas"><div className="page-head"><p>OPERAÇÃO · USO INTERNO</p><h1>Revisão de criativos</h1>
      <p>Peças enviadas pelos clientes, por negócio. Aprovação interna não publica uma campanha.</p></div>
      <p><a href="/gestor">Voltar à carteira</a></p>
      {(pedidos.length === 100 || negocios.error) && <p className="form-warning">A consulta pode estar parcial. Confira a fonte antes de decidir.</p>}
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
