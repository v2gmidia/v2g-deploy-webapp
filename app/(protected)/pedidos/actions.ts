"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarConferenciaPix, validarPedidoAssistido, validarPedidoAsaasAssistido } from "@/lib/contratacao/pedido-assistido";
import { checkoutSandboxSeguroNesteServidor } from "@/lib/contratacao/ambiente-checkout";

export type PedidoActionState = { erro?: string };

async function operador() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && user?.app_metadata?.papel === "operador" ? user : null;
}

/** Apenas registra; cartao/token ficam com o comprador no checkout existente. */
export async function criarPedidoAsaasAction(_anterior: PedidoActionState, formData: FormData): Promise<PedidoActionState> {
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  if (process.env.V2G_ASSISTED_ASAAS_ENABLED !== "true" || process.env.V2G_CHECKOUT_API_ENABLED !== "true" || !checkoutSandboxSeguroNesteServidor())
    return { erro: "O pedido assistido pelo Asaas está indisponível neste ambiente." };
  const validacao = validarPedidoAsaasAssistido(formData, process.env.V2G_LEAD_ORDER_LINK_ENABLED === "true");
  if (!validacao.dados) return { erro: validacao.erro };
  const d = validacao.dados;
  try {
    const admin = createAdminClient();
    const r = await admin.rpc("registrar_pedido_asaas_assistido", {
      p_ref: d.ref, p_source_lead_id: d.lead?.id ?? null, p_email: d.email,
      p_whatsapp: d.whatsapp, p_buyer_name: d.buyerName, p_legal_name: d.legalName,
      p_cnpj: d.cnpj, p_unit_count: d.unitCount, p_billing_period: d.billingPeriod,
      p_payment_method: d.paymentMethod, p_operator_id: user.id,
    });
    if (r.error || typeof r.data !== "string") throw Error("pedido_pendente");
  } catch {
    return { erro: "Não foi possível registrar. Confira os dados exatos, a origem e se já existe pedido para este lead ou comprador. Não crie outra venda para contornar a pendência." };
  }
  revalidatePath("/pedidos");
  redirect("/pedidos?registro=asaas");
}

export async function criarPedidoPixAction(
  _anterior: PedidoActionState,
  formData: FormData,
): Promise<PedidoActionState> {
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };

  const vinculoLeadAtivo = process.env.V2G_LEAD_ORDER_LINK_ENABLED === "true";
  const validacao = validarPedidoAssistido(formData, vinculoLeadAtivo);
  if (!validacao.dados) return { erro: validacao.erro };
  const { ref, email, legalName, cnpj, unitCount, billingPeriod, lead } = validacao.dados;

  try {
    const admin = createAdminClient();
    const { data, error } = lead
      ? await admin.rpc("registrar_pedido_pix_assistido_com_lead", {
        p_ref: ref, p_source_lead_id: lead.id, p_email: email,
        p_whatsapp: lead.whatsapp, p_legal_name: legalName, p_cnpj: cnpj,
        p_unit_count: unitCount, p_billing_period: billingPeriod,
        p_operator_id: user.id,
      })
      : await admin.rpc("registrar_pedido_pix_assistido", {
        p_ref: ref, p_email: email, p_legal_name: legalName,
        p_cnpj: cnpj, p_unit_count: unitCount, p_billing_period: billingPeriod,
      });
    if (error || typeof data !== "string" || !data) throw new Error("pedido nao confirmado");
  } catch {
    console.error("[pedidos] falha ao criar pedido");
    return { erro: lead
      ? "Não foi possível registrar. Confira se ID, CPF ou CNPJ do contratante, e-mail e WhatsApp são exatamente os mesmos do pré-cadastro e se o lead já virou pedido."
      : "Não foi possível registrar. Confira os dados e a referência do pedido antes de tentar novamente." };
  }
  revalidatePath("/pedidos");
  redirect("/pedidos?registro=criado");
}

export async function registrarComprovantePixAction(
  _anterior: PedidoActionState,
  formData: FormData,
): Promise<PedidoActionState> {
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  const orderId = String(formData.get("orderId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/.test(orderId) || reference.length < 3 || reference.length > 300) {
    return { erro: "Informe uma referência do comprovante recebido." };
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("registrar_comprovante_pix", {
      p_order_id: orderId, p_reference: reference, p_operator_id: user.id,
    });
    if (error || data !== true) throw new Error("comprovante nao confirmado");
  } catch {
    console.error("[pedidos] falha ao registrar comprovante");
    return { erro: "Não foi possível registrar o comprovante. Recarregue e confira o estado do pedido." };
  }
  revalidatePath("/pedidos");
  redirect("/pedidos?registro=comprovante");
}

export async function aprovarPixAssistidoAction(
  _anterior: PedidoActionState,
  formData: FormData,
): Promise<PedidoActionState> {
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };
  const orderId = String(formData.get("orderId") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(orderId)) return { erro: "Pedido inválido." };
  const erroConferencia = validarConferenciaPix(formData);
  if (erroConferencia) return { erro: erroConferencia };

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("aprovar_pix_assistido", {
      p_order_id: orderId, p_operator_id: user.id,
    });
    if (error || data !== true) throw new Error("aprovacao nao confirmada");
  } catch {
    console.error("[pedidos] falha ao aprovar Pix");
    return { erro: "Não foi possível aprovar. Confira o comprovante e o estado do pedido." };
  }
  revalidatePath("/pedidos");
  redirect("/pedidos?registro=aprovado");
}
