"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarCompra } from "@/lib/contratacao/qualificacao";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { urlCheckoutHospedadoSandbox } from "@/lib/contratacao/url-checkout";
import { iniciarPagamento } from "./pagamento/actions";
import { iniciarCheckoutHospedado } from "./checkout-hospedado";

export type CompraState = { erro?: string };

/** Registra o pedido e abre o pagamento dentro da V2G. O checkout hospedado
 * permanece apenas para pedidos que já tinham um link emitido. */
export async function iniciarCompra(_anterior: CompraState, form: FormData): Promise<CompraState> {
  if (process.env.V2G_CHECKOUT_API_ENABLED !== "true")
    return iniciarCheckoutHospedado(form);
  if (!checkoutSandboxSeguroNesteServidor())
    return { erro: "O pagamento de teste exige um banco de QA separado. Nenhum pedido foi enviado." };
  const validacao = validarCompra(form);
  if (!validacao.dados) return { erro: validacao.erro };
  const dados = validacao.dados;
  const admin = createAdminClient();
  const { data: pedidoId, error: erroPedido } = await admin.rpc("registrar_pedido_self_service", {
    p_ref: dados.referencia, p_email: dados.email, p_buyer_name: dados.nome,
    p_whatsapp: dados.whatsapp, p_legal_name: dados.razaoSocial,
    p_cnpj: dados.cnpj, p_unit_count: dados.contas, p_billing_period: dados.periodo,
    p_payment_method: dados.metodo,
  });
  if (erroPedido || typeof pedidoId !== "string")
    return { erro: "Não foi possível registrar o pedido. Confira os dados ou procure a V2G." };

  const { data: pedido, error: erroLeitura } = await admin.from("commercial_orders")
    .select("id, status, provider_checkout_url, checkout_creation_started_at")
    .eq("id", pedidoId).single();
  if (erroLeitura || !pedido) return { erro: "Pedido registrado, mas não foi possível abrir o pagamento. Procure a V2G." };
  if (pedido.provider_checkout_url) {
    const link = urlCheckoutHospedadoSandbox(pedido.provider_checkout_url);
    if (!link) return { erro: "O link registrado é inválido. Procure a V2G." };
    redirect(link);
  }
  if (pedido.status !== "awaiting_payment" || pedido.checkout_creation_started_at)
    return { erro: "Este pedido já está em processamento. Procure a V2G antes de fazer outra tentativa." };
  if (dados.metodo === "asaas_pix") {
    const pagamento = new FormData();
    pagamento.set("ref", dados.referencia);
    return iniciarPagamento({}, pagamento);
  }
  redirect(`/contratar/pagamento?ref=${encodeURIComponent(dados.referencia)}`);
}
