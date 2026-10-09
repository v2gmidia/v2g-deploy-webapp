"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarCompra } from "@/lib/contratacao/qualificacao";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";
import { urlCheckoutHospedadoSandbox } from "@/lib/contratacao/url-checkout";
import type { CompraState } from "./actions";

function urlDeRetorno(pedidoId: string): string | null {
  const base = process.env.V2G_CHECKOUT_RETURN_BASE_URL;
  if (!base) return null;
  try {
    const url = new URL("/contratar/retorno", base);
    if (url.protocol !== "https:") return null;
    url.searchParams.set("pedido", pedidoId);
    return url.toString();
  } catch { return null; }
}

/** Caminho legado apenas para preservar testes e pedidos hospedados existentes. */
export async function iniciarCheckoutHospedado(form: FormData): Promise<CompraState> {
  if (!checkoutSandboxSeguroNesteServidor())
    return { erro: "O checkout de teste exige um banco de QA separado. Nenhum pedido foi enviado." };
  const validacao = validarCompra(form);
  if (!validacao.dados) return { erro: validacao.erro };
  const dados = validacao.dados;
  const chave = process.env.ASAAS_API_KEY;
  if (!chave) return { erro: "O checkout de teste ainda não está configurado." };
  if (!urlDeRetorno(dados.referencia))
    return { erro: "O checkout de teste precisa de um endereço HTTPS de QA para o retorno." };

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
  if (erroLeitura || !pedido) return { erro: "Pedido registrado, mas não foi possível abrir o checkout. Procure a V2G." };
  if (pedido.provider_checkout_url) {
    const existente = urlCheckoutHospedadoSandbox(pedido.provider_checkout_url);
    if (!existente) return { erro: "O link registrado é inválido. Procure a V2G." };
    redirect(existente);
  }
  if (pedido.status !== "awaiting_payment" || pedido.checkout_creation_started_at)
    return { erro: "Este pedido já está em processamento. Procure a V2G antes de tentar novamente." };
  const { data: reservado, error: erroReserva } = await admin.from("commercial_orders")
    .update({ checkout_creation_started_at: new Date().toISOString() })
    .eq("id", pedidoId).eq("status", "awaiting_payment")
    .is("checkout_creation_started_at", null).select("id").maybeSingle();
  if (erroReserva || !reservado)
    return { erro: "Este pedido já está em processamento. Aguarde antes de tentar novamente." };
  const retorno = urlDeRetorno(pedidoId);
  if (!retorno) return { erro: "Pedido registrado, mas falta configurar o retorno do checkout de teste." };
  const url = new URL(retorno);
  const callback = {
    successUrl: url.toString(),
    cancelUrl: new URL("/contratar?retorno=cancelado", url.origin).toString(),
    expiredUrl: new URL("/contratar?retorno=expirado", url.origin).toString(),
  };
  const payload = {
    billingTypes: [dados.metodo === "asaas_pix" ? "PIX" : "CREDIT_CARD"],
    chargeTypes: [dados.periodo === "monthly" ? "RECURRENT" : "DETACHED"],
    minutesToExpire: 60, externalReference: pedidoId, callback,
    items: [{ name: "Gestão de anúncios V2G", quantity: dados.contas,
      value: dados.totalCentavos / dados.contas / 100 }],
    ...(dados.periodo === "monthly" ? { subscription: {
      cycle: "MONTHLY", nextDueDate: new Date().toISOString().slice(0, 10),
    } } : {}),
  };
  let checkoutId: string | null = null;
  let checkoutUrl: string | null = null;
  try {
    const resposta = await fetch("https://api-sandbox.asaas.com/v3/checkouts", {
      method: "POST", headers: { "Content-Type": "application/json", access_token: chave },
      body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    if (!resposta.ok) return { erro: "O provedor recusou o checkout de teste. O pedido ficou pendente para revisão." };
    const corpo: unknown = await resposta.json();
    if (corpo && typeof corpo === "object" && "id" in corpo && typeof corpo.id === "string"
        && /^[0-9a-f-]{36}$/i.test(corpo.id) && "link" in corpo && typeof corpo.link === "string") {
      const link = urlCheckoutHospedadoSandbox(corpo.link);
      if (link) { checkoutId = corpo.id; checkoutUrl = link; }
    }
  } catch {
    return { erro: "Não foi possível conectar ao checkout de teste. O pedido ficou pendente para revisão." };
  }
  if (!checkoutId || !checkoutUrl) return { erro: "O checkout respondeu sem identificação válida. O pedido ficou pendente para revisão." };
  const { data: salvo, error: erroSalvar } = await admin.from("commercial_orders")
    .update({ provider_checkout_id: checkoutId, provider_checkout_url: checkoutUrl })
    .eq("id", pedidoId).eq("status", "awaiting_payment")
    .is("provider_checkout_id", null).select("id").maybeSingle();
  if (erroSalvar || !salvo) return { erro: "Checkout criado, mas o vínculo com o pedido falhou. Procure a V2G antes de pagar." };
  redirect(checkoutUrl);
}
