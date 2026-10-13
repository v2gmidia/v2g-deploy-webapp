import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { ultimoDocumentoPorPedido, type DocumentoPorPedido } from "@/lib/contratacao/documentos";
import { filtrarCompras, selecionarPedidosDaFila, periodoDaCompra, situacaoDaCompra, situacaoDaNota, situacaoDoContrato,
  type FiltroDeCompras, type PedidoDaFila } from "@/lib/gestor/compras";
import styles from "./Compras.module.css";

export const metadata = { title: "Contratações | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Fila interna: inclui pedidos ainda sem negócio, ausentes da carteira /gestor. */
export default async function ComprasDoGestorPage({ searchParams }: {
  searchParams: Promise<{ q?: string; filtro?: string; negocio?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.app_metadata?.papel !== "operador") notFound();
  const parametros = await searchParams;
  const negocioId = typeof parametros.negocio === "string" ? parametros.negocio : null;
  if (negocioId && !UUID.test(negocioId)) notFound();

  try {
    const admin = createAdminClient();
    // As três colunas da tentativa por API existem no QA, mas ainda não no banco real.
    const colunasDaApi = process.env.V2G_CHECKOUT_API_ENABLED === "true" && checkoutSandboxSeguroNesteServidor()
      ? ", provider_charge_id, provider_subscription_id, payment_creation_started_at" : "";
    const colunas = `id, buyer_email, legal_name, cnpj, origin, payment_method, billing_period, unit_count, total_cents, status, business_id, buyer_profile_id, created_at${colunasDaApi}`;
    let consulta = admin.from("commercial_orders").select(colunas)
      .order("created_at", { ascending: false }).limit(200);
    if (negocioId) consulta = consulta.eq("business_id", negocioId);
    let consultaComprovantes = admin.from("commercial_orders").select(colunas)
      .eq("status", "proof_received").order("created_at", { ascending: false }).limit(200);
    if (negocioId) consultaComprovantes = consultaComprovantes.eq("business_id", negocioId);
    let consultaSemPerfil = admin.from("commercial_orders").select(colunas)
      .eq("status", "payment_approved").is("buyer_profile_id", null)
      .order("created_at", { ascending: false }).limit(200);
    if (negocioId) consultaSemPerfil = consultaSemPerfil.eq("business_id", negocioId);
    const consultaAmbigua = colunasDaApi ? (() => {
      let tentativa = admin.from("commercial_orders").select(colunas)
        .eq("status", "awaiting_payment").not("payment_creation_started_at", "is", null)
        .is("provider_charge_id", null).is("provider_subscription_id", null)
        .order("created_at", { ascending: false }).limit(200);
      if (negocioId) tentativa = tentativa.eq("business_id", negocioId);
      return tentativa;
    })() : null;
    const [resposta, comprovantes, semPerfil, ambiguos] = await Promise.all([
      consulta, consultaComprovantes, consultaSemPerfil,
      consultaAmbigua ?? Promise.resolve({ data: [], error: null }),
    ]);
    if (resposta.error || !resposta.data) throw resposta.error ?? new Error("pedidos indisponíveis");
    const atencaoIndisponivel = !!(comprovantes.error || semPerfil.error || ambiguos.error ||
      !comprovantes.data || !semPerfil.data || !ambiguos.data);
    const selecao = selecionarPedidosDaFila([
      resposta.data as unknown as PedidoDaFila[],
      comprovantes.data as unknown as PedidoDaFila[] ?? [],
      semPerfil.data as unknown as PedidoDaFila[] ?? [],
      ambiguos.data as unknown as PedidoDaFila[] ?? [],
    ]);
    // Mantém o recorte de 200 para as consultas de documentos, mas seleciona
    // pela prioridade operacional antes de cortar os pedidos recentes.
    const pedidos = selecao.pedidos;
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
    // Somente no checkout de Sandbox com schema novo. Eventos adversos nao
    // mudam acesso automaticamente: o operador precisa conciliar no Asaas.
    const tiposDeAtencao = ["PAYMENT_OVERDUE", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED",
      "PAYMENT_CREDIT_CARD_THREE_D_SECURE_CHALLENGE_FAILED",
      "PAYMENT_REFUND_IN_PROGRESS", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_REFUNDED",
      "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE",
      "PAYMENT_AWAITING_CHARGEBACK_REVERSAL"];
    const movimentos = colunasDaApi && ids.length ? await admin.from("commercial_payment_events")
      .select("order_id, provider_charge_id, event_type, due_date, received_at")
      .in("order_id", ids)
      .order("received_at", { ascending: false }).limit(1000)
      : { data: [], error: null };
    const movimentosIndisponiveis = !!(movimentos.error || !movimentos.data);
    const movimentoPorPedido = new Map<string, { event_type: string; provider_charge_id: string; due_date: string }>();
    const cobrancasVistas = new Set<string>();
    for (const movimento of movimentos.data ?? []) {
      const chave = `${movimento.order_id}:${movimento.provider_charge_id}`;
      if (cobrancasVistas.has(chave)) continue;
      cobrancasVistas.add(chave);
      if (tiposDeAtencao.includes(movimento.event_type) && !movimentoPorPedido.has(movimento.order_id))
        movimentoPorPedido.set(movimento.order_id, movimento);
    }
    const contratosParciais = (contratos.data?.length ?? 0) === 1000;
    const notasParciais = (notas.data?.length ?? 0) === 1000;
    const consultaParcial = selecao.parcial || resposta.data.length === 200 || (comprovantes.data?.length ?? 0) === 200 ||
      (semPerfil.data?.length ?? 0) === 200 || (ambiguos.data?.length ?? 0) === 200 ||
      contratosParciais || notasParciais || (movimentos.data?.length ?? 0) === 1000;
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
      {negocioId && <p>Mostrando apenas pedidos do negócio {negocioId}. <a href="/gestor/compras">Ver todas as contratações</a></p>}
      {consultaParcial && <p className="form-warning">Consulta parcial: há registros no limite de leitura. Confira a fonte antes de decidir.</p>}
      {atencaoIndisponivel && <p className="form-warning">A busca adicional por pedidos que precisam de atenção falhou. Os pedidos recentes ainda aparecem; confira a fonte antes de concluir que não há pendências antigas.</p>}
      {documentosIndisponiveis && <p className="form-warning">Não foi possível consultar contratos ou notas agora. Esses estados não serão inferidos.</p>}
      {movimentosIndisponiveis && <p className="form-warning">Não foi possível consultar as ocorrências financeiras. Confira o Asaas antes de concluir que não há estorno, atraso ou contestação.</p>}
      {movimentoPorPedido.size > 0 && <p className="form-warning">{movimentoPorPedido.size} pedido(s) com ocorrência financeira registrada nesta consulta. Confira a cobrança e a data no Asaas antes de decidir sobre acesso ou campanha.</p>}
      <form className={styles.filtros} action="/gestor/compras" method="get">
        {negocioId && <input type="hidden" name="negocio" value={negocioId} />}
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
      <p>{visiveis.length} de {pedidos.length} pedidos retornados nesta consulta. Comprovantes, tentativas ambíguas e compras aprovadas sem perfil aparecem primeiro.</p>
      {pedidos.length === 0 ? <p>Nenhum pedido registrado nesta consulta.</p>
        : visiveis.length === 0 ? <p>Nenhum pedido corresponde aos filtros.</p> : null}
      <div className={styles.lista}>{visiveis.map((pedido) => <section className={`auth-card ${styles.cartao}`} key={pedido.id}>
        <h2>{pedido.legal_name}</h2>
        <p>{pedido.buyer_email} · CNPJ {pedido.cnpj}</p>
        <p><strong>{situacaoDaCompra(pedido)}</strong> · {pedido.origin === "self_service" ? "Compra direta" : "Venda assistida"} · {pedido.payment_method === "asaas_card" ? "Cartão" : "Pix"}</p>
        <p>{pedido.unit_count} {pedido.unit_count === 1 ? "conta" : "contas"} · {periodoDaCompra(pedido.billing_period)} · {dinheiro.format(pedido.total_cents / 100)} · {data.format(new Date(pedido.created_at))}</p>
        <p>{pedido.business_id ? "Negócio vinculado" : "Negócio ainda não vinculado"} · {pedido.buyer_profile_id ? "Perfil vinculado ao pedido" : "Perfil ainda não vinculado"}</p>
        {!documentosIndisponiveis && <p>Contrato: {situacaoDoContrato(assinaturas.get(pedido.id), contratosParciais)} · NFS-e: {situacaoDaNota(fiscais.get(pedido.id), notasParciais)}</p>}
        {movimentoPorPedido.has(pedido.id) && <p className="form-warning">Ocorrência financeira: {movimentoPorPedido.get(pedido.id)?.event_type} · vencimento {movimentoPorPedido.get(pedido.id)?.due_date} · cobrança {movimentoPorPedido.get(pedido.id)?.provider_charge_id}. Confira no Asaas; o registro não cancela automaticamente o acesso.</p>}
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
