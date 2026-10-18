"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validarCompra } from "@/lib/contratacao/qualificacao";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { urlCheckoutHospedadoSandbox } from "@/lib/contratacao/url-checkout";
import { iniciarPagamento } from "./pagamento/actions";
import { iniciarCheckoutHospedado } from "./checkout-hospedado";
import { hashDeSeguranca, ipConfiavelDaVercel, segurancaCheckoutAtiva,
  verificarTurnstile } from "@/lib/seguranca/checkout";

export type CompraState = { erro?: string };

/** Registra o pedido e abre o pagamento dentro da V2G. O checkout hospedado
 * permanece apenas para pedidos que já tinham um link emitido. */
export async function iniciarCompra(_anterior: CompraState, form: FormData): Promise<CompraState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const emailPedido = String(form.get("email") ?? "").trim().toLowerCase();
  if (user?.email && user.email.trim().toLowerCase() !== emailPedido)
    return { erro: "Use o e-mail deste acesso para adicionar outro CNPJ. Para usar outro e-mail, saia e entre novamente." };
  const validacao = validarCompra(form);
  if (!validacao.dados) return { erro: validacao.erro };
  const dados = validacao.dados;
  const admin = createAdminClient();
  let segurancaJaVerificada = false;
  if (segurancaCheckoutAtiva()) {
    const ip = ipConfiavelDaVercel(await headers());
    const token = String(form.get("cf-turnstile-response") ?? "");
    const ipHash = ip ? hashDeSeguranca(ip) : null;
    const contatoHash = hashDeSeguranca(dados.email);
    if (!ip || !ipHash || !contatoHash || !await verificarTurnstile(token, ip))
      return { erro: "Não foi possível confirmar a verificação de segurança. Atualize a página e tente novamente." };
    const { data: permitido, error: erroLimite } = await admin.rpc("consumir_limite_checkout", {
      p_scope: "order", p_ip_hash: ipHash, p_contact_hash: contatoHash,
    });
    if (erroLimite || permitido !== true)
      return { erro: "Recebemos várias tentativas recentes. Aguarde uma hora ou procure a V2G." };
    segurancaJaVerificada = true;
  }
  if (process.env.V2G_CHECKOUT_API_ENABLED !== "true")
    return iniciarCheckoutHospedado(form);
  if (!checkoutSandboxSeguroNesteServidor())
    return { erro: "O pagamento de teste exige um banco de QA separado. Nenhum pedido foi enviado." };
  const { data: pedidoId, error: erroPedido } = await admin.rpc("registrar_pedido_self_service", {
    p_ref: dados.referencia, p_email: dados.email, p_buyer_name: dados.nome,
    p_whatsapp: dados.whatsapp, p_legal_name: dados.razaoSocial,
    p_cnpj: dados.cnpj, p_unit_count: dados.contas, p_billing_period: dados.periodo,
    p_payment_method: dados.metodo,
  });
  if (erroPedido || typeof pedidoId !== "string")
    return { erro: "Não foi possível registrar o pedido. Confira os dados ou procure a V2G." };

  // A referência é aleatória e não contém dados pessoais. Mantê-la no navegador
  // permite retomar o mesmo pedido após atualização ou falha na próxima leitura,
  // sem criar outra cobrança para o mesmo comprador.
  (await cookies()).set("v2g_checkout_ref", dados.referencia, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/contratar", maxAge: 60 * 60 * 24,
  });

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
    return iniciarPagamento({}, pagamento, segurancaJaVerificada);
  }
  redirect(`/contratar/pagamento?ref=${encodeURIComponent(dados.referencia)}`);
}
