import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tituloDaAba } from "@/lib/titulos";
import { AprovarPix, ComprovantePix, NovoPedidoPix } from "./Formularios";

export const metadata = tituloDaAba("/pedidos");
export const dynamic = "force-dynamic";

const estados: Record<string, string> = {
  awaiting_payment: "Aguardando comprovante",
  proof_received: "Comprovante registrado; acesso ainda fechado",
  payment_approved: "Comprovante aprovado pela equipe; entrada pelo e-mail da compra",
  cancelled: "Cancelado",
};

export default async function PedidosPage({ searchParams }: {
  searchParams: Promise<{ registro?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  let data: Array<{
    id: string; buyer_email: string; legal_name: string; cnpj: string;
    unit_count: number; total_cents: number; billing_period: string;
    status: string; proof_reference: string | null;
  }> | null = null;
  let falhaConsulta = false;
  let contratos: Array<{ order_id: string; status: string; template_version: string }> = [];
  let notas: Array<{ order_id: string; status: string; provider_invoice_id: string | null }> = [];
  let falhaDocumentos = false;
  try {
    const admin = createAdminClient();
    const resposta = await admin.from("commercial_orders")
      .select("id, buyer_email, legal_name, cnpj, unit_count, total_cents, billing_period, status, proof_reference")
      .eq("payment_method", "direct_pix")
      .order("created_at", { ascending: false })
      .limit(100);
    if (resposta.error) throw resposta.error;
    data = resposta.data;
    if (data?.length) {
      const ids = data.map((pedido) => pedido.id);
      const [respostaContratos, respostaNotas] = await Promise.all([
        admin.from("contract_documents")
          .select("order_id, status, template_version")
          .in("order_id", ids).order("created_at", { ascending: false }),
        admin.from("fiscal_documents")
          .select("order_id, status, provider_invoice_id")
          .in("order_id", ids).order("created_at", { ascending: false }),
      ]);
      if (respostaContratos.error || respostaNotas.error) falhaDocumentos = true;
      else {
        contratos = respostaContratos.data ?? [];
        notas = respostaNotas.data ?? [];
      }
    }
  } catch (error) {
    console.error("[pedidos] falha ao consultar ::", error instanceof Error ? error.message : "erro desconhecido");
    falhaConsulta = true;
  }
  const { registro } = await searchParams;
  const avisos: Record<string, string> = {
    criado: "Confira o pedido abaixo antes de enviar os dados do Pix pelo atendimento.",
    comprovante: "Confira abaixo se o comprovante foi registrado. O acesso continua fechado até a aprovação.",
    aprovado: "Confira abaixo se o pedido foi aprovado antes de orientar o comprador a entrar com o e-mail da compra.",
  };

  return <div className="canvas">
    <div className="page-head"><h1>Pedidos assistidos</h1>
      <p>Qualificação declarada e Pix direto. A equipe registra cada etapa.</p></div>
    {avisos[registro ?? ""] && <p className="form-notice">{avisos[registro ?? ""]}</p>}
    {!falhaConsulta && <NovoPedidoPix referencia={crypto.randomUUID()} />}
    <h2>Pedidos recentes</h2>
    {falhaConsulta && <p className="form-error" role="alert">Não foi possível consultar os pedidos agora.</p>}
    {!falhaConsulta && data?.length === 0 && <p>Nenhum pedido assistido registrado.</p>}
    {!falhaConsulta && (data ?? []).map((pedido) => <section className="auth-card" key={pedido.id}>
      <h3>{pedido.legal_name}</h3>
      <p>{pedido.buyer_email} · CNPJ {pedido.cnpj}</p>
      <p>{pedido.unit_count} conta(s) · {pedido.billing_period === "monthly" ? "mensal" : "anual à vista"} · {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(pedido.total_cents / 100)}</p>
      <p><strong>{estados[pedido.status] ?? "Estado indisponível"}</strong></p>
      {pedido.status === "payment_approved" && (falhaDocumentos ?
        <p className="form-warning">Não foi possível consultar contrato e nota agora.</p> : <>
          <p>Contrato: {contratos.find((documento) => documento.order_id === pedido.id)?.status === "signed"
            ? "assinatura registrada no WebApp" : "sem assinatura registrada no WebApp"}.</p>
          <p>Nota fiscal: {notas.find((documento) => documento.order_id === pedido.id)?.status === "authorized"
            ? "autorização registrada no WebApp" : "sem autorização registrada no WebApp"}.</p>
        </>)}
      {pedido.proof_reference && <p>Comprovante: {pedido.proof_reference}</p>}
      {pedido.status === "awaiting_payment" && <ComprovantePix orderId={pedido.id} />}
      {pedido.status === "proof_received" && <AprovarPix orderId={pedido.id} />}
    </section>)}
  </div>;
}
