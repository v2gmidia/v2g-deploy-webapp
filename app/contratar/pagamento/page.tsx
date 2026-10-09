import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Marca } from "@/components/ui/Marca";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { asaasSandbox, idAsaas } from "@/lib/contratacao/asaas-sandbox";
import { urlCheckoutHospedadoSandbox } from "@/lib/contratacao/url-checkout";
import { PagamentoFormulario } from "./PagamentoFormulario";
import { EstadoPagamento } from "./EstadoPagamento";
import { CopiarPix } from "./CopiarPix";
import "../contratar.css";

export const metadata = { title: "Pagamento | V2G", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = { searchParams: Promise<{ ref?: string }> };

export default async function PagamentoPage({ searchParams }: Params) {
  if (!checkoutSandboxSeguroNesteServidor() || process.env.V2G_CHECKOUT_API_ENABLED !== "true") notFound();
  const referencia = (await searchParams).ref ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(referencia)) notFound();
  const admin = createAdminClient();
  const { data: pedido, error } = await admin.from("commercial_orders")
    .select("id, status, origin, payment_method, billing_period, unit_count, total_cents, provider_checkout_id, provider_checkout_url, checkout_creation_started_at, provider_charge_id, provider_subscription_id, payment_creation_started_at")
    .eq("external_ref", referencia).maybeSingle();
  if (error || !pedido || pedido.origin !== "self_service") notFound();
  if (pedido.provider_checkout_id && pedido.provider_checkout_url && pedido.status === "awaiting_payment") {
    const link = urlCheckoutHospedadoSandbox(pedido.provider_checkout_url);
    if (link) redirect(link);
  }
  const estado = pedido.status === "payment_approved" || pedido.status === "cancelled"
    ? pedido.status : "awaiting_payment";
  const pixId = pedido.payment_method === "asaas_pix"
    ? idAsaas(pedido.provider_charge_id, "pay") : null;
  let pix: { imagem: string; codigo: string } | null = null;
  if (pixId && estado === "awaiting_payment") {
    const resposta = await asaasSandbox(`/payments/${pixId}/pixQrCode`);
    const dados = resposta.body && typeof resposta.body === "object"
      ? resposta.body as Record<string, unknown> : null;
    if (resposta.ok && typeof dados?.encodedImage === "string"
        && /^[A-Za-z0-9+/=]+$/.test(dados.encodedImage)
        && typeof dados.payload === "string" && dados.payload.length < 2000)
      pix = { imagem: dados.encodedImage, codigo: dados.payload };
  }
  const tentativaCriada = Boolean(pedido.provider_checkout_id || pedido.checkout_creation_started_at || pedido.payment_creation_started_at
    || pedido.provider_charge_id || pedido.provider_subscription_id);
  const metodo = pedido.payment_method === "asaas_pix" || pedido.payment_method === "asaas_card"
    ? pedido.payment_method : null;
  return <main className="contratar-shell">
    <header className="contratar-topo"><Marca href="/contratar" editorial /><Link href="/contratar">Voltar à contratação</Link></header>
    <div className="contratar-pagamento">
      <div className="contratar-pagamento-cabecalho">
        <h1>Pagamento</h1>
        <p>Pedido de teste de {pedido.unit_count} {pedido.unit_count === 1 ? "conta" : "contas"} de anúncios</p>
      </div>
      <div className="contratar-pagamento-layout">
        <section aria-label="Forma de pagamento" className="contratar-pagamento-principal">
          {(tentativaCriada || estado !== "awaiting_payment")
            && <EstadoPagamento referencia={referencia} inicial={estado} />}
          {estado === "payment_approved" && <p><Link href="/entrar?modo=cadastro">Criar meu acesso</Link></p>}
          {estado === "awaiting_payment" && pix && <div className="contratar-pix">
            <h2>Seu Pix está pronto</h2>
            <p>Leia o QR Code pelo aplicativo do banco ou copie o código abaixo. No Sandbox, use a simulação de pagamento do Asaas.</p>
            <img src={`data:image/png;base64,${pix.imagem}`} width="230" height="230" alt="QR Code Pix deste pedido" />
            <label>Código Pix<input readOnly value={pix.codigo} /></label>
            <CopiarPix codigo={pix.codigo} />
          </div>}
          {estado === "awaiting_payment" && tentativaCriada && !pix && <p className="form-warning">
            {pedido.payment_method === "asaas_pix"
              ? "Ainda não foi possível mostrar o código Pix. Atualize a página; se continuar assim, procure a V2G antes de tentar outra vez."
              : "Ainda não há confirmação de pagamento. Acompanhe esta página e procure a V2G antes de tentar outra vez."}
          </p>}
          {estado === "awaiting_payment" && !tentativaCriada && metodo
            && <PagamentoFormulario referencia={referencia} metodo={metodo} />}
        </section>
        <aside className="contratar-pagamento-resumo">
          <h2>Resumo do pedido</h2>
          <p>{pedido.billing_period === "monthly" ? "Mensal" : pedido.billing_period === "semiannual_upfront" ? "Semestral à vista" : "Anual à vista"}</p>
          <p>{pedido.unit_count} {pedido.unit_count === 1 ? "conta" : "contas"} de anúncios</p>
          <strong>R$ {(pedido.total_cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
          <p className="contratar-rodape">A verba dos anúncios é paga à parte. Acesso liberado somente após confirmação do pagamento.</p>
        </aside>
      </div>
    </div>
  </main>;
}
