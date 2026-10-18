"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { valorDoPedidoCentavos } from "@/lib/contratacao/preco";

export type PedidoActionState = { erro?: string };

async function operador() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return !error && user?.app_metadata?.papel === "operador" ? user : null;
}

export async function criarPedidoPixAction(
  _anterior: PedidoActionState,
  formData: FormData,
): Promise<PedidoActionState> {
  const user = await operador();
  if (!user) return { erro: "Acesso não autorizado." };

  const ref = String(formData.get("ref") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const legalName = String(formData.get("legalName") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").replace(/\D/g, "");
  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  const vinculoLeadAtivo = process.env.V2G_LEAD_ORDER_LINK_ENABLED === "true";
  const sourceLeadId = Number(formData.get("sourceLeadId"));
  const unitCount = Number(formData.get("unitCount"));
  const billingPeriod = String(formData.get("billingPeriod") ?? "");
  if (formData.get("declaresCnpj") !== "yes" || formData.get("sellsByWhatsApp") !== "yes") {
    return { erro: "Confirme as declarações de CNPJ e venda por WhatsApp antes de registrar." };
  }
  if (!/^[0-9a-f-]{36}$/.test(ref) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || legalName.length < 2 || cnpj.length !== 14) {
    return { erro: "Confira e-mail, razão social e CNPJ." };
  }
  if (billingPeriod !== "monthly" && billingPeriod !== "annual_upfront") {
    return { erro: "Escolha o período de cobrança." };
  }
  if (vinculoLeadAtivo && (formData.get("vinculoLead") !== "v2g_site"
      || !Number.isSafeInteger(sourceLeadId) || sourceLeadId <= 0
      || !/^[1-9][0-9]{9,10}$/.test(whatsapp))) {
    return { erro: "Informe o ID e o WhatsApp exatos do pré-cadastro da LP." };
  }
  try {
    valorDoPedidoCentavos(unitCount, billingPeriod);
  } catch {
    return { erro: "Informe uma quantidade válida de contas de anúncio." };
  }

  try {
    const admin = createAdminClient();
    const { error } = vinculoLeadAtivo
      ? await admin.rpc("registrar_pedido_pix_assistido_com_lead", {
        p_ref: ref, p_source_lead_id: sourceLeadId, p_email: email,
        p_whatsapp: whatsapp, p_legal_name: legalName, p_cnpj: cnpj,
        p_unit_count: unitCount, p_billing_period: billingPeriod,
        p_operator_id: user.id,
      })
      : await admin.rpc("registrar_pedido_pix_assistido", {
        p_ref: ref, p_email: email, p_legal_name: legalName,
        p_cnpj: cnpj, p_unit_count: unitCount, p_billing_period: billingPeriod,
      });
    if (error) throw error;
  } catch (error) {
    console.error("[pedidos] falha ao criar pedido ::", error);
    return { erro: vinculoLeadAtivo
      ? "Não foi possível registrar. Confira se ID, CNPJ, e-mail e WhatsApp são exatamente os mesmos do pré-cadastro e se o lead já virou pedido."
      : "Não foi possível registrar. Confira se já há pedido Pix pendente para este e-mail e CNPJ." };
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
    const { error } = await admin.rpc("registrar_comprovante_pix", {
      p_order_id: orderId, p_reference: reference, p_operator_id: user.id,
    });
    if (error) throw error;
  } catch (error) {
    console.error("[pedidos] falha ao registrar comprovante ::", error);
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

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("aprovar_pix_assistido", {
      p_order_id: orderId, p_operator_id: user.id,
    });
    if (error) throw error;
  } catch (error) {
    console.error("[pedidos] falha ao aprovar Pix ::", error);
    return { erro: "Não foi possível aprovar. Confira o comprovante e o estado do pedido." };
  }
  revalidatePath("/pedidos");
  redirect("/pedidos?registro=aprovado");
}
