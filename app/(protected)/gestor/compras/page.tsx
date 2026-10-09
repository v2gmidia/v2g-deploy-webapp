import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { ultimoDocumentoPorPedido, type DocumentoPorPedido } from "@/lib/contratacao/documentos";
import { filtrarCompras, periodoDaCompra, situacaoDaCompra,
  type FiltroDeCompras, type PedidoDaFila } from "@/lib/gestor/compras";
import styles from "./Compras.module.css";

export const metadata = { title: "Contratações | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Fila interna: inclui pedidos ainda sem negócio, ausentes da carteira /gestor. */
export default async function ComprasDoGestorPage({ searchParams }: {
  searchParams: Promise<{ q?: string; filtro?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();

  try {
    const admin = createAdminClient();
    // As três colunas da tentativa por API existem no QA, mas ainda não no banco real.
    const colunasDaApi = process.env.V2G_CHECKOUT_API_ENABLED === "true" && checkoutSandboxSeguroNesteServidor()
      ? ", provider_charge_id, provider_subscription_id, payment_creation_started_at" : "";
    const resposta = await admin.from("commercial_orders")
      .select(`id, buyer_email, legal_name, cnpj, origin, payment_method, billing_period, unit_count, total_cents, status, business_id, buyer_profile_id, created_at${colunasDaApi}`)
      .order("created_at", { ascending: false }).limit(200);
    if (resposta.error || !resposta.data) throw resposta.error ?? new Error("pedidos indisponíveis");
    const pedidos = resposta.data as unknown as PedidoDaFila[];
    const ids = pedidos.map((pedido) => pedido.id);
    const [contratos, notas] = ids.length ? await Promise.all([
      admin.from("contract_documents").select("order_id, status, created_at")
        .in("order_id", ids).order("created_at", { ascending: false }).limit(1000),
      admin.from("fiscal_documents").select("order_id, status, created_at")
        .in("order_id", ids).order("created_at", { ascending: false }).limit(1000),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    const documentosIndisponiveis = !!(contratos.error || notas.error || !contratos.data || !notas.data);
    const assinaturas = documentosIndisponiveis ? new Map<string, string>()
      : ultimoDocumentoPorPedido(contratos.data as DocumentoPorPedido[]);
    const fiscais = documentosIndisponiveis ? new Map<string, string>()
      : ultimoDocumentoPorPedido(notas.data as DocumentoPorPedido[]);
    const consultaParcial = pedidos.length === 200 || (contratos.data?.length ?? 0) === 1000 || (notas.data?.length ?? 0) === 1000;
    const parametros = await searchParams;
    const busca = typeof parametros.q === "string" ? parametros.q.slice(0, 120) : "";
    const filtro: FiltroDeCompras = ["atencao", "pagamento", "aprovadas", "canceladas"].includes(parametros.filtro ?? "")
      ? parametros.filtro as FiltroDeCompras : "todas";
    const visiveis = filtrarCompras(pedidos, busca, filtro);
    const dinheiro = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const data = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

    return <div className="canvas">
      <div className="page-head"><p>OPERAÇÃO · USO INTERNO</p><h1>Contratações</h1>
        <p>Pedidos assistidos e diretos, inclusive os que ainda não criaram um negócio no WebApp.</p></div>
      <p><a href="/gestor">Voltar à carteira</a> · <a href="/pedidos">Conferir Pix assistido</a></p>
      {consultaParcial && <p className="form-warning">Consulta parcial: há registros no limite de leitura. Confira a fonte antes de decidir.</p>}
      {documentosIndisponiveis && <p className="form-warning">Não foi possível consultar contratos ou notas agora. Esses estados não serão inferidos.</p>}
      <form className={styles.filtros} action="/gestor/compras" method="get">
        <label>Buscar pedido <input type="search" name="q" defaultValue={busca} placeholder="Empresa, e-mail, CNPJ ou pedido" /></label>
        <label>Mostrar <select name="filtro" defaultValue={filtro}>
          <option value="todas">Todas as contratações</option>
          <option value="atencao">Precisam de atenção</option>
          <option value="pagamento">Pagamento pendente</option>
          <option value="aprovadas">Pedidos aprovados</option>
          <option value="canceladas">Cancelados</option>
        </select></label>
        <button type="submit">Filtrar</button>
      </form>
      <p>{visiveis.length} de {pedidos.length} pedidos retornados nesta consulta. Comprovantes e tentativas ambíguas aparecem primeiro.</p>
      {pedidos.length === 0 ? <p>Nenhum pedido registrado nesta consulta.</p>
        : visiveis.length === 0 ? <p>Nenhum pedido corresponde aos filtros.</p> : null}
      <div className={styles.lista}>{visiveis.map((pedido) => <section className={`auth-card ${styles.cartao}`} key={pedido.id}>
        <h2>{pedido.legal_name}</h2>
        <p>{pedido.buyer_email} · CNPJ {pedido.cnpj}</p>
        <p><strong>{situacaoDaCompra(pedido)}</strong> · {pedido.origin === "self_service" ? "Compra direta" : "Venda assistida"} · {pedido.payment_method === "asaas_card" ? "Cartão" : "Pix"}</p>
        <p>{pedido.unit_count} {pedido.unit_count === 1 ? "conta" : "contas"} · {periodoDaCompra(pedido.billing_period)} · {dinheiro.format(pedido.total_cents / 100)} · {data.format(new Date(pedido.created_at))}</p>
        <p>{pedido.business_id ? "Negócio vinculado" : "Negócio ainda não vinculado"} · {pedido.buyer_profile_id ? "Perfil vinculado ao pedido" : "Perfil ainda não vinculado"}</p>
        {!documentosIndisponiveis && <p>Contrato: {assinaturas.get(pedido.id) === "signed" ? "assinatura registrada" : assinaturas.has(pedido.id) ? `estado ${assinaturas.get(pedido.id)}` : "nenhum documento registrado"} · NFS-e: {fiscais.get(pedido.id) === "authorized" ? "autorização registrada" : fiscais.has(pedido.id) ? `estado ${fiscais.get(pedido.id)}` : "sem emissão registrada"}</p>}
        {pedido.business_id && <p><a href={`/revisar-perfil?negocio=${encodeURIComponent(pedido.business_id)}#ficha-${encodeURIComponent(pedido.business_id)}`}>Abrir ficha do negócio</a></p>}
        <small>Pedido {pedido.id}</small>
      </section>)}</div>
      <p className="foot-line">A tela lê estados registrados no Supabase; não consulta saldo bancário, assinatura eletrônica nem autorização fiscal ao vivo. Uma cobrança criada não comprova pagamento. A primeira campanha continua sob publicação manual do gestor.</p>
    </div>;
  } catch (error) {
    console.error("[gestor/compras] consulta falhou ::", error instanceof Error ? error.message : "erro desconhecido");
    return <div className="canvas"><div className="page-head"><h1>Contratações indisponíveis</h1></div>
      <p className="form-error" role="alert">Não foi possível carregar os pedidos agora. Recarregue para tentar novamente.</p></div>;
  }
}
